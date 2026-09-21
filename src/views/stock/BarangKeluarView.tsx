import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, Search, CheckCircle, AlertTriangle, Layers, 
  Sparkles, FileText, Calendar, Box, ShieldCheck, ArrowRight
} from 'lucide-react';
import { MasterBarang, StockMovement } from '../../types';

export const BarangKeluarView: React.FC = () => {
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangId, setSelectedBarangId] = useState<string>('');
  
  // Modes
  const [inputMode, setInputMode] = useState<'sisaStok' | 'jumlahKeluar'>('sisaStok');
  const [pergudanganMethod, setPergudanganMethod] = useState<'FIFO' | 'FEFO'>('FIFO');
  
  // Input values
  const [sisaStokInput, setSisaStokInput] = useState<string>('');
  const [jumlahKeluarInput, setJumlahKeluarInput] = useState<string>('1');
  const [penerimaTujuan, setPenerimaTujuan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resB, resM] = await Promise.all([
        fetch('/api/v1/stock/barang'),
        fetch('/api/v1/stock/movements')
      ]);

      const dB = await resB.json();
      if (dB.success && Array.isArray(dB.data)) {
        setBarangList(dB.data);
        if (dB.data.length > 0 && !selectedBarangId) {
          setSelectedBarangId(dB.data[0].id);
        }
      }

      const dM = await resM.json();
      if (dM.success && Array.isArray(dM.data)) {
        setMovements(dM.data.filter((m: StockMovement) => m.jenis === 'Keluar'));
      }
    } catch (err) {
      console.error('Fetch stock data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedBarang = barangList.find(b => b.id === selectedBarangId) || barangList[0];

  // Calculate quantities dynamically based on inputMode
  const stokAwal = selectedBarang ? selectedBarang.stokSekarang : 0;
  
  let calculatedJumlahKeluar = 0;
  let calculatedSisaStok = 0;

  if (inputMode === 'sisaStok') {
    const sisa = parseFloat(sisaStokInput);
    calculatedSisaStok = isNaN(sisa) ? 0 : sisa;
    calculatedJumlahKeluar = Math.max(0, stokAwal - calculatedSisaStok);
  } else {
    const keluar = parseFloat(jumlahKeluarInput);
    calculatedJumlahKeluar = isNaN(keluar) ? 0 : keluar;
    calculatedSisaStok = Math.max(0, stokAwal - calculatedJumlahKeluar);
  }

  const handleSelectBarang = (b: MasterBarang) => {
    setSelectedBarangId(b.id);
    setSisaStokInput('');
    setJumlahKeluarInput('1');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedBarang) {
      setErrorMsg('Silakan pilih bahan terlebih dahulu.');
      return;
    }

    if (calculatedJumlahKeluar <= 0) {
      setErrorMsg('Jumlah barang keluar harus lebih dari 0.');
      return;
    }

    if (calculatedJumlahKeluar > stokAwal) {
      setErrorMsg(`Stok tidak mencukupi! Stok saat ini ${stokAwal} ${selectedBarang.satuan}.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis: 'Keluar',
          barangId: selectedBarang.id,
          jumlah: calculatedJumlahKeluar,
          penerimaTujuan: penerimaTujuan || 'Dapur SPPG',
          referensiNota: `OUT-${Date.now().toString().slice(-6)}`,
          keterangan: keterangan || `Pengeluaran via ${inputMode === 'sisaStok' ? 'Input Sisa Stok' : 'Input Jumlah Keluar'} (${pergudanganMethod})`,
          petugas: 'Petugas Dapur'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Berhasil mencatat pengeluaran ${selectedBarang.namaBarang} sebanyak ${calculatedJumlahKeluar} ${selectedBarang.satuan}. Sisa stok kini: ${data.data.barangUpdated.stokSekarang} ${selectedBarang.satuan}.`);
        setSisaStokInput('');
        setJumlahKeluarInput('1');
        setPenerimaTujuan('');
        setKeterangan('');
        setTimeout(() => setSuccessMsg(null), 5000);
        fetchData();
      } else {
        setErrorMsg(data.message || 'Gagal menyimpan transaksi.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBarang = barangList.filter(b => 
    b.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.kategoriNama || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER CARD */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Manajemen Barang Keluar (FIFO & FEFO)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Ambil bahan baku dari gudang berdasarkan sistem FIFO (First In First Out) atau FEFO (First Expired First Out).
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN GRID (LEFT: CARI & PILIH BAHAN | RIGHT: FORMULIR BARANG KELUAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CARI & PILIH BAHAN (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            CARI & PILIH BAHAN
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Ketik nama atau kode ID bahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Subheader */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Pilih Bahan Dari Master Stok ({filteredBarang.length})
            </span>
            {selectedBarang && (
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-[11px] rounded-full border border-indigo-200 dark:border-indigo-800">
                Terpilih: {selectedBarang.namaBarang}
              </span>
            )}
          </div>

          {/* Scrollable Items List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredBarang.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Tidak ada bahan baku yang ditemukan.
              </div>
            ) : (
              filteredBarang.map((item) => {
                const isSelected = selectedBarang?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBarang(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                          isSelected 
                            ? 'bg-emerald-800/80 text-emerald-100' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.kategoriNama || 'Bahan Baku'}
                        </span>
                        <span className={`font-mono text-[10px] ${isSelected ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                          {item.kodeBarang}
                        </span>
                      </div>
                      <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.namaBarang}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                        STOK
                      </div>
                      <div className={`text-base font-black ${
                        isSelected 
                          ? 'text-white' 
                          : item.stokSekarang <= item.stokMinimal 
                            ? 'text-rose-600 dark:text-rose-400' 
                            : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {item.stokSekarang} <span className="text-xs font-bold">{item.satuan}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FORMULIR BARANG KELUAR (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>FORMULIR BARANG KELUAR</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cara Input Barang Keluar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cara Input Barang Keluar
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setInputMode('sisaStok')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                    inputMode === 'sisaStok'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Input Sisa Stok</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('jumlahKeluar')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                    inputMode === 'jumlahKeluar'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Input Jumlah Keluar</span>
                </button>
              </div>
            </div>

            {/* Metode Pergudangan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Metode Pergudangan
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setPergudanganMethod('FIFO')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition ${
                    pergudanganMethod === 'FIFO'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  FIFO (First In First Out)
                </button>

                <button
                  type="button"
                  onClick={() => setPergudanganMethod('FEFO')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition ${
                    pergudanganMethod === 'FEFO'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  FEFO (First Expired Out)
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {pergudanganMethod === 'FIFO'
                  ? 'Dahulukan barang yang masuk paling lama. Cocok untuk semua jenis barang.'
                  : 'Dahulukan barang dengan tanggal kedaluwarsa paling dekat.'}
              </p>
            </div>

            {/* Dynamic Input Box */}
            {inputMode === 'sisaStok' ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                <label className="block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  Jumlah Sisa Stok Saat Ini (Di Fisik/Dapur)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Contoh: 3, 5.5, dsb."
                    value={sisaStokInput}
                    onChange={(e) => setSisaStokInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="px-4 py-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs rounded-xl border border-emerald-300 dark:border-emerald-800">
                    {selectedBarang ? selectedBarang.satuan : 'Unit'}
                  </div>
                </div>

                {selectedBarang && sisaStokInput !== '' && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 font-medium flex items-center justify-between">
                    <span>Stok Awal: <b>{stokAwal} {selectedBarang.satuan}</b></span>
                    <span>Barang Keluar = <b>{calculatedJumlahKeluar} {selectedBarang.satuan}</b></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                <label className="block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  Jumlah Barang Keluar
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="Contoh: 1, 2, 5, dsb."
                    value={jumlahKeluarInput}
                    onChange={(e) => setJumlahKeluarInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="px-4 py-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs rounded-xl border border-emerald-300 dark:border-emerald-800">
                    {selectedBarang ? selectedBarang.satuan : 'Unit'}
                  </div>
                </div>

                {selectedBarang && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 font-medium flex items-center justify-between">
                    <span>Stok Awal: <b>{stokAwal} {selectedBarang.satuan}</b></span>
                    <span>Sisa Stok = <b>{calculatedSisaStok} {selectedBarang.satuan}</b></span>
                  </div>
                )}
              </div>
            )}

            {/* Optional penerima/keterangan */}
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Penerima / Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dapur Utama / Masak Makan Siang"
                  value={penerimaTujuan}
                  onChange={(e) => setPenerimaTujuan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedBarang || calculatedJumlahKeluar <= 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md ${
                submitting || !selectedBarang || calculatedJumlahKeluar <= 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99]'
              }`}
            >
              {submitting 
                ? 'MEMPROSES...' 
                : `SIMPAN BARANG KELUAR (${calculatedJumlahKeluar} ${selectedBarang ? selectedBarang.satuan.toUpperCase() : 'UNIT'})`}
            </button>
          </form>
        </div>
      </div>

      {/* 3. BOTTOM CARD: SELECTED ITEM DETAILS & BATCHES */}
      {selectedBarang && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg">
                {selectedBarang.kategoriNama || 'Bahan Baku'}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                {selectedBarang.namaBarang}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Kode ID: {selectedBarang.kodeBarang}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                TOTAL STOK
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {selectedBarang.stokSekarang} <span className="text-sm font-bold text-slate-500">{selectedBarang.satuan}</span>
              </div>
            </div>
          </div>

          {/* Batches section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="uppercase text-slate-400 tracking-wider">BATCHES TERSIMPAN</span>
              <span className="text-slate-400">Urut: {pergudanganMethod} ({pergudanganMethod === 'FIFO' ? 'Masuk Dulu' : 'Expired Dulu'})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded">
                    Batch #1
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Masuk: {selectedBarang.updatedAt ? selectedBarang.updatedAt.slice(0, 10) : '29/07/2026'}</span>
                  </div>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedBarang.stokSekarang} {selectedBarang.satuan}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
