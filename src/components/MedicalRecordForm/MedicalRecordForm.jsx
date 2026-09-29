import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import PatientCombobox from '../PatientCombobox/PatientCombobox';

function MedicalRecordForm({ initialData, onSubmit, submitting }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    patient: initialData?.patient?.id || '',
    appointment: initialData?.appointment?.id || '',
    diagnosis: initialData?.diagnosis || '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    async function fetchData() {
      const [patientsRes, appointmentsRes] = await Promise.all([
        axiosClient.get('/patients?sort=full_name:asc&pagination[pageSize]=100'),
        axiosClient.get('/appointments?populate=patient'),
      ]);
      setPatients(patientsRes.data.data);
      setAppointments(appointmentsRes.data.data);
    }
    fetchData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  const relevantAppointments = appointments.filter(
    (appointment) => String(appointment.patient?.id) === String(formData.patient)
  );

  return (
    <form className="medical-record-form" onSubmit={handleSubmit}>
      <PatientCombobox
        patients={patients}
        value={formData.patient}
        onChange={(id) => setFormData((prev) => ({ ...prev, patient: id }))}
        required
      />

      <div className="form-field">
        <label>الموعد المرتبط (اختياري)</label>
        <select name="appointment" value={formData.appointment} onChange={handleChange}>
          <option value="">بدون ربط بموعد</option>
          {relevantAppointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {new Date(appointment.appointment_date).toLocaleDateString('ar-EG')}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>التشخيص *</label>
        <input name="diagnosis" value={formData.diagnosis} onChange={handleChange} required />
      </div>

      <div className="form-field">
        <label>ملاحظات</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} />
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

export default MedicalRecordForm;