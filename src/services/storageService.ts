import { ClinicDatabase } from '../types/clinic';
import { INITIAL_DATABASE } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'CLINIC_NOKHBA_DB_STAGE1';

// In-memory reference to directory and file handles
let directoryHandle: any = null;
let fileHandle: any = null;

export interface SyncStatus {
  isSupported: boolean;
  isConnected: boolean;
  folderName: string;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

export const storageService = {
  // Check if File System Access API is supported in this browser
  isFileSystemSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  },

  // Load from localStorage, or initialize with rich seed data, with complete schema safety
  loadDatabase(): ClinicDatabase {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Merge safely with INITIAL_DATABASE so that newly added fields are never undefined
          const safeDb: ClinicDatabase = {
            version: parsed.version || INITIAL_DATABASE.version,
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
            settings: {
              ...INITIAL_DATABASE.settings,
              ...(parsed.settings || {}),
            },
            users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : INITIAL_DATABASE.users,
            doctors: Array.isArray(parsed.doctors) ? parsed.doctors : INITIAL_DATABASE.doctors,
            services: Array.isArray(parsed.services) ? parsed.services : INITIAL_DATABASE.services,
            patients: Array.isArray(parsed.patients) ? parsed.patients : INITIAL_DATABASE.patients,
            bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_DATABASE.bookings,
            medicalRecords: Array.isArray(parsed.medicalRecords) ? parsed.medicalRecords : INITIAL_DATABASE.medicalRecords,
            payments: Array.isArray(parsed.payments) ? parsed.payments : INITIAL_DATABASE.payments,
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : INITIAL_DATABASE.notifications,
          };
          return safeDb;
        }
      }
    } catch (err) {
      console.error('Error loading database from localStorage:', err);
    }
    // Default fallback
    this.saveDatabase(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  },

  // Save to localStorage
  saveDatabase(db: ClinicDatabase): boolean {
    try {
      const payload: ClinicDatabase = {
        ...db,
        bookings: db.bookings || [],
        patients: db.patients || [],
        users: db.users || [],
        services: db.services || [],
        doctors: db.doctors || [],
        medicalRecords: db.medicalRecords || [],
        payments: db.payments || [],
        notifications: db.notifications || [],
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      
      // Also trigger file system auto-sync if handle is connected
      this.syncToFileSystem(payload).catch((err) => {
        console.warn('Auto-sync to local partition skipped/pending:', err);
      });
      return true;
    } catch (err) {
      console.error('Error saving database to localStorage:', err);
      return false;
    }
  },

  // Pick folder on any partition (e.g. D:\ClinicData, E:\ClinicData) via File System Access API
  async selectLocalDirectory(): Promise<{ success: boolean; folderName: string; error?: string }> {
    if (!this.isFileSystemSupported()) {
      return {
        success: false,
        folderName: '',
        error: 'متصفحك الحالي لا يدعم الوصول المباشر للمجلدات المحلية (File System Access API). يُفضل استخدام Google Chrome أو Microsoft Edge على نظام Windows/Mac/Linux.',
      };
    }

    try {
      // @ts-ignore
      directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'desktop',
      });

      if (!directoryHandle) {
        return { success: false, folderName: '', error: 'لم يتم اختيار مجلد' };
      }

      // Create or open clinic_db.json inside the selected directory
      // @ts-ignore
      fileHandle = await directoryHandle.getFileHandle('clinic_db.json', { create: true });

      // Write current state to the chosen file
      const currentDb = this.loadDatabase();
      await this.syncToFileSystem(currentDb);

      return {
        success: true,
        folderName: directoryHandle.name,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, folderName: '', error: 'تم إلغاء عملية اختيار المجلد' };
      }
      return {
        success: false,
        folderName: '',
        error: err.message || 'حدث خطأ أثناء محاولة الوصول إلى المجلد على القرص المحلي',
      };
    }
  },

  // Write directly to clinic_db.json inside the connected directory
  async syncToFileSystem(db: ClinicDatabase): Promise<boolean> {
    if (!fileHandle) {
      return false;
    }

    try {
      if (fileHandle.queryPermission) {
        const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          const request = await fileHandle.requestPermission({ mode: 'readwrite' });
          if (request !== 'granted') return false;
        }
      }

      const writableStream = await fileHandle.createWritable();
      const jsonString = JSON.stringify(db, null, 2);
      await writableStream.write(jsonString);
      await writableStream.close();
      return true;
    } catch (err) {
      console.error('Failed writing to local file system:', err);
      return false;
    }
  },

  // Check current sync status
  getSyncStatus(settingsDirectoryName?: string): SyncStatus {
    const isSupported = this.isFileSystemSupported();
    const isConnected = !!fileHandle && !!directoryHandle;
    return {
      isSupported,
      isConnected,
      folderName: directoryHandle ? directoryHandle.name : (settingsDirectoryName || ''),
      lastSyncedAt: isConnected ? new Date().toISOString() : null,
    };
  },

  // Disconnect local folder
  disconnectLocalDirectory(): void {
    directoryHandle = null;
    fileHandle = null;
  },

  // Export full JSON database for manual download
  exportJsonBackup(db: ClinicDatabase): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateFormatted = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clinic_db_backup_${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Parse imported JSON
  parseImportedJson(jsonText: string): ClinicDatabase {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !parsed.settings || !Array.isArray(parsed.patients)) {
      throw new Error('الملف المستورد لا يحتوي على بنية بيانات العيادة الصحيحة.');
    }
    return {
      ...INITIAL_DATABASE,
      ...parsed,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      doctors: Array.isArray(parsed.doctors) ? parsed.doctors : INITIAL_DATABASE.doctors,
      patients: Array.isArray(parsed.patients) ? parsed.patients : [],
      services: Array.isArray(parsed.services) ? parsed.services : INITIAL_DATABASE.services,
      users: Array.isArray(parsed.users) ? parsed.users : INITIAL_DATABASE.users,
    };
  },

  // Reset to default sample database
  resetToDefault(): ClinicDatabase {
    this.saveDatabase(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  },
};
