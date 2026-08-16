import { api } from './api';

export const adminRoomService = {
  getRooms(params = {}, signal) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search.trim());
    if (params.buildingId) query.append('buildingId', params.buildingId);
    if (params.status) query.append('status', params.status);
    if (params.minCapacity) query.append('minCapacity', params.minCapacity);
    if (params.facility) query.append('facility', params.facility);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/rooms${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, signal ? { signal } : undefined);
  },

  getRoomById(id, signal) {
    return api.get(`/rooms/${id}`, signal ? { signal } : undefined);
  },

  createRoom(payload) {
    return api.post('/rooms', payload);
  },

  updateRoom(id, payload) {
    return api.patch(`/rooms/${id}`, payload);
  },

  deleteRoom(id) {
    return api.delete(`/rooms/${id}`);
  }
};
