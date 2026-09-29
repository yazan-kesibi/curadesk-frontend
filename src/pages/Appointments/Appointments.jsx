import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Calendar, Search } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import AppointmentForm from '../../components/AppointmentForm/AppointmentForm';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import './Appointments.scss';

const STATUS_LABELS = {
  scheduled: { label: 'مجدول', className: 'status--scheduled' },
  completed: { label: 'مكتمل', className: 'status--completed' },
  cancelled: { label: 'ملغى', className: 'status--cancelled' },
  no_show: { label: 'لم يحضر', className: 'status--no-show' },
};
const DEFAULT_STATUS = { label: 'غير محدد', className: 'status--scheduled' };

const TIME_FILTERS = [
  { value: 'upcoming', label: 'القادمة' },
  { value: 'today', label: 'اليوم' },
  { value: 'past', label: 'السابقة' },
  { value: 'all', label: 'الكل' },
];

function groupByDate(appointments) {
  return appointments.reduce((groups, appointment) => {
    const dateKey = appointment.appointment_date.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(appointment);
    return groups;
  }, {});
}

function formatDateHeading(dateKey) {
  const date = new Date(dateKey);
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function buildQuery({ timeFilter, statusFilter, search }) {
  const params = ['populate=patient', 'pagination[pageSize]=100'];

  // بالمواعيد "السابقة" الأحدث (الأقرب للحاضر) بيطلع أول، وبالباقي الأقرب
  // بالمستقبل بيطلع أول — الترتيب الزمني الأكثر فائدة عملياً بكل حالة
  params.push(`sort=appointment_date:${timeFilter === 'past' ? 'desc' : 'asc'}`);

  const now = new Date().toISOString();
  if (timeFilter === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    params.push(`filters[appointment_date][$gte]=${todayStart.toISOString()}`);
    params.push(`filters[appointment_date][$lt]=${tomorrowStart.toISOString()}`);
  } else if (timeFilter === 'upcoming') {
    params.push(`filters[appointment_date][$gte]=${now}`);
  } else if (timeFilter === 'past') {
    params.push(`filters[appointment_date][$lt]=${now}`);
  }

  if (statusFilter !== 'all') {
    params.push(`filters[appointment_status][$eq]=${statusFilter}`);
  }

  if (search.trim()) {
    params.push(`filters[patient][full_name][$containsi]=${encodeURIComponent(search.trim())}`);
  }

  return params.join('&');
}

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const toast = useToast();

  // تأخير بسيط (debounce) قبل إرسال طلب البحث، حتى ما نرسل طلب مع كل حرف
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery({ timeFilter, statusFilter, search });
      const response = await axiosClient.get(`/appointments?${query}`);
      setAppointments(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب المواعيد'));
    } finally {
      setLoading(false);
    }
  }, [timeFilter, statusFilter, search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleAddAppointment(formData) {
    setSubmitting(true);
    try {
      await axiosClient.post('/appointments', { data: formData });
      setShowAddModal(false);
      fetchAppointments();
      toast.success('تمت إضافة الموعد بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة الموعد'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditAppointment(formData) {
    setSubmitting(true);
    try {
      await axiosClient.put(`/appointments/${editingAppointment.documentId}`, { data: formData });
      setEditingAppointment(null);
      fetchAppointments();
      toast.success('تم تعديل الموعد بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل الموعد'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAppointment() {
    if (!deletingAppointment) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/appointments/${deletingAppointment.documentId}`);
      fetchAppointments();
      toast.success('تم حذف الموعد');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف الموعد'));
    } finally {
      setSubmitting(false);
      setDeletingAppointment(null);
    }
  }

  const grouped = groupByDate(appointments);
  const sortedDates = Object.keys(grouped).sort((a, b) =>
    timeFilter === 'past' ? b.localeCompare(a) : a.localeCompare(b)
  );
  const hasActiveFilters = statusFilter !== 'all' || search.trim() !== '' || timeFilter !== 'upcoming';

  return (
    <div className="appointments-page">
      <div className="appointments-page__header">
        <div>
          <h1>المواعيد</h1>
          <span className="appointments-page__count">
            {loading ? '...' : `${appointments.length} موعد`}
          </span>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>إضافة موعد</span>
        </button>
      </div>

      <div className="appointments-filters">
        <div className="filter-toggle">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              className={timeFilter === f.value ? 'active' : ''}
              onClick={() => setTimeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="status-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="ابحث باسم المريض..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>{hasActiveFilters ? 'لا توجد نتائج' : 'لا يوجد مواعيد بعد'}</h3>
          <p>{hasActiveFilters ? 'جرّب تغيير الفلتر أو البحث' : 'ابدأ بجدولة أول موعد'}</p>
          {!hasActiveFilters && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>إضافة موعد</span>
            </button>
          )}
        </div>
      ) : (
        sortedDates.map((dateKey) => (
          <div className="day-group" key={dateKey}>
            <h3 className="day-group__heading">{formatDateHeading(dateKey)}</h3>

            <div className="day-group__list">
              {grouped[dateKey].map((appointment) => {
                const status = STATUS_LABELS[appointment.appointment_status] || DEFAULT_STATUS;
                return (
                  <div className="appointment-row" key={appointment.id}>
                    <span className="appointment-row__time">{formatTime(appointment.appointment_date)}</span>

                    {appointment.patient ? (
                      <Link
                        to={`/patients/${appointment.patient.documentId}`}
                        className="appointment-row__patient"
                      >
                        <span className="avatar avatar--sm">
                          {appointment.patient.full_name?.charAt(0) || '؟'}
                        </span>
                        {appointment.patient.full_name}
                      </Link>
                    ) : (
                      <span className="appointment-row__patient appointment-row__patient--deleted">
                        مريض محذوف
                      </span>
                    )}

                    <span className={`status-badge ${status.className}`}>{status.label}</span>

                    <div className="row-actions">
                      <button onClick={() => setEditingAppointment(appointment)} aria-label="تعديل">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="row-actions__danger"
                        onClick={() => setDeletingAppointment(appointment)}
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showAddModal && (
        <Modal title="إضافة موعد جديد" onClose={() => setShowAddModal(false)}>
          <AppointmentForm onSubmit={handleAddAppointment} submitting={submitting} />
        </Modal>
      )}

      {editingAppointment && (
        <Modal title="تعديل الموعد" onClose={() => setEditingAppointment(null)}>
          <AppointmentForm
            initialData={editingAppointment}
            onSubmit={handleEditAppointment}
            submitting={submitting}
          />
        </Modal>
      )}

      {deletingAppointment && (
        <ConfirmDialog
          title="حذف الموعد"
          message="هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDeleteAppointment}
          onClose={() => setDeletingAppointment(null)}
        />
      )}
    </div>
  );
}

export default Appointments;
