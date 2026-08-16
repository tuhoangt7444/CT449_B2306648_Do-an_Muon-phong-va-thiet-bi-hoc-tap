import { api } from './api';

export const buildingManagerService = {
  async getManagers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/building-managers${queryString}`);
  },

  async getManagerById(id) {
    return await api.get(`/building-managers/${id}`);
  },

  async createManager(data) {
    return await api.post('/building-managers', data);
  },

  async updateManager(id, data) {
    return await api.patch(`/building-managers/${id}`, data);
  },

  async deleteManager(id) {
    return await api.delete(`/building-managers/${id}`);
  }
};
