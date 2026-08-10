<template>
  <div class="student-layout">
    <header class="student-header">
      <div class="header-container">
        <router-link to="/" class="brand-logo">
          <span class="logo-text">StudyHub</span>
          <span class="logo-badge">CTU</span>
        </router-link>

        <nav class="nav-links" :class="{ 'is-mobile-open': isMobileMenuOpen }">
          <router-link to="/" class="nav-item" @click="closeMobileMenu">Trang chủ</router-link>
          <router-link to="/rooms" class="nav-item" @click="closeMobileMenu">Phòng học</router-link>
          <router-link v-if="authStore.isStudent" to="/my-bookings" class="nav-item" @click="closeMobileMenu">Yêu cầu của tôi</router-link>
          <router-link v-if="authStore.isStudent" to="/profile" class="nav-item" @click="closeMobileMenu">Hồ sơ</router-link>
        </nav>

        <div class="header-actions">
          <ThemeToggle />
          <div v-if="authStore.isAuthenticated" class="user-menu">
            <span class="user-name">{{ authStore.user?.name || authStore.user?.studentCode || authStore.user?.staffCode }}</span>
            <AppButton size="sm" variant="ghost" @click="handleLogout">Đăng xuất</AppButton>
          </div>
          <div v-else class="auth-buttons">
            <router-link to="/login">
              <AppButton size="sm" variant="primary">Đăng nhập</AppButton>
            </router-link>
          </div>
          <button type="button" class="mobile-toggle" aria-label="Menu" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="content-container">
        <router-view />
      </div>
    </main>

    <footer class="student-footer">
      <div class="footer-container">
        <p>© 2026 StudyHub CTU - Trường Đại học Cần Thơ. Đồ án môn CT449.</p>
        <div class="footer-links">
          <router-link to="/rooms">Phòng tự học</router-link>
          <router-link to="/admin/login">Dành cho Nhân viên</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import AppButton from '@/components/common/AppButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const isMobileMenuOpen = ref(false);

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.student-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.student-header {
  height: var(--header-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.logo-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-item {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.nav-item:hover, .nav-item.router-link-active {
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mobile-toggle {
  display: none;
  color: var(--color-text-primary);
}

.main-content {
  flex: 1;
  padding: 32px 20px;
}

.content-container {
  max-width: var(--max-width-content);
  margin: 0 auto;
}

.student-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 24px 20px;
  margin-top: auto;
}

.footer-container {
  max-width: var(--max-width-content);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-muted);
  flex-wrap: wrap;
  gap: 12px;
}

.footer-links {
  display: flex;
  gap: 16px;
}

.footer-links a {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    position: absolute;
    top: var(--header-height);
    left: 0;
    right: 0;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-direction: column;
    padding: 16px 20px;
    gap: 16px;
    align-items: flex-start;
  }

  .nav-links.is-mobile-open {
    display: flex;
  }

  .mobile-toggle {
    display: block;
  }

  .user-name {
    display: none;
  }
}
</style>
