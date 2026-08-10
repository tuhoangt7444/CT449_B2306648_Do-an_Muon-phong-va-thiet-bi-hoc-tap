<template>
  <div class="booking-summary-card">
    <div class="summary-header">
      <h3 class="summary-title">Xác Nhận Thông Tin Đăng Ký</h3>
      <p class="summary-subtitle">Vui lòng kiểm tra kỹ thông tin trước khi gửi yêu cầu mượn phòng</p>
    </div>

    <div class="summary-sections">
      <div class="section-box">
        <div class="box-header">
          <h4 class="box-title">1. Thông tin Phòng học & Thời gian</h4>
          <button type="button" class="edit-btn" @click="$emit('go-step', 1)">Sửa ✏️</button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Phòng học:</span>
            <span class="value">{{ room?.name }} ({{ room?.roomCode }})</span>
          </div>
          <div class="info-item">
            <span class="label">Vị trí:</span>
            <span class="value">{{ room?.location }}</span>
          </div>
          <div class="info-item">
            <span class="label">Ngày mượn:</span>
            <span class="valueHighlight">{{ formatDateVN(form.date) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Khung giờ:</span>
            <span class="valueHighlight">{{ form.startTimeStr }} - {{ form.endTimeStr }}</span>
          </div>
        </div>
      </div>

      <div class="section-box">
        <div class="box-header">
          <h4 class="box-title">2. Thông tin Nhu cầu & Số lượng</h4>
          <button type="button" class="edit-btn" @click="$emit('go-step', 1)">Sửa ✏️</button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Mục đích mượn:</span>
            <span class="value">{{ form.purpose }}</span>
          </div>
          <div class="info-item">
            <span class="label">Số người sử dụng:</span>
            <span class="value">{{ form.numberOfPeople }} người (Sức chứa tối đa: {{ room?.capacity }})</span>
          </div>
          <div v-if="form.studentNote" class="info-item full-width">
            <span class="label">Ghi chú của sinh viên:</span>
            <span class="value">{{ form.studentNote }}</span>
          </div>
        </div>
      </div>

      <div class="section-box">
        <div class="box-header">
          <h4 class="box-title">3. Thiết bị đi kèm đã chọn</h4>
          <button type="button" class="edit-btn" @click="$emit('go-step', 2)">Sửa ✏️</button>
        </div>
        <div v-if="selectedEquipmentItems.length === 0" class="no-equipment">
          <p>Không đăng ký mượn thiết bị đi kèm.</p>
        </div>
        <div v-else class="equipment-list">
          <div v-for="eq in selectedEquipmentItems" :key="eq._id" class="eq-summary-item">
            <span class="eq-name">{{ eq.name }} ({{ eq.equipmentCode }})</span>
            <span class="eq-qty">Số lượng: <strong>{{ eq.selectedQty }}</strong></span>
          </div>
        </div>
      </div>

      <div class="status-notice">
        <p>ℹ️ Yêu cầu của bạn sau khi gửi sẽ ở trạng thái <strong>Chờ duyệt (Pending)</strong> và chờ Nhân viên phê duyệt.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateVN } from '@/utils/date';

const props = defineProps({
  room: {
    type: Object,
    default: null
  },
  form: {
    type: Object,
    required: true
  },
  equipmentList: {
    type: Array,
    default: () => []
  }
});

defineEmits(['go-step']);

const selectedEquipmentItems = computed(() => {
  if (!props.form.equipmentMap) return [];
  const items = [];
  Object.keys(props.form.equipmentMap).forEach(eqId => {
    const qty = props.form.equipmentMap[eqId];
    if (qty > 0) {
      const eqDoc = props.equipmentList.find(e => e._id === eqId);
      items.push({
        _id: eqId,
        name: eqDoc ? eqDoc.name : 'Thiết bị',
        equipmentCode: eqDoc ? eqDoc.equipmentCode : 'EQ',
        selectedQty: qty
      });
    }
  });
  return items;
});
</script>

<style scoped>
.booking-summary-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

}

.summary-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.summary-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.summary-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.summary-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-box {
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.box-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.edit-btn {
  font-size: 12px;
  color: var(--color-brand);
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 14px;
}

.full-width {
  grid-column: span 2;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.valueHighlight {
  font-weight: 700;
  color: var(--color-brand);
}

.no-equipment {
  font-size: 13px;
  color: var(--color-text-muted);
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eq-summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.eq-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.status-notice {
  padding: 12px 16px;
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border-radius: var(--radius-md);
  font-size: 13px;
}

@media (max-width: 576px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>
