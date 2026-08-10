<template>
  <div class="admin-booking-detail-view">
    <EmptyState
      title="Chi tiết yêu cầu mượn phòng (Quản trị)"
      description="Trang xem và thao tác duyệt phiếu mượn chi tiết sẽ được phát triển ở giai đoạn quản trị."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-booking-detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
