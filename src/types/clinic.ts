export type UserRole = 'مدير' | 'دكتور' | 'موظف';

export type TabId = 
  | 'dashboard'         // 1. الرئيسية
  | 'book'              // 2. حجز موعد
  | 'my_bookings'       // 3. حجوزاتي
  | 'medical_records'   // 4. الملف الطبي
  | 'payments'          // 5. المدفوعات
  | 'notifications'     // 6. الإشعارات
  | 'clients'           // 7. بيانات العملاء
  | 'settings';         // 8. الإعدادات

export interface TabDefinition {
  id: TabId;
  label: string;
  description: string;
  iconName: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  specialty?: string;
  phone?: string;
  allowedTabs: TabId[];
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  availableDays?: string[];
}

export interface ClinicService {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description?: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  patientNumber: string;
  fullName: string;
  civilId: string;
  phone: string;
  phoneSecondary?: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  bloodType: string;
  chronicDiseases: string[];
  allergies: string[];
  medicalNotes: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  createdAt: string;
  lastVisitDate?: string;
  totalVisitsCount?: number;
}

export type BookingStatus = 'قادم' | 'تمت الزيارة' | 'ملغي' | 'قيد الانتظار';
export type PaymentStatus = 'مدفوع بالكامل' | 'مدفوع جزئياً' | 'غير مدفوع';

export interface Booking {
  id: string;
  bookingNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  lockedPrice: number; // Historical snapshot
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00 ص" or "09:00"
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdAt: string;
}

export interface MedicalRecordVisit {
  id: string;
  dayName: string; // e.g. "الأربعاء"
  date: string;    // YYYY-MM-DD
  time: string;    // e.g. "10:30 ص"
  notes?: string;
  doctorName?: string;
}

export interface MedicalRecordEntry {
  id: string;
  recordNumber: string;
  bookingId?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time?: string;
  dayName?: string;
  chiefComplaint: string;
  diagnosis: string;
  vitalSigns: {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    bloodSugar?: number;
    weight?: number;
  };
  clinicalNotes: string;
  prescriptions: Array<{
    id: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  followUpDate?: string; // ميعاد الزيارة القادم
  visitsHistory?: MedicalRecordVisit[]; // سجل الزيارات
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  bookingId?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  serviceId?: string;
  serviceName?: string;
  date: string;
  time?: string;
  serviceFee: number;      // قيمة الكشف
  tenderedAmount: number;  // كم دفع العميل (المبلغ المستلم)
  changeReturned: number;  // المتبقي له (الباقي)
  amount: number;          // المبلغ الفعلي المسدد
  paymentMethod: 'نقدي' | 'بطاقة ائتمان' | 'تحويل بنكي' | 'تأمين طبي';
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  timeSlot: string; // e.g. "10:00 ص"
  suggestedBookingDate: string; // YYYY-MM-DD
  doctorId?: string;
  patientId?: string;
  type: 'تذكير_موعد' | 'متابعة_كشف' | 'تنبيه_إداري';
  isRead: boolean;
  createdAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  workingHoursStart: string; // e.g. "09:00"
  workingHoursEnd: string;   // e.g. "21:00"
  timeSlots: string[];       // ["09:00 ص", "10:00 ص", "11:00 ص", "12:00 م", "01:00 م", "02:00 م", "04:00 م", "05:00 م", "06:00 م", "07:00 م", "08:00 م", "09:00 م"]
  phone: string;
  address: string;
  currency: string;
  doctorName: string;
  specialty: string;
  selectedDirectoryPath?: string;
  lastBackupDate?: string;
}

export interface ClinicDatabase {
  version: string;
  lastUpdated: string;
  settings: ClinicSettings;
  users: UserAccount[];
  doctors: Doctor[];
  services: ClinicService[];
  patients: Patient[];
  bookings: Booking[];
  medicalRecords: MedicalRecordEntry[];
  payments: PaymentRecord[];
  notifications: NotificationItem[];
}

export interface PrefilledBookingSlot {
  date: string;
  time: string;
  doctorId?: string;
  patientId?: string;
  notes?: string;
}
