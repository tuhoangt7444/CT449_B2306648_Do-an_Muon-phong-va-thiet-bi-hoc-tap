<template>
  <div class="admin-dashboard-view">
    <div class="notice-banner">
      <p>💡 <strong>Lưu ý:</strong> Đây là giao diện khung nền tảng Dashboard. Dữ liệu thực tế từ API sẽ được kết nối đầy đủ ở giai đoạn quản trị tiếp theo.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-title">Phòng đang mở</span>
        <span class="stat-value">6</span>
        <span class="stat-desc">Trên tổng số 8 phòng học</span>
      </div>

      <div class="stat-card">
        <span class="stat-title">Thiết bị khả dụng</span>
        <span class="stat-value">35</span>
        <span class="stat-desc">Đang trong tình trạng sẵn sàng</span>
      </div>

      <div class="stat-card">
        <span class="stat-title">Yêu cầu chờ duyệt</span>
        <span class="stat-value">3</span>
        <span class="stat-desc">Cần xử lý phê duyệt</span>
      </div>

      <div class="stat-card">
        <span class="stat-title">Đang sử dụng</span>
        <span class="stat-value">1</span>
        <span class="stat-desc">Lượt nhận phòng hiện tại</span>
      </div>
    </div>

    <div class="table-card">
      <div class="card-header">
        <h2 class="card-title">Yêu Cầu Gần Đây (Placeholder)</h2>
      </div>

      <EmptyState
        title="Bảng điều khiển quản trị"
        description="Các biểu đồ thống kê, bảng danh sách yêu cầu mới nhất và cảnh báo thiết bị sẽ được hiển thị tại đây ở giai đoạn tiếp theo."
      />
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
</script>

<style scoped>
.admin-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notice-banner {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow-sm);
}

.stat-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}
</style>
