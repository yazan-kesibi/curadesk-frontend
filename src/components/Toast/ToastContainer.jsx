
import ToastItem from './ToastItem';
import '../../styles/toast.scss';

const ToastContainer = ({ toasts, onDismiss }) => {
  // تجميع التنبيهات حسب التموضع
  const positions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

  return (
    <>
      {positions.map((pos) => {
        const filteredToasts = toasts.filter((t) => t.position === pos);
        if (filteredToasts.length === 0) return null;

        return (
          <div key={pos} className={`toast-container toast-container--${pos}`}>
            {filteredToasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
          </div>
        );
      })}
    </>
  );
};

export default ToastContainer;