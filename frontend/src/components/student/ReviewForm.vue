<template>
  <div class="review-form-card">
    <div class="card-header">
      <h3 class="card-title">{{ existingReview ? 'Đánh Giá Của Bạn' : 'Viết Đánh Giá Phòng Học' }}</h3>
      <p class="card-subtitle">Chia sẻ trải nghiệm sử dụng phòng học để giúp đỡ các sinh viên khác</p>
    </div>

    <p v-if="error" class="error-banner" aria-live="assertive">{{ error }}</p>
    <p v-if="successMsg" class="success-banner" aria-live="polite">{{ successMsg }}</p>

    <div class="rating-picker">
      <label class="picker-label">Điểm đánh giá (1 - 5 sao):</label>
      <div class="stars-group" role="radiogroup" aria-label="Chọn điểm đánh giá từ 1 đến 5 sao">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          role="radio"
          :aria-checked="rating === star"
          :aria-label="`${star} sao`"
          :class="['star-btn', { active: star <= rating }]"
          @click="rating = star"
        >
          ★
        </button>
      </div>
      <span class="rating-text">{{ ratingLabel }}</span>
    </div>

    <div class="comment-group">
      <label for="review-comment" class="comment-label">Nhận xét chi tiết (Tùy chọn):</label>
      <textarea
        id="review-comment"
        v-model="comment"
        rows="3"
        maxlength="500"
        class="comment-textarea"
        placeholder="Cơ sở vật chất, ánh sáng, máy lạnh, độ yên tĩnh..."
      ></textarea>
      <span class="char-count">{{ comment.length }}/500 ký tự</span>
    </div>

    <div class="form-actions">
      <AppButton
        v-if="existingReview"
        variant="danger"
        size="sm"
        :disabled="submitting"
        @click="showDeleteModal = true"
      >
        Xóa đánh giá
      </AppButton>
      <div></div>

      <AppButton
        variant="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá' }}
      </AppButton>
    </div>

    <AppModal
      :is-open="showDeleteModal"
      title="Xác Nhận Xóa Đánh Giá"
      variant="danger"
      @close="showDeleteModal = false"
    >
      <p>Bạn có chắc chắn muốn xóa bài đánh giá này không? Hành động này không thể hoàn tác.</p>
      <template #footer>
        <AppButton variant="secondary" :disabled="deleting" @click="showDeleteModal = false">
          Hủy bỏ
        </AppButton>
        <AppButton variant="danger" :loading="deleting" @click="handleDelete">
          Xác nhận xóa
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { reviewService } from '@/services/review';
import AppButton from '@/components/common/AppButton.vue';
import AppModal from '@/components/common/AppModal.vue';

const props = defineProps({
  bookingId: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  existingReview: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['review-updated', 'review-deleted']);

const rating = ref(props.existingReview?.rating || 5);
const comment = ref(props.existingReview?.comment || '');
const submitting = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);
const error = ref('');
const successMsg = ref('');

watch(() => props.existingReview, (newRev) => {
  if (newRev) {
    rating.value = newRev.rating || 5;
    comment.value = newRev.comment || '';
  } else {
    rating.value = 5;
    comment.value = '';
  }
});

const ratingLabel = computed(() => {
  const map = {
    1: '1/5 - Rất không hài lòng',
    2: '2/5 - Không hài lòng',
    3: '3/5 - Bình thường',
    4: '4/5 - Hài lòng',
    5: '5/5 - Rất hài lòng'
  };
  return map[rating.value] || '';
});

async function handleSubmit() {
  error.value = '';
  successMsg.value = '';
  submitting.value = true;
  try {
    if (props.existingReview && props.existingReview._id) {
      const res = await reviewService.updateReview(props.existingReview._id, {
        rating: rating.value,
        comment: comment.value.trim()
      });
      successMsg.value = 'Cập nhật đánh giá thành công!';
      emit('review-updated', res.data);
    } else {
      const res = await reviewService.createReview({
        bookingId: props.bookingId,
        rating: rating.value,
        comment: comment.value.trim()
      });
      successMsg.value = 'Tạo đánh giá phòng thành công!';
      emit('review-updated', res.data);
    }
  } catch (err) {
    error.value = err.message || 'Không thể lưu đánh giá';
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!props.existingReview?._id) return;
  deleting.value = true;
  error.value = '';
  try {
    await reviewService.deleteReview(props.existingReview._id);
    showDeleteModal.value = false;
    emit('review-deleted');
  } catch (err) {
    error.value = err.message || 'Không thể xóa đánh giá';
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.review-form-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.rating-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.picker-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stars-group {
  display: flex;
  gap: 6px;
}

.star-btn {
  font-size: 24px;
  background: none;
  border: none;
  color: var(--color-border-strong);

  line-height: 1;
}

.star-btn.active {
  color: #f59e0b;
}

.rating-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.comment-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.comment-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.comment-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
  resize: vertical;
}

.char-count {
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-banner {
  padding: 10px 14px;
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 13px;
}

.success-banner {
  padding: 10px 14px;
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 13px;
}
</style>
