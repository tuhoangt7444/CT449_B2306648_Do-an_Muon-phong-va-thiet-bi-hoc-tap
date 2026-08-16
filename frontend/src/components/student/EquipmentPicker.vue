<template>
  <div class="equipment-picker-card">
    <div class="picker-header">
      <h3 class="picker-title">Chọn Thiết Bị Đi Kèm (Tùy Chọn)</h3>
      <p class="picker-subtitle">Số lượng khả dụng được tính chính xác cho khoảng thời gian mượn đã chọn tại tòa nhà này</p>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang kiểm tra số lượng thiết bị khả dụng..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchEquipment">Thử lại</AppButton>
    </div>

    <div v-else-if="equipmentList.length === 0" class="empty-wrapper">
      <EmptyState title="Không có thiết bị khả dụng" description="Hiện tại không có thiết bị sẵn sàng thuộc tòa nhà này trong khung giờ đã chọn." />
    </div>

    <div v-else class="equipment-grid">
      <div
        v-for="item in equipmentList"
        :key="item._id"
        :class="['equipment-item-card', { 'is-out-of-stock': item.availableQuantity === 0 }]"
      >
        <div class="item-header">
          <span class="item-code">{{ item.equipmentCode }}</span>
          <span :class="['stock-badge', item.availableQuantity > 0 ? 'in-stock' : 'out-stock']">
            {{ item.availableQuantity > 0 ? `Còn ${item.availableQuantity} khả dụng` : 'Tạm hết' }}
          </span>
        </div>

        <h4 class="item-name">{{ item.name }}</h4>
        <p v-if="item.description" class="item-desc">{{ item.description }}</p>

        <div class="quantity-control">
          <button
            type="button"
            class="qty-btn"
            :disabled="getQuantity(item._id) <= 0"
            @click="updateQty(item._id, getQuantity(item._id) - 1, item.availableQuantity)"
          >
            -
          </button>
          <input
            type="number"
            min="0"
            :max="item.availableQuantity"
            :value="getQuantity(item._id)"
            :disabled="item.availableQuantity === 0"
            class="qty-input"
            @input="handleInputQty(item._id, $event.target.value, item.availableQuantity)"
          />
          <button
            type="button"
            class="qty-btn"
            :disabled="getQuantity(item._id) >= item.availableQuantity || item.availableQuantity === 0"
            @click="updateQty(item._id, getQuantity(item._id) + 1, item.availableQuantity)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { bookingService } from '@/services/booking';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps({
  startTimeISO: {
    type: String,
    required: true
  },
  endTimeISO: {
    type: String,
    required: true
  },
  buildingId: {
    type: String,
    default: ''
  },
  selectedEquipmentMap: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update-equipment', 'equipment-loaded']);

const loading = ref(false);
const error = ref('');
const equipmentList = ref([]);
const selections = reactive({ ...props.selectedEquipmentMap });

watch([() => props.startTimeISO, () => props.endTimeISO, () => props.buildingId], () => {
  fetchEquipment();
});

async function fetchEquipment() {
  if (!props.startTimeISO || !props.endTimeISO) return;
  loading.value = true;
  error.value = '';
  try {
    const params = {
      startTime: props.startTimeISO,
      endTime: props.endTimeISO,
      status: 'available',
      limit: 100
    };
    if (props.buildingId) {
      params.buildingId = props.buildingId;
    }

    const res = await bookingService.getEquipment(params);
    if (res && res.data) {
      equipmentList.value = res.data;
      emit('equipment-loaded', [...res.data]);
      adjustSelections();
    }
  } catch (err) {
    error.value = err.message || 'Không thể lấy danh sách thiết bị';
  } finally {
    loading.value = false;
  }
}

function adjustSelections() {
  let changed = false;
  equipmentList.value.forEach(item => {
    const currentQty = selections[item._id] || 0;
    if (currentQty > item.availableQuantity) {
      selections[item._id] = item.availableQuantity;
      changed = true;
    }
  });
  if (changed) {
    emit('update-equipment', { ...selections });
  }
}

function getQuantity(eqId) {
  return selections[eqId] || 0;
}

function updateQty(eqId, newQty, maxQty) {
  const validQty = Math.max(0, Math.min(newQty, maxQty));
  if (validQty === 0) {
    delete selections[eqId];
  } else {
    selections[eqId] = validQty;
  }
  emit('update-equipment', { ...selections });
}

function handleInputQty(eqId, valStr, maxQty) {
  const num = parseInt(valStr, 10);
  const qty = isNaN(num) ? 0 : num;
  updateQty(eqId, qty, maxQty);
}

onMounted(() => {
  fetchEquipment();
});
</script>

<style scoped>
.equipment-picker-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.picker-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.picker-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.picker-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.equipment-item-card {
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-item-card.is-out-of-stock {
  opacity: 0.6;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-code {
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.stock-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.stock-badge.in-stock {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.stock-badge.out-stock {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.quantity-control {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input {
  width: 48px;
  height: 32px;
  text-align: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
}

.loading-wrapper, .error-wrapper, .empty-wrapper {
  padding: 32px 0;
  text-align: center;
}
</style>
