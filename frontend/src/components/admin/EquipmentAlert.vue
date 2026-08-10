<template>
  <div class="equipment-alert-card">
    <div class="card-header">
      <h3 class="card-title">⚠️ Cảnh Báo Tồn Kho Thiết Bị</h3>
      <router-link to="/admin/equipment" class="view-link">Quản lý kho →</router-link>
    </div>

    <div v-if="!alerts || alerts.length === 0" class="empty-alerts">
      <p>🎉 Tất cả thiết bị đều đủ số lượng khả dụng an toàn.</p>
    </div>

    <div v-else class="alerts-list">
      <div v-for="eq in alerts" :key="eq._id" class="alert-item">
        <div class="eq-meta">
          <span class="eq-code">{{ eq.equipmentCode }}</span>
          <span class="eq-name">{{ eq.name }}</span>
        </div>
        <div class="qty-badge-group">
          <span class="qty-badge danger">Còn {{ eq.availableQuantity }} / Ngưỡng {{ eq.lowStockThreshold }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.equipment-alert-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.view-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.eq-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eq-code {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-danger-text);
}

.eq-name {
  font-weight: 600;
  color: var(--color-danger-text);
}

.qty-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-danger-text);
}

.empty-alerts {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-success-text);
}
</style>
