<template>
  <div class="admin-equipment-view">
    <EmptyState
      title="Quản lý thiết bị học tập"
      description="Giao diện quản lý kho thiết bị và cảnh báo sắp hết sẽ được hoàn thiện ở giai đoạn quản trị."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-equipment-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
