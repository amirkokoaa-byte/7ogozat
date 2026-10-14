import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  User,
  Sparkles,
  ArrowRight,
  UserPlus,
  Building2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';

export const LoginModal: React.FC = () => {
  const {
    login,
    registerUser,
    db,
    setIsQuickClinicNameModalOpen,
  } = useClinic();

  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state (default pre-filled for convenience with admin / 1234)
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('1234');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('موظف');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = login(loginUsername, loginPassword);
    if (!ok) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة. يمكنك تجربة (admin / 1234).');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regUsername.trim() || !regPassword.trim() || !regName.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    const success = registerUser(regUsername, regPassword, regName, regRole);
    if (!success) {
      setError('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    setSuccessMsg('تم إنشاء الحساب وتسجيل الدخول بنجاح!');
  };

  const handleQuickLogin = (u: string, p: string) => {
    setLoginUsername(u);
    setLoginPassword(p);
    login(u, p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-blue-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Glass Container */}
      <div className="relative w-full max-w-md rounded-3xl backdrop-blur-3xl bg-slate-900/85 border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.45)] overflow-hidden">
        
        {/* Top Header Banner with Clinic Name and Quick Edit Button */}
        <div className="p-6 text-center border-b border-blue-500/30 bg-gradient-to-b from-blue-600/25 via-blue-900/10 to-transparent">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(59,130,246,0.6)] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-black bg-gradient-to-r from-blue-100 via-white to-cyan-200 bg-clip-text text-transparent">
              {db.settings.clinicName}
            </h2>
            <button
              onClick={() => setIsQuickClinicNameModalOpen(true)}
              title="تعديل اسم العيادة"
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            نظام إدارة العيادات الطبية - بوابة الدخول والتحقق
          </p>
        </div>

        {/* Mode Switcher Tabs: تسجيل الدخول / إنشاء حساب جديد */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-950/80 border border-blue-500/30">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Normal Login */}
          {activeMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                  اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="admin أو doctor أو staff"
                    required
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 font-mono"
                  />
                  <User className="w-4 h-4 text-blue-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                  كلمة المرور (Password)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-blue-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200 flex items-center justify-between">
                <span>حساب المدير الافتراضي:</span>
                <span className="font-mono font-bold text-cyan-300">admin / 1234</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <span>دخول النظام</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Fast 1-click login buttons for testing */}
              <div className="pt-3 border-t border-slate-800">
                <div className="text-[10px] text-slate-400 text-center mb-2 font-semibold">
                  أو الدخول التجريبي الفوري بنقرة واحدة:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', '1234')}
                    className="p-2 rounded-xl bg-slate-800/80 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30 text-center transition-all"
                  >
                    <div className="text-[11px] font-bold text-amber-300">المدير</div>
                    <div className="text-[9px] text-slate-400 font-mono">admin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('doctor', '1234')}
                    className="p-2 rounded-xl bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 text-center transition-all"
                  >
                    <div className="text-[11px] font-bold text-cyan-300">الدكتور</div>
                    <div className="text-[9px] text-slate-400 font-mono">doctor</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('staff', '1234')}
                    className="p-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 text-center transition-all"
                  >
                    <div className="text-[11px] font-bold text-emerald-300">الموظف</div>
                    <div className="text-[9px] text-slate-400 font-mono">staff</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* TAB 2: Register New User */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                  الاسم الكامل للمستخدم *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="مثال: د. إبراهيم الخالدي"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    اسم الدخول (Username) *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="user123"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                  الدور والصفة الوظيفية *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-500/40 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="موظف">موظف (استقبال / حسابات)</option>
                  <option value="دكتور">دكتور (عيادة / كشوفات)</option>
                  <option value="مدير">مدير (صلاحيات كاملة 8 أقسام)</option>
                </select>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                سيتم تفعيل الحساب وحفظه فوراً في النظام وتسجيل الدخول تلقائياً بالصلاحيات المناسبة للدور.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>حفظ الحساب ودخول النظام فوراً</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
