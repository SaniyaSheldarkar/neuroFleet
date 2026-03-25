import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false
});

const AI = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('nfx_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const authAPI = {
  login:    (d) => API.post('/auth/login', d),
  register: (d) => API.post('/auth/register', d),
};

export const vehicleAPI = {
  getAll:       ()      => API.get('/vehicles'),
  getById:      (id)    => API.get(`/vehicles/${id}`),
  getStats:     ()      => API.get('/vehicles/stats'),
  create:       (d)     => API.post('/vehicles', d),
  update:       (id, d) => API.put(`/vehicles/${id}`, d),
  delete:       (id)    => API.delete(`/vehicles/${id}`),
  updateStatus: (id, s) => API.patch(`/vehicles/${id}/status`, { status: s }),
};

export const bookingAPI = {
  getAll:       ()        => API.get('/bookings'),
  getMy:        ()        => API.get('/bookings/my'),
  create:       (d)       => API.post('/bookings', d),
  updateStatus: (id, s)   => API.patch(`/bookings/${id}/status`, { status: s }),
  getStats:     ()        => API.get('/bookings/stats'),
};

export const maintenanceAPI = {
  getAllAlerts:     ()    => API.get('/maintenance/alerts'),
  getActiveAlerts: ()    => API.get('/maintenance/alerts/active'),
  getHealth:       (id)  => API.get(`/maintenance/health/${id}`),
  resolveAlert:    (id)  => API.patch(`/maintenance/alerts/${id}/resolve`),
  runCheck:        (id)  => API.post(`/maintenance/check/${id}`),
};

export const analyticsAPI = {
  getKpis:          () => API.get('/analytics/kpis'),
  getTripsPerHour:  () => API.get('/analytics/trips-per-hour'),
  getVehicleUsage:  () => API.get('/analytics/vehicle-usage'),
  getWeeklyRevenue: () => API.get('/analytics/revenue-weekly'),
};

export const aiAPI = {
  optimizeRoute:    (d) => AI.post('/optimize-route', d),
  recommendVehicle: (d) => AI.post('/recommend-vehicle', d),
};

export default API;