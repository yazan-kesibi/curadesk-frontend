import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Cake,
  Calendar,
  FileText,
  Pill,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import PatientForm from '../../components/PatientForm/PatientForm';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useClinicSettings } from '../../hooks/useClinicSettings';
import { getErrorMessage } from '../../utils/errors';
import './PatientDetail.scss';

const APPT_STATUS_LABELS = {
  scheduled: { label: 'مجدول', className: 'status--scheduled' },
  completed: { label: 'مكتمل', className: 'status--completed' },
  cancelled: { label: 'ملغى', className: 'status--cancelled' },
  no_show: { label: 'لم يحضر', className: 'status--no-show' },
};

const INVOICE_STATUS_LABELS = {
  pending: { label: 'معلقة', className: 'status--pending' },
  partial: { label: 'جزئية', className: 'status--partial' },
  paid: { label: 'مدفوعة', className: 'status--paid' },
};

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '-';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

function cleanData(formData) {
  return Object.fromEntries(
    Object.entries(formData).filter(([, value]) => value !== '' && value !== null)
  );
}

const TABS = [
  { key: 'appointments', label: 'المواعيد', icon: Calendar },
  { key: 'records', label: 'السجلات الطبية', icon: FileText },
  { key: 'prescriptions', label: 'الوصفات', icon: Pill, doctorOnly: true },
  { key: 'invoices', label: 'الفواتير', icon: Receipt },
];

function PatientDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { settings } = useClinicSettings();
  const isDoctor = user?.role?.type === 'doctor';

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function formatAmount(value) {
    const formatted = new Intl.NumberFormat('ar-EG').format(value || 0);
    return settings?.currency ? `${formatted} ${settings.currency}` : formatted;
  }

  const loadPatient = useCallback(async () => {
    setLoading(true);
    try {
      const patientFilter = `filters[patient][documentId][$eq]=${documentId}`;
      const [patientRes, apptsRes, recordsRes, invoicesRes, prescRes] = await Promise.all([
        axiosClient.get(`/patients/${documentId}`),
        axiosClient.get(`/appointments?${patientFilter}&sort=appointment_date:desc&pagination[pageSize]=50`),
        axiosClient.get(`/medical-records?${patientFilter}&sort=createdAt:desc&pagination[pageSize]=50`),
        axiosClient.get(`/invoices?${patientFilter}&sort=createdAt:desc&pagination[pageSize]=50`),
        isDoctor
          ? axiosClient.get(
              `/prescriptions?${patientFilter}&populate[medical_record][fields][0]=diagnosis&sort=createdAt:desc&pagination[pageSize]=50`
            )
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setPatient(patientRes.data.data);
      setAppointments(apptsRes.data.data);
      setRecords(recordsRes.data.data);
      setInvoices(invoicesRes.data.data);
      setPrescriptions(prescRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب بيانات المريض'));
    } finally {
      setLoading(false);
    }
  }, [documentId, isDoctor]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  async function handleEditPatient(formData) {
    setSubmitting(true);
    try {
      const response = await axiosClient.put(`/patients/${documentId}`, { data: cleanData(formData) });
      setPatient(response.data.data);
      setShowEditModal(false);
      toast.success('تم تعديل بيانات المريض بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل المريض'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePatient() {
    setSubmitting(true);
    try {
      await axiosClient.delete(`/patients/${documentId}`);
      toast.success('تم حذف المريض');
      navigate('/patients');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف المريض'));
      setSubmitting(false);
      setShowDeleteDialog(false);
    }
  }

  if (loading) return <SkeletonList rows={5} />;
  if (error) return <p className="error-text">{error}</p>;
  if (!patient) return null;

  const visibleTabs = TABS.filter((tab) => !tab.doctorOnly || isDoctor);
  const tabCounts = {
    appointments: appointments.length,
    records: records.length,
    prescriptions: prescriptions.length,
    invoices: invoices.length,
  };

  return (
    <div className="patient-detail-page">
      <Link to="/patients" className="back-link">
        <ArrowRight size={16} />
        <span>الرجوع لقائمة المرضى</span>
      </Link>

      <div className="patient-detail-header">
        <div className="patient-detail-header__main">
          <span className="avatar avatar--lg">{patient.full_name?.charAt(0) || '؟'}</span>
          <div>
            <h1>{patient.full_name}</h1>
            <div className="patient-detail-header__meta">
              {patient.phone && (
                <span>
                  <Phone size={14} /> {patient.phone}
                </span>
              )}
              {patient.email && (
                <span>
                  <Mail size={14} /> {patient.email}
                </span>
              )}
              <span>
                <Cake size={14} /> {calculateAge(patient.date_of_birth)} سنة
              </span>
              <span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
            </div>
          </div>
        </div>

        <div className="patient-detail-header__actions">
          <button className="btn-secondary" onClick={() => setShowEditModal(true)}>
            <Pencil size={16} />
            <span>تعديل</span>
          </button>
          <button className="btn-danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 size={16} />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {patient.medical_history && (
        <div className="patient-detail-history">
          <ClipboardList size={16} />
          <p>{patient.medical_history}</p>
        </div>
      )}

      <div className="patient-detail-tabs">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={activeTab === key ? 'active' : ''}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            <span className="patient-detail-tabs__count">{tabCounts[key]}</span>
          </button>
        ))}
      </div>

      <div className="patient-detail-content">
        {activeTab === 'appointments' &&
          (appointments.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Calendar size={28} />
              <p>ما في مواعيد مسجّلة لهذا المريض</p>
            </div>
          ) : (
            <div className="detail-list">
              {appointments.map((appt) => {
                const status = APPT_STATUS_LABELS[appt.appointment_status] || APPT_STATUS_LABELS.scheduled;
                return (
                  <div className="detail-row" key={appt.id}>
                    <span className="detail-row__date">
                      {new Date(appt.appointment_date).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      —{' '}
                      {new Date(appt.appointment_date).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className={`status-badge ${status.className}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          ))}

        {activeTab === 'records' &&
          (records.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <FileText size={28} />
              <p>ما في سجلات طبية لهذا المريض</p>
            </div>
          ) : (
            <div className="detail-list">
              {records.map((record) => (
                <div className="detail-card" key={record.id}>
                  <div className="detail-card__top">
                    <h4>{record.diagnosis}</h4>
                    <span className="detail-card__date">
                      {new Date(record.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  {record.notes && <p>{record.notes}</p>}
                </div>
              ))}
            </div>
          ))}

        {activeTab === 'prescriptions' &&
          (prescriptions.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Pill size={28} />
              <p>ما في وصفات طبية لهذا المريض</p>
            </div>
          ) : (
            <div className="detail-list">
              {prescriptions.map((presc) => (
                <div className="detail-card" key={presc.id}>
                  <div className="detail-card__top">
                    <h4>{presc.medical_record?.diagnosis || 'بدون تشخيص مرتبط'}</h4>
                    <span className="detail-card__date">
                      {new Date(presc.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="medications-list">
                    {(presc.medications || []).map((med, i) => (
                      <span className="medication-tag" key={i}>
                        {med.name} — {med.dosage}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {activeTab === 'invoices' &&
          (invoices.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Receipt size={28} />
              <p>ما في فواتير لهذا المريض</p>
            </div>
          ) : (
            <div className="detail-list">
              {invoices.map((invoice) => {
                const status = INVOICE_STATUS_LABELS[invoice.invoice_status] || INVOICE_STATUS_LABELS.pending;
                const remaining = invoice.total_amount - (invoice.paid_amount || 0);
                return (
                  <div className="detail-row" key={invoice.id}>
                    <span className="detail-row__date">
                      {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="detail-row__amount">
                      {formatAmount(invoice.total_amount)}
                      {remaining > 0 && (
                        <span className="detail-row__remaining"> (متبقي {formatAmount(remaining)})</span>
                      )}
                    </span>
                    <span className={`status-badge ${status.className}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
      </div>

      {showEditModal && (
        <Modal title="تعديل بيانات المريض" onClose={() => setShowEditModal(false)}>
          <PatientForm initialData={patient} onSubmit={handleEditPatient} submitting={submitting} />
        </Modal>
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          title="حذف المريض"
          message={`هل أنت متأكد من حذف "${patient.full_name}"؟ رح ينحذف مع كل بياناته المرتبطة. لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDeletePatient}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}

export default PatientDetail;
