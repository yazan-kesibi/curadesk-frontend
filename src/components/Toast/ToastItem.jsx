

const icons = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const ToastItem = ({ toast, onDismiss }) => {
  const { id, title, message, type, duration, action, dismissible } = toast;

  return (
    <div className={`toast-item toast-item--${type}`} dir="rtl">
      <div className="toast-item__icon-wrapper">
        <span className="toast-item__icon">{icons[type]}</span>
      </div>

      <div className="toast-item__content">
        {title && <h4 className="toast-item__title">{title}</h4>}
        <p className="toast-item__message">{message}</p>
      </div>

      {action && (
        <button className="toast-item__action-btn" onClick={() => action.onClick()}>
          {action.label}
        </button>
      )}

      {dismissible && (
        <button className="toast-item__close-btn" onClick={() => onDismiss(id)}>
          &times;
        </button>
      )}

      {duration > 0 && (
        <div
          className="toast-item__progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

export default ToastItem;