import { api } from './api';

export const adminEquipmentService = {
  getEquipment(params = {}, signal) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search.trim());
    if (params.status) query.append('status', params.status);
    if (params.lowStock !== undefined && params.lowStock !== null && params.lowStock !== '') {
      query.append('lowStock', params.lowStock);
    }
    if (params.startTime) query.append('startTime', params.startTime);
    if (params.endTime) query.append('endTime', params.endTime);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/equipment${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, signal ? { signal } : undefined);
  },

  getEquipmentById(id, signal) {
    return api.get(`/equipment/${id}`, signal ? { signal } : undefined);
  },

  getLowStockAlerts(signal) {
    return api.get('/equipment/alerts/low-stock', signal ? { signal } : undefined);
  },

  createEquipment(payload) {
    return api.post('/equipment', payload);
  },

  updateEquipment(id, payload) {
    return api.patch(`/equipment/${id}`, payload);
  },

  deleteEquipment(id) {
    return api.delete(`/equipment/${id}`);
  }
};
