/**
 * حالة تحميل موحدة (skeleton) تستخدم بكل صفحات القوائم بدل نص "جارِ التحميل..."
 * rows: عدد الأسطر الوهمية المعروضة
 */
function SkeletonList({ rows = 4 }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="جارِ التحميل">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton skeleton-row" key={i} />
      ))}
    </div>
  );
}

export default SkeletonList;
