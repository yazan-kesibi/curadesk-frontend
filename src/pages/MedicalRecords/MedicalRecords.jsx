import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import MedicalRecordForm from '../../components/MedicalRecordForm/MedicalRecordForm';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './MedicalRecords.scss';

function cleanData(formData) {
  return Object.fromEntries(
    Object.entries(formData).filter(([, value]) => value !== '' && value !== null)
  );
}

function MedicalRecords() {
  const { user } = useAuth();
  const isDoctor = user?.role?.type === 'doctor';
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = [
        'populate[patient][fields][0]=full_name',
        'populate[appointment][fields][0]=appointment_date',
        'pagination[pageSize]=100',
        'sort=createdAt:desc',
      ];
      if (search.trim()) {
        params.push(`filters[patient][full_name][$containsi]=${encodeURIComponent(search.trim())}`);
      }
      const response = await axiosClient.get(`/medical-records?${params.join('&')}`);
      setRecords(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب السجلات الطبية'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleAddRecord(formData) {
    setSubmitting(true);
    try {
      await axiosClient.post('/medical-records', {
        data: { ...cleanData(formData), recorded_by: user.id },
      });
      setShowAddModal(false);
      fetchRecords();
      toast.success('تمت إضافة السجل بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة السجل'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditRecord(formData) {
    setSubmitting(true);
    try {
      await axiosClient.put(`/medical-records/${editingRecord.documentId}`, {
        data: cleanData(formData),
      });
      setEditingRecord(null);
      fetchRecords();
      toast.success('تم تعديل السجل بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل السجل'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRecord() {
    if (!deletingRecord) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/medical-records/${deletingRecord.documentId}`);
      fetchRecords();
      toast.success('تم حذف السجل');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف السجل'));
    } finally {
      setSubmitting(false);
      setDeletingRecord(null);
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  const hasActiveFilters = search.trim() !== '';

  return (
    <div className="medical-records-page">
      <div className="medical-records-page__header">
        <div>
          <h1>السجلات الطبية</h1>
          <span className="medical-records-page__count">
            {loading ? '...' : `${records.length} سجل`}
          </span>
        </div>

        <div className="medical-records-page__actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث باسم المريض..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {isDoctor && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>إضافة سجل</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : records.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} />
          <h3>{hasActiveFilters ? 'لا توجد نتائج' : 'لا توجد سجلات طبية بعد'}</h3>
          {isDoctor && !hasActiveFilters && <p>ابدأ بإضافة أول سجل طبي</p>}
          {hasActiveFilters && <p>جرّب اسم مريض مختلف</p>}
          {isDoctor && !hasActiveFilters && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>إضافة سجل</span>
            </button>
          )}
        </div>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <div className="record-card" key={record.id}>
              <div className="record-card__main">
                {record.patient ? (
                  <Link to={`/patients/${record.patient.documentId}`} className="patient-name">
                    <span className="avatar avatar--sm">
                      {record.patient.full_name?.charAt(0) || '؟'}
                    </span>
                    <h3>{record.patient.full_name}</h3>
                  </Link>
                ) : (
                  <h3>مريض محذوف</h3>
                )}
                <p className="record-card__diagnosis">{record.diagnosis}</p>
                {record.notes && <p className="record-card__notes">{record.notes}</p>}
                {record.appointment && (
                  <span className="record-card__linked">
                    مرتبط بموعد: {new Date(record.appointment.appointment_date).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </div>

              {isDoctor && (
                <div className="row-actions">
                  <button onClick={() => setEditingRecord(record)} aria-label="تعديل">
                    <Pencil size={16} />
                  </button>
                  <button
                    className="row-actions__danger"
                    onClick={() => setDeletingRecord(record)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="إضافة سجل طبي" onClose={() => setShowAddModal(false)}>
          <MedicalRecordForm onSubmit={handleAddRecord} submitting={submitting} />
        </Modal>
      )}

      {editingRecord && (
        <Modal title="تعديل السجل الطبي" onClose={() => setEditingRecord(null)}>
          <MedicalRecordForm
            initialData={editingRecord}
            onSubmit={handleEditRecord}
            submitting={submitting}
          />
        </Modal>
      )}

      {deletingRecord && (
        <ConfirmDialog
          title="حذف السجل الطبي"
          message="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDeleteRecord}
          onClose={() => setDeletingRecord(null)}
        />
      )}
    </div>
  );
}

export default MedicalRecords;
