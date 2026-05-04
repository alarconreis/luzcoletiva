import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('luz_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const idleTimerRef = useRef(null);

  // Chamado pelo botão Sair e pelo idle timeout: invalida o token no servidor
  const logout = useCallback(() => {
    api.post('/logout').catch(() => {});
    localStorage.removeItem('luz_user');
    setUser(null);
    clearTimeout(idleTimerRef.current);
  }, []);

  // Chamado quando o servidor rejeita a sessão (401): sem chamada API pois o token já é inválido
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('luz_user');
    setUser(null);
    clearTimeout(idleTimerRef.current);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', handleSessionExpired);
    return () => window.removeEventListener('auth:expired', handleSessionExpired);
  }, [handleSessionExpired]);

  // Expiração por inatividade: reinicia o timer a cada interação do usuário
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
    };

    IDLE_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(idleTimerRef.current);
    };
  }, [user, logout]);

  const persist = (userData) => {
    localStorage.setItem('luz_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      await api.post('/register', formData);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Erro ao cadastrar' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, password });
      if (data.otp_required) {
        return { ok: true, otp_required: true, otp_token: data.otp_token, phone_hint: data.phone_hint };
      }
      persist(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Erro ao entrar' };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp_token, code) => {
    setLoading(true);
    try {
      const { data } = await api.post('/verify-otp', { otp_token, code });
      persist(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Código inválido' };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('luz_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
