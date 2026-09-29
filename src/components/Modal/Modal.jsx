import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.scss';

function Modal({ title, onClose, children }) {
  const boxRef = useRef(null);

  // إغلاق بزر Escape + قفل سكرول الصفحة خلف المودال
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // تركيز أول عنصر داخل المودال لتسهيل التنقل بلوحة المفاتيح
    boxRef.current?.querySelector('input, select, textarea, button')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-box__header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        <div className="modal-box__content">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
