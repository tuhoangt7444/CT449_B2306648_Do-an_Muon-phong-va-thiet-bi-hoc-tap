<template>
  <div class="login-view">
    <div class="login-card">
      <div class="card-header">
        <div class="logo-wrapper" v-if="!hasLogoError">
          <img
            :src="logoUrl"
            alt="StudyHub CTU Logo"
            class="login-logo-img"
            @error="hasLogoError = true"
          />
        </div>
        <h2 class="card-title">Đăng Nhập StudyHub CTU</h2>
        <p class="card-subtitle">Hệ thống quản lý đăng ký mượn phòng tự học & thiết bị</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <AppInput
          id="identifier"
          v-model="form.identifier"
          label="Mã số sinh viên"
          placeholder="MSSV (B2300001)"
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
  identifier: '',
  password: ''
});

const errorMessage = ref('');
const hasLogoError = ref(false);
const logoUrl = '/Logo-StudyHubCTU.png';

async function handleSubmit() {
  errorMessage.value = '';

  const cleanIdentifier = (form.identifier || '').trim();
  const cleanPassword = (form.password || '').trim();

  if (!cleanIdentifier) {
    errorMessage.value = 'Mã số sinh viên hoặc Mã nhân viên là bắt buộc';
    return;
  }

  if (!cleanPassword) {
    errorMessage.value = 'Mật khẩu là bắt buộc';
    return;
  }

  try {
    const res = await authStore.loginUnified({
      identifier: cleanIdentifier,
      password: cleanPassword
    });

    const redirectPath = route.query.redirect;
    if (redirectPath && typeof redirectPath === 'string') {
      router.push(redirectPath);
    } else if (res.userType === 'staff') {
      router.push('/admin');
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

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.login-logo-img {
  height: 54px;
  width: auto;
  object-fit: contain;
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
