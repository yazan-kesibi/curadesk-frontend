import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal/Modal';
import './ConfirmDialog.scss';

/**
 * مودال تأكيد قابل لإعادة الاستخدام بدل window.confirm() الأصلية.
 *
 * props:
 * - title: عنوان المودال
 * - message: نص التأكيد
 * - confirmLabel / cancelLabel: نص الأزرار (اختياري)
 * - danger: true لإجراءات الحذف (زر أحمر)
 * - onConfirm / onClose: دوال
 * - loading: تعطيل الأزرار أثناء تنفيذ الإجراء
 */
function ConfirmDialog({
  title = 'تأكيد الإجراء',
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  onConfirm,
  onClose,
  loading = false,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-dialog">
        <div className={`confirm-dialog__icon ${danger ? 'confirm-dialog__icon--danger' : ''}`}>
          <AlertTriangle size={22} />
        </div>
        <p className="confirm-dialog__message">{message}</p>

        <div className="confirm-dialog__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? 'جارِ التنفيذ...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
