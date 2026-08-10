<template>
  <div v-if="hasAvailableAction" class="status-actions-card">
    <h3 class="card-title">Thao Tác Quản Lý Trạng Thái</h3>

    <p v-if="globalError" class="error-banner" aria-live="assertive">{{ globalError }}</p>

    <div class="actions-group">
      <template v-if="booking?.status === 'pending'">
        <AppButton variant="success" @click="openModal('approve')">
          ✓ Duyệt phiếu mượn
        </AppButton>
        <AppButton variant="danger" @click="openModal('reject')">
          ✕ Từ chối phiếu mượn
        </AppButton>
      </template>

      <template v-else-if="booking?.status === 'approved'">
        <AppButton variant="primary" @click="openModal('checkIn')">
          🔑 Xác nhận nhận phòng (Check-in)
        </AppButton>
      </template>

      <template v-else-if="booking?.status === 'in_use'">
        <AppButton variant="success" @click="openModal('complete')">
          🏁 Hoàn thành & Ghi nhận trả phòng
        </AppButton>
      </template>
    </div>

    <!-- APPROVE MODAL -->
    <AppModal
      :is-open="activeModal === 'approve'"
      title="Xác Nhận Duyệt Phiếu Mượn"
      variant="success"
      @close="closeModal"
    >
      <p>Bạn có chắc chắn muốn duyệt phiếu mượn phòng <strong>{{ booking?.room?.name }}</strong>?</p>
      <div class="field-group">
        <label for="approve-note" class="field-label">Ghi chú của nhân viên (Tùy chọn):</label>
        <textarea id="approve-note" v-model="staffNote" rows="2" class="field-textarea" placeholder="Ghi chú thêm..."></textarea>
      </div>
      <template #footer>
        <AppButton variant="secondary" :disabled="submitting" @click="closeModal">Hủy bỏ</AppButton>
        <AppButton variant="success" :loading="submitting" @click="handleApprove">Duyệt phiếu</AppButton>
      </template>
    </AppModal>

    <!-- REJECT MODAL -->
    <AppModal
      :is-open="activeModal === 'reject'"
      title="Từ Chối Phiếu Mượn"
      variant="danger"
      @close="closeModal"
    >
      <div class="field-group">
        <label for="reject-reason" class="field-label">Lý do từ chối (Bắt buộc):</label>
        <textarea
          id="reject-reason"
          v-model="rejectionReason"
          rows="3"
          maxlength="300"
          class="field-textarea"
          placeholder="Nhập lý do từ chối mượn phòng..."
        ></textarea>
        <span v-if="modalError" class="field-error">{{ modalError }}</span>
      </div>
      <template #footer>
        <AppButton variant="secondary" :disabled="submitting" @click="closeModal">Hủy bỏ</AppButton>
        <AppButton variant="danger" :loading="submitting" @click="handleReject">Xác nhận từ chối</AppButton>
      </template>
    </AppModal>

    <!-- CHECK-IN MODAL -->
    <AppModal
      :is-open="activeModal === 'checkIn'"
      title="Xác Nhận Nhận Phòng (Check-in)"
      variant="primary"
      @close="closeModal"
    >
      <p>Xác nhận sinh viên đã có mặt và bắt đầu sử dụng phòng <strong>{{ booking?.room?.name }}</strong>?</p>
      <div class="field-group">
        <label for="checkin-note" class="field-label">Ghi chú của nhân viên (Tùy chọn):</label>
        <textarea id="checkin-note" v-model="staffNote" rows="2" class="field-textarea" placeholder="Ghi chú thêm..."></textarea>
      </div>
      <template #footer>
        <AppButton variant="secondary" :disabled="submitting" @click="closeModal">Hủy bỏ</AppButton>
        <AppButton variant="primary" :loading="submitting" @click="handleCheckIn">Xác nhận check-in</AppButton>
      </template>
    </AppModal>

    <!-- COMPLETE MODAL -->
    <AppModal
      :is-open="activeModal === 'complete'"
      title="Hoàn Thành & Trả Phòng Học"
      variant="success"
      @close="closeModal"
    >
      <p>Xác nhận buổi học đã kết thúc. Kiểm tra tình trạng thiết bị hư hỏng (nếu có):</p>

      <div v-if="booking?.equipmentItems && booking.equipmentItems.length > 0" class="damaged-items-list">
        <div v-for="item in booking.equipmentItems" :key="item.equipmentId" class="damaged-item-row">
          <span class="item-name">{{ item.equipment?.name || 'Thiết bị' }} (Đã mượn: {{ item.quantity }})</span>
          <div class="input-qty-box">
            <label :for="`damaged-${item.equipmentId}`" class="sub-label">Số lượng hỏng:</label>
            <input
              :id="`damaged-${item.equipmentId}`"
              type="number"
              min="0"
              :max="item.quantity"
              :value="getDamagedQty(item.equipmentId)"
              class="damaged-input"
              @input="setDamagedQty(item.equipmentId, $event.target.value, item.quantity)"
            />
          </div>
        </div>
      </div>

      <div class="field-group">
        <label for="complete-note" class="field-label">Ghi chú tình trạng phòng/thiết bị:</label>
        <textarea id="complete-note" v-model="staffNote" rows="2" class="field-textarea" placeholder="Ghi chú hoàn trả..."></textarea>
      </div>

      <p v-if="modalError" class="field-error">{{ modalError }}</p>

      <template #footer>
        <AppButton variant="secondary" :disabled="submitting" @click="closeModal">Hủy bỏ</AppButton>
        <AppButton variant="success" :loading="submitting" @click="handleComplete">Xác nhận hoàn thành</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { adminBookingService } from '@/services/adminBooking';
import AppButton from '@/components/common/AppButton.vue';
import AppModal from '@/components/common/AppModal.vue';

const props = defineProps({
  booking: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['action-success']);

const activeModal = ref('');
const submitting = ref(false);
const globalError = ref('');
const modalError = ref('');

const staffNote = ref('');
const rejectionReason = ref('');
const damagedMap = reactive({});

const hasAvailableAction = computed(() => {
  if (!props.booking) return false;
  return ['pending', 'approved', 'in_use'].includes(props.booking.status);
});

function openModal(modalName) {
  activeModal.value = modalName;
  globalError.value = '';
  modalError.value = '';
  staffNote.value = '';
  rejectionReason.value = '';

  if (modalName === 'complete' && props.booking?.equipmentItems) {
    props.booking.equipmentItems.forEach(item => {
      damagedMap[item.equipmentId] = 0;
    });
  }
}

function closeModal() {
  activeModal.value = '';
  modalError.value = '';
}

function getDamagedQty(eqId) {
  return damagedMap[eqId] || 0;
}

function setDamagedQty(eqId, valStr, maxQty) {
  const num = parseInt(valStr, 10);
  const valid = isNaN(num) ? 0 : Math.max(0, Math.min(num, maxQty));
  damagedMap[eqId] = valid;
}

async function handleApprove() {
  submitting.value = true;
  globalError.value = '';
  try {
    const res = await adminBookingService.approveBooking(props.booking._id, {
      staffNote: staffNote.value.trim()
    });
    closeModal();
    emit('action-success', res.data);
  } catch (err) {
    if (err.status === 409) {
      globalError.value = 'Phòng hoặc thiết bị không còn khả dụng trong khung giờ này.';
      closeModal();
      emit('action-success');
    } else {
      modalError.value = err.message || 'Không thể duyệt phiếu mượn';
    }
  } finally {
    submitting.value = false;
  }
}

async function handleReject() {
  if (!rejectionReason.value || !rejectionReason.value.trim()) {
    modalError.value = 'Vui lòng nhập lý do từ chối';
    return;
  }
  submitting.value = true;
  globalError.value = '';
  try {
    const res = await adminBookingService.rejectBooking(props.booking._id, {
      rejectionReason: rejectionReason.value.trim(),
      staffNote: staffNote.value.trim()
    });
    closeModal();
    emit('action-success', res.data);
  } catch (err) {
    modalError.value = err.message || 'Không thể từ chối phiếu mượn';
  } finally {
    submitting.value = false;
  }
}

async function handleCheckIn() {
  submitting.value = true;
  globalError.value = '';
  try {
    const res = await adminBookingService.checkInBooking(props.booking._id, {
      staffNote: staffNote.value.trim()
    });
    closeModal();
    emit('action-success', res.data);
  } catch (err) {
    modalError.value = err.message || 'Không thể xác nhận check-in';
  } finally {
    submitting.value = false;
  }
}

async function handleComplete() {
  submitting.value = true;
  globalError.value = '';

  const equipmentItems = [];
  if (props.booking?.equipmentItems) {
    props.booking.equipmentItems.forEach(item => {
      equipmentItems.push({
        equipmentId: item.equipmentId,
        damagedQuantity: damagedMap[item.equipmentId] || 0
      });
    });
  }

  try {
    const res = await adminBookingService.completeBooking(props.booking._id, {
      staffNote: staffNote.value.trim(),
      equipmentItems
    });
    closeModal();
    emit('action-success', res.data);
  } catch (err) {
    modalError.value = err.message || 'Không thể hoàn thành phiếu mượn';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.status-actions-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.actions-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.error-banner {
  padding: 10px 14px;
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 13px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.field-error {
  font-size: 12px;
  color: var(--color-danger);
}

.damaged-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0;
}

.damaged-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.item-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.input-qty-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.damaged-input {
  width: 54px;
  height: 32px;
  text-align: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 700;
}
</style>
