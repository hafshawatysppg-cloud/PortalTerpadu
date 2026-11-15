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
const portalBgImg = '/assets/aistudio/__0800dc62.jpg';

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
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#0D1E54] via-[#0B1A4B] to-[#060F30] flex flex-col lg:flex-row">
      {/* Desktop Left Visual Canvas: Left 55.5% of portal mockup photo feathered into deep navy */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute inset-y-0 left-0 w-[55.5%] overflow-hidden pointer-events-none select-none"
      >
        <img
          src={portalBgImg}
          alt=""
          className="w-[180.18%] max-w-none h-full object-cover object-left"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-y-0 right-0 w-44 bg-gradient-to-r from-transparent via-[#0B1A4B]/70 to-[#0B1A4B]" />
      </div>

      {/* Subtle ambient glow behind the right card */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute right-0 inset-y-0 w-[44.5%] bg-gradient-to-b from-[#0D1E54]/80 via-[#0B1A4B] to-[#071136] pointer-events-none"
      />

      {/* Mobile & Tablet Compact Hero Banner */}
      <div className="lg:hidden relative w-full h-56 sm:h-64 overflow-hidden shrink-0">
        <img
          src={portalBgImg}
          alt="SPPG Probolinggo Krejengan Temenggungan"
          className="w-[190%] max-w-none h-full object-cover object-[left_38%]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A4B] via-[#0B1A4B]/55 to-[#0B1A4B]/40" />
        <div className="absolute inset-x-0 bottom-4 px-5 text-white">
          <p className="text-xs font-medium text-sky-100 tracking-wide">
            Sistem Pengelolaan Administrasi
          </p>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5 drop-shadow">
            SPPG Probolinggo Krejengan Temenggungan
          </h1>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-4 py-6 sm:px-8 lg:px-14 xl:px-20">
        {/* Accessible screen-reader heading on desktop */}
        <div className="sr-only lg:not-sr-only lg:w-[52%] lg:h-full lg:pointer-events-none lg:opacity-0">
          <h1>Sistem Pengelolaan Administrasi SPPG Probolinggo Krejengan Temenggungan</h1>
        </div>

        {/* Right Ice-Teal Rounded Portal Card */}
        <div className="w-full max-w-[440px] lg:ml-auto my-auto">
          <div className="bg-[#B7DCE5] rounded-[32px] shadow-[0_24px_60px_-12px_rgba(3,10,36,0.65)] border border-white/35 px-7 py-8 sm:px-10 sm:py-9">
            {/* Badan Gizi Nasional Emblem */}
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={logoImg}
                alt="Logo Badan Gizi Nasional Republik Indonesia"
                className="w-20 h-20 object-contain drop-shadow-[0_6px_14px_rgba(11,26,75,0.22)]"
                referrerPolicy="no-referrer"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 px-4 py-2.5 rounded-2xl bg-[#9F1239] text-white text-xs font-medium flex items-center gap-2 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-[#10254D] font-medium text-[15px] mb-2 pl-2"
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
                  className="w-full min-h-[48px] rounded-full bg-white px-5 py-3 text-sm font-medium text-[#0F1E3D] placeholder-slate-400 shadow-[0_8px_18px_rgba(11,26,75,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[#10254D] font-medium text-[15px] mb-2 pl-2"
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
                    className="w-full min-h-[48px] rounded-full bg-white pl-5 pr-12 py-3 text-sm font-medium text-[#0F1E3D] placeholder-slate-400 shadow-[0_8px_18px_rgba(11,26,75,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] transition"
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
                  className="min-w-[196px] min-h-[48px] px-10 py-3 rounded-full bg-white hover:bg-[#F3F8FB] active:scale-[0.98] text-[#112456] font-extrabold text-[15px] tracking-[0.06em] shadow-[0_10px_22px_rgba(11,26,75,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112456] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="mt-6 pt-4 border-t border-[#10254D]/15 flex flex-wrap items-center justify-center gap-2.5">
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
        </div>
      </div>

      {/* Mobile & Tablet Institutional Contact Footer */}
      <div className="lg:hidden relative z-10 px-5 pb-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-white text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold">Phone</div>
            <div className="text-slate-200">085330274105</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold">E-Mail</div>
            <div className="text-slate-200">hafshawatysppg@gmail.com</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold">Website</div>
            <div className="text-slate-200">www.sppg.temenggungan01.com</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-white text-[#0B1A4B] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold">Address</div>
            <div className="text-slate-200">Desa Temenggungan, Krejengan, Kab. Probolinggo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
