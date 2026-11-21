import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, X } from 'lucide-react';
import iconDashboard from '../../assets/icon_dashboard.svg';
import iconCalendar from '../../assets/icon_calendar.svg';
import iconWarning from '../../assets/icon_warning.svg';
import iconAvatar from '../../assets/icon_avatar.svg';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full w-full">
      <div className="w-full">
        {/* Brand Logo UIIRuang Admin (Figma exact: x=12px, y=69px, w=169px, h=47px) */}
        <div className="pt-[48px] lg:pt-[69px] pl-[20px] lg:pl-[12px] h-[110px] lg:h-[140px] flex items-center justify-between pr-4">
          <div className="flex items-center">
            <span className="font-['Poppins'] text-[32px] font-semibold text-[#0B0C0F] leading-none">
              UII
            </span>
            <span className="font-['Poppins'] text-[32px] font-semibold text-[#ECCA2E] leading-none">
              Ruang
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-slate-100 rounded-lg transition"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 3 Nav Items Admin (Dashboard, Persetujuan Peminjaman, Laporan Kerusakan) */}
        <nav className="flex flex-col gap-[20px] lg:gap-[24px] w-full mt-2 lg:mt-0">
          {/* 1. Dashboard */}
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center h-[49px] w-full relative transition-all ${
                isActive ? 'text-[#093697]' : 'text-[#BABABA] hover:text-[#093697]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#093697] rounded-r-[8px]" />
                )}
                <div className="flex items-center gap-[14px] pl-[20px] lg:pl-[24px] pr-3">
                  <img
                    src={iconDashboard}
                    alt=""
                    className="w-[22px] h-[22px] shrink-0"
                    style={{
                      filter: isActive
                        ? 'none'
                        : 'grayscale(100%) opacity(0.6)',
                    }}
                  />
                  <span className="font-['Poppins'] text-[14px] font-normal leading-normal whitespace-nowrap">
                    Dashboard
                  </span>
                </div>
              </>
            )}
          </NavLink>

          {/* 2. Persetujuan Peminjaman */}
          <NavLink
            to="/admin/approval"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center h-[49px] w-full relative transition-all ${
                isActive ? 'text-[#093697]' : 'text-[#BABABA] hover:text-[#093697]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#093697] rounded-r-[8px]" />
                )}
                <div className="flex items-center gap-[14px] pl-[20px] lg:pl-[24px] pr-3">
                  <img
                    src={iconCalendar}
                    alt=""
                    className="w-[22px] h-[22px] shrink-0"
                    style={{
                      filter: isActive
                        ? 'invert(16%) sepia(85%) saturate(3040%) hue-rotate(217deg) brightness(91%) contrast(98%)'
                        : 'none',
                    }}
                  />
                  <span className="font-['Poppins'] text-[14px] font-normal leading-normal whitespace-nowrap">
                    Persetujuan Peminjaman
                  </span>
                </div>
              </>
            )}
          </NavLink>

          {/* 3. Laporan Kerusakan */}
          <NavLink
            to="/admin/laporan"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center h-[49px] w-full relative transition-all ${
                isActive ? 'text-[#093697]' : 'text-[#BABABA] hover:text-[#093697]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#093697] rounded-r-[8px]" />
                )}
                <div className="flex items-center gap-[14px] pl-[20px] lg:pl-[24px] pr-3">
                  <img
                    src={iconWarning}
                    alt=""
                    className="w-[22px] h-[22px] shrink-0"
                    style={{
                      filter: isActive
                        ? 'invert(16%) sepia(85%) saturate(3040%) hue-rotate(217deg) brightness(91%) contrast(98%)'
                        : 'none',
                    }}
                  />
                  <span className="font-['Poppins'] text-[14px] font-normal leading-normal whitespace-nowrap">
                    Laporan Kerusakan
                  </span>
                </div>
              </>
            )}
          </NavLink>
        </nav>
      </div>

      {/* Profile Box Admin di Bawah */}
      <div className="px-3 pb-5 pt-3 flex items-center justify-between w-full border-t border-slate-100 bg-white">
        <Link
          to="/admin/profil"
          onClick={onClose}
          className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer min-w-0 flex-1 mr-1.5 group"
          title="Buka Profil Admin"
        >
          <img
            src={iconAvatar}
            alt="Profile Avatar"
            className="w-[42px] h-[42px] rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-['Poppins'] text-[12px] font-medium text-[#0B0C0F] group-hover:text-[#093697] transition leading-tight truncate">
              {currentUser?.name || 'Facility Admin'}
            </span>
            <span className="font-['Poppins'] text-[10.5px] text-[#727272] leading-tight mt-0.5 truncate">
              ID. {currentUser?.number_id || currentUser?.nim || 'Admin'}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              if (onClose) onClose();
              handleLogout();
            }}
            className="cursor-pointer text-[#727272] hover:text-rose-600 transition p-1.5 rounded-md hover:bg-rose-50 shrink-0"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
          <Link
            to="/admin/profil"
            onClick={onClose}
            className="cursor-pointer text-[#454545] hover:text-[#093697] transition p-1.5 rounded-md hover:bg-blue-50 shrink-0"
            title="Pengaturan Profil Admin"
          >
            <Settings className="w-[19px] h-[19px] shrink-0 stroke-[2]" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Tampilan Desktop: Sticky top-0 h-screen */}
      <aside className="hidden lg:flex w-[275px] min-w-[275px] sticky top-0 h-screen bg-white flex-col justify-between border-r border-[#E2E8F0] select-none z-20 shrink-0">
        {navContent}
      </aside>

      {/* 2. Tampilan Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[275px] max-w-[85vw] bg-white z-10 flex flex-col justify-between border-r border-[#E2E8F0] shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
