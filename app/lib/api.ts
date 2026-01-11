import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ticket API
export const ticketAPI = {
  getAll: () => apiClient.get('/tickets'),
  getById: (id: string) => apiClient.get(`/tickets/${id}`),
  create: (data: unknown) => apiClient.post('/tickets', data),
  update: (id: string, data: unknown) => apiClient.put(`/tickets/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tickets/${id}`),
};

// Technician API
export const technicianAPI = {
  getAll: () => apiClient.get('/technicians'),
  getById: (id: string) => apiClient.get(`/technicians/${id}`),
  getAssignments: (id: string) => apiClient.get(`/technicians/${id}/assignments`),
};

// Preventive Maintenance API
export const preventiveMaintenanceAPI = {
  getAll: () => apiClient.get('/preventive-maintenance'),
  getById: (id: string) => apiClient.get(`/preventive-maintenance/${id}`),
  create: (data: unknown) => apiClient.post('/preventive-maintenance', data),
};

// Dashboard Stats API
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

export default apiClient;
