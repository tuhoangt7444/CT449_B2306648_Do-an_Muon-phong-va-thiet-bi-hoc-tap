<template>
  <div class="admin-students-view">
    <EmptyState
      title="Quản lý tài khoản sinh viên"
      description="Giao diện danh sách và mở/khóa tài khoản sinh viên sẽ được kết nối ở giai đoạn quản trị."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-students-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
