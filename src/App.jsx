import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Patients from './pages/Patients/Patients';
import PatientDetail from './pages/PatientDetail/PatientDetail';
import Appointments from './pages/Appointments/Appointments';
import MedicalRecords from './pages/MedicalRecords/MedicalRecords';
import Prescriptions from './pages/Prescriptions/Prescriptions';
import Invoices from './pages/Invoices/Invoices';
import ClinicSettings from './pages/ClinicSettings/ClinicSettings';
import Notifications from './pages/Notifications/Notifications';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:documentId" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/records" element={<MedicalRecords />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/settings" element={<ClinicSettings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;