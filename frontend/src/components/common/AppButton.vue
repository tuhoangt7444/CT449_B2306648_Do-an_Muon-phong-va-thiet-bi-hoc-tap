<template>
  <button
    :type="type"
    :class="[
      'app-button',
      `variant-${variant}`,
      `size-${size}`,
      { 'is-block': block, 'is-loading': loading }
    ]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner"></span>
    <span class="button-content" :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary'
  },
  type: {
    type: String,
    default: 'button'
  },
  size: {
    type: String,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.app-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}

.size-sm {
  padding: 6px 12px;
  font-size: 13px;
  height: 32px;
}

.size-md {
  padding: 8px 16px;
  font-size: 14px;
  height: 40px;
}

.size-lg {
  padding: 12px 24px;
  font-size: 16px;
  height: 48px;
}

.variant-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  border: 1px solid transparent;
}

.variant-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.variant-secondary {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
}

.variant-secondary:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}

.variant-success {
  background-color: var(--color-success, #16a34a);
  color: #ffffff;
  border: 1px solid transparent;
}

.variant-success:hover:not(:disabled) {
  background-color: #15803d;
}

.variant-danger {
  background-color: var(--color-danger);
  color: #ffffff;
  border: 1px solid transparent;
}

.variant-danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.variant-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
}

.variant-ghost:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.is-block {
  width: 100%;
}

.app-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.opacity-0 {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
