<template>
  <div class="app-input-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="inputId" class="app-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="app-input"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue']);

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`);
</script>

<style scoped>
.app-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.app-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.required-star {
  color: var(--color-danger);
}

.app-input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.app-input:focus {
  outline: none;
  border-color: var(--color-brand);
}

.app-input:disabled {
  background-color: var(--color-surface-elevated);
  cursor: not-allowed;
  opacity: 0.7;
}

.has-error .app-input {
  border-color: var(--color-danger);
}

.error-message {
  font-size: 12px;
  color: var(--color-danger);
}
</style>
