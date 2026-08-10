<template>
  <div v-if="totalPages > 0" class="pagination-bar">
    <span class="pagination-info">
      Trang {{ page }} / {{ totalPages }} (Tổng {{ totalItems }} dữ liệu)
    </span>
    <div class="pagination-buttons">
      <button
        type="button"
        class="pagination-btn"
        :disabled="page <= 1"
        @click="$emit('change-page', page - 1)"
      >
        Trang trước
      </button>
      <button
        type="button"
        class="pagination-btn"
        :disabled="page >= totalPages"
        @click="$emit('change-page', page + 1)"
      >
        Trang sau
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  page: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalItems: {
    type: Number,
    default: 0
  }
});

defineEmits(['change-page']);
</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: 16px;
}

.pagination-info {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}

.pagination-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
