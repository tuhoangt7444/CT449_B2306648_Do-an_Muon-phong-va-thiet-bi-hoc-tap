<template>
  <div class="profile-view">
    <header class="page-header">
      <h1 class="title">Hồ Sơ Sinh Viên</h1>
      <p class="subtitle">Thông tin tài khoản đã đăng ký trên hệ thống StudyHub CTU</p>
    </header>

    <div class="profile-card">
      <div class="profile-header-banner">
        <div class="avatar-circle">
          {{ (authStore.user?.name || authStore.user?.studentCode || 'S').charAt(0).toUpperCase() }}
        </div>
        <div class="user-main-info">
          <h2 class="user-name">{{ authStore.user?.name || 'Sinh viên' }}</h2>
          <span class="user-code">MSSV: {{ authStore.user?.studentCode }}</span>
        </div>
      </div>

      <div class="profile-details-grid">
        <div class="detail-item">
          <span class="detail-label">Mã số sinh viên (MSSV):</span>
          <span class="detail-value font-mono">{{ authStore.user?.studentCode }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Họ và tên:</span>
          <span class="detail-value">{{ authStore.user?.name }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Địa chỉ Email:</span>
          <span class="detail-value">{{ authStore.user?.email || 'Chưa cập nhật' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Số điện thoại:</span>
          <span class="detail-value">{{ authStore.user?.phone || 'Chưa cập nhật' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Khoa / Đơn vị:</span>
          <span class="detail-value">{{ authStore.user?.department || 'Trường Công nghệ Thông tin & Truyền thông' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Trạng thái tài khoản:</span>
          <span class="detail-value status-badge-active">Hoạt động bình thường</span>
        </div>
      </div>

      <div class="profile-actions">
        <AppButton variant="secondary" @click="handleRefreshProfile">
          Làm mới thông tin
        </AppButton>
        <AppButton variant="danger" @click="handleLogout">
          Đăng xuất tài khoản
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppButton from '@/components/common/AppButton.vue';

const router = useRouter();
const authStore = useAuthStore();

async function handleRefreshProfile() {
  await authStore.fetchCurrentUser();
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.profile-view {
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

.profile-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-header-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-brand);
  color: #ffffff;
  font-size: 28px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.user-code {
  font-size: 14px;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.profile-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.detail-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.font-mono {
  font-family: var(--font-mono);
}

.status-badge-active {
  color: var(--color-success-text);
  font-weight: 700;
}

.profile-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 576px) {
  .profile-header-banner {
    flex-direction: column;
    text-align: center;
  }
  .profile-actions {
    flex-direction: column;
  }
}
</style>
