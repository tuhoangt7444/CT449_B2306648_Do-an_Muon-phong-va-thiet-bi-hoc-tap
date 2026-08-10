<template>
  <div class="admin-dashboard-view">
    <header class="page-header">
      <h1 class="title">Tổng Quan Hệ Thống (Dashboard)</h1>
      <p class="subtitle">Báo cáo thống kê hoạt động mượn phòng tự học và cảnh báo thiết bị trường CTU</p>
    </header>

    <div class="stats-grid">
      <StatCard
        title="Phòng đang hoạt động"
        :value="summary?.activeRooms"
        description="Số lượng phòng học khả dụng"
        variant="primary"
        to="/admin/rooms"
      />
      <StatCard
        title="Yêu cầu chờ duyệt"
        :value="summary?.pendingBookings"
        description="Cần nhân viên xét duyệt"
        variant="warning"
        to="/admin/bookings?status=pending"
      />
      <StatCard
        title="Đang sử dụng phòng"
        :value="summary?.inUseBookings"
        description="Sinh viên đang học tập"
        variant="info"
        to="/admin/bookings?status=in_use"
      />
      <StatCard
        title="Thiết bị khả dụng"
        :value="summary?.availableEquipment"
        description="Sẵn sàng mượn trong kho"
        variant="success"
        to="/admin/equipment"
      />
      <StatCard
        title="Cảnh báo sắp hết thiết bị"
        :value="summary?.lowStockEquipment"
        description="Số thiết bị chạm ngưỡng"
        variant="danger"
        to="/admin/equipment"
      />
    </div>

    <div class="charts-row">
      <CssBarChart
        title="Phân Bổ Phiếu Mượn Theo Trạng Thái"
        subtitle="Tổng số lượng phiếu mượn phân chia theo 6 trạng thái hệ thống"
        :items="statusChartItems"
      />

      <CssBarChart
        title="Xu Hướng Đăng Ký 14 Ngày Gần Nhất"
        subtitle="Số lượt đăng ký mượn phòng tự học theo từng ngày"
        :items="dayChartItems"
      />
    </div>

    <div class="widgets-row">
      <div class="widget-box">
        <div class="widget-header">
          <h3 class="widget-title">Top 5 Phòng Học Được Mượn Nhiều Nhất</h3>
        </div>
        <div v-if="popularRooms.length === 0" class="empty-widget">
          <p>Chưa có dữ liệu phòng học phổ biến.</p>
        </div>
        <div v-else class="popular-list">
          <div v-for="(rm, idx) in popularRooms" :key="rm._id" class="popular-item">
            <div class="item-rank">{{ idx + 1 }}</div>
            <div class="item-info">
              <span class="room-name">{{ rm.name }} ({{ rm.roomCode }})</span>
              <span class="room-meta">Sức chứa: {{ rm.capacity }} người | ★ {{ formatRating(rm.averageRating) }}</span>
            </div>
            <div class="booking-count-badge">
              <strong>{{ rm.bookingCount }}</strong> lượt mượn
            </div>
          </div>
        </div>
      </div>

      <EquipmentAlert :alerts="equipmentAlerts" />
    </div>

    <div class="recent-bookings-box">
      <div class="widget-header">
        <h3 class="widget-title">Yêu Cầu Đăng Ký Mượn Gần Đây</h3>
        <router-link to="/admin/bookings" class="view-all-link">Xem tất cả phiếu mượn →</router-link>
      </div>

      <div v-if="loadingRecent" class="loading-widget">
        <LoadingState message="Đang tải các yêu cầu gần đây..." />
      </div>

      <div v-else-if="recentBookings.length === 0" class="empty-widget">
        <p>Chưa có yêu cầu đăng ký mượn nào.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã Yêu Cầu</th>
              <th>Sinh Viên</th>
              <th>Phòng Học</th>
              <th>Thời Gian Mượn</th>
              <th>Mục Đích</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in recentBookings" :key="b._id">
              <td class="font-mono">#{{ (b._id || '').slice(-6).toUpperCase() }}</td>
              <td>
                <div class="student-cell">
                  <span class="student-name">{{ b.student?.name }}</span>
                  <span class="student-code">{{ b.student?.studentCode }}</span>
                </div>
              </td>
              <td>{{ b.room?.name }} ({{ b.room?.roomCode }})</td>
              <td>
                <div class="time-cell">
                  <span>🗓️ {{ formatDateVN(b.startTime) }}</span>
                  <span class="time-range">{{ formatTimeVN(b.startTime) }} - {{ formatTimeVN(b.endTime) }}</span>
                </div>
              </td>
              <td><span class="purpose-cell">{{ b.purpose }}</span></td>
              <td><StatusBadge :status="b.status" /></td>
              <td>
                <router-link :to="`/admin/bookings/${b._id}`">
                  <AppButton variant="secondary" size="sm">Xem</AppButton>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { dashboardService } from '@/services/dashboard';
import { adminBookingService } from '@/services/adminBooking';
import { formatDateVN, formatTimeVN } from '@/utils/date';
import { formatRating } from '@/utils/format';

import StatCard from '@/components/admin/StatCard.vue';
import CssBarChart from '@/components/admin/CssBarChart.vue';
import EquipmentAlert from '@/components/admin/EquipmentAlert.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import AppButton from '@/components/common/AppButton.vue';

const summary = ref(null);
const bookingsByStatus = ref([]);
const bookingsByDay = ref([]);
const popularRooms = ref([]);
const equipmentAlerts = ref([]);
const recentBookings = ref([]);
const loadingRecent = ref(false);

const statusColorMap = {
  pending: 'fill-warning',
  approved: 'fill-primary',
  in_use: 'fill-info',
  completed: 'fill-success',
  rejected: 'fill-danger',
  cancelled: 'fill-secondary'
};

const statusTextMap = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  in_use: 'Đang sử dụng',
  completed: 'Đã hoàn thành',
  rejected: 'Bị từ chối',
  cancelled: 'Đã hủy'
};

const statusChartItems = computed(() => {
  if (!bookingsByStatus.value || typeof bookingsByStatus.value !== 'object') return [];
  const items = Array.isArray(bookingsByStatus.value) ? bookingsByStatus.value : Object.keys(bookingsByStatus.value).map(st => ({
    status: st,
    count: bookingsByStatus.value[st]
  }));
  return items.map(item => ({
    label: statusTextMap[item.status] || item.status,
    value: item.count,
    colorClass: statusColorMap[item.status] || 'fill-primary'
  }));
});

const dayChartItems = computed(() => {
  if (!Array.isArray(bookingsByDay.value)) return [];
  return bookingsByDay.value.map(item => ({
    label: formatDateVN(item.date),
    value: item.count,
    colorClass: 'fill-primary'
  }));
});

async function fetchDashboardData() {
  try {
    const resSummary = await dashboardService.getSummary();
    if (resSummary && resSummary.data) summary.value = resSummary.data;
  } catch (e) {}

  try {
    const resStatus = await dashboardService.getBookingsByStatus();
    if (resStatus && resStatus.data) bookingsByStatus.value = resStatus.data;
  } catch (e) {}

  try {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 14);
    const toStr = today.toISOString().split('T')[0];
    const fromStr = pastDate.toISOString().split('T')[0];

    const resDay = await dashboardService.getBookingsByDay({ from: fromStr, to: toStr });
    if (resDay && resDay.data) bookingsByDay.value = resDay.data;
  } catch (e) {}

  try {
    const resPopular = await dashboardService.getPopularRooms({ limit: 5 });
    if (resPopular && resPopular.data) popularRooms.value = resPopular.data;
  } catch (e) {}

  try {
    const resAlerts = await dashboardService.getEquipmentAlerts();
    if (resAlerts && resAlerts.data) equipmentAlerts.value = resAlerts.data;
  } catch (e) {}

  fetchRecentBookings();
}

async function fetchRecentBookings() {
  loadingRecent.value = true;
  try {
    const res = await adminBookingService.getBookings({ limit: 5 });
    if (res && res.data) {
      recentBookings.value = res.data;
    }
  } catch (e) {} finally {
    loadingRecent.value = false;
  }
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.admin-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-header {
  margin-bottom: 4px;
}

.title {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}

.widgets-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}

.widget-box {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.widget-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.view-all-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.item-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--color-brand);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.room-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.room-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.booking-count-badge {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.recent-bookings-box {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.admin-table th, .admin-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.admin-table th {
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.student-cell {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.student-code {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.time-cell {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.time-range {
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.purpose-cell {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.font-mono {
  font-family: var(--font-mono);
}

.empty-widget, .loading-widget {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
