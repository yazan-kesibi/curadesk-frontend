import { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { getErrorMessage } from '../../utils/errors';
import SkeletonList from '../../components/SkeletonList/SkeletonList';
import './Notifications.scss';

function cleanData(formData) {
  return Object.fromEntries(
    Object.entries(formData).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function Notifications() {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axiosClient.get(
        `/notifications?filters[user][id][$eq]=${user.id}&sort=createdAt:desc`
      );
      setNotifications(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء جلب الإشعارات'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  async function markAsRead(notification) {
    try {
      await axiosClient.put(`/notifications/${notification.documentId}`, {
        data: { is_read: true },
      });
      fetchNotifications();
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء تحديث الإشعار'));
    }
  }

  async function handleAddNotification(e) {
    e.preventDefault();
    setSubmitting(true);

    // Strapi 5 بيتطلب documentId كـ String مش الـ id الرقمي
    const payloadData = cleanData({
      user: user?.documentId,
      message: newMessage,
      is_read: false,
    });

    try {
      await axiosClient.post('/notifications', { data: payloadData });
      setNewMessage('');
      setShowAddModal(false);
      fetchNotifications();
      toast.success('تمت إضافة الإشعار بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء إضافة الإشعار'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingNotification) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/notifications/${deletingNotification.documentId}`);
      fetchNotifications();
      toast.success('تم حذف الإشعار');
    } catch (err) {
      toast.error(getErrorMessage(err, 'حدث خطأ أثناء حذف الإشعار'));
    } finally {
      setSubmitting(false);
      setDeletingNotification(null);
    }
  }

  if (loading) return <SkeletonList rows={4} />;
  if (error) return <p className="error-text">{error}</p>;

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <div>
          <h1>الإشعارات</h1>
          <span className="notifications-page__count">
            {unreadCount > 0 ? `${unreadCount} غير مقروء` : 'لا توجد إشعارات جديدة'}
          </span>
        </div>

        <div className="notifications-page__actions">
          <div className="filter-toggle">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              الكل
            </button>
            <button
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              غير مقروء
            </button>
          </div>

          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>إضافة إشعار</span>
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={40} />
          <h3>لا توجد إشعارات</h3>
          <p>{filter === 'unread' ? 'كل الإشعارات مقروءة' : 'رح تظهر هون أي إشعارات جديدة'}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              className={`notification-item ${!notification.is_read ? 'notification-item--unread' : ''}`}
              key={notification.id}
              onClick={() => !notification.is_read && markAsRead(notification)}
            >
              {!notification.is_read && <span className="unread-dot" />}
              <p className="notification-item__message">{notification.message}</p>
              <span className="notification-item__date">
                {new Date(notification.createdAt).toLocaleDateString('ar-EG')}
              </span>

              <button
                className="notification-item__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingNotification(notification);
                }}
                aria-label="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {showAddModal && (
        <Modal title="إضافة إشعار جديد" onClose={() => setShowAddModal(false)}>
          <form className="notification-form" onSubmit={handleAddNotification}>
            <div className="form-field">
              <label>نص الإشعار *</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'جارِ الحفظ...' : 'حفظ'}
            </button>
          </form>
        </Modal>
      )}

      {deletingNotification && (
        <ConfirmDialog
          title="حذف الإشعار"
          message="هل تريد حذف هذا الإشعار؟"
          confirmLabel="حذف"
          danger
          loading={submitting}
          onConfirm={handleDelete}
          onClose={() => setDeletingNotification(null)}
        />
      )}
    </div>
  );
}

export default Notifications;
