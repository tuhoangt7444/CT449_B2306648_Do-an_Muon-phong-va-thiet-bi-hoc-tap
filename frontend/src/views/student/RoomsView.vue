<template>
  <div class="rooms-view">
    <header class="page-header">
      <h1 class="title">Danh Sách Phòng Tự Học</h1>
      <p class="subtitle">Tra cứu và lựa chọn phòng tự học phù hợp với nhu cầu học tập cá nhân và học nhóm</p>
    </header>

    <RoomFilter
      :initial-filters="filters"
      @change-filter="handleFilterChange"
      @reset="handleFilterReset"
    />

    <div v-if="loading" class="loading-container">
      <LoadingState message="Đang tải danh sách phòng học..." />
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchRooms">Thử lại</AppButton>
    </div>

    <div v-else-if="rooms.length === 0" class="empty-container">
      <EmptyState
        title="Không tìm thấy phòng phù hợp"
        description="Vui lòng thử điều chỉnh lại từ khóa hoặc bộ lọc tìm kiếm."
      >
        <template #action>
          <AppButton variant="secondary" @click="handleFilterReset">Xóa bộ lọc</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="rooms-container">
      <div class="rooms-grid">
        <RoomCard
          v-for="room in rooms"
          :key="room._id"
          :room="room"
        />
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
import { roomService } from '@/services/room';
import RoomCard from '@/components/student/RoomCard.vue';
import RoomFilter from '@/components/student/RoomFilter.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const rooms = ref([]);

const pagination = ref({
  page: 1,
  limit: 9,
  totalItems: 0,
  totalPages: 1
});

const filters = reactive({
  search: route.query.search || '',
  status: route.query.status !== undefined ? route.query.status : 'available',
  minCapacity: route.query.minCapacity || '',
  sortBy: route.query.sortBy || 'createdAt',
  sortOrder: route.query.sortOrder || 'desc',
  page: parseInt(route.query.page, 10) || 1
});

async function fetchRooms() {
  loading.value = true;
  error.value = '';
  try {
    const res = await roomService.getRooms({
      search: filters.search,
      status: filters.status,
      minCapacity: filters.minCapacity,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: 9
    });

    if (res && res.data) {
      rooms.value = res.data;
      if (res.pagination) {
        pagination.value = res.pagination;
      }
    }
  } catch (err) {
    error.value = err.message || 'Không thể lấy danh sách phòng';
  } finally {
    loading.value = false;
  }
}

function syncUrlQuery() {
  const query = {};
  if (filters.search) query.search = filters.search;
  if (filters.status) query.status = filters.status;
  if (filters.minCapacity) query.minCapacity = filters.minCapacity;
  if (filters.sortBy) query.sortBy = filters.sortBy;
  if (filters.sortOrder) query.sortOrder = filters.sortOrder;
  if (filters.page > 1) query.page = filters.page;

  router.push({ query });
}

function handleFilterChange(newFilters) {
  filters.search = newFilters.search;
  filters.status = newFilters.status;
  filters.minCapacity = newFilters.minCapacity;
  filters.sortBy = newFilters.sortBy;
  filters.sortOrder = newFilters.sortOrder;
  filters.page = 1;

  syncUrlQuery();
  fetchRooms();
}

function handleFilterReset() {
  filters.search = '';
  filters.status = 'available';
  filters.minCapacity = '';
  filters.sortBy = 'createdAt';
  filters.sortOrder = 'desc';
  filters.page = 1;

  syncUrlQuery();
  fetchRooms();
}

function handlePageChange(newPage) {
  filters.page = newPage;
  syncUrlQuery();
  fetchRooms();
}

watch(() => route.query, (newQuery) => {
  filters.search = newQuery.search || '';
  filters.status = newQuery.status !== undefined ? newQuery.status : 'available';
  filters.minCapacity = newQuery.minCapacity || '';
  filters.sortBy = newQuery.sortBy || 'createdAt';
  filters.sortOrder = newQuery.sortOrder || 'desc';
  filters.page = parseInt(newQuery.page, 10) || 1;

  fetchRooms();
});

onMounted(() => {
  fetchRooms();
});
</script>

<style scoped>
.rooms-view {
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

.rooms-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.loading-container, .error-container, .empty-container {
  padding: 48px 0;
  text-align: center;
}

.error-text {
  color: var(--color-danger);
  margin-bottom: 12px;
}
</style>
