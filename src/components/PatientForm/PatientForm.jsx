import { useState } from 'react';

function PatientForm({ initialData, onSubmit, submitting }) {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || 'male',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    medical_history: initialData?.medical_history || '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form className="patient-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>الاسم الكامل *</label>
        <input name="full_name" value={formData.full_name} onChange={handleChange} required />
      </div>

      <div className="form-field">
        <label>تاريخ الميلاد *</label>
        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
      </div>

      <div className="form-field">
        <label>الجنس</label>
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
      </div>

      <div className="form-field">
        <label>الهاتف *</label>
        <input name="phone" value={formData.phone} onChange={handleChange} required />
      </div>

      <div className="form-field">
        <label>البريد الإلكتروني</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label>التاريخ المرضي</label>
        <textarea name="medical_history" value={formData.medical_history} onChange={handleChange} rows={3} />
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

export default PatientForm;