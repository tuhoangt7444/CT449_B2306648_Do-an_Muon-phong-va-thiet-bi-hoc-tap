import { api } from './api';

export const buildingService = {
  async getBuildings(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/buildings${queryString}`);
  },

  async getBuildingById(id) {
    return await api.get(`/buildings/${id}`);
  },

  async createBuilding(data) {
    return await api.post('/buildings', data);
  },

  async updateBuilding(id, data) {
    return await api.patch(`/buildings/${id}`, data);
  },

  async deleteBuilding(id) {
    return await api.delete(`/buildings/${id}`);
  }
};
