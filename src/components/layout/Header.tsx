import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { selectedDate, setSelectedDate } = useBooking();

  const handleWhatsAppClick = () => {
    // Admin WhatsApp support per FR-15 / D-17
    const adminPhone = '6281234567890';
    const message = encodeURIComponent(
      'Halo Admin BSI UII, saya ingin menanyakan perihal peminjaman ruangan di UIIRuang.'
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  return (
    <header className="h-[80px] px-8 flex items-center justify-between border-b border-[#EAEFF8] bg-[#F5F8FF]">
      <div>
        <h1 className="text-[28px] font-bold text-[#093697] leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-[12px] text-[#727272] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Selector Badge */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-[#D5E0F2] shadow-sm">
          <Calendar className="w-4 h-4 text-[#093697]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[13px] font-medium text-[#0B0C0F] bg-transparent outline-none cursor-pointer"
          />
        </div>

        {/* WhatsApp Hubungi Admin Button (FR-15 / D-17 mandatory) */}
        <button
          onClick={handleWhatsAppClick}
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-all shadow-sm hover:shadow active:scale-95"
          title="Hubungi Admin Pengelola via WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Hubungi Admin</span>
        </button>
      </div>
    </header>
  );
};
