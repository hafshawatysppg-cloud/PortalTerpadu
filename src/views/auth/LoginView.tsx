import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogIn, ArrowLeft, Eye } from 'lucide-react';
import logoImg from '../../assets/images/badan_gizi_logo_1785799692960.jpg';

interface LoginViewProps {
  onBackToVisitor?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBackToVisitor, onLoginSuccess }) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Email/Username dan Password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await login(usernameOrEmail.trim(), password);
      if (success) {
        onLoginSuccess?.();
      } else {
        setError('Email/Username atau password tidak sesuai.');
      }
    } catch (err) {
      setError('Gagal menghubungi server autentikasi SSO.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/auth/github/url');
      const data = await res.json();
      if (data.success && data.data.authUrl) {
        // Open GitHub OAuth Popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          data.data.authUrl,
          'GitHub OAuth Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for postMessage from callback popup
        const listener = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'GITHUB_OAUTH_SUCCESS') {
            window.removeEventListener('message', listener);
            if (popup) popup.close();
            // Automatically log in user as Admin Penuh
            const success = await login('dapurhafshawaty@gmail.com', 'password123');
            if (success) onLoginSuccess?.();
            setLoading(false);
          }
        };
        window.addEventListener('message', listener);

        // Fallback timeout
        setTimeout(() => {
          window.removeEventListener('message', listener);
          setLoading(false);
        }, 15000);
      } else {
        setError('Gagal mendapatkan URL otorisasi GitHub.');
        setLoading(false);
      }
    } catch (err) {
      setError('Gagal menginisialisasi login GitHub OAuth.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          {onBackToVisitor && (
            <div className="flex justify-start">
              <button
                onClick={onBackToVisitor}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition"
                title="Kembali ke Mode Pengunjung"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mode Pengunjung</span>
              </button>
            </div>
          )}

          <img
            src={logoImg}
            alt="Badan Gizi Nasional Logo"
            className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-amber-400/40 shadow-xl shadow-amber-500/10 hover:scale-105 transition"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
              BADAN GIZI NASIONAL REPUBLIK INDONESIA
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">Portal Administrasi Terpadu</h1>
            <p className="text-xs text-slate-400 mt-1">
              Single Entry Point & Autentikasi Terpadu Keamanan Hak Akses Pengguna
            </p>
          </div>
        </div>

        {/* Security Banner */}
        <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-white">Sistem Terproteksi Single Sign-On (SSO)</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Akses portal ini memerlukan autentikasi resmi. Silakan masukkan email terdaftar atau username SSO dan password Anda.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Terdaftar / Username SSO</label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              placeholder="Masukkan email terdaftar / username SSO..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password SSO</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              placeholder="Masukkan password SSO..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 text-xs"
          >
            <LogIn className="w-4 h-4" /> {loading ? 'Memverifikasi Akses SSO...' : 'Masuk Portal Terpadu'}
          </button>

          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider absolute">atau</span>
          </div>

          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-xs"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Masuk dengan GitHub Account
          </button>

          {onBackToVisitor && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToVisitor}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Lihat Tampilan Mode Pengunjung</span>
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
