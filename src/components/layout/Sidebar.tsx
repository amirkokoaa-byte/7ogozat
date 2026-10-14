import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarClock,
  FileText,
  Receipt,
  Bell,
  Users,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { ALL_TABS } from '../../data/initialData';
import { TabId } from '../../types/clinic';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  CalendarPlus,
  CalendarClock,
  FileText,
  Receipt,
  Bell,
  Users,
  Settings,
};

export const Sidebar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, db } = useClinic();

  if (!currentUser) return null;

  // CRITICAL REQUIREMENT 4:
  // Render ONLY the tabs permitted in the logged-in user's allowedTabs array.
  const allowedTabs = currentUser.allowedTabs || ['dashboard', 'book', 'my_bookings'];
  const permittedTabs = ALL_TABS.filter((tab) =>
    allowedTabs.includes(tab.id)
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic badge numbers for glance with complete null-safety
  const getTabBadge = (tabId: TabId) => {
    const bookings = Array.isArray(db?.bookings) ? db.bookings : [];
    const notifications = Array.isArray(db?.notifications) ? db.notifications : [];
    const patients = Array.isArray(db?.patients) ? db.patients : [];

    if (tabId === 'dashboard') {
      const todayCount = bookings.filter(b => b?.date === todayStr).length;
      return todayCount > 0 ? `${todayCount} اليوم` : null;
    }
    if (tabId === 'my_bookings') {
      const upcoming = bookings.filter(b => b?.status === 'قادم').length;
      return upcoming > 0 ? `${upcoming}` : null;
    }
    if (tabId === 'notifications') {
      const unread = notifications.filter(n => !n?.isRead).length;
      return unread > 0 ? `${unread}` : null;
    }
    if (tabId === 'clients') {
      return `${patients.length}`;
    }
    return null;
  };

  return (
    <aside className="w-64 flex-shrink-0 no-print flex flex-col justify-between py-4 px-3 backdrop-blur-2xl bg-slate-900/70 border-l border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] min-h-[calc(100vh-65px)]">
      <div>
        {/* User Role & Allowed Tabs Badge */}
        <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-slate-950/70 border border-blue-500/25 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>صلاحيات الوصول</span>
            </span>
            <span className="font-extrabold text-cyan-300 px-2 py-0.5 rounded-md bg-blue-900/40 border border-blue-500/30">
              {currentUser.role}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            متاح لك {permittedTabs.length} من أصل 8 أقسام رئيسية
          </p>
        </div>

        {/* Dynamic Sidebar Navigation Menu */}
        <nav className="space-y-1.5">
          {permittedTabs.map((tab) => {
            const Icon = ICON_MAP[tab.iconName] || LayoutDashboard;
            const isActive = activeTab === tab.id;
            const badge = getTabBadge(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 text-right ${
                  isActive
                    ? 'backdrop-blur-xl bg-gradient-to-r from-blue-600/90 to-cyan-700/80 text-white border border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.45)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-blue-500/30 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                        : 'bg-slate-800/80 text-blue-400 group-hover:text-cyan-300 group-hover:bg-slate-700/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">{tab.label}</div>
                    <div
                      className={`text-[10px] hidden lg:block ${
                        isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {tab.description}
                    </div>
                  </div>
                </div>

                {badge !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : tab.id === 'notifications'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Info */}
      <div className="pt-3 border-t border-slate-800/80 mt-6 px-2 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-cyan-300 font-semibold mb-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Windows 10 Aero UI</span>
        </div>
        <p className="text-[10px] text-slate-500">
          حفظ تلقائي في LocalStorage ومزامنة الأقراص المحلية
        </p>
      </div>
    </aside>
  );
};
