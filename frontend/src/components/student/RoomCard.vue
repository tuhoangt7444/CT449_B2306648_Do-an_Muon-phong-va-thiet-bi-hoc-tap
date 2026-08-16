<template>
  <div class="room-card" @click="goDetail">
    <div class="card-image-wrapper">
      <img
        v-if="room.images && room.images.length > 0 && isValidUrl(room.images[0])"
        :src="room.images[0]"
        :alt="room.name"
        class="card-image"
      />
      <div v-else class="card-image-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2Z"/>
        </svg>
        <span class="placeholder-text">{{ room.roomCode }}</span>
      </div>

      <div class="badge-overlay">
        <StatusBadge :status="room.status" />
      </div>
      <div v-if="room.building" class="building-overlay font-bold">
        Tòa {{ room.building.buildingCode }}
      </div>
    </div>

    <div class="card-body">
      <div class="header-row">
        <h3 class="room-name">{{ room.name }}</h3>
        <span class="room-code">{{ room.roomCode }}</span>
      </div>

      <div class="meta-row">
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ room.location }}
        </span>
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          {{ formatCapacity(room.capacity, room.capacitySource, room.observedMinimumCapacity) }}
        </span>
      </div>

      <div v-if="room.facilities && room.facilities.length > 0" class="facilities-tags">
        <span
          v-for="(fac, idx) in room.facilities.slice(0, 3)"
          :key="idx"
          class="facility-tag"
        >
          {{ fac }}
        </span>
        <span v-if="room.facilities.length > 3" class="facility-more">
          +{{ room.facilities.length - 3 }}
        </span>
      </div>

      <div class="card-footer">
        <div class="rating-info">
          <span class="star-icon">★</span>
          <span class="rating-score">{{ formatRating(room.averageRating) }}</span>
          <span v-if="room.reviewCount > 0" class="review-count">({{ room.reviewCount }} đánh giá)</span>
        </div>

        <router-link :to="`/rooms/${room._id}`" class="view-link" @click.stop>
          Xem phòng →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { formatCapacity, formatRating } from '@/utils/format';

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const router = useRouter();

function isValidUrl(str) {
  return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.startsWith('data:image/'));
}

function goDetail() {
  router.push(`/rooms/${props.room._id}`);
}
</script>

<style scoped>
.room-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
  background-color: var(--color-surface-elevated);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  gap: 6px;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 600;
}

.badge-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.building-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(37, 99, 235, 0.9);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.room-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.room-code {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  padding: 2px 6px;
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.meta-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.facilities-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.facility-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.facility-more {
  font-size: 11px;
  color: var(--color-text-muted);
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.star-icon {
  color: #f59e0b;
}

.rating-score {
  font-weight: 600;
  color: var(--color-text-primary);
}

.review-count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.view-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-brand);
}
</style>
