<template>
  <div class="login-view">
    <div class="login-card">
      <div class="card-header">
        <h2 class="card-title">Đăng Nhập Sinh Viên</h2>
        <p class="card-subtitle">Hệ thống quản lý đăng ký mượn phòng tự học StudyHub CTU</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <AppInput
          id="studentCode"
          v-model="studentCode"
          label="Mã số sinh viên"
          placeholder="Ví dụ: B2300001"
          required
        />

        <AppInput
          id="password"
          v-model="password"
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
          Đăng nhập
        </AppButton>
      </form>

      <div class="demo-box">
        <p class="demo-title">Tài khoản thử nghiệm (Demo):</p>
        <p class="demo-item"><span>Mã SV:</span> <code>B2300001</code> | <span>Mật khẩu:</span> <code>123456</code></p>
        <p class="demo-item"><span>Mã SV:</span> <code>B2300002</code> | <span>Mật khẩu:</span> <code>123456</code></p>
      </div>

      <div class="card-footer">
        <router-link to="/admin/login" class="admin-link">Đăng nhập dành cho Quản trị viên & Nhân viên</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppInput from '@/components/common/AppInput.vue';
import AppButton from '@/components/common/AppButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const studentCode = ref('');
const password = ref('');
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  if (!studentCode.value.trim() || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ mã sinh viên và mật khẩu';
    return;
  }

  try {
    await authStore.loginStudent({
      studentCode: studentCode.value.trim(),
      password: password.value
    });

    const redirectPath = route.query.redirect;
    if (redirectPath && typeof redirectPath === 'string' && redirectPath.startsWith('/')) {
      router.push(redirectPath);
    } else {
      router.push('/');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Đăng nhập thất bại';
  }
}
</script>

<style scoped>
.login-view {
  min-height: calc(100vh - var(--header-height) - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
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

.admin-link {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
