<template>
  <div class="admin-login-view">
    <div class="login-card">
      <div class="card-header">
        <h2 class="card-title">Đăng Nhập Quản Trị</h2>
        <p class="card-subtitle">Cổng đăng nhập dành cho Nhân viên & Quản lý StudyHub CTU</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <AppInput
          id="staffCode"
          v-model="form.staffCode"
          label="Mã số nhân viên"
          placeholder="Ví dụ: ST001"
          required
        />

        <AppInput
          id="password"
          v-model="form.password"
          type="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          required
        />

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <AppButton
          type="submit"
          variant="primary"
          block
          :loading="authStore.isLoading"
        >
          Đăng nhập hệ thống
        </AppButton>
      </form>

      <div class="demo-box">
        <p class="demo-title">Tài khoản thử nghiệm (Demo):</p>
        <p class="demo-item"><span>Quản lý (Manager):</span> <code>ST001</code> | <code>123456</code></p>
        <p class="demo-item"><span>Nhân viên (Staff):</span> <code>ST002</code> | <code>123456</code></p>
      </div>

      <div class="card-footer">
        <router-link to="/login" class="student-link">Quay lại trang đăng nhập Sinh viên</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppInput from '@/components/common/AppInput.vue';
import AppButton from '@/components/common/AppButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  staffCode: '',
  password: ''
});

const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';

  const cleanCode = (form.staffCode || '').trim();
  const cleanPassword = (form.password || '').trim();

  if (!cleanCode) {
    errorMessage.value = 'Mã nhân viên là bắt buộc';
    return;
  }

  if (!cleanPassword) {
    errorMessage.value = 'Mật khẩu là bắt buộc';
    return;
  }

  try {
    await authStore.loginStaff({
      staffCode: cleanCode,
      identifier: cleanCode,
      password: cleanPassword
    });

    const redirectPath = route.query.redirect;
    if (redirectPath && typeof redirectPath === 'string' && redirectPath.startsWith('/admin') && redirectPath !== '/admin/login') {
      router.push(redirectPath);
    } else {
      router.push('/admin');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Đăng nhập thất bại';
  }
}
</script>

<style scoped>
.admin-login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background-color: var(--color-canvas);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 32px;
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.card-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-error {
  font-size: 13px;
  color: var(--color-danger);
  background-color: var(--color-danger-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  text-align: center;
}

.demo-box {
  margin-top: 24px;
  padding: 12px 14px;
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.demo-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text-primary);
}

.demo-item {
  margin-top: 2px;
}

.demo-item code {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-footer {
  margin-top: 20px;
  text-align: center;
}

.student-link {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
