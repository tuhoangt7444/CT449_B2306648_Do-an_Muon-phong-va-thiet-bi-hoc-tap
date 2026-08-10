<template>
  <div class="not-found-view">
    <div class="not-found-card">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Không Tìm Thấy Trang</h2>
      <p class="error-desc">Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.</p>
      <div class="actions">
        <router-link to="/">
          <AppButton variant="primary">Trở về Trang chủ</AppButton>
        </router-link>
        <router-link to="/admin">
          <AppButton variant="secondary">Trang Quản trị</AppButton>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppButton from '@/components/common/AppButton.vue';
</script>

<style scoped>
.not-found-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.not-found-card {
  text-align: center;
  max-width: 480px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 48px 32px;
  box-shadow: var(--shadow-md);
}

.error-code {
  font-size: 72px;
  font-weight: 900;
  color: var(--color-brand);
  line-height: 1;
  margin-bottom: 12px;
}

.error-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.error-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
