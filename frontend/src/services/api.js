import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // envia cookie httpOnly em todas as requisições
});

// Notifica o AuthContext quando o servidor rejeita a sessão
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const wasLoggedIn = !!localStorage.getItem('luz_user');
      localStorage.removeItem('luz_user');
      if (wasLoggedIn) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
