import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import PatientCombobox from '../PatientCombobox/PatientCombobox';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
  { value: 'no_show', label: 'لم يحضر' },
];

function AppointmentForm({ initialData, onSubmit, submitting }) {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient: initialData?.patient?.id || '',
    appointment_date: initialData?.appointment_date?.slice(0, 16) || '',
    appointment_status: initialData?.appointment_status || 'scheduled',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    async function fetchPatients() {
      const response = await axiosClient.get('/patients?sort=full_name:asc&pagination[pageSize]=100');
      setPatients(response.data.data);
    }
    fetchPatients();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <PatientCombobox
        patients={patients}
        value={formData.patient}
        onChange={(id) => setFormData((prev) => ({ ...prev, patient: id }))}
        required
      />

      <div className="form-field">
        <label>التاريخ والوقت *</label>
        <input
          type="datetime-local"
          name="appointment_date"
          value={formData.appointment_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field">
        <label>الحالة</label>
        <select name="appointment_status" value={formData.appointment_status} onChange={handleChange}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>ملاحظات</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} />
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

export default AppointmentForm;