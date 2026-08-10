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
  }
};
