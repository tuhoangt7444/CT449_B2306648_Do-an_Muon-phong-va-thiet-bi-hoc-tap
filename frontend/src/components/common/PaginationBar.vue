<template>
  <div v-if="totalPages > 0" class="pagination-bar">
    <span class="pagination-info">
      Trang {{ activePage }} / {{ totalPages }} (Tổng {{ totalItems }} dữ liệu)
    </span>
    <div class="pagination-buttons">
      <button
        type="button"
        class="pagination-btn nav-btn"
        :disabled="activePage <= 1"
        @click="goToPage(activePage - 1)"
      >
        ← Trang trước
      </button>

      <button
        v-for="pNum in visiblePageNumbers"
        :key="pNum"
        type="button"
        :class="['pagination-btn', 'num-btn', { 'is-active': pNum === activePage }]"
        @click="goToPage(pNum)"
      >
        {{ pNum }}
      </button>

      <button
        type="button"
        class="pagination-btn nav-btn"
        :disabled="activePage >= totalPages"
        @click="goToPage(activePage + 1)"
      >
        Trang sau →
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: {
    type: Number,
    default: null
  },
  currentPage: {
    type: Number,
    default: null
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

const emit = defineEmits(['change-page', 'page-change']);

const activePage = computed(() => {
  if (props.page !== null && props.page !== undefined) return Number(props.page);
  if (props.currentPage !== null && props.currentPage !== undefined) return Number(props.currentPage);
  return 1;
});

const visiblePageNumbers = computed(() => {
  const pages = [];
  const total = props.totalPages || 1;
  const current = activePage.value;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);

  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

function goToPage(targetPage) {
  if (targetPage < 1 || targetPage > props.totalPages || targetPage === activePage.value) return;
  emit('change-page', targetPage);
  emit('page-change', targetPage);
}
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
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.pagination-btn.is-active {
  background-color: var(--color-brand);
  color: #ffffff;
  border-color: var(--color-brand);
  font-weight: 700;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
