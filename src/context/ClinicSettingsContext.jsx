import { createContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';
import { getSpecialtyColor } from '../constants/specialties';

// eslint-disable-next-line react-refresh/only-export-components
export const ClinicSettingsContext = createContext();

function applyTheme(settings) {
  const root = document.documentElement;
  root.dataset.theme = settings?.dark_mode ? 'dark' : 'light';
  root.style.setProperty('--accent-color', getSpecialtyColor(settings?.specialty));
}

export function ClinicSettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axiosClient.get('/clinic-setting');
      const data = response.data.data || null;
      setSettings(data);
      applyTheme(data);
    } catch {
      // ما في إعدادات محفوظة بعد (عيادة جديدة) — منستخدم القيم الافتراضية بصمت
      applyTheme(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user, fetchSettings]);

  return (
    <ClinicSettingsContext.Provider value={{ settings, loading, refetchSettings: fetchSettings }}>
      {children}
    </ClinicSettingsContext.Provider>
  );
}
