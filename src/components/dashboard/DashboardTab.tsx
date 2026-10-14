import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  CalendarClock,
  Calendar,
  Filter,
  User,
  Phone,
  Clock,
  Search,
  Sparkles,
  ArrowUpRight,
  Stethoscope,
  ChevronDown,
  Activity,
  History,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Booking, BookingStatus } from '../../types/clinic';

export const DashboardTab: React.FC = () => {
  const {
    db,
    getPatientVisitStats,
    setBookingStatus,
    setActiveTab,
    currentUser,
  } = useClinic();

  const todayDate = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayDate.toISOString().split('T')[0], [todayDate]);

  // Two Top Glass Stats:
  // 1. عدد الحجوزات التي تم حجزها والمريض حضر فعلياً (تمت الزيارة)
  const allBookings = Array.isArray(db?.bookings) ? db.bookings : [];
  const attendedCount = allBookings.filter((b) => b?.status === 'تمت الزيارة').length;

  // 2. عدد الحجوزات القادمة
  const upcomingCount = allBookings.filter((b) => b?.status === 'قادم').length;

  // Smart 7-Day Week Options Generator
  // الخيار الأول: "اليوم"، أسفلها: "غداً"، وأسفلها: "بعد غد" وما يليه لمدة أسبوع كامل مكتوبة بأسماء الأيام أوتوماتيكياً
  const smartWeekOptions = useMemo(() => {
    const options: Array<{ label: string; dateStr: string }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });

      let title = '';
      if (i === 0) {
        title = `اليوم (${dayName} - ${dateStr})`;
      } else if (i === 1) {
        title = `غداً (${dayName} - ${dateStr})`;
      } else if (i === 2) {
        title = `بعد غد (${dayName} - ${dateStr})`;
      } else {
        title = `${dayName} (${dateStr})`;
      }

      options.push({
        label: title,
        dateStr,
      });
    }

    return options;
  }, []);

  // Filter 1: Range filter (من تاريخ ... إلى تاريخ ...)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Filter 2: Smart week dropdown (Default: "today" -> index 0)
  const [selectedSmartDay, setSelectedSmartDay] = useState<string>(todayStr);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset range when selecting smart day, and vice-versa
  const handleSmartDayChange = (val: string) => {
    setSelectedSmartDay(val);
    setFromDate('');
    setToDate('');
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setSelectedSmartDay(''); // disable single day filter when range is used
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setSelectedSmartDay('');
  };

  const handleResetFilters = () => {
    setSelectedSmartDay(todayStr);
    setFromDate('');
    setToDate('');
    setSearchQuery('');
  };

  // Filter Bookings logic
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(db?.bookings) ? db.bookings : [];
    return list.filter((b) => {
      if (!b) return false;
      // 1. Search Query
      const matchesSearch =
        !searchQuery ||
        (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.patientPhone && b.patientPhone.includes(searchQuery)) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Date filtering
      if (fromDate && toDate) {
        return b.date >= fromDate && b.date <= toDate;
      } else if (fromDate && !toDate) {
        return b.date >= fromDate;
      } else if (!fromDate && toDate) {
        return b.date <= toDate;
      } else if (selectedSmartDay) {
        return b.date === selectedSmartDay;
      }

      // Default fallback: today
      return b.date === todayStr;
    });
  }, [db.bookings, searchQuery, fromDate, toDate, selectedSmartDay, todayStr]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'تمت الزيارة':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'قادم':
        return 'bg-blue-500/20 text-cyan-300 border-cyan-500/40';
      case 'قيد الانتظار':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'ملغي':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.35)]">
        <div className="absolute top-0 left-0 w-96 h-full bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                لوحة التحكم الرئيسية
              </span>
              <span className="text-xs text-slate-400">
                {db.settings.clinicName}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              مرحباً بك، {currentUser?.name}
            </h2>
            <p className="text-xs text-blue-200/80 mt-1">
              متابعة فورية للحجوزات المؤكدة، الزيارات المكتملة، وتاريخ تردد المرضى على العيادة.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>حجز موعد جديد</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* REQUIREMENT 5 (Top): المربعان الإحصائيان بتصميم زجاجي */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* المربع الأول: عدد الحجوزات التي تم حجزها والمريض حضر فعلياً (تمت الزيارة) */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:border-emerald-400/60 transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200">
                الحجوزات التي حضر أصحابها فعلياً (تمت الزيارة)
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="text-4xl font-black text-emerald-400 font-mono mb-1">
            {attendedCount}
          </div>
          <p className="text-xs text-slate-400">
            مريض أتموا الكشف الطبي واستلام العلاج بالعيادة بنجاح
          </p>
        </div>

        {/* المربع الثاني: عدد الحجوزات القادمة */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:border-cyan-400/60 transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200">
                عدد الحجوزات القادمة
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow">
              <CalendarClock className="w-6 h-6" />
            </div>
          </div>

          <div className="text-4xl font-black text-cyan-300 font-mono mb-1">
            {upcomingCount}
          </div>
          <p className="text-xs text-slate-400">
            مواعيد مستقبلية مجدولة مسجلة في قائمة الانتظار والمتابعة
          </p>
        </div>

      </div>

      {/* REQUIREMENT 5 (Bottom): قسم "الحجوزات التي تم تسجيلها" */}
      <div className="rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] p-6 space-y-5">
        
        {/* Section Title & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                الحجوزات التي تم تسجيلها
              </h3>
              <p className="text-xs text-blue-200/70">
                يعرض افتراضياً حجوزات اليوم الحالي، مع إمكانية التصفية اللحظية بالفترة أو الأسبوع الذكي.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>عدد النتائج المعروضة:</span>
            <span className="font-bold text-cyan-300 font-mono text-sm bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
              {filteredBookings.length}
            </span>
          </div>
        </div>

        {/* Filters Bar:
            1. تحديد فترة زمنية: (من تاريخ ... إلى تاريخ ...)
            2. قائمة منسدلة ذكية لمدة أسبوع (اليوم، غداً، بعد غد، وباقي الأيام بأسماء الأيام)
        */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 grid grid-cols-1 md:grid-cols-12 gap-3.5">
          
          {/* Filter 2: القائمة المنسدلة الذكية لمدة أسبوع */}
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>القائمة الذكية للأسبوع (7 أيام):</span>
            </label>
            <div className="relative">
              <select
                value={selectedSmartDay}
                onChange={(e) => handleSmartDayChange(e.target.value)}
                className="w-full px-3 py-2 pr-3 pl-8 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer shadow-inner"
              >
                <option value="">-- عرض كل الأيام / استخدام الفترة --</option>
                {smartWeekOptions.map((opt, idx) => (
                  <option key={idx} value={opt.dateStr}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-cyan-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Filter 1: تحديد فترة زمنية: (من تاريخ ... إلى تاريخ ...) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                من تاريخ:
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                إلى تاريخ:
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              استعادة اليوم
            </button>
          </div>

          {/* Live Search Field */}
          <div className="md:col-span-12 pt-2 border-t border-slate-800/80">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث فوري باسم المريض، رقم الهاتف، أو اسم الدكتور المعالج..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900/90 border border-blue-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-4 h-4 text-blue-400 absolute right-3 top-2.5" />
            </div>
          </div>

        </div>

        {/* REQUIREMENT 5 (Table): جدول الحجوزات حسب الفترة المختارة
            الأعمدة بالترتيب الدقيق: (الدكتور | اسم المريض | رقم الهاتف | عدد الزيارات | آخر زيارة)
        */}
        <div className="overflow-x-auto rounded-2xl border border-blue-500/30 bg-slate-950/60 shadow-inner">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-blue-500/40 bg-slate-900/90 text-slate-200">
                <th className="p-3.5 font-bold">الدكتور</th>
                <th className="p-3.5 font-bold">اسم المريض</th>
                <th className="p-3.5 font-bold">رقم الهاتف</th>
                <th className="p-3.5 font-bold text-center">عدد الزيارات</th>
                <th className="p-3.5 font-bold text-center">آخر زيارة</th>
                <th className="p-3.5 font-bold text-center">موعد الحجز</th>
                <th className="p-3.5 font-bold text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 text-xs">
                    لا توجد حجوزات مسجلة مطابقة للفترة أو اليوم المحدد.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  // Compute dynamic visit stats for this patient
                  const visitStats = getPatientVisitStats(b.patientId);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Column 1: الدكتور */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300">
                            <Stethoscope className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{b.doctorName}</div>
                            <div className="text-[10px] text-blue-300">{b.serviceName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: اسم المريض */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{b.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.bookingNumber}</div>
                      </td>

                      {/* Column 3: رقم الهاتف */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-cyan-200 text-xs">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span>{b.patientPhone}</span>
                        </div>
                      </td>

                      {/* Column 4: عدد الزيارات (ديناميكي) */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-cyan-300 font-bold font-mono text-xs">
                          {visitStats.totalVisits} زيارة
                        </span>
                      </td>

                      {/* Column 5: آخر زيارة (ديناميكي) */}
                      <td className="p-3.5 text-center">
                        {visitStats.lastVisitDate ? (
                          <span className="font-mono text-slate-300 text-xs font-semibold">
                            {visitStats.lastVisitDate}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">زيارة أولى</span>
                        )}
                      </td>

                      {/* Time slot & date */}
                      <td className="p-3.5 text-center font-mono">
                        <div className="font-bold text-white text-xs">{b.time}</div>
                        <div className="text-[10px] text-slate-400">{b.date}</div>
                      </td>

                      {/* Status with quick switcher */}
                      <td className="p-3.5 text-center">
                        <select
                          value={b.status}
                          onChange={(e) => setBookingStatus(b.id, e.target.value as BookingStatus)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold bg-slate-900 cursor-pointer focus:outline-none ${getStatusBadge(b.status)}`}
                        >
                          <option value="قادم">قادم</option>
                          <option value="تمت الزيارة">تمت الزيارة</option>
                          <option value="قيد الانتظار">قيد الانتظار</option>
                          <option value="ملغي">ملغي</option>
                        </select>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
