<template>
  <div class="daily-schedule-card">
    <div class="schedule-header">
      <div class="header-left">
        <h3 class="schedule-title">Lịch Sử Dụng Theo Ngày</h3>
        <p class="schedule-subtitle">Khung giờ mượn phòng trong ngày {{ formatDateVN(selectedDate) }}</p>
      </div>

      <div class="date-picker-group">
        <label for="schedule-date" class="date-label">Chọn ngày:</label>
        <input
          id="schedule-date"
          type="date"
          :value="selectedDate"
          class="date-input"
          @change="handleDateChange"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải lịch mượn phòng..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchSchedule">Thử lại</AppButton>
    </div>

    <div v-else class="schedule-body">
      <div class="schedule-legend">
        <div class="legend-item">
          <span class="legend-color is-available"></span>
          <span>Khung giờ trống (Sẵn sàng đăng ký)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color is-occupied"></span>
          <span>Đã giữ phòng (Đã duyệt / Đang sử dụng)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color is-completed"></span>
          <span>Đã sử dụng (Đã hoàn thành)</span>
        </div>
      </div>

      <div v-if="pendingBookings.length > 0" class="pending-notice-box">
        <h4 class="pending-title">📌 Yêu cầu đang chờ duyệt (Không giữ phòng):</h4>
        <div class="pending-list">
          <div v-for="pb in pendingBookings" :key="pb._id || pb.bookingId" class="pending-item">
            <span class="pending-time">{{ formatTimeVN(pb.startTime) }} - {{ formatTimeVN(pb.endTime) }}</span>
            <span class="pending-badge">Đang chờ nhân viên xét duyệt — Khung giờ này vẫn khả dụng để gửi yêu cầu</span>
          </div>
        </div>
      </div>

      <div v-if="busyIntervals.length === 0" class="empty-schedule-banner">
        <p>🎉 Trong ngày {{ formatDateVN(selectedDate) }}, phòng học hoàn toàn trống lịch. Tất cả khung giờ từ 07:00 đến 22:00 đều sẵn sàng!</p>
      </div>

      <div class="timeline-container">
        <div
          v-for="slot in timeSlots"
          :key="slot.hour"
          :class="['time-slot-row', `slot-${slot.status}`]"
        >
          <div class="time-label">{{ slot.timeLabel }}</div>
          <div class="slot-bar">
            <div class="slot-status-text">
              <span v-if="slot.status === 'completed'" class="status-tag completed">
                🏁 {{ slot.label }}
              </span>
              <span v-else-if="slot.status === 'approved' || slot.status === 'in_use' || slot.status === 'occupied'" class="status-tag occupied">
                🔒 Đã giữ phòng ({{ slot.label }})
              </span>
              <span v-else class="status-tag available">
                ✅ Khung giờ trống
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { roomService } from '@/services/room';
import { formatDateVN, formatTimeVN, getTodayString } from '@/utils/date';
import LoadingState from '@/components/common/LoadingState.vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  initialDate: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['change-date']);

const selectedDate = ref(props.initialDate || getTodayString());
const loading = ref(false);
const error = ref('');
const rawSchedule = ref([]);

watch(() => props.initialDate, (newDate) => {
  if (newDate && newDate !== selectedDate.value) {
    selectedDate.value = newDate;
    fetchSchedule();
  }
});

async function fetchSchedule() {
  if (!props.roomId) return;
  loading.value = true;
  error.value = '';
  try {
    const res = await roomService.getRoomSchedule(props.roomId, selectedDate.value);
    if (res && res.data && Array.isArray(res.data)) {
      rawSchedule.value = res.data;
    } else if (res && res.data && Array.isArray(res.data.schedule)) {
      rawSchedule.value = res.data.schedule;
    } else {
      rawSchedule.value = [];
    }
  } catch (err) {
    error.value = err.message || 'Không thể tải lịch phòng';
  } finally {
    loading.value = false;
  }
}

function handleDateChange(e) {
  const val = e.target.value;
  if (val) {
    selectedDate.value = val;
    emit('change-date', val);
    fetchSchedule();
  }
}

const pendingBookings = computed(() => {
  return rawSchedule.value.filter(b => b.status === 'pending');
});

const busyIntervals = computed(() => {
  const busyList = rawSchedule.value.filter(b => b.status === 'approved' || b.status === 'in_use' || b.status === 'completed');
  const intervals = busyList.map(b => {
    const s = new Date(b.startTime);
    const e = new Date(b.endTime);
    return {
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin: e.getHours() * 60 + e.getMinutes(),
      status: b.status
    };
  }).sort((a, b) => a.startMin - b.startMin);

  return intervals;
});

const timeSlots = computed(() => {
  const slots = [];
  for (let h = 7; h <= 21; h++) {
    const startHourStr = String(h).padStart(2, '0');
    const endHourStr = String(h + 1).padStart(2, '0');
    const timeLabel = `${startHourStr}:00 - ${endHourStr}:00`;
    const slotStartMin = h * 60;
    const slotEndMin = (h + 1) * 60;

    let slotStatus = 'available';
    let label = 'Khung giờ trống';

    for (const busy of busyIntervals.value) {
      if (busy.startMin < slotEndMin && busy.endMin > slotStartMin) {
        if (busy.status === 'completed') {
          slotStatus = 'completed';
          label = 'Đã sử dụng (Đã hoàn thành)';
        } else if (busy.status === 'in_use') {
          slotStatus = 'in_use';
          label = 'Đang sử dụng';
        } else {
          slotStatus = 'approved';
          label = 'Đã duyệt';
        }
        break;
      }
    }

    slots.push({
      hour: h,
      timeLabel,
      status: slotStatus,
      label
    });
  }
  return slots;
});

onMounted(() => {
  fetchSchedule();
});
</script>

<style scoped>
.daily-schedule-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  color: var(--color-text-primary);
}

.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.schedule-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.schedule-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.date-picker-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.date-input {
  padding: 6px 12px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.schedule-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.legend-color.is-available {
  background-color: var(--color-success-bg);
  border: 1px solid var(--color-success-text);
}

.legend-color.is-occupied {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-text);
}

.legend-color.is-completed {
  background-color: var(--color-info-bg);
  border: 1px solid var(--color-info-text);
}

.pending-notice-box {
  margin-bottom: 20px;
  padding: 14px 16px;
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning-text);
  border-radius: var(--radius-md);
}

.pending-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-warning-text);
  margin-bottom: 8px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.pending-time {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text-primary);
}

.pending-badge {
  color: var(--color-text-secondary);
}

.empty-schedule-banner {
  padding: 12px 16px;
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 14px;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.slot-available {
  background-color: var(--color-surface);
}

.slot-occupied,
.slot-approved,
.slot-in_use {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger-text);
}

.slot-completed {
  background-color: var(--color-info-bg);
  border-color: var(--color-info-text);
}

.time-label {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-mono);
  width: 110px;
  flex-shrink: 0;
  color: var(--color-text-primary);
}

.slot-bar {
  flex: 1;
}

.status-tag {
  font-size: 12px;
  font-weight: 500;
}

.status-tag.available {
  color: var(--color-success-text);
}

.status-tag.occupied,
.status-tag.approved,
.status-tag.in_use {
  color: var(--color-danger-text);
  font-weight: 600;
}

.status-tag.completed {
  color: var(--color-info-text);
  font-weight: 600;
}

.loading-wrapper, .error-wrapper {
  padding: 32px 0;
  text-align: center;
}

.error-text {
  color: var(--color-danger);
  margin-bottom: 12px;
}
</style>
