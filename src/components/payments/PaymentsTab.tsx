import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  CreditCard,
  PlusCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  History,
  TrendingUp,
  Wallet,
  ArrowRight,
  Calculator,
  ChevronDown,
  X,
  FileText,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Booking, PaymentRecord } from '../../types/clinic';
import { excelService } from '../../services/excelService';

export const PaymentsTab: React.FC = () => {
  const { db, addPaymentRecord, setActiveTab } = useClinic();

  const todayDate = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayDate.toISOString().split('T')[0], [todayDate]);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const currentYearStr = useMemo(() => todayStr.slice(0, 4), [todayStr]);

  // Safe data arrays
  const paymentsList: PaymentRecord[] = Array.isArray(db?.payments) ? db.payments : [];
  const bookingsList: Booking[] = Array.isArray(db?.bookings) ? db.bookings : [];
  const patientsList = Array.isArray(db?.patients) ? db.patients : [];

  // 1. Right Column: إيراد اليوم (Today's Revenue) live updated
  const todayPayments = useMemo(() => {
    return paymentsList.filter((p) => p && p.date === todayStr);
  }, [paymentsList, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [todayPayments]);

  const todayCashRevenue = useMemo(() => {
    return todayPayments
      .filter((p) => p.paymentMethod === 'نقدي')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [todayPayments]);

  const todayCardRevenue = useMemo(() => {
    return todayPayments
      .filter((p) => p.paymentMethod !== 'نقدي')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [todayPayments]);

  // 2. Middle Column: شاشة تحصيل العميل (Cashier Desk)
  const [cashierSearchQuery, setCashierSearchQuery] = useState('');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  // Cashier Calculator inputs
  const [tenderedAmountInput, setTenderedAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'نقدي' | 'بطاقة ائتمان' | 'تحويل بنكي' | 'تأمين طبي'>('نقدي');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Modals & Feedback
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{ receiptNumber: string; patientName: string; amount: number } | null>(null);
  const [isPatientHistoryModalOpen, setIsPatientHistoryModalOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentRecord | null>(null);
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);

  // 3. Left Column: شاشة المدفوعات (Payments Ledger & Filters)
  const [ledgerPeriodFilter, setLedgerPeriodFilter] = useState<'today' | 'month' | 'year' | 'custom'>('today');
  const [customLedgerDate, setCustomLedgerDate] = useState<string>('');

  // Search results for finding bookings to pay
  const matchingBookings = useMemo(() => {
    if (!cashierSearchQuery.trim()) return [];
    const q = cashierSearchQuery.trim().toLowerCase();
    return bookingsList.filter((b) => {
      if (!b) return false;
      return (
        (b.patientName && b.patientName.toLowerCase().includes(q)) ||
        (b.patientPhone && b.patientPhone.includes(q)) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q))
      );
    });
  }, [bookingsList, cashierSearchQuery]);

  // When patient booking is chosen
  const handleSelectBooking = (b: Booking) => {
    setSelectedBookingForPayment(b);
    setTenderedAmountInput(b.lockedPrice ? String(b.lockedPrice) : '0');
    setCashierSearchQuery(b.patientName);
  };

  // Reception Calculator Calculations
  const serviceFee = selectedBookingForPayment ? selectedBookingForPayment.lockedPrice : 0;
  const numericTendered = parseFloat(tenderedAmountInput) || 0;
  const changeReturned = numericTendered >= serviceFee ? numericTendered - serviceFee : 0;
  const remainingDue = numericTendered < serviceFee ? serviceFee - numericTendered : 0;

  // Helper for current Arabic 12-hour time
  const getCurrentFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${period}`;
  };

  // "تم الدفع" action
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    if (numericTendered <= 0) {
      alert('يرجى كتابة المبلغ المدفوع من العميل أولاً.');
      return;
    }

    const actualCollected = Math.min(numericTendered, serviceFee);

    const savedRecord = addPaymentRecord({
      bookingId: selectedBookingForPayment.id,
      patientId: selectedBookingForPayment.patientId,
      patientName: selectedBookingForPayment.patientName,
      patientPhone: selectedBookingForPayment.patientPhone,
      doctorId: selectedBookingForPayment.doctorId,
      doctorName: selectedBookingForPayment.doctorName,
      serviceId: selectedBookingForPayment.serviceId,
      serviceName: selectedBookingForPayment.serviceName,
      date: todayStr,
      time: getCurrentFormattedTime(),
      serviceFee,
      tenderedAmount: numericTendered,
      changeReturned,
      amount: actualCollected > 0 ? actualCollected : serviceFee,
      paymentMethod,
      notes: paymentNotes.trim() || `سداد رسوم كشف (${selectedBookingForPayment.serviceName})`,
    });

    // Show instant success notification
    setPaymentSuccessToast({
      receiptNumber: savedRecord.receiptNumber,
      patientName: selectedBookingForPayment.patientName,
      amount: savedRecord.amount,
    });

    // Reset cashier form for the next customer
    setSelectedBookingForPayment(null);
    setCashierSearchQuery('');
    setTenderedAmountInput('');
    setPaymentNotes('');

    setTimeout(() => {
      setPaymentSuccessToast(null);
    }, 4500);
  };

  // Filtered payments for Left Ledger screen
  const filteredLedgerPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      if (!p) return false;

      if (ledgerPeriodFilter === 'today') {
        return p.date === todayStr;
      }
      if (ledgerPeriodFilter === 'month') {
        return p.date.startsWith(currentMonthStr);
      }
      if (ledgerPeriodFilter === 'year') {
        return p.date.startsWith(currentYearStr);
      }
      if (ledgerPeriodFilter === 'custom' && customLedgerDate) {
        return p.date === customLedgerDate;
      }

      return true;
    });
  }, [paymentsList, ledgerPeriodFilter, customLedgerDate, todayStr, currentMonthStr, currentYearStr]);

  const totalLedgerSum = useMemo(() => {
    return filteredLedgerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [filteredLedgerPayments]);

  // Selected Patient's past payments
  const patientPastPayments = useMemo(() => {
    if (!selectedBookingForPayment) return [];
    return paymentsList.filter(
      (p) =>
        p &&
        (p.patientId === selectedBookingForPayment.patientId ||
          p.patientName === selectedBookingForPayment.patientName ||
          p.patientPhone === selectedBookingForPayment.patientPhone)
    );
  }, [paymentsList, selectedBookingForPayment]);

  const patientTotalPaidHistory = useMemo(() => {
    return patientPastPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [patientPastPayments]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const periodTitle =
      ledgerPeriodFilter === 'today'
        ? `مدفوعات_اليوم_${todayStr}`
        : ledgerPeriodFilter === 'month'
        ? `مدفوعات_شهر_${currentMonthStr}`
        : ledgerPeriodFilter === 'year'
        ? `مدفوعات_سنة_${currentYearStr}`
        : `مدفوعات_تاريخ_${customLedgerDate || todayStr}`;

    excelService.exportPaymentsToExcel(filteredLedgerPayments, periodTitle);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">القسم الخامس: المدفوعات والخزينة (Payments & Cashier)</h2>
            <p className="text-xs text-blue-200/80">
              إيراد اليوم اللحظي، حاسبة الاستقبال الميسرة ورد الباقي، وسجل المقبوضات مع التصدير إلى PDF و Excel.
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700/80 hover:bg-blue-600 border border-blue-500/40 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-200" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {paymentSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-sm font-bold flex items-center justify-between shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <span>تم تسجيل سداد المريض <strong>{paymentSuccessToast.patientName}</strong> بمبلغ <strong>{paymentSuccessToast.amount} {db.settings.currency}</strong> بنجاح!</span>
              <span className="block text-xs text-emerald-400 font-mono mt-0.5">سند رقم: {paymentSuccessToast.receiptNumber} • تم تحديث إيراد اليوم تلقائياً</span>
            </div>
          </div>
        </div>
      )}

      {/* 3-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN (على اليمين): بطاقة تعرض "إيراد اليوم" وتكون محدثة لحظياً */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl backdrop-blur-xl bg-gradient-to-b from-slate-900/90 to-emerald-950/40 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)] p-5 space-y-5 sticky top-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">إيراد اليوم اللحظي</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                Live
              </span>
            </div>

            {/* Total Today Display */}
            <div className="text-center p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
              <span className="text-xs text-slate-400 block">إجمالي المقبوضات اليوم:</span>
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {todayRevenue.toLocaleString()}
              </div>
              <span className="text-xs text-slate-300 font-bold">{db.settings.currency}</span>
              <div className="text-[11px] text-emerald-300/80 pt-1 font-mono">
                {todayPayments.length} عملية سداد اليوم
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>نقدي (خزينة):</span>
                </div>
                <strong className="text-white font-mono">{todayCashRevenue.toLocaleString()} {db.settings.currency}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>إلكتروني / بطاقات:</span>
                </div>
                <strong className="text-white font-mono">{todayCardRevenue.toLocaleString()} {db.settings.currency}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-slate-300 leading-relaxed">
              💡 يتحدث إيراد اليوم تلقائياً وبشكل فوري بمجرد الضغط على زر <strong>"تم الدفع"</strong> لأي مريض.
            </div>

          </div>
        </div>

        {/* MIDDLE COLUMN (في الوسط): شاشة تحصيل العميل وحاسبة الاستقبال */}
        <div className="lg:col-span-5 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] p-6 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">شاشة تحصيل العميل</h3>
            </div>
            <span className="text-xs text-blue-300 font-semibold">حاسبة الاستقبال الميسرة</span>
          </div>

          {/* 1. زر/خانة بحث باسم المريض أو رقم الهاتف */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>بحث باسم المريض أو رقم الهاتف لتسديد الكشف:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={cashierSearchQuery}
                onChange={(e) => setCashierSearchQuery(e.target.value)}
                placeholder="اكتب اسم المريض أو رقم الهاتف..."
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-4 h-4 text-blue-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Quick dropdown results if typing and no booking selected */}
            {matchingBookings.length > 0 && !selectedBookingForPayment && (
              <div className="rounded-xl border border-blue-500/30 bg-slate-950 shadow-xl divide-y divide-slate-800 max-h-48 overflow-y-auto z-20">
                {matchingBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBooking(b)}
                    className="w-full p-2.5 text-right hover:bg-blue-600/20 text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <strong className="text-white block">{b.patientName}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{b.patientPhone} • {b.doctorName}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-cyan-300 font-bold block">{b.lockedPrice} {db.settings.currency}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${b.paymentStatus === 'مدفوع بالكامل' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-300'}`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. عند ظهور اسم العميل: تظهر بيانات الحجز: (الاسم، الدكتور، ميعاد الزيارة يوم وتاريخ، والقيمة) */}
          {selectedBookingForPayment ? (
            <div className="space-y-4 animate-in fade-in">
              
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-cyan-300">بيانات الحجز المطلوب تحصيله:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForPayment(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    إلغاء التحديد
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">اسم المريض:</span>
                    <strong className="text-white text-sm block">{selectedBookingForPayment.patientName}</strong>
                    <span className="text-cyan-300 font-mono text-[11px]">{selectedBookingForPayment.patientPhone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">الدكتور المعالج:</span>
                    <strong className="text-white text-sm block">{selectedBookingForPayment.doctorName}</strong>
                    <span className="text-blue-300 text-[11px]">{selectedBookingForPayment.serviceName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">ميعاد الزيارة (يوم وتاريخ):</span>
                    <strong className="text-white font-mono block">{selectedBookingForPayment.date}</strong>
                    <span className="text-amber-300 font-mono text-[11px]">{selectedBookingForPayment.time}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-blue-950/70 border border-cyan-500/30 text-center">
                    <span className="text-slate-400 block text-[10px]">قيمة الكشف (المثبتة):</span>
                    <strong className="text-cyan-300 font-mono font-black text-base">
                      {selectedBookingForPayment.lockedPrice} {db.settings.currency}
                    </strong>
                  </div>
                </div>

                {/* زر "المدفوعات السابقة" في نفس شاشة العميل */}
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPatientHistoryModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <History className="w-4 h-4 text-cyan-400" />
                    <span>المدفوعات السابقة للمريض</span>
                  </button>
                </div>
              </div>

              {/* 3. حاسبة الاستقبال الميسرة:
                  شاشة صغيرة يكتب فيها الموظف "العميل دفع كام" ويظهر تلقائياً "المتبقي له" بعد خصم قيمة الكشف
                  وبجانبها زر "تم الدفع"
              */}
              <form onSubmit={handleConfirmPayment} className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-4">
                <span className="text-xs font-bold text-white block">حاسبة السداد ورد الباقي:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* شاشة صغيرة: العميل دفع كام */}
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      العميل دفع كام؟ (المبلغ المستلم) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={tenderedAmountInput}
                        onChange={(e) => setTenderedAmountInput(e.target.value)}
                        required
                        placeholder="مثال: 500"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-white font-mono text-base font-black focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
                      />
                      <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold">{db.settings.currency}</span>
                    </div>
                  </div>

                  {/* يظهر تلقائياً "المتبقي له" (الباقي) */}
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1">
                      المتبقي له (الباقي المسترد للمريض):
                    </label>
                    <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-center">
                      <div className="font-mono text-base font-black text-cyan-300">
                        {changeReturned.toLocaleString()} {db.settings.currency}
                      </div>
                      {remainingDue > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold mt-0.5">
                          متبقي عليه: {remainingDue} {db.settings.currency}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* طريقة الدفع وملاحظات */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">طريقة السداد:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white"
                    >
                      <option value="نقدي">نقدي (كاش)</option>
                      <option value="بطاقة ائتمان">بطاقة ائتمان / مدى</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="تأمين طبي">تأمين طبي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">ملاحظات التحصيل:</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="سداد كشف واستشارة..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* زر "تم الدفع" */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم الدفع (حفظ العملية وتحديث الإيراد)</span>
                </button>

              </form>

            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p>ابحث عن اسم المريض أو رقم الهاتف بالأعلى لتحميل بيانات الكشف وسدادها.</p>
              <p className="text-[11px] text-blue-300/70">
                يمكنك أيضاً النقر على أي حجز من قائمة الحجوزات السريعة أدناه:
              </p>

              {/* Quick Today's Unpaid Bookings */}
              <div className="pt-3 space-y-1.5 text-right">
                {bookingsList
                  .filter((b) => b.paymentStatus !== 'مدفوع بالكامل')
                  .slice(0, 4)
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBooking(b)}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-600/20 border border-blue-500/20 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <strong className="text-white block text-xs">{b.patientName}</strong>
                        <span className="text-[10px] text-slate-400">{b.doctorName} • {b.time}</span>
                      </div>
                      <span className="font-mono text-cyan-300 font-bold text-xs">
                        {b.lockedPrice} {db.settings.currency}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>

        {/* LEFT COLUMN (على اليسار): زر وشاشة "المدفوعات" مع تحديد إجمالي (اليوم | الشهر | السنة | يوم معين) */}
        <div className="lg:col-span-4 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] p-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            
            {/* Title */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-500/30">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">قائمة المدفوعات المسجلة</h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
                {filteredLedgerPayments.length} سند
              </span>
            </div>

            {/* Filter Buttons: تحديد إجمالي (اليوم | الشهر | السنة | أو تحديد يوم معين لمعرفة مدفوعاته) */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950 border border-blue-500/30 text-xs">
                <button
                  type="button"
                  onClick={() => setLedgerPeriodFilter('today')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    ledgerPeriodFilter === 'today'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerPeriodFilter('month')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    ledgerPeriodFilter === 'month'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الشهر
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerPeriodFilter('year')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    ledgerPeriodFilter === 'year'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  السنة
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerPeriodFilter('custom')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    ledgerPeriodFilter === 'custom'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  يوم معين
                </button>
              </div>

              {/* If "يوم معين" is selected */}
              {ledgerPeriodFilter === 'custom' && (
                <div className="animate-in fade-in">
                  <input
                    type="date"
                    value={customLedgerDate}
                    onChange={(e) => setCustomLedgerDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Payments List Stream */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto divide-y divide-slate-800 pr-1">
              {filteredLedgerPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  لا توجد مدفوعات مسجلة لهذه الفترة.
                </div>
              ) : (
                filteredLedgerPayments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActiveReceiptModal(p)}
                    title="انقر لعرض تفاصيل السند والباقي"
                    className="pt-2 pb-2 px-2.5 rounded-xl hover:bg-blue-600/20 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white text-xs group-hover:text-cyan-300 transition-colors">
                          {p.patientName}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">({p.receiptNumber})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.date} • {p.time || '10:00 ص'} • <span className="text-cyan-300">{p.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <strong className="text-emerald-400 text-sm font-black block">
                        {p.amount.toLocaleString()} {db.settings.currency}
                      </strong>
                      {p.changeReturned > 0 && (
                        <span className="text-[10px] text-amber-400 block font-bold">
                          باقي: {p.changeReturned}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* وفي الأسفل: القيمة الإجمالية */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-950 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block font-bold">القيمة الإجمالية:</span>
                <span className="text-[10px] text-slate-400">
                  {ledgerPeriodFilter === 'today'
                    ? 'إجمالي اليوم'
                    : ledgerPeriodFilter === 'month'
                    ? 'إجمالي الشهر الحالي'
                    : ledgerPeriodFilter === 'year'
                    ? 'إجمالي السنة الحالية'
                    : `إجمالي يوم (${customLedgerDate || '-'})`}
                </span>
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {totalLedgerSum.toLocaleString()} {db.settings.currency}
              </div>
            </div>

            {/* Action buttons inside ledger */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleExportExcel}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>إكسيل Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintReportModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-blue-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة PDF</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* POPUP 1: شاشة "المدفوعات السابقة للمريض"
          عند الضغط عليه يظهر عدد الزيارات، ومدفوعات كل زيارة، وإجمالي ما دفعه المريض في كل مرة
      */}
      {isPatientHistoryModalOpen && selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    سجل مدفوعات المريض: {selectedBookingForPayment.patientName}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedBookingForPayment.patientPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPatientHistoryModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats: عدد الزيارات وإجمالي ما دفعه */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-blue-500/30 text-center">
                <span className="text-slate-400 block text-[11px]">عدد الزيارات والمدفوعات:</span>
                <strong className="text-lg text-white font-mono font-black">{patientPastPayments.length}</strong>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center">
                <span className="text-slate-400 block text-[11px]">إجمالي ما دفعه المريض:</span>
                <strong className="text-lg text-emerald-400 font-mono font-black">
                  {patientTotalPaidHistory.toLocaleString()} {db.settings.currency}
                </strong>
              </div>
            </div>

            {/* List of each visit payment */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {patientPastPayments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  لا توجد مدفوعات سابقة مسجلة لهذا المريض.
                </div>
              ) : (
                patientPastPayments.map((p, idx) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">الزيارة رقم {patientPastPayments.length - idx}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({p.receiptNumber})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.date} • {p.time || '-'} • {p.paymentMethod}
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <strong className="text-emerald-400 text-sm font-bold block">
                        {p.amount} {db.settings.currency}
                      </strong>
                      <span className="text-[10px] text-slate-400">{p.notes || 'سداد كشف'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPatientHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP 2: تفاصيل السند الكاملة
          عند الضغط على مدفوعات معينة لأي مريض، تظهر تفاصيلها الكاملة حتى في حالة دفع العميل مبلغاً أعلى وظهور الباقي له
      */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">سند قبض وتفاصيل التحصيل</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-cyan-300 font-mono font-bold">{activeReceiptModal.receiptNumber}</span>
                <span className="text-slate-400 font-mono">{activeReceiptModal.date} {activeReceiptModal.time}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-400 block text-[10px]">اسم المريض:</span>
                  <strong className="text-white text-sm">{activeReceiptModal.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الهاتف:</span>
                  <strong className="text-cyan-200 font-mono">{activeReceiptModal.patientPhone || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الدكتور / الخدمة:</span>
                  <strong className="text-slate-200">{activeReceiptModal.doctorName || 'العيادة'} - {activeReceiptModal.serviceName || 'كشف'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">طريقة السداد:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/40 text-cyan-300 font-semibold inline-block">
                    {activeReceiptModal.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Exact Breakdown: قيمة الكشف، العميل دفع كام، والباقي المسترد */}
              <div className="p-3 rounded-xl bg-blue-950/50 border border-cyan-500/30 space-y-2 mt-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span>قيمة الكشف المطلوبة:</span>
                  <strong className="font-mono text-white">
                    {(activeReceiptModal.serviceFee ?? activeReceiptModal.amount)} {db.settings.currency}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-amber-300 font-bold">
                  <span>المبلغ المدفوع من العميل:</span>
                  <strong className="font-mono text-amber-400 text-sm">
                    {(activeReceiptModal.tenderedAmount ?? activeReceiptModal.amount)} {db.settings.currency}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-cyan-300 font-bold pt-1 border-t border-cyan-500/20">
                  <span>المتبقي له (الباقي المسترد للمريض):</span>
                  <strong className="font-mono text-cyan-400 text-sm">
                    {(activeReceiptModal.changeReturned ?? 0)} {db.settings.currency}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-emerald-400 font-black text-sm pt-2 border-t border-emerald-500/30">
                  <span>صافي المبلغ المحصل في الخزينة:</span>
                  <strong className="font-mono text-base">
                    {activeReceiptModal.amount} {db.settings.currency}
                  </strong>
                </div>
              </div>

              {activeReceiptModal.notes && (
                <div className="text-[11px] text-slate-400">
                  <strong>ملاحظات:</strong> {activeReceiptModal.notes}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP 3: تقرير المدفوعات للطباعة والتصدير PDF */}
      {isPrintReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-white text-slate-950 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">تقرير المقبوضات والمدفوعات المالية</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة التقرير</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintReportModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Sheet */}
            <div className="border border-slate-300 rounded-xl p-5 space-y-4 font-sans text-xs" dir="rtl">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{db.settings.clinicName}</h2>
                  <p className="text-slate-600">كشف حركة المقبوضات والخزينة</p>
                  <p className="text-slate-500 font-mono">{db.settings.phone}</p>
                </div>
                <div className="text-left font-mono">
                  <div>تاريخ الطباعة: {todayStr}</div>
                  <div>عدد السندات: {filteredLedgerPayments.length}</div>
                </div>
              </div>

              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold">
                    <th className="p-2 text-center">م</th>
                    <th className="p-2">رقم السند</th>
                    <th className="p-2">اسم المريض</th>
                    <th className="p-2 text-center">التاريخ والوقت</th>
                    <th className="p-2 text-center">قيمة الكشف</th>
                    <th className="p-2 text-center">المبلغ المدفوع</th>
                    <th className="p-2 text-center">الباقي</th>
                    <th className="p-2 text-center">المحصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLedgerPayments.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="p-2 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold">{p.receiptNumber}</td>
                      <td className="p-2 font-bold">{p.patientName}</td>
                      <td className="p-2 text-center font-mono">{p.date} {p.time}</td>
                      <td className="p-2 text-center font-mono">{p.serviceFee ?? p.amount}</td>
                      <td className="p-2 text-center font-mono">{p.tenderedAmount ?? p.amount}</td>
                      <td className="p-2 text-center font-mono">{p.changeReturned ?? 0}</td>
                      <td className="p-2 text-center font-mono font-black">{p.amount} {db.settings.currency}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-black bg-slate-100 text-sm">
                    <td colSpan={7} className="p-2.5 text-left font-bold">إجمالي المبلغ المحصل:</td>
                    <td className="p-2.5 text-center font-mono text-base">{totalLedgerSum.toLocaleString()} {db.settings.currency}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="pt-4 border-t border-slate-300 text-center text-slate-500 text-[10px]">
                تم استخراج هذا التقرير آلياً من نظام إدارة العيادات الطبية ClinicCare Pro
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
