<template>
  <span :class="['status-badge', `status-${status}`]">
    {{ statusLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  }
});

const statusMap = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
  in_use: 'Đang sử dụng',
  completed: 'Hoàn thành',
  available: 'Khả dụng',
  maintenance: 'Bảo trì',
  inactive: 'Ngưng hoạt động'
};

const statusLabel = computed(() => statusMap[props.status] || props.status);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.status-pending {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-approved {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.status-rejected {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.status-cancelled {
  background-color: var(--color-surface-elevated);
  color: var(--color-text-muted);
}

.status-in_use {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.status-completed, .status-available {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-maintenance {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-inactive {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}
</style>
