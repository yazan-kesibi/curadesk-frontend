import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import PatientForm from '../../components/PatientForm/PatientForm';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './Patients.scss';

const UNDO_DELAY_MS = 5000;

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '-';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

function cleanData(formData) {
  return Object.fromEntries(
    Object.entries(formData).filter(([, value]) => value !== '' && value !== null)
  );
}

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const pendingDeleteTimer = useRef(null);

  async function fetchPatients() {
    try {
      // ملاحظة: Strapi بيرجع 25 سجل بس افتراضياً، pageSize=100 هون حل مؤقت
      // مناسب لعدد مرضى عيادة صغيرة/متوسطة. لو المشروع كبر أكتر من هيك،
      // الحل الصحيح هو بحث فعلي عالسيرفر (server-side search) بدل الجلب الكامل.
      const response = await axiosClient.get(
        '/patients?sort=createdAt:desc&pagination[pageSize]=100'
      );
      setPatients(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب بيانات المرضى'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
    // إلغاء أي عملية حذف معلّقة (لسا ضمن مهلة التراجع) لو المستخدم غادر الصفحة
    return () => {
      if (pendingDeleteTimer.current) clearTimeout(pendingDeleteTimer.current);
    };
  }, []);

  async function handleAddPatient(formData) {
    setSubmitting(true);
    try {
      await axiosClient.post('/patients', { data: cleanData(formData) });
      setShowAddModal(false);
      fetchPatients();
      toast.success('تمت إضافة المريض بنجاح', { title: 'عملية ناجحة' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة المريض'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditPatient(formData) {
    setSubmitting(true);
    try {
      await axiosClient.put(`/patients/${editingPatient.documentId}`, {
        data: cleanData(formData),
      });
      setEditingPatient(null);
      fetchPatients();
      toast.success('تم تعديل بيانات المريض بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل المريض'));
    } finally {
      setSubmitting(false);
    }
  }

  // حذف حقيقي بمهلة تراجع: منشيل المريض من الواجهة فوراً، وما منرسل طلب
  // الحذف الفعلي للسيرفر إلا بعد 5 ثواني (إلا إذا ضغط "تراجع")
  function handleDeletePatient() {
    if (!deletingPatient) return;
    const patient = deletingPatient;
    setDeletingPatient(null);
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));

    pendingDeleteTimer.current = setTimeout(async () => {
      try {
        await axiosClient.delete(`/patients/${patient.documentId}`);
      } catch (err) {
        toast.error(getErrorMessage(err, 'تعذر حذف المريض، رح يرجع للقائمة'));
        fetchPatients();
      }
    }, UNDO_DELAY_MS);

    toast.error(`تم حذف "${patient.full_name}"`, {
      title: 'حذف مريض',
      duration: UNDO_DELAY_MS,
      action: {
        label: 'تراجع',
        onClick: () => {
          clearTimeout(pendingDeleteTimer.current);
          pendingDeleteTimer.current = null;
          setPatients((prev) => [patient, ...prev]);
          toast.info('تم التراجع عن الحذف');
        },
      },
    });
  }

  const filteredPatients = patients.filter((patient) =>
    (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <SkeletonList rows={4} />;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="patients-page">
      <div className="patients-page__header">
        <div>
          <h1>المرضى</h1>
          <span className="patients-page__count">{patients.length} مريض</span>
        </div>

        <div className="patients-page__actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث بالاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              aria-label="عرض جدول"
            >
              <List size={18} />
            </button>
            <button
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
              aria-label="عرض بطاقات"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>إضافة مريض</span>
          </button>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="empty-state">
          <Users size={40} />
          <h3>لا يوجد مرضى بعد</h3>
          <p>ابدأ بإضافة أول مريض إلى النظام</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>إضافة مريض</span>
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="empty-state">
          <Search size={40} />
          <h3>لا توجد نتائج</h3>
          <p>لم نجد أي مريض بالاسم "{searchTerm}"</p>
        </div>
      ) : viewMode === 'table' ? (
        <table className="patients-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>العمر</th>
              <th>الجنس</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <Link to={`/patients/${patient.documentId}`} className="patient-name">
                    <span className="avatar">{patient.full_name?.charAt(0) || '؟'}</span>
                    {patient.full_name}
                  </Link>
                </td>
                <td>{patient.phone}</td>
                <td>{calculateAge(patient.date_of_birth)} سنة</td>
                <td>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => setEditingPatient(patient)} aria-label="تعديل">
                      <Pencil size={16} />
                    </button>
                    <button
                      className="row-actions__danger"
                      onClick={() => setDeletingPatient(patient)}
                      aria-label="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="patients-grid">
          {filteredPatients.map((patient) => (
            <div className="patient-card" key={patient.id}>
              <div className="patient-card__header">
                <Link to={`/patients/${patient.documentId}`} className="patient-name">
                  <span className="avatar">{patient.full_name?.charAt(0) || '؟'}</span>
                  <h3>{patient.full_name}</h3>
                </Link>
                <div className="row-actions">
                  <button onClick={() => setEditingPatient(patient)} aria-label="تعديل">
                    <Pencil size={16} />
                  </button>
                  <button
                    className="row-actions__danger"
                    onClick={() => setDeletingPatient(patient)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p>{patient.phone}</p>
              <p>
                {calculateAge(patient.date_of_birth)} سنة · {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="إضافة مريض جديد" onClose={() => setShowAddModal(false)}>
          <PatientForm onSubmit={handleAddPatient} submitting={submitting} />
        </Modal>
      )}

      {editingPatient && (
        <Modal title="تعديل بيانات المريض" onClose={() => setEditingPatient(null)}>
          <PatientForm initialData={editingPatient} onSubmit={handleEditPatient} submitting={submitting} />
        </Modal>
      )}

      {deletingPatient && (
        <ConfirmDialog
          title="حذف المريض"
          message={`هل أنت متأكد من حذف المريض "${deletingPatient.full_name}"؟ رح يكون عندك ${
            UNDO_DELAY_MS / 1000
          } ثواني للتراجع بعدها.`}
          confirmLabel="حذف"
          danger
          onConfirm={handleDeletePatient}
          onClose={() => setDeletingPatient(null)}
        />
      )}
    </div>
  );
}

export default Patients;
