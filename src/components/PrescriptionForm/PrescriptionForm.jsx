import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import PatientCombobox from '../PatientCombobox/PatientCombobox';
import './PrescriptionForm.scss';

function PrescriptionForm({ initialData, onSubmit, submitting }) {
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [formData, setFormData] = useState({
    patient: initialData?.patient?.id || '',
    medical_record: initialData?.medical_record?.id || '',
  });
  const [medications, setMedications] = useState(
    initialData?.medications?.length ? initialData.medications : [{ name: '', dosage: '' }]
  );

  useEffect(() => {
    async function fetchData() {
      const [patientsRes, recordsRes] = await Promise.all([
        axiosClient.get('/patients?sort=full_name:asc&pagination[pageSize]=100'),
        axiosClient.get('/medical-records?populate=patient'),
      ]);
      setPatients(patientsRes.data.data);
      setMedicalRecords(recordsRes.data.data);
    }
    fetchData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleMedicationChange(index, field, value) {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  }

  function addMedicationRow() {
    setMedications((prev) => [...prev, { name: '', dosage: '' }]);
  }

  function removeMedicationRow(index) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...formData, medications });
  }

  const relevantRecords = medicalRecords.filter(
    (record) => String(record.patient?.id) === String(formData.patient)
  );

  return (
    <form className="prescription-form" onSubmit={handleSubmit}>
      <PatientCombobox
        patients={patients}
        value={formData.patient}
        onChange={(id) => setFormData((prev) => ({ ...prev, patient: id }))}
        required
      />

      <div className="form-field">
        <label>السجل الطبي المرتبط *</label>
        <select name="medical_record" value={formData.medical_record} onChange={handleChange} required>
          <option value="">اختر سجلاً طبياً</option>
          {relevantRecords.map((record) => (
            <option key={record.id} value={record.id}>
              {record.diagnosis}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>الأدوية</label>
        {medications.map((med, index) => (
          <div className="medication-row" key={index}>
            <input
              type="text"
              placeholder="اسم الدواء"
              value={med.name}
              onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
            />
            <input
              type="text"
              placeholder="الجرعة"
              value={med.dosage}
              onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
            />
            {medications.length > 1 && (
              <button type="button" onClick={() => removeMedicationRow(index)}>
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-medication-btn" onClick={addMedicationRow}>
          <Plus size={16} />
          <span>إضافة دواء</span>
        </button>
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

export default PrescriptionForm;