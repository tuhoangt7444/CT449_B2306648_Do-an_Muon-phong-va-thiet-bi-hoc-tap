import { api } from '@/services/api';

export const bookingService = {
  async createBooking(payload) {
    return await api.post('/bookings', payload);
  },

  async getEquipment(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.startTime) query.append('startTime', params.startTime);
    if (params.endTime) query.append('endTime', params.endTime);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/equipment${queryString}`);
  },

  async getMyBookings(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/bookings${queryString}`);
  },

  async getBookingById(id) {
    return await api.get(`/bookings/${id}`);
  },

  async cancelBooking(id, payload = {}) {
    return await api.patch(`/bookings/${id}/cancel`, payload);
  }
};
