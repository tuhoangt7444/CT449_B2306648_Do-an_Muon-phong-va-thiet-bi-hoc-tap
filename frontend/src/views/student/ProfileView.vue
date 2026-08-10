<template>
  <div class="profile-view">
    <header class="page-header">
      <h1 class="title">Hồ Sơ Sinh Viên</h1>
    </header>

    <div v-if="authStore.user" class="profile-card">
      <div class="info-group">
        <label class="info-label">Họ và tên:</label>
        <span class="info-value">{{ authStore.user.name }}</span>
      </div>
      <div class="info-group">
        <label class="info-label">Mã số sinh viên:</label>
        <span class="info-value">{{ authStore.user.studentCode }}</span>
      </div>
      <div class="info-group">
        <label class="info-label">Email:</label>
        <span class="info-value">{{ authStore.user.email }}</span>
      </div>
      <div class="info-group">
        <label class="info-label">Lớp / Ngành:</label>
        <span class="info-value">{{ authStore.user.className || 'Chưa cập nhật' }}</span>
      </div>
      <div class="info-group">
        <label class="info-label">Trạng thái tài khoản:</label>
        <StatusBadge :status="authStore.user.status || 'active'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import StatusBadge from '@/components/common/StatusBadge.vue';

const authStore = useAuthStore();
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.profile-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.info-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.info-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
</style>
