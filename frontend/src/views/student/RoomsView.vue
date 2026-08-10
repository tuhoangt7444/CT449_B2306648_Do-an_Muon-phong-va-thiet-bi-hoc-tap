<template>
  <div class="rooms-view">
    <header class="page-header">
      <h1 class="title">Danh Sách Phòng Tự Học</h1>
      <p class="subtitle">Tra cứu và lựa chọn phòng tự học phù hợp cho nhóm của bạn</p>
    </header>

    <EmptyState
      title="Danh sách phòng đang được chuẩn bị"
      description="Chức năng tra cứu và lọc phòng học chi tiết sẽ được kết nối đầy đủ ở giai đoạn giao diện tiếp theo."
    >
      <template #action>
        <router-link to="/">
          <AppButton variant="secondary">Trở về trang chủ</AppButton>
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
.rooms-view {
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
