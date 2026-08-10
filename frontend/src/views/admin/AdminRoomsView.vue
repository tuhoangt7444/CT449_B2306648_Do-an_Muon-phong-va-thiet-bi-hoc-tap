<template>
  <div class="admin-rooms-view">
    <EmptyState
      title="Quản lý phòng học"
      description="Giao diện CRUD thêm, sửa, ngưng hoạt động phòng học sẽ được kết nối ở giai đoạn quản trị."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-rooms-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
