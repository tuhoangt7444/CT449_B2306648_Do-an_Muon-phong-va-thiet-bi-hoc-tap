<template>
  <div class="admin-students-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Quản lý Sinh Viên</h1>
        <p class="page-subtitle">Quản lý danh sách tài khoản sinh viên, phân khoa và trạng thái truy cập hệ thống</p>
      </div>
      <div class="header-right">
        <AppButton variant="primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm sinh viên mới
        </AppButton>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <AppInput
            id="studentSearch"
            v-model="filters.search"
            placeholder="Tìm theo MSSV, họ tên, email, khoa..."
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
      <LoadingState message="Đang tải danh sách sinh viên..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <EmptyState title="Không thể tải danh sách sinh viên" :description="error">
        <template #action>
          <AppButton variant="secondary" @click="fetchStudents">Thử lại</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="students.length === 0" class="empty-wrapper">
      <EmptyState title="Không tìm thấy sinh viên nào" description="Thử thay đổi bộ lọc tìm kiếm hoặc thêm sinh viên mới.">
        <template #action>
          <AppButton variant="primary" @click="openCreateModal">Thêm sinh viên mới</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã sinh viên</th>
            <th>Họ và tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Khoa / Viện</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student._id">
            <td class="font-mono font-bold">{{ student.studentCode }}</td>
            <td class="font-semibold">{{ student.fullName }}</td>
            <td>{{ student.email }}</td>
            <td class="text-muted">{{ student.phone || '-' }}</td>
            <td class="text-muted">{{ student.faculty || 'Chưa cập nhật' }}</td>
            <td>
              <StatusBadge :status="student.status" />
            </td>
            <td class="text-sm text-muted">{{ formatDateVN(student.createdAt) }}</td>
            <td class="text-right actions-cell">
              <AppButton size="sm" variant="secondary" @click="openEditModal(student)">Sửa</AppButton>
              <AppButton size="sm" variant="danger" @click="openDeleteModal(student)">Xóa</AppButton>
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
      :title="isEditMode ? `Chỉnh sửa sinh viên #${editingCode}` : 'Thêm sinh viên mới'"
      @close="closeFormModal"
    >
      <form class="modal-form" @submit.prevent="handleSaveStudent">
        <div class="form-grid">
          <AppInput
            id="formStudentCode"
            v-model="form.studentCode"
            label="Mã số sinh viên (MSSV)"
            placeholder="Ví dụ: B2300001"
            :error="formErrors.studentCode"
            required
          />

          <AppInput
            id="formFullName"
            v-model="form.fullName"
            label="Họ và tên"
            placeholder="Ví dụ: Nguyễn Văn A"
            :error="formErrors.fullName"
            required
          />
        </div>

        <div class="form-grid">
          <AppInput
            id="formEmail"
            v-model="form.email"
            type="email"
            label="Địa chỉ Email"
            placeholder="Ví dụ: student@ctu.edu.vn"
            :error="formErrors.email"
            required
          />

          <AppInput
            id="formPhone"
            v-model="form.phone"
            label="Số điện thoại"
            placeholder="Ví dụ: 0912345678"
            :error="formErrors.phone"
          />
        </div>

        <div class="form-grid">
          <AppInput
            id="formFaculty"
            v-model="form.faculty"
            label="Khoa / Viện đào tạo"
            placeholder="Ví dụ: Công nghệ Thông tin & Truyền thông"
            :error="formErrors.faculty"
          />

          <AppSelect
            id="formStatus"
            v-model="form.status"
            label="Trạng thái tài khoản"
            :options="formStatusOptions"
          />
        </div>

        <div class="form-group">
          <AppInput
            id="formPassword"
            v-model="form.password"
            type="password"
            :label="isEditMode ? 'Mật khẩu mới (Bỏ trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập'"
            placeholder="Mật khẩu ít nhất 6 ký tự"
            :error="formErrors.password"
            :required="!isEditMode"
          />
        </div>

        <p v-if="formGeneralError" class="form-error-alert">{{ formGeneralError }}</p>

        <div class="modal-footer">
          <AppButton type="button" variant="secondary" @click="closeFormModal">Hủy</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting">
            {{ isEditMode ? 'Lưu cập nhật' : 'Tạo sinh viên' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :is-open="isDeleteModalOpen"
      title="Xác nhận xóa tài khoản sinh viên"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-content">
        <p v-if="deletingStudent">
          Bạn có chắc chắn muốn xóa sinh viên <strong>{{ deletingStudent.fullName }} ({{ deletingStudent.studentCode }})</strong>?
        </p>

        <div v-if="deleteConflictError" class="conflict-warning-box">
          <h4 class="warning-title">⚠️ Không thể xóa sinh viên:</h4>
          <p class="warning-text">{{ deleteConflictError }}</p>
          <p class="warning-sub">Bạn có muốn chuyển trạng thái tài khoản sang <strong>"Ngưng hoạt động" (inactive)</strong> để khóa quyền truy cập không?</p>
          <div class="warning-action">
            <AppButton variant="warning" size="sm" :loading="submitting" @click="handleSwitchToInactive">
              Chuyển sang Ngưng hoạt động (inactive)
            </AppButton>
          </div>
        </div>

        <div class="modal-footer">
          <AppButton variant="secondary" @click="closeDeleteModal">Đóng</AppButton>
          <AppButton v-if="!deleteConflictError" variant="danger" :loading="submitting" @click="confirmDeleteStudent">
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
import { adminStudentService } from '@/services/adminStudent';
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
const students = ref([]);

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
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngưng hoạt động' }
];

const formStatusOptions = [
  { value: 'active', label: 'Hoạt động (active)' },
  { value: 'inactive', label: 'Ngưng hoạt động (inactive)' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'studentCode', label: 'Mã sinh viên (A-Z)' },
  { value: 'fullName', label: 'Họ tên (A-Z)' },
  { value: 'faculty', label: 'Khoa / Viện' }
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
  fetchStudents();
}

let activeAbortController = null;

async function fetchStudents() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  error.value = '';
  try {
    const res = await adminStudentService.getStudents({
      search: filters.search,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: pagination.page,
      limit: pagination.limit
    }, activeAbortController.signal);

    if (res && res.data) {
      students.value = res.data;
      if (res.pagination) {
        pagination.page = res.pagination.page;
        pagination.limit = res.pagination.limit;
        pagination.totalItems = res.pagination.totalItems;
        pagination.totalPages = res.pagination.totalPages;
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || 'Không thể tải danh sách sinh viên';
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

const form = reactive({
  studentCode: '',
  fullName: '',
  email: '',
  phone: '',
  faculty: '',
  password: '',
  status: 'active'
});

const formErrors = reactive({
  studentCode: '',
  fullName: '',
  email: '',
  password: ''
});

function openCreateModal() {
  isEditMode.value = false;
  editingId.value = null;
  editingCode.value = '';
  form.studentCode = '';
  form.fullName = '';
  form.email = '';
  form.phone = '';
  form.faculty = '';
  form.password = '';
  form.status = 'active';
  clearFormErrors();
  isFormModalOpen.value = true;
}

function openEditModal(student) {
  isEditMode.value = true;
  editingId.value = student._id;
  editingCode.value = student.studentCode;
  form.studentCode = student.studentCode;
  form.fullName = student.fullName;
  form.email = student.email;
  form.phone = student.phone || '';
  form.faculty = student.faculty || '';
  form.password = '';
  form.status = student.status || 'active';
  clearFormErrors();
  isFormModalOpen.value = true;
}

function closeFormModal() {
  isFormModalOpen.value = false;
}

function clearFormErrors() {
  formErrors.studentCode = '';
  formErrors.fullName = '';
  formErrors.email = '';
  formErrors.password = '';
  formGeneralError.value = '';
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm() {
  clearFormErrors();
  let isValid = true;

  if (!form.studentCode || !form.studentCode.trim()) {
    formErrors.studentCode = 'Mã sinh viên là bắt buộc';
    isValid = false;
  }
  if (!form.fullName || !form.fullName.trim()) {
    formErrors.fullName = 'Họ và tên sinh viên là bắt buộc';
    isValid = false;
  }
  if (!form.email || !form.email.trim() || !emailRegex.test(form.email.trim())) {
    formErrors.email = 'Email không hợp lệ';
    isValid = false;
  }
  if (!isEditMode.value) {
    if (!form.password || form.password.length < 6) {
      formErrors.password = 'Mật khẩu là bắt buộc và phải có ít nhất 6 ký tự';
      isValid = false;
    }
  } else if (form.password && form.password.length < 6) {
    formErrors.password = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    isValid = false;
  }

  return isValid;
}

async function handleSaveStudent() {
  if (!validateForm()) return;

  submitting.value = true;
  formGeneralError.value = '';

  const payload = {
    studentCode: form.studentCode.trim(),
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone ? form.phone.trim() : '',
    faculty: form.faculty ? form.faculty.trim() : '',
    status: form.status
  };

  if (form.password) {
    payload.password = form.password;
  }

  try {
    if (isEditMode.value) {
      await adminStudentService.updateStudent(editingId.value, payload);
    } else {
      await adminStudentService.createStudent(payload);
    }
    closeFormModal();
    fetchStudents();
  } catch (err) {
    if (err.status === 409) {
      const msg = err.message || 'Mã sinh viên hoặc Email đã tồn tại';
      if (msg.toLowerCase().includes('email')) {
        formErrors.email = msg;
      } else {
        formErrors.studentCode = msg;
      }
    } else {
      formGeneralError.value = err.message || 'Không thể lưu thông tin sinh viên';
    }
  } finally {
    submitting.value = false;
  }
}

const isDeleteModalOpen = ref(false);
const deletingStudent = ref(null);
const deleteConflictError = ref('');

function openDeleteModal(student) {
  deletingStudent.value = student;
  deleteConflictError.value = '';
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  deletingStudent.value = null;
  deleteConflictError.value = '';
}

async function confirmDeleteStudent() {
  if (!deletingStudent.value) return;

  submitting.value = true;
  deleteConflictError.value = '';
  try {
    await adminStudentService.deleteStudent(deletingStudent.value._id);
    closeDeleteModal();
    if (students.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }
    fetchStudents();
  } catch (err) {
    if (err.status === 409) {
      deleteConflictError.value = err.message || 'Không thể xóa sinh viên đã có lịch mượn tham chiếu.';
    } else {
      deleteConflictError.value = err.message || 'Không thể xóa tài khoản sinh viên này.';
    }
  } finally {
    submitting.value = false;
  }
}

async function handleSwitchToInactive() {
  if (!deletingStudent.value) return;

  submitting.value = true;
  try {
    await adminStudentService.updateStudent(deletingStudent.value._id, { status: 'inactive' });
    closeDeleteModal();
    fetchStudents();
  } catch (err) {
    deleteConflictError.value = err.message || 'Không thể cập nhật trạng thái ngưng hoạt động';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.admin-students-view {
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
