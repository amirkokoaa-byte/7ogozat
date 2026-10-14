import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus,
  Clock,
  User,
  Phone,
  Stethoscope,
  BriefcaseMedical,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export const BookAppointmentTab: React.FC = () => {
  const {
    db,
    addBooking,
    addPatient,
    prefilledBookingSlot,
    setPrefilledBookingSlot,
    setActiveTab,
  } = useClinic();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const doctorsList = Array.isArray(db?.doctors) ? db.doctors : [];
  const servicesList = Array.isArray(db?.services) ? db.services : [];
  const patientsList = Array.isArray(db?.patients) ? db.patients : [];
  const timeSlotsList = Array.isArray(db?.settings?.timeSlots) ? db.settings.timeSlots : [
    '09:00 ص',
    '10:00 ص',
    '11:00 ص',
    '12:00 م',
    '01:00 م',
    '02:00 م',
    '04:00 م',
    '05:00 م',
    '06:00 م',
    '07:00 م',
    '08:00 م',
    '09:00 م',
  ];

  // 1. بيانات المريض: اسم ورقم هاتف
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [selectedExistingPatientId, setSelectedExistingPatientId] = useState<string>('');

  // 2. الخدمة
  const [serviceId, setServiceId] = useState<string>(servicesList[0]?.id || '');

  // 3. الطبيب
  const [doctorId, setDoctorId] = useState<string>(doctorsList[0]?.id || '');

  // 4. التاريخ (يوم وشهر وسنة)
  const [date, setDate] = useState<string>(todayStr);

  // 5. الميعاد (الساعة)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00 ص');

  // Feedback states
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill if redirected from notifications
  useEffect(() => {
    if (prefilledBookingSlot) {
      if (prefilledBookingSlot.date) setDate(prefilledBookingSlot.date);
      if (prefilledBookingSlot.time) setSelectedTimeSlot(prefilledBookingSlot.time);
      if (prefilledBookingSlot.doctorId) setDoctorId(prefilledBookingSlot.doctorId);
      if (prefilledBookingSlot.patientId) {
        const found = patientsList.find(p => p.id === prefilledBookingSlot.patientId);
        if (found) {
          setSelectedExistingPatientId(found.id);
          setPatientName(found.fullName);
          setPatientPhone(found.phone);
        }
      }
    }
  }, [prefilledBookingSlot, patientsList]);

  // Handle choosing an existing patient from dropdown
  const handleSelectExistingPatient = (id: string) => {
    setSelectedExistingPatientId(id);
    if (id) {
      const p = patientsList.find(item => item.id === id);
      if (p) {
        setPatientName(p.fullName);
        setPatientPhone(p.phone);
      }
    } else {
      setPatientName('');
      setPatientPhone('');
    }
  };

  // Selected Service object & price
  const selectedService = useMemo(() => {
    return servicesList.find((s) => s.id === serviceId) || servicesList[0];
  }, [servicesList, serviceId]);

  // Selected Doctor object
  const selectedDoctor = useMemo(() => {
    return doctorsList.find((d) => d.id === doctorId) || doctorsList[0];
  }, [doctorsList, doctorId]);

  // CRITICAL REQUIREMENT:
  // Identify already booked slots for this doctor on this specific date
  // المواعيد المسجلة مسبقاً لعميل آخر مع نفس الطبيب وفي نفس التاريخ
  const bookedSlotsMap = useMemo(() => {
    const map = new Map<string, { patientName: string; bookingNumber: string }>();
    const allBookings = Array.isArray(db?.bookings) ? db.bookings : [];

    allBookings.forEach((b) => {
      if (b && b.doctorId === doctorId && b.date === date && b.status !== 'ملغي') {
        map.set(b.time, {
          patientName: b.patientName,
          bookingNumber: b.bookingNumber,
        });
      }
    });

    return map;
  }, [db?.bookings, doctorId, date]);

  // Formatted date string in Arabic with Day, Month, Year
  const formattedDateArabic = useMemo(() => {
    if (!date) return '-';
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  }, [date]);

  // Handle Form Submission / Confirm Booking
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!patientName.trim()) {
      setErrorMessage('يرجى إدخال اسم المريض.');
      return;
    }
    if (!patientPhone.trim()) {
      setErrorMessage('يرجى إدخال رقم هاتف المريض.');
      return;
    }
    if (!selectedService) {
      setErrorMessage('يرجى اختيار الخدمة الطبية.');
      return;
    }
    if (!selectedDoctor) {
      setErrorMessage('يرجى اختيار الطبيب المعالج.');
      return;
    }
    if (!date) {
      setErrorMessage('يرجى تحديد تاريخ الحجز.');
      return;
    }
    if (!selectedTimeSlot) {
      setErrorMessage('يرجى اختيار موعد الحجز.');
      return;
    }

    // Check if slot is already occupied
    if (bookedSlotsMap.has(selectedTimeSlot)) {
      const occupied = bookedSlotsMap.get(selectedTimeSlot);
      setErrorMessage(`عذراً، هذا الموعد (${selectedTimeSlot}) محجوز مسبقاً للمريض: ${occupied?.patientName}. يرجى اختيار موعد آخر.`);
      return;
    }

    // Ensure patient exists in patients database
    let resolvedPatientId = selectedExistingPatientId;
    const existingPatient = patientsList.find(
      p => p.phone === patientPhone.trim() || p.fullName.trim() === patientName.trim()
    );

    if (existingPatient) {
      resolvedPatientId = existingPatient.id;
    } else if (!resolvedPatientId) {
      // Auto register patient
      const newP = addPatient({
        fullName: patientName.trim(),
        phone: patientPhone.trim(),
        civilId: '29' + Math.floor(100000000000 + Math.random() * 900000000000),
        age: 35,
        gender: 'ذكر',
        bloodType: 'O+',
        chronicDiseases: [],
        allergies: [],
        medicalNotes: 'تم فتح الملف تلقائياً عند أول حجز موعد.',
        emergencyContact: { name: '', phone: '', relation: '' },
      });
      resolvedPatientId = newP.id;
    }

    // 1. يحفظ الحجز مع تثبيت سعر الخدمة الحالي (lockedPrice) داخل الحجز
    addBooking({
      patientId: resolvedPatientId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      lockedPrice: selectedService.price, // HISTORICAL SNAPSHOT
      date,
      time: selectedTimeSlot,
      status: 'قادم',
      paymentStatus: 'غير مدفوع',
      paidAmount: 0,
      remainingAmount: selectedService.price,
      notes: `حجز عيادة: ${selectedService.name}`,
    });

    // 2. يظهر رسالة واضحة "تم تأكيد الحجز"
    setShowSuccessToast(true);

    // 3. يتم مسح وتفريغ البيانات من الشاشة فوراً لتسجيل مريض آخر
    setPatientName('');
    setPatientPhone('');
    setSelectedExistingPatientId('');
    setSelectedTimeSlot('09:00 ص');
    setPrefilledBookingSlot(null);

    // 4. إشعار ورابط سريع أو انتقال إلى "حجوزاتي"
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">القسم الثاني: حجز موعد طبي</h2>
            <p className="text-xs text-blue-200/80">
              اختر الطبيب والتاريخ والموعد مع منع تضارب المواعيد وتثبيت سعر الخدمة لحظة الحجز.
            </p>
          </div>
        </div>

        {/* Shortcut to view My Bookings */}
        <button
          onClick={() => setActiveTab('my_bookings')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-blue-500/30 text-xs font-bold transition-all"
        >
          <span>الانتقال إلى حجوزاتي</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-sm font-bold flex items-center justify-between shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span>تم تأكيد الحجز بنجاح وتم تفريغ النموذج لتسجيل حجز جديد!</span>
          </div>
          <button
            onClick={() => setActiveTab('my_bookings')}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
          >
            عرض الحجز في "حجوزاتي"
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN LAYOUT:
          يقسم إلى جزءين: نموذج الحجز (يمين) + شاشة جانبية على اليسار بعنوان "ملخص الحجز"
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right Part (يمين): نموذج الحجز */}
        <div className="lg:col-span-8 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] p-6 space-y-6">
          
          <form onSubmit={handleConfirmBooking} id="bookingForm" className="space-y-6">
            
            {/* 1. بيانات المريض: اسم المريض ورقم الهاتف */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>1. بيانات المريض</span>
                </span>
                
                {/* Quick picker from registered patients */}
                {patientsList.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>أو اختر مريض مسجل:</span>
                    <select
                      value={selectedExistingPatientId}
                      onChange={(e) => handleSelectExistingPatient(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- مريض جديد --</option>
                      {patientsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    اسم المريض الكامل *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      setSelectedExistingPatientId('');
                    }}
                    required
                    placeholder="مثال: عبد الله أحمد المنصور"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      required
                      placeholder="010XXXXXXXX"
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <Phone className="w-4 h-4 text-blue-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. الخدمة + مربع يعرض "قيمة الخدمة" لحظياً بجانبها */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 space-y-2">
              <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <BriefcaseMedical className="w-4 h-4 text-cyan-400" />
                <span>2. الخدمة الطبية المطلوبة *</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* القائمة المنسدلة: بداخل نفس الخيار يظهر اسم الخدمة وقيمتها (السعر) */}
                <div className="flex-1">
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    {servicesList.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({srv.price} {db.settings.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* مربع يعرض "قيمة الخدمة" لحظياً بمجرد اختيارها */}
                <div className="flex items-center justify-between sm:justify-center gap-2 px-4 py-2 rounded-xl bg-blue-950/70 border border-cyan-500/40 text-cyan-300 shadow-sm min-w-[170px]">
                  <span className="text-xs text-slate-400">قيمة الخدمة:</span>
                  <span className="text-sm font-black text-white font-mono">
                    {selectedService ? `${selectedService.price} ${db.settings.currency}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. الطبيب: قائمة منسدلة بأسماء الدكاترة المسجلين في الإعدادات */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 space-y-2">
              <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <span>3. الطبيب المعالج *</span>
              </label>

              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              >
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. التاريخ: خانة تاريخ تحتوي على نتيجة تقويم (يوم وشهر وسنة) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>4. تاريخ الحجز (يوم وشهر وسنة) *</span>
                </label>
                <span className="text-xs text-slate-300 font-bold">
                  {formattedDateArabic}
                </span>
              </div>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* 5. المواعيد (بعرض الشاشة أسفل التاريخ):
                أزرار عريضة للمواعيد تبدأ من 9 صباحاً...
                قاعدة الألوان الإلزامية:
                - محجوزة مسبقاً لنفس الطبيب في نفس التاريخ: bg-yellow-400 text-slate-950 font-bold
                - فارغة: bg-white text-slate-900
            */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>5. اختيار موعد وفترة الزيارة (Time Slots) *</span>
                </label>

                {/* Color Legend explanation */}
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block" />
                    <span className="text-slate-300">موعد متاح (فارغ)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-yellow-400 border border-yellow-500 inline-block" />
                    <span className="text-yellow-300 font-bold">محجوز مسبقاً (مغلق)</span>
                  </div>
                </div>
              </div>

              {/* Grid of Wide Time Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {timeSlotsList.map((slot) => {
                  const isBooked = bookedSlotsMap.has(slot);
                  const bookedInfo = bookedSlotsMap.get(slot);
                  const isSelected = selectedTimeSlot === slot;

                  if (isBooked) {
                    // قاعدة اللون الإلزامي: المواعيد المسجلة مسبقاً تظهر باللون الأصفر
                    return (
                      <div
                        key={slot}
                        title={`هذا الموعد محجوز مسبقاً للمريض: ${bookedInfo?.patientName}`}
                        className="py-3 px-3 rounded-xl bg-yellow-400 text-slate-950 font-bold border border-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.45)] text-center cursor-not-allowed select-none flex flex-col items-center justify-center relative overflow-hidden"
                      >
                        <span className="font-mono text-xs">{slot}</span>
                        <span className="text-[10px] mt-0.5 bg-slate-950/15 px-1.5 py-0.2 rounded font-extrabold">
                          محجوز ({bookedInfo?.patientName?.split(' ')[0] || 'عميل'})
                        </span>
                      </div>
                    );
                  }

                  // المواعيد الفارغة تظل باللون الأبيض
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedTimeSlot(slot);
                        setErrorMessage(null);
                      }}
                      className={`py-3 px-3 rounded-xl font-mono text-xs font-bold transition-all duration-200 text-center flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-white text-slate-950 ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[1.02]'
                          : 'bg-white text-slate-900 hover:bg-slate-100 hover:shadow-md'
                      }`}
                    >
                      <span>{slot}</span>
                      <span className="text-[10px] text-emerald-700 font-normal">
                        {isSelected ? '✓ الموعد المختار' : 'متاح للحجز'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </form>

        </div>

        {/* Left Part (يسار): شاشة جانبية بعنوان "ملخص الحجز" (Booking Summary) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-4 rounded-3xl backdrop-blur-2xl bg-slate-900/85 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] p-6 space-y-5">
            
            {/* Summary Title */}
            <div className="pb-3 border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">ملخص الحجز</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                Live Preview
              </span>
            </div>

            {/* Summary Details Fields */}
            <div className="space-y-3.5 text-xs">
              
              {/* الخدمة */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">الخدمة:</span>
                <strong className="text-sm text-cyan-200 block">
                  {selectedService?.name || 'لم يتم اختيار خدمة'}
                </strong>
                <span className="text-[10px] text-slate-500">
                  {selectedService?.category} • {selectedService?.durationMinutes} دقيقة
                </span>
              </div>

              {/* الطبيب */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">الطبيب:</span>
                <strong className="text-sm text-white block">
                  {selectedDoctor?.name || 'لم يتم اختيار طبيب'}
                </strong>
                <span className="text-[10px] text-blue-300">
                  {selectedDoctor?.specialty}
                </span>
              </div>

              {/* اسم المريض */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">اسم المريض:</span>
                <strong className="text-sm text-white block">
                  {patientName.trim() || '---'}
                </strong>
                {patientPhone.trim() && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    {patientPhone.trim()}
                  </span>
                )}
              </div>

              {/* ميعاد الحجز (يوم وتاريخ وسنة) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">ميعاد الحجز (يوم وتاريخ وسنة):</span>
                <strong className="text-xs text-white block">
                  {formattedDateArabic}
                </strong>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  ({date})
                </span>
              </div>

              {/* وقت زيارة المريض (الساعة) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">وقت زيارة المريض (الساعة):</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <strong className="text-base text-cyan-300 font-mono font-black">
                    {selectedTimeSlot}
                  </strong>
                </div>
              </div>

              {/* في الأسفل: السعر */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-950/90 border border-cyan-500/50 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>السعر المثبت للحجز (Snapshot):</span>
                </div>
                <div className="text-3xl font-black text-cyan-300 font-mono">
                  {selectedService ? `${selectedService.price} ${db.settings.currency}` : '0'}
                </div>
                <p className="text-[10px] text-slate-400">
                  لا يتأثر هذا السعر بأي تعديلات مستقبلية في التعرفة
                </p>
              </div>

            </div>

            {/* زر "تأكيد الحجز" */}
            <div className="pt-2">
              <button
                type="submit"
                form="bookingForm"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد الحجز</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
