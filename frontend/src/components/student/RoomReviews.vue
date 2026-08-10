<template>
  <div class="room-reviews-card">
    <div class="reviews-header">
      <div class="header-left">
        <h3 class="reviews-title">Đánh Giá Từ Sinh Viên</h3>
        <p class="reviews-subtitle">Nhận xét thực tế từ sinh viên đã mượn phòng</p>
      </div>

      <div class="rating-summary">
        <div class="summary-score">{{ formatRating(averageRating) }}</div>
        <div class="summary-meta">
          <div class="stars-row" :aria-label="`Đánh giá trung bình ${formatRating(averageRating)} trên 5 sao`">
            <span v-for="n in 5" :key="n" :class="['star', { active: n <= Math.round(averageRating || 0) }]">★</span>
          </div>
          <span class="count-text">{{ reviewCount }} đánh giá</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingState message="Đang tải danh sách đánh giá..." />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <p class="error-text">{{ error }}</p>
      <AppButton variant="secondary" size="sm" @click="fetchReviews">Thử lại</AppButton>
    </div>

    <div v-else-if="reviews.length === 0" class="empty-reviews">
      <EmptyState
        title="Chưa có đánh giá nào"
        description="Phòng học này chưa nhận được đánh giá từ sinh viên."
      />
    </div>

    <div v-else class="reviews-list">
      <div v-for="rev in reviews" :key="rev._id" class="review-item">
        <div class="item-header">
          <div class="student-info">
            <div class="avatar-circle">
              {{ (rev.student?.name || rev.student?.studentCode || 'S').charAt(0).toUpperCase() }}
            </div>
            <div class="student-meta">
              <span class="student-name">{{ rev.student?.name || rev.student?.studentCode || 'Sinh viên' }}</span>
              <span class="review-date">{{ formatDateVN(rev.createdAt) }}</span>
            </div>
          </div>

          <div class="item-rating" :aria-label="`Đánh giá ${rev.rating} trên 5 sao`">
            <span v-for="n in 5" :key="n" :class="['star', { active: n <= rev.rating }]">★</span>
          </div>
        </div>

        <p v-if="rev.comment" class="review-comment">{{ rev.comment }}</p>
      </div>

      <PaginationBar
        v-if="pagination.totalPages > 1"
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems"
        @change-page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { roomService } from '@/services/room';
import { formatDateVN } from '@/utils/date';
import { formatRating } from '@/utils/format';
import LoadingState from '@/components/common/LoadingState.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
});

const loading = ref(false);
const error = ref('');
const reviews = ref([]);
const averageRating = ref(0);
const reviewCount = ref(0);
const page = ref(1);

const pagination = ref({
  page: 1,
  limit: 5,
  totalItems: 0,
  totalPages: 1
});

watch(() => props.roomId, () => {
  page.value = 1;
  fetchReviews();
});

async function fetchReviews() {
  if (!props.roomId) return;
  loading.value = true;
  error.value = '';
  try {
    const res = await roomService.getRoomReviews(props.roomId, { page: page.value, limit: 5 });
    if (res && res.data) {
      reviews.value = res.data.reviews || [];
      averageRating.value = res.data.averageRating || 0;
      reviewCount.value = res.data.reviewCount || 0;
      if (res.pagination) {
        pagination.value = res.pagination;
      }
    }
  } catch (err) {
    error.value = err.message || 'Không thể tải đánh giá';
  } finally {
    loading.value = false;
  }
}

function handlePageChange(newPage) {
  page.value = newPage;
  fetchReviews();
}

onMounted(() => {
  fetchReviews();
});
</script>

<style scoped>
.room-reviews-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

}

.reviews-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.reviews-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.reviews-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-score {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1;
}

.summary-meta {
  display: flex;
  flex-direction: column;
}

.stars-row {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 16px;
  color: var(--color-border-strong);
}

.star.active {
  color: #f59e0b;
}

.count-text {
  font-size: 12px;
  color: var(--color-text-muted);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);

}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-brand);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.student-meta {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.review-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.item-rating {
  display: flex;
  gap: 2px;
}

.review-comment {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
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
