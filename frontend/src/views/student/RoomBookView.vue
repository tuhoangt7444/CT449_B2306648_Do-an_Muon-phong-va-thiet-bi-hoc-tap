<template>
  <div class="room-book-view">
    <header class="page-header">
      <h1 class="title">Đăng Ký Mượn Phòng</h1>
    </header>

    <EmptyState
      title="Form đăng ký mượn phòng"
      description="Giao diện đăng ký mượn phòng và chọn thiết bị sẽ được xây dựng ở giai đoạn sau."
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
.room-book-view {
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
