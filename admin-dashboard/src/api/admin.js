import api from './axios';

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard');

// Orders
export const getOrders = (params) => api.get('/admin/orders', { params });
export const getOrder = (id) => api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, data) => api.patch(`/admin/orders/${id}/status`, data);
export const assignOrder = (id, data) => api.patch(`/admin/orders/${id}/assign`, data);

// Users
export const getUsers = (params) => api.get('/admin/users', { params });
export const createUser = (data) => api.post('/admin/users', data);
export const updateUserStatus = (id) => api.patch(`/admin/users/${id}/status`);
export const updateUserRole = (id, data) => api.patch(`/admin/users/${id}/role`, data);

// Reports
export const getRevenueReport = (params) => api.get('/admin/reports/revenue', { params });
export const getOrderReport = (params) => api.get('/admin/reports/orders', { params }); 