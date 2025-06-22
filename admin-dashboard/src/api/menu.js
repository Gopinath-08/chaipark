import api from './axios';

export const getMenuItems = (params) => api.get('/menu', { params });
export const getMenuItem = (id) => api.get(`/menu/${id}`);
export const createMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);
export const toggleAvailability = (id) => api.patch(`/menu/${id}/availability`);
export const toggleFeatured = (id) => api.patch(`/menu/${id}/feature`);
export const getPopularItems = (params) => api.get('/menu/stats/popular', { params });
export const getCategories = () => api.get('/menu/categories'); 