<template>
  <div class="admin-reviews-view">
    <EmptyState
      title="Quản lý đánh giá phòng học"
      description="Giao diện xem và quản trị xóa đánh giá vi phạm sẽ được kết nối ở giai đoạn sau."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-reviews-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
