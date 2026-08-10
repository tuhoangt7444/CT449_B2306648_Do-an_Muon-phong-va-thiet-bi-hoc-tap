import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import StudentLayout from '@/layouts/StudentLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

import HomeView from '@/views/student/HomeView.vue';
import StudentLoginView from '@/views/auth/StudentLoginView.vue';
import RoomsView from '@/views/student/RoomsView.vue';
import RoomDetailView from '@/views/student/RoomDetailView.vue';
import RoomBookView from '@/views/student/RoomBookView.vue';
import MyBookingsView from '@/views/student/MyBookingsView.vue';
import BookingDetailView from '@/views/student/BookingDetailView.vue';
import ProfileView from '@/views/student/ProfileView.vue';

import AdminLoginView from '@/views/auth/AdminLoginView.vue';
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue';
import AdminBookingsView from '@/views/admin/AdminBookingsView.vue';
import AdminBookingDetailView from '@/views/admin/AdminBookingDetailView.vue';
import AdminRoomsView from '@/views/admin/AdminRoomsView.vue';
import AdminEquipmentView from '@/views/admin/AdminEquipmentView.vue';
import AdminStudentsView from '@/views/admin/AdminStudentsView.vue';
import AdminCalendarView from '@/views/admin/AdminCalendarView.vue';
import AdminReviewsView from '@/views/admin/AdminReviewsView.vue';

import NotFoundView from '@/views/NotFoundView.vue';

const routes = [
  {
    path: '/',
    component: StudentLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'login', name: 'student-login', component: StudentLoginView, meta: { guestOnly: true } },
      { path: 'rooms', name: 'rooms', component: RoomsView },
      { path: 'rooms/:id', name: 'room-detail', component: RoomDetailView },
      { path: 'rooms/:id/book', name: 'room-book', component: RoomBookView, meta: { requireStudent: true } },
      { path: 'my-bookings', name: 'my-bookings', component: MyBookingsView, meta: { requireStudent: true } },
      { path: 'my-bookings/:id', name: 'booking-detail', component: BookingDetailView, meta: { requireStudent: true } },
      { path: 'profile', name: 'profile', component: ProfileView, meta: { requireStudent: true } }
    ]
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requireStaff: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboardView },
      { path: 'bookings', name: 'admin-bookings', component: AdminBookingsView },
      { path: 'bookings/:id', name: 'admin-booking-detail', component: AdminBookingDetailView },
      { path: 'rooms', name: 'admin-rooms', component: AdminRoomsView },
      { path: 'equipment', name: 'admin-equipment', component: AdminEquipmentView },
      { path: 'students', name: 'admin-students', component: AdminStudentsView },
      { path: 'calendar', name: 'admin-calendar', component: AdminCalendarView },
      { path: 'reviews', name: 'admin-reviews', component: AdminReviewsView }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.isStaff) return next('/admin');
    return next('/');
  }

  if (to.meta.requireStudent) {
    if (!authStore.isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
    if (!authStore.isStudent) {
      return next('/admin');
    }
  }

  if (to.meta.requireStaff) {
    if (!authStore.isAuthenticated) {
      return next({ path: '/admin/login', query: { redirect: to.fullPath } });
    }
    if (!authStore.isStaff) {
      return next('/');
    }
  }

  next();
});

export default router;
