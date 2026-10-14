import React from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { BookAppointmentTab } from './components/bookings/BookAppointmentTab';
import { MyBookingsTab } from './components/bookings/MyBookingsTab';
import { MedicalRecordsTab } from './components/medical/MedicalRecordsTab';
import { PaymentsTab } from './components/payments/PaymentsTab';
import { NotificationsTab } from './components/notifications/NotificationsTab';
import { ClientsTab } from './components/clients/ClientsTab';
import { SettingsTab } from './components/settings/SettingsTab';

const ClinicApp: React.FC = () => {
  const { currentUser, activeTab } = useClinic();

  if (!currentUser) {
    return <LoginModal />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'book':
        return <BookAppointmentTab />;
      case 'my_bookings':
        return <MyBookingsTab />;
      case 'medical_records':
        return <MedicalRecordsTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'clients':
        return <ClientsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Windows 10 Aero Glass background ambient glow lights */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* 2. Top Header with 12-hour AM/PM real-time clock, Day name & Full Arabic Date */}
      <Header />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* 4. Windows 10 Aero Sidebar (filters strictly per currentUser.allowedTabs) */}
        <Sidebar />

        {/* 5. Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="max-w-7xl mx-auto pb-12">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <ClinicApp />
    </ClinicProvider>
  );
}
