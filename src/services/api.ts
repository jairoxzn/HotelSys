import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hotelflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format API Errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ha ocurrido un error inesperado.';
    return Promise.reject(new Error(message));
  }
);

export default api;

// 1. Auth Service
export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// 2. Rooms Service
export const roomService = {
  getAll: async (params?: { status?: string; type?: string }) => {
    const res = await api.get('/rooms', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/rooms/${id}`);
    return res.data;
  },
  create: async (roomData: any) => {
    const res = await api.post('/rooms', roomData);
    return res.data;
  },
  update: async (id: string, roomData: any) => {
    const res = await api.put(`/rooms/${id}`, roomData);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/rooms/${id}/status`, { status });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  },
};

// 3. Customers Service
export const customerService = {
  getAll: async (search?: string) => {
    const res = await api.get('/customers', { params: { search } });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },
  create: async (customerData: any) => {
    const res = await api.post('/customers', customerData);
    return res.data;
  },
  update: async (id: string, customerData: any) => {
    const res = await api.put(`/customers/${id}`, customerData);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
};

// 4. Reservations Service
export const reservationService = {
  getAll: async (params?: { status?: string; roomId?: string; customerId?: string }) => {
    const res = await api.get('/reservations', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/reservations/${id}`);
    return res.data;
  },
  create: async (resData: any) => {
    const res = await api.post('/reservations', resData);
    return res.data;
  },
  update: async (id: string, resData: any) => {
    const res = await api.put(`/reservations/${id}`, resData);
    return res.data;
  },
  checkIn: async (id: string) => {
    const res = await api.post(`/reservations/${id}/check-in`);
    return res.data;
  },
  checkOut: async (id: string) => {
    const res = await api.post(`/reservations/${id}/check-out`);
    return res.data;
  },
  cancel: async (id: string) => {
    const res = await api.post(`/reservations/${id}/cancel`);
    return res.data;
  },
};

// 5. Payments Service
export const paymentService = {
  getAll: async (reservationId?: string) => {
    const res = await api.get('/payments', { params: { reservationId } });
    return res.data;
  },
  create: async (paymentData: any) => {
    const res = await api.post('/payments', paymentData);
    return res.data;
  },
};

// 6. Dashboard Service
export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },
};

// 7. Reports Service
export const reportService = {
  getFinancial: async (year?: number) => {
    const res = await api.get('/reports/financial', { params: { year } });
    return res.data;
  },
  getRooms: async () => {
    const res = await api.get('/reports/rooms');
    return res.data;
  },
  getCustomers: async () => {
    const res = await api.get('/reports/customers');
    return res.data;
  },
  getAuditLogs: async (params?: { action?: string; userId?: string; search?: string }) => {
    const res = await api.get('/reports/audit', { params });
    return res.data;
  },
};

// 8. System Config Service
export const configService = {
  get: async () => {
    const res = await api.get('/config');
    return res.data;
  },
  update: async (data: { hotelName?: string; primaryColor?: string; logoUrl?: string | null }) => {
    const res = await api.put('/config', data);
    return res.data;
  },
};
