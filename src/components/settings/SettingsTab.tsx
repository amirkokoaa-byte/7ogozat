import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  FolderSync,
  Shield,
  UserCheck,
  PlusCircle,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { ALL_TABS } from '../../data/initialData';
import { TabId, UserAccount, UserRole } from '../../types/clinic';

export const SettingsTab: React.FC = () => {
  const {
    db,
    updateSettings,
    addUser,
    updateUser,
    deleteUser,
    toggleUserTabPermission,
    syncStatus,
    connectLocalDirectory,
    disconnectLocalDirectory,
    exportJsonBackup,
    importJsonBackup,
    resetDatabase,
    currentUser,
  } = useClinic();

  const [subTab, setSubTab] = useState<'storage' | 'users' | 'clinic'>('clinic');

  // Clinic info state
  const [clinicName, setClinicName] = useState(db.settings.clinicName);
  const [doctorName, setDoctorName] = useState(db.settings.doctorName);
  const [specialty, setSpecialty] = useState(db.settings.specialty);
  const [phone, setPhone] = useState(db.settings.phone);
  const [address, setAddress] = useState(db.settings.address);
  const [currency, setCurrency] = useState(db.settings.currency);
  const [workingHoursStart, setWorkingHoursStart] = useState(db.settings.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(db.settings.workingHoursEnd);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('موظف');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formAllowedTabs, setFormAllowedTabs] = useState<TabId[]>(['dashboard', 'book', 'my_bookings']);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinicName,
      doctorName,
      specialty,
      phone,
      address,
      currency,
      workingHoursStart,
      workingHoursEnd,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setFormName('');
    setFormRole('موظف');
    setFormSpecialty('');
    setFormAllowedTabs(['dashboard', 'book', 'my_bookings']);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword(u.password);
    setFormName(u.name);
    setFormRole(u.role);
    setFormSpecialty(u.specialty || '');
    setFormAllowedTabs(u.allowedTabs);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser({
        ...editingUser,
        username: formUsername,
        password: formPassword,
        name: formName,
        role: formRole,
        specialty: formSpecialty,
        allowedTabs: formAllowedTabs.length > 0 ? formAllowedTabs : ['dashboard'],
      });
    } else {
      addUser({
        username: formUsername,
        password: formPassword,
        name: formName,
        role: formRole,
        specialty: formSpecialty,
        allowedTabs: formAllowedTabs.length > 0 ? formAllowedTabs : ['dashboard'],
      });
    }
    setIsUserModalOpen(false);
  };

  const toggleTabInForm = (tabId: TabId) => {
    if (formAllowedTabs.includes(tabId)) {
      setFormAllowedTabs(formAllowedTabs.filter((t) => t !== tabId));
    } else {
      setFormAllowedTabs([...formAllowedTabs, tabId]);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    const res = await connectLocalDirectory();
    setIsConnecting(false);
    if (!res.success && res.error) {
      alert(res.error);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJsonBackup(content);
        if (ok) {
          alert('تمت استعادة وتحديث قاعدة البيانات بنجاح!');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">إعدادات العيادة والصلاحيات والمزامنة</h2>
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            إدارة اسم العيادة ومواعيد العمل، مصفوفة الصلاحيات (RBAC)، ومحرك المزامنة مع القرص المحلي.
          </p>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-blue-500/30">
          <button
            onClick={() => setSubTab('clinic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'clinic'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-300" />
            <span>بيانات العيادة ومواعيد العمل</span>
          </button>

          <button
            onClick={() => setSubTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-300" />
            <span>المستخدمين والصلاحيات (RBAC)</span>
          </button>

          <button
            onClick={() => setSubTab('storage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'storage'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-300" />
            <span>مزامنة القرص والنسخ الاحتياطي</span>
          </button>
        </div>
      </div>

      {/* 1. CLINIC DETAILS & WORKING HOURS */}
      {subTab === 'clinic' && (
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">بيانات العيادة ومواعيد العمل والفترات الزمنية</h3>
              <p className="text-xs text-blue-200/80">
                تظهر هذه البيانات بشكل بارز في الترويسة العلوية وكافة شاشات الحجز والتقارير.
              </p>
            </div>
            {isSavedNotice && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ التعديلات بنجاح!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveClinic} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم العيادة الرسمي (يظهر في الهيدر وشاشة الدخول) *
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  placeholder="عيادة النخبة التخصصية"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الطبيب المسؤول / المدير الطبي *
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  التخصص الطبي الرئيسي *
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  هاتف العيادة *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ساعة بدء العمل اليومي (تبدأ الفترات من 9:00 صباحاً)
                </label>
                <input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ساعة نهاية العمل اليومي
                </label>
                <input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  العملة المعتمدة
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان مقر العيادة
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                />
              </div>
            </div>

            {/* Time Slots Preview Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-blue-500/20">
              <span className="text-xs font-bold text-cyan-300 block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>فترات العمل المتاحة للحجز (Time Slots):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(db?.settings?.timeSlots || []).map((slot, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-cyan-200 text-xs font-mono font-bold"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                حفظ بيانات العيادة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. USERS & RBAC PERMISSIONS MATRIX */}
      {subTab === 'users' && (
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  مصفوفة التحكم في الوصول والصلاحيات (RBAC Permissions Matrix)
                </h3>
                <p className="text-xs text-amber-200/80">
                  تحديد الأقسام المفعلة لكل مستخدم، حيث يقوم الشريط الجانبي (Sidebar) بعرض الأقسام المصرح بها فقط.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                  <th className="p-3 text-right">المستخدم / الدور</th>
                  {ALL_TABS.map((tab) => (
                    <th key={tab.id} className="p-3 text-center">
                      <div className="font-semibold">{tab.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{tab.id}</div>
                    </th>
                  ))}
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(Array.isArray(db?.users) ? db.users : []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-[11px] text-cyan-300 font-mono">
                        @{u.username} • <span className="text-amber-300 font-semibold">{u.role}</span>
                      </div>
                    </td>

                    {/* 8 Tab Checkboxes */}
                    {ALL_TABS.map((tab) => {
                      const isChecked = u.allowedTabs.includes(tab.id);
                      return (
                        <td key={tab.id} className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleUserTabPermission(u.id, tab.id)}
                            className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-blue-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                : 'bg-slate-900 border-slate-700 text-transparent hover:border-slate-500'
                            }`}
                            title={`تبديل صلاحية: ${tab.label}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="تعديل"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المستخدم @${u.username}؟`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STORAGE & LOCAL DRIVE SYNC */}
      {subTab === 'storage' && (
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  محرك المزامنة مع القرص المحلي (File System Access API)
                </h3>
                <p className="text-xs text-cyan-200/80">
                  حفظ دائم وفوري على أي بارتشن بالكمبيوتر (مثل D:\ أو E:) لكافة الحجوزات والملفات.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  syncStatus.isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${syncStatus.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{syncStatus.isConnected ? 'متزامن مع الهارد ديسك' : 'غير متصل بمجلد محلي'}</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">المجلد المحدد على الكمبيوتر:</div>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {syncStatus.folderName ? `${syncStatus.folderName}\\clinic_db.json` : 'لم يتم تحديد مجلد (اختر مجلداً على D: أو E:)'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                يكتب النظام مباشرة في ملف <code className="text-white font-mono">clinic_db.json</code> في القرص المحلي بشكل تلقائي.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                <FolderSync className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{syncStatus.isConnected ? 'تغيير المجلد' : 'تحديد مجلد على قرص (D: / E:)'}</span>
              </button>
              {syncStatus.isConnected && (
                <button
                  onClick={disconnectLocalDirectory}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 text-rose-400 hover:bg-slate-700 text-xs"
                >
                  فصل
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white text-xs block mb-1">تنزيل نسخة احتياطية</span>
                <p className="text-[11px] text-slate-400 mb-3">حفظ ملف JSON كامل على جهازك يدوياً.</p>
              </div>
              <button
                onClick={exportJsonBackup}
                className="w-full py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 text-xs font-bold"
              >
                تنزيل نسخة JSON
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white text-xs block mb-1">استعادة نسخة سابقة</span>
                <p className="text-[11px] text-slate-400 mb-3">رفع ملف JSON لاسترجاع كافة البيانات.</p>
              </div>
              <label className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center cursor-pointer">
                <span>رفع ملف JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white text-xs block mb-1">إعادة ضبط المصنع</span>
                <p className="text-[11px] text-slate-400 mb-3">استرجاع البيانات التجريبية الافتراضية.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط المصنع؟')) {
                    resetDatabase();
                    alert('تمت استعادة البيانات الافتراضية بنجاح!');
                  }
                }}
                className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold"
              >
                إعادة ضبط المصنع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  {editingUser ? 'تعديل حساب المستخدم' : 'إضافة مستخدم جديد للنظام'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="د. أحمد الشناوي"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">اسم الدخول (Username) *</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">الدور الوظيفي *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="مدير">مدير (Admin)</option>
                    <option value="دكتور">دكتور (Doctor)</option>
                    <option value="موظف">موظف (Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">التخصص</label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="مثال: باطنة وقلب"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-300 mb-2">
                  الأقسام المصرح له برؤيتها في الشريط الجانبي:
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {ALL_TABS.map((tab) => {
                    const isChecked = formAllowedTabs.includes(tab.id);
                    return (
                      <label key={tab.id} className="flex items-center gap-2 cursor-pointer p-1 text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTabInForm(tab.id)}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span>{tab.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {editingUser ? 'حفظ التعديل' : 'إنشاء المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
