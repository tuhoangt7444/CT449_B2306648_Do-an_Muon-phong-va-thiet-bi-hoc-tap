<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Đăng Ký Phòng Tự Học & Thiết Bị Học Tập Dễ Dàng</h1>
        <p class="hero-subtitle">
          Hệ thống mượn phòng học nhóm và thiết bị hiện đại dành riêng cho sinh viên Trường Đại học Cần Thơ.
        </p>
        <div class="hero-actions">
          <router-link to="/rooms">
            <AppButton size="lg" variant="primary">Khám phá tất cả phòng</AppButton>
          </router-link>
          <router-link v-if="authStore.isStudent" to="/my-bookings">
            <AppButton size="lg" variant="secondary">Quản lý yêu cầu mượn</AppButton>
          </router-link>
        </div>
      </div>
    </section>

    <section class="featured-rooms-section">
      <div class="section-header">
        <h2 class="section-title">Phòng Học Nổi Bật Sẵn Sàng Mượn</h2>
        <router-link to="/rooms" class="see-all-link">Xem tất cả phòng →</router-link>
      </div>

      <div v-if="loading" class="loading-container">
        <LoadingState message="Đang lấy danh sách phòng..." />
      </div>

      <div v-else-if="error" class="error-container">
        <p class="error-text">{{ error }}</p>
        <AppButton variant="secondary" size="sm" @click="fetchFeaturedRooms">Thử lại</AppButton>
      </div>

      <div v-else-if="featuredRooms.length === 0" class="empty-container">
        <EmptyState title="Hiện tại chưa có phòng sẵn sàng" description="Vui lòng quay lại sau." />
      </div>

      <div v-else class="rooms-grid">
        <RoomCard
          v-for="room in featuredRooms"
          :key="room._id"
          :room="room"
        />
      </div>
    </section>

    <section class="features-section">
      <h2 class="section-title">Tại Sao Nên Chọn StudyHub CTU?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2Z"/></svg>
          </div>
          <h3 class="feature-title">Phòng Tự Học Hiện Đại</h3>
          <p class="feature-desc">Trang bị máy lạnh, máy chiếu, bảng trắng chất lượng cao cho học nhóm.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <h3 class="feature-title">Xem Lịch Trực Tuyến</h3>
          <p class="feature-desc">Tra cứu chính xác khung giờ trống và thời gian sử dụng phòng theo ngày.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <h3 class="feature-title">Đánh Giá & Nhận Xét</h3>
          <p class="feature-desc">Tham khảo ý kiến và điểm đánh giá thực tế từ các sinh viên đã sử dụng.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { roomService } from '@/services/room';
import RoomCard from '@/components/student/RoomCard.vue';
import AppButton from '@/components/common/AppButton.vue';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const authStore = useAuthStore();
const featuredRooms = ref([]);
const loading = ref(false);
const error = ref('');

async function fetchFeaturedRooms() {
  loading.value = true;
  error.value = '';
  try {
    const res = await roomService.getRooms({ status: 'available', limit: 3 });
    if (res && res.data) {
      featuredRooms.value = res.data;
    }
  } catch (err) {
    error.value = err.message || 'Không thể lấy danh sách phòng nổi bật';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchFeaturedRooms();
});
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero-section {
  text-align: center;
  padding: 64px 20px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.hero-content {
  max-width: 760px;
  margin: 0 auto;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.see-all-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-brand);
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 32px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-elevated);
  color: var(--color-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.loading-container, .error-container, .empty-container {
  padding: 32px 0;
  text-align: center;
}

.error-text {
  color: var(--color-danger);
  margin-bottom: 12px;
}
</style>
