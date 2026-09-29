import { useContext } from 'react';
import { ClinicSettingsContext } from '../context/ClinicSettingsContext';

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext);
  if (!context) {
    throw new Error('useClinicSettings must be used within a ClinicSettingsProvider');
  }
  return context;
}
