import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Receipt, Search } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import InvoiceForm from '../../components/InvoiceForm/InvoiceForm';
import { useToast } from '../../hooks/useToast';
import { useClinicSettings } from '../../hooks/useClinicSettings';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './Invoices.scss';

const STATUS_LABELS = {
  pending: { label: 'معلقة', cardClass: 'invoice-card--pending', badgeClass: 'status--pending' },
  partial: { label: 'جزئية', cardClass: 'invoice-card--partial', badgeClass: 'status--partial' },
  paid: { label: 'مدفوعة', cardClass: 'invoice-card--paid', badgeClass: 'status--paid' },
};
const DEFAULT_STATUS = { label: 'غير محدد', cardClass: 'invoice-card--pending', badgeClass: 'status--pending' };

function cleanData(formData) {
  return Object.fromEntries(
    Object.entries(formData).filter(([, value]) => value !== '' && value !== null)
  );
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { settings } = useClinicSettings();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function formatAmount(value) {
    const formatted = new Intl.NumberFormat('ar-EG').format(value || 0);
    return settings?.currency ? `${formatted} ${settings.currency}` : formatted;
  }

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = [
        'populate[patient][fields][0]=full_name',
        'pagination[pageSize]=100',
        // الفواتير الأحدث (الأحدث إنشاءً) أول دايماً
        'sort=createdAt:desc',
      ];
      if (statusFilter !== 'all') params.push(`filters[invoice_status][$eq]=${statusFilter}`);
      if (search.trim()) {
        params.push(`filters[patient][full_name][$containsi]=${encodeURIComponent(search.trim())}`);
      }

      const response = await axiosClient.get(`/invoices?${params.join('&')}`);
      setInvoices(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب الفواتير'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleAddInvoice(formData) {
    setSubmitting(true);
    try {
      await axiosClient.post('/invoices', { data: cleanData(formData) });
      setShowAddModal(false);
      fetchInvoices();
      toast.success('تمت إضافة الفاتورة بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة الفاتورة'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditInvoice(formData) {
    setSubmitting(true);
    try {
      await axiosClient.put(`/invoices/${editingInvoice.documentId}`, { data: cleanData(formData) });
      setEditingInvoice(null);
      fetchInvoices();
      toast.success('تم تعديل الفاتورة بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تعديل الفاتورة'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteInvoice() {
    if (!deletingInvoice) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/invoices/${deletingInvoice.documentId}`);
      fetchInvoices();
      toast.success('تم حذف الفاتورة');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف الفاتورة'));
    } finally {
      setSubmitting(false);
      setDeletingInvoice(null);
    }
  }

  const hasActiveFilters = statusFilter !== 'all' || search.trim() !== '';

  return (
    <div className="invoices-page">
      <div className="invoices-page__header">
        <div>
          <h1>الفواتير</h1>
          <span className="invoices-page__count">{loading ? '...' : `${invoices.length} فاتورة`}</span>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>إضافة فاتورة</span>
        </button>
      </div>

      <div className="invoices-filters">
        <div className="filter-toggle">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
            الكل
          </button>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <button
              key={value}
              className={statusFilter === value ? 'active' : ''}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

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
        <SkeletonList rows={4} />
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <Receipt size={40} />
          <h3>{hasActiveFilters ? 'لا توجد نتائج' : 'لا توجد فواتير بعد'}</h3>
          <p>{hasActiveFilters ? 'جرّب تغيير الفلتر أو البحث' : 'ابدأ بإضافة أول فاتورة'}</p>
          {!hasActiveFilters && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>إضافة فاتورة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="invoices-grid">
          {invoices.map((invoice) => {
            const status = STATUS_LABELS[invoice.invoice_status] || DEFAULT_STATUS;
            const remaining = invoice.total_amount - (invoice.paid_amount || 0);

            return (
              <div className={`invoice-card ${status.cardClass}`} key={invoice.id}>
                <div className="invoice-card__top">
                  {invoice.patient ? (
                    <Link to={`/patients/${invoice.patient.documentId}`} className="patient-name">
                      <span className="avatar avatar--sm">
                        {invoice.patient.full_name?.charAt(0) || '؟'}
                      </span>
                      <h3>{invoice.patient.full_name}</h3>
                    </Link>
                  ) : (
                    <h3>مريض محذوف</h3>
                  )}
                  <span className={`status-badge ${status.badgeClass}`}>{status.label}</span>
                </div>

                <div className="invoice-card__amounts">
                  <div>
                    <span className="amount-label">الإجمالي</span>
                    <span className="amount-value">{formatAmount(invoice.total_amount)}</span>
                  </div>
                  <div>
                    <span className="amount-label">المدفوع</span>
                    <span className="amount-value">{formatAmount(invoice.paid_amount)}</span>
                  </div>
                  <div>
                    <span className="amount-label">المتبقي</span>
                    <span className="amount-value">{formatAmount(remaining)}</span>
                  </div>
                </div>

                <div className="row-actions">
                  <button onClick={() => setEditingInvoice(invoice)} aria-label="تعديل">
                    <Pencil size={16} />
                  </button>
                  <button
                    className="row-actions__danger"
                    onClick={() => setDeletingInvoice(invoice)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <Modal title="إضافة فاتورة" onClose={() => setShowAddModal(false)}>
          <InvoiceForm onSubmit={handleAddInvoice} submitting={submitting} />
        </Modal>
      )}

      {editingInvoice && (
        <Modal title="تعديل الفاتورة" onClose={() => setEditingInvoice(null)}>
          <InvoiceForm initialData={editingInvoice} onSubmit={handleEditInvoice} submitting={submitting} />
        </Modal>
      )}

      {deletingInvoice && (
        <ConfirmDialog
          title="حذف الفاتورة"
          message="هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDeleteInvoice}
          onClose={() => setDeletingInvoice(null)}
        />
      )}
    </div>
  );
}

export default Invoices;
