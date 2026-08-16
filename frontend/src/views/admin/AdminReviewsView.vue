<template>
  <div class="admin-reviews-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Đánh Giá Phòng Học</h1>
        <p class="page-subtitle">Theo dõi tổng hợp các đánh giá, nhận xét và mức độ hài lòng của sinh viên CTU</p>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="reviewSearch"
            v-model="filters.search"
            placeholder="Tìm theo nội dung đánh giá..."
            @input="handleSearchInput"
          />
        </div>

        <div class="select-wrapper">
          <AppSelect
            id="ratingFilter"
            v-model="filters.rating"
            :options="ratingFilterOptions"
            @change="applyFilters"
          />
        </div>

        <div class="select-wrapper">
          <AppSelect
            id="sortBy"
            v-model="filters.sortBy"
            :options="sortOptions"
            @change="applyFilters"
          />
        </div>

        <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
          Xóa bộ lọc
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải đánh giá phòng học..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải danh sách đánh giá" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchReviews">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="reviews.length === 0" class="empty-wrapper">
      <EmptyState title="Chưa có đánh giá nào" description="Thử thay đổi bộ lọc số sao hoặc từ khóa tìm kiếm." />
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Đánh giá</th>
            <th>Nội dung nhận xét</th>
            <th>Phòng học</th>
            <th>Sinh viên</th>
            <th>Thời gian</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reviews" :key="item._id">
            <td>
              <div class="rating-badge font-bold">
                <span class="star-icon">★</span>
                <span>{{ item.rating }}/5</span>
              </div>
            </td>
            <td>
              <p class="comment-text-truncated">{{ item.comment || 'Không có nhận xét' }}</p>
            </td>
            <td>
              <div v-if="item.room" class="resource-info">
                <span class="font-bold">{{ item.room.name }}</span>
                <span class="font-mono text-muted text-xs">({{ item.room.roomCode }})</span>
              </div>
              <span v-else class="text-muted text-sm">Phòng không khả dụng</span>
            </td>
            <td>
              <div v-if="item.student" class="resource-info">
                <span class="font-semibold">{{ item.student.fullName }}</span>
                <span class="font-mono text-muted text-xs">({{ item.student.studentCode }})</span>
              </div>
              <span v-else class="text-muted text-sm">Sinh viên không khả dụng</span>
            </td>
            <td class="text-sm text-muted">{{ formatDateVN(item.createdAt) }}</td>
            <td class="text-right actions-cell">
              <AppButton size="sm" variant="secondary" @click="openDetailModal(item)">Xem chi tiết</AppButton>
            </td>
          </tr>
        </tbody>
      </table>

      <PaginationBar
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems"
        @change-page="handlePageChange"
      />
    </div>

    <AppModal
      :is-open="isDetailModalOpen"
      title="Chi tiết Đánh giá Phòng học"
      @close="closeDetailModal"
    >
      <div v-if="selectedReview" class="detail-modal-body">
        <div class="rating-header-box">
          <div class="rating-stars-large">
            <span v-for="star in 5" :key="star" :class="{ 'star-active': star <= selectedReview.rating }">★</span>
          </div>
          <span class="rating-score font-bold">{{ selectedReview.rating }}/5 sao</span>
        </div>

        <div class="detail-section">
          <h4 class="section-title">Nội dung nhận xét:</h4>
          <div class="comment-box">
            {{ selectedReview.comment || 'Không có nội dung lời khuyên/nhận xét.' }}
          </div>
        </div>

        <div class="detail-grid">
          <div class="info-card">
            <h4 class="info-card-title">Phòng học</h4>
            <div v-if="selectedReview.room" class="info-card-content">
              <p><strong>Tên:</strong> {{ selectedReview.room.name }}</p>
              <p><strong>Mã phòng:</strong> <span class="font-mono">{{ selectedReview.room.roomCode }}</span></p>
              <p><strong>Vị trí:</strong> {{ selectedReview.room.location }}</p>
            </div>
            <p v-else class="text-muted">Thông tin phòng không khả dụng</p>
          </div>

          <div class="info-card">
            <h4 class="info-card-title">Sinh viên đánh giá</h4>
            <div v-if="selectedReview.student" class="info-card-content">
              <p><strong>Họ tên:</strong> {{ selectedReview.student.fullName }}</p>
              <p><strong>MSSV:</strong> <span class="font-mono">{{ selectedReview.student.studentCode }}</span></p>
              <p><strong>Email:</strong> {{ selectedReview.student.email }}</p>
            </div>
            <p v-else class="text-muted">Thông tin sinh viên không khả dụng</p>
          </div>
        </div>

        <div v-if="selectedReview.booking" class="detail-section">
          <h4 class="section-title">Phiếu mượn phòng liên quan:</h4>
          <div class="booking-ref-box">
            <div class="booking-ref-item">
              <span>Mã phiếu:</span>
              <strong class="font-mono">{{ selectedReview.booking.bookingCode || selectedReview.booking._id }}</strong>
            </div>
            <div class="booking-ref-item">
              <span>Thời gian mượn:</span>
              <strong>{{ formatDateTimeVN(selectedReview.booking.startTime) }} - {{ formatTimeVN(selectedReview.booking.endTime) }}</strong>
            </div>
            <div class="booking-ref-item">
              <span>Trạng thái:</span>
              <StatusBadge :status="selectedReview.booking.status" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <AppButton variant="secondary" @click="closeDetailModal">Đóng</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminReviewService } from '@/services/adminReview';
import { formatDateVN, formatDateTimeVN, formatTimeVN } from '@/utils/date';

import AppInput from '@/components/common/AppInput.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppModal from '@/components/common/AppModal.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const reviews = ref([]);

const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0
});

const filters = reactive({
  search: route.query.search || '',
  rating: route.query.rating || '',
  sortBy: route.query.sortBy || 'createdAt',
  sortOrder: route.query.sortOrder || 'desc'
});

const ratingFilterOptions = [
  { value: '', label: 'Tất cả mức đánh giá' },
  { value: '5', label: '5 sao (Xuất sắc)' },
  { value: '4', label: '4 sao (Tốt)' },
  { value: '3', label: '3 sao (Bình thường)' },
  { value: '2', label: '2 sao (Kém)' },
  { value: '1', label: '1 sao (Rất kém)' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'rating', label: 'Điểm đánh giá cao nhất' }
];

const hasActiveFilters = computed(() => {
  return filters.search.trim() !== '' || filters.rating !== '' || filters.sortBy !== 'createdAt';
});

let searchDebounce = null;
function handleSearchInput() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    applyFilters();
  }, 400);
}

function applyFilters() {
  pagination.page = 1;
  syncQueryAndFetch();
}

function resetFilters() {
  filters.search = '';
  filters.rating = '';
  filters.sortBy = 'createdAt';
  filters.sortOrder = 'desc';
  pagination.page = 1;
  syncQueryAndFetch();
}

function handlePageChange(newPage) {
  pagination.page = newPage;
  syncQueryAndFetch();
}

function syncQueryAndFetch() {
  const query = {};
  if (filters.search.trim()) query.search = filters.search.trim();
  if (filters.rating) query.rating = filters.rating;
  if (filters.sortBy !== 'createdAt') query.sortBy = filters.sortBy;
  if (pagination.page > 1) query.page = pagination.page;

  router.replace({ query });
  fetchReviews();
}

let activeAbortController = null;

async function fetchReviews() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  error.value = '';
  try {
    const res = await adminReviewService.getReviews({
      search: filters.search,
      rating: filters.rating,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: pagination.page,
      limit: pagination.limit
    }, activeAbortController.signal);

    if (res && res.data) {
      reviews.value = res.data;
      if (res.pagination) {
        pagination.page = res.pagination.page;
        pagination.limit = res.pagination.limit;
        pagination.totalItems = res.pagination.totalItems;
        pagination.totalPages = res.pagination.totalPages;
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || 'Không thể tải danh sách đánh giá';
    }
  } finally {
    loading.value = false;
  }
}

const isDetailModalOpen = ref(false);
const selectedReview = ref(null);

function openDetailModal(item) {
  selectedReview.value = item;
  isDetailModalOpen.value = true;
}

function closeDetailModal() {
  isDetailModalOpen.value = false;
  selectedReview.value = null;
}

onMounted(() => {
  fetchReviews();
});
</script>

<style scoped>
.admin-reviews-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.toolbar-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  flex: 1;
  min-width: 240px;
}

.select-wrapper {
  width: 180px;
}

.table-container {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-weight: 700;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-warning-text);
  font-size: 14px;
}

.star-icon {
  color: var(--color-warning-text);
}

.comment-text-truncated {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.detail-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-header-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.rating-stars-large {
  font-size: 20px;
  color: var(--color-border-strong);
}

.star-active {
  color: var(--color-warning-text);
}

.rating-score {
  font-size: 16px;
  color: var(--color-warning-text);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.comment-box {
  padding: 12px 16px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);

  word-break: break-word;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card {
  padding: 12px 16px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.info-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.info-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.booking-ref-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.booking-ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.font-mono {
  font-family: var(--font-mono);
}

.text-muted {
  color: var(--color-text-secondary);
}

.text-right {
  text-align: right;
}

.loading-wrapper, .error-wrapper, .empty-wrapper {
  padding: 40px 0;
}
</style>
