import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/', 
});

api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken
        });

        localStorage.setItem('accessToken', response.data.access);

        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;