import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for future token refresh logic)
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Auto-redirect on 401 (session expired), except on auth routes
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/')
    ) {
      window.location.href = '/login';
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
