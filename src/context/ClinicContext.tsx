import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Booking,
  BookingStatus,
  ClinicDatabase,
  ClinicService,
  ClinicSettings,
  Doctor,
  MedicalRecordEntry,
  NotificationItem,
  Patient,
  PaymentRecord,
  PaymentStatus,
  PrefilledBookingSlot,
  TabId,
  UserAccount,
  UserRole,
} from '../types/clinic';
import { storageService, SyncStatus } from '../services/storageService';

interface ClinicContextType {
  // Auth & RBAC
  currentUser: UserAccount | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  registerUser: (username: string, password: string, name: string, role: UserRole) => boolean;
  switchUser: (userId: string) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  hasAccessToTab: (tab: TabId) => boolean;

  // Smart Navigation Slot
  prefilledBookingSlot: PrefilledBookingSlot | null;
  setPrefilledBookingSlot: (slot: PrefilledBookingSlot | null) => void;
  navigateToBookingWithSlot: (slot: PrefilledBookingSlot) => void;

  // Quick edit clinic name from anywhere (e.g. login modal or header)
  isQuickClinicNameModalOpen: boolean;
  setIsQuickClinicNameModalOpen: (open: boolean) => void;

  // Database
  db: ClinicDatabase;

  // Settings
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;
  updateClinicName: (name: string) => void;

  // Bookings
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'lockedPrice'> & { lockedPrice?: number }) => Booking;
  updateBooking: (booking: Booking) => void;
  deleteBooking: (id: string) => void;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  markBookingVisited: (bookingId: string) => void;

  // Dynamic Patient Visit Stats
  getPatientVisitStats: (patientId: string) => { totalVisits: number; lastVisitDate: string | null };

  // Medical Records
  updateMedicalRecord: (record: MedicalRecordEntry) => void;
  addMedicalRecordVisit: (recordId: string, visit: { date: string; time: string; dayName: string; notes?: string; doctorName?: string }) => void;
  setFollowUpDate: (recordId: string, followUpDate: string) => void;

  // Payments & Cashier
  addPaymentRecord: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'>) => PaymentRecord;

  // Patients
  addPatient: (patient: Omit<Patient, 'id' | 'patientNumber' | 'createdAt'>) => Patient;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;

  // Users & RBAC
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (user: UserAccount) => void;
  deleteUser: (id: string) => void;
  toggleUserTabPermission: (userId: string, tabId: TabId) => void;

  // Dual Storage & Sync
  syncStatus: SyncStatus;
  connectLocalDirectory: () => Promise<{ success: boolean; folderName: string; error?: string }>;
  disconnectLocalDirectory: () => void;
  exportJsonBackup: () => void;
  importJsonBackup: (jsonContent: string) => boolean;
  resetDatabase: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<ClinicDatabase>(() => storageService.loadDatabase());

  // Default to admin user (admin / 1234)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return db.users.find(u => u.username === 'admin') || db.users[0] || null;
  });

  const [activeTab, setActiveTabState] = useState<TabId>('dashboard');
  const [prefilledBookingSlot, setPrefilledBookingSlot] = useState<PrefilledBookingSlot | null>(null);
  const [isQuickClinicNameModalOpen, setIsQuickClinicNameModalOpen] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    storageService.getSyncStatus(db.settings.selectedDirectoryPath)
  );

  // Sync to storage on state change
  useEffect(() => {
    storageService.saveDatabase(db);
    setSyncStatus(storageService.getSyncStatus(db.settings.selectedDirectoryPath));
  }, [db]);

  // Keep active tab valid per allowedTabs
  useEffect(() => {
    if (currentUser) {
      if (!currentUser.allowedTabs.includes(activeTab)) {
        if (currentUser.allowedTabs.length > 0) {
          setActiveTabState(currentUser.allowedTabs[0]);
        }
      }
    }
  }, [currentUser, activeTab]);

  const hasAccessToTab = (tab: TabId): boolean => {
    if (!currentUser) return false;
    return currentUser.allowedTabs.includes(tab);
  };

  const setActiveTab = (tab: TabId) => {
    if (hasAccessToTab(tab)) {
      setActiveTabState(tab);
    }
  };

  // Smart Navigation from notifications to booking
  const navigateToBookingWithSlot = (slot: PrefilledBookingSlot) => {
    setPrefilledBookingSlot(slot);
    if (hasAccessToTab('book')) {
      setActiveTabState('book');
    }
  };

  // Auth
  const login = (username: string, password: string): boolean => {
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
    );
    if (user) {
      setCurrentUser(user);
      if (user.allowedTabs.length > 0 && !user.allowedTabs.includes(activeTab)) {
        setActiveTabState(user.allowedTabs[0]);
      }
      return true;
    }
    return false;
  };

  const registerUser = (username: string, password: string, name: string, role: UserRole): boolean => {
    const exists = db.users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return false;
    }

    // Role-based default tabs
    let defaultTabs: TabId[] = ['dashboard', 'book', 'my_bookings'];
    if (role === 'مدير') {
      defaultTabs = ['dashboard', 'book', 'my_bookings', 'medical_records', 'payments', 'notifications', 'clients', 'settings'];
    } else if (role === 'دكتور') {
      defaultTabs = ['dashboard', 'book', 'my_bookings', 'medical_records', 'notifications', 'clients'];
    } else {
      defaultTabs = ['dashboard', 'book', 'my_bookings', 'payments', 'notifications', 'clients'];
    }

    const newUser: UserAccount = {
      id: `u-${Date.now()}`,
      username: username.trim(),
      password: password.trim(),
      name: name.trim() || username.trim(),
      role,
      allowedTabs: defaultTabs,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setDb(prev => ({
      ...prev,
      users: [...prev.users, newUser],
    }));

    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.allowedTabs.length > 0 && !user.allowedTabs.includes(activeTab)) {
        setActiveTabState(user.allowedTabs[0]);
      }
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<ClinicSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  const updateClinicName = (name: string) => {
    if (!name.trim()) return;
    updateSettings({ clinicName: name.trim() });
  };

  // Dynamic Patient Visit Stats: calculates real visits and last date
  const getPatientVisitStats = (patientId: string) => {
    const allBookings = db.bookings || [];
    const patientBookings = allBookings.filter(b => b.patientId === patientId);
    const completedOrPast = patientBookings.filter(b => b.status === 'تمت الزيارة');
    
    // Sort descending by date
    const sorted = [...completedOrPast].sort((a, b) => b.date.localeCompare(a.date));
    
    const patientObj = (db.patients || []).find(p => p.id === patientId);
    const baseCount = patientObj?.totalVisitsCount || 0;
    const computedCount = Math.max(completedOrPast.length, baseCount);
    
    const lastDate = sorted[0]?.date || patientObj?.lastVisitDate || null;

    return {
      totalVisits: computedCount,
      lastVisitDate: lastDate,
    };
  };

  // BOOKINGS (Historical Price Integrity)
  const addBooking = (
    data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'lockedPrice'> & { lockedPrice?: number }
  ): Booking => {
    let lockedPrice = data.lockedPrice;
    if (lockedPrice === undefined) {
      const srv = db.services.find((s) => s.id === data.serviceId);
      lockedPrice = srv ? srv.price : 0;
    }

    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const count = db.bookings.length + 101;
    const bookingNumber = `BK-${yearSuffix}-${count}`;

    const newBooking: Booking = {
      ...data,
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingNumber,
      lockedPrice,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => ({
      ...prev,
      bookings: [newBooking, ...prev.bookings],
      // If completed, update patient's last visit date
      patients: prev.patients.map((p) => {
        if (p.id === data.patientId && data.status === 'تمت الزيارة') {
          return {
            ...p,
            lastVisitDate: data.date,
            totalVisitsCount: (p.totalVisitsCount || 0) + 1,
          };
        }
        return p;
      }),
    }));

    return newBooking;
  };

  const updateBooking = (updated: Booking) => {
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === updated.id ? updated : b)),
    }));
  };

  const deleteBooking = (id: string) => {
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.filter((b) => b.id !== id),
    }));
  };

  const setBookingStatus = (id: string, status: BookingStatus) => {
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => {
        if (b.id === id) {
          return { ...b, status };
        }
        return b;
      }),
    }));
  };

  const markBookingVisited = (bookingId: string) => {
    setDb((prev) => {
      const targetBooking = prev.bookings.find((b) => b.id === bookingId);
      if (!targetBooking) return prev;

      const updatedBookings = prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'تمت الزيارة' as BookingStatus } : b
      );

      // Check if medical record already exists for this patient or booking
      let dayName = '';
      try {
        dayName = new Date(targetBooking.date + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long' });
      } catch {
        dayName = 'اليوم';
      }

      const initialVisit = {
        id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        dayName,
        date: targetBooking.date,
        time: targetBooking.time,
        notes: `${targetBooking.serviceName} - تمت الزيارة بنجاح`,
        doctorName: targetBooking.doctorName,
      };

      const existingRec = prev.medicalRecords.find(
        (r) => r.bookingId === bookingId || r.patientId === targetBooking.patientId
      );
      let updatedMedicalRecords = prev.medicalRecords;
      if (!existingRec) {
        const yearSuffix = new Date().getFullYear().toString().slice(-2);
        const count = prev.medicalRecords.length + 101;
        const newRecord: MedicalRecordEntry = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recordNumber: `REC-${yearSuffix}-${count}`,
          bookingId: targetBooking.id,
          patientId: targetBooking.patientId,
          patientName: targetBooking.patientName,
          patientPhone: targetBooking.patientPhone,
          doctorId: targetBooking.doctorId,
          doctorName: targetBooking.doctorName,
          date: targetBooking.date,
          time: targetBooking.time,
          dayName,
          chiefComplaint: targetBooking.notes || 'كشف ومتابعة دورية',
          diagnosis: `${targetBooking.serviceName} - تمت الزيارة بنجاح`,
          vitalSigns: {
            bloodPressure: '120/80',
            pulse: 75,
            temperature: 37.0,
            bloodSugar: 110,
          },
          clinicalNotes: `حضر المريض إلى العيادة وتمت الزيارة الطبية في موعد ${targetBooking.date} الساعة ${targetBooking.time}.`,
          prescriptions: [],
          visitsHistory: [initialVisit],
          createdAt: new Date().toISOString(),
        };
        updatedMedicalRecords = [newRecord, ...prev.medicalRecords];
      } else {
        const currentVisits = Array.isArray(existingRec.visitsHistory) ? existingRec.visitsHistory : [];
        const alreadyInList = currentVisits.some(
          (v) => v.date === targetBooking.date && v.time === targetBooking.time
        );
        if (!alreadyInList) {
          updatedMedicalRecords = prev.medicalRecords.map((r) =>
            r.id === existingRec.id
              ? {
                  ...r,
                  date: targetBooking.date,
                  time: targetBooking.time,
                  dayName,
                  visitsHistory: [initialVisit, ...currentVisits],
                }
              : r
          );
        }
      }

      // Update patient's lastVisitDate and total visits
      const updatedPatients = prev.patients.map((p) => {
        if (p.id === targetBooking.patientId) {
          return {
            ...p,
            lastVisitDate: targetBooking.date,
            totalVisitsCount: (p.totalVisitsCount || 0) + 1,
          };
        }
        return p;
      });

      return {
        ...prev,
        bookings: updatedBookings,
        medicalRecords: updatedMedicalRecords,
        patients: updatedPatients,
      };
    });
  };

  // MEDICAL RECORDS MANAGEMENT
  const updateMedicalRecord = (updatedRecord: MedicalRecordEntry) => {
    setDb((prev) => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)),
    }));
  };

  const setFollowUpDate = (recordId: string, followUpDate: string) => {
    setDb((prev) => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map((r) => (r.id === recordId ? { ...r, followUpDate } : r)),
    }));
  };

  const addMedicalRecordVisit = (
    recordId: string,
    visit: { date: string; time: string; dayName: string; notes?: string; doctorName?: string }
  ) => {
    setDb((prev) => {
      const newVisit = {
        id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        ...visit,
      };
      return {
        ...prev,
        medicalRecords: prev.medicalRecords.map((r) => {
          if (r.id !== recordId) return r;
          const currentVisits = Array.isArray(r.visitsHistory) ? r.visitsHistory : [];
          return {
            ...r,
            date: visit.date,
            time: visit.time,
            dayName: visit.dayName,
            visitsHistory: [newVisit, ...currentVisits],
          };
        }),
      };
    });
  };

  // PAYMENTS & CASHIER
  const addPaymentRecord = (
    paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'>
  ): PaymentRecord => {
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const count = (db.payments || []).length + 101;
    const receiptNumber = `REC-${yearSuffix}-${count}`;

    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      let updatedBookings = prev.bookings;
      if (paymentData.bookingId) {
        updatedBookings = prev.bookings.map((b) => {
          if (b.id === paymentData.bookingId) {
            const newPaid = (b.paidAmount || 0) + paymentData.amount;
            const remaining = Math.max(0, b.lockedPrice - newPaid);
            const status: PaymentStatus = remaining <= 0 ? 'مدفوع بالكامل' : 'مدفوع جزئياً';
            return {
              ...b,
              paidAmount: newPaid,
              remainingAmount: remaining,
              paymentStatus: status,
            };
          }
          return b;
        });
      }

      return {
        ...prev,
        bookings: updatedBookings,
        payments: [newPayment, ...(prev.payments || [])],
      };
    });

    return newPayment;
  };

  // PATIENTS
  const addPatient = (patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt'>): Patient => {
    const maxNum = db.patients.reduce((max, p) => {
      const num = parseInt(p.patientNumber.replace(/\D/g, '') || '0', 10);
      return num > max ? num : max;
    }, 1000);
    const newPatientNumber = `P-${maxNum + 1}`;
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientNumber: newPatientNumber,
      totalVisitsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDb((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
    }));
    return newPatient;
  };

  const updatePatient = (updatedPatient: Patient) => {
    setDb((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
    }));
  };

  const deletePatient = (id: string) => {
    setDb((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== id),
    }));
  };

  // USERS & RBAC
  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDb((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    return newUser;
  };

  const updateUser = (updated: UserAccount) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === updated.id ? updated : u)),
    }));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const deleteUser = (id: string) => {
    if (db.users.length <= 1) {
      alert('لا يمكن حذف المستخدم الأخير في النظام!');
      return;
    }
    setDb((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
    if (currentUser?.id === id) {
      const remaining = db.users.filter((u) => u.id !== id);
      setCurrentUser(remaining[0] || null);
    }
  };

  const toggleUserTabPermission = (userId: string, tabId: TabId) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id !== userId) return u;
        const hasTab = u.allowedTabs.includes(tabId);
        const updatedTabs = hasTab
          ? u.allowedTabs.filter((t) => t !== tabId)
          : [...u.allowedTabs, tabId];
        const finalTabs = updatedTabs.length === 0 ? ['dashboard' as TabId] : updatedTabs;
        const updatedUser = { ...u, allowedTabs: finalTabs };
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }),
    }));
  };

  // DUAL STORAGE & SYNC
  const connectLocalDirectory = async () => {
    const res = await storageService.selectLocalDirectory();
    if (res.success) {
      updateSettings({
        selectedDirectoryPath: res.folderName,
        lastBackupDate: new Date().toISOString(),
      });
      setSyncStatus(storageService.getSyncStatus(res.folderName));
    }
    return res;
  };

  const disconnectLocalDirectory = () => {
    storageService.disconnectLocalDirectory();
    setSyncStatus(storageService.getSyncStatus());
  };

  const exportJsonBackup = () => {
    storageService.exportJsonBackup(db);
    updateSettings({ lastBackupDate: new Date().toISOString() });
  };

  const importJsonBackup = (jsonContent: string): boolean => {
    try {
      const imported = storageService.parseImportedJson(jsonContent);
      setDb(imported);
      if (imported.users.length > 0) {
        setCurrentUser(imported.users[0]);
      }
      return true;
    } catch (err: any) {
      alert(`فشل استيراد قاعدة البيانات: ${err.message}`);
      return false;
    }
  };

  const resetDatabase = () => {
    const fresh = storageService.resetToDefault();
    setDb(fresh);
    setCurrentUser(fresh.users[0]);
  };

  return (
    <ClinicContext.Provider
      value={{
        currentUser,
        login,
        logout,
        registerUser,
        switchUser,
        activeTab,
        setActiveTab,
        hasAccessToTab,
        prefilledBookingSlot,
        setPrefilledBookingSlot,
        navigateToBookingWithSlot,
        isQuickClinicNameModalOpen,
        setIsQuickClinicNameModalOpen,
        db,
        updateSettings,
        updateClinicName,
        addBooking,
        updateBooking,
        deleteBooking,
        setBookingStatus,
        markBookingVisited,
        getPatientVisitStats,
        updateMedicalRecord,
        addMedicalRecordVisit,
        setFollowUpDate,
        addPaymentRecord,
        addPatient,
        updatePatient,
        deletePatient,
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
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
