<template>
  <div class="room-detail-view">
    <div class="breadcrumb-bar">
      <router-link to="/rooms" class="breadcrumb-link">← Quay lại danh sách phòng</router-link>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang lấy thông tin chi tiết phòng học..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState
        title="Không tìm thấy phòng học"
        :description="error"
      >
        <template #action>
          <router-link to="/rooms">
            <AppButton variant="primary">Quay lại danh sách phòng</AppButton>
          </router-link>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="room" class="detail-container">
      <div class="room-header-card">
        <div class="image-section">
          <img
            v-if="room.images && room.images.length > 0 && isValidUrl(room.images[0])"
            :src="room.images[0]"
            :alt="room.name"
            class="detail-image"
          />
          <div v-else class="image-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2Z"/>
            </svg>
            <span class="placeholder-code">{{ room.roomCode }}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="title-row">
            <div class="name-group">
              <h1 class="room-title">{{ room.name }}</h1>
              <span class="room-code-tag">{{ room.roomCode }}</span>
            </div>
            <StatusBadge :status="room.status" />
          </div>

          <div class="rating-bar">
            <span class="star-icon">★</span>
            <span class="rating-num">{{ formatRating(room.averageRating) }}</span>
            <span v-if="room.reviewCount > 0" class="rating-count">({{ room.reviewCount }} đánh giá)</span>
            <span v-else class="rating-count">(Chưa có đánh giá)</span>
          </div>

          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">Vị trí:</span>
              <span class="spec-value">{{ room.location }}</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Sức chứa:</span>
              <span class="spec-value">{{ formatCapacity(room.capacity) }}</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Trạng thái:</span>
              <span class="spec-value">{{ room.status === 'available' ? 'Sẵn sàng phục vụ' : (room.status === 'maintenance' ? 'Đang bảo trì' : 'Ngưng hoạt động') }}</span>
            </div>
          </div>

          <p v-if="room.description" class="room-desc">{{ room.description }}</p>

          <div v-if="room.facilities && room.facilities.length > 0" class="facilities-section">
            <span class="facilities-title">Trang thiết bị & Tiện nghi:</span>
            <div class="facilities-list">
              <span v-for="(fac, idx) in room.facilities" :key="idx" class="facility-badge">
                ✓ {{ fac }}
              </span>
            </div>
          </div>

          <div class="action-bar">
            <AppButton
              size="lg"
              variant="primary"
              :disabled="room.status !== 'available'"
              @click="handleProceedBooking"
            >
              Đăng ký mượn phòng này
            </AppButton>
            <p v-if="room.status !== 'available'" class="status-warning">
              ⚠️ Phòng học hiện không khả dụng để gửi yêu cầu đăng ký mượn.
            </p>
          </div>
        </div>
      </div>

      <DailySchedule
        :room-id="room._id"
        :initial-date="selectedDate"
        @change-date="handleDateChange"
      />

      <RoomReviews :room-id="room._id" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { roomService } from '@/services/room';
import { formatCapacity, formatRating } from '@/utils/format';
import { getTodayString } from '@/utils/date';
import StatusBadge from '@/components/common/StatusBadge.vue';
import DailySchedule from '@/components/student/DailySchedule.vue';
import RoomReviews from '@/components/student/RoomReviews.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const roomId = route.params.id;
const room = ref(null);
const loading = ref(false);
const error = ref('');
const selectedDate = ref(route.query.date || getTodayString());

function isValidUrl(str) {
  return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/'));
}

async function fetchRoomDetail() {
  loading.value = true;
  error.value = '';
  try {
    const res = await roomService.getRoomById(roomId);
    if (res && res.data) {
      room.value = res.data;
    } else {
      error.value = 'Không tìm thấy thông tin phòng học';
    }
  } catch (err) {
    error.value = err.message || 'Không thể tải thông tin phòng';
  } finally {
    loading.value = false;
  }
}

function handleDateChange(newDate) {
  selectedDate.value = newDate;
  router.push({ query: { ...route.query, date: newDate } });
}

function handleProceedBooking() {
  if (room.value && room.value.status !== 'available') return;

  const targetPath = `/rooms/${roomId}/book?date=${selectedDate.value}`;
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: targetPath } });
  } else {
    router.push(targetPath);
  }
}

onMounted(() => {
  fetchRoomDetail();
});
</script>

<style scoped>
.room-detail-view {
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

.breadcrumb-link:hover {
  color: var(--color-brand);
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.room-header-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: grid;
  grid-template-columns: 360px 1fr;
}

.image-section {
  width: 100%;
  height: 100%;
  min-height: 280px;
  background-color: var(--color-surface-elevated);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  gap: 8px;

}

.placeholder-code {
  font-size: 18px;
  font-weight: 700;
}

.info-section {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.name-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.room-code-tag {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-mono);
  padding: 3px 8px;
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.star-icon {
  color: #f59e0b;
  font-size: 16px;
}

.rating-num {
  font-weight: 700;
  color: var(--color-text-primary);
}

.rating-count {
  color: var(--color-text-muted);
}

.specs-grid {
  display: flex;
  gap: 24px;
  font-size: 14px;
  padding: 12px 16px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-md);

}

.spec-item {
  display: flex;
  gap: 6px;
}

.spec-label {
  color: var(--color-text-secondary);
}

.spec-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.room-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.facilities-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.facilities-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.facility-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.action-bar {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.status-warning {
  font-size: 13px;
  color: var(--color-warning-text);
}

.loading-wrapper, .error-wrapper {
  padding: 48px 0;
}

@media (max-width: 992px) {
  .room-header-card {
    grid-template-columns: 1fr;
  }
  .image-section {
    height: 220px;
  }
  .specs-grid {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
