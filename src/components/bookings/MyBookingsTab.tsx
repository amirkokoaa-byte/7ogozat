import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Clock,
  Stethoscope,
  Phone,
  ShieldCheck,
  PlusCircle,
  X,
  Edit,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Save,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Booking, BookingStatus } from '../../types/clinic';

export const MyBookingsTab: React.FC = () => {
  const {
    db,
    setBookingStatus,
    updateBooking,
    deleteBooking,
    markBookingVisited,
    setActiveTab,
  } = useClinic();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. فلاتر البحث العلوية (تعمل لحظياً)
  // فلتر الدكتور:
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  // فلتر المريض أو الهاتف:
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  // فلتر اليوم أو تاريخ معين:
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');

  // 2. النافذة المنبثقة للحجز (Booking Modal)
  const [activeModalBooking, setActiveModalBooking] = useState<Booking | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState<boolean>(false);

  // Edit fields inside modal
  const [editDoctorId, setEditDoctorId] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [visitedStatusDraft, setVisitedStatusDraft] = useState<boolean>(false);

  // Feedback banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter Bookings logic
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(db?.bookings) ? db.bookings : [];

    // Filter by Doctor
    const afterDoctor = list.filter((b) => {
      if (!b) return false;
      if (selectedDoctorFilter === 'all') return true;
      return b.doctorId === selectedDoctorFilter;
    });

    // Filter by Patient Name or Phone
    const afterPatient = afterDoctor.filter((b) => {
      if (!patientSearchQuery.trim()) return true;
      const q = patientSearchQuery.trim().toLowerCase();
      return (
        (b.patientName && b.patientName.toLowerCase().includes(q)) ||
        (b.patientPhone && b.patientPhone.includes(q)) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q))
      );
    });

    // Filter by Date (All / Today / Custom)
    const afterDate = afterPatient.filter((b) => {
      if (dateFilterMode === 'today') {
        return b.date === todayStr;
      }
      if (dateFilterMode === 'custom' && customDate) {
        return b.date === customDate;
      }
      return true;
    });

    // Sort by day (date ascending/descending)
    return [...afterDate].sort((a, b) => {
      const cmp = (b.date || '').localeCompare(a.date || '');
      if (cmp !== 0) return cmp;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [db?.bookings, selectedDoctorFilter, patientSearchQuery, dateFilterMode, customDate, todayStr]);

  // Open Booking Details Modal
  const handleOpenBookingModal = (b: Booking) => {
    setActiveModalBooking(b);
    setIsEditingInModal(false);
    setEditDoctorId(b.doctorId);
    setEditDate(b.date);
    setEditTime(b.time);
    setEditNotes(b.notes || '');
    setVisitedStatusDraft(b.status === 'تمت الزيارة');
  };

  // Close Booking Details Modal and apply "تمت الزيارة" and migration to Medical Records if toggled
  const handleCloseBookingModal = () => {
    if (!activeModalBooking) {
      setActiveModalBooking(null);
      return;
    }

    // Check if user toggled "تمت الزيارة" and it wasn't visited before
    if (visitedStatusDraft && activeModalBooking.status !== 'تمت الزيارة') {
      markBookingVisited(activeModalBooking.id);
      setActionNotice(`تم تأكيد حضور المريض (${activeModalBooking.patientName}) وترحيل الحجز أوتوماتيكياً إلى "الملف الطبي" بنجاح!`);
      setTimeout(() => setActionNotice(null), 5000);
    } else if (!visitedStatusDraft && activeModalBooking.status === 'تمت الزيارة') {
      // Reverted
      setBookingStatus(activeModalBooking.id, 'قادم');
    }

    setActiveModalBooking(null);
    setIsEditingInModal(false);
  };

  // Save edits inside modal
  const handleSaveModalEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalBooking) return;

    const docObj = (db.doctors || []).find((d) => d.id === editDoctorId);

    const updated: Booking = {
      ...activeModalBooking,
      doctorId: editDoctorId,
      doctorName: docObj ? docObj.name : activeModalBooking.doctorName,
      date: editDate,
      time: editTime,
      notes: editNotes,
      status: visitedStatusDraft ? 'تمت الزيارة' : 'قادم',
    };

    updateBooking(updated);
    setActiveModalBooking(updated);
    setIsEditingInModal(false);
    setActionNotice('تم حفظ تعديلات الحجز بنجاح!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete booking
  const handleDeleteBooking = (id: string, bookingNum: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف الحجز رقم ${bookingNum}؟`)) {
      deleteBooking(id);
      setActiveModalBooking(null);
      setActionNotice(`تم حذف الحجز ${bookingNum} بنجاح.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">القسم الثالث: حجوزاتي (My Bookings)</h2>
              <p className="text-xs text-blue-200/80">
                جدول الحجوزات المسجلة مرتبة حسب اليوم، مع فلاتر بحث لحظية والنافذة المنبثقة وترحيل الزيارات للملف الطبي.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('book')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActiveTab('medical_records')}
            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
          >
            الانتقال للملف الطبي
          </button>
        </div>
      )}

      {/* REQUIREMENT 2: فلاتر البحث العلوية (تعمل لحظياً) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        
        {/* 1. قائمة منسدلة للبحث باسم الدكتور */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>البحث بالدكتور المعالج:</span>
          </label>
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">كل الأطباء المعالجين</option>
            {(db.doctors || []).map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* 2. خانة بحث باسم المريض أو برقم الهاتف */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>اسم المريض أو رقم الهاتف:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              placeholder="اكتب اسم المريض أو رقم هاتفه..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-blue-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 3. اختيار للبحث عن طريق اليوم أو تحديد تاريخ معين */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>البحث باليوم أو التاريخ:</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as 'all' | 'today' | 'custom')}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كل الأيام</option>
              <option value="today">حجوزات اليوم فقط</option>
              <option value="custom">تاريخ مخصص...</option>
            </select>

            {dateFilterMode === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            )}
          </div>
        </div>

      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <span>انقر على أي صف في الجدول لفتح <strong>النافذة المنبثقة للحجز (Booking Modal)</strong> وتعديله أو ترحيل الزيارة.</span>
          <span className="font-bold text-cyan-300 font-mono bg-blue-950/70 px-2.5 py-0.5 rounded border border-blue-500/30">
            {filteredBookings.length} حجز
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-blue-500/30 bg-slate-950/90 text-slate-200">
                <th className="p-3.5 text-center">رقم الحجز</th>
                <th className="p-3.5 font-bold">اسم المريض</th>
                <th className="p-3.5 font-bold">رقم الهاتف</th>
                <th className="p-3.5 font-bold">الدكتور المعالج</th>
                <th className="p-3.5 font-bold">الخدمة الطبية</th>
                <th className="p-3.5 text-center font-bold">السعر المثبت</th>
                <th className="p-3.5 text-center font-bold">تاريخ الحجز والوقت</th>
                <th className="p-3.5 text-center font-bold">حالة الحجز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">
                    لا توجد حجوزات مسجلة مطابقة لخيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isVisited = b.status === 'تمت الزيارة';

                  return (
                    <tr
                      key={b.id}
                      onClick={() => handleOpenBookingModal(b)}
                      className="hover:bg-blue-600/15 cursor-pointer transition-colors group"
                      title="انقر لفتح تفاصيل الحجز"
                    >
                      {/* رقم الحجز */}
                      <td className="p-3.5 text-center font-mono font-bold text-cyan-300">
                        {b.bookingNumber}
                      </td>

                      {/* اسم المريض */}
                      <td className="p-3.5 font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {b.patientName}
                      </td>

                      {/* رقم الهاتف */}
                      <td className="p-3.5 font-mono text-cyan-200">
                        {b.patientPhone}
                      </td>

                      {/* الدكتور المعالج */}
                      <td className="p-3.5 text-slate-200 font-semibold">
                        {b.doctorName}
                      </td>

                      {/* الخدمة */}
                      <td className="p-3.5 text-slate-300">
                        {b.serviceName}
                      </td>

                      {/* السعر المثبت وقت الحجز */}
                      <td className="p-3.5 text-center font-mono font-bold text-cyan-300">
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                          {b.lockedPrice} {db.settings.currency}
                        </span>
                      </td>

                      {/* الموعد والتاريخ */}
                      <td className="p-3.5 text-center font-mono">
                        <div className="font-bold text-white text-xs">{b.time}</div>
                        <div className="text-[10px] text-slate-400">{b.date}</div>
                      </td>

                      {/* CRITICAL REQUIREMENT:
                          عند تفعيل "تمت الزيارة" يظهر على الحجز من الخارج شارة "تمت الزيارة" ملونة باللون الأصفر
                      */}
                      <td className="p-3.5 text-center">
                        {isVisited ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-bold border border-yellow-300 text-xs shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                            <Check className="w-3.5 h-3.5" />
                            <span>تمت الزيارة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30 text-xs font-semibold">
                            <span>{b.status}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUIREMENT 3: النافذة المنبثقة للحجز (Booking Modal) وترحيل الزيارة */}
      {activeModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] p-6 overflow-hidden">
            
            {/* Modal Header: Title & Close Button (X) in top left (في أعلى اليسار زر إغلاق X) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    تفاصيل وبيانات الحجز: {activeModalBooking.bookingNumber}
                  </h3>
                  <span className="text-[11px] text-blue-200">
                    يمكنك تعديل الحجز، حذفه، أو تحديد "تمت الزيارة" لترحيله فوراً للملف الطبي.
                  </span>
                </div>
              </div>

              {/* زر الإغلاق في أعلى اليسار */}
              <button
                type="button"
                onClick={handleCloseBookingModal}
                title="إغلاق وحفظ حالة الزيارة"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {!isEditingInModal ? (
              /* View Mode */
              <div className="space-y-4 text-xs">
                
                {/* Patient & Doctor Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/30">
                    <span className="text-slate-400 block mb-1">اسم المريض:</span>
                    <strong className="text-sm text-white block">{activeModalBooking.patientName}</strong>
                    <div className="text-cyan-300 font-mono mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeModalBooking.patientPhone}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/30">
                    <span className="text-slate-400 block mb-1">الدكتور المعالج:</span>
                    <strong className="text-sm text-white block">{activeModalBooking.doctorName}</strong>
                    <span className="text-blue-300 text-[11px] block mt-1">الخدمة: {activeModalBooking.serviceName}</span>
                  </div>
                </div>

                {/* Date, Time & Locked Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">تاريخ الحجز:</span>
                    <strong className="text-white font-mono">{activeModalBooking.date}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">وقت الزيارة:</span>
                    <strong className="text-cyan-300 font-mono font-bold">{activeModalBooking.time}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-center">
                    <span className="text-slate-400 block mb-0.5">السعر المثبت:</span>
                    <strong className="text-cyan-300 font-mono font-bold text-sm">
                      {activeModalBooking.lockedPrice} {db.settings.currency}
                    </strong>
                  </div>
                </div>

                {activeModalBooking.notes && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                    <span className="text-slate-400 block mb-0.5 font-bold">ملاحظات الحجز:</span>
                    <p>{activeModalBooking.notes}</p>
                  </div>
                )}

                {/* THE "تمت الزيارة" INTERACTIVE BUTTON / TOGGLE
                    عند تفعيل "تمت الزيارة" والضغط على زر الإغلاق (X):
                    - يظهر على الحجز من الخارج شارة "تمت الزيارة" باللون الأصفر
                    - يتم ترحيل الحجز أوتوماتيكياً إلى الخانة الرابعة "الملف الطبي"
                */}
                <div className="p-4 rounded-2xl bg-blue-950/50 border border-cyan-500/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">حالة حضور المريض (الزيارة الطبية):</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      تفعيل هذا الخيار يقوم بترحيل المريض تلقائياً إلى "الملف الطبي" وعرض شارة صفراء بالجدول.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVisitedStatusDraft(!visitedStatusDraft)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                      visitedStatusDraft
                        ? 'bg-yellow-400 text-slate-950 border border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{visitedStatusDraft ? '✓ تم تحديد: تمت الزيارة' : 'تحديد: تمت الزيارة'}</span>
                  </button>
                </div>

                {/* Bottom Actions inside Modal: زر "تعديل" و زر "حذف" و زر إغلاق */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteBooking(activeModalBooking.id, activeModalBooking.bookingNumber)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الحجز</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingInModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 font-bold transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل بيانات الحجز</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseBookingModal}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow"
                    >
                      إغلاق (حفظ الحالة)
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Edit Mode Form inside Modal */
              <form onSubmit={handleSaveModalEdits} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الدكتور المعالج *</label>
                  <select
                    value={editDoctorId}
                    onChange={(e) => setEditDoctorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white"
                  >
                    {(db.doctors || []).map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">تاريخ الحجز *</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">وقت الزيارة *</label>
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white font-mono"
                    >
                      {(db.settings?.timeSlots || []).map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ملاحظات الحجز</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
