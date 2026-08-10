<template>
  <div class="admin-calendar-view">
    <EmptyState
      title="Lịch mượn phòng học tổng quan"
      description="Giao diện xem lịch sử dụng phòng trực quan dạng Calendar sẽ được phát triển ở giai đoạn tiếp theo."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-calendar-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
