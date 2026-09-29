import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import PatientCombobox from '../PatientCombobox/PatientCombobox';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'معلقة' },
  { value: 'partial', label: 'جزئية' },
  { value: 'paid', label: 'مدفوعة' },
];

function InvoiceForm({ initialData, onSubmit, submitting }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    patient: initialData?.patient?.id || '',
    appointment: initialData?.appointment?.id || '',
    total_amount: initialData?.total_amount || '',
    paid_amount: initialData?.paid_amount || '',
    invoice_status: initialData?.invoice_status || 'pending',
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
    <form className="invoice-form" onSubmit={handleSubmit}>
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

      <div className="form-row">
        <div className="form-field">
          <label>المبلغ الإجمالي *</label>
          <input
            type="number"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>

        <div className="form-field">
          <label>المبلغ المدفوع</label>
          <input
            type="number"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            step="0.01"
          />
        </div>
      </div>

      <div className="form-field">
        <label>حالة الدفع</label>
        <select name="invoice_status" value={formData.invoice_status} onChange={handleChange}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

export default InvoiceForm;