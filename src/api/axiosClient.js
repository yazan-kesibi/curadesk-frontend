import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

axiosClient.interceptors.request.use((config) => {
  const isAuthRequest = config.url.includes('/auth/');

  if (!isAuthRequest) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');

    // Token غير صالح/منتهي: نظّف الجلسة ونبّه بقية التطبيق (AuthContext)
    // لتحويل المستخدم لصفحة الدخول، بدل ما تفشل كل الطلبات بصمت.
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;