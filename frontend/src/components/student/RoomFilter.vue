<template>
  <div class="room-filter-card">
    <div class="filter-row">
      <div class="search-field">
        <AppInput
          id="search"
          v-model="filters.search"
          placeholder="Tìm tên, mã phòng hoặc vị trí..."
          @keyup.enter="emitChange"
        />
      </div>

      <div class="filter-field">
        <AppSelect
          id="status"
          v-model="filters.status"
          :options="statusOptions"
          placeholder="Trạng thái phòng"
          @change="emitChange"
        />
      </div>

      <div class="filter-field">
        <AppInput
          id="minCapacity"
          v-model="filters.minCapacity"
          type="number"
          placeholder="Sức chứa tối thiểu..."
          @keyup.enter="emitChange"
        />
      </div>

      <div class="filter-field">
        <AppSelect
          id="sortBy"
          v-model="filters.sortBy"
          :options="sortOptions"
          @change="emitChange"
        />
      </div>

      <div class="filter-actions">
        <AppButton variant="primary" size="md" @click="emitChange">
          Tìm kiếm
        </AppButton>
        <AppButton variant="ghost" size="md" @click="resetFilters">
          Đặt lại
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import AppInput from '@/components/common/AppInput.vue';
import AppSelect from '@/components/common/AppSelect.vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['change-filter', 'reset']);

const filters = reactive({
  search: props.initialFilters.search || '',
  status: props.initialFilters.status || 'available',
  minCapacity: props.initialFilters.minCapacity || '',
  sortBy: props.initialFilters.sortBy || 'createdAt',
  sortOrder: props.initialFilters.sortOrder || 'desc'
});

watch(() => props.initialFilters, (newVal) => {
  filters.search = newVal.search || '';
  filters.status = newVal.status || 'available';
  filters.minCapacity = newVal.minCapacity || '';
  filters.sortBy = newVal.sortBy || 'createdAt';
  filters.sortOrder = newVal.sortOrder || 'desc';
}, { deep: true });

const statusOptions = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Khả dụng (Mở)', value: 'available' },
  { label: 'Bảo trì', value: 'maintenance' },
  { label: 'Ngưng hoạt động', value: 'inactive' }
];

const sortOptions = [
  { label: 'Mới nhất', value: 'createdAt' },
  { label: 'Tên phòng (A-Z)', value: 'name' },
  { label: 'Sức chứa giảm dần', value: 'capacity' },
  { label: 'Mã phòng', value: 'roomCode' }
];

function emitChange() {
  emit('change-filter', { ...filters });
}

function resetFilters() {
  filters.search = '';
  filters.status = 'available';
  filters.minCapacity = '';
  filters.sortBy = 'createdAt';
  filters.sortOrder = 'desc';
  emit('reset');
}
</script>

<style scoped>
.room-filter-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1.2fr auto;
  gap: 12px;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 992px) {
  .filter-row {
    grid-template-columns: 1fr 1fr;
  }
  .search-field {
    grid-column: span 2;
  }
  .filter-actions {
    grid-column: span 2;
    justify-content: flex-end;
  }
}

@media (max-width: 576px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  .search-field, .filter-actions {
    grid-column: span 1;
  }
  .filter-actions {
    justify-content: stretch;
  }
}
</style>
