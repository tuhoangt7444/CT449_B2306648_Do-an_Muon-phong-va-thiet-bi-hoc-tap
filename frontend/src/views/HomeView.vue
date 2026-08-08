<template>
  <main class="home-container">
    <div class="card">
      <h1 class="title">StudyHub CTU</h1>
      <p class="description">Hệ thống đăng ký mượn phòng tự học và thiết bị học tập</p>
      
      <div class="status-box">
        <span class="status-label">Trạng thái kết nối Backend:</span>
        <div v-if="loading" class="status-badge checking">
          Đang kiểm tra...
        </div>
        <div v-else-if="connected" class="status-badge success">
          Backend hoạt động: {{ message }}
        </div>
        <div v-else class="status-badge error">
          Không thể kết nối backend: {{ errorMessage }}
        </div>
      </div>

      <button class="btn-refresh" :disabled="loading" @click="fetchHealth">
        {{ loading ? 'Đang gửi yêu cầu...' : 'Kiểm tra lại' }}
      </button>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { checkHealth } from '../services/healthService';

const loading = ref(true);
const connected = ref(false);
const message = ref('');
const errorMessage = ref('');

const fetchHealth = async () => {
  loading.value = true;
  connected.value = false;
  message.value = '';
  errorMessage.value = '';
  try {
    const result = await checkHealth();
    connected.value = true;
    message.value = result.message || 'StudyHub CTU API is running';
  } catch (err) {
    connected.value = false;
    errorMessage.value = err.message || 'Không thể kết nối backend';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchHealth();
});
</script>

<style scoped>
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background-color: #f8f9fa;
}

.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px;
  max-width: 540px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #111111;
  margin-bottom: 8px;
}

.description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.status-box {
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.status-badge {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 9999px;
}

.checking {
  background-color: #e5e7eb;
  color: #374151;
}

.success {
  background-color: #d1fae5;
  color: #065f46;
}

.error {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-refresh {
  background-color: #111111;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #242424;
}

.btn-refresh:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
