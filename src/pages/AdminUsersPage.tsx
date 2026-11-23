import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  Ban,
  UserCheck,
  RotateCcw,
  Sliders,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { adminUsersApi, ScoreLog } from '../services/api';
import { User } from '../types';
import { DatePill } from '../components/layout/DatePill';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'peringatan' | 'banned'>('semua');
  const [roleFilter, setRoleFilter] = useState<'semua' | 'mahasiswa' | 'admin'>('mahasiswa');

  // Modal 1: Koreksi Skor
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [newScore, setNewScore] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Modal 2: Cabut Banned (Unban)
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [unbanTargetUser, setUnbanTargetUser] = useState<User | null>(null);
  const [unbanReason, setUnbanReason] = useState('Banned dicabut setelah verifikasi admin.');
  const [isSubmittingUnban, setIsSubmittingUnban] = useState(false);
  const [unbanError, setUnbanError] = useState<string | null>(null);

  // Modal 3: Riwayat Log Skor
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsTargetUser, setLogsTargetUser] = useState<User | null>(null);
  const [scoreLogs, setScoreLogs] = useState<ScoreLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch users from live DB
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await adminUsersApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Gagal memuat data pengguna dari DB:', err);
      setFetchError(
        err?.response?.data?.message || 'Gagal memuat daftar pengguna dari server backend.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Summary counts
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const mahasiswaList = users.filter((u) => u.role === 'mahasiswa');
    const countActive = mahasiswaList.filter((u) => u.credit_score >= 80).length;
    const countWarning = mahasiswaList.filter((u) => u.credit_score >= 60 && u.credit_score < 80).length;
    const countBanned = mahasiswaList.filter((u) => u.credit_score < 60 || u.status === 'banned').length;

    return {
      total: totalUsers,
      totalMahasiswa: mahasiswaList.length,
      active: countActive,
      warning: countWarning,
      banned: countBanned,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'semua' && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'aktif' && (u.credit_score < 80 || u.status === 'banned')) {
        return false;
      }
      if (statusFilter === 'peringatan' && (u.credit_score < 60 || u.credit_score >= 80 || u.status === 'banned')) {
        return false;
      }
      if (statusFilter === 'banned' && u.credit_score >= 60 && u.status !== 'banned') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchNim = (u.nim || u.number_id || '')?.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchNim) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Handle open adjust score modal
  const handleOpenAdjust = (user: User) => {
    setTargetUser(user);
    setNewScore(user.credit_score ?? 100);
    setAdjustReason('');
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  // Submit adjust score
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    if (newScore < 0 || newScore > 100) {
      setAdjustError('Skor harus berada dalam rentang 0 hingga 100.');
      return;
    }

    const trimmedReason = adjustReason.trim();
    if (trimmedReason.length < 5) {
      setAdjustError('Alasan penyesuaian skor wajib diisi minimal 5 karakter.');
      return;
    }

    try {
      setIsSubmittingAdjust(true);
      setAdjustError(null);
      await adminUsersApi.adjustScore(targetUser.id, Math.round(newScore), trimmedReason);
      showToast(`Credit score ${targetUser.name} berhasil diubah menjadi ${newScore}.`, 'success');
      setAdjustModalOpen(false);
      setTargetUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Gagal menyesuaikan skor:', err);
      setAdjustError(
        err?.response?.data?.message || 'Gagal menyesuaikan credit score pengguna.'
      );
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Handle open unban modal
  const handleOpenUnban = (user: User) => {
    setUnbanTargetUser(user);
    setUnbanReason('Banned dicabut setelah verifikasi admin.');
    setUnbanError(null);
    setUnbanModalOpen(true);
  };

  // Submit unban
  const handleConfirmUnban = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unbanTargetUser) return;

    const trimmedReason = unbanReason.trim();
    if (trimmedReason.length < 5) {
      setUnbanError('Alasan pencabutan banned wajib diisi minimal 5 karakter.');
      return;
    }

    try {
      setIsSubmittingUnban(true);
      setUnbanError(null);
      await adminUsersApi.unbanUser(unbanTargetUser.id, trimmedReason);
      showToast(`Status banned ${unbanTargetUser.name} berhasil dicabut (Skor di-reset ke 60).`, 'success');
      setUnbanModalOpen(false);
      setUnbanTargetUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Gagal mencabut status banned:', err);
      setUnbanError(
        err?.response?.data?.message || 'Gagal mencabut status banned pengguna.'
      );
    } finally {
      setIsSubmittingUnban(false);
    }
  };

  // Handle open logs modal
  const handleOpenLogs = async (user: User) => {
    setLogsTargetUser(user);
    setLogsModalOpen(true);
    setLogsError(null);
    setIsLoadingLogs(true);
    try {
      const logs = await adminUsersApi.getUserScoreLogs(user.id);
      setScoreLogs(logs);
    } catch (err: any) {
      console.error('Gagal memuat log skor pengguna:', err);
      setLogsError('Gagal memuat riwayat log credit score pengguna.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-['Poppins'] text-[13.5px] font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-12 pb-16 w-full max-w-[1600px] mx-auto">
        {/* Header Row */}
        <div className="flex flex-row items-center justify-between w-full mb-6 sm:mb-7 gap-3 min-h-[44px]">
          <div>
            <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-tight pb-0.5">
              Pengguna & Credit Score
            </h1>
            <p className="font-['Poppins'] text-[13px] sm:text-[14px] text-[#718096] mt-0.5">
              Kelola reputasi kepatuhan peminjaman ruangan, batasan kuota, dan status akun mahasiswa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#093697] text-[#093697] rounded-xl text-[13px] font-medium transition cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
              title="Refresh Data dari DB"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <DatePill />
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
          {/* Card 1: Total Pengguna */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="font-['Poppins'] text-[12px] sm:text-[13px] font-medium text-[#718096]">
                Total Pengguna
              </p>
              <p className="font-['Poppins'] text-[24px] sm:text-[28px] font-bold text-[#0B0C0F] mt-0.5">
                {stats.total}
              </p>
              <p className="font-['Poppins'] text-[11px] text-[#A0AEC0] mt-0.5">
                {stats.totalMahasiswa} Mahasiswa terdaftar
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#093697] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Akun Aktif */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="font-['Poppins'] text-[12px] sm:text-[13px] font-medium text-[#718096]">
                Aktif (≥80)
              </p>
              <p className="font-['Poppins'] text-[24px] sm:text-[28px] font-bold text-emerald-600 mt-0.5">
                {stats.active}
              </p>
              <p className="font-['Poppins'] text-[11px] text-emerald-600/80 mt-0.5">
                Maks 2 booking aktif
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Akun Peringatan */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="font-['Poppins'] text-[12px] sm:text-[13px] font-medium text-[#718096]">
                Peringatan (60-79)
              </p>
              <p className="font-['Poppins'] text-[24px] sm:text-[28px] font-bold text-amber-500 mt-0.5">
                {stats.warning}
              </p>
              <p className="font-['Poppins'] text-[11px] text-amber-600 mt-0.5">
                Dibatasi 1 booking aktif
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Akun Banned */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="font-['Poppins'] text-[12px] sm:text-[13px] font-medium text-[#718096]">
                Banned (&lt;60)
              </p>
              <p className="font-['Poppins'] text-[24px] sm:text-[28px] font-bold text-rose-600 mt-0.5">
                {stats.banned}
              </p>
              <p className="font-['Poppins'] text-[11px] text-rose-600 mt-0.5">
                Akun dibekukan (0 booking)
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Filter Tabs Status */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('semua')}
                className={`font-['Poppins'] text-[13px] sm:text-[13.5px] px-4 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'semua'
                    ? 'bg-[#093697] text-white font-medium shadow-xs'
                    : 'text-[#4A5568] hover:bg-slate-100'
                }`}
              >
                Semua ({stats.totalMahasiswa})
              </button>
              <button
                onClick={() => setStatusFilter('aktif')}
                className={`font-['Poppins'] text-[13px] sm:text-[13.5px] px-4 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'aktif'
                    ? 'bg-emerald-600 text-white font-medium shadow-xs'
                    : 'text-[#4A5568] hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                Aktif ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter('peringatan')}
                className={`font-['Poppins'] text-[13px] sm:text-[13.5px] px-4 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'peringatan'
                    ? 'bg-amber-500 text-white font-medium shadow-xs'
                    : 'text-[#4A5568] hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                Peringatan ({stats.warning})
              </button>
              <button
                onClick={() => setStatusFilter('banned')}
                className={`font-['Poppins'] text-[13px] sm:text-[13.5px] px-4 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'banned'
                    ? 'bg-rose-600 text-white font-medium shadow-xs'
                    : 'text-[#4A5568] hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                Banned ({stats.banned})
              </button>
            </div>

            {/* Role Filter & Search Field */}
            <div className="flex items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-['Poppins'] text-[#2D3748] focus:outline-hidden focus:border-[#093697] transition"
              >
                <option value="mahasiswa">Role: Mahasiswa</option>
                <option value="semua">Role: Semua Role</option>
                <option value="admin">Role: Admin</option>
              </select>

              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari Nama / NIM / Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-['Poppins'] placeholder:text-gray-400 focus:outline-hidden focus:border-[#093697] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {fetchError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-['Poppins'] text-[13.5px] font-medium">{fetchError}</p>
            </div>
            <button
              onClick={loadUsers}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[12.5px] font-medium hover:bg-rose-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Users Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-[#093697] animate-spin mb-3" />
              <p className="font-['Poppins'] text-[14px] text-[#718096]">
                Memuat data pengguna dari live database...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-['Poppins'] text-[15px] font-semibold text-[#2D3748]">
                Tidak ada pengguna ditemukan
              </p>
              <p className="font-['Poppins'] text-[13px] text-[#718096] mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada hasil yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Belum ada pengguna pada kriteria filter ini.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-[#093697] text-[13px] font-medium hover:underline"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#093697] text-white">
                    <th className="py-3.5 px-4 font-['Poppins'] text-[13px] font-semibold tracking-wide w-12 text-center">
                      No
                    </th>
                    <th className="py-3.5 px-5 font-['Poppins'] text-[13px] font-semibold tracking-wide min-w-[240px]">
                      Pengguna
                    </th>
                    <th className="py-3.5 px-4 font-['Poppins'] text-[13px] font-semibold tracking-wide">
                      NIM / ID
                    </th>
                    <th className="py-3.5 px-4 font-['Poppins'] text-[13px] font-semibold tracking-wide">
                      Role
                    </th>
                    <th className="py-3.5 px-5 font-['Poppins'] text-[13px] font-semibold tracking-wide min-w-[180px]">
                      Credit Score
                    </th>
                    <th className="py-3.5 px-4 font-['Poppins'] text-[13px] font-semibold tracking-wide">
                      Status Akun
                    </th>
                    <th className="py-3.5 px-5 font-['Poppins'] text-[13px] font-semibold tracking-wide text-right min-w-[180px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user, index) => {
                    const score = user.credit_score ?? 100;
                    const isBanned = user.status === 'banned' || score < 60;
                    const isWarning = score >= 60 && score < 80;
                    const isActive = score >= 80 && !isBanned;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-4 px-4 text-center font-['Poppins'] text-[13px] text-gray-500">
                          {index + 1}
                        </td>

                        {/* Pengguna (Avatar, Nama, Email) */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#093697] to-[#1E56C8] text-white font-['Poppins'] font-semibold text-[14px] flex items-center justify-center shrink-0 shadow-2xs">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-['Poppins'] font-semibold text-[13.5px] text-[#1A202C] leading-snug truncate">
                                {user.name}
                              </p>
                              <p className="font-['Poppins'] text-[12px] text-[#718096] truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* NIM / ID */}
                        <td className="py-4 px-4 font-['Poppins'] text-[13px] text-[#2D3748] font-mono">
                          {user.nim || user.number_id || '-'}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-['Poppins'] font-medium capitalize ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Credit Score & Progress Meter */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`font-['Poppins'] font-bold text-[14px] ${
                                    isActive
                                      ? 'text-emerald-600'
                                      : isWarning
                                      ? 'text-amber-600'
                                      : 'text-rose-600'
                                  }`}
                                >
                                  {score}{' '}
                                  <span className="text-[11px] font-normal text-gray-400">/ 100</span>
                                </span>
                              </div>
                              {/* Visual Progress Bar */}
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isActive
                                      ? 'bg-emerald-500'
                                      : isWarning
                                      ? 'bg-amber-400'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Akun */}
                        <td className="py-4 px-4">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-['Poppins'] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3.5 h-3.5" />
                              Banned
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-['Poppins'] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Peringatan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-['Poppins'] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Aktif
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Koreksi Skor */}
                            <button
                              onClick={() => handleOpenAdjust(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-['Poppins'] font-medium bg-blue-50 text-[#093697] hover:bg-[#093697] hover:text-white transition cursor-pointer"
                              title="Koreksi Credit Score"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              Koreksi
                            </button>

                            {/* Tombol Cabut Banned (hanya jika banned) */}
                            {isBanned && (
                              <button
                                onClick={() => handleOpenUnban(user)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-['Poppins'] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                                title="Cabut Sanksi Banned (Reset ke 60)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Unban
                              </button>
                            )}

                            {/* Tombol Riwayat Log */}
                            <button
                              onClick={() => handleOpenLogs(user)}
                              className="inline-flex items-center gap-1.5 p-1.5 rounded-lg text-slate-500 hover:text-[#093697] hover:bg-slate-100 transition cursor-pointer"
                              title="Lihat Riwayat Log Skor"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: KOREKSI CREDIT SCORE                             */}
      {/* ========================================================= */}
      {adjustModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#093697] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#ECCA2E]" />
                <h3 className="font-['Poppins'] font-semibold text-[16px]">
                  Koreksi Credit Score
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmAdjust} className="p-6 space-y-4">
              {/* User Info Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#1A202C]">
                  {targetUser.name}
                </p>
                <div className="flex items-center gap-3 text-[12px] font-['Poppins'] text-[#718096] mt-0.5">
                  <span>NIM: {targetUser.nim || targetUser.number_id || '-'}</span>
                  <span>•</span>
                  <span>
                    Skor Saat Ini:{' '}
                    <strong className="text-[#093697]">{targetUser.credit_score ?? 100}</strong>
                  </span>
                </div>
              </div>

              {/* Quick Delta Preset Helpers */}
              <div>
                <label className="block font-['Poppins'] text-[12.5px] font-medium text-[#4A5568] mb-1.5">
                  Preset Cepat Penalti & Pemulihan:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewScore(Math.max(0, (targetUser.credit_score ?? 100) - 10))}
                    className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    -10 (Batal &lt;H-3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScore(Math.max(0, (targetUser.credit_score ?? 100) - 15))}
                    className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    -15 (Tanpa Konfirm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScore(Math.max(0, (targetUser.credit_score ?? 100) - 20))}
                    className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    -20 (Kerusakan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScore(Math.max(0, (targetUser.credit_score ?? 100) - 25))}
                    className="px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    -25 (No-Show)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScore(Math.min(100, (targetUser.credit_score ?? 100) + 5))}
                    className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    +5 (Bulan Bersih)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScore(100)}
                    className="px-2 py-1.5 bg-blue-50 text-[#093697] hover:bg-blue-100 rounded-lg text-[11px] font-['Poppins'] font-medium transition"
                  >
                    Reset (100)
                  </button>
                </div>
              </div>

              {/* Input New Score */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-['Poppins'] text-[13px] font-medium text-[#2D3748]">
                    Nilai Skor Baru (0 - 100):
                  </label>
                  <span
                    className={`font-['Poppins'] font-bold text-[14px] ${
                      newScore >= 80
                        ? 'text-emerald-600'
                        : newScore >= 60
                        ? 'text-amber-500'
                        : 'text-rose-600'
                    }`}
                  >
                    {newScore}{' '}
                    <span className="text-[11.5px] font-normal">
                      ({newScore >= 80 ? 'Aktif' : newScore >= 60 ? 'Peringatan' : 'Banned'})
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="flex-1 accent-[#093697] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-18 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13.5px] font-['Poppins'] text-center font-bold text-[#093697] focus:outline-hidden focus:border-[#093697]"
                  />
                </div>
              </div>

              {/* Textarea Reason */}
              <div>
                <label className="block font-['Poppins'] text-[13px] font-medium text-[#2D3748] mb-1">
                  Alasan Penyesuaian Skor <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Koreksi pelanggaran setelah klarifikasi bukti izin kegiatan..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-['Poppins'] placeholder:text-gray-400 focus:outline-hidden focus:border-[#093697] transition"
                />
                <span className="text-[11px] font-['Poppins'] text-gray-400">
                  Minimal 5 karakter (wajib dicatat untuk transparansi audit).
                </span>
              </div>

              {/* Error Alert */}
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[12.5px] font-['Poppins']">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 text-gray-600 hover:bg-slate-100 rounded-xl text-[13px] font-['Poppins'] transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 bg-[#093697] hover:bg-[#072a75] text-white rounded-xl text-[13px] font-['Poppins'] font-medium transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingAdjust ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Skor</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CABUT BANNED (UNBAN USER)                        */}
      {/* ========================================================= */}
      {unbanModalOpen && unbanTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-white" />
                <h3 className="font-['Poppins'] font-semibold text-[16px]">
                  Cabut Status Banned
                </h3>
              </div>
              <button
                onClick={() => setUnbanModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmUnban} className="p-6 space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[13px] font-['Poppins']">
                <p className="font-semibold mb-1">Ketentuan Aturan BR-20:</p>
                <p className="text-[12px] leading-relaxed">
                  Mencabut status banned akan mengembalikan akun <strong>{unbanTargetUser.name}</strong> ke
                  status <em>Peringatan</em> dengan credit score di-reset otomatis menjadi <strong>60</strong>{' '}
                  (kuota 1 booking aktif).
                </p>
              </div>

              <div>
                <label className="block font-['Poppins'] text-[13px] font-medium text-[#2D3748] mb-1">
                  Alasan Pencabutan Banned <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={unbanReason}
                  onChange={(e) => setUnbanReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-['Poppins'] focus:outline-hidden focus:border-emerald-600 transition"
                  placeholder="Banned dicabut setelah verifikasi admin..."
                />
              </div>

              {unbanError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[12.5px] font-['Poppins']">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{unbanError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setUnbanModalOpen(false)}
                  disabled={isSubmittingUnban}
                  className="px-4 py-2 text-gray-600 hover:bg-slate-100 rounded-xl text-[13px] font-['Poppins'] transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUnban}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-['Poppins'] font-medium transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingUnban ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Unban</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RIWAYAT LOG CREDIT SCORE                         */}
      {/* ========================================================= */}
      {logsModalOpen && logsTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#093697] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#ECCA2E]" />
                <h3 className="font-['Poppins'] font-semibold text-[16px]">
                  Riwayat Log Credit Score
                </h3>
              </div>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Header Info */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#1A202C]">
                  {logsTargetUser.name}
                </p>
                <p className="font-['Poppins'] text-[12px] text-[#718096]">
                  NIM: {logsTargetUser.nim || logsTargetUser.number_id || '-'} • Email: {logsTargetUser.email}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-400 block font-['Poppins']">Skor Saat Ini:</span>
                <span className="font-['Poppins'] font-bold text-[16px] text-[#093697]">
                  {logsTargetUser.credit_score ?? 100} Poin
                </span>
              </div>
            </div>

            {/* Logs List Area */}
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-7 h-7 text-[#093697] animate-spin mb-2" />
                  <p className="font-['Poppins'] text-[13px] text-[#718096]">
                    Mengambil log riwayat skor dari backend...
                  </p>
                </div>
              ) : logsError ? (
                <div className="p-4 bg-rose-50 text-rose-700 text-center rounded-xl text-[13px] font-['Poppins']">
                  {logsError}
                </div>
              ) : scoreLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-['Poppins'] text-[14px] font-medium text-[#2D3748]">
                    Belum ada riwayat pelanggaran atau penyesuaian skor.
                  </p>
                  <p className="font-['Poppins'] text-[12px] text-[#718096] mt-0.5">
                    Mahasiswa ini memiliki catatan kepatuhan bersih.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scoreLogs.map((log) => {
                    const delta = log.points_delta ?? log.delta ?? log.change ?? 0;
                    const isPositive = delta > 0;
                    const formattedDate = log.created_at
                      ? new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Tanggal sistem';

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-['Poppins'] text-[11.5px] font-semibold text-[#093697] uppercase tracking-wider">
                              {log.event_type || 'Koreksi Admin'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="font-['Poppins'] text-[11px] text-[#A0AEC0]">
                              {formattedDate}
                            </span>
                          </div>
                          <p className="font-['Poppins'] text-[13px] text-[#2D3748] leading-relaxed">
                            {log.note || log.reason || 'Penyesuaian skor administratif.'}
                          </p>
                          {log.creator && (
                            <p className="font-['Poppins'] text-[11px] text-[#718096] mt-1">
                              Oleh: <span className="font-medium">{log.creator.name}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-['Poppins'] font-bold text-[13px] ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPositive ? `+${delta}` : delta}
                          </span>
                          {log.score_after !== undefined && (
                            <span className="block text-[11px] font-['Poppins'] text-gray-500 mt-1">
                              Sisa: {log.score_after}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLogsModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-[#2D3748] rounded-xl text-[13px] font-['Poppins'] font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
