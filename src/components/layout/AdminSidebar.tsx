import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings, X, UserSearch } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

      {/* Profile Box Admin di Bawah: Display Info, Tombol Gerigi untuk Frame 37907 */}
      <div className="relative px-3 pb-5 pt-3 flex items-center justify-between w-full border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5 select-none">
          <img
            src={iconAvatar}
            alt="Profile Avatar"
            className="w-[42px] h-[42px] rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-['Poppins'] text-[12px] font-medium text-[#0B0C0F] leading-tight truncate">
              {currentUser?.name || 'Facility Admin'}
            </span>
            <span className="font-['Poppins'] text-[10.5px] text-[#727272] leading-tight mt-0.5 truncate">
              ID. {currentUser?.number_id || currentUser?.nim || 'Admin'}
            </span>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`cursor-pointer transition p-2 rounded-lg shrink-0 ${
              isMenuOpen
                ? 'bg-blue-50 text-[#093697]'
                : 'text-[#454545] hover:text-[#093697] hover:bg-slate-100'
            }`}
            title="Pengaturan Admin"
            aria-label="Pengaturan Admin"
            aria-expanded={isMenuOpen}
          >
            <Settings className="w-[20px] h-[20px] shrink-0 stroke-[2]" />
          </button>

          {/* Frame 37907: Menu Popup Admin (Lihat Profil & Log Out) */}
          {isMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] right-0 w-[190px] bg-white border border-[#BABABA] rounded-[14px] shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onClose) onClose();
                  navigate('/admin/profil');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <UserSearch
                  className="w-5 h-5 text-[#333333] group-hover:text-[#093697] shrink-0 transition-colors"
                  strokeWidth={1.8}
                />
                <span className="font-['Poppins'] text-[14px] font-medium text-[#333333] group-hover:text-[#093697] transition-colors">
                  Lihat Profil
                </span>
              </button>

              <div className="border-t border-[#BABABA]/50 w-full" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onClose) onClose();
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50 transition-colors group cursor-pointer"
              >
                <LogOut
                  className="w-5 h-5 text-[#333333] group-hover:text-rose-600 shrink-0 transition-colors"
                  strokeWidth={1.8}
                />
                <span className="font-['Poppins'] text-[14px] font-medium text-[#333333] group-hover:text-rose-600 transition-colors">
                  Log Out
                </span>
              </button>
            </div>
          )}
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
