import React, { useState } from 'react';
import {
  Search,
  Check,
  Wrench,
  Eye,
  X,
  Camera,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { DamageReport } from '../types';
import { DatePill } from '../components/layout/DatePill';

export const DamageReportPage: React.FC = () => {
  const { damageReports, resolveDamageReport } = useBooking();

  const [activeTab, setActiveTab] = useState<'semua' | 'dilaporkan' | 'ditangani' | 'selesai'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Detail Laporan
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);

  // Modal Resolve State (Admin menentukan kelalaian BR-14)
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [cause, setCause] = useState<'lalai' | 'bukan_lalai'>('bukan_lalai');

  const filteredReports = damageReports.filter((r) => {
    const matchesTab = activeTab === 'semua' ? true : r.status === activeTab;
    const matchesSearch =
      r.reporter?.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const countNew = damageReports.filter((r) => r.status === 'dilaporkan').length;
  const countInProgress = damageReports.filter((r) => r.status === 'ditangani').length;
  const countResolved = damageReports.filter((r) => r.status === 'selesai').length;
  const countAll = damageReports.length;

  const handleStartRepair = (reportId: number) => {
    const report = damageReports.find((r) => r.id === reportId);
    if (report) {
      report.status = 'ditangani';
    }
  };

  const handleOpenResolve = (report: DamageReport) => {
    setSelectedReport(report);
    setCause('bukan_lalai');
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    resolveDamageReport(selectedReport.id, cause);
    setResolveModalOpen(false);
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Full Screen Responsive Content Wrapper */}
      <div className="pt-[88px] px-8 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="font-['Poppins'] font-bold text-[32px] text-[#093697] leading-none">
            Laporan Kerusakan
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* Filter Tabs (Figma exact): Laporan Baru 1 | Semua 4 | Lagi Diperbaiki 1 | Selesai 2 */}
        <div className="flex items-center gap-4 lg:gap-6 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('dilaporkan')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'dilaporkan'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Laporan Baru {countNew}
          </button>

          <button
            onClick={() => setActiveTab('semua')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'semua'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Semua {countAll}
          </button>

          <button
            onClick={() => setActiveTab('ditangani')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'ditangani'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Lagi Diperbaiki {countInProgress}
          </button>

          <button
            onClick={() => setActiveTab('selesai')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'selesai'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Selesai {countResolved}
          </button>
        </div>

        {/* Search Bar: Full width */}
        <div className="w-full bg-white border border-[#E2E8F0] rounded-[8px] h-[48px] flex items-center px-4 gap-3 mb-6 shadow-xs">
          <Search className="w-5 h-5 text-[#BABABA] shrink-0" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama Ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-['Poppins'] text-[14px] text-[#0B0C0F] placeholder:text-[#BABABA]"
          />
        </div>

        {/* Table Laporan Kerusakan: Stretches 100% Full Screen */}
        <div className="w-full bg-white rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
          {/* Header Table: Biru #093697 spanning full width */}
          <div className="bg-[#093697] text-white h-[48px] flex items-center px-6 font-['Poppins'] text-[14px] font-medium">
            <span className="w-[15%] min-w-[120px]">NIM Pelapor</span>
            <span className="w-[18%] min-w-[150px]">Ruangan</span>
            <span className="w-[20%] min-w-[160px]">Kategori Masalah</span>
            <span className="flex-1 min-w-[180px]">Deskripsi Keluhan</span>
            <span className="w-[15%] min-w-[120px] text-center">Status</span>
            <span className="w-[12%] min-w-[100px] text-center">Aksi</span>
          </div>

          {/* Table Rows: full width */}
          <div className="divide-y divide-[#E2E8F0]">
            {filteredReports.length === 0 ? (
              <div className="py-16 text-center text-[#727272] font-['Poppins'] text-[14px]">
                Belum ada laporan kerusakan.
              </div>
            ) : (
              filteredReports.map((report) => (
              <div
                key={report.id}
                className="min-h-[56px] py-2 flex items-center px-6 font-['Poppins'] text-[13px] text-[#0B0C0F] hover:bg-slate-50 transition"
              >
                <span className="w-[15%] min-w-[120px] font-medium">
                  {report.reporter?.nim || '24523014'}
                </span>
                <span className="w-[18%] min-w-[150px]">
                  {report.room?.name || 'FTI - 3.14 (IFP)'}
                </span>
                <span className="w-[20%] min-w-[160px] text-[#727272]">
                  {report.category || 'AC / Pendingin Ruangan'}
                </span>
                <div className="flex-1 min-w-[180px] flex items-center gap-2 pr-4">
                  <span className="truncate">
                    {report.description}
                  </span>
                  {report.photos && report.photos.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-[#093697] border border-blue-200 shrink-0">
                      📷 Foto
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setDetailModalOpen(true);
                    }}
                    className="text-[#727272] hover:text-[#093697] transition p-1 shrink-0 ml-auto"
                    title="Lihat Foto Bukti & Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Kolom Status */}
                <div className="w-[15%] min-w-[120px] flex items-center justify-center">
                  {report.status === 'dilaporkan' ? (
                    <span className="bg-[#EF4444] text-white px-3.5 py-1.5 rounded-[6px] text-[11px] font-medium">
                      Laporan Baru
                    </span>
                  ) : report.status === 'ditangani' ? (
                    <span className="bg-[#ECCA2E] text-white px-3.5 py-1.5 rounded-[6px] text-[11px] font-medium">
                      Lagi Diperbaiki
                    </span>
                  ) : (
                    <span className="bg-[#14926F] text-white px-3.5 py-1.5 rounded-[6px] text-[11px] font-medium">
                      Selesai
                    </span>
                  )}
                </div>

                {/* Kolom Aksi */}
                <div className="w-[12%] min-w-[100px] flex items-center justify-center gap-2">
                  {report.status === 'dilaporkan' && (
                    <>
                      <button
                        onClick={() => handleStartRepair(report.id)}
                        className="w-8 h-8 rounded-[6px] bg-[#ECCA2E] hover:bg-[#D4B528] text-white flex items-center justify-center transition shadow-xs"
                        title="Tandai Sedang Diperbaiki"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenResolve(report)}
                        className="w-8 h-8 rounded-[6px] bg-[#14926F] hover:bg-[#0E7A5C] text-white flex items-center justify-center transition shadow-xs"
                        title="Tandai Selesai"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {report.status === 'ditangani' && (
                    <button
                      onClick={() => handleOpenResolve(report)}
                      className="w-8 h-8 rounded-[6px] bg-[#14926F] hover:bg-[#0E7A5C] text-white flex items-center justify-center transition shadow-xs"
                      title="Tandai Selesai"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Modal Detail Laporan & Foto Kerusakan */}
      {detailModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-['Poppins'] font-semibold text-lg text-[#0B0C0F]">
                Detail Pengaduan Kerusakan
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-['Poppins'] text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ruangan:</span>
                <span className="font-semibold text-[#093697]">
                  {selectedReport.room?.name} ({selectedReport.room?.building})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Pelapor:</span>
                <span className="font-medium text-[#0B0C0F]">
                  {selectedReport.reporter?.name} (NIM. {selectedReport.reporter?.nim})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-medium text-slate-700">
                  {selectedReport.category || 'AC / Fasilitas Belajar'}
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Keterangan Kerusakan:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed text-xs">
                  {selectedReport.description}
                </p>
              </div>

              {/* Foto Bukti Kerusakan Real Image */}
              <div className="pt-2">
                <span className="text-slate-500 block mb-2 font-medium">Foto Bukti Kerusakan:</span>
                {selectedReport.photos && selectedReport.photos.length > 0 ? (
                  <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative group">
                    <img
                      src={selectedReport.photos[0]}
                      alt="Foto Bukti Kerusakan"
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={selectedReport.photos[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Buka Foto Ukuran Penuh ↗</span>
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <div className="flex flex-col items-center text-slate-400 gap-1">
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Tidak ada lampiran foto dari pelapor</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resolve Report (Investigasi Kelalaian BR-14) */}
      {resolveModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[460px] p-6 shadow-xl border border-slate-100">
            <h3 className="font-['Poppins'] font-semibold text-lg text-[#14926F] mb-1">
              Penyelesaian Laporan Kerusakan
            </h3>
            <p className="font-['Poppins'] text-xs text-slate-500 mb-4">
              Aturan BR-14: Admin memvalidasi apakah kerusakan disebabkan kelalaian peminjam (mempengaruhi Skor Kepatuhan) atau aus wajar.
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4 font-['Poppins']">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Hasil Penyelidikan Kerusakan *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="cause"
                      value="bukan_lalai"
                      checked={cause === 'bukan_lalai'}
                      onChange={() => setCause('bukan_lalai')}
                      className="text-[#14926F]"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        Bukan Kelalaian Pemakai (Aus Alami / Bencana)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Skor Kepatuhan peminjam tetap 100%. Biaya perbaikan ditanggung kampus.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="cause"
                      value="lalai"
                      checked={cause === 'lalai'}
                      onChange={() => setCause('lalai')}
                      className="text-[#CA0004]"
                    />
                    <div>
                      <p className="text-xs font-medium text-red-700">
                        Kelalaian Pemakai (Kekerasan Fisik / Pelanggaran)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Skor kepatuhan peminjam dikurangi -15% &amp; dibekukan sementara.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14926F] hover:bg-[#0E7A5C] text-white rounded-lg text-sm font-medium transition"
                >
                  Tandai Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};