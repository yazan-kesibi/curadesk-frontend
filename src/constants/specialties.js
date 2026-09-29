export const SPECIALTIES = [
  { value: 'general', label: 'طب عام', color: '#2563eb' },
  { value: 'dental', label: 'أسنان', color: '#0d9488' },
  { value: 'dermatology', label: 'جلدية', color: '#ea580c' },
  { value: 'orthopedic', label: 'عظمية', color: '#7c3aed' },
  { value: 'ophthalmology', label: 'عيون', color: '#0891b2' },
  { value: 'gynecology', label: 'نسائية', color: '#db2777' },
  { value: 'pediatrics', label: 'أطفال', color: '#16a34a' },
  { value: 'ent', label: 'أنف وأذن وحنجرة', color: '#ca8a04' },
];

export function getSpecialtyColor(specialty) {
  return SPECIALTIES.find((s) => s.value === specialty)?.color || SPECIALTIES[0].color;
}
