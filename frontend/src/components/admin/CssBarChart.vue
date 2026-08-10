<template>
  <div class="css-bar-chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="!items || items.length === 0" class="empty-chart">
      <p>Chưa có dữ liệu thống kê.</p>
    </div>

    <div v-else class="bars-container" :aria-label="title">
      <div v-for="(item, idx) in items" :key="idx" class="bar-row">
        <span class="bar-label">{{ item.label }}</span>
        <div class="bar-track">
          <div
            :class="['bar-fill', item.colorClass || 'fill-primary']"
            :style="{ width: `${getPercentage(item.value)}%` }"
            :aria-label="`${item.label}: ${item.value}`"
          ></div>
        </div>
        <span class="bar-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  }
});

const maxVal = computed(() => {
  if (!props.items || props.items.length === 0) return 1;
  const highest = Math.max(...props.items.map(i => Number(i.value) || 0));
  return highest > 0 ? highest : 1;
});

function getPercentage(val) {
  const num = Number(val) || 0;
  return Math.min(100, Math.max(4, Math.round((num / maxVal.value) * 100)));
}
</script>

<style scoped>
.css-bar-chart-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.chart-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.chart-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.chart-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.bars-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  font-weight: 500;
  width: 110px;
  flex-shrink: 0;
  color: var(--color-text-primary);
}

.bar-track {
  flex: 1;
  height: 18px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width var(--transition-normal);
}

.fill-primary { background-color: var(--color-brand); }
.fill-warning { background-color: var(--color-warning); }
.fill-success { background-color: var(--color-success); }
.fill-danger { background-color: var(--color-danger); }
.fill-info { background-color: var(--color-info); }
.fill-secondary { background-color: var(--color-border-strong); }

.bar-value {
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-mono);
  width: 36px;
  text-align: right;
  color: var(--color-text-primary);
}

.empty-chart {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
