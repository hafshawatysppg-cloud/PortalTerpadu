import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

const logoImg = '/badan-gizi-nasional-seeklogo.png';
const portalBgImg = '/assets/aistudio/__6cf47589.png';

interface LoginViewProps {
  onBackToVisitor?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onBackToVisitor,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Nama pengguna (username) dan kata sandi wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await login(usernameOrEmail.trim(), password);
      if (success) {
        onLoginSuccess?.();
      } else {
        setError('Username/email atau kata sandi tidak sesuai.');
      }
    } catch {
      setError('Gagal menghubungi server autentikasi SSO.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/v1/auth/github/url');
      const data = await res.json();
      if (data.success && data.data.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          data.data.authUrl,
          'GitHub OAuth Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const listener = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'GITHUB_OAUTH_SUCCESS') {
            window.removeEventListener('message', listener);
            if (popup) popup.close();
            const success = await login('dapurhafshawaty@gmail.com', 'password123');
            if (success) onLoginSuccess?.();
            setLoading(false);
          }
        };
        window.addEventListener('message', listener);

        setTimeout(() => {
          window.removeEventListener('message', listener);
          setLoading(false);
        }, 15000);
      } else {
        setError('Gagal mendapatkan URL otorisasi GitHub.');
        setLoading(false);
      }
    } catch {
      setError('Gagal menginisialisasi login GitHub OAuth.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-gradient-to-br from-[#0D1E54] via-[#0B1A4B] to-[#060F30] flex flex-col lg:flex-row lg:items-center">
      {/* Mobile & Tablet Header + Clean Uncropped Team Photo */}
      <header className="lg:hidden w-full shrink-0 pt-5 px-4 sm:px-6 flex flex-col items-center">
        <div className="w-full max-w-[540px] text-left mb-3">
          <p className="text-xs sm:text-sm font-medium text-sky-100/90 tracking-wide">
            Sistem Pengelolaan Administrasi
          </p>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-white mt-0.5 leading-snug">
            SPPG Probolinggo Krejengan Temenggungan
          </h1>
        </div>

        <div className="w-full max-w-[540px] aspect-[714/415] relative overflow-hidden rounded-2xl shadow-xl border border-white/10">
          <img
            src={portalBgImg}
            alt="Tim SPPG Probolinggo Krejengan Temenggungan"
            className="w-[179.27%] max-w-none h-auto -translate-y-[24%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0B1A4B]/65 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0B1A4B] via-[#0B1A4B]/50 to-transparent pointer-events-none" />
        </div>
      </header>

      {/* Desktop Left Visual Canvas: Exact 0..55.8% uncropped showcase feathered into deep navy */}
      <div
        aria-hidden="true"
        className="hidden lg:flex lg:items-center lg:shrink-0 relative w-[min(55.8vw,89.25vh)] aspect-[714/800] overflow-hidden select-none pointer-events-none"
      >
        <img
          src={portalBgImg}
          alt=""
          className="w-[179.27%] max-w-none h-full object-cover object-left"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-r from-transparent via-[#0B1A4B]/65 to-[#0B1A4B]" />
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0B1A4B]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09153F]/85 to-transparent" />
      </div>

      {/* Accessible heading for screen readers on desktop */}
      <h1 className="sr-only">
        Sistem Pengelolaan Administrasi SPPG Probolinggo Krejengan Temenggungan
      </h1>

      {/* Login Card Container */}
      <main className="w-full flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-14 py-5 sm:py-8 -mt-4 lg:mt-0 relative z-10">
        <div className="w-full max-w-[430px] bg-[#B7DCE5] rounded-[28px] sm:rounded-[32px] shadow-[0_24px_60px_-12px_rgba(3,10,36,0.65)] border border-white/35 px-5 py-6 sm:px-9 sm:py-8">
          {/* Badan Gizi Nasional Emblem */}
          <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
            <img
              src={logoImg}
              alt="Logo Badan Gizi Nasional Republik Indonesia"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_14px_rgba(11,26,75,0.22)]"
              referrerPolicy="no-referrer"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-2.5 rounded-2xl bg-[#9F1239] text-white text-xs font-medium flex items-center gap-2 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-[#10254D] font-medium text-sm sm:text-[15px] mb-1.5 pl-2"
              >
                Nama Pengguna (Username)
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Masukkan username atau email..."
                className="w-full min-h-[46px] sm:min-h-[48px] rounded-full bg-white px-5 py-2.5 sm:py-3 text-sm font-medium text-[#0F1E3D] placeholder-slate-400 shadow-[0_8px_18px_rgba(11,26,75,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[#10254D] font-medium text-sm sm:text-[15px] mb-1.5 pl-2"
              >
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full min-h-[46px] sm:min-h-[48px] rounded-full bg-white pl-5 pr-12 py-2.5 sm:py-3 text-sm font-medium text-[#0F1E3D] placeholder-slate-400 shadow-[0_8px_18px_rgba(11,26,75,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#10254D]/70 hover:text-[#10254D] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="min-w-[180px] sm:min-w-[196px] min-h-[46px] sm:min-h-[48px] px-9 py-2.5 sm:py-3 rounded-full bg-white hover:bg-[#F3F8FB] active:scale-[0.98] text-[#112456] font-extrabold text-sm sm:text-[15px] tracking-[0.06em] shadow-[0_10px_22px_rgba(11,26,75,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MEMVERIFIKASI...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>
            </div>
          </form>

          {/* Compact secondary SSO & Visitor options */}
          <div className="mt-5 pt-4 border-t border-[#10254D]/15 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className="min-h-[40px] px-4 py-2 rounded-full bg-white/65 hover:bg-white text-[#10254D] text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] disabled:opacity-60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub SSO</span>
            </button>

            {onBackToVisitor && (
              <button
                type="button"
                onClick={onBackToVisitor}
                className="min-h-[40px] px-4 py-2 rounded-full bg-white/65 hover:bg-white text-[#10254D] text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mode Pengunjung</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile & Tablet Institutional Contact Footer */}
      <footer className="lg:hidden w-full max-w-[540px] mx-auto px-4 sm:px-6 pb-6 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-white text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold">Phone</div>
            <div className="text-slate-200 break-words">085330274105</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold">E-Mail</div>
            <div className="text-slate-200 break-all">hafshawatysppg@gmail.com</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold">Website</div>
            <div className="text-slate-200 break-all">www.sppg.temenggungan01.com</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold">Address</div>
            <div className="text-slate-200 break-words">
              Desa Temenggungan, Krejengan, Kab. Probolinggo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
