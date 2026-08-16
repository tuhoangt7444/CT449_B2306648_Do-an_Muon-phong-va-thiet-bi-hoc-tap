import { api } from './api';

export const adminReviewService = {
  getReviews(params = {}, signal) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search.trim());
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.rating) query.append('rating', params.rating);
    if (params.roomId) query.append('roomId', params.roomId);
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/reviews${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, signal ? { signal } : undefined);
  },

  getReviewById(id, signal) {
    return api.get(`/reviews/${id}`, signal ? { signal } : undefined);
  }
};
