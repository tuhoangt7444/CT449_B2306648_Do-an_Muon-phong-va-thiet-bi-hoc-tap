<template>
  <div class="booking-detail-view">
    <header class="page-header">
      <h1 class="title">Chi Tiết Yêu Cầu Mượn Phòng</h1>
    </header>

    <EmptyState
      title="Thông tin chi tiết yêu cầu mượn phòng"
      description="Trang xem chi tiết phiếu mượn và hủy phiếu mượn sẽ được hoàn thiện ở giai đoạn tiếp theo."
    >
      <template #action>
        <router-link to="/my-bookings">
          <AppButton variant="secondary">Quay lại danh sách yêu cầu</AppButton>
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
.booking-detail-view {
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
