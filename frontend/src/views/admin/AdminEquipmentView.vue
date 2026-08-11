<template>
  <div class="admin-equipment-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Quản lý Thiết Bị Học Tập</h1>
        <p class="page-subtitle">Quản lý kho thiết bị, theo dõi số lượng khả dụng và xử lý cảnh báo tồn kho</p>
      </div>
      <div class="header-right">
        <AppButton variant="primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm thiết bị mới
        </AppButton>
      </div>
    </div>

    <div v-if="lowStockAlerts.length > 0" class="alert-banner-card">
      <div class="banner-left">
        <div class="warning-icon">⚠️</div>
        <div class="banner-text">
          <h4 class="banner-title">Cảnh báo tồn kho: Có {{ lowStockAlerts.length }} thiết bị sắp hết khả dụng</h4>
          <p class="banner-sub">Các thiết bị này có số lượng khả dụng nhỏ hơn hoặc bằng ngưỡng cảnh báo.</p>
        </div>
      </div>
      <div class="banner-right">
        <AppButton
          size="sm"
          :variant="filters.lowStock === 'true' ? 'danger' : 'warning'"
          @click="toggleLowStockFilter"
        >
          {{ filters.lowStock === 'true' ? 'Hiển thị tất cả' : 'Lọc danh sách sắp hết' }}
        </AppButton>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="equipmentSearch"
            v-model="filters.search"
            placeholder="Tìm theo mã thiết bị, tên, mô tả..."
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
      <LoadingState message="Đang tải kho thiết bị..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải thiết bị" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchEquipment">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="equipmentList.length === 0" class="empty-wrapper">
      <EmptyState title="Không tìm thấy thiết bị nào" description="Thử thay đổi bộ lọc tìm kiếm hoặc thêm thiết bị mới.">
        <template #action>
          <AppButton variant="primary" @click="openCreateModal">Thêm thiết bị mới</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã thiết bị</th>
            <th>Tên thiết bị</th>
            <th>Tổng số</th>
            <th>Hư hỏng</th>
            <th>Đang giữ</th>
            <th>Khả dụng</th>
            <th>Ngưỡng</th>
            <th>Trạng thái</th>
            <th>Cảnh báo</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in equipmentList" :key="item._id">
            <td class="font-mono font-bold">{{ item.equipmentCode }}</td>
            <td class="font-semibold">{{ item.name }}</td>
            <td class="font-bold">{{ item.totalQuantity }}</td>
            <td :class="{ 'text-danger font-bold': item.damagedQuantity > 0 }">
              {{ item.damagedQuantity }}
            </td>
            <td class="text-info font-bold">{{ item.reservedQuantity }}</td>
            <td class="font-bold highlight-qty">{{ item.availableQuantity }}</td>
            <td class="text-muted">{{ item.lowStockThreshold }}</td>
            <td>
              <StatusBadge :status="item.status" />
            </td>
            <td>
              <span
                v-if="item.status !== 'inactive' && item.availableQuantity <= item.lowStockThreshold"
                class="low-stock-badge"
              >
                ⚠️ Sắp hết
              </span>
              <span v-else class="text-muted text-sm">-</span>
            </td>
            <td class="text-right actions-cell">
              <AppButton size="sm" variant="secondary" @click="openEditModal(item)">Sửa</AppButton>
              <AppButton size="sm" variant="danger" @click="openDeleteModal(item)">Xóa</AppButton>
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
      :title="isEditMode ? `Chỉnh sửa thiết bị #${editingCode}` : 'Thêm thiết bị mới'"
      @close="closeFormModal"
    >
      <form class="modal-form" @submit.prevent="handleSaveEquipment">
        <div class="form-grid">
          <AppInput
            id="formEqCode"
            v-model="form.equipmentCode"
            label="Mã thiết bị"
            placeholder="Ví dụ: EQ001"
            :error="formErrors.equipmentCode"
            required
          />

          <AppInput
            id="formEqName"
            v-model="form.name"
            label="Tên thiết bị"
            placeholder="Ví dụ: Máy chiếu di động"
            :error="formErrors.name"
            required
          />
        </div>

        <div class="form-grid">
          <AppInput
            id="formTotalQty"
            v-model.number="form.totalQuantity"
            type="number"
            label="Tổng số lượng trong kho"
            placeholder="Ví dụ: 10"
            :error="formErrors.totalQuantity"
            required
          />

          <AppInput
            id="formDamagedQty"
            v-model.number="form.damagedQuantity"
            type="number"
            label="Số lượng hư hỏng"
            placeholder="Ví dụ: 0"
            :error="formErrors.damagedQuantity"
            required
          />
        </div>

        <div class="form-grid">
          <AppInput
            id="formThreshold"
            v-model.number="form.lowStockThreshold"
            type="number"
            label="Ngưỡng cảnh báo sắp hết"
            placeholder="Ví dụ: 2"
            :error="formErrors.lowStockThreshold"
            required
          />

          <AppSelect
            id="formEqStatus"
            v-model="form.status"
            label="Trạng thái hoạt động"
            :options="formStatusOptions"
          />
        </div>

        <div v-if="isEditMode" class="stats-preview-box">
          <span class="preview-title">Số liệu hiện tại (Tính toán tự động):</span>
          <div class="stats-preview-grid">
            <div>Đang giữ: <strong>{{ currentReservedQty }}</strong></div>
            <div>Khả dụng dự kiến: <strong>{{ calculatedAvailableQty }}</strong></div>
          </div>
        </div>

        <div class="form-group">
          <label class="app-label">Mô tả thiết bị</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="app-textarea"
            placeholder="Nhập thông số kỹ thuật, tình trạng kho..."
          ></textarea>
        </div>

        <p v-if="formWarning" class="form-warning-alert">{{ formWarning }}</p>
        <p v-if="formGeneralError" class="form-error-alert">{{ formGeneralError }}</p>

        <div class="modal-footer">
          <AppButton type="button" variant="secondary" @click="closeFormModal">Hủy</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting">
            {{ isEditMode ? 'Lưu cập nhật' : 'Tạo thiết bị' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :is-open="isDeleteModalOpen"
      title="Xác nhận xóa thiết bị"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-content">
        <p v-if="deletingItem">
          Bạn có chắc chắn muốn xóa thiết bị <strong>{{ deletingItem.name }} ({{ deletingItem.equipmentCode }})</strong>?
        </p>

        <div v-if="deleteConflictError" class="conflict-warning-box">
          <h4 class="warning-title">⚠️ Không thể xóa thiết bị:</h4>
          <p class="warning-text">{{ deleteConflictError }}</p>
          <p class="warning-sub">Bạn có muốn chuyển trạng thái thiết bị sang <strong>"Ngưng hoạt động" (inactive)</strong> để ẩn khỏi kho không?</p>
          <div class="warning-action">
            <AppButton variant="warning" size="sm" :loading="submitting" @click="handleSwitchToInactive">
              Chuyển sang Ngưng hoạt động (inactive)
            </AppButton>
          </div>
        </div>

        <div class="modal-footer">
          <AppButton variant="secondary" @click="closeDeleteModal">Đóng</AppButton>
          <AppButton v-if="!deleteConflictError" variant="danger" :loading="submitting" @click="confirmDeleteEquipment">
            Xác nhận Xóa
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminEquipmentService } from '@/services/adminEquipment';

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
const equipmentList = ref([]);
const lowStockAlerts = ref([]);

const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0
});

const filters = reactive({
  search: route.query.search || '',
  status: route.query.status || '',
  lowStock: route.query.lowStock || '',
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
  { value: 'equipmentCode', label: 'Mã thiết bị (A-Z)' },
  { value: 'name', label: 'Tên thiết bị (A-Z)' },
  { value: 'totalQuantity', label: 'Tổng số lượng nhiều nhất' }
];

const hasActiveFilters = computed(() => {
  return filters.search.trim() !== '' || filters.status !== '' || filters.lowStock !== '' || filters.sortBy !== 'createdAt';
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

function toggleLowStockFilter() {
  filters.lowStock = filters.lowStock === 'true' ? '' : 'true';
  applyFilters();
}

function resetFilters() {
  filters.search = '';
  filters.status = '';
  filters.lowStock = '';
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
  if (filters.lowStock) query.lowStock = filters.lowStock;
  if (filters.sortBy !== 'createdAt') query.sortBy = filters.sortBy;
  if (pagination.page > 1) query.page = pagination.page;

  router.replace({ query });
  fetchEquipment();
}

let activeAbortController = null;

async function fetchEquipment() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  error.value = '';
  try {
    const [resList, resAlerts] = await Promise.all([
      adminEquipmentService.getEquipment({
        search: filters.search,
        status: filters.status,
        lowStock: filters.lowStock,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination.page,
        limit: pagination.limit
      }, activeAbortController.signal),
      adminEquipmentService.getLowStockAlerts(activeAbortController.signal)
    ]);

    if (resList && resList.data) {
      equipmentList.value = resList.data;
      if (resList.pagination) {
        pagination.page = resList.pagination.page;
        pagination.limit = resList.pagination.limit;
        pagination.totalItems = resList.pagination.totalItems;
        pagination.totalPages = resList.pagination.totalPages;
      }
    }
    if (resAlerts && resAlerts.data) {
      lowStockAlerts.value = resAlerts.data;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || 'Không thể tải kho thiết bị';
    }
  } finally {
    loading.value = false;
  }
}

const isFormModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref(null);
const editingCode = ref('');
const submitting = ref(false);
const formGeneralError = ref('');
const formWarning = ref('');
const currentReservedQty = ref(0);

const form = reactive({
  equipmentCode: '',
  name: '',
  description: '',
  totalQuantity: 5,
  damagedQuantity: 0,
  lowStockThreshold: 1,
  status: 'available'
});

const formErrors = reactive({
  equipmentCode: '',
  name: '',
  totalQuantity: '',
  damagedQuantity: '',
  lowStockThreshold: ''
});

const calculatedAvailableQty = computed(() => {
  const total = Number(form.totalQuantity) || 0;
  const damaged = Number(form.damagedQuantity) || 0;
  const reserved = Number(currentReservedQty.value) || 0;
  return Math.max(total - damaged - reserved, 0);
});

function openCreateModal() {
  isEditMode.value = false;
  editingId.value = null;
  editingCode.value = '';
  form.equipmentCode = '';
  form.name = '';
  form.description = '';
  form.totalQuantity = 5;
  form.damagedQuantity = 0;
  form.lowStockThreshold = 1;
  form.status = 'available';
  currentReservedQty.value = 0;
  clearFormErrors();
  isFormModalOpen.value = true;
}

function openEditModal(item) {
  isEditMode.value = true;
  editingId.value = item._id;
  editingCode.value = item.equipmentCode;
  form.equipmentCode = item.equipmentCode;
  form.name = item.name;
  form.description = item.description || '';
  form.totalQuantity = item.totalQuantity;
  form.damagedQuantity = item.damagedQuantity || 0;
  form.lowStockThreshold = item.lowStockThreshold || 0;
  form.status = item.status || 'available';
  currentReservedQty.value = item.reservedQuantity || 0;
  clearFormErrors();
  isFormModalOpen.value = true;
}

function closeFormModal() {
  isFormModalOpen.value = false;
}

function clearFormErrors() {
  formErrors.equipmentCode = '';
  formErrors.name = '';
  formErrors.totalQuantity = '';
  formErrors.damagedQuantity = '';
  formErrors.lowStockThreshold = '';
  formGeneralError.value = '';
  formWarning.value = '';
}

function validateForm() {
  clearFormErrors();
  let isValid = true;

  if (!form.equipmentCode || !form.equipmentCode.trim()) {
    formErrors.equipmentCode = 'Mã thiết bị là bắt buộc';
    isValid = false;
  }
  if (!form.name || !form.name.trim()) {
    formErrors.name = 'Tên thiết bị là bắt buộc';
    isValid = false;
  }
  if (form.totalQuantity === null || form.totalQuantity === undefined || !Number.isInteger(Number(form.totalQuantity)) || Number(form.totalQuantity) < 0) {
    formErrors.totalQuantity = 'Tổng số lượng phải là số nguyên >= 0';
    isValid = false;
  }
  if (form.damagedQuantity === null || form.damagedQuantity === undefined || !Number.isInteger(Number(form.damagedQuantity)) || Number(form.damagedQuantity) < 0) {
    formErrors.damagedQuantity = 'Số lượng hư hỏng phải là số nguyên >= 0';
    isValid = false;
  }
  if (Number(form.damagedQuantity) > Number(form.totalQuantity)) {
    formErrors.damagedQuantity = 'Số lượng hư hỏng không được lớn hơn tổng số lượng';
    isValid = false;
  }
  if (form.lowStockThreshold === null || form.lowStockThreshold === undefined || !Number.isInteger(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0) {
    formErrors.lowStockThreshold = 'Ngưỡng cảnh báo phải là số nguyên >= 0';
    isValid = false;
  }

  const effectiveTotal = Number(form.totalQuantity) - Number(form.damagedQuantity);
  if (effectiveTotal < Number(currentReservedQty.value)) {
    formWarning.value = `⚠️ Cảnh báo: Số lượng khả dụng sau khi trừ hư hỏng (${effectiveTotal}) nhỏ hơn số lượng đang được đặt (${currentReservedQty.value}).`;
  }

  return isValid;
}

async function handleSaveEquipment() {
  if (!validateForm()) return;

  submitting.value = true;
  formGeneralError.value = '';

  const payload = {
    equipmentCode: form.equipmentCode.trim(),
    name: form.name.trim(),
    description: form.description ? form.description.trim() : '',
    totalQuantity: Number(form.totalQuantity),
    damagedQuantity: Number(form.damagedQuantity),
    lowStockThreshold: Number(form.lowStockThreshold),
    status: form.status
  };

  try {
    if (isEditMode.value) {
      await adminEquipmentService.updateEquipment(editingId.value, payload);
    } else {
      await adminEquipmentService.createEquipment(payload);
    }
    closeFormModal();
    fetchEquipment();
  } catch (err) {
    if (err.status === 409) {
      formErrors.equipmentCode = err.message || 'Mã thiết bị đã tồn tại';
    } else {
      formGeneralError.value = err.message || 'Không thể lưu thông tin thiết bị';
    }
  } finally {
    submitting.value = false;
  }
}

const isDeleteModalOpen = ref(false);
const deletingItem = ref(null);
const deleteConflictError = ref('');

function openDeleteModal(item) {
  deletingItem.value = item;
  deleteConflictError.value = '';
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  deletingItem.value = null;
  deleteConflictError.value = '';
}

async function confirmDeleteEquipment() {
  if (!deletingItem.value) return;

  submitting.value = true;
  deleteConflictError.value = '';
  try {
    await adminEquipmentService.deleteEquipment(deletingItem.value._id);
    closeDeleteModal();
    if (equipmentList.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }
    fetchEquipment();
  } catch (err) {
    if (err.status === 409) {
      deleteConflictError.value = err.message || 'Không thể xóa thiết bị đã được tham chiếu trong phiếu mượn.';
    } else {
      deleteConflictError.value = err.message || 'Không thể xóa thiết bị này.';
    }
  } finally {
    submitting.value = false;
  }
}

async function handleSwitchToInactive() {
  if (!deletingItem.value) return;

  submitting.value = true;
  try {
    await adminEquipmentService.updateEquipment(deletingItem.value._id, { status: 'inactive' });
    closeDeleteModal();
    fetchEquipment();
  } catch (err) {
    deleteConflictError.value = err.message || 'Không thể cập nhật trạng thái ngưng hoạt động';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchEquipment();
});
</script>

<style scoped>
.admin-equipment-view {
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

.alert-banner-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-icon {
  font-size: 24px;
}

.banner-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-warning-text);
}

.banner-sub {
  font-size: 12px;
  color: var(--color-warning-text);
  opacity: 0.9;
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

.highlight-qty {
  color: var(--color-brand);
  font-size: 14px;
}

.low-stock-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  color: var(--color-danger-text);
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

.stats-preview-box {
  padding: 10px 14px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: 12px;
}

.preview-title {
  font-weight: 700;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 4px;
}

.stats-preview-grid {
  display: flex;
  gap: 20px;
  color: var(--color-text-primary);
}

.form-warning-alert {
  font-size: 12px;
  color: var(--color-warning-text);
  background-color: var(--color-warning-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-warning);
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

.text-danger {
  color: var(--color-danger);
}

.text-info {
  color: var(--color-info-text);
}

.text-right {
  text-align: right;
}

.loading-wrapper, .error-wrapper, .empty-wrapper {
  padding: 40px 0;
}
</style>
