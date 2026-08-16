<template>
  <div class="admin-buildings-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Quản lý Tòa Nhà (Super Admin)</h1>
        <p class="page-subtitle">Thêm mới, cập nhật danh mục tòa nhà và quản lý phân quyền theo khu vực giảng đường CTU</p>
      </div>
      <div class="header-right">
        <AppButton variant="primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm tòa nhà mới
        </AppButton>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="buildingSearch"
            v-model="filters.search"
            placeholder="Tìm theo mã tòa nhà, tên, vị trí..."
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

        <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
          Xóa bộ lọc
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải danh sách tòa nhà..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải danh sách" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchBuildings">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="buildings.length === 0" class="empty-wrapper">
      <EmptyState
        title="Không tìm thấy tòa nhà"
        description="Không có tòa nhà nào phù hợp với bộ lọc hiện tại."
      >
        <template #action>
          <AppButton v-if="hasActiveFilters" variant="secondary" @click="resetFilters">Xóa bộ lọc</AppButton>
          <AppButton v-else variant="primary" @click="openCreateModal">Thêm tòa nhà đầu tiên</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã tòa nhà</th>
              <th>Tên tòa nhà</th>
              <th>Địa điểm / Vị trí</th>
              <th>Quản lý phụ trách</th>
              <th>Trạng thái</th>
              <th class="actions-col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in buildings" :key="item._id">
              <td>
                <span class="code-badge">{{ item.buildingCode }}</span>
              </td>
              <td class="font-medium text-dark">{{ item.name }}</td>
              <td>{{ item.location }}</td>
              <td>
                <div v-if="item.manager" class="manager-info">
                  <span class="manager-name">{{ item.manager.fullName }}</span>
                  <span class="manager-code">({{ item.manager.staffCode }})</span>
                </div>
                <span v-else class="text-muted text-sm">Chưa gán Quản lý</span>
              </td>
              <td>
                <StatusBadge :status="item.status" />
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="icon-btn edit-btn" title="Chỉnh sửa" @click="openEditModal(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="icon-btn delete-btn" title="Xóa" @click="confirmDelete(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal
      :is-open="isModalOpen"
      :title="editingId ? 'Chỉnh Sửa Tòa Nhà' : 'Thêm Tòa Nhà Mới'"
      @close="closeModal"
    >
      <form @submit.prevent="saveBuilding" class="building-form">
        <div v-if="formError" class="form-alert error">
          {{ formError }}
        </div>

        <div class="form-group">
          <label for="buildingCode" class="form-label required">Mã tòa nhà</label>
          <AppInput
            id="buildingCode"
            v-model="form.buildingCode"
            placeholder="Ví dụ: A3, B1, C1..."
            required
            :disabled="!!editingId"
          />
        </div>

        <div class="form-group">
          <label for="buildingName" class="form-label required">Tên tòa nhà</label>
          <AppInput
            id="buildingName"
            v-model="form.name"
            placeholder="Ví dụ: Nhà học A3"
            required
          />
        </div>

        <div class="form-group">
          <label for="buildingLocation" class="form-label required">Địa điểm / Vị trí</label>
          <AppInput
            id="buildingLocation"
            v-model="form.location"
            placeholder="Ví dụ: Khu II Đại học Cần Thơ"
            required
          />
        </div>

        <div class="form-group">
          <label for="buildingDescription" class="form-label">Mô tả</label>
          <textarea
            id="buildingDescription"
            v-model="form.description"
            rows="3"
            class="form-textarea"
            placeholder="Mô tả thông tin chi tiết tòa nhà..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="buildingStatus" class="form-label">Trạng thái</label>
          <AppSelect
            id="buildingStatus"
            v-model="form.status"
            :options="statusModalOptions"
          />
        </div>

        <div class="modal-actions">
          <AppButton variant="secondary" type="button" @click="closeModal">Hủy</AppButton>
          <AppButton variant="primary" type="submit" :loading="saving">
            {{ editingId ? 'Lưu thay đổi' : 'Tạo tòa nhà' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :is-open="isDeleteModalOpen"
      title="Xác nhận xóa Tòa nhà"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-body">
        <p>Bạn có chắc chắn muốn xóa tòa nhà <strong>{{ deletingBuilding?.name }} ({{ deletingBuilding?.buildingCode }})</strong>?</p>
        <div class="modal-actions mt-4">
          <AppButton variant="secondary" @click="closeDeleteModal">Hủy</AppButton>
          <AppButton variant="danger" :loading="deleting" @click="executeDelete">Xác nhận Xóa</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { buildingService } from '@/services/building';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import AppModal from '@/components/common/AppModal.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const buildings = ref([]);
const loading = ref(true);
const error = ref('');

const filters = reactive({
  search: '',
  status: ''
});

const statusFilterOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngưng hoạt động' }
];

const statusModalOptions = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngưng hoạt động' }
];

const hasActiveFilters = computed(() => {
  return !!filters.search || !!filters.status;
});

let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchBuildings();
  }, 300);
};

const applyFilters = () => {
  fetchBuildings();
};

const resetFilters = () => {
  filters.search = '';
  filters.status = '';
  fetchBuildings();
};

const fetchBuildings = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await buildingService.getBuildings({
      search: filters.search,
      status: filters.status
    });
    buildings.value = res.data || [];
  } catch (err) {
    error.value = err.message || 'Không thể lấy dữ liệu tòa nhà';
  } finally {
    loading.value = false;
  }
};

const isModalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  buildingCode: '',
  name: '',
  location: '',
  description: '',
  status: 'active'
});

const openCreateModal = () => {
  editingId.value = null;
  formError.value = '';
  form.buildingCode = '';
  form.name = '';
  form.location = 'Khu II Đại học Cần Thơ';
  form.description = '';
  form.status = 'active';
  isModalOpen.value = true;
};

const openEditModal = (item) => {
  editingId.value = item._id;
  formError.value = '';
  form.buildingCode = item.buildingCode;
  form.name = item.name;
  form.location = item.location;
  form.description = item.description || '';
  form.status = item.status || 'active';
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveBuilding = async () => {
  formError.value = '';
  saving.value = true;
  try {
    if (editingId.value) {
      await buildingService.updateBuilding(editingId.value, {
        name: form.name,
        location: form.location,
        description: form.description,
        status: form.status
      });
    } else {
      await buildingService.createBuilding({
        buildingCode: form.buildingCode,
        name: form.name,
        location: form.location,
        description: form.description,
        status: form.status
      });
    }
    closeModal();
    fetchBuildings();
  } catch (err) {
    formError.value = err.message || 'Lưu tòa nhà thất bại';
  } finally {
    saving.value = false;
  }
};

const isDeleteModalOpen = ref(false);
const deletingBuilding = ref(null);
const deleting = ref(false);

const confirmDelete = (item) => {
  deletingBuilding.value = item;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  deletingBuilding.value = null;
};

const executeDelete = async () => {
  if (!deletingBuilding.value) return;
  deleting.value = true;
  try {
    await buildingService.deleteBuilding(deletingBuilding.value._id);
    closeDeleteModal();
    fetchBuildings();
  } catch (err) {
    alert(err.message || 'Xóa tòa nhà thất bại');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchBuildings();
});
</script>

<style scoped>
.admin-buildings-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.toolbar-card {
  background: var(--color-surface);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input-wrapper {
  flex: 1;
  min-width: 260px;
}

.select-wrapper {
  min-width: 180px;
}

.table-card {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.data-table th,
.data-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-surface-elevated);
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.code-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--color-info-bg);
  color: var(--color-info-text);
  font-weight: 700;
  border-radius: 6px;
  font-family: var(--font-mono);
}

.manager-info {
  display: flex;
  flex-direction: column;
}

.manager-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.manager-code {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.actions-col {
  width: 100px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.icon-btn {
  border: none;
  background: transparent;
  padding: 0.375rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--color-surface-hover);
}

.edit-btn:hover {
  color: var(--color-brand);
}

.delete-btn:hover {
  color: var(--color-danger);
}

.building-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-danger);
}

.form-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.form-textarea:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.form-alert.error {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-text);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.delete-modal-body p {
  color: var(--color-text-primary);
}
</style>
