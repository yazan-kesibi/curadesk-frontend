import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Pill, Search } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import PrescriptionForm from '../../components/PrescriptionForm/PrescriptionForm';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './Prescriptions.scss';

function Prescriptions() {
  const { user } = useAuth();
  const isDoctor = user?.role?.type === 'doctor';
  const toast = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [deletingPrescription, setDeletingPrescription] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = [
        'populate[patient][fields][0]=full_name',
        'populate[medical_record][fields][0]=diagnosis',
        'pagination[pageSize]=100',
        'sort=createdAt:desc',
      ];
      if (search.trim()) {
        params.push(`filters[patient][full_name][$containsi]=${encodeURIComponent(search.trim())}`);
      }
      const response = await axiosClient.get(`/prescriptions?${params.join('&')}`);
      setPrescriptions(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب الوصفات'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isDoctor) fetchPrescriptions();
  }, [isDoctor, fetchPrescriptions]);

  if (!isDoctor) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleAddPrescription(formData) {
    setSubmitting(true);
    try {
      await axiosClient.post('/prescriptions', {
        data: { ...formData, recorded_by: user.id },
      });
      setShowAddModal(false);
      fetchPrescriptions();
      toast.success('تمت إضافة الوصفة بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة الوصفة'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditPrescription(formData) {
    setSubmitting(true);
    try {
      await axiosClient.put(`/prescriptions/${editingPrescription.documentId}`, { data: formData });
      setEditingPrescription(null);
      fetchPrescriptions();
      toast.success('تم تعديل الوصفة بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل الوصفة'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePrescription() {
    if (!deletingPrescription) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/prescriptions/${deletingPrescription.documentId}`);
      fetchPrescriptions();
      toast.success('تم حذف الوصفة');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف الوصفة'));
    } finally {
      setSubmitting(false);
      setDeletingPrescription(null);
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  const hasActiveFilters = search.trim() !== '';

  return (
    <div className="prescriptions-page">
      <div className="prescriptions-page__header">
        <div>
          <h1>الوصفات الطبية</h1>
          <span className="prescriptions-page__count">
            {loading ? '...' : `${prescriptions.length} وصفة`}
          </span>
        </div>

        <div className="prescriptions-page__actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث باسم المريض..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>إضافة وصفة</span>
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : prescriptions.length === 0 ? (
        <div className="empty-state">
          <Pill size={40} />
          <h3>{hasActiveFilters ? 'لا توجد نتائج' : 'لا توجد وصفات بعد'}</h3>
          <p>{hasActiveFilters ? 'جرّب اسم مريض مختلف' : 'ابدأ بإضافة أول وصفة طبية'}</p>
          {!hasActiveFilters && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>إضافة وصفة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="prescriptions-list">
          {prescriptions.map((prescription) => (
            <div className="prescription-card" key={prescription.id}>
              <div className="prescription-card__main">
                {prescription.patient ? (
                  <Link to={`/patients/${prescription.patient.documentId}`} className="patient-name">
                    <span className="avatar avatar--sm">
                      {prescription.patient.full_name?.charAt(0) || '؟'}
                    </span>
                    <h3>{prescription.patient.full_name}</h3>
                  </Link>
                ) : (
                  <h3>مريض محذوف</h3>
                )}
                <p className="prescription-card__diagnosis">
                  {prescription.medical_record?.diagnosis || 'بدون تشخيص مرتبط'}
                </p>

                <div className="medications-list">
                  {(prescription.medications || []).map((med, i) => (
                    <span className="medication-tag" key={i}>
                      {med.name} — {med.dosage}
                    </span>
                  ))}
                </div>
              </div>

              <div className="row-actions">
                <button onClick={() => setEditingPrescription(prescription)} aria-label="تعديل">
                  <Pencil size={16} />
                </button>
                <button
                  className="row-actions__danger"
                  onClick={() => setDeletingPrescription(prescription)}
                  aria-label="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="إضافة وصفة طبية" onClose={() => setShowAddModal(false)}>
          <PrescriptionForm onSubmit={handleAddPrescription} submitting={submitting} />
        </Modal>
      )}

      {editingPrescription && (
        <Modal title="تعديل الوصفة" onClose={() => setEditingPrescription(null)}>
          <PrescriptionForm
            initialData={editingPrescription}
            onSubmit={handleEditPrescription}
            submitting={submitting}
          />
        </Modal>
      )}

      {deletingPrescription && (
        <ConfirmDialog
          title="حذف الوصفة"
          message="هل أنت متأكد من حذف هذه الوصفة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDeletePrescription}
          onClose={() => setDeletingPrescription(null)}
        />
      )}
    </div>
  );
}

export default Prescriptions;
