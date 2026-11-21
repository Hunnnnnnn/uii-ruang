import React from 'react';
import iconAvatar from '../assets/icon_avatar.svg';
import { useAuth } from '../context/AuthContext';
import { DatePill } from '../components/layout/DatePill';

export const AdminProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none font-['Poppins']">
      {/* Responsive Content Wrapper */}
      <div className="pt-6 sm:pt-8 lg:pt-[88px] px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Title on Left & Date Pill on Right */}
        <div className="flex flex-row items-center justify-between w-full mb-6 sm:mb-8 gap-2">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-none truncate">
            Profil Admin
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* Card: Informasi Admin (Figma Exact Match) */}
        <div className="w-full max-w-[460px] bg-white border border-[#BABABA] rounded-[16px] p-7 sm:p-8 shadow-xs">
          {/* Profile Avatar */}
          <div className="mb-3">
            <img
              src={iconAvatar}
              alt="Profile Avatar"
              className="w-[62px] h-[62px] object-contain"
            />
          </div>

          {/* Subtitle */}
          <span className="font-['Poppins'] text-[15px] font-normal text-[#727272] block mb-4">
            Informasi Admin
          </span>

          {/* Field 1: Nama Lengkap */}
          <div className="mb-3.5">
            <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
              Nama Lengkap
            </label>
            <div className="w-full h-[44px] px-4 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[14px] text-[#0B0C0F] font-medium">
              {currentUser?.name || 'Syafiq Nur Wahyudi'}
            </div>
          </div>

          {/* Field 2 & 3: Email UII & ID Pegawai (2 Kolom Berdampingan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email UII */}
            <div>
              <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
                Email UII
              </label>
              <div
                className="w-full h-[44px] px-3.5 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[12px] sm:text-[13px] text-[#0B0C0F] font-medium truncate"
                title={currentUser?.email || '24523014@uii.ac.id'}
              >
                {currentUser?.email || '24523014@uii.ac.id'}
              </div>
            </div>

            {/* ID Pegawai */}
            <div>
              <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
                ID Pegawai
              </label>
              <div className="w-full h-[44px] px-3.5 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[13px] text-[#0B0C0F] font-medium">
                {currentUser?.nim || '24523014'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
