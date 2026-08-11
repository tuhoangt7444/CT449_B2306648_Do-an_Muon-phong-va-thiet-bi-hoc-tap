<template>
  <div class="admin-rooms-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Quản lý Phòng Học</h1>
        <p class="page-subtitle">Thêm mới, cập nhật thông tin và theo dõi trạng thái các phòng tự học CTU</p>
      </div>
      <div class="header-right">
        <AppButton variant="primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm phòng mới
        </AppButton>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="roomSearch"
            v-model="filters.search"
            placeholder="Tìm theo mã phòng, tên, vị trí..."
            @input="handleSearchInput"
          />
        </div>

        <div class="select-wrapper">
          <AppSelect
            id="statusFilter"
            v-model="filters.status"
            :options="statusFilterOptions"
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
      <LoadingState message="Đang tải danh sách phòng học..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải danh sách" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchRooms">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="rooms.length === 0" class="empty-wrapper">
      <EmptyState title="Không tìm thấy phòng học nào" description="Thử thay đổi bộ lọc tìm kiếm hoặc thêm phòng mới.">
        <template #action>
          <AppButton variant="primary" @click="openCreateModal">Thêm phòng mới</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã phòng</th>
            <th>Tên phòng</th>
            <th>Vị trí</th>
            <th>Sức chứa</th>
            <th>Tiện nghi</th>
            <th>Đánh giá</th>
            <th>Trạng thái</th>
            <th>Cập nhật</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in rooms" :key="room._id">
            <td class="font-mono font-bold">{{ room.roomCode }}</td>
            <td class="font-semibold">{{ room.name }}</td>
            <td class="text-muted">{{ room.location }}</td>
            <td>{{ room.capacity }} người</td>
            <td>
              <div class="facilities-tags">
                <span v-for="(fac, idx) in (room.facilities || []).slice(0, 3)" :key="idx" class="facility-chip">
                  {{ fac }}
                </span>
                <span v-if="(room.facilities || []).length > 3" class="facility-chip more">
                  +{{ room.facilities.length - 3 }}
                </span>
              </div>
            </td>
            <td>
              <div v-if="room.reviewCount > 0" class="rating-badge">
                <span class="star-icon">★</span>
                <span>{{ room.averageRating }} ({{ room.reviewCount }})</span>
              </div>
              <span v-else class="text-muted text-sm">Chưa có</span>
            </td>
            <td>
              <StatusBadge :status="room.status" />
            </td>
            <td class="text-sm text-muted">{{ formatDateVN(room.updatedAt) }}</td>
            <td class="text-right actions-cell">
              <AppButton size="sm" variant="secondary" @click="openEditModal(room)">Sửa</AppButton>
              <AppButton size="sm" variant="danger" @click="openDeleteModal(room)">Xóa</AppButton>
            </td>
          </tr>
        </tbody>
      </table>

      <PaginationBar
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems"
        :limit="pagination.limit"
        @page-change="handlePageChange"
      />
    </div>

    <AppModal
      :is-open="isFormModalOpen"
      :title="isEditMode ? `Chỉnh sửa phòng #${editingRoomCode}` : 'Thêm phòng học mới'"
      @close="closeFormModal"
    >
      <form class="modal-form" @submit.prevent="handleSaveRoom">
        <div class="form-grid">
          <AppInput
            id="formRoomCode"
            v-model="form.roomCode"
            label="Mã phòng học"
            placeholder="Ví dụ: P101, A1.01"
            :error="formErrors.roomCode"
            required
          />

          <AppInput
            id="formName"
            v-model="form.name"
            label="Tên phòng học"
            placeholder="Ví dụ: Phòng tự học A1.01"
            :error="formErrors.name"
            required
          />
        </div>

        <div class="form-grid">
          <AppInput
            id="formLocation"
            v-model="form.location"
            label="Vị trí phòng"
            placeholder="Ví dụ: Tầng 1, Nhà A1"
            :error="formErrors.location"
            required
          />

          <AppInput
            id="formCapacity"
            v-model.number="form.capacity"
            type="number"
            label="Sức chứa (số người)"
            placeholder="Ví dụ: 6"
            :error="formErrors.capacity"
            required
          />
        </div>

        <div class="form-group">
          <AppSelect
            id="formStatus"
            v-model="form.status"
            label="Trạng thái hoạt động"
            :options="formStatusOptions"
          />
        </div>

        <div class="form-group">
          <label class="app-label">Mô tả phòng học</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="app-textarea"
            placeholder="Nhập thông tin chi tiết mượn phòng, quy định..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="app-label">Danh sách Tiện nghi (Mỗi tiện nghi nhập một dòng)</label>
          <textarea
            v-model="facilitiesText"
            rows="3"
            class="app-textarea"
            placeholder="Máy lạnh&#10;Bảng trắng&#10;Máy chiếu"
          ></textarea>
          <div v-if="parsedFacilities.length > 0" class="preview-box">
            <span class="preview-label">Xem trước:</span>
            <div class="facilities-tags">
              <span v-for="(tag, idx) in parsedFacilities" :key="idx" class="facility-chip">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="app-label">Danh sách URL hình ảnh (Mỗi URL nhập một dòng)</label>
          <textarea
            v-model="imagesText"
            rows="2"
            class="app-textarea"
            placeholder="https://example.com/image1.jpg"
          ></textarea>
        </div>

        <p v-if="formGeneralError" class="form-error-alert">{{ formGeneralError }}</p>

        <div class="modal-footer">
          <AppButton type="button" variant="secondary" @click="closeFormModal">Hủy</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting">
            {{ isEditMode ? 'Lưu cập nhật' : 'Tạo phòng' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :is-open="isDeleteModalOpen"
      title="Xác nhận xóa phòng học"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-content">
        <p v-if="deletingRoom">
          Bạn có chắc chắn muốn xóa phòng <strong>{{ deletingRoom.name }} ({{ deletingRoom.roomCode }})</strong>?
        </p>

        <div v-if="deleteConflictError" class="conflict-warning-box">
          <h4 class="warning-title">⚠️ Không thể xóa phòng học:</h4>
          <p class="warning-text">{{ deleteConflictError }}</p>
          <p class="warning-sub">Bạn có muốn chuyển trạng thái phòng sang <strong>"Ngưng hoạt động" (inactive)</strong> để ẩn khỏi giao diện mượn phòng không?</p>
          <div class="warning-action">
            <AppButton variant="warning" size="sm" :loading="submitting" @click="handleSwitchToInactive">
              Chuyển sang Ngưng hoạt động (inactive)
            </AppButton>
          </div>
        </div>

        <div class="modal-footer">
          <AppButton variant="secondary" @click="closeDeleteModal">Đóng</AppButton>
          <AppButton v-if="!deleteConflictError" variant="danger" :loading="submitting" @click="confirmDeleteRoom">
            Xác nhận Xóa
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminRoomService } from '@/services/adminRoom';
import { formatDateVN } from '@/utils/date';

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
const rooms = ref([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0
});

const filters = reactive({
  search: route.query.search || '',
  status: route.query.status || '',
  sortBy: route.query.sortBy || 'createdAt',
  sortOrder: route.query.sortOrder || 'desc'
});

const statusFilterOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'available', label: 'Hoạt động' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'inactive', label: 'Ngưng hoạt động' }
];

const formStatusOptions = [
  { value: 'available', label: 'Hoạt động (available)' },
  { value: 'maintenance', label: 'Bảo trì (maintenance)' },
  { value: 'inactive', label: 'Ngưng hoạt động (inactive)' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'roomCode', label: 'Mã phòng (A-Z)' },
  { value: 'name', label: 'Tên phòng (A-Z)' },
  { value: 'capacity', label: 'Sức chứa lớn nhất' }
];

const hasActiveFilters = computed(() => {
  return filters.search.trim() !== '' || filters.status !== '' || filters.sortBy !== 'createdAt';
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
  filters.status = '';
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
  if (filters.status) query.status = filters.status;
  if (filters.sortBy !== 'createdAt') query.sortBy = filters.sortBy;
  if (pagination.page > 1) query.page = pagination.page;

  router.replace({ query });
  fetchRooms();
}

let activeAbortController = null;

async function fetchRooms() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  error.value = '';
  try {
    const res = await adminRoomService.getRooms({
      search: filters.search,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: pagination.page,
      limit: pagination.limit
    }, activeAbortController.signal);

    if (res && res.data) {
      rooms.value = res.data;
      if (res.pagination) {
        pagination.page = res.pagination.page;
        pagination.limit = res.pagination.limit;
        pagination.totalItems = res.pagination.totalItems;
        pagination.totalPages = res.pagination.totalPages;
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || 'Không thể tải danh sách phòng học';
    }
  } finally {
    loading.value = false;
  }
}

const isFormModalOpen = ref(false);
const isEditMode = ref(false);
const editingRoomId = ref(null);
const editingRoomCode = ref('');
const submitting = ref(false);
const formGeneralError = ref('');

const form = reactive({
  roomCode: '',
  name: '',
  location: '',
  capacity: 6,
  description: '',
  status: 'available'
});

const facilitiesText = ref('');
const imagesText = ref('');

const formErrors = reactive({
  roomCode: '',
  name: '',
  location: '',
  capacity: ''
});

const parsedFacilities = computed(() => {
  if (!facilitiesText.value) return [];
  return [...new Set(facilitiesText.value.split('\n').map(s => s.trim()).filter(Boolean))];
});

const parsedImages = computed(() => {
  if (!imagesText.value) return [];
  return imagesText.value.split('\n').map(s => s.trim()).filter(Boolean);
});

function openCreateModal() {
  isEditMode.value = false;
  editingRoomId.value = null;
  editingRoomCode.value = '';
  form.roomCode = '';
  form.name = '';
  form.location = '';
  form.capacity = 6;
  form.description = '';
  form.status = 'available';
  facilitiesText.value = '';
  imagesText.value = '';
  clearFormErrors();
  isFormModalOpen.value = true;
}

function openEditModal(room) {
  isEditMode.value = true;
  editingRoomId.value = room._id;
  editingRoomCode.value = room.roomCode;
  form.roomCode = room.roomCode;
  form.name = room.name;
  form.location = room.location;
  form.capacity = room.capacity;
  form.description = room.description || '';
  form.status = room.status || 'available';
  facilitiesText.value = (room.facilities || []).join('\n');
  imagesText.value = (room.images || []).join('\n');
  clearFormErrors();
  isFormModalOpen.value = true;
}

function closeFormModal() {
  isFormModalOpen.value = false;
}

function clearFormErrors() {
  formErrors.roomCode = '';
  formErrors.name = '';
  formErrors.location = '';
  formErrors.capacity = '';
  formGeneralError.value = '';
}

function validateForm() {
  clearFormErrors();
  let isValid = true;

  if (!form.roomCode || !form.roomCode.trim()) {
    formErrors.roomCode = 'Mã phòng là bắt buộc';
    isValid = false;
  }
  if (!form.name || !form.name.trim()) {
    formErrors.name = 'Tên phòng là bắt buộc';
    isValid = false;
  }
  if (!form.location || !form.location.trim()) {
    formErrors.location = 'Vị trí phòng là bắt buộc';
    isValid = false;
  }
  if (!form.capacity || !Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0) {
    formErrors.capacity = 'Sức chứa phải là số nguyên dương';
    isValid = false;
  }

  return isValid;
}

async function handleSaveRoom() {
  if (!validateForm()) return;

  submitting.value = true;
  formGeneralError.value = '';

  const payload = {
    roomCode: form.roomCode.trim(),
    name: form.name.trim(),
    location: form.location.trim(),
    capacity: Number(form.capacity),
    description: form.description ? form.description.trim() : '',
    status: form.status,
    facilities: parsedFacilities.value,
    images: parsedImages.value
  };

  try {
    if (isEditMode.value) {
      await adminRoomService.updateRoom(editingRoomId.value, payload);
    } else {
      await adminRoomService.createRoom(payload);
    }
    closeFormModal();
    fetchRooms();
  } catch (err) {
    if (err.status === 409) {
      formErrors.roomCode = err.message || 'Mã phòng đã tồn tại';
    } else {
      formGeneralError.value = err.message || 'Không thể lưu thông tin phòng học';
    }
  } finally {
    submitting.value = false;
  }
}

const isDeleteModalOpen = ref(false);
const deletingRoom = ref(null);
const deleteConflictError = ref('');

function openDeleteModal(room) {
  deletingRoom.value = room;
  deleteConflictError.value = '';
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  deletingRoom.value = null;
  deleteConflictError.value = '';
}

async function confirmDeleteRoom() {
  if (!deletingRoom.value) return;

  submitting.value = true;
  deleteConflictError.value = '';
  try {
    await adminRoomService.deleteRoom(deletingRoom.value._id);
    closeDeleteModal();
    if (rooms.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }
    fetchRooms();
  } catch (err) {
    if (err.status === 409) {
      deleteConflictError.value = err.message || 'Không thể xóa phòng đã có lịch mượn tham chiếu.';
    } else {
      deleteConflictError.value = err.message || 'Không thể xóa phòng học này.';
    }
  } finally {
    submitting.value = false;
  }
}

async function handleSwitchToInactive() {
  if (!deletingRoom.value) return;

  submitting.value = true;
  try {
    await adminRoomService.updateRoom(deletingRoom.value._id, { status: 'inactive' });
    closeDeleteModal();
    fetchRooms();
  } catch (err) {
    deleteConflictError.value = err.message || 'Không thể cập nhật trạng thái ngưng hoạt động';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchRooms();
});
</script>

<style scoped>
.admin-rooms-view {
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

.facilities-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.facility-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.facility-chip.more {
  font-weight: 700;
  color: var(--color-brand);
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: var(--color-warning-text);
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.app-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
}

.preview-box {
  margin-top: 6px;
  padding: 8px 12px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 4px;
}

.form-error-alert {
  font-size: 13px;
  color: var(--color-danger);
  background-color: var(--color-danger-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
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

.conflict-warning-box {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
}

.warning-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-danger-text);
  margin-bottom: 4px;
}

.warning-text {
  font-size: 13px;
  color: var(--color-danger-text);
  margin-bottom: 8px;
}

.warning-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
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
