import { api } from '@/services/api';

export const roomService = {
  async getRooms(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.minCapacity) query.append('minCapacity', params.minCapacity);
    if (params.facility) query.append('facility', params.facility);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/rooms${queryString}`);
  },

  async getRoomById(id) {
    return await api.get(`/rooms/${id}`);
  },

  async getRoomSchedule(id, date) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await api.get(`/rooms/${id}/schedule${query}`);
  },

  async getRoomReviews(id, params = {}) {
    const query = new URLSearchParams();
    if (params.rating) query.append('rating', params.rating);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/rooms/${id}/reviews${queryString}`);
  }
};
