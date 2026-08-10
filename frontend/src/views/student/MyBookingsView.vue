<template>
  <div class="my-bookings-view">
    <header class="page-header">
      <h1 class="title">Danh Sách Yêu Cầu Mượn Của Tôi</h1>
      <p class="subtitle">Theo dõi trạng thái và quản lý các phiếu mượn phòng tự học & thiết bị</p>
    </header>

    <div class="filter-toolbar">
      <div class="filter-group">
        <label for="status-filter" class="filter-label">Trạng thái:</label>
        <select
          id="status-filter"
          v-model="filters.status"
          class="filter-select"
          @change="handleFilterChange"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="in_use">Đang sử dụng</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="rejected">Bị từ chối</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="date-filter" class="filter-label">Ngày mượn:</label>
        <input
          id="date-filter"
          v-model="filters.date"
          type="date"
          class="filter-date-input"
          @change="handleFilterChange"
        />
      </div>

      <AppButton variant="secondary" size="sm" @click="handleResetFilters">
        Đặt lại bộ lọc
      </AppButton>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang lấy danh sách phiếu mượn..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchBookings">Thử lại</AppButton>
    </div>

    <div v-else-if="bookings.length === 0" class="empty-wrapper">
      <EmptyState
        title="Chưa có yêu cầu mượn phòng nào"
        description="Bạn chưa đăng ký phiếu mượn phòng nào hoặc không tìm thấy kết quả phù hợp với bộ lọc."
      >
        <template #action>
          <router-link to="/rooms">
            <AppButton variant="primary">Khám phá & Đăng ký phòng ngay</AppButton>
          </router-link>
        </template>
      </EmptyState>
    </div>

    <div v-else class="bookings-container">
      <div class="bookings-list">
        <div v-for="b in bookings" :key="b._id" class="booking-card">
          <div class="card-top-bar">
            <div class="booking-code">
              Mã: <strong>#{{ (b._id || '').slice(-6).toUpperCase() }}</strong>
            </div>
            <StatusBadge :status="b.status" />
          </div>

          <div class="card-main-info">
            <h3 class="room-title">{{ b.room?.name || 'Phòng học' }} ({{ b.room?.roomCode }})</h3>
            <p class="room-location">📍 Vị trí: {{ b.room?.location }}</p>

            <div class="time-box">
              <span class="date-badge">🗓️ {{ formatDateVN(b.startTime) }}</span>
              <span class="time-range">⏰ {{ formatTimeVN(b.startTime) }} - {{ formatTimeVN(b.endTime) }}</span>
            </div>

            <p class="purpose-text"><strong>Mục đích:</strong> {{ b.purpose }}</p>

            <div v-if="b.equipmentItems && b.equipmentItems.length > 0" class="equipment-tag">
              🎒 Kèm {{ b.equipmentItems.length }} loại thiết bị học tập
            </div>
          </div>

          <div class="card-footer-bar">
            <span class="created-at">Đăng ký ngày {{ formatDateVN(b.createdAt) }}</span>
            <router-link :to="`/my-bookings/${b._id}`">
              <AppButton variant="secondary" size="sm">Xem chi tiết →</AppButton>
            </router-link>
          </div>
        </div>
      </div>

      <PaginationBar
        v-if="pagination.totalPages > 1"
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems"
        @change-page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { bookingService } from '@/services/booking';
import { formatDateVN, formatTimeVN } from '@/utils/date';

import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import AppButton from '@/components/common/AppButton.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const bookings = ref([]);

const pagination = ref({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1
});

const filters = reactive({
  status: route.query.status || '',
  date: route.query.date || '',
  page: parseInt(route.query.page, 10) || 1
});

async function fetchBookings() {
  loading.value = true;
  error.value = '';
  try {
    const res = await bookingService.getMyBookings({
      status: filters.status,
      date: filters.date,
      page: filters.page,
      limit: 10
    });
    if (res && res.data) {
      bookings.value = res.data;
      if (res.pagination) {
        pagination.value = res.pagination;
      }
    }
  } catch (err) {
    error.value = err.message || 'Không thể lấy danh sách yêu cầu mượn';
  } finally {
    loading.value = false;
  }
}

function syncUrlQuery() {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.date) query.date = filters.date;
  if (filters.page > 1) query.page = filters.page;
  router.push({ query });
}

function handleFilterChange() {
  filters.page = 1;
  syncUrlQuery();
  fetchBookings();
}

function handleResetFilters() {
  filters.status = '';
  filters.date = '';
  filters.page = 1;
  syncUrlQuery();
  fetchBookings();
}

function handlePageChange(newPage) {
  filters.page = newPage;
  syncUrlQuery();
  fetchBookings();
}

watch(() => route.query, (newQuery) => {
  filters.status = newQuery.status || '';
  filters.date = newQuery.date || '';
  filters.page = parseInt(newQuery.page, 10) || 1;
  fetchBookings();
});

onMounted(() => {
  fetchBookings();
});
</script>

<style scoped>
.my-bookings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  margin-bottom: 4px;
}

.title {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-select, .filter-date-input {
  padding: 6px 12px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 13px;
}

.bookings-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.booking-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;

}

.card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.booking-code {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.card-main-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.room-location {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.time-box {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  margin: 4px 0;
}

.date-badge {
  color: var(--color-brand);
}

.time-range {
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.purpose-text {
  font-size: 14px;
  color: var(--color-text-primary);
}

.equipment-tag {
  font-size: 12px;
  color: var(--color-text-secondary);
  background-color: var(--color-surface-elevated);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  align-self: flex-start;
  border: 1px solid var(--color-border);
}

.card-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.created-at {
  font-size: 12px;
  color: var(--color-text-muted);
}

.loading-wrapper, .error-wrapper, .empty-wrapper {
  padding: 48px 0;
  text-align: center;
}

.error-text {
  color: var(--color-danger);
  margin-bottom: 12px;
}
</style>
