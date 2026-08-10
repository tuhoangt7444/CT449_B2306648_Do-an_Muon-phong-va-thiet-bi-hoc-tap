<template>
  <div class="booking-detail-view">
    <div class="breadcrumb-bar">
      <router-link to="/my-bookings" class="breadcrumb-link">← Quay lại danh sách phiếu mượn</router-link>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải chi tiết phiếu mượn..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không tìm thấy phiếu mượn" :description="error">
        <template #action>
          <router-link to="/my-bookings">
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

        <div v-if="canCancel" class="cancel-action-bar">
          <AppButton variant="danger" size="sm" @click="showCancelModal = true">
            Hủy yêu cầu mượn này
          </AppButton>
        </div>
      </div>

      <div class="detail-grid">
        <div class="main-info-column">
          <div class="info-card">
            <h3 class="card-title">1. Thông tin Phòng học</h3>
            <div class="info-list">
              <div class="info-row">
                <span class="label">Phòng mượn:</span>
                <span class="value font-bold">{{ booking.room?.name }} ({{ booking.room?.roomCode }})</span>
              </div>
              <div class="info-row">
                <span class="label">Vị trí:</span>
                <span class="value">{{ booking.room?.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">Sức chứa phòng:</span>
                <span class="value">{{ booking.room?.capacity }} người</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">2. Thời gian & Nhu cầu</h3>
            <div class="info-list">
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
                <span class="value">{{ booking.numberOfPeople }} người</span>
              </div>
              <div class="info-row">
                <span class="label">Mục đích mượn:</span>
                <span class="value">{{ booking.purpose }}</span>
              </div>
              <div v-if="booking.studentNote" class="info-row">
                <span class="label">Ghi chú của bạn:</span>
                <span class="value">{{ booking.studentNote }}</span>
              </div>
            </div>
          </div>

          <div v-if="booking.status === 'rejected' && booking.rejectionReason" class="rejection-card">
            <h3 class="rejection-title">⚠️ Lý do bị từ chối:</h3>
            <p class="rejection-text">{{ booking.rejectionReason }}</p>
          </div>

          <div class="info-card">
            <h3 class="card-title">3. Danh sách Thiết bị đi kèm</h3>
            <div v-if="!booking.equipmentItems || booking.equipmentItems.length === 0" class="empty-equipment">
              <p>Không đăng ký thiết bị đi kèm.</p>
            </div>
            <div v-else class="equipment-table">
              <div v-for="item in booking.equipmentItems" :key="item.equipmentId" class="equipment-row">
                <span class="eq-name">{{ item.equipment?.name || 'Thiết bị' }} ({{ item.equipment?.equipmentCode }})</span>
                <div class="eq-qty-group">
                  <span class="eq-qty">Số lượng mượn: <strong>{{ item.quantity }}</strong></span>
                  <span v-if="booking.status === 'completed' && item.damagedQuantity > 0" class="eq-damaged">
                    (Ghi nhận hỏng: {{ item.damagedQuantity }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ReviewForm
            v-if="booking.status === 'completed'"
            :booking-id="booking._id"
            :room-id="booking.roomId"
            :existing-review="existingReview"
            @review-updated="handleReviewUpdated"
            @review-deleted="handleReviewDeleted"
          />
        </div>

        <div class="sidebar-column">
          <BookingTimeline :booking="booking" />
        </div>
      </div>
    </div>

    <AppModal
      :is-open="showCancelModal"
      title="Xác Nhận Hủy Yêu Cầu Mượn Phòng"
      variant="danger"
      @close="showCancelModal = false"
    >
      <p>Bạn có chắc chắn muốn hủy phiếu mượn phòng này không? Khung giờ mượn sẽ được giải phóng cho các sinh viên khác.</p>
      <div class="cancel-reason-group">
        <label for="cancel-reason" class="reason-label">Lý do hủy (Không bắt buộc):</label>
        <textarea
          id="cancel-reason"
          v-model="cancelReason"
          rows="2"
          class="reason-textarea"
          placeholder="Nhập lý do hủy mượn..."
        ></textarea>
      </div>

      <p v-if="cancelError" class="modal-error">{{ cancelError }}</p>

      <template #footer>
        <AppButton variant="secondary" :disabled="canceling" @click="showCancelModal = false">
          Quay lại
        </AppButton>
        <AppButton variant="danger" :loading="canceling" @click="handleCancelBooking">
          Xác nhận hủy
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { bookingService } from '@/services/booking';
import { reviewService } from '@/services/review';
import { formatDateVN, formatTimeVN, formatDateTimeVN } from '@/utils/date';

import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppModal from '@/components/common/AppModal.vue';
import BookingTimeline from '@/components/student/BookingTimeline.vue';
import ReviewForm from '@/components/student/ReviewForm.vue';

const route = useRoute();
const bookingId = route.params.id;

const loading = ref(false);
const error = ref('');
const booking = ref(null);
const existingReview = ref(null);

const showCancelModal = ref(false);
const cancelReason = ref('');
const canceling = ref(false);
const cancelError = ref('');

const canCancel = computed(() => {
  if (!booking.value) return false;
  const isEligibleStatus = ['pending', 'approved'].includes(booking.value.status);
  if (!isEligibleStatus) return false;
  const startTime = new Date(booking.value.startTime).getTime();
  const now = new Date().getTime();
  return startTime > now;
});

async function fetchBookingDetail() {
  loading.value = true;
  error.value = '';
  try {
    const res = await bookingService.getBookingById(bookingId);
    if (res && res.data) {
      booking.value = res.data;
      if (booking.value.status === 'completed') {
        fetchReview();
      }
    } else {
      error.value = 'Không tìm thấy chi tiết phiếu mượn';
    }
  } catch (err) {
    error.value = err.message || 'Không thể tải phiếu mượn';
  } finally {
    loading.value = false;
  }
}

async function fetchReview() {
  try {
    const res = await reviewService.getMyReviews({ bookingId });
    if (res && res.data && res.data.length > 0) {
      existingReview.value = res.data[0];
    } else {
      existingReview.value = null;
    }
  } catch (err) {
    existingReview.value = null;
  }
}

async function handleCancelBooking() {
  canceling.value = true;
  cancelError.value = '';
  try {
    const res = await bookingService.cancelBooking(bookingId, {
      studentNote: cancelReason.value ? cancelReason.value.trim() : ''
    });
    if (res && res.data) {
      booking.value = res.data;
    }
    showCancelModal.value = false;
  } catch (err) {
    if (err.status === 409) {
      cancelError.value = 'Không thể hủy do trạng thái phiếu mượn vừa thay đổi hoặc đã tới giờ mượn.';
      fetchBookingDetail();
    } else {
      cancelError.value = err.message || 'Không thể hủy phiếu mượn';
    }
  } finally {
    canceling.value = false;
  }
}

function handleReviewUpdated(newReview) {
  existingReview.value = newReview;
}

function handleReviewDeleted() {
  existingReview.value = null;
}

onMounted(() => {
  fetchBookingDetail();
});
</script>

<style scoped>
.booking-detail-view {
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
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.cancel-action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
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
  color: var(--color-danger);
  font-weight: 600;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cancel-reason-group {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reason-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.reason-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.modal-error {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-danger);
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
