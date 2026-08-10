import { api } from '@/services/api';

export const dashboardService = {
  async getSummary() {
    return await api.get('/dashboard/summary');
  },

  async getBookingsByStatus(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/bookings-by-status${qStr}`);
  },

  async getBookingsByDay(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.days) query.append('days', params.days);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/bookings-by-day${qStr}`);
  },

  async getPopularRooms(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/popular-rooms${qStr}`);
  },

  async getEquipmentAlerts() {
    return await api.get('/dashboard/equipment-alerts');
  }
};
