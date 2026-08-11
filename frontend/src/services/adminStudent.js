import { api } from './api';

export const adminStudentService = {
  getStudents(params = {}, signal) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search.trim());
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/students${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, signal ? { signal } : undefined);
  },

  getStudentById(id, signal) {
    return api.get(`/students/${id}`, signal ? { signal } : undefined);
  },

  createStudent(payload) {
    return api.post('/students', payload);
  },

  updateStudent(id, payload) {
    return api.patch(`/students/${id}`, payload);
  },

  deleteStudent(id) {
    return api.delete(`/students/${id}`);
  }
};
