import * as XLSX from 'xlsx';
import { Booking, ClinicDatabase, Patient } from '../types/clinic';

export const excelService = {
  // Export Bookings
  exportBookingsToExcel(bookings: Booking[]): void {
    const data = bookings.map((b, idx) => ({
      'م': idx + 1,
      'رقم الحجز': b.bookingNumber,
      'اسم المريض': b.patientName,
      'رقم الهاتف': b.patientPhone,
      'الدكتور': b.doctorName,
      'الخدمة': b.serviceName,
      'السعر المثبت': b.lockedPrice,
      'التاريخ': b.date,
      'الوقت': b.time,
      'الحالة': b.status,
      'حالة السداد': b.paymentStatus,
      'ملاحظات': b.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!views'] = [{ rightToLeft: true }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الحجوزات');
    XLSX.writeFile(workbook, `حجوزات_العيادة_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Export Patients
  exportPatientsToExcel(patients: Patient[]): void {
    const data = patients.map((p, idx) => ({
      'م': idx + 1,
      'رقم الملف': p.patientNumber,
      'الاسم الكامل': p.fullName,
      'الهوية الوطنية': p.civilId,
      'الهاتف': p.phone,
      'العمر': p.age,
      'الجنس': p.gender,
      'فصيلة الدم': p.bloodType,
      'الأمراض المزمنة': p.chronicDiseases.join('، '),
      'الحساسية': p.allergies.join('، '),
      'تاريخ التسجيل': p.createdAt,
      'آخر زيارة': p.lastVisitDate || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!views'] = [{ rightToLeft: true }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل المرضى');
    XLSX.writeFile(workbook, `مرضى_العيادة_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Export Clients Data (extracted from Bookings & Patients)
  exportClientsListToExcel(clients: Array<{
    name: string;
    phone: string;
    service: string;
    doctor: string;
    lastVisit: string;
    totalVisits: number;
    totalSpent: number;
  }>, clinicName: string = 'العيادة'): void {
    const data = clients.map((c, idx) => ({
      'م': idx + 1,
      'اسم العميل / المريض': c.name,
      'رقم الهاتف': c.phone,
      'الخدمة': c.service,
      'الدكتور': c.doctor,
      'ميعاد آخر زيارة': c.lastVisit,
      'عدد الزيارات': c.totalVisits,
      'إجمالي المدفوعات (ر.س)': c.totalSpent,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!views'] = [{ rightToLeft: true }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات العملاء');
    XLSX.writeFile(workbook, `بيانات_عملاء_${clinicName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Export Full Clinic Database
  exportFullClinicWorkbook(db: ClinicDatabase): void {
    const workbook = XLSX.utils.book_new();

    // Summary
    const summaryData = [
      { 'البيان': 'اسم العيادة', 'القيمة': db.settings.clinicName },
      { 'البيان': 'المدير الطبي', 'القيمة': db.settings.doctorName },
      { 'البيان': 'التخصص', 'القيمة': db.settings.specialty },
      { 'البيان': 'هاتف العيادة', 'القيمة': db.settings.phone },
      { 'البيان': 'العنوان', 'القيمة': db.settings.address },
      { 'البيان': 'إجمالي الحجوزات', 'القيمة': db.bookings.length },
      { 'البيان': 'إجمالي المرضى', 'القيمة': db.patients.length },
      { 'البيان': 'الحجوزات المكتملة (تمت الزيارة)', 'القيمة': db.bookings.filter(b => b.status === 'تمت الزيارة').length },
      { 'البيان': 'الحجوزات القادمة', 'القيمة': db.bookings.filter(b => b.status === 'قادم').length },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'ملخص العيادة');

    // Bookings
    const bookingsData = db.bookings.map((b, idx) => ({
      'م': idx + 1,
      'رقم الحجز': b.bookingNumber,
      'المريض': b.patientName,
      'الهاتف': b.patientPhone,
      'الدكتور': b.doctorName,
      'الخدمة': b.serviceName,
      'السعر': b.lockedPrice,
      'التاريخ': b.date,
      'الوقت': b.time,
      'الحالة': b.status,
    }));
    const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
    wsBookings['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(workbook, wsBookings, 'الحجوزات');

    // Patients
    const patientsData = db.patients.map((p, idx) => ({
      'م': idx + 1,
      'رقم الملف': p.patientNumber,
      'الاسم': p.fullName,
      'الجوال': p.phone,
      'العمر': p.age,
      'الجنس': p.gender,
      'فصيلة الدم': p.bloodType,
    }));
    const wsPatients = XLSX.utils.json_to_sheet(patientsData);
    wsPatients['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(workbook, wsPatients, 'المرضى');

    XLSX.writeFile(workbook, `بيانات_${db.settings.clinicName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Export Payments & Cashier Ledger
  exportPaymentsToExcel(payments: any[], title: string = 'سجل_المدفوعات'): void {
    const data = payments.map((p, idx) => ({
      'م': idx + 1,
      'رقم السند': p.receiptNumber || `REC-${idx + 1}`,
      'اسم المريض': p.patientName,
      'رقم الهاتف': p.patientPhone || '-',
      'الدكتور المعالج': p.doctorName || '-',
      'الخدمة': p.serviceName || 'كشف واستشارة',
      'التاريخ': p.date,
      'الوقت': p.time || '-',
      'قيمة الكشف': p.serviceFee ?? p.amount,
      'المبلغ المدفوع من العميل': p.tenderedAmount ?? p.amount,
      'المتبقي له (الباقي)': p.changeReturned ?? 0,
      'المبلغ المحصل': p.amount,
      'طريقة السداد': p.paymentMethod || 'نقدي',
      'ملاحظات': p.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!views'] = [{ rightToLeft: true }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل المقبوضات');
    XLSX.writeFile(workbook, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
};
