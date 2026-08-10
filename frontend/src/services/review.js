import { api } from '@/services/api';

export const reviewService = {
  async getMyReviews(params = {}) {
    const query = new URLSearchParams();
    if (params.roomId) query.append('roomId', params.roomId);
    if (params.bookingId) query.append('bookingId', params.bookingId);
    if (params.rating) query.append('rating', params.rating);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/reviews${queryString}`);
  },

  async createReview(payload) {
    return await api.post('/reviews', payload);
  },

  async updateReview(id, payload) {
    return await api.patch(`/reviews/${id}`, payload);
  },

  async deleteReview(id) {
    return await api.delete(`/reviews/${id}`);
  }
};
