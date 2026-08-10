<template>
  <div class="room-book-view">
    <div class="breadcrumb-bar">
      <router-link :to="`/rooms/${roomId}`" class="breadcrumb-link">← Quay lại thông tin phòng</router-link>
    </div>

    <div v-if="loadingRoom" class="loading-wrapper">
      <LoadingState message="Đang kiểm tra phòng học..." />
    </div>

    <div v-else-if="roomError" class="error-wrapper">
      <EmptyState title="Không thể đăng ký" :description="roomError">
        <template #action>
          <router-link to="/rooms">
            <AppButton variant="primary">Chọn phòng khác</AppButton>
          </router-link>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="room" class="booking-flow">
      <div class="step-indicator">
        <div :class="['step-item', { active: currentStep === 1, completed: currentStep > 1 }]" :aria-current="currentStep === 1 ? 'step' : undefined">
          <span class="step-num">1</span>
          <span class="step-text">Thời gian & Thông tin</span>
        </div>
        <div class="step-divider"></div>
        <div :class="['step-item', { active: currentStep === 2, completed: currentStep > 2 }]" :aria-current="currentStep === 2 ? 'step' : undefined">
          <span class="step-num">2</span>
          <span class="step-text">Thiết bị đi kèm</span>
        </div>
        <div class="step-divider"></div>
        <div :class="['step-item', { active: currentStep === 3 }]" :aria-current="currentStep === 3 ? 'step' : undefined">
          <span class="step-num">3</span>
          <span class="step-text">Xác nhận & Gửi</span>
        </div>
      </div>

      <div v-if="submitSuccess" class="success-card">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">Gửi Yêu Cầu Đăng Ký Thành Công!</h2>
        <p class="success-desc">
          Yêu cầu mượn phòng <strong>{{ room.name }}</strong> ngày <strong>{{ formatDateVN(form.date) }}</strong> từ <strong>{{ form.startTimeStr }}</strong> đến <strong>{{ form.endTimeStr }}</strong> đã được ghi nhận ở trạng thái <strong>Chờ duyệt</strong>.
        </p>
        <div class="success-actions">
          <router-link to="/rooms">
            <AppButton variant="secondary">Trở về danh sách phòng</AppButton>
          </router-link>
          <router-link to="/my-bookings">
            <AppButton variant="primary">Xem các yêu cầu của tôi</AppButton>
          </router-link>
        </div>
      </div>

      <div v-else class="step-content">
        <p v-if="apiError" class="global-api-error" aria-live="assertive">{{ apiError }}</p>

        <!-- STEP 1 -->
        <div v-show="currentStep === 1" class="step-panel">
          <div class="room-summary-banner">
            <div class="banner-title">{{ room.name }} ({{ room.roomCode }})</div>
            <div class="banner-meta">Vị trí: {{ room.location }} | Sức chứa: {{ room.capacity }} người</div>
          </div>

          <form class="step-form" @submit.prevent="validateAndGoStep2">
            <div class="form-row">
              <AppInput
                id="book-date"
                v-model="form.date"
                type="date"
                label="Ngày mượn phòng"
                required
                :error="fieldErrors.date"
              />

              <AppSelect
                id="book-startTime"
                v-model="form.startTimeStr"
                :options="timeOptions"
                label="Giờ bắt đầu"
                required
                :error="fieldErrors.startTimeStr"
              />

              <AppSelect
                id="book-endTime"
                v-model="form.endTimeStr"
                :options="timeOptions"
                label="Giờ kết thúc"
                required
                :error="fieldErrors.endTimeStr"
              />
            </div>

            <div class="form-row">
              <AppInput
                id="book-purpose"
                v-model="form.purpose"
                label="Mục đích mượn"
                placeholder="Ví dụ: Luyện tập thuyết trình nhóm môn CT449"
                required
                :error="fieldErrors.purpose"
              />

              <AppInput
                id="book-people"
                v-model.number="form.numberOfPeople"
                type="number"
                label="Số lượng người tham gia"
                :placeholder="`Tối đa ${room.capacity} người`"
                required
                :error="fieldErrors.numberOfPeople"
              />
            </div>

            <AppInput
              id="book-note"
              v-model="form.studentNote"
              label="Ghi chú sinh viên (Không bắt buộc)"
              placeholder="Nhập ghi chú thêm cho nhân viên quản lý nếu có..."
            />

            <DailySchedule
              :room-id="room._id"
              :initial-date="form.date"
              @change-date="handleScheduleDateChange"
            />

            <div class="form-actions">
              <div></div>
              <AppButton type="submit" variant="primary">
                Tiếp tục chọn thiết bị →
              </AppButton>
            </div>
          </form>
        </div>

        <!-- STEP 2 -->
        <div v-show="currentStep === 2" class="step-panel">
          <EquipmentPicker
            v-if="startTimeISO && endTimeISO"
            :start-time-i-s-o="startTimeISO"
            :end-time-i-s-o="endTimeISO"
            :selected-equipment-map="form.equipmentMap"
            @update-equipment="handleEquipmentUpdate"
          />

          <div class="form-actions">
            <AppButton variant="secondary" @click="currentStep = 1">
              ← Quay lại Bước 1
            </AppButton>
            <AppButton variant="primary" @click="currentStep = 3">
              Tiếp tục kiểm tra thông tin →
            </AppButton>
          </div>
        </div>

        <!-- STEP 3 -->
        <div v-show="currentStep === 3" class="step-panel">
          <BookingSummary
            :room="room"
            :form="form"
            :equipment-list="rawEquipmentList"
            @go-step="goToStep"
          />

          <div class="form-actions">
            <AppButton variant="secondary" :disabled="submitting" @click="currentStep = 2">
              ← Quay lại chọn thiết bị
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              :loading="submitting"
              @click="submitBooking"
            >
              Xác Nhận & Gửi Yêu Cầu Đăng Ký
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { roomService } from '@/services/room';
import { bookingService } from '@/services/booking';
import { formatDateVN, getTodayString, createISOFromDateAndTime, generateTimeOptions } from '@/utils/date';

import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import DailySchedule from '@/components/student/DailySchedule.vue';
import EquipmentPicker from '@/components/student/EquipmentPicker.vue';
import BookingSummary from '@/components/student/BookingSummary.vue';

const route = useRoute();
const router = useRouter();

const roomId = route.params.id;
const room = ref(null);
const loadingRoom = ref(false);
const roomError = ref('');

const currentStep = ref(1);
const submitting = ref(false);
const submitSuccess = ref(false);
const apiError = ref('');
const rawEquipmentList = ref([]);

const form = reactive({
  date: route.query.date || getTodayString(),
  startTimeStr: '08:00',
  endTimeStr: '10:00',
  purpose: '',
  numberOfPeople: 4,
  studentNote: '',
  equipmentMap: {}
});

const fieldErrors = reactive({
  date: '',
  startTimeStr: '',
  endTimeStr: '',
  purpose: '',
  numberOfPeople: ''
});

const timeOptions = generateTimeOptions(7, 22, 30);

const startTimeISO = computed(() => {
  return createISOFromDateAndTime(form.date, form.startTimeStr);
});

const endTimeISO = computed(() => {
  return createISOFromDateAndTime(form.date, form.endTimeStr);
});

async function fetchRoomInfo() {
  loadingRoom.value = true;
  roomError.value = '';
  try {
    const res = await roomService.getRoomById(roomId);
    if (res && res.data) {
      room.value = res.data;
      if (room.value.status !== 'available') {
        roomError.value = 'Phòng học hiện đang bảo trì hoặc ngưng hoạt động, không thể nhận đăng ký.';
      }
    }
  } catch (err) {
    roomError.value = err.message || 'Không tìm thấy phòng học';
  } finally {
    loadingRoom.value = false;
  }
}

function handleScheduleDateChange(newDate) {
  form.date = newDate;
}

function handleEquipmentUpdate(newMap) {
  form.equipmentMap = newMap;
}

function clearFieldErrors() {
  fieldErrors.date = '';
  fieldErrors.startTimeStr = '';
  fieldErrors.endTimeStr = '';
  fieldErrors.purpose = '';
  fieldErrors.numberOfPeople = '';
  apiError.value = '';
}

function validateAndGoStep2() {
  clearFieldErrors();
  let isValid = true;

  if (!form.date) {
    fieldErrors.date = 'Vui lòng chọn ngày mượn';
    isValid = false;
  } else {
    const todayStr = getTodayString();
    if (form.date < todayStr) {
      fieldErrors.date = 'Ngày mượn không được ở trong quá khứ';
      isValid = false;
    }
  }

  if (!form.startTimeStr || !form.endTimeStr) {
    fieldErrors.startTimeStr = 'Vui lòng chọn giờ mượn';
    isValid = false;
  } else if (form.startTimeStr >= form.endTimeStr) {
    fieldErrors.endTimeStr = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    isValid = false;
  }

  if (form.date === getTodayString()) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = form.startTimeStr.split(':').map(Number);
    if (sh * 60 + sm <= currentMin) {
      fieldErrors.startTimeStr = 'Giờ bắt đầu phải ở trong tương lai';
      isValid = false;
    }
  }

  if (!form.purpose || !form.purpose.trim()) {
    fieldErrors.purpose = 'Vui lòng nhập mục đích mượn phòng';
    isValid = false;
  } else if (form.purpose.trim().length > 200) {
    fieldErrors.purpose = 'Mục đích mượn không được vượt quá 200 ký tự';
    isValid = false;
  }

  const numPeople = Number(form.numberOfPeople);
  if (!Number.isInteger(numPeople) || numPeople <= 0) {
    fieldErrors.numberOfPeople = 'Số người sử dụng phải là số nguyên dương';
    isValid = false;
  } else if (room.value && numPeople > room.value.capacity) {
    fieldErrors.numberOfPeople = `Số người (${numPeople}) vượt quá sức chứa tối đa của phòng (${room.value.capacity} người)`;
    isValid = false;
  }

  if (!isValid) return;

  currentStep.value = 2;
}

function goToStep(step) {
  currentStep.value = step;
}

async function submitBooking() {
  submitting.value = true;
  apiError.value = '';

  const equipmentItems = [];
  Object.keys(form.equipmentMap).forEach(eqId => {
    const qty = form.equipmentMap[eqId];
    if (qty > 0) {
      equipmentItems.push({
        equipmentId: eqId,
        quantity: qty
      });
    }
  });

  const payload = {
    roomId,
    startTime: startTimeISO.value,
    endTime: endTimeISO.value,
    purpose: form.purpose.trim(),
    numberOfPeople: Number(form.numberOfPeople),
    equipmentItems,
    studentNote: form.studentNote ? form.studentNote.trim() : ''
  };

  try {
    await bookingService.createBooking(payload);
    submitSuccess.value = true;
  } catch (err) {
    if (err.status === 409) {
      apiError.value = 'Xung đột lịch mượn hoặc số lượng thiết bị khả dụng vừa thay đổi. Vui lòng kiểm tra lại khung giờ.';
      currentStep.value = 1;
    } else {
      apiError.value = err.message || 'Không thể gửi yêu cầu đăng ký mượn phòng';
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchRoomInfo();
});
</script>

<style scoped>
.room-book-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.breadcrumb-bar {
  margin-bottom: 4px;
}

.breadcrumb-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.booking-flow {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
}

.step-item.active {
  color: var(--color-brand);
  font-weight: 700;
}

.step-item.completed {
  color: var(--color-success);
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.step-item.active .step-num {
  background-color: var(--color-brand);
  color: #ffffff;
  border-color: var(--color-brand);
}

.step-item.completed .step-num {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border-color: var(--color-success);
}

.step-text {
  font-size: 14px;
}

.step-divider {
  width: 32px;
  height: 1px;
  background-color: var(--color-border);
}

.global-api-error {
  padding: 12px 16px;
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 14px;
}

.step-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-summary-banner {
  padding: 16px 20px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.banner-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.banner-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.step-form {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.success-card {
  text-align: center;
  max-width: 600px;
  margin: 32px auto;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 48px 32px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.success-icon {
  font-size: 48px;
}

.success-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.success-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.success-actions {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.loading-wrapper, .error-wrapper {
  padding: 48px 0;
}

@media (max-width: 576px) {
  .step-indicator {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .step-divider {
    display: none;
  }
}
</style>
