<template>
  <div class="my-bookings-view">
    <header class="page-header">
      <h1 class="title">Danh Sách Yêu Cầu Của Tôi</h1>
      <p class="subtitle">Theo dõi trạng thái các yêu cầu mượn phòng tự học đã gửi</p>
    </header>

    <EmptyState
      title="Chưa có yêu cầu mượn phòng"
      description="Giao diện danh sách và bộ lọc lịch sử mượn phòng của sinh viên sẽ được kết nối ở giai đoạn sau."
    >
      <template #action>
        <router-link to="/rooms">
          <AppButton variant="primary">Đăng ký mượn phòng ngay</AppButton>
        </router-link>
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';
</script>

<style scoped>
.my-bookings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  margin-bottom: 8px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
