<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          @click.stop
        >
          <header class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button
              type="button"
              class="close-button"
              aria-label="Đóng hộp thoại"
              @click="closeModal"
            >
              &times;
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

function closeModal() {
  emit('update:modelValue', false);
  emit('close');
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    closeModal();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal();
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-container {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  font-size: 24px;
  line-height: 1;
  color: var(--color-text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;

}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--color-border);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-fast);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
