<template>
  <div class="admin-bookings-view">
    <EmptyState
      title="Quản lý yêu cầu mượn phòng"
      description="Bảng danh sách và quy trình duyệt, từ chối, check-in, hoàn thành phiếu mượn sẽ được kết nối ở giai đoạn quản trị."
    />
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-bookings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
