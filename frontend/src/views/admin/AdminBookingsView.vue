<template>
  <div class="admin-bookings-view">
    <header class="page-header">
      <h1 class="title">Quản Lý Danh Sách Phiếu Mượn</h1>
      <p class="subtitle">Tra cứu, duyệt và theo dõi trạng thái sử dụng phòng tự học của sinh viên</p>
    </header>

    <div class="filter-toolbar">
      <div class="search-box">
        <input
          v-model="filters.search"
          type="text"
          class="search-input"
          placeholder="Tìm theo MSSV, Tên SV, Mã phòng..."
          @keyup.enter="handleFilterChange"
        />
        <AppButton variant="secondary" size="sm" @click="handleFilterChange">Tìm</AppButton>
      </div>

      <div class="select-group">
        <label for="admin-status" class="filter-label">Trạng thái:</label>
        <select id="admin-status" v-model="filters.status" class="filter-select" @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="in_use">Đang sử dụng</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="rejected">Bị từ chối</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div class="date-group">
        <label for="admin-date" class="filter-label">Ngày mượn:</label>
        <input id="admin-date" v-model="filters.date" type="date" class="filter-date-input" @change="handleFilterChange" />
      </div>

      <div class="quick-actions">
        <AppButton
          :variant="filters.status === 'pending' ? 'warning' : 'secondary'"
          size="sm"
          @click="setQuickStatus('pending')"
        >
          ⏳ Xem phiếu chờ duyệt
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleResetFilters">
          Đặt lại bộ lọc
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải danh sách phiếu mượn..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchBookings">Thử lại</AppButton>
    </div>

    <div v-else-if="bookings.length === 0" class="empty-wrapper">
      <EmptyState
        title="Không tìm thấy phiếu mượn nào"
        description="Vui lòng thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm."
      >
        <template #action>
          <AppButton variant="secondary" @click="handleResetFilters">Xóa bộ lọc</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-container">
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã Yêu Cầu</th>
              <th>Sinh Viên</th>
              <th>Phòng Học</th>
              <th>Thời Gian Mượn</th>
              <th>Mục Đích</th>
              <th>Số Người</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b._id">
              <td class="font-mono">#{{ (b._id || '').slice(-6).toUpperCase() }}</td>
              <td>
                <div class="student-cell">
                  <span class="student-name">{{ b.student?.name }}</span>
                  <span class="student-code">{{ b.student?.studentCode }}</span>
                </div>
              </td>
              <td>{{ b.room?.name }} ({{ b.room?.roomCode }})</td>
              <td>
                <div class="time-cell">
                  <span>🗓️ {{ formatDateVN(b.startTime) }}</span>
                  <span class="time-range">{{ formatTimeVN(b.startTime) }} - {{ formatTimeVN(b.endTime) }}</span>
                </div>
              </td>
              <td><span class="purpose-cell">{{ b.purpose }}</span></td>
              <td>{{ b.numberOfPeople }} người</td>
              <td><StatusBadge :status="b.status" /></td>
              <td>{{ formatDateVN(b.createdAt) }}</td>
              <td>
                <router-link :to="`/admin/bookings/${b._id}`">
                  <AppButton variant="secondary" size="sm">Xem chi tiết</AppButton>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
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
import { adminBookingService } from '@/services/adminBooking';
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
  search: route.query.search || '',
  status: route.query.status || '',
  date: route.query.date || '',
  page: parseInt(route.query.page, 10) || 1
});

async function fetchBookings() {
  loading.value = true;
  error.value = '';
  try {
    const res = await adminBookingService.getBookings({
      search: filters.search,
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
    error.value = err.message || 'Không thể lấy danh sách phiếu mượn';
  } finally {
    loading.value = false;
  }
}

function syncUrlQuery() {
  const query = {};
  if (filters.search) query.search = filters.search;
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

function setQuickStatus(st) {
  if (filters.status === st) {
    filters.status = '';
  } else {
    filters.status = st;
  }
  handleFilterChange();
}

function handleResetFilters() {
  filters.search = '';
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
  filters.search = newQuery.search || '';
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
.admin-bookings-view {
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

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 240px;
}

.search-input {
  flex: 1;
  padding: 6px 12px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 13px;
}

.select-group, .date-group {
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

.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.admin-table th, .admin-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.admin-table th {
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.student-cell {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.student-code {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.time-cell {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.time-range {
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.purpose-cell {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.font-mono {
  font-family: var(--font-mono);
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
