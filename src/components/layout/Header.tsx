import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  LogOut,
  HardDrive,
  FolderSync,
  Edit3,
  User,
  Shield,
  ChevronDown,
  Sparkles,
  Building2,
  Check,
  X,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    switchUser,
    db,
    updateClinicName,
    syncStatus,
    connectLocalDirectory,
    isQuickClinicNameModalOpen,
    setIsQuickClinicNameModalOpen,
    setActiveTab,
  } = useClinic();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [tempClinicName, setTempClinicName] = useState(db.settings.clinicName);
  const [isConnecting, setIsConnecting] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format 12-hour time with Arabic صباحاً / مساءً
  const format12HourTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes}:${seconds} ${period}`;
  };

  // Format full date in Arabic
  const dayNameArabic = currentTime.toLocaleDateString('ar-EG', { weekday: 'long' });
  const fullDateArabic = currentTime.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSaveClinicName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempClinicName.trim()) {
      updateClinicName(tempClinicName.trim());
      setIsQuickClinicNameModalOpen(false);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'مدير':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40';
      case 'دكتور':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'موظف':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="relative z-30 w-full no-print">
      <div className="backdrop-blur-xl bg-slate-900/85 border-b border-blue-500/40 shadow-[0_4px_25px_rgba(37,99,235,0.3)] px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Right Section: Clinic Name & Quick Edit + User Profile & Logout */}
          <div className="flex items-center gap-4">
            
            {/* Clinic Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center">
                <div className="w-full h-full bg-slate-950/85 rounded-[14px] flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-100 via-white to-cyan-200 bg-clip-text text-transparent">
                    {db.settings.clinicName}
                  </h1>
                  <button
                    onClick={() => {
                      setTempClinicName(db.settings.clinicName);
                      setIsQuickClinicNameModalOpen(true);
                    }}
                    title="تعديل اسم العيادة لحظياً"
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-blue-300/80 flex items-center gap-2">
                  <span>نظام الإدارة الشامل</span>
                  <span>•</span>
                  <span className="text-slate-400">Windows 10 Aero</span>
                </div>
              </div>
            </div>

            {/* Current User Info & Role Badge */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-700/60">
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-blue-500/40 hover:border-cyan-400 text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white leading-tight">{currentUser.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeStyle(currentUser.role)}`}>
                          {currentUser.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
                  </button>

                  {/* Switch user dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl backdrop-blur-2xl bg-slate-900/95 border border-blue-500/50 shadow-2xl p-2.5 z-50">
                      <div className="text-[11px] font-bold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                        تبديل المستخدم (اختبار الصلاحيات):
                      </div>
                      <div className="space-y-1 mb-2">
                        {(Array.isArray(db?.users) ? db.users : []).map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                              currentUser.id === u.id
                                ? 'bg-blue-600/30 text-white border border-blue-500/50'
                                : 'text-slate-300 hover:bg-slate-800/80'
                            }`}
                          >
                            <span>{u.name}</span>
                            <span className={`text-[9px] px-1 rounded border ${getRoleBadgeStyle(u.role)}`}>
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  onClick={logout}
                  title="تسجيل الخروج من النظام"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Local Drive Sync Status Pill */}
            <div className="hidden xl:flex items-center">
              <button
                onClick={async () => {
                  setIsConnecting(true);
                  await connectLocalDirectory();
                  setIsConnecting(false);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-medium transition-all ${
                  syncStatus.isConnected
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/70 border-blue-500/30 text-blue-300 hover:border-blue-400'
                }`}
                title="مزامنة تلقائية مع مجلد على القرص D:\ أو E: عبر File System Access API"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>{syncStatus.isConnected ? `متزامن: ${syncStatus.folderName}` : 'ربط مجلد محلي (D: / E:)'}</span>
                <FolderSync className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

          {/* Left Section: Live Day, Full Date & Realtime Clock (12-hour AM/PM) */}
          <div className="flex items-center gap-4 text-left">
            <div className="bg-slate-950/70 border border-blue-500/30 rounded-2xl px-4 py-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <div className="flex items-center gap-3">
                
                {/* Real-time Clock (12 hours AM/PM) */}
                <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-sm tracking-wide">
                  <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>{format12HourTime(currentTime)}</span>
                </div>

                <span className="text-slate-600">|</span>

                {/* Day and Full Date */}
                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{dayNameArabic}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {fullDateArabic}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Edit Clinic Name Modal */}
      {isQuickClinicNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-blue-500/40 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">تعديل اسم العيادة اللحظي</h3>
              </div>
              <button
                onClick={() => setIsQuickClinicNameModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClinicName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم العيادة / المركز الطبي
                </label>
                <input
                  type="text"
                  value={tempClinicName}
                  onChange={(e) => setTempClinicName(e.target.value)}
                  required
                  placeholder="مثال: عيادة النخبة التخصصية"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-blue-500/40 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  سيتحدث الاسم لحظياً في الشريط العلوي وشاشة الدخول وكافة التقارير.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickClinicNameModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs shadow-lg"
                >
                  تحديث الاسم الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
};
