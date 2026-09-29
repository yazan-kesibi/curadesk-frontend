import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../hooks/useToast';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get('/users/me?populate=role');
        setUser(response.data);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // axiosClient بيطلق هالحدث لما يوصل رد 401 (توكن منتهي/غير صالح)
  // من أي مكان بالتطبيق، فنسجل خروج تلقائي ونحول لصفحة الدخول بدل
  // ما تضل الطلبات تفشل بصمت.
  useEffect(() => {
    function handleUnauthorized() {
      const wasLoggedIn = Boolean(localStorage.getItem('token')) || user !== null;
      logout();
      if (wasLoggedIn) {
        toast.warning('انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى', {
          title: 'انتهت الجلسة',
        });
      }
      navigate('/login', { replace: true });
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate, toast, user]);

  async function login(identifier, password) {
    const response = await axiosClient.post('/auth/local', {
      identifier,
      password,
    });

    const { jwt } = response.data;
    localStorage.setItem('token', jwt);

    const userResponse = await axiosClient.get('/users/me?populate=role');
    setUser(userResponse.data);

    return userResponse.data;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
