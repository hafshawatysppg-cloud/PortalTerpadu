import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Shield, 
  Search, 
  Filter,
  Key, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  Lock,
  Camera,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_AVATARS = [
  { label: 'Admin Pria 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { label: 'Admin Wanita 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { label: 'Staf Dapur 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { label: 'Staf Pria 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { label: 'Staf Wanita 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { label: 'Logistik', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
];

export const UserManagementView: React.FC = () => {
  const { user: currentUser, updateCurrentUserProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Cek apakah user yang login adalah Admin Penuh / Super Admin / Administrator Utama
  const isAdminPenuh = !currentUser || 
    currentUser.role === 'Admin Penuh' || 
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Admin' ||
    currentUser.username === 'dapurhafshawaty' || 
    currentUser.username === 'superadmin';

  // State untuk toggle visibilitas password per user di tabel
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordsMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyPassword = (userId: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 1500);
  };

  // Realtime Firestore synchronization for user management
  const { data: realtimeUsers } = useFirestoreRealtime<User>('users');

  useEffect(() => {
    if (realtimeUsers && realtimeUsers.length > 0) {
      setUsers(realtimeUsers);
    }
  }, [realtimeUsers]);

  const [showPassword, setShowPassword] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const [form, setForm] = useState({
    nama: '',
    username: '',
    email: '',
    role: 'Operator' as UserRole,
    divisi: 'Logistik & Perlengkapan',
    jabatan: 'Staf Operasional',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password: 'password123',
    foto: ''
  });

  const [editForm, setEditForm] = useState({
    nama: '',
    username: '',
    email: '',
    role: 'Operator' as UserRole,
    divisi: '',
    jabatan: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password: '',
    foto: ''
  });

  const handlePhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'add') {
        setForm(prev => ({ ...prev, foto: result }));
      } else {
        setEditForm(prev => ({ ...prev, foto: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm({
          nama: '',
          username: '',
          email: '',
          role: 'Operator',
          divisi: 'Logistik & Perlengkapan',
          jabatan: 'Staf Operasional',
          status: 'Aktif',
          password: 'password123',
          foto: ''
        });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      nama: u.nama,
      username: u.username,
      email: u.email,
      role: u.role,
      divisi: u.divisi,
      jabatan: u.jabatan,
      status: u.status,
      password: '',
      foto: u.foto || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/v1/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser && currentUser.id === editingUser.id && updateCurrentUserProfile) {
          updateCurrentUserProfile({
            nama: editForm.nama,
            foto: editForm.foto || editingUser.foto,
            role: editForm.role,
            divisi: editForm.divisi,
            jabatan: editForm.jabatan
          });
        }
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newResetPassword.trim()) return;
    try {
      const res = await fetch(`/api/v1/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newResetPassword.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccessMsg(`Password user ${resettingUser.nama} berhasil diperbarui!`);
        setTimeout(() => {
          setResettingUser(null);
          setNewResetPassword('');
          setResetSuccessMsg('');
          fetchUsers();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch(`/api/v1/users/${deletingUser.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeletingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rolesList: UserRole[] = [
    'Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'
  ];

  // Hitung jumlah user per role secara reaktif
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      if (u.role) {
        counts[u.role] = (counts[u.role] || 0) + 1;
      }
    });
    return counts;
  }, [users]);

  // Kumpulkan semua role unik (kombinasi daftar standar + role yang ada di DB)
  const availableRoles = useMemo(() => {
    const set = new Set<string>(rolesList);
    users.forEach(u => {
      if (u.role) set.add(u.role);
    });
    return Array.from(set);
  }, [users]);

  // Filter berdasarkan teks pencarian DAN dropdown peran (role)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = filter.toLowerCase().trim();
      const matchesSearch = !q ||
        u.nama.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.divisi && u.divisi.toLowerCase().includes(q)) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, filter, selectedRoleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" /> Pusat Manajemen Pengguna Single Sign-On (SSO)
          </h2>
          <p className="text-xs text-slate-500">
            Satu basis pengguna terpusat terintegrasi dengan Google Cloud Firestore & Master Data Terpadu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Google Cloud Firestore Sync
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah User Baru
          </button>
        </div>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          <strong>Data Terintegrasi 100%:</strong> Setiap perubahan pengguna di menu ini secara otomatis tersinkronisasi realtime ke <strong>Master Data Terpadu (Master Pegawai)</strong> dan disimpan di <strong>Google Cloud Firestore</strong>.
        </span>
      </div>

      {/* Bar Pencarian & Dropdown Filter Peran */}
      <div className="space-y-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Input Pencarian */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, username, email, divisi, atau role..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sisi Kanan: Dropdown Filter Peran & Aksi Cepat */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Dropdown Filter Peran (Role) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <label htmlFor="role-filter-dropdown" className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                Filter Peran:
              </label>
              <select
                id="role-filter-dropdown"
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Semua Peran ({users.length})
                </option>
                {availableRoles.map(role => {
                  const count = roleCounts[role] || 0;
                  return (
                    <option
                      key={role}
                      value={role}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      {role} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tombol Reset Filter jika filter peran atau kata kunci aktif */}
            {(selectedRoleFilter !== 'ALL' || filter.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('ALL');
                  setFilter('');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 font-semibold transition cursor-pointer flex items-center gap-1"
                title="Reset filter peran dan pencarian"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {isAdminPenuh && (
              <button
                type="button"
                onClick={() => {
                  const allShown = filteredUsers.length > 0 && filteredUsers.every(u => !!showPasswordsMap[u.id]);
                  const nextMap: Record<string, boolean> = { ...showPasswordsMap };
                  filteredUsers.forEach(u => {
                    nextMap[u.id] = !allShown;
                  });
                  setShowPasswordsMap(nextMap);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Fitur Khusus Admin Penuh: Mengintip password seluruh user sekaligus"
              >
                {filteredUsers.length > 0 && filteredUsers.every(u => !!showPasswordsMap[u.id]) ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sembunyikan Password</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka Password ({filteredUsers.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Ringkasan Filter & Quick Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900 dark:text-slate-100">{filteredUsers.length}</strong> dari <strong className="text-slate-900 dark:text-slate-100">{users.length}</strong> pengguna
            </span>
            {selectedRoleFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <Shield className="w-3 h-3 text-rose-600" />
                Peran: {selectedRoleFilter} ({filteredUsers.length})
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className="hover:text-rose-900 dark:hover:text-rose-100 ml-1 cursor-pointer"
                  title="Hapus filter peran"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Quick role pills untuk mempermudah pemilihan cepat */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({users.length})
            </button>
            {['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Admin', 'Operator'].map(r => {
              const count = roleCounts[r] || 0;
              if (count === 0 && selectedRoleFilter !== r) return null;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    selectedRoleFilter === r
                      ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">User & Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role Hak Akses</th>
              <th className="p-3">Divisi & Jabatan</th>
              <th className="p-3">
                <div className="flex items-center gap-1.5">
                  <span>Kredensial Password</span>
                  {isAdminPenuh && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      Admin Penuh
                    </span>
                  )}
                </div>
              </th>
              <th className="p-3">Status SSO</th>
              <th className="p-3">Terakhir Login</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Filter className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Tidak ada pengguna yang cocok
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {selectedRoleFilter !== 'ALL'
                        ? `Tidak ada pengguna dengan peran "${selectedRoleFilter}"${filter ? ` dan kata kunci "${filter}"` : ''}.`
                        : `Tidak ada pengguna yang cocok dengan kata kunci pencarian "${filter}".`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoleFilter('ALL');
                        setFilter('');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition cursor-pointer"
                    >
                      Reset Filter & Tampilkan Semua Pengguna
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={u.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                      alt={u.nama} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs" 
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{u.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-[11px]">{u.email}</td>
                <td className="p-3">
                  <Badge variant={
                    u.role === 'Admin Penuh' || u.role === 'Super Admin' ? 'danger' :
                    u.role === 'Staff Kantor' ? 'success' :
                    u.role === 'Distribusi' ? 'info' :
                    u.role === 'Admin' ? 'warning' : 'primary'
                  }>
                    <Shield className="w-3 h-3" /> {u.role}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{u.divisi}</div>
                  <div className="text-[10px] text-slate-400">{u.jabatan}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {isAdminPenuh ? (
                      <>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {showPasswordsMap[u.id] ? (
                            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 select-all tracking-wide">
                              {u.password || 'password123'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500 tracking-widest">
                              ••••••••
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            title={showPasswordsMap[u.id] ? "Sembunyikan password" : "Lihat password user (Hak Akses Admin Utama / Admin Penuh)"}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            {showPasswordsMap[u.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                          {showPasswordsMap[u.id] && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(u.id, u.password || 'password123')}
                              title="Salin password ke clipboard"
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 dark:text-slate-300 transition cursor-pointer"
                            >
                              {copiedUserId === u.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setNewResetPassword('');
                            setResetSuccessMsg('');
                          }}
                          className="px-2 py-1 text-[10px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold rounded-lg border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                          title="Reset Password SSO User"
                        >
                          <Key className="w-3 h-3" />
                          Reset
                        </button>
                      </>
                    ) : (
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        ••••••••
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={u.status === 'Aktif' ? 'success' : 'secondary'}>
                    {u.status}
                  </Badge>
                </td>
                <td className="p-3 text-[11px] text-slate-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('id-ID') : '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                      title="Edit Hak Akses & Data User"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                      title="Hapus User SSO"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah User */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" /> Tambah User Single Sign-On Baru
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Bagian Input Foto User Baru */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-600" />
                    Foto Profil Pengguna (Lengkapi Profile)
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, atau WEBP</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <img
                      src={form.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt="Preview Foto"
                      className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-md ring-2 ring-rose-100 dark:ring-rose-900"
                    />
                    <label
                      htmlFor="add-photo-upload"
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition"
                      title="Klik untuk pilih foto dari perangkat"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                    <input
                      id="add-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileChange(e, 'add')}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="add-photo-upload"
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File Foto</span>
                      </label>
                      {form.foto && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, foto: '' })}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="url"
                        value={form.foto}
                        onChange={(e) => setForm({ ...form, foto: e.target.value })}
                        placeholder="Atau tempel URL foto (https://...)"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Pilih Avatar Cepat:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {DEFAULT_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setForm({ ...form, foto: av.url })}
                            className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:scale-105 transition cursor-pointer"
                            title={av.label}
                          >
                            <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Username SSO</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Instansi</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Role Hak Akses (RBAC)</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  {rolesList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password SSO User</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan password SSO..."
                    className="w-full p-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Password yang digunakan user untuk login ke Portal SSO</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Divisi</label>
                  <input
                    type="text"
                    value={form.divisi}
                    onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Jabatan</label>
                  <input
                    type="text"
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
                >
                  Simpan User SSO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User & Hak Akses */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" /> Edit Hak Akses & Profile User ({editingUser.id})
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              {/* Bagian Ganti Foto User Terbaru */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Ganti Foto User Terbaru
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, atau WEBP (Maks 2MB)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <img
                      src={editForm.foto || editingUser.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt="Preview Foto User"
                      className="w-18 h-18 rounded-full object-cover border-2 border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900"
                    />
                    <label
                      htmlFor="edit-photo-upload"
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition"
                      title="Klik untuk ganti foto dari perangkat"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                    <input
                      id="edit-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileChange(e, 'edit')}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="edit-photo-upload"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Foto Baru</span>
                      </label>
                      {editForm.foto && editForm.foto !== editingUser.foto && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, foto: editingUser.foto || '' })}
                          className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                          title="Kembalikan ke foto sebelumnya"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Batalkan Foto</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="url"
                        value={editForm.foto}
                        onChange={(e) => setEditForm({ ...editForm, foto: e.target.value })}
                        placeholder="Atau tempel URL foto terbaru (https://...)"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Pilih Avatar Cepat:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {DEFAULT_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, foto: av.url })}
                            className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:scale-105 transition cursor-pointer"
                            title={av.label}
                          >
                            <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Username SSO</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Instansi</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Role Hak Akses (RBAC)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400"
                  >
                    {rolesList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Status SSO</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Divisi</label>
                  <input
                    type="text"
                    value={editForm.divisi}
                    onChange={(e) => setEditForm({ ...editForm, divisi: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Jabatan</label>
                  <input
                    type="text"
                    value={editForm.jabatan}
                    onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Set / Ubah Password Baru (Opsional)</label>
                  {isAdminPenuh && editingUser && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Password saat ini: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{editingUser.password || 'password123'}</strong>
                    </span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    className="w-full p-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Isi hanya jika Anda ingin memperbarui kata sandi user ini</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
                >
                  Simpan Perubahan & Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password User */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" /> Reset Password SSO User
              </h3>
              <button onClick={() => setResettingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
              Mereset password SSO untuk <strong>{resettingUser.nama}</strong> (<span className="font-mono">@{resettingUser.username}</span>).
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {resetSuccessMsg}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Baru User</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Masukkan password baru (min 6 karakter)..."
                    className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" /> Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus User */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-100 dark:bg-rose-950 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Konfirmasi Hapus User</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun user <strong className="text-slate-900 dark:text-white">{deletingUser.nama}</strong> (<span className="font-mono">@{deletingUser.username}</span>)? User ini tidak akan dapat melakukan login SSO ke portal lagi.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Ya, Hapus User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

