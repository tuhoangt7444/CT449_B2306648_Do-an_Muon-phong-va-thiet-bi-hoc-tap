<template>
  <div class="admin-layout">
    <div v-if="isMobileSidebarOpen" class="sidebar-overlay" @click="isMobileSidebarOpen = false"></div>

    <aside class="admin-sidebar" :class="{ 'is-mobile-open': isMobileSidebarOpen }">
      <div class="sidebar-header">
        <router-link to="/admin" class="admin-brand">
          <span class="brand-name">StudyHub</span>
          <span class="admin-tag">Admin</span>
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin" exact-active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Dashboard</span>
        </router-link>

        <router-link to="/admin/bookings" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/>
          </svg>
          <span>Yêu cầu mượn</span>
        </router-link>

        <router-link to="/admin/rooms" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2Z"/>
          </svg>
          <span>Quản lý Phòng</span>
        </router-link>

        <router-link to="/admin/equipment" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span>Thiết bị</span>
        </router-link>

        <router-link to="/admin/students" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Sinh viên</span>
        </router-link>

        <router-link to="/admin/calendar" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          <span>Lịch mượn phòng</span>
        </router-link>

        <router-link to="/admin/reviews" active-class="is-active" class="sidebar-item" @click="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Đánh giá</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="sidebar-link">Về trang sinh viên</router-link>
      </div>
    </aside>

    <div class="admin-body">
      <header class="admin-header">
        <div class="header-left">
          <button type="button" class="mobile-sidebar-toggle" aria-label="Mở menu" @click="isMobileSidebarOpen = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/>
            </svg>
          </button>
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>

        <div class="header-right">
          <ThemeToggle />
          <div class="admin-user-info">
            <div class="user-meta">
              <span class="admin-name">{{ authStore.user?.name || authStore.user?.staffCode }}</span>
              <span class="role-badge">{{ authStore.isManager ? 'Quản lý' : 'Nhân viên' }}</span>
            </div>
            <AppButton size="sm" variant="secondary" @click="handleLogout">Đăng xuất</AppButton>
          </div>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import AppButton from '@/components/common/AppButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isMobileSidebarOpen = ref(false);

function closeSidebar() {
  isMobileSidebarOpen.value = false;
}

const pageTitles = {
  '/admin': 'Dashboard Thống Kê',
  '/admin/bookings': 'Quản Lý Yêu Cầu Mượn Phòng',
  '/admin/rooms': 'Quản Lý Phòng Học',
  '/admin/equipment': 'Quản Lý Thiết Bị Học Tập',
  '/admin/students': 'Quản Lý Sinh Viên',
  '/admin/calendar': 'Lịch Mượn Phòng Tổng Quan',
  '/admin/reviews': 'Quản Lý Đánh Giá Phòng'
};

const currentPageTitle = computed(() => {
  return pageTitles[route.path] || 'Trang Quản Trị';
});

async function handleLogout() {
  await authStore.logout();
  router.push('/admin/login');
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-canvas);
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 199;
}

.admin-sidebar {
  width: var(--sidebar-width);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  transition: transform var(--transition-fast);
}

.sidebar-header {
  height: var(--header-height);
  padding: 0 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.admin-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-brand);
  color: #ffffff;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.sidebar-item:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.sidebar-item.is-active {
  background-color: var(--color-surface-elevated);
  color: var(--color-brand);
  font-weight: 600;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.sidebar-link {
  font-size: 13px;
  color: var(--color-text-muted);
}

.admin-body {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-header {
  height: var(--header-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-sidebar-toggle {
  display: none;
  color: var(--color-text-primary);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.role-badge {
  font-size: 11px;
  color: var(--color-text-muted);
}

.admin-content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  width: 100%;
}

@media (max-width: 992px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.is-mobile-open {
    transform: translateX(0);
  }

  .admin-body {
    margin-left: 0;
  }

  .mobile-sidebar-toggle {
    display: block;
  }
}
</style>
