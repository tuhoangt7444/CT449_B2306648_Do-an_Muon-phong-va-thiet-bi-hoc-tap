import { api } from '@/services/api';

export const dashboardService = {
  async getSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.buildingId) query.append('buildingId', params.buildingId);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/summary${qStr}`);
  },

  async getBookingsByStatus(params = {}) {
    const query = new URLSearchParams();
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/bookings-by-status${qStr}`);
  },

  async getBookingsByDay(params = {}) {
    const query = new URLSearchParams();
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.days) query.append('days', params.days);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/bookings-by-day${qStr}`);
  },

  async getPopularRooms(params = {}) {
    const query = new URLSearchParams();
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.limit) query.append('limit', params.limit);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/popular-rooms${qStr}`);
  },

  async getEquipmentAlerts(params = {}) {
    const query = new URLSearchParams();
    if (params.buildingId) query.append('buildingId', params.buildingId);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/dashboard/equipment-alerts${qStr}`);
  }
};
