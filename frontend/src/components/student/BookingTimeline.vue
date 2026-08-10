<template>
  <div class="booking-timeline">
    <h3 class="timeline-title">Tiến Trình Phiếu Mượn</h3>

    <ol class="timeline-list">
      <li class="timeline-step is-completed">
        <div class="step-icon">1</div>
        <div class="step-content">
          <span class="step-name">Gửi yêu cầu đăng ký</span>
          <span class="step-time">{{ formatDateTimeVN(booking?.createdAt) }}</span>
        </div>
      </li>

      <li v-if="booking?.status === 'rejected'" class="timeline-step is-rejected">
        <div class="step-icon">✕</div>
        <div class="step-content">
          <span class="step-name">Bị từ chối</span>
          <span class="step-time">{{ formatDateTimeVN(booking?.updatedAt) }}</span>
          <p v-if="booking?.rejectionReason" class="step-reason">Lý do: {{ booking.rejectionReason }}</p>
        </div>
      </li>

      <li v-else-if="booking?.status === 'cancelled'" class="timeline-step is-cancelled">
        <div class="step-icon">✕</div>
        <div class="step-content">
          <span class="step-name">Đã hủy yêu cầu</span>
          <span class="step-time">{{ formatDateTimeVN(booking?.cancelledAt || booking?.updatedAt) }}</span>
        </div>
      </li>

      <template v-else>
        <li :class="['timeline-step', { 'is-completed': ['approved', 'in_use', 'completed'].includes(booking?.status) }]">
          <div class="step-icon">2</div>
          <div class="step-content">
            <span class="step-name">Nhân viên phê duyệt</span>
            <span v-if="booking?.approvedAt" class="step-time">{{ formatDateTimeVN(booking.approvedAt) }}</span>
            <span v-else class="step-pending-text">Đang chờ xét duyệt</span>
          </div>
        </li>

        <li :class="['timeline-step', { 'is-completed': ['in_use', 'completed'].includes(booking?.status) }]">
          <div class="step-icon">3</div>
          <div class="step-content">
            <span class="step-name">Xác nhận nhận phòng (Check-in)</span>
            <span v-if="booking?.checkedInAt" class="step-time">{{ formatDateTimeVN(booking.checkedInAt) }}</span>
            <span v-else class="step-pending-text">Chưa nhận phòng</span>
          </div>
        </li>

        <li :class="['timeline-step', { 'is-completed': booking?.status === 'completed' }]">
          <div class="step-icon">4</div>
          <div class="step-content">
            <span class="step-name">Hoàn thành & Trả phòng</span>
            <span v-if="booking?.completedAt" class="step-time">{{ formatDateTimeVN(booking.completedAt) }}</span>
            <span v-else class="step-pending-text">Chưa hoàn thành</span>
          </div>
        </li>
      </template>
    </ol>
  </div>
</template>

<script setup>
import { formatDateTimeVN } from '@/utils/date';

defineProps({
  booking: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.booking-timeline {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

}

.timeline-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding-left: 8px;
  list-style: none;
}

.timeline-list::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 23px;
  width: 2px;
  background-color: var(--color-border);
  z-index: 0;
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-surface-elevated);
  border: 2px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-step.is-completed .step-icon {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: #ffffff;
}

.timeline-step.is-rejected .step-icon,
.timeline-step.is-cancelled .step-icon {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: #ffffff;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
}

.step-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.step-time {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.step-pending-text {
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

.step-reason {
  font-size: 13px;
  color: var(--color-danger-text);
  margin-top: 4px;
}
</style>
