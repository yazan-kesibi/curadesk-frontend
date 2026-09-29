import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import './PatientCombobox.scss';

/**
 * قائمة بحث فورية لاختيار مريض، بديل عن <select> عادي.
 * بتصير أساسية لما عدد المرضى يكبر — تمرير قائمة طويلة صعب، البحث أسهل بكتير.
 *
 * props:
 * - patients: مصفوفة المرضى [{id, full_name, phone}]
 * - value: id المريض المختار حالياً (أو '')
 * - onChange(id): بيتنادى لما يصير اختيار
 * - label / required / placeholder: اختياري
 */
function PatientCombobox({
  patients,
  value,
  onChange,
  label = 'المريض',
  required = false,
  placeholder = 'ابحث عن مريض بالاسم...',
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);

  const selectedPatient = patients.find((p) => String(p.id) === String(value));
  const filtered = query.trim()
    ? patients.filter((p) => (p.full_name || '').toLowerCase().includes(query.trim().toLowerCase()))
    : patients;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  function selectPatient(patient) {
    onChange(patient.id);
    setQuery('');
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) selectPatient(filtered[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div className="form-field">
      <label>
        {label}
        {required && ' *'}
      </label>

      <div className={`patient-combobox ${isOpen ? 'patient-combobox--open' : ''}`} ref={containerRef}>
        <div className="patient-combobox__control" onClick={() => setIsOpen(true)}>
          <Search size={15} />

          {isOpen ? (
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPatient ? selectedPatient.full_name : placeholder}
            />
          ) : selectedPatient ? (
            <span className="patient-combobox__selected">
              <span className="avatar avatar--sm">{selectedPatient.full_name?.charAt(0) || '؟'}</span>
              {selectedPatient.full_name}
            </span>
          ) : (
            <span className="patient-combobox__placeholder">{placeholder}</span>
          )}

          {selectedPatient && !isOpen && (
            <button
              type="button"
              className="patient-combobox__clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              aria-label="مسح الاختيار"
            >
              <X size={14} />
            </button>
          )}

          <ChevronDown size={16} className="patient-combobox__chevron" />
        </div>

        {isOpen && (
          <div className="patient-combobox__menu">
            {filtered.length === 0 ? (
              <div className="patient-combobox__empty">ما في نتائج مطابقة</div>
            ) : (
              filtered.slice(0, 50).map((patient, i) => (
                <button
                  type="button"
                  key={patient.id}
                  className={`patient-combobox__option ${i === highlightedIndex ? 'highlighted' : ''} ${
                    String(patient.id) === String(value) ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPatient(patient)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <span className="avatar avatar--sm">{patient.full_name?.charAt(0) || '؟'}</span>
                  <span className="patient-combobox__option-name">{patient.full_name}</span>
                  {patient.phone && <span className="patient-combobox__option-phone">{patient.phone}</span>}
                </button>
              ))
            )}
          </div>
        )}

        {/* حقل مخفي بس لتفعيل تحقق required الأصلي للمتصفح على الفورم */}
        {required && (
          <input className="patient-combobox__validator" value={value || ''} required readOnly tabIndex={-1} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default PatientCombobox;
