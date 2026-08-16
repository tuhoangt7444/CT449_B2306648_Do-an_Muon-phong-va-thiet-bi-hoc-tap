<template>
  <div class="admin-building-managers-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Quản lý Nhân Viên Tòa Nhà (Super Admin)</h1>
        <p class="page-subtitle">Quản lý các tài khoản Quản lý Tòa nhà (Building Manager) và phân công tòa nhà phụ trách</p>
      </div>
      <div class="header-right">
        <AppButton variant="primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm Quản lý Tòa nhà
        </AppButton>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="managerSearch"
            v-model="filters.search"
            placeholder="Tìm theo mã NV, họ tên, email..."
            @input="handleSearchInput"
          />
        </div>

        <div class="select-wrapper">
          <AppSelect
            id="buildingFilter"
            v-model="filters.buildingId"
            :options="buildingFilterOptions"
            @change="applyFilters"
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
      <LoadingState message="Đang tải danh sách Quản lý Tòa nhà..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải danh sách" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchManagers">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="managers.length === 0" class="empty-wrapper">
      <EmptyState
        title="Không tìm thấy Quản lý Tòa nhà"
        description="Chưa có tài khoản Quản lý Tòa nhà nào phù hợp."
      >
        <template #action>
          <AppButton v-if="hasActiveFilters" variant="secondary" @click="resetFilters">Xóa bộ lọc</AppButton>
          <AppButton v-else variant="primary" @click="openCreateModal">Tạo Quản lý đầu tiên</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Tòa nhà phụ trách</th>
              <th>Trạng thái</th>
              <th class="actions-col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in managers" :key="item._id">
              <td>
                <span class="code-badge">{{ item.staffCode }}</span>
              </td>
              <td class="font-medium text-dark">{{ item.fullName }}</td>
              <td>{{ item.email }}</td>
              <td>
                <span v-if="item.building" class="building-badge">
                  {{ item.building.name }} ({{ item.building.buildingCode }})
                </span>
                <span v-else class="text-muted text-sm">Chưa phân công</span>
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
      :title="editingId ? 'Chỉnh Sửa Quản Lý Tòa Nhà' : 'Thêm Quản Lý Tòa Nhà Mới'"
      @close="closeModal"
    >
      <form @submit.prevent="saveManager" class="manager-form">
        <div v-if="formError" class="form-alert error">
          {{ formError }}
        </div>

        <div class="form-group">
          <label for="staffCode" class="form-label required">Mã nhân viên</label>
          <AppInput
            id="staffCode"
            v-model="form.staffCode"
            placeholder="Ví dụ: QLA3, QLB1..."
            required
            :disabled="!!editingId"
          />
        </div>

        <div class="form-group">
          <label for="fullName" class="form-label required">Họ và tên</label>
          <AppInput
            id="fullName"
            v-model="form.fullName"
            placeholder="Ví dụ: Nguyễn Văn Quản Lý"
            required
          />
        </div>

        <div class="form-group">
          <label for="email" class="form-label required">Email CTU</label>
          <AppInput
            id="email"
            v-model="form.email"
            type="email"
            placeholder="quanly.a3@ctu.edu.vn"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label" :class="{ required: !editingId }">
            {{ editingId ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu' }}
          </label>
          <AppInput
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Nhập mật khẩu"
            :required="!editingId"
          />
        </div>

        <div class="form-group">
          <label for="managerBuilding" class="form-label required">Tòa nhà phụ trách (Tối đa 1 Quản lý / Tòa)</label>
          <AppSelect
            id="managerBuilding"
            v-model="form.buildingId"
            :options="buildingModalOptions"
            required
          />
        </div>

        <div class="form-group">
          <label for="managerStatus" class="form-label">Trạng thái tài khoản</label>
          <AppSelect
            id="managerStatus"
            v-model="form.status"
            :options="statusModalOptions"
          />
        </div>

        <div class="modal-actions">
          <AppButton variant="secondary" type="button" @click="closeModal">Hủy</AppButton>
          <AppButton variant="primary" type="submit" :loading="saving">
            {{ editingId ? 'Lưu thay đổi' : 'Tạo Quản lý' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :is-open="isDeleteModalOpen"
      title="Xác nhận xóa tài khoản Quản lý"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-body">
        <p>Bạn có chắc chắn muốn xóa tài khoản Quản lý <strong>{{ deletingManager?.fullName }} ({{ deletingManager?.staffCode }})</strong>?</p>
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
import { buildingManagerService } from '@/services/buildingManager';
import { buildingService } from '@/services/building';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import AppModal from '@/components/common/AppModal.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const managers = ref([]);
const buildings = ref([]);
const loading = ref(true);
const error = ref('');

const filters = reactive({
  search: '',
  buildingId: '',
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

const buildingFilterOptions = computed(() => {
  const opts = [{ value: '', label: 'Tất cả tòa nhà' }];
  buildings.value.forEach(b => {
    opts.push({ value: b._id, label: `${b.name} (${b.buildingCode})` });
  });
  return opts;
});

const buildingModalOptions = computed(() => {
  const opts = [{ value: '', label: '-- Chọn tòa nhà phụ trách --' }];
  buildings.value.forEach(b => {
    const isAssignedToOther = b.manager && (!editingId.value || b.manager._id !== editingId.value);
    opts.push({
      value: b._id,
      label: `${b.name} (${b.buildingCode})${isAssignedToOther ? ' - Đã có QL' : ''}`
    });
  });
  return opts;
});

const hasActiveFilters = computed(() => {
  return !!filters.search || !!filters.buildingId || !!filters.status;
});

let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchManagers();
  }, 300);
};

const applyFilters = () => {
  fetchManagers();
};

const resetFilters = () => {
  filters.search = '';
  filters.buildingId = '';
  filters.status = '';
  fetchManagers();
};

const fetchBuildings = async () => {
  try {
    const res = await buildingService.getBuildings({ limit: 100 });
    buildings.value = res.data || [];
  } catch (err) {
  }
};

const fetchManagers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await buildingManagerService.getManagers({
      search: filters.search,
      buildingId: filters.buildingId,
      status: filters.status
    });
    managers.value = res.data || [];
  } catch (err) {
    error.value = err.message || 'Không thể lấy danh sách Quản lý Tòa nhà';
  } finally {
    loading.value = false;
  }
};

const isModalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  staffCode: '',
  fullName: '',
  email: '',
  password: '',
  buildingId: '',
  status: 'active'
});

const openCreateModal = () => {
  editingId.value = null;
  formError.value = '';
  form.staffCode = '';
  form.fullName = '';
  form.email = '';
  form.password = '';
  form.buildingId = '';
  form.status = 'active';
  isModalOpen.value = true;
};

const openEditModal = (item) => {
  editingId.value = item._id;
  formError.value = '';
  form.staffCode = item.staffCode;
  form.fullName = item.fullName;
  form.email = item.email;
  form.password = '';
  form.buildingId = item.buildingId || (item.building ? item.building._id : '');
  form.status = item.status || 'active';
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveManager = async () => {
  formError.value = '';
  saving.value = true;
  try {
    const payload = {
      fullName: form.fullName,
      email: form.email,
      buildingId: form.buildingId,
      status: form.status
    };
    if (form.password) {
      payload.password = form.password;
    }

    if (editingId.value) {
      await buildingManagerService.updateManager(editingId.value, payload);
    } else {
      payload.staffCode = form.staffCode;
      await buildingManagerService.createManager(payload);
    }
    closeModal();
    fetchBuildings();
    fetchManagers();
  } catch (err) {
    formError.value = err.message || 'Lưu thông tin Quản lý thất bại';
  } finally {
    saving.value = false;
  }
};

const isDeleteModalOpen = ref(false);
const deletingManager = ref(null);
const deleting = ref(false);

const confirmDelete = (item) => {
  deletingManager.value = item;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  deletingManager.value = null;
};

const executeDelete = async () => {
  if (!deletingManager.value) return;
  deleting.value = true;
  try {
    await buildingManagerService.deleteManager(deletingManager.value._id);
    closeDeleteModal();
    fetchBuildings();
    fetchManagers();
  } catch (err) {
    alert(err.message || 'Xóa Quản lý thất bại');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchBuildings();
  fetchManagers();
});
</script>

<style scoped>
.admin-building-managers-view {
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
  min-width: 240px;
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

.building-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--color-success-bg);
  color: var(--color-success-text);
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--color-success);
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

.manager-form {
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
