<template>
  <div class="admin-booking-detail-view">
    <div class="breadcrumb-bar">
      <router-link to="/admin/bookings" class="breadcrumb-link">← Quay lại danh sách phiếu mượn</router-link>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải thông tin chi tiết phiếu mượn..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không tìm thấy phiếu mượn" :description="error">
        <template #action>
          <router-link to="/admin/bookings">
            <AppButton variant="primary">Trở về danh sách</AppButton>
          </router-link>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="booking" class="detail-content">
      <div class="header-card">
        <div class="header-top">
          <div class="code-group">
            <h1 class="page-title">Phiếu mượn #{{ (booking._id || '').slice(-6).toUpperCase() }}</h1>
            <span class="created-meta">Tạo lúc {{ formatDateTimeVN(booking.createdAt) }}</span>
          </div>
          <StatusBadge :status="booking.status" />
        </div>
      </div>

      <BookingStatusActions
        :booking="booking"
        @action-success="handleActionSuccess"
      />

      <div class="detail-grid">
        <div class="main-info-column">
          <div class="info-card">
            <h3 class="card-title">1. Thông tin Sinh viên Đăng ký</h3>
            <div class="info-list">
              <div class="info-row">
                <span class="label">Họ và tên:</span>
                <span class="value font-bold">{{ booking.student?.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Mã số sinh viên (MSSV):</span>
                <span class="value font-mono">{{ booking.student?.studentCode }}</span>
              </div>
              <div class="info-row">
                <span class="label">Email liên hệ:</span>
                <span class="value">{{ booking.student?.email || 'Chưa cập nhật' }}</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">2. Thông tin Phòng học & Thời gian</h3>
            <div class="info-list">
              <div class="info-row">
                <span class="label">Phòng học:</span>
                <span class="value font-bold">{{ booking.room?.name }} ({{ booking.room?.roomCode }})</span>
              </div>
              <div class="info-row">
                <span class="label">Vị trí:</span>
                <span class="value">{{ booking.room?.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ngày mượn:</span>
                <span class="value font-bold highlight">{{ formatDateVN(booking.startTime) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Khung giờ:</span>
                <span class="value font-bold highlight">{{ formatTimeVN(booking.startTime) }} - {{ formatTimeVN(booking.endTime) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Số người sử dụng:</span>
                <span class="value">{{ booking.numberOfPeople }} người (Tối đa {{ booking.room?.capacity }})</span>
              </div>
              <div class="info-row">
                <span class="label">Mục đích mượn:</span>
                <span class="value">{{ booking.purpose }}</span>
              </div>
              <div v-if="booking.studentNote" class="info-row">
                <span class="label">Ghi chú của sinh viên:</span>
                <span class="value">{{ booking.studentNote }}</span>
              </div>
              <div v-if="booking.staffNote" class="info-row">
                <span class="label">Ghi chú của nhân viên:</span>
                <span class="value staff-note-text">{{ booking.staffNote }}</span>
              </div>
            </div>
          </div>

          <div v-if="booking.status === 'rejected' && booking.rejectionReason" class="rejection-card">
            <h3 class="rejection-title">⚠️ Lý do từ chối:</h3>
            <p class="rejection-text">{{ booking.rejectionReason }}</p>
          </div>

          <div class="info-card">
            <h3 class="card-title">3. Danh sách Thiết bị mượn kèm</h3>
            <div v-if="!booking.equipmentItems || booking.equipmentItems.length === 0" class="empty-equipment">
              <p>Sinh viên không đăng ký mượn thiết bị đi kèm.</p>
            </div>
            <div v-else class="equipment-table">
              <div v-for="item in booking.equipmentItems" :key="item.equipmentId" class="equipment-row">
                <span class="eq-name">{{ item.equipment?.name || 'Thiết bị' }} ({{ item.equipment?.equipmentCode }})</span>
                <div class="eq-qty-group">
                  <span class="eq-qty">Số lượng mượn: <strong>{{ item.quantity }}</strong></span>
                  <span v-if="booking.status === 'completed' && item.damagedQuantity > 0" class="eq-damaged">
                    ⚠️ Ghi nhận hỏng: {{ item.damagedQuantity }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-column">
          <BookingTimeline :booking="booking" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { adminBookingService } from '@/services/adminBooking';
import { formatDateVN, formatTimeVN, formatDateTimeVN } from '@/utils/date';

import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';
import BookingTimeline from '@/components/student/BookingTimeline.vue';
import BookingStatusActions from '@/components/admin/BookingStatusActions.vue';

const route = useRoute();
const bookingId = route.params.id;

const loading = ref(false);
const error = ref('');
const booking = ref(null);

async function fetchBookingDetail() {
  loading.value = true;
  error.value = '';
  try {
    const res = await adminBookingService.getBookingById(bookingId);
    if (res && res.data) {
      booking.value = res.data;
    } else {
      error.value = 'Không tìm thấy chi tiết phiếu mượn';
    }
  } catch (err) {
    error.value = err.message || 'Không thể tải phiếu mượn';
  } finally {
    loading.value = false;
  }
}

function handleActionSuccess(updatedData) {
  if (updatedData) {
    booking.value = updatedData;
  } else {
    fetchBookingDetail();
  }
}

onMounted(() => {
  fetchBookingDetail();
});
</script>

<style scoped>
.admin-booking-detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.breadcrumb-bar {
  margin-bottom: 4px;
}

.breadcrumb-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.code-group {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.created-meta {
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

.main-info-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.label {
  color: var(--color-text-secondary);
}

.value {
  color: var(--color-text-primary);
  text-align: right;
}

.value.font-bold {
  font-weight: 700;
}

.value.highlight {
  color: var(--color-brand);
}

.staff-note-text {
  color: var(--color-info-text);
  font-style: italic;
}

.rejection-card {
  padding: 16px;
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
}

.rejection-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-danger-text);
  margin-bottom: 4px;
}

.rejection-text {
  font-size: 14px;
  color: var(--color-danger-text);
}

.empty-equipment {
  font-size: 13px;
  color: var(--color-text-muted);
}

.equipment-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.eq-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.eq-qty-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eq-damaged {
  color: var(--color-danger-text);
  font-weight: 700;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.font-mono {
  font-family: var(--font-mono);
}

.loading-wrapper, .error-wrapper {
  padding: 48px 0;
}

@media (max-width: 992px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
