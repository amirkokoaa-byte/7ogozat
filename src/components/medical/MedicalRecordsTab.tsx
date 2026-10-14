import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Activity,
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  PlusCircle,
  Save,
  CheckCircle2,
  X,
  Printer,
  ChevronRight,
  Heart,
  CalendarPlus,
  AlertCircle,
  Check,
  History,
  Sparkles,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalRecordEntry, MedicalRecordVisit, Patient } from '../../types/clinic';

export const MedicalRecordsTab: React.FC = () => {
  const {
    db,
    updateMedicalRecord,
    addMedicalRecordVisit,
    setFollowUpDate,
    setActiveTab,
  } = useClinic();

  // Top instant filters
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('all');
  const [dateSearchQuery, setDateSearchQuery] = useState('');

  // Active Patient Medical File Modal
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordEntry | null>(null);

  // Modal State for Next Visit Date ("ميعاد الزيارة القادم")
  const [nextVisitDateInput, setNextVisitDateInput] = useState('');
  const [nextVisitSavedToast, setNextVisitSavedToast] = useState(false);

  // Modal State for "زيارة جديدة" (New visit draft row)
  const [isAddingNewVisit, setIsAddingNewVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitTime, setNewVisitTime] = useState('');
  const [newVisitDayName, setNewVisitDayName] = useState('');
  const [newVisitDoctor, setNewVisitDoctor] = useState('');
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [visitSavedToast, setVisitSavedToast] = useState(false);

  // Rx Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Safe data arrays
  const medicalRecordsList = Array.isArray(db?.medicalRecords) ? db.medicalRecords : [];
  const doctorsList = Array.isArray(db?.doctors) ? db.doctors : [];
  const patientsList = Array.isArray(db?.patients) ? db.patients : [];

  // Filter logic:
  // 1. Patient Name or Phone
  // 2. Doctor Name
  // 3. Date Search: عند تحديد تاريخ معين، يظهر الزيارات المسجلة في ذلك اليوم حسب ملفات المرضى
  const filteredRecords = useMemo(() => {
    return medicalRecordsList.filter((rec) => {
      if (!rec) return false;

      // Filter 1: Patient Name or Phone
      if (patientSearchQuery.trim()) {
        const q = patientSearchQuery.trim().toLowerCase();
        const matchesName = rec.patientName && rec.patientName.toLowerCase().includes(q);
        const matchesPhone = rec.patientPhone && rec.patientPhone.includes(q);
        const matchesNum = rec.recordNumber && rec.recordNumber.toLowerCase().includes(q);

        // Also check patients table if phone is in patient record
        const pObj = patientsList.find((p) => p.id === rec.patientId);
        const matchesPatientDbPhone = pObj && pObj.phone.includes(q);

        if (!matchesName && !matchesPhone && !matchesNum && !matchesPatientDbPhone) {
          return false;
        }
      }

      // Filter 2: Doctor
      if (doctorSearchQuery !== 'all') {
        if (rec.doctorId !== doctorSearchQuery && rec.doctorName !== doctorSearchQuery) {
          return false;
        }
      }

      // Filter 3: Date
      // عند تحديد تاريخ معين، يظهر الزيارات المسجلة في ذلك اليوم حسب ملفات المرضى
      if (dateSearchQuery) {
        const matchesMainDate = rec.date === dateSearchQuery;
        const matchesVisitsHistory = Array.isArray(rec.visitsHistory) &&
          rec.visitsHistory.some((v) => v.date === dateSearchQuery);
        const matchesFollowUp = rec.followUpDate === dateSearchQuery;

        if (!matchesMainDate && !matchesVisitsHistory && !matchesFollowUp) {
          return false;
        }
      }

      return true;
    });
  }, [medicalRecordsList, patientSearchQuery, doctorSearchQuery, dateSearchQuery, patientsList]);

  // Open patient file
  const handleOpenRecord = (rec: MedicalRecordEntry) => {
    setSelectedRecord(rec);
    setNextVisitDateInput(rec.followUpDate || '');
    setIsAddingNewVisit(false);
    setNextVisitSavedToast(false);
    setVisitSavedToast(false);
  };

  // Close patient file
  const handleCloseRecord = () => {
    setSelectedRecord(null);
    setIsAddingNewVisit(false);
  };

  // 1. Save Next Visit Date
  const handleSaveNextVisitDate = () => {
    if (!selectedRecord) return;
    setFollowUpDate(selectedRecord.id, nextVisitDateInput);
    setSelectedRecord({
      ...selectedRecord,
      followUpDate: nextVisitDateInput,
    });
    setNextVisitSavedToast(true);
    setTimeout(() => setNextVisitSavedToast(false), 3500);
  };

  // Helper to get Arabic 12-hour formatted time and Arabic day
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

  // 2. Prepare "زيارة جديدة"
  // عند الضغط عليه يظهر ويضاف في السجل لحظياً سطر جديد يحتوي على (اليوم والتاريخ والساعة الحالية)
  const handleStartNewVisit = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const dayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });
    const timeStr = getCurrentFormattedTime();

    setNewVisitDate(dateStr);
    setNewVisitTime(timeStr);
    setNewVisitDayName(dayName);
    setNewVisitDoctor(selectedRecord?.doctorName || doctorsList[0]?.name || 'الطبيب المعالج');
    setNewVisitNotes('');
    setIsAddingNewVisit(true);
  };

  // Save the new visit to record
  const handleSaveNewVisit = () => {
    if (!selectedRecord) return;

    const newVisitObj: MedicalRecordVisit = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      dayName: newVisitDayName || 'اليوم',
      date: newVisitDate,
      time: newVisitTime,
      notes: newVisitNotes.trim() || 'كشف ومتابعة سريرية جديدة',
      doctorName: newVisitDoctor,
    };

    addMedicalRecordVisit(selectedRecord.id, {
      dayName: newVisitObj.dayName,
      date: newVisitObj.date,
      time: newVisitObj.time,
      notes: newVisitObj.notes,
      doctorName: newVisitObj.doctorName,
    });

    const updatedVisits = [newVisitObj, ...(Array.isArray(selectedRecord.visitsHistory) ? selectedRecord.visitsHistory : [])];
    setSelectedRecord({
      ...selectedRecord,
      date: newVisitDate,
      time: newVisitTime,
      dayName: newVisitDayName,
      visitsHistory: updatedVisits,
    });

    setIsAddingNewVisit(false);
    setVisitSavedToast(true);
    setTimeout(() => setVisitSavedToast(false), 3500);
  };

  // Patient detailed profile lookup
  const currentPatientDetails: Patient | undefined = useMemo(() => {
    if (!selectedRecord) return undefined;
    return patientsList.find((p) => p.id === selectedRecord.patientId);
  }, [selectedRecord, patientsList]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">القسم الرابع: الملف الطبي وسجل الزيارات السريرية</h2>
            <p className="text-xs text-blue-200/80">
              أرشيف الزيارات الطبية للمرضى المحجوزين والوافدين، تحديد ميعاد الزيارة القادم، وإضافة زيارات فورية موثقة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/30 text-xs text-cyan-300 font-mono font-bold">
            {filteredRecords.length} ملف نشط
          </div>
          <button
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>حجز كشف جديد</span>
          </button>
        </div>
      </div>

      {/* REQUIREMENT 2: فلاتر البحث بالأعلى (تعمل لحظياً) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        
        {/* 1. بحث باسم المريض أو رقم الهاتف المسجل */}
        <div className="sm:col-span-5">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>بحث باسم المريض أو رقم الهاتف:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              placeholder="اكتب اسم المريض أو رقم الهاتف أو رقم الملف..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-blue-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 2. خانة بحث باسم الدكتور */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>بحث بالدكتور المعالج:</span>
          </label>
          <select
            value={doctorSearchQuery}
            onChange={(e) => setDoctorSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">كل الأطباء المعالجين</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* 3. خانة بحث بالتاريخ: عند تحديد تاريخ معين، يظهر الزيارات المسجلة في ذلك اليوم */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>بحث بتاريخ الزيارة:</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateSearchQuery}
              onChange={(e) => setDateSearchQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            {dateSearchQuery && (
              <button
                type="button"
                onClick={() => setDateSearchQuery('')}
                title="إلغاء فلتر التاريخ"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Medical Records Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>لا توجد ملفات طبية مطابقة لخيارات البحث المحددة.</p>
            <p className="text-[11px] text-blue-300/80">
              ملاحظة: تظهر هنا ملفات جميع المرضى الذين سجلوا زيارة أو تم ترحيلهم عند تفعيل "تمت الزيارة".
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const visitsCount = Array.isArray(rec.visitsHistory) ? rec.visitsHistory.length : 1;
            const patientData = patientsList.find((p) => p.id === rec.patientId);

            return (
              <div
                key={rec.id}
                className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-blue-500/35 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-300 font-bold text-xs bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          {rec.recordNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rec.time || 'صباحاً'}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-base mt-1.5 group-hover:text-cyan-300 transition-colors">
                        {rec.patientName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span className="font-mono text-cyan-200">
                          {rec.patientPhone || patientData?.phone || '---'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-mono">{rec.date}</span>
                      <span className="text-[10px] font-bold text-blue-300 block">{rec.doctorName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 mt-1 inline-block">
                        {visitsCount} {visitsCount === 1 ? 'زيارة' : 'زيارات'}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis & Chief Complaint */}
                  <div className="space-y-2 pt-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20">
                      <span className="text-slate-400 text-[10px] block">التشخيص الطبي الأخير:</span>
                      <strong className="text-white text-xs block truncate">{rec.diagnosis}</strong>
                    </div>

                    {rec.followUpDate ? (
                      <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                        <div className="flex items-center gap-1.5">
                          <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                          <span>ميعاد الزيارة القادم:</span>
                        </div>
                        <span className="font-mono">{rec.followUpDate}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic pr-1">
                        لم يحدد ميعاد زيارة قادم بعد
                      </div>
                    )}
                  </div>
                </div>

                {/* Open Full File Button */}
                <button
                  type="button"
                  onClick={() => handleOpenRecord(rec)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-blue-600/30 border border-blue-500/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>فتح الملف الطبي ومتابعة الزيارات</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* REQUIREMENT 3: نافذة فتح ملف المريض (Patient Medical Record Modal) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.4)] p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">
                      الملف الطبي: {selectedRecord.patientName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                      {selectedRecord.recordNumber}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80">
                    إدارة بيانات المريض، تحديد ميعاد المراجعة القادمة، وتوثيق سجل الزيارات السريرية.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-blue-500/30 text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الروشتة</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseRecord}
                  title="إغلاق الملف"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toasts / Notifications */}
            {nextVisitSavedToast && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم حفظ ميعاد الزيارة القادم بنجاح!</span>
              </div>
            )}

            {visitSavedToast && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم توثيق وحفظ الزيارة الجديدة لحظياً في سجل المريض!</span>
              </div>
            )}

            {/* Patient General Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>بيانات المريض الأساسية</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">رقم الهاتف:</span>
                  <strong className="text-white font-mono">{selectedRecord.patientPhone || currentPatientDetails?.phone || '---'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">العمر والجنس:</span>
                  <strong className="text-white">{currentPatientDetails?.age || 35} سنة • {currentPatientDetails?.gender || 'ذكر'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">فصيلة الدم:</span>
                  <strong className="text-rose-400 font-mono font-bold">{currentPatientDetails?.bloodType || 'O+'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">الطبيب المسؤول:</span>
                  <strong className="text-cyan-300">{selectedRecord.doctorName}</strong>
                </div>
              </div>

              {/* Allergies and Chronic Illnesses */}
              {currentPatientDetails && (
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  {currentPatientDetails.chronicDiseases.length > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300">
                      <strong className="ml-1">أمراض مزمنة:</strong>
                      {currentPatientDetails.chronicDiseases.join('، ')}
                    </div>
                  )}
                  {currentPatientDetails.allergies.length > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300">
                      <strong className="ml-1">حساسية:</strong>
                      {currentPatientDetails.allergies.join('، ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* REQUIREMENT: خيار تحديد "ميعاد الزيارة القادم" (اختيار تاريخ من النتيجة + زر "حفظ" ليتم تسجيله) */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CalendarPlus className="w-4 h-4 text-cyan-400" />
                  <span>تحديد "ميعاد الزيارة القادم" (Next Visit Appointment):</span>
                </span>
                {selectedRecord.followUpDate && (
                  <span className="text-[11px] text-amber-300 font-mono font-bold">
                    المسجل حالياً: {selectedRecord.followUpDate}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="date"
                  value={nextVisitDateInput}
                  onChange={(e) => setNextVisitDateInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />

                <button
                  type="button"
                  onClick={handleSaveNextVisitDate}
                  disabled={!nextVisitDateInput}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ ميعاد الزيارة القادم</span>
                </button>
              </div>
            </div>

            {/* REQUIREMENT: أسفل البيانات يظهر قسم "سجل الزيارات": يعرض مواعيد الزيارات السابقة موضحاً (يوم وتاريخ وساعة الزيارة)
                مع زر باسم "زيارة جديدة": عند الضغط عليه يظهر ويضاف في السجل لحظياً سطر جديد يحتوي على (اليوم والتاريخ والساعة الحالية)، مع زر "حفظ"
            */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-white text-sm">سجل الزيارات الطبية السابقة والجديدة</h4>
                </div>

                {/* زر باسم "زيارة جديدة" */}
                {!isAddingNewVisit && (
                  <button
                    type="button"
                    onClick={handleStartNewVisit}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>زيارة جديدة</span>
                  </button>
                )}
              </div>

              {/* Dynamic New Visit Row Draft Form */}
              {isAddingNewVisit && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-bold border-b border-emerald-500/30 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>إضافة زيارة جديدة (تم ملء اليوم والتاريخ والساعة تلقائياً):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewVisit(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">اليوم:</label>
                      <input
                        type="text"
                        value={newVisitDayName}
                        onChange={(e) => setNewVisitDayName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">التاريخ:</label>
                      <input
                        type="date"
                        value={newVisitDate}
                        onChange={(e) => setNewVisitDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">ساعة الزيارة:</label>
                      <input
                        type="text"
                        value={newVisitTime}
                        onChange={(e) => setNewVisitTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">الدكتور:</label>
                      <input
                        type="text"
                        value={newVisitDoctor}
                        onChange={(e) => setNewVisitDoctor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      ملاحظات الزيارة / الفحص السريري:
                    </label>
                    <input
                      type="text"
                      value={newVisitNotes}
                      onChange={(e) => setNewVisitNotes(e.target.value)}
                      placeholder="اكتب ملاحظات الفحص أو سبب الزيارة..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewVisit(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewVisit}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ الزيارة الآن</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Visits List Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                      <th className="p-3 text-center">اليوم</th>
                      <th className="p-3 text-center">تاريخ الزيارة</th>
                      <th className="p-3 text-center">ساعة الزيارة</th>
                      <th className="p-3">الطبيب المعالج</th>
                      <th className="p-3">ملاحظات وتشخيص الزيارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(selectedRecord.visitsHistory || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          لا توجد زيارات مسجلة سابقة. اضغط "زيارة جديدة" لإضافة أول زيارة.
                        </td>
                      </tr>
                    ) : (
                      (selectedRecord.visitsHistory || []).map((v) => (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-center font-bold text-cyan-300">
                            {v.dayName || '---'}
                          </td>
                          <td className="p-3 text-center font-mono text-white font-semibold">
                            {v.date}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-300">
                            {v.time}
                          </td>
                          <td className="p-3 text-slate-200">
                            {v.doctorName || selectedRecord.doctorName}
                          </td>
                          <td className="p-3 text-slate-300">
                            {v.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prescriptions and Clinical Summary */}
            {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-cyan-300 block">الوصفة الطبية (Rx):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRecord.prescriptions.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <strong className="text-white block">{p.drugName}</strong>
                      <span className="text-[11px] text-slate-400">
                        {p.dosage} • {p.frequency} • {p.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleCloseRecord}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                إغلاق الملف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {isPrintModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white text-slate-950 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">معاينة وطباعة الروشتة الطبية</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prescription Sheet */}
            <div className="border-2 border-blue-600 rounded-xl p-5 space-y-4 font-sans" dir="rtl">
              <div className="flex justify-between items-start border-b-2 border-blue-600 pb-3">
                <div>
                  <h2 className="text-xl font-black text-blue-900">{db.settings.clinicName}</h2>
                  <p className="text-xs text-slate-600">{db.settings.doctorName} - {db.settings.specialty}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{db.settings.phone}</p>
                </div>
                <div className="text-left font-mono text-xs">
                  <div>التاريخ: {selectedRecord.date}</div>
                  <div>رقم الملف: {selectedRecord.recordNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-200 font-bold">
                <div>اسم المريض: {selectedRecord.patientName}</div>
                <div>الهاتف: {selectedRecord.patientPhone || currentPatientDetails?.phone || '-'}</div>
              </div>

              <div className="space-y-3 min-h-[140px]">
                <div className="text-lg font-black text-blue-800 font-serif">Rx:</div>
                {selectedRecord.prescriptions.map((rx, idx) => (
                  <div key={rx.id || idx} className="pr-4 text-xs space-y-0.5">
                    <div className="font-bold text-slate-900">{idx + 1}. {rx.drugName}</div>
                    <div className="text-slate-600 font-mono text-[11px]">الجرعة: {rx.dosage} - {rx.frequency} ({rx.duration})</div>
                  </div>
                ))}
              </div>

              {selectedRecord.followUpDate && (
                <div className="pt-2 border-t border-slate-200 text-xs font-bold text-blue-900">
                  ميعاد الاستشارة والمراجعة القادمة: {selectedRecord.followUpDate}
                </div>
              )}

              <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
                {db.settings.address} • مع تمنياتنا لكم بالشفاء العاجل
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
