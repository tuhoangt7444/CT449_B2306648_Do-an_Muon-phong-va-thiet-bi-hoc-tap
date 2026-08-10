<template>
  <div class="room-detail-view">
    <header class="page-header">
      <h1 class="title">Chi Tiết Phòng Học</h1>
    </header>

    <EmptyState
      title="Thông tin chi tiết phòng học"
      description="Trang xem chi tiết thông tin, tiện nghi và lịch trống của phòng sẽ được kết nối ở giai đoạn tiếp theo."
    >
      <template #action>
        <router-link to="/rooms">
          <AppButton variant="secondary">Quay lại danh sách phòng</AppButton>
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
.room-detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}
</style>
