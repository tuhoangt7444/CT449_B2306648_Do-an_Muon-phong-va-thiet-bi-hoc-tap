import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const userType = ref(null);
  const role = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const isStudent = computed(() => userType.value === 'student');
  const isStaff = computed(() => userType.value === 'staff');
  const isManager = computed(() => userType.value === 'staff' && role.value === 'manager');

  function setUserState(userData, type, staffRole = null) {
    if (userData) {
      user.value = {
        ...userData,
        name: userData.fullName || userData.name || '',
        department: userData.faculty || userData.department || ''
      };
    } else {
      user.value = null;
    }
    userType.value = type;
    role.value = staffRole || (userData ? userData.role : null);
    isAuthenticated.value = !!userData;
  }

  function clearUserState() {
    user.value = null;
    userType.value = null;
    role.value = null;
    isAuthenticated.value = false;
  }

  async function fetchCurrentUser() {
    isLoading.value = true;
    try {
      const res = await api.get('/auth/me');
      if (res && res.data) {
        setUserState(res.data, res.userType, res.role);
      } else {
        clearUserState();
      }
      return res;
    } catch (err) {
      clearUserState();
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function initialize() {
    if (isInitialized.value) return;
    try {
      await fetchCurrentUser();
    } catch (err) {
    } finally {
      isInitialized.value = true;
    }
  }

  async function loginStudent(credentials) {
    isLoading.value = true;
    try {
      const res = await api.post('/auth/student/login', credentials);
      if (res && res.data) {
        setUserState(res.data, 'student');
      }
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  async function loginStaff(credentials) {
    isLoading.value = true;
    try {
      const res = await api.post('/auth/staff/login', credentials);
      if (res && res.data) {
        setUserState(res.data, 'staff', res.data.role);
      }
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await api.post('/auth/logout');
    } catch (err) {
    } finally {
      clearUserState();
      isLoading.value = false;
    }
  }

  return {
    user,
    userType,
    role,
    isAuthenticated,
    isLoading,
    isInitialized,
    isStudent,
    isStaff,
    isManager,
    initialize,
    fetchCurrentUser,
    loginStudent,
    loginStaff,
    logout
  };
});
