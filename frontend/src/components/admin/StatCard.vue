<template>
  <div :class="['stat-card', `variant-${variant}`]">
    <div class="card-inner">
      <span class="stat-title">{{ title }}</span>
      <div class="stat-value">{{ value !== undefined && value !== null ? value : 0 }}</div>
      <p v-if="description" class="stat-desc">{{ description }}</p>
    </div>
    <router-link v-if="to" :to="to" class="card-link">
      Xem chi tiết →
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary'
  },
  to: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.variant-primary::before { background-color: var(--color-brand); }
.variant-warning::before { background-color: var(--color-warning); }
.variant-success::before { background-color: var(--color-success); }
.variant-danger::before { background-color: var(--color-danger); }
.variant-info::before { background-color: var(--color-info); }

.card-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.card-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
  align-self: flex-end;
}
</style>
