import React, { useState, useRef } from 'react';
import { useDocumentTemplate } from '../../contexts/DocumentTemplateContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileSignature, 
  Building2, 
  FileText, 
  Hash, 
  PanelBottom, 
  PenTool, 
  Printer, 
  Layers, 
  Eye, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Plus, 
  Sliders, 
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MasterSignature, DocumentTypeTemplate } from '../../types/documentTemplate';
import { GlobalReportHeader } from '../../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../../components/document/DocumentSignatures';

type TabKey = 
  | 'profil'
  | 'kop'
  | 'format'
  | 'nomor'
  | 'footer'
  | 'ttd'
  | 'pdf'
  | 'jenis'
  | 'preview';

export const MasterTemplateDokumenView: React.FC = () => {
  const { user } = useAuth();
  const { 
    config, 
    updateProfile, 
    updateLetterhead, 
    updateFormat, 
    updateFooter, 
    updateNumbering, 
    updateDocType,
    saveSignature,
    deleteSignature,
    saveConfig, 
    resetToDefault,
    isSaving 
  } = useDocumentTemplate();

  const [activeTab, setActiveTab] = useState<TabKey>('kop');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedPreviewDocType, setSelectedPreviewDocType] = useState<string>('stock-laporan');
  
  // Signature modal states
  const [editingSignature, setEditingSignature] = useState<MasterSignature | null>(null);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  // File input ref for logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigImageInputRef = useRef<HTMLInputElement>(null);

  // Check admin access
  const isAuthorized = user?.role === 'Super Admin' || user?.role === 'Admin Penuh' || user?.role === 'Admin';

  const handleSave = async () => {
    setSaveStatus(null);
    const res = await saveConfig();
    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus({ type: 'error', message: res.message });
    }
  };

  const handleReset = async () => {
    const res = await resetToDefault();
    setShowResetConfirm(false);
    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar logo maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateLetterhead({ logoUrl: reader.result, showLogo: true });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSigImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingSignature) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditingSignature({
            ...editingSignature,
            signatureImageUrl: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  // Calculated preview document number
  const sampleNow = new Date();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const sampleMonth = config.numbering.monthFormat === 'roman' ? romanMonths[sampleNow.getMonth()] : String(sampleNow.getMonth() + 1).padStart(2, '0');
  const sampleYear = config.numbering.yearFormat === 'YY' ? String(sampleNow.getFullYear()).slice(2) : String(sampleNow.getFullYear());
  const sampleCounter = String((config.numbering.currentCounters['STOK'] || 1)).padStart(config.numbering.counterLength || 3, '0');
  const sampleDocNumber = config.numbering.formatPattern
    .replace('{counter}', sampleCounter)
    .replace('{prefix}', config.numbering.prefix)
    .replace('{code}', 'STOK')
    .replace('{month}', sampleMonth)
    .replace('{year}', sampleYear);

  const tabs: Array<{ key: TabKey; label: string; icon: React.FC<{ className?: string }> }> = [
    { key: 'kop', label: 'Kop Surat', icon: FileText },
    { key: 'profil', label: 'Profil & Identitas', icon: Building2 },
    { key: 'format', label: 'Format Dokumen', icon: Sliders },
    { key: 'nomor', label: 'Nomor Dokumen', icon: Hash },
    { key: 'footer', label: 'Footer', icon: PanelBottom },
    { key: 'ttd', label: 'Tanda Tangan', icon: PenTool },
    { key: 'pdf', label: 'PDF & Print', icon: Printer },
    { key: 'jenis', label: 'Jenis Dokumen', icon: Layers },
    { key: 'preview', label: 'Live Preview', icon: Eye },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Master Template Dokumen
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pusat kendali resmi format dokumen, kop surat, footer, nomor, dan cetak PDF aplikasi SPPG BGN RI
            </p>
          </div>
        </div>

        {/* ACTIONS BUTTONS */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="text-right mr-1 hidden lg:block">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Versi: <span className="font-mono text-slate-800 dark:text-slate-200">{config.version}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Update: {new Date(config.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Kembalikan ke template default BGN"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleTestPrint}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Test Print</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !isAuthorized}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer ${
              isSaving || !isAuthorized
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATION */}
      {saveStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium border ${
          saveStatus.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT CONFIG TABS / RIGHT LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE SETTINGS TAB (lg:col-span-7 or 12) */}
        <div className={`${activeTab === 'preview' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>

          {/* TAB 1: KOP SURAT */}
          {activeTab === 'kop' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Konfigurasi Kop Surat Resmi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Format kepala surat untuk seluruh dokumen dinas, berita acara, dan laporan operasional
                  </p>
                </div>
              </div>

              {/* LOGO SECTION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                  Logo Resmi Lembaga
                </span>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-20 h-20 bg-white border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 relative">
                    <img
                      src={config.letterhead.logoUrl || '/badan_gizi_logo.jpg'}
                      alt="Logo SPPG"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo Baru</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateLetterhead({ logoUrl: '/badan_gizi_logo.jpg', showLogo: true })}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition cursor-pointer"
                      >
                        Default BGN
                      </button>

                      <button
                        type="button"
                        onClick={() => updateLetterhead({ showLogo: !config.letterhead.showLogo })}
                        className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition cursor-pointer ${
                          config.letterhead.showLogo
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {config.letterhead.showLogo ? 'Logo Aktif' : 'Logo Disembunyikan'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Disarankan file PNG/JPG transparan persegi, resolusi minimal 200x200 px (maks. 2MB).
                    </p>
                  </div>
                </div>

                {/* LOGO CONTROLS (SIZE, POSITION, GAP) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Ukuran Logo: {config.letterhead.logoSize}px
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="2"
                      value={config.letterhead.logoSize}
                      onChange={(e) => updateLetterhead({ logoSize: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Posisi Logo
                    </label>
                    <select
                      value={config.letterhead.logoPosition}
                      onChange={(e) => updateLetterhead({ logoPosition: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="left">Kiri (Standar)</option>
                      <option value="center">Tengah (Atas Teks)</option>
                      <option value="right">Kanan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Jarak dengan Teks: {config.letterhead.gapLogoWithText}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="36"
                      step="2"
                      value={config.letterhead.gapLogoWithText}
                      onChange={(e) => updateLetterhead({ gapLogoWithText: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* TEKS & TIPOGRAFI KOP SURAT */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Teks Identitas Kop Surat
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Nama Instansi Induk (Baris 1)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.letterhead.namaInstansi}
                        onChange={(e) => updateLetterhead({ namaInstansi: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => updateLetterhead({ isBoldInstansi: !config.letterhead.isBoldInstansi })}
                        className={`px-3 text-xs font-bold rounded-xl border ${config.letterhead.isBoldInstansi ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        B
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Nama Unit Layanan SPPG (Baris 2)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.letterhead.namaSppg}
                        onChange={(e) => updateLetterhead({ namaSppg: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => updateLetterhead({ isBoldSppg: !config.letterhead.isBoldSppg })}
                        className={`px-3 text-xs font-bold rounded-xl border ${config.letterhead.isBoldSppg ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        B
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Nama Yayasan / Mitra (Baris 3)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.letterhead.namaYayasan}
                        onChange={(e) => updateLetterhead({ namaYayasan: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => updateLetterhead({ isBoldYayasan: !config.letterhead.isBoldYayasan })}
                        className={`px-3 text-xs font-bold rounded-xl border ${config.letterhead.isBoldYayasan ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        B
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Alamat Lengkap Pada Kop
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={config.letterhead.alamatLengkap}
                        onChange={(e) => updateLetterhead({ alamatLengkap: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => updateLetterhead({ isItalicAlamat: !config.letterhead.isItalicAlamat })}
                        className={`px-3 text-xs italic font-serif rounded-xl border ${config.letterhead.isItalicAlamat ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        I
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STYLING PEMBATAS & FONT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Font Kop Surat
                  </label>
                  <select
                    value={config.letterhead.fontFamily}
                    onChange={(e) => updateLetterhead({ fontFamily: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="inherit">Sistem (Plus Jakarta Sans)</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="Courier New, monospace">Courier New</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Gaya Garis Pembatas
                  </label>
                  <select
                    value={config.letterhead.borderStyle}
                    onChange={(e) => updateLetterhead({ borderStyle: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="double">Double Line (Garis Ganda Resmi)</option>
                    <option value="solid">Solid Line (Garis Tebal Tunggal)</option>
                    <option value="dashed">Dashed Line (Garis Putus)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Ketebalan Pembatas: {config.letterhead.borderThickness}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={config.letterhead.borderThickness}
                    onChange={(e) => updateLetterhead({ borderThickness: Number(e.target.value) })}
                    className="w-full accent-blue-600 mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL & IDENTITAS */}
          {activeTab === 'profil' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Profil Lembaga & Satuan Pelayanan (SPPG)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data master instansi yang dihubungkan ke seluruh dokumen, formulir, dan metadata
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Nama Instansi Induk
                  </label>
                  <input
                    type="text"
                    value={config.profile.namaInstansi}
                    onChange={(e) => updateProfile({ namaInstansi: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Nama Satuan Pelayanan (SPPG)
                  </label>
                  <input
                    type="text"
                    value={config.profile.namaSppg}
                    onChange={(e) => updateProfile({ namaSppg: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Nama Yayasan Pengelola
                  </label>
                  <input
                    type="text"
                    value={config.profile.namaYayasan}
                    onChange={(e) => updateProfile({ namaYayasan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Dusun / Jalan
                  </label>
                  <input
                    type="text"
                    value={config.profile.alamat}
                    onChange={(e) => updateProfile({ alamat: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    RT / RW
                  </label>
                  <input
                    type="text"
                    value={config.profile.rtRw}
                    onChange={(e) => updateProfile({ rtRw: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    value={config.profile.desa}
                    onChange={(e) => updateProfile({ desa: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={config.profile.kecamatan}
                    onChange={(e) => updateProfile({ kecamatan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    value={config.profile.kabupaten}
                    onChange={(e) => updateProfile({ kabupaten: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Provinsi & Kode Pos
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.profile.provinsi}
                      onChange={(e) => updateProfile({ provinsi: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="67284"
                      value={config.profile.kodePos}
                      onChange={(e) => updateProfile({ kodePos: e.target.value })}
                      className="w-24 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={config.profile.nomorTelepon}
                    onChange={(e) => updateProfile({ nomorTelepon: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={config.profile.email}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Nama Penanggung Jawab (Kepala SPPG)
                  </label>
                  <input
                    type="text"
                    value={config.profile.penanggungJawabNama}
                    onChange={(e) => updateProfile({ penanggungJawabNama: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Jabatan Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={config.profile.penanggungJawabJabatan}
                    onChange={(e) => updateProfile({ penanggungJawabJabatan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORMAT DOKUMEN */}
          {activeTab === 'format' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Format Dokumen & Tata Letak Kertas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standar margin cetak, ukuran kertas bawaan, dan format tipografi dokumen
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Ukuran Kertas Bawaan
                  </label>
                  <select
                    value={config.format.paperSize}
                    onChange={(e) => updateFormat({ paperSize: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="A4">A4 (210 x 297 mm) - Standar Pemerintah</option>
                    <option value="F4">F4 / Folio (215 x 330 mm)</option>
                    <option value="Letter">Letter (216 x 279 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Orientasi Kertas Bawaan
                  </label>
                  <select
                    value={config.format.orientation}
                    onChange={(e) => updateFormat({ orientation: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="portrait">Portrait (Tegak)</option>
                    <option value="landscape">Landscape (Mendatar / Tabel Lebar)</option>
                  </select>
                </div>
              </div>

              {/* MARGINS (MM) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                  Batas Tepi Halaman / Margins (Milimeter)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Atas (Top mm)</label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={config.format.marginTop}
                      onChange={(e) => updateFormat({ marginTop: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Bawah (Bottom mm)</label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={config.format.marginBottom}
                      onChange={(e) => updateFormat({ marginBottom: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Kiri (Left mm)</label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={config.format.marginLeft}
                      onChange={(e) => updateFormat({ marginLeft: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Kanan (Right mm)</label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={config.format.marginRight}
                      onChange={(e) => updateFormat({ marginRight: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* TABLE STYLES */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                  Standar Format Tabel & Data
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Ukuran Font Isi Tabel (pt)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="14"
                      value={config.format.tableFontSize}
                      onChange={(e) => updateFormat({ tableFontSize: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Padding Cell Tabel (px)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="16"
                      value={config.format.tableCellPadding}
                      onChange={(e) => updateFormat({ tableCellPadding: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Warna Header Tabel
                    </label>
                    <input
                      type="text"
                      value={config.format.tableHeaderBg}
                      onChange={(e) => updateFormat({ tableHeaderBg: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOMOR DOKUMEN */}
          {activeTab === 'nomor' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengaturan Penomoran Dokumen Otomatis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sistem counter terpadu tanpa risiko duplikat nomor dokumen antar modul
                </p>
              </div>

              {/* LIVE SAMPLE NUMBER BOX */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    Simulasi Format Nomor Dokumen Real-Time
                  </span>
                  <div className="text-lg font-mono font-black text-blue-950 dark:text-white mt-0.5">
                    {sampleDocNumber}
                  </div>
                </div>
                <span className="px-3 py-1 bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300 font-bold text-xs rounded-lg border border-blue-200 dark:border-blue-800 self-start sm:self-center">
                  Format Otomatis Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Prefix Lembaga
                  </label>
                  <input
                    type="text"
                    value={config.numbering.prefix}
                    onChange={(e) => updateNumbering({ prefix: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Panjang Digit Counter
                  </label>
                  <select
                    value={config.numbering.counterLength}
                    onChange={(e) => updateNumbering({ counterLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value={3}>3 Digit (001, 002...)</option>
                    <option value={4}>4 Digit (0001, 0002...)</option>
                    <option value={5}>5 Digit (00001...)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Format Bulan
                  </label>
                  <select
                    value={config.numbering.monthFormat}
                    onChange={(e) => updateNumbering({ monthFormat: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="roman">Angka Romawi (I, II, III, ... IX, XII)</option>
                    <option value="number">Angka Biasa (01, 02, ... 09, 12)</option>
                    <option value="none">Tanpa Bulan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Format Tahun
                  </label>
                  <select
                    value={config.numbering.yearFormat}
                    onChange={(e) => updateNumbering({ yearFormat: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="YYYY">4 Digit (2026)</option>
                    <option value="YY">2 Digit (26)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Pemisah (Separator)
                  </label>
                  <select
                    value={config.numbering.separator}
                    onChange={(e) => updateNumbering({ separator: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="/">Garis Miring ( / ) - Standar</option>
                    <option value="-">Tanda Hubung ( - )</option>
                    <option value=".">Titik ( . )</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Interval Reset Nomor
                  </label>
                  <select
                    value={config.numbering.resetInterval}
                    onChange={(e) => updateNumbering({ resetInterval: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="year">Reset Setiap Awal Tahun</option>
                    <option value="month">Reset Setiap Awal Bulan</option>
                    <option value="never">Terus Berkelanjutan</option>
                  </select>
                </div>
              </div>

              {/* PER-CODE COUNTER MANAGER */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Status Counter per Kode Dokumen
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(config.numbering.currentCounters).map(([code, counter]) => (
                    <div key={code} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">{code}</span>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">#{counter}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = prompt(`Ubah nomor counter saat ini untuk kode [${code}]:`, String(counter));
                          if (val !== null && !isNaN(Number(val))) {
                            updateNumbering({
                              currentCounters: {
                                ...config.numbering.currentCounters,
                                [code]: Number(val)
                              }
                            });
                          }
                        }}
                        className="px-2 py-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                      >
                        Ubah
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOOTER */}
          {activeTab === 'footer' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfigurasi Footer Dokumen Resmi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pengaturan catatan kaki, penomoran halaman, tanggal cetak, dan disclaimer rahasia
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Tampilkan Footer Global
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Aktifkan catatan kaki pada akhir setiap lembar dokumen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.footer.showFooter}
                    onChange={(e) => updateFooter({ showFooter: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Tampilkan Nomor Halaman
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Contoh: Halaman 1 dari 1 (Otomatis menyesuaikan jumlah lembar)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.footer.showPageNumber}
                    onChange={(e) => updateFooter({ showPageNumber: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Tampilkan Tanggal & Waktu Cetak
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Merekam stempel waktu cetak resmi sistem terpadu
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.footer.showPrintDate}
                    onChange={(e) => updateFooter({ showPrintDate: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Teks Catatan Dokumen (Footer Note)
                  </label>
                  <input
                    type="text"
                    value={config.footer.customDocumentNote}
                    onChange={(e) => updateFooter({ customDocumentNote: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                        Klausul Dokumen Rahasia / Internal
                      </span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">
                        Menampilkan badge peringatan dokumen internal pada footer
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.footer.isConfidential}
                      onChange={(e) => updateFooter({ isConfidential: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded"
                    />
                  </div>

                  {config.footer.isConfidential && (
                    <div>
                      <label className="text-[11px] font-medium text-rose-800 dark:text-rose-300 block mb-1">
                        Teks Peringatan Rahasia
                      </label>
                      <input
                        type="text"
                        value={config.footer.confidentialText}
                        onChange={(e) => updateFooter({ confidentialText: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TANDA TANGAN */}
          {activeTab === 'ttd' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Master Tanda Tangan & Pejabat Berwenang
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kelola nama, jabatan, NIP, serta gambar tanda tangan digital yang sah
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSignature({
                      id: `SIG-${Date.now().toString(36).toUpperCase()}`,
                      nama: '',
                      jabatan: '',
                      nip: '',
                      keterangan: 'Mengetahui,',
                      signatureImageUrl: '',
                      stampImageUrl: '',
                      isActive: true,
                      isDefault: false,
                      order: config.signatures.length + 1
                    });
                    setIsSigModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pejabat</span>
                </button>
              </div>

              {/* LIST OF SIGNATORIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.signatures.map((sig) => (
                  <div 
                    key={sig.id} 
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          {sig.keterangan || 'Mengetahui'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSignature(sig);
                              setIsSigModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus data tanda tangan ${sig.nama}?`)) {
                                deleteSignature(sig.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                        {sig.nama}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {sig.jabatan}
                      </p>
                      {sig.nip && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          NIP. {sig.nip}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Status: <strong className={sig.isActive ? 'text-emerald-600' : 'text-slate-400'}>{sig.isActive ? 'Aktif' : 'Nonaktif'}</strong>
                      </span>
                      {sig.signatureImageUrl && (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ada File TTD
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PENGATURAN PDF & PRINT */}
          {activeTab === 'pdf' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengaturan Cetak Fisik & Simpan PDF
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optimalisasi CSS Print Engine agar output cetak rapi dan bebas pemotongan tabel
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                  <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                    Petunjuk Cetak PDF yang Sempurna
                  </h3>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Gunakan tombol <strong>Cetak / Simpan PDF</strong> pada setiap laporan.</li>
                    <li>Pada dialog printer browser (Google Chrome / Edge), pilih tujuan: <strong>"Save as PDF" (Simpan sebagai PDF)</strong>.</li>
                    <li>Pastikan opsi <strong>"Background graphics" (Grafik latar belakang)</strong> dicentang agar kop dan warna tabel tampil sempurna.</li>
                    <li>Pilih Margin: <strong>Default</strong> atau <strong>None</strong> (sistem template SPPG sudah mengatur margin presisi).</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Ulangi Kop Surat Pada Setiap Halaman
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Jika dokumen memiliki multi-lembar (misal laporan mutasi barang tebal), kop surat akan otomatis muncul di bagian atas setiap lembar.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.letterhead.repeatOnEveryPage}
                    onChange={(e) => updateLetterhead({ repeatOnEveryPage: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TEMPLATE JENIS DOKUMEN */}
          {activeTab === 'jenis' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengaturan per Jenis Dokumen ({config.documentTypes.length} Jenis)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfigurasi spesifik Kop, Footer, Penomoran, dan Tanda Tangan untuk setiap modul laporan
                </p>
              </div>

              <div className="space-y-4">
                {config.documentTypes.map((dt) => (
                  <div 
                    key={dt.id} 
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[10px] font-bold rounded">
                            {dt.code}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {dt.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Kategori: {dt.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dt.enableLetterhead}
                            onChange={(e) => updateDocType(dt.id, { enableLetterhead: e.target.checked })}
                            className="w-3.5 h-3.5 accent-blue-600 rounded"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">Kop Surat</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dt.enableFooter}
                            onChange={(e) => updateDocType(dt.id, { enableFooter: e.target.checked })}
                            className="w-3.5 h-3.5 accent-blue-600 rounded"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">Footer</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dt.enableAutoNumber}
                            onChange={(e) => updateDocType(dt.id, { enableAutoNumber: e.target.checked })}
                            className="w-3.5 h-3.5 accent-blue-600 rounded"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">No. Otomatis</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 block mb-1">
                          Judul Dokumen Resmi
                        </label>
                        <input
                          type="text"
                          value={dt.customTitle || ''}
                          onChange={(e) => updateDocType(dt.id, { customTitle: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold uppercase text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-500 block mb-1">
                          Sub-Judul Dokumen
                        </label>
                        <input
                          type="text"
                          value={dt.customSubTitle || ''}
                          onChange={(e) => updateDocType(dt.id, { customSubTitle: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE A4 PREVIEW (lg:col-span-5 or 12) */}
        <div className={`${activeTab === 'preview' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4 sticky top-6`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live A4 Document Preview
                </span>
              </div>

              {/* SELECTOR FOR PREVIEWING DIFFERENT DOCUMENT TYPES */}
              <select
                value={selectedPreviewDocType}
                onChange={(e) => setSelectedPreviewDocType(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold max-w-[200px]"
              >
                {config.documentTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* LIVE SIMULATED A4 PAPER SHEET */}
            <div className="bg-slate-100 dark:bg-slate-950 p-3 sm:p-4 rounded-xl overflow-x-auto">
              <div 
                className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-lg p-6 sm:p-8 mx-auto min-h-[520px] select-none text-[11px] leading-normal"
                style={{
                  maxWidth: '680px',
                  fontFamily: config.letterhead.fontFamily === 'inherit' ? 'sans-serif' : config.letterhead.fontFamily
                }}
              >
                {/* RENDER DYNAMIC LIVE KOP SURAT */}
                <GlobalReportHeader
                  documentTypeId={selectedPreviewDocType}
                  documentNumber={sampleDocNumber}
                  documentDate={new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(sampleNow)}
                  metadata={[
                    { label: 'Unit Dapur', value: 'SPPG Krejengan' },
                    { label: 'Status Verifikasi', value: 'Disetujui Resmi' }
                  ]}
                />

                {/* SAMPLE DOCUMENT BODY TABLE */}
                <div className="my-4 space-y-3">
                  <p className="text-slate-700 leading-relaxed text-[10px]">
                    Dengan ini dilaporkan hasil pelaksanaan dan verifikasi data operasional Satuan Pelayanan Program Gizi (SPPG) Probolinggo Krejengan Temenggungan sebagai berikut:
                  </p>

                  <table className="w-full border-collapse border border-slate-300 text-[9px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                        <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-300 text-left">Komponen / Rincian Operasional</th>
                        <th className="p-1.5 border border-slate-300 text-center">Volume</th>
                        <th className="p-1.5 border border-slate-300 text-center">Satuan</th>
                        <th className="p-1.5 border border-slate-300 text-right">Status Kepatuhan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1.5 border border-slate-300 text-center font-bold">1</td>
                        <td className="p-1.5 border border-slate-300 font-medium">Beras Pulen Premium SPPG</td>
                        <td className="p-1.5 border border-slate-300 text-center">250</td>
                        <td className="p-1.5 border border-slate-300 text-center">Kg</td>
                        <td className="p-1.5 border border-slate-300 text-right font-bold text-emerald-700">Terverifikasi</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-slate-300 text-center font-bold">2</td>
                        <td className="p-1.5 border border-slate-300 font-medium">Daging Ayam Segar Fillet</td>
                        <td className="p-1.5 border border-slate-300 text-center">85</td>
                        <td className="p-1.5 border border-slate-300 text-center">Kg</td>
                        <td className="p-1.5 border border-slate-300 text-right font-bold text-emerald-700">Terverifikasi</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-slate-300 text-center font-bold">3</td>
                        <td className="p-1.5 border border-slate-300 font-medium">Telur Ayam Segar Grade A</td>
                        <td className="p-1.5 border border-slate-300 text-center">1.200</td>
                        <td className="p-1.5 border border-slate-300 text-center">Butir</td>
                        <td className="p-1.5 border border-slate-300 text-right font-bold text-emerald-700">Terverifikasi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* RENDER DYNAMIC LIVE SIGNATURES */}
                <DocumentSignatures
                  documentTypeId={selectedPreviewDocType}
                />

                {/* RENDER DYNAMIC LIVE FOOTER */}
                <GlobalReportFooter
                  documentTypeId={selectedPreviewDocType}
                  currentPage={1}
                  totalPages={1}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT / ADD SIGNATURE */}
      {isSigModalOpen && editingSignature && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kelola Tanda Tangan Pejabat Resmi
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={editingSignature.nama}
                  onChange={(e) => setEditingSignature({ ...editingSignature, nama: e.target.value })}
                  placeholder="Contoh: Dr. H. Ahmad Pratama, M.Kom"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={editingSignature.jabatan}
                  onChange={(e) => setEditingSignature({ ...editingSignature, jabatan: e.target.value })}
                  placeholder="Contoh: Kepala SPPG Probolinggo Krejengan"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  value={editingSignature.nip || ''}
                  onChange={(e) => setEditingSignature({ ...editingSignature, nip: e.target.value })}
                  placeholder="19820514 200801 1 003"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Keterangan Tanda Tangan
                </label>
                <input
                  type="text"
                  value={editingSignature.keterangan}
                  onChange={(e) => setEditingSignature({ ...editingSignature, keterangan: e.target.value })}
                  placeholder="Mengetahui, / Menyetujui, / Disusun Oleh,"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Gambar Tanda Tangan Digital (Transparan PNG)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={sigImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleSigImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => sigImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload TTD</span>
                  </button>
                  {editingSignature.signatureImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingSignature({ ...editingSignature, signatureImageUrl: '' })}
                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      Hapus Gambar TTD
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSigModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingSignature.nama || !editingSignature.jabatan) {
                    alert('Mohon isi nama dan jabatan');
                    return;
                  }
                  saveSignature(editingSignature);
                  setIsSigModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition"
              >
                Simpan Pejabat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset ke Standar Resmi Default?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Seluruh pengaturan kop surat, format kertas, footer, dan urutan tanda tangan akan dikembalikan ke pengaturan default pabrik BGN SPPG Krejengan Temenggungan.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
