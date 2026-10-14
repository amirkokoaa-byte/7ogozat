import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  FileSpreadsheet,
  Printer,
  CalendarPlus,
  FolderOpen,
  PlusCircle,
  Phone,
  User,
  Stethoscope,
  Clock,
  Sparkles,
  Download,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { excelService } from '../../services/excelService';
import { pdfService } from '../../services/pdfService';
import { Patient } from '../../types/clinic';

export const ClientsTab: React.FC = () => {
  const { db, addPatient, setActiveTab, navigateToBookingWithSlot } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Client Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [civilId, setCivilId] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Extract clients automatically from bookings & patients
  const extractedClients = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        service: string;
        doctor: string;
        lastVisit: string;
        totalVisits: number;
        totalSpent: number;
        status: string;
        patientId?: string;
      }
    >();

    // 1. Gather all bookings sorted chronologically
    const allBookings = Array.isArray(db?.bookings) ? db.bookings : [];
    const sorted = [...allBookings].sort(
      (a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    );

    sorted.forEach((b) => {
      const key = (b.patientPhone || b.patientName).trim().toLowerCase();
      if (!key) return;

      const existing = map.get(key);
      const visits = (existing?.totalVisits || 0) + (b.status === 'تمت الزيارة' ? 1 : 0);
      const spent =
        (existing?.totalSpent || 0) +
        (b.paidAmount > 0
          ? b.paidAmount
          : b.paymentStatus === 'مدفوع بالكامل'
          ? b.lockedPrice
          : 0);

      map.set(key, {
        id: b.id,
        name: b.patientName,
        phone: b.patientPhone,
        service: b.serviceName,
        doctor: b.doctorName,
        lastVisit: `${b.date} - ${b.time}`,
        totalVisits: visits > 0 ? visits : 1,
        totalSpent: spent,
        status: b.status,
        patientId: b.patientId,
      });
    });

    // 2. Complement with registered patients not yet booked
    const allPatients = Array.isArray(db?.patients) ? db.patients : [];
    allPatients.forEach((p) => {
      const key = (p.phone || p.fullName).trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, {
          id: p.id,
          name: p.fullName,
          phone: p.phone,
          service: 'كشف واستشارة طبية',
          doctor: db?.settings?.doctorName || 'طبيب العيادة',
          lastVisit: p.lastVisitDate ? `${p.lastVisitDate}` : 'لا يوجد زيارات سابقة',
          totalVisits: 0,
          totalSpent: 0,
          status: 'مسجل بالنظام',
          patientId: p.id,
        });
      }
    });

    return Array.from(map.values());
  }, [db?.bookings, db?.patients, db?.settings]);

  // Filter clients by search query (name or phone)
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return extractedClients;
    const query = searchQuery.trim().toLowerCase();
    return extractedClients.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        (c.service && c.service.toLowerCase().includes(query)) ||
        (c.doctor && c.doctor.toLowerCase().includes(query))
    );
  }, [extractedClients, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    excelService.exportClientsListToExcel(
      filteredClients.map((c) => ({
        name: c.name,
        phone: c.phone,
        service: c.service,
        doctor: c.doctor,
        lastVisit: c.lastVisit,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
      })),
      db?.settings?.clinicName || 'عيادة_النخبة'
    );
  };

  // Export to PDF / Print
  const handleExportPDF = () => {
    pdfService.printClientsReport(
      db?.settings?.clinicName || 'عيادة النخبة التخصصية',
      filteredClients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        service: c.service,
        doctor: c.doctor,
        lastVisit: c.lastVisit,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
      })),
      db?.settings?.doctorName,
      db?.settings?.phone
    );
  };

  // Handle Quick Add
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    addPatient({
      fullName: fullName.trim(),
      civilId: civilId.trim() || '1000000000',
      phone: phone.trim(),
      age: Number(age) || 30,
      gender,
      bloodType: 'O+',
      chronicDiseases: [],
      allergies: [],
      medicalNotes,
      emergencyContact: { name: '', phone: '', relation: '' },
    });

    setFullName('');
    setPhone('');
    setCivilId('');
    setMedicalNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">بيانات وسجلات العملاء</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
                {extractedClients.length} عميل
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              مستخرجة تلقائياً من الحجوزات والزيارات المسجلة مع إمكانية التصدير الاحترافي لـ Excel و PDF.
            </p>
          </div>
        </div>

        {/* Top Actions: Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all active:scale-95"
            title="تصدير جدول العملاء بصيغة ملف Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          {/* PDF Export / Print */}
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            title="تصدير تقرير مهندم متعدد الصفحات مع الترويسة المتكررة وحفظ كـ PDF"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير PDF / طباعة مهندمة</span>
          </button>

          {/* Add New Client */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>إضافة عميل</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، رقم الهاتف، اسم الخدمة، أو اسم الدكتور..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950/80 border border-blue-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-medium transition-all"
          />
          <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-blue-500/30 bg-slate-950/90 text-slate-300 font-bold">
                <th className="p-4 text-center w-12">م</th>
                <th className="p-4">الاسم (اسم العميل)</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">الخدمة</th>
                <th className="p-4">الدكتور</th>
                <th className="p-4 text-center">ميعاد آخر زيارة</th>
                <th className="p-4 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-blue-300 mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-white text-sm">لم يتم العثور على عملاء</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? 'لا توجد نتائج مطابقة لبحثك الحالي.' : 'ستظهر بيانات العملاء هنا تلقائياً بمجرد تسجيل أي حجز بالعيادة.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr
                    key={client.id || idx}
                    className="hover:bg-blue-950/30 transition-colors group"
                  >
                    {/* Index */}
                    <td className="p-4 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                          {client.name.charAt(0) || 'ع'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                            {client.name}
                          </div>
                          {client.totalVisits > 0 && (
                            <span className="text-[10px] text-cyan-400/80 font-mono">
                              {client.totalVisits} زيارة مسجلة
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4 font-mono font-bold text-cyan-300">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span>{client.phone}</span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-200 font-medium text-xs">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        {client.service}
                      </span>
                    </td>

                    {/* Doctor */}
                    <td className="p-4">
                      <div className="text-slate-200 font-semibold">{client.doctor}</div>
                    </td>

                    {/* Last Visit */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 text-cyan-300 font-mono text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {client.lastVisit}
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Book appointment */}
                        <button
                          onClick={() => {
                            navigateToBookingWithSlot({
                              date: new Date().toISOString().split('T')[0],
                              time: '09:00 ص',
                              patientId: client.patientId,
                              notes: `حجز سريع للعميل: ${client.name}`,
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 text-cyan-300 hover:text-white font-bold text-[11px] transition-all"
                          title="حجز موعد جديد لهذا العميل"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>حجز جديد</span>
                        </button>

                        {/* Open Medical Record */}
                        <button
                          onClick={() => setActiveTab('medical_records')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="فتح الملف الطبي"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            إجمالي العملاء المعروضين: <strong className="text-cyan-300 font-mono">{filteredClients.length}</strong> من أصل{' '}
            <strong className="text-white font-mono">{extractedClients.length}</strong>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>💡 نصيحة: زر تصدير PDF يفتح معاينة طباعة مهندمة جاهزة للحفظ كـ PDF أو الطباعة المباشرة.</span>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-slate-900/95 border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <span>إضافة عميل / مريض جديد</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: د. ياسر كمال محمود"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0501234567"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">رقم الهوية / الإقامة</label>
                  <input
                    type="text"
                    value={civilId}
                    onChange={(e) => setCivilId(e.target.value)}
                    placeholder="10XXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">العمر</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">الجنس</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'ذكر' | 'أنثى')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="أي ملاحظات خاصة بالعميل..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
