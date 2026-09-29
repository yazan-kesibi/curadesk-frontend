import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarClock, Receipt, BellRing, ArrowLeft, Clock3 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import { useClinicSettings } from '../../hooks/useClinicSettings';
import './Dashboard.scss';

const WEEKDAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function Dashboard() {
  const { user } = useAuth();
  const { settings } = useClinicSettings();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patientsTotal: 0,
    todayAppointments: [],
    outstandingAmount: 0,
    unreadNotifications: 0,
    weekAppointments: [],
  });

  useEffect(() => {
    async function loadDashboard() {
      const todayStart = startOfDay(new Date());
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      try {
        const [patientsRes, todayApptsRes, weekApptsRes, invoicesRes, notifRes] = await Promise.all([
          axiosClient.get('/patients?pagination[pageSize]=1'),
          axiosClient.get(
            `/appointments?populate=patient&sort=appointment_date:asc&filters[appointment_date][$gte]=${todayStart.toISOString()}&filters[appointment_date][$lt]=${tomorrowStart.toISOString()}`
          ),
          axiosClient.get(
            `/appointments?fields[0]=appointment_date&pagination[pageSize]=100&filters[appointment_date][$gte]=${weekStart.toISOString()}&filters[appointment_date][$lt]=${tomorrowStart.toISOString()}`
          ),
          axiosClient.get('/invoices?filters[invoice_status][$ne]=paid&pagination[pageSize]=100'),
          axiosClient.get(
            `/notifications?filters[is_read][$eq]=false&filters[user][id][$eq]=${user.id}&pagination[pageSize]=1`
          ),
        ]);

        const outstandingAmount = invoicesRes.data.data.reduce(
          (sum, invoice) => sum + (invoice.total_amount - (invoice.paid_amount || 0)),
          0
        );

        setStats({
          patientsTotal: patientsRes.data.meta?.pagination?.total ?? patientsRes.data.data.length,
          todayAppointments: todayApptsRes.data.data,
          outstandingAmount,
          unreadNotifications: notifRes.data.meta?.pagination?.total ?? 0,
          weekAppointments: weekApptsRes.data.data,
        });
      } catch {
        // الداشبورد ثانوي — لو فشل جزء منه منسيب الأرقام صفر بدل ما نكسر الصفحة كاملة
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const today = new Date();
  const greeting = `${WEEKDAYS_AR[today.getDay()]}، ${today.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;

  // توزيع مواعيد آخر 7 أيام على شكل رسم بياني بسيط
  const dayBuckets = Array.from({ length: 7 }, (_, i) => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toDateString(), label: WEEKDAYS_AR[d.getDay()], count: 0 };
  });
  stats.weekAppointments.forEach((appt) => {
    const key = startOfDay(new Date(appt.appointment_date)).toDateString();
    const bucket = dayBuckets.find((b) => b.key === key);
    if (bucket) bucket.count += 1;
  });
  const maxCount = Math.max(1, ...dayBuckets.map((b) => b.count));

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1>مرحباً، {user?.username} 👋</h1>
          <p className="dashboard-page__date">{greeting}</p>
        </div>
        {settings?.clinic_name && <span className="dashboard-page__clinic">{settings.clinic_name}</span>}
      </div>

      {loading ? (
        <div className="skeleton-list">
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <Link to="/patients" className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--blue">
                <Users size={20} />
              </div>
              <div>
                <span className="kpi-card__value">{stats.patientsTotal}</span>
                <span className="kpi-card__label">إجمالي المرضى</span>
              </div>
            </Link>

            <Link to="/appointments" className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--green">
                <CalendarClock size={20} />
              </div>
              <div>
                <span className="kpi-card__value">{stats.todayAppointments.length}</span>
                <span className="kpi-card__label">مواعيد اليوم</span>
              </div>
            </Link>

            <Link to="/invoices" className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--orange">
                <Receipt size={20} />
              </div>
              <div>
                <span className="kpi-card__value">
                  {new Intl.NumberFormat('ar-EG').format(stats.outstandingAmount)}
                  {settings?.currency ? ` ${settings.currency}` : ''}
                </span>
                <span className="kpi-card__label">مبالغ مستحقة</span>
              </div>
            </Link>

            <Link to="/notifications" className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--purple">
                <BellRing size={20} />
              </div>
              <div>
                <span className="kpi-card__value">{stats.unreadNotifications}</span>
                <span className="kpi-card__label">إشعارات غير مقروءة</span>
              </div>
            </Link>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2>مواعيد اليوم</h2>
                <Link to="/appointments" className="dashboard-panel__link">
                  عرض الكل <ArrowLeft size={14} />
                </Link>
              </div>

              {stats.todayAppointments.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Clock3 size={28} />
                  <p>ما في مواعيد مجدولة اليوم</p>
                </div>
              ) : (
                <ul className="today-appts">
                  {stats.todayAppointments.map((appt) => (
                    <li key={appt.id}>
                      <span className="today-appts__time">{formatTime(appt.appointment_date)}</span>
                      <span className="today-appts__patient">
                        {appt.patient?.full_name || 'مريض محذوف'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2>المواعيد آخر 7 أيام</h2>
              </div>

              <div className="mini-chart">
                {dayBuckets.map((bucket) => (
                  <div className="mini-chart__col" key={bucket.key}>
                    <div className="mini-chart__bar-wrap">
                      <span className="mini-chart__tooltip">{bucket.count} موعد</span>
                      <div
                        className="mini-chart__bar"
                        style={{ height: `${(bucket.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="mini-chart__label">{bucket.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
