import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#F5F8FF]">
      {/* Mobile Top Header (hanya muncul di layar mobile/tablet < lg) */}
      <header className="lg:hidden sticky top-0 z-30 h-[56px] bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center">
          <span className="font-['Poppins'] text-[24px] font-semibold text-[#0B0C0F] leading-none">
            UII
          </span>
          <span className="font-['Poppins'] text-[24px] font-semibold text-[#ECCA2E] leading-none">
            Ruang
          </span>
          <span className="ml-2 text-[11px] bg-blue-100 text-[#093697] font-semibold px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-[#093697] hover:bg-blue-50 rounded-lg transition cursor-pointer"
          title="Buka Menu Navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Admin Sidebar */}
      <AdminSidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Main Admin Content Area */}
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
