import React, { useState, useEffect } from 'react';

interface DatePillProps {
  dateText?: string;
  includeWeekday?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Komponen DatePill: Menampilkan tanggal real-time dengan format bahasa Indonesia
 * dan styling kapsul oval (rounded-full) persis Figma.
 */
export const DatePill: React.FC<DatePillProps> = ({
  dateText,
  includeWeekday = false,
  className = '',
  textClassName = "font-['Poppins'] font-normal text-[12px] sm:text-[14px] text-[#727272] leading-none whitespace-nowrap",
}) => {
  const formatCurrentDate = () => {
    if (dateText) return dateText;
    const now = new Date();
    if (includeWeekday) {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    }
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  };

  const [currentDate, setCurrentDate] = useState<string>(formatCurrentDate);

  useEffect(() => {
    if (dateText) return;
    const update = () => setCurrentDate(formatCurrentDate());
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [dateText, includeWeekday]);

  return (
    <div
      className={`bg-white border border-[#BABABA] rounded-full px-3 sm:px-6 h-[28px] sm:h-[32px] shrink-0 flex items-center justify-center shadow-xs whitespace-nowrap ${className}`}
    >
      <span className={textClassName}>
        {currentDate}
      </span>
    </div>
  );
};
