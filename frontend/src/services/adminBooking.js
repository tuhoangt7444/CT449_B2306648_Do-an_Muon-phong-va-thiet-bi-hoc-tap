import { api } from '@/services/api';

export const adminBookingService = {
  async getBookings(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.roomId) query.append('roomId', params.roomId);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/bookings${qStr}`);
  },

  async getBookingById(id) {
    return await api.get(`/bookings/${id}`);
  },

  async approveBooking(id, payload = {}) {
    return await api.patch(`/bookings/${id}/approve`, payload);
  },

  async rejectBooking(id, payload = {}) {
    return await api.patch(`/bookings/${id}/reject`, payload);
  },

  async checkInBooking(id, payload = {}) {
    return await api.patch(`/bookings/${id}/check-in`, payload);
  },

  async completeBooking(id, payload = {}) {
    return await api.patch(`/bookings/${id}/complete`, payload);
  }
};
