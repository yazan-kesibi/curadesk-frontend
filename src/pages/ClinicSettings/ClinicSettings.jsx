import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { SPECIALTIES } from '../../constants/specialties';
import { useClinicSettings } from '../../hooks/useClinicSettings';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './ClinicSettings.scss';

function ClinicSettings() {
  const { refetchSettings } = useClinicSettings();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    clinic_name: '',
    specialty: 'general',
    appointment_duration: 30,
    currency: '',
    dark_mode: false,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await axiosClient.get('/clinic-setting');
        if (response.data.data) {
          const settings = response.data.data;
          setFormData({
            clinic_name: settings.clinic_name || '',
            specialty: settings.specialty || 'general',
            appointment_duration: settings.appointment_duration || 30,
            currency: settings.currency || '',
            dark_mode: settings.dark_mode || false,
          });
        }
      } catch (err) {
        setError(getErrorMessage(err, 'حدث خطأ أثناء جلب إعدادات العيادة'));
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await axiosClient.put('/clinic-setting', { data: formData });
      setSaved(true);
      // نحدّث الثيم فوراً (لون التخصص + الوضع الداكن) بدل ما ننتظر إعادة تحميل الصفحة
      await refetchSettings();
      toast.success('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حفظ الإعدادات'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SkeletonList rows={1} />;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="clinic-settings-page">
      <h1>إعدادات العيادة</h1>
      <p className="clinic-settings-page__subtitle">هذه الإعدادات تنطبق على كامل النظام</p>

      <form className="clinic-settings-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>اسم العيادة *</label>
          <input
            name="clinic_name"
            value={formData.clinic_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label>التخصص</label>
          <select name="specialty" value={formData.specialty} onChange={handleChange}>
            {SPECIALTIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="form-field__hint">بيغيّر لون الواجهة الأساسي بكل النظام</span>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>مدة الموعد (بالدقائق) *</label>
            <input
              type="number"
              name="appointment_duration"
              value={formData.appointment_duration}
              onChange={handleChange}
              required
              min={5}
            />
          </div>

          <div className="form-field">
            <label>العملة *</label>
            <input
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="مثال: $ أو ل.س"
              required
            />
          </div>
        </div>

        <div className="clinic-settings-form__checkbox">
          <input
            type="checkbox"
            id="dark_mode"
            name="dark_mode"
            checked={formData.dark_mode}
            onChange={handleChange}
          />
          <label htmlFor="dark_mode">تفعيل الوضع الداكن</label>
        </div>

        <button type="submit" className="form-submit" disabled={saving}>
          <Save size={18} />
          <span>{saving ? 'جارِ الحفظ...' : 'حفظ الإعدادات'}</span>
        </button>

        {saved && (
          <p className="clinic-settings-form__success">
            <CheckCircle2 size={16} />
            تم الحفظ بنجاح
          </p>
        )}
      </form>
    </div>
  );
}

export default ClinicSettings;
