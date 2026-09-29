import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useClinicSettings } from '../../hooks/useClinicSettings';
import './Layout.scss';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/patients', label: 'المرضى', icon: Users },
  { to: '/appointments', label: 'المواعيد', icon: Calendar },
  { to: '/records', label: 'السجلات الطبية', icon: FileText },
  { to: '/prescriptions', label: 'الوصفات', icon: Pill },
  { to: '/invoices', label: 'الفواتير', icon: Receipt },
  { to: '/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

function Layout() {
  const { user, logout } = useAuth();
  const { settings } = useClinicSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // قفل السايدبار عالموبايل تلقائياً كل ما نتنقل لصفحة جديدة
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentPage = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="layout">
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <Stethoscope size={22} />
          <span>{settings?.clinic_name || 'CuraDesk'}</span>
          <button className="sidebar__close" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="sidebar__link">
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar__logout" onClick={logout}>
          <LogOut size={20} />
          <span>تسجيل خروج</span>
        </button>
      </aside>

      <div className="layout__main">
        <header className="header">
          <button className="header__menu-btn" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة">
            <Menu size={22} />
          </button>
          <h2 className="header__title">{currentPage?.label || ''}</h2>
          <span className="header__user">مرحباً، {user?.username}</span>
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
