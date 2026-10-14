import React, { useState, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  CalendarPlus,
  Phone,
  User,
  Stethoscope,
  DollarSign,
  ArrowRight,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Booking } from '../../types/clinic';

export const NotificationsTab: React.FC = () => {
  const {
    db,
    navigateToBookingWithSlot,
    markBookingVisited,
    setActiveTab,
  } = useClinic();

  // Today string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [selectedBookedSlot, setSelectedBookedSlot] = useState<Booking | null>(null);

  // All bookings safe array
  const allBookings = useMemo(() => {
    return Array.isArray(db?.bookings) ? db.bookings : [];
  }, [db?.bookings]);

  // Today's Bookings
  const todayBookings = useMemo(() => {
    return allBookings.filter((b) => b.date === todayStr);
  }, [allBookings, todayStr]);

  // Map of Dates that have bookings => Set of dates or counts
  const datesWithBookingsMap = useMemo(() => {
    const map = new Map<string, number>();
    allBookings.forEach((b) => {
      if (b.date) {
        map.set(b.date, (map.get(b.date) || 0) + 1);
      }
    });
    return map;
  }, [allBookings]);

  // Calendar Calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  const monthNameArabic = useMemo(() => {
    return currentMonthDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  // Days in month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysCount = lastDayOfMonth.getDate();
    // In Arabic Saturday is first day or Sunday. Let's align with Saturday (6):
    // Standard JS: 0=Sun, 1=Mon, ..., 6=Sat
    // We want Saturday to be index 0: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    const startDayIndex = (firstDayOfMonth.getDay() + 1) % 7;

    const daysArray: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      bookingsCount: number;
      isToday: boolean;
    }> = [];

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
      daysArray.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        bookingsCount: 0,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArray.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        bookingsCount: datesWithBookingsMap.get(dateStr) || 0,
        isToday: dateStr === todayStr,
      });
    }

    return daysArray;
  }, [year, month, datesWithBookingsMap, todayStr]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };
  const handleTodayMonth = () => {
    setCurrentMonthDate(new Date());
    setSelectedCalendarDate(todayStr);
  };

  // Clinic time slots from settings
  const clinicTimeSlots = useMemo(() => {
    return (
      db?.settings?.timeSlots || [
        '09:00 ص',
        '10:00 ص',
        '11:00 ص',
        '12:00 م',
        '01:00 م',
        '02:00 م',
        '05:00 م',
        '06:00 م',
        '07:00 م',
        '08:00 م',
        '09:00 م',
      ]
    );
  }, [db?.settings?.timeSlots]);

  // Bookings on the selected calendar date
  const bookingsOnSelectedDate = useMemo(() => {
    return allBookings.filter((b) => b.date === selectedCalendarDate);
  }, [allBookings, selectedCalendarDate]);

  // Selected date formatted in Arabic
  const formattedSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return '';
    const parts = selectedCalendarDate.split('-');
    if (parts.length !== 3) return selectedCalendarDate;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedCalendarDate]);

  // Select a day from Calendar
  const handleSelectDay = (dateStr: string) => {
    if (!dateStr) return;
    setSelectedCalendarDate(dateStr);
    setSelectedBookedSlot(null);
    setIsDayDetailsOpen(true);
  };

  // Handle Clicking on Empty Slot => Navigate to Book Appointment
  const handleSelectEmptySlot = (slotTime: string) => {
    navigateToBookingWithSlot({
      date: selectedCalendarDate,
      time: slotTime,
      notes: `تم الحجز السريع عبر تقويم الإشعارات ليوم ${selectedCalendarDate}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">مركز الإشعارات وجدول الحجوزات</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-xs font-bold">
                {datesWithBookingsMap.size} أيام بها حجوزات
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              جدول حجوزات اليوم لحظياً، وتقويم المواعيد الشهري لاكتشاف الفترات المحجوزة والحجز التلقائي في الساعات المتاحة.
            </p>
          </div>
        </div>

        {/* Today Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/80 border border-blue-500/30">
          <CalendarCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300">اليوم:</span>
          <span className="text-xs font-bold text-cyan-300 font-mono">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Main Grid: Right = Today's Bookings Table, Left = Calendar of Booked Days */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Right Section (7 Cols on LG): Today's Bookings Table */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Today's Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <span className="text-[11px] text-slate-400 block mb-0.5">حجوزات اليوم</span>
              <div className="text-xl font-bold text-white font-mono">{todayBookings.length}</div>
            </div>

            <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-slate-900/80 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="text-[11px] text-emerald-300 block mb-0.5">تمت الزيارة</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {todayBookings.filter((b) => b.status === 'تمت الزيارة').length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-slate-900/80 border border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <span className="text-[11px] text-yellow-300 block mb-0.5">متبقية اليوم</span>
              <div className="text-xl font-bold text-yellow-400 font-mono">
                {todayBookings.filter((b) => b.status !== 'تمت الزيارة').length}
              </div>
            </div>
          </div>

          {/* Today's Bookings Table Container */}
          <div className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] overflow-hidden">
            <div className="p-4 border-b border-blue-500/30 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">جدول حجوزات اليوم بالكامل</h3>
              </div>
              <span className="text-xs text-cyan-300 font-mono bg-blue-950/70 px-2.5 py-1 rounded-lg border border-blue-500/30 font-bold">
                {todayStr}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-blue-500/20 bg-slate-950/90 text-slate-300 font-bold">
                    <th className="p-3 text-center">الوقت</th>
                    <th className="p-3">اسم المريض</th>
                    <th className="p-3">الطبيب المعالج</th>
                    <th className="p-3">الخدمة</th>
                    <th className="p-3 text-center">السعر</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {todayBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        <div className="space-y-2">
                          <CalendarCheck className="w-10 h-10 text-slate-500 mx-auto" />
                          <p className="font-bold text-white text-sm">لا توجد حجوزات مسجلة لهذا اليوم حتى الآن</p>
                          <p className="text-xs text-slate-400">
                            يمكنك استخدام التقويم على اليسار لاختيار ساعة فارغة وحجز موعد فوراً.
                          </p>
                          <button
                            onClick={() => {
                              navigateToBookingWithSlot({
                                date: todayStr,
                                time: '09:00 ص',
                              });
                            }}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            <span>حجز موعد جديد لليوم</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    todayBookings.map((b) => (
                      <tr
                        key={b.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          b.status === 'تمت الزيارة' ? 'bg-emerald-950/15' : ''
                        }`}
                      >
                        {/* Time */}
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-cyan-300 font-mono font-bold text-xs inline-block">
                            {b.time}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{b.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                            {b.patientPhone}
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="p-3 text-slate-200 font-medium">{b.doctorName}</td>

                        {/* Service */}
                        <td className="p-3 text-cyan-300 font-medium">{b.serviceName}</td>

                        {/* Price */}
                        <td className="p-3 text-center font-bold font-mono text-amber-300">
                          {b.lockedPrice} {db?.settings?.currency || 'ر.س'}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              b.status === 'تمت الزيارة'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          {b.status !== 'تمت الزيارة' ? (
                            <button
                              onClick={() => markBookingVisited(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold transition-all"
                              title="تسجيل حضور المريض (تمت الزيارة)"
                            >
                              تمت الزيارة
                            </button>
                          ) : (
                            <span className="text-emerald-400 flex items-center justify-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مكتمل</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Left Section (5 Cols on LG): Calendar of Days with Bookings */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/85 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] space-y-4">
            
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white text-sm">الأيام التي يوجد بها حجوزات</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTodayMonth}
                  className="px-2 py-1 rounded-lg bg-blue-950/70 border border-blue-500/30 text-cyan-300 text-[11px] font-bold hover:bg-blue-900/50"
                  title="العودة لليوم"
                >
                  اليوم
                </button>

                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                  title="الشهر القادم"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Month Display */}
            <div className="text-center font-bold text-cyan-300 text-sm font-mono pb-1">
              {monthNameArabic}
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 pb-1 border-b border-slate-800">
              <div>سبت</div>
              <div>أحد</div>
              <div>اثنين</div>
              <div>ثلاثاء</div>
              <div>أربعاء</div>
              <div>خميس</div>
              <div>جمعة</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {calendarDays.map((dayItem, idx) => {
                if (!dayItem.isCurrentMonth) {
                  return <div key={idx} className="h-10 rounded-xl bg-slate-950/20" />;
                }

                const hasBookings = dayItem.bookingsCount > 0;
                const isSelected = dayItem.dateStr === selectedCalendarDate;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(dayItem.dateStr)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all relative group ${
                      hasBookings
                        ? 'bg-yellow-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(250,204,21,0.6)] hover:bg-yellow-300 hover:scale-105 active:scale-95'
                        : isSelected
                        ? 'bg-blue-600 text-white font-bold border border-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        : dayItem.isToday
                        ? 'bg-slate-950/90 text-cyan-300 border border-cyan-400 font-bold hover:bg-slate-800'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
                    }`}
                  >
                    <span className="text-xs leading-none">{dayItem.dayNumber}</span>
                    {hasBookings && (
                      <span className="text-[9px] leading-none mt-0.5 px-1 rounded-full bg-slate-950 text-yellow-300 font-mono font-bold">
                        {dayItem.bookingsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-yellow-400 border border-yellow-500 inline-block shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
                <span className="text-slate-300 font-medium">يوم به حجوزات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-cyan-400 inline-block" />
                <span className="text-slate-300 font-medium">اليوم الحالي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700 inline-block" />
                <span className="text-slate-400">يوم فارغ</span>
              </div>
            </div>

            <p className="text-[11px] text-cyan-300/80 leading-relaxed text-center">
              💡 اضغط على أي يوم لعرض ساعات العمل والمواعيد المحجوزة، أو الضغط على ساعة فارغة للانتقال للحجز الفوري.
            </p>
          </div>
        </div>
      </div>

      {/* Day Details Modal / Screen when clicking on any calendar date */}
      {isDayDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl backdrop-blur-2xl bg-slate-900/95 border border-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.35)] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">مواعيد وفترات الزيارة لهذا اليوم</h3>
                  <p className="text-xs text-yellow-300/90 font-mono mt-0.5">{formattedSelectedDate}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDayDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend & Instructions */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-yellow-400 text-slate-950 font-bold text-[11px]">
                  الساعة باللون الأصفر
                </span>
                <span className="text-slate-300">ساعة محجوزة (اضغط لعرض بيانات المريض)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-[11px]">
                  الساعة باللون الأبيض
                </span>
                <span className="text-slate-300">ساعة فارغة (اضغط للحجز التلقائي المباشر)</span>
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">فترات وساعات العمل المسجلة:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {clinicTimeSlots.map((slotTime) => {
                  const bookingForSlot = bookingsOnSelectedDate.find((b) => b.time === slotTime);
                  const isBooked = Boolean(bookingForSlot);
                  const isCurrentlySelected = selectedBookedSlot?.id === bookingForSlot?.id;

                  if (isBooked && bookingForSlot) {
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => setSelectedBookedSlot(bookingForSlot)}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-yellow-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(250,204,21,0.5)] border-2 ${
                          isCurrentlySelected ? 'border-white scale-105' : 'border-yellow-300 hover:scale-102'
                        }`}
                        title="ساعة محجوزة - اضغط لعرض تفاصيل المريض"
                      >
                        <span className="text-sm font-mono font-black">{slotTime}</span>
                        <span className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-slate-950 text-yellow-300 font-bold">
                          محجوز • {bookingForSlot.patientName}
                        </span>
                      </button>
                    );
                  }

                  // Empty Slot: White Button leading directly to Book Appointment
                  return (
                    <button
                      key={slotTime}
                      type="button"
                      onClick={() => handleSelectEmptySlot(slotTime)}
                      className="p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-white hover:bg-slate-100 text-slate-950 font-bold border-2 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)] active:scale-95 group"
                      title="ساعة فارغة - اضغط للانتقال لحجز موعد في هذه الساعة"
                    >
                      <span className="text-sm font-mono font-black group-hover:text-blue-600 transition-colors">
                        {slotTime}
                      </span>
                      <span className="text-[10px] mt-1 text-slate-600 font-semibold flex items-center gap-0.5">
                        <CalendarPlus className="w-3 h-3 text-blue-600" />
                        <span>متاح للحجز</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Selected Booked Patient Details when a yellow booked slot is clicked */}
            {selectedBookedSlot && (
              <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/40 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-yellow-400/20">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white text-sm">
                      بيانات المريض الحاجز في الساعة ({selectedBookedSlot.time})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBookedSlot(null)}
                    className="text-xs text-yellow-300 hover:text-white"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">اسم المريض:</span>
                    <strong className="text-white text-sm">{selectedBookedSlot.patientName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">رقم الهاتف:</span>
                    <strong className="text-cyan-300 font-mono text-sm" dir="ltr">
                      {selectedBookedSlot.patientPhone}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">الطبيب المعالج:</span>
                    <span className="text-slate-200 font-semibold">{selectedBookedSlot.doctorName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">الخدمة الطبية:</span>
                    <span className="text-cyan-300 font-semibold">{selectedBookedSlot.serviceName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">قيمة الكشف:</span>
                    <span className="text-amber-300 font-bold font-mono">
                      {selectedBookedSlot.lockedPrice} {db?.settings?.currency || 'ر.س'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">حالة الحجز:</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[10px]">
                      {selectedBookedSlot.status}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-yellow-400/20">
                  <button
                    onClick={() => {
                      setIsDayDetailsOpen(false);
                      setActiveTab('my_bookings');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    فتح شاشة حجوزاتي
                  </button>
                  {selectedBookedSlot.status !== 'تمت الزيارة' && (
                    <button
                      onClick={() => {
                        markBookingVisited(selectedBookedSlot.id);
                        setSelectedBookedSlot((prev) => (prev ? { ...prev, status: 'تمت الزيارة' } : null));
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                    >
                      تسجيل تمت الزيارة
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                إجمالي المواعيد المحجوزة في هذا اليوم: <strong className="text-yellow-400 font-mono">{bookingsOnSelectedDate.length}</strong>
              </span>
              <button
                onClick={() => setIsDayDetailsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Alerts & Notification Recommendations Stream */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>تنبيهات وتوصيات المواعيد الذكية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Array.isArray(db?.notifications) ? db.notifications : []).slice(0, 4).map((notif) => {
            const doctorObj = (Array.isArray(db?.doctors) ? db.doctors : []).find((d) => d?.id === notif?.doctorId);
            const patientObj = (Array.isArray(db?.patients) ? db.patients : []).find((p) => p?.id === notif?.patientId);

            return (
              <div
                key={notif.id}
                className="p-4 rounded-2xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/30 hover:border-cyan-400/40 transition-all flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-bold text-white text-xs">{notif.title}</h5>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 font-mono">
                      {notif.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">{notif.message}</p>
                  <div className="flex items-center gap-3 text-[10px] text-cyan-300 font-mono">
                    <span>📅 {notif.suggestedBookingDate}</span>
                    <span>⏰ {notif.timeSlot}</span>
                    {doctorObj && <span className="text-slate-300 font-sans">د. {doctorObj.name}</span>}
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigateToBookingWithSlot({
                      date: notif.suggestedBookingDate,
                      time: notif.timeSlot,
                      doctorId: notif.doctorId,
                      patientId: notif.patientId,
                      notes: `حجز بناءً على توصية: ${notif.title}`,
                    })
                  }
                  className="p-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 text-cyan-300 hover:text-white flex-shrink-0"
                  title="حجز سريع"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
