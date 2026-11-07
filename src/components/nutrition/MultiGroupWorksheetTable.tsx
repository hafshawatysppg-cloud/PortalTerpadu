import React, { useState } from 'react';
import { MultiGroupIngredientItem, TargetCountConfig } from './nutritionData';
import { MasterBahanPangan } from '../../types';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Info, 
  Calculator, 
  Check, 
  ArrowRight,
  ChevronDown,
  Edit2,
  CheckCircle,
  PackagePlus,
  ChefHat,
  RefreshCw,
  Users,
  Radio,
  Coins,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  getHargaDasarFromRab, 
  syncHargaDasarToRab,
  getActiveRabFilterDate,
  syncAllIngredientsWithRabDate,
  PriceSyncSourceMode
} from '../../utils/rabFoodCostHelper';

interface MultiGroupWorksheetTableProps {
  ingredients: MultiGroupIngredientItem[];
  onChangeIngredients: (items: MultiGroupIngredientItem[]) => void;
  targetCounts: TargetCountConfig;
  onChangeTargetCounts: (targets: TargetCountConfig) => void;
  menuName: string;
  masterBahan?: MasterBahanPangan[];
  isReadOnly?: boolean;
  onSyncBeneficiaries?: () => void;
  isSyncingBeneficiaries?: boolean;
  beneficiaryLiveInfo?: {
    totalPenerima: number;
    totalSiswa: number;
    totalGuru: number;
    totalBalita: number;
    totalIbuHamil: number;
    totalIbuMenyusui: number;
    totalInstansi: number;
    statusLock?: string;
  } | null;
  tanggalPelaksanaan?: string;
}

export type TargetGroupKey = 'all' | 'porsiKecil' | 'porsiBesar' | 'balita' | 'bumilBusui';

export const formatRupiah = (val: number) => {
  return 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');
};

export const MultiGroupWorksheetTable: React.FC<MultiGroupWorksheetTableProps> = ({
  ingredients,
  onChangeIngredients,
  targetCounts,
  onChangeTargetCounts,
  menuName,
  masterBahan = [],
  isReadOnly = false,
  onSyncBeneficiaries,
  isSyncingBeneficiaries = false,
  beneficiaryLiveInfo,
  tanggalPelaksanaan
}) => {
  const [selectedGroupTab, setSelectedGroupTab] = useState<TargetGroupKey>('all');
  const [manualEditIndices, setManualEditIndices] = useState<{ [key: number]: boolean }>({});

  // Mode sinkronisasi sumber harga RAB: pelaksanaan atau filter RAB akuntan
  const [priceSyncMode, setPriceSyncMode] = useState<PriceSyncSourceMode>('pelaksanaan');
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Ambil tanggal filter aktif di menu RAB Akuntan
  const rabFilterDate = getActiveRabFilterDate();

  // Tanggal acuan aktif untuk menarik data harga dari RAB
  const effectivePriceDate = React.useMemo(() => {
    if (priceSyncMode === 'filter_rab' && rabFilterDate) return rabFilterDate;
    return tanggalPelaksanaan || rabFilterDate || '2026-11-01';
  }, [priceSyncMode, rabFilterDate, tanggalPelaksanaan]);

  // Handler sinkronisasi ulang seluruh harga dasar dari RAB untuk tanggal terpilih
  const handleSyncAllPricesFromRab = (targetDateToUse?: string) => {
    const dateToUse = targetDateToUse || effectivePriceDate;
    const { updatedIngredients, filledCount, emptyCount } = syncAllIngredientsWithRabDate(ingredients, dateToUse);
    onChangeIngredients(updatedIngredients);
    setSyncNotification(`Berhasil menyinkronkan ${ingredients.length} harga dasar dari RAB tanggal ${dateToUse} (${filledCount} terisi, ${emptyCount} kosong).`);
    setTimeout(() => setSyncNotification(null), 4000);
  };

  // Auto-sync harga dasar saat effectivePriceDate berubah
  React.useEffect(() => {
    if (effectivePriceDate && ingredients.length > 0) {
      const { updatedIngredients } = syncAllIngredientsWithRabDate(ingredients, effectivePriceDate);
      const hasChanged = updatedIngredients.some((u, idx) => (u.hargaPerKg || 0) !== (ingredients[idx]?.hargaPerKg || 0));
      if (hasChanged) {
        onChangeIngredients(updatedIngredients);
      }
    }
  }, [effectivePriceDate]);

  // Group master bahan by kategori for easy selection
  const masterByCategory = React.useMemo(() => {
    const map: { [cat: string]: MasterBahanPangan[] } = {};
    masterBahan.forEach(b => {
      const cat = b.kategori || 'Lain-lain';
      if (!map[cat]) map[cat] = [];
      map[cat].push(b);
    });
    return map;
  }, [masterBahan]);

  // Handle cell edits
  const handleUpdateItem = (index: number, field: keyof MultiGroupIngredientItem, value: any) => {
    const updated = [...ingredients];
    (updated[index] as any)[field] = value;
    onChangeIngredients(updated);
  };

  // Handle choosing ingredient from Master Dropdown
  const handleSelectMasterIngredient = (index: number, selectedName: string) => {
    if (selectedName === '__CUSTOM_MANUAL__') {
      setManualEditIndices(prev => ({ ...prev, [index]: true }));
      return;
    }

    const matchedMaster = masterBahan.find(b => b.namaBahan.toLowerCase() === selectedName.toLowerCase());
    const updated = [...ingredients];
    if (matchedMaster) {
      // Sesuai aturan: Sambungkan data dengan RAB Bahan Baku. Jika belum terisi di RAB maka kosong (0)
      const rabPrice = getHargaDasarFromRab(matchedMaster.namaBahan, effectivePriceDate);
      updated[index] = {
        ...updated[index],
        bahanPangan: matchedMaster.namaBahan,
        bddPercent: matchedMaster.bddDefault || 100,
        satuan: matchedMaster.satuanPembelian || 'Kg',
        hargaPerKg: rabPrice || 0
      };
    } else {
      const rabPrice = getHargaDasarFromRab(selectedName, effectivePriceDate);
      updated[index] = {
        ...updated[index],
        bahanPangan: selectedName,
        hargaPerKg: rabPrice || 0
      };
    }
    onChangeIngredients(updated);
  };

  const toggleManualInput = (index: number) => {
    setManualEditIndices(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAddRow = () => {
    const newNo = ingredients.length + 1;
    // Pick the first available master item or placeholder
    const firstMaster = masterBahan.length > 0 ? masterBahan[0] : null;
    const initialName = firstMaster ? firstMaster.namaBahan : 'Pilih Bahan Pangan';
    const rabPrice = getHargaDasarFromRab(initialName, effectivePriceDate);

    const newItem: MultiGroupIngredientItem = {
      no: newNo,
      bahanPangan: initialName,
      porsiKecilNet: 25,
      porsiBesarNet: 50,
      balitaNet: 25,
      bumilBusuiNet: 50,
      bddPercent: firstMaster?.bddDefault || 100,
      satuan: firstMaster?.satuanPembelian || 'Kg',
      pembulatan: 1,
      hargaPerKg: rabPrice || 0 // Kosong jika di RAB Bahan Baku belum terisi
    };
    onChangeIngredients([...ingredients, newItem]);
  };

  const handleDeleteRow = (index: number) => {
    const filtered = ingredients.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      no: idx + 1
    }));
    onChangeIngredients(filtered);
  };

  // Helper calculation functions
  const calcGross = (net: number, bdd: number) => {
    const safeBdd = bdd > 0 ? bdd / 100 : 1;
    return Number((net / safeBdd).toFixed(2));
  };

  const calcReqKg = (gross: number, target: number) => {
    return Number(((gross * target) / 1000).toFixed(2));
  };

  // Group metadata with descriptive sublabels matching Penerima Manfaat
  const groupConfig = [
    { 
      key: 'porsiKecil' as const, 
      label: 'PORSI KECIL', 
      sublabel: 'Siswa PAUD & SD Kelas 1-3',
      count: targetCounts.porsiKecil, 
      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' 
    },
    { 
      key: 'porsiBesar' as const, 
      label: 'PORSI BESAR', 
      sublabel: 'Siswa SD Kelas 4-6, SMP & Guru',
      count: targetCounts.porsiBesar, 
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' 
    },
    { 
      key: 'balita' as const, 
      label: 'BALITA', 
      sublabel: 'Balita Posyandu / Desa',
      count: targetCounts.balita, 
      color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' 
    },
    { 
      key: 'bumilBusui' as const, 
      label: 'BUMIL & BUSUI', 
      sublabel: 'Ibu Hamil & Ibu Menyusui',
      count: targetCounts.bumilBusui, 
      color: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' 
    }
  ];

  // Kalkulasi Metrik Biaya Per Sasaran untuk informasi di bagian atas sesuai porsi masing-masing (Permintaan User #3)
  const portionMetrics = React.useMemo(() => {
    let totalKgKecil = 0;
    let totalHargaKecil = 0;
    let totalKgBesar = 0;
    let totalHargaBesar = 0;
    let totalKgBalita = 0;
    let totalHargaBalita = 0;
    let totalKgBumil = 0;
    let totalHargaBumil = 0;

    ingredients.forEach((item) => {
      const bdd = Number(item.bddPercent) || 100;
      // Harga dasar tersinkronisasi sesuai tanggal aktif
      const hargaDasar = Number(item.hargaPerKg) || 0;

      // Porsi Kecil
      const grossKecil = calcGross(Number(item.porsiKecilNet) || 0, bdd);
      const reqKecil = calcReqKg(grossKecil, targetCounts.porsiKecil);
      totalKgKecil += reqKecil;
      if (hargaDasar > 0) totalHargaKecil += Math.round(reqKecil * hargaDasar);

      // Porsi Besar
      const grossBesar = calcGross(Number(item.porsiBesarNet) || 0, bdd);
      const reqBesar = calcReqKg(grossBesar, targetCounts.porsiBesar);
      totalKgBesar += reqBesar;
      if (hargaDasar > 0) totalHargaBesar += Math.round(reqBesar * hargaDasar);

      // Balita
      const grossBalita = calcGross(Number(item.balitaNet) || 0, bdd);
      const reqBalita = calcReqKg(grossBalita, targetCounts.balita);
      totalKgBalita += reqBalita;
      if (hargaDasar > 0) totalHargaBalita += Math.round(reqBalita * hargaDasar);

      // Bumil & Busui
      const grossBumil = calcGross(Number(item.bumilBusuiNet) || 0, bdd);
      const reqBumil = calcReqKg(grossBumil, targetCounts.bumilBusui);
      totalKgBumil += reqBumil;
      if (hargaDasar > 0) totalHargaBumil += Math.round(reqBumil * hargaDasar);
    });

    const perSasaranKecil = targetCounts.porsiKecil > 0 ? Math.round(totalHargaKecil / targetCounts.porsiKecil) : 0;
    const perSasaranBesar = targetCounts.porsiBesar > 0 ? Math.round(totalHargaBesar / targetCounts.porsiBesar) : 0;
    const perSasaranBalita = targetCounts.balita > 0 ? Math.round(totalHargaBalita / targetCounts.balita) : 0;
    const perSasaranBumil = targetCounts.bumilBusui > 0 ? Math.round(totalHargaBumil / targetCounts.bumilBusui) : 0;

    const grandTotalKg = totalKgKecil + totalKgBesar + totalKgBalita + totalKgBumil;
    const grandTotalBufferKg = Number((grandTotalKg * 0.05).toFixed(2));
    const grandTotalPlusBufferKg = Number((grandTotalKg + grandTotalBufferKg).toFixed(2));
    const grandTotalHarga = totalHargaKecil + totalHargaBesar + totalHargaBalita + totalHargaBumil;
    const totalSasaranSum = targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui;
    const rataRataPerSasaran = totalSasaranSum > 0 ? Math.round(grandTotalHarga / totalSasaranSum) : 0;

    return {
      porsiKecil: {
        totalKg: Number(totalKgKecil.toFixed(2)),
        totalHarga: totalHargaKecil,
        perSasaran: perSasaranKecil,
        count: targetCounts.porsiKecil
      },
      porsiBesar: {
        totalKg: Number(totalKgBesar.toFixed(2)),
        totalHarga: totalHargaBesar,
        perSasaran: perSasaranBesar,
        count: targetCounts.porsiBesar
      },
      balita: {
        totalKg: Number(totalKgBalita.toFixed(2)),
        totalHarga: totalHargaBalita,
        perSasaran: perSasaranBalita,
        count: targetCounts.balita
      },
      bumilBusui: {
        totalKg: Number(totalKgBumil.toFixed(2)),
        totalHarga: totalHargaBumil,
        perSasaran: perSasaranBumil,
        count: targetCounts.bumilBusui
      },
      grandTotalKg: Number(grandTotalKg.toFixed(2)),
      grandTotalBufferKg,
      grandTotalPlusBufferKg,
      grandTotalHarga,
      totalSasaranSum,
      rataRataPerSasaran
    };
  }, [ingredients, targetCounts, tanggalPelaksanaan]);

  // Render Bahan Pangan Dropdown Cell
  const renderBahanPanganCell = (item: MultiGroupIngredientItem, index: number) => {
    if (isReadOnly) {
      return (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {item.bahanPangan}
        </span>
      );
    }

    const isManual = manualEditIndices[index];

    if (isManual) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={item.bahanPangan}
            placeholder="Ketik nama bahan manual..."
            onChange={(e) => handleUpdateItem(index, 'bahanPangan', e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
          <button
            type="button"
            onClick={() => toggleManualInput(index)}
            className="p-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shrink-0"
            title="Kembali ke Dropdown Master"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    const isExistingInMaster = masterBahan.some(b => b.namaBahan.toLowerCase() === item.bahanPangan.toLowerCase());

    return (
      <div className="flex items-center gap-1 min-w-[200px] max-w-[320px]">
        <select
          value={isExistingInMaster ? item.bahanPangan : item.bahanPangan}
          onChange={(e) => handleSelectMasterIngredient(index, e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate shadow-2xs"
        >
          {!isExistingInMaster && item.bahanPangan && (
            <option value={item.bahanPangan}>
              {item.bahanPangan} (Bahan Saat Ini)
            </option>
          )}

          {Object.keys(masterByCategory).length > 0 ? (
            (Object.entries(masterByCategory) as [string, MasterBahanPangan[]][]).map(([cat, list]) => (
              <optgroup key={cat} label={`-- ${cat.toUpperCase()} --`}>
                {list.map(b => (
                  <option key={b.id} value={b.namaBahan}>
                    {b.namaBahan} (BDD: {b.bddDefault}%, Satuan: {b.satuanPembelian})
                  </option>
                ))}
              </optgroup>
            ))
          ) : (
            <option value={item.bahanPangan}>{item.bahanPangan}</option>
          )}

          <option value="__CUSTOM_MANUAL__" className="text-emerald-600 font-bold">
            + Ketik Nama Bahan Manual / Kustom...
          </option>
        </select>

        <button
          type="button"
          onClick={() => toggleManualInput(index)}
          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
          title="Edit teks manual"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Target Counts Quick Editor */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Konfigurasi Jumlah Sasaran (4 Kelompok)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Penerima Manfaat
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Formula Otomatis: Kebutuhan (kg) = (Berat Bersih / (BDD/100) × Jumlah Sasaran) / 1000
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onSyncBeneficiaries && !isReadOnly && (
              <button
                type="button"
                onClick={onSyncBeneficiaries}
                disabled={isSyncingBeneficiaries}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Tarik & sinkronkan ulang data sasaran dari modul Penerima Manfaat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBeneficiaries ? 'animate-spin' : ''}`} />
                <span>{isSyncingBeneficiaries ? 'Menyinkronkan...' : 'Sinkronkan Realtime Penerima Manfaat'}</span>
              </button>
            )}
            {(() => {
              const totalSasaranSum = targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui;
              const riilTotal = beneficiaryLiveInfo?.totalPenerima || totalSasaranSum;
              const isMatch = totalSasaranSum === riilTotal && riilTotal > 0;

              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs font-semibold px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                    Total Seluruh Sasaran: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalSasaranSum.toLocaleString('id-ID')}</span> Porsi
                  </div>
                  {isMatch && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Check className="w-3 h-3 text-emerald-600" />
                      100% Sinkron Riil
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Live Beneficiary Breakdown Info Bar */}
        {(() => {
          const totalSasaranSum = targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui;
          const riilTotal = beneficiaryLiveInfo?.totalPenerima || totalSasaranSum;
          const isMatch = totalSasaranSum === riilTotal && riilTotal > 0;

          return (
            <div className={`mb-3 px-3.5 py-2.5 rounded-xl text-[11px] flex flex-wrap items-center justify-between gap-2 border ${
              riilTotal > 0
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <Users className={`w-3.5 h-3.5 ${riilTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} shrink-0`} />
                <span className="font-bold">Data Riil Penerima Manfaat:</span>
                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  {riilTotal.toLocaleString('id-ID')} Total Jiwa
                </span>
                <span className="opacity-40">•</span>
                <span className="font-bold">Total Porsi Terjadwal:</span>
                <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300">
                  {totalSasaranSum.toLocaleString('id-ID')} Porsi
                </span>
                <span className="opacity-40">•</span>
                <span>{beneficiaryLiveInfo?.totalInstansi || 0} Lokasi/Instansi</span>
                {isMatch ? (
                  <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[9px] font-bold inline-flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    Sinkron Sesuai Riil (Status: {beneficiaryLiveInfo?.statusLock || 'FINAL'})
                  </span>
                ) : riilTotal > 0 ? (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded text-[9px] font-bold">
                    Perlu Sinkronisasi Ulang
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[9px] font-semibold">
                    Tidak Ada Penerima Manfaat
                  </span>
                )}
              </div>
              <div className="text-[10px] font-medium">
                {riilTotal > 0 ? (
                  <span>Siswa: {beneficiaryLiveInfo?.totalSiswa?.toLocaleString('id-ID') || (targetCounts.porsiKecil + targetCounts.porsiBesar).toLocaleString('id-ID')} | Guru/Kader: {beneficiaryLiveInfo?.totalGuru?.toLocaleString('id-ID') || 0} | Balita: {beneficiaryLiveInfo?.totalBalita?.toLocaleString('id-ID') || targetCounts.balita.toLocaleString('id-ID')} | Bumil & Busui: {((beneficiaryLiveInfo?.totalIbuHamil || 0) + (beneficiaryLiveInfo?.totalIbuMenyusui || 0))?.toLocaleString('id-ID') || targetCounts.bumilBusui.toLocaleString('id-ID')}</span>
                ) : (
                  <span className="text-slate-400">Belum ada perencanaan penerima manfaat pada tanggal pelaksanaan ini</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Informasi Total Biaya Per Sasaran di Atas Sesuai Porsi Masing-masing (Permintaan User #3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {groupConfig.map(grp => {
            const m = portionMetrics[grp.key];
            return (
              <div key={grp.key} className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-emerald-400 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{grp.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${grp.color}`}>
                      {grp.count.toLocaleString('id-ID')} PM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title={grp.sublabel}>
                    {grp.sublabel}
                  </p>
                </div>

                {/* Panel Metrik Total Bahan & Total Biaya Per Sasaran */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Total Bahan:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.totalKg} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Total Harga Bahan:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {m.totalHarga > 0 ? formatRupiah(m.totalHarga) : 'Rp 0'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-teal-800 dark:text-teal-300 block">
                        Biaya Per Sasaran:
                      </span>
                      <span className="text-[8px] text-slate-400">
                        {m.count > 0 ? `(${formatRupiah(m.totalHarga)} ÷ ${m.count} PM)` : 'PM Kosong'}
                      </span>
                    </div>
                    <div className="text-xs font-black text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-300 dark:border-teal-700 shrink-0">
                      {m.totalHarga > 0 && m.count > 0 ? formatRupiah(m.perSasaran) : 'Rp 0'}
                      <span className="text-[9px] font-normal text-teal-600 dark:text-teal-400">/PM</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-medium">Sasaran:</span>
                  <input
                    type="number"
                    min="0"
                    readOnly={isReadOnly || Boolean(beneficiaryLiveInfo && beneficiaryLiveInfo.totalPenerima > 0)}
                    value={targetCounts[grp.key]}
                    onChange={(e) => onChangeTargetCounts({
                      ...targetCounts,
                      [grp.key]: Number(e.target.value) || 0
                    })}
                    className={`w-full px-2 py-1 rounded-lg text-xs font-bold text-center focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                      beneficiaryLiveInfo && beneficiaryLiveInfo.totalPenerima > 0
                        ? 'bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-default'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                    title={beneficiaryLiveInfo && beneficiaryLiveInfo.totalPenerima > 0 ? "Tersinkronisasi otomatis dari Data Penerima Manfaat Harian" : "Jumlah sasaran"}
                  />
                  <span className="text-[10px] text-slate-500 font-medium shrink-0">jiwa</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel: Sinkronisasi Harga Dasar dengan Tanggal Pembuatan / Filter Tanggal RAB */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/70 to-slate-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600 text-white rounded-lg shadow-2xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-950 dark:text-teal-100 uppercase tracking-wide">
                  Sinkronisasi Harga Dasar dari RAB Bahan Baku
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                  Acuan Aktif: {effectivePriceDate}
                </span>
              </div>
              <p className="text-[11px] text-teal-700 dark:text-teal-300">
                Harga dasar terhubung langsung dengan RAB. Jika di RAB belum terisi pada tanggal ini, harga dasar akan kosong.
              </p>
            </div>
          </div>

          {/* Opsi Pilihan Tanggal Sumber Sinkronisasi */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sinkronkan ke:</span>
            
            {/* Tombol Opsi: Tanggal Pelaksanaan */}
            <button
              type="button"
              onClick={() => {
                setPriceSyncMode('pelaksanaan');
                handleSyncAllPricesFromRab(tanggalPelaksanaan);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                priceSyncMode === 'pelaksanaan'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={`Sinkronkan harga dengan RAB tanggal pelaksanaan (${tanggalPelaksanaan || '-'})`}
            >
              <Calendar className="w-3 h-3" />
              <span>Tgl Pelaksanaan ({tanggalPelaksanaan || '-'})</span>
            </button>

            {/* Tombol Opsi: Filter Tanggal RAB Akuntan */}
            <button
              type="button"
              onClick={() => {
                setPriceSyncMode('filter_rab');
                handleSyncAllPricesFromRab(rabFilterDate);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                priceSyncMode === 'filter_rab'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={`Sinkronkan harga dengan filter tanggal aktif di RAB Akuntan (${rabFilterDate})`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Filter RAB Akuntan ({rabFilterDate})</span>
            </button>

            {/* Tombol Aksi Langsung Tarik Ulang */}
            <button
              type="button"
              onClick={() => handleSyncAllPricesFromRab(effectivePriceDate)}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Tarik & sinkronkan ulang seluruh harga dasar dari RAB"
            >
              <RefreshCw className="w-3 h-3" />
              <span>⚡ Sinkronkan Harga</span>
            </button>
          </div>
        </div>

        {/* Notifikasi info hasil sinkronisasi harga */}
        {syncNotification && (
          <div className="px-3 py-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>{syncNotification}</span>
          </div>
        )}
      </div>

      {/* Tabs Switcher & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedGroupTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedGroupTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua (Matriks Terpadu)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 text-slate-200 rounded-full">{ingredients.length}</span>
          </button>

          {groupConfig.map(grp => (
            <button
              key={grp.key}
              onClick={() => setSelectedGroupTab(grp.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedGroupTab === grp.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{grp.label}</span>
              <span className="text-[10px] opacity-80">({grp.count})</span>
            </button>
          ))}
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              title="Tambah baris bahan pangan dari Master Data"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan Pangan</span>
            </button>
          </div>
        )}
      </div>

      {/* EMPTY STATE IF NO INGREDIENTS */}
      {ingredients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Form Perencanaan Menu Masih Kosong
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Belum ada bahan pangan yang ditambahkan untuk menu ini. Silakan klik tombol di bawah untuk mulai memilih bahan dari Master Bahan Pangan.
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Tambah Bahan Pangan Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* SINGLE GROUP TABLE VIEW (Format Bersih dengan Informasi Biaya Per Sasaran di Atas & Harga Terhubung ke RAB) */}
          {selectedGroupTab !== 'all' && (
            <div className="space-y-3">
              {/* Active Tab Portion Executive Summary Banner (Permintaan User #3: Informasi Total Biaya Per Sasaran di Atas) */}
              {(() => {
                const currentGrp = groupConfig.find(g => g.key === selectedGroupTab)!;
                const m = portionMetrics[selectedGroupTab];
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-100/70 dark:from-teal-950/70 dark:via-emerald-950/50 dark:to-teal-900/60 border-2 border-teal-300 dark:border-teal-700 shadow-sm space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 dark:border-teal-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-teal-100">
                              Informasi Total Biaya Per Sasaran: {currentGrp.label}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${currentGrp.color}`}>
                              {m.count.toLocaleString('id-ID')} PM
                            </span>
                          </div>
                          <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5 font-medium">
                            {currentGrp.sublabel} &bull; Standar Porsi Khusus Food Cost SPPG
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block">Total Biaya Per Sasaran:</span>
                          <div className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-100 flex items-baseline gap-1 justify-end">
                            <span>{m.totalHarga > 0 && m.count > 0 ? formatRupiah(m.perSasaran) : 'Rp 0'}</span>
                            <span className="text-xs font-normal text-teal-700 dark:text-teal-300">/ sasaran</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-teal-200/60 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 font-medium block">Jumlah Sasaran (PM):</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{m.count.toLocaleString('id-ID')} Jiwa</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-teal-200/60 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 font-medium block">Total Kebutuhan Bahan:</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{m.totalKg} kg</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-teal-200/60 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 font-medium block">Total Biaya Bahan ({currentGrp.label}):</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                          {m.totalHarga > 0 ? formatRupiah(m.totalHarga) : 'Rp 0 (Belum diisi di RAB)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-700">
                        <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold block">Rumus Perhitungan:</span>
                        <span className="font-extrabold text-[11px] text-teal-950 dark:text-teal-100 leading-tight block truncate" title={`Total Harga (${formatRupiah(m.totalHarga)}) ÷ ${m.count.toLocaleString('id-ID')} PM`}>
                          {formatRupiah(m.totalHarga)} ÷ {m.count.toLocaleString('id-ID')} PM
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {(() => {
                  const currentGrp = groupConfig.find(g => g.key === selectedGroupTab)!;
                  const netKey = (
                    selectedGroupTab === 'porsiKecil' ? 'porsiKecilNet' :
                    selectedGroupTab === 'porsiBesar' ? 'porsiBesarNet' :
                    selectedGroupTab === 'balita' ? 'balitaNet' : 'bumilBusuiNet'
                  ) as keyof MultiGroupIngredientItem;

                  let sumKg = 0;
                  let sumHarga = 0;

                  return (
                    <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-900">
                      <thead>
                        <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
                          <th className="py-2.5 px-2 font-bold w-10 border-r border-slate-700">1<br/><span className="text-[10px] font-normal">No</span></th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-left min-w-[200px]">2<br/><span className="text-[10px] font-normal">Bahan Pangan (Master Data)</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700">3<br/><span className="text-[10px] font-normal">Kelompok Sasaran</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700">4<br/><span className="text-[10px] font-normal">Berat Bersih (gr)</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700">5<br/><span className="text-[10px] font-normal">PERSEN BDD</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700">6<br/><span className="text-[10px] font-normal">Berat Kotor (gr)</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700">7<br/><span className="text-[10px] font-normal">Jumlah Sasaran</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700 bg-emerald-900/90 text-emerald-100">8<br/><span className="text-[10px] font-normal">Kebutuhan (kg)</span></th>
                          <th className="py-2.5 px-2 font-bold border-r border-slate-700 bg-slate-900 text-slate-200">9<br/><span className="text-[10px] font-normal">Satuan</span></th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-teal-900 text-teal-100 text-right">10<br/><span className="text-[10px] font-normal">Harga Dasar (Rp)</span></th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-emerald-950 text-emerald-200 text-right">11<br/><span className="text-[10px] font-normal">Total Harga (Rp)</span></th>
                          {!isReadOnly && <th className="py-2.5 px-2 font-bold w-10">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {ingredients.map((item, index) => {
                          const netVal = Number(item[netKey]) || 0;
                          const bddVal = Number(item.bddPercent) || 100;
                          const grossVal = calcGross(netVal, bddVal);
                          const reqKg = calcReqKg(grossVal, currentGrp.count);

                          // Harga dasar tersinkronisasi dari RAB sesuai acuan tanggal aktif
                          const itemHargaDasar = Number(item.hargaPerKg) || 0;
                          const itemTotalHarga = itemHargaDasar > 0 ? Math.round(reqKg * itemHargaDasar) : 0;
                          sumKg += reqKg;
                          sumHarga += itemTotalHarga;

                          return (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2 px-2 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                                {item.no}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                                {renderBahanPanganCell(item, index)}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-[11px] border-r border-slate-200 dark:border-slate-800">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${currentGrp.color}`}>
                                  {currentGrp.label}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                                {isReadOnly ? (
                                  netVal
                                ) : (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={netVal}
                                    onChange={(e) => handleUpdateItem(index, netKey, Number(e.target.value) || 0)}
                                    className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-semibold text-slate-900 dark:text-slate-100 text-xs"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                                {isReadOnly ? (
                                  `${bddVal}%`
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={bddVal}
                                    onChange={(e) => handleUpdateItem(index, 'bddPercent', Number(e.target.value) || 100)}
                                    className="w-14 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-semibold text-slate-900 dark:text-slate-100 text-xs"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-2 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                {grossVal.toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                                {currentGrp.count.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                                {reqKg.toFixed(2)}
                              </td>
                              {/* Satuan Editable */}
                              <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                                {isReadOnly ? (
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{item.satuan || 'Kg'}</span>
                                ) : (
                                  <input
                                    type="text"
                                    value={item.satuan || 'Kg'}
                                    onChange={(e) => handleUpdateItem(index, 'satuan', e.target.value)}
                                    className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
                                )}
                              </td>
                              {/* Harga Dasar Editable: Terhubung ke RAB Bahan Baku, Kosong jika belum terisi */}
                              <td className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-800">
                                {isReadOnly ? (
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs font-mono">
                                    {itemHargaDasar > 0 ? formatRupiah(itemHargaDasar) : '-'}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-[10px] text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="500"
                                      placeholder="Kosong"
                                      value={itemHargaDasar > 0 ? itemHargaDasar : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                                        handleUpdateItem(index, 'hargaPerKg', val);
                                        syncHargaDasarToRab(item.bahanPangan, val, [effectivePriceDate, tanggalPelaksanaan || ''].filter(Boolean));
                                      }}
                                      className="w-20 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                                      title={itemHargaDasar > 0 ? `Harga satuan tersinkron ke RAB (${effectivePriceDate}): ${formatRupiah(itemHargaDasar)}` : `Harga belum terisi di RAB Bahan Baku tanggal ${effectivePriceDate}`}
                                    />
                                  </div>
                                )}
                              </td>
                              {/* Total Harga */}
                              <td className="py-2 px-3 text-right font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                                {itemTotalHarga > 0 ? formatRupiah(itemTotalHarga) : '-'}
                              </td>
                              {!isReadOnly && (
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => handleDeleteRow(index)}
                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                    title="Hapus baris"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ALL GROUPS COMBINED MATRIX VIEW */}
          {selectedGroupTab === 'all' && (
            <div className="space-y-4">
              {/* Ringkasan Total Biaya Persasaran di Atas Tabel Sesuai Porsi Masing-Masing */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-blue-50/80 dark:from-teal-950/40 dark:via-emerald-950/40 dark:to-blue-950/40 border border-teal-200 dark:border-teal-800/60 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-teal-200/60 dark:border-teal-800/60 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-600 text-white rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-teal-950 dark:text-teal-100 uppercase tracking-wide">
                        Informasi Total Biaya Per Sasaran (Sesuai Porsi Masing-Masing)
                      </h4>
                      <p className="text-[11px] text-teal-700 dark:text-teal-300">
                        Harga dasar terhubung langsung dengan RAB Bahan Baku. Rumus: <span className="font-semibold underline">Total Harga Porsi ÷ Jumlah Sasaran PM</span>.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block">Total Seluruh Sasaran:</span>
                    <span className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100">
                      {(targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui).toLocaleString('id-ID')} PM
                    </span>
                  </div>
                </div>

                {/* 4 Kartu Biaya Per Sasaran */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Porsi Kecil */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                        Porsi Kecil ({targetCounts.porsiKecil} PM)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {portionMetrics.porsiKecil.totalKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Biaya Per Sasaran:</span>
                      <div className="text-base font-black text-amber-900 dark:text-amber-200">
                        {portionMetrics.porsiKecil.totalHarga > 0 && targetCounts.porsiKecil > 0 ? formatRupiah(portionMetrics.porsiKecil.perSasaran) : 'Rp 0'}
                        <span className="text-[10px] font-normal text-slate-500"> / PM</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>Total Anggaran:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {portionMetrics.porsiKecil.totalHarga > 0 ? formatRupiah(portionMetrics.porsiKecil.totalHarga) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Porsi Besar */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                        Porsi Besar ({targetCounts.porsiBesar} PM)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {portionMetrics.porsiBesar.totalKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Biaya Per Sasaran:</span>
                      <div className="text-base font-black text-emerald-900 dark:text-emerald-200">
                        {portionMetrics.porsiBesar.totalHarga > 0 && targetCounts.porsiBesar > 0 ? formatRupiah(portionMetrics.porsiBesar.perSasaran) : 'Rp 0'}
                        <span className="text-[10px] font-normal text-slate-500"> / PM</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>Total Anggaran:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {portionMetrics.porsiBesar.totalHarga > 0 ? formatRupiah(portionMetrics.porsiBesar.totalHarga) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Balita */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/50 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
                        Balita ({targetCounts.balita} PM)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {portionMetrics.balita.totalKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Biaya Per Sasaran:</span>
                      <div className="text-base font-black text-blue-900 dark:text-blue-200">
                        {portionMetrics.balita.totalHarga > 0 && targetCounts.balita > 0 ? formatRupiah(portionMetrics.balita.perSasaran) : 'Rp 0'}
                        <span className="text-[10px] font-normal text-slate-500"> / PM</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>Total Anggaran:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {portionMetrics.balita.totalHarga > 0 ? formatRupiah(portionMetrics.balita.totalHarga) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Bumil & Busui */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-900/50 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full">
                        Bumil & Busui ({targetCounts.bumilBusui} PM)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {portionMetrics.bumilBusui.totalKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Biaya Per Sasaran:</span>
                      <div className="text-base font-black text-purple-900 dark:text-purple-200">
                        {portionMetrics.bumilBusui.totalHarga > 0 && targetCounts.bumilBusui > 0 ? formatRupiah(portionMetrics.bumilBusui.perSasaran) : 'Rp 0'}
                        <span className="text-[10px] font-normal text-slate-500"> / PM</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>Total Anggaran:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {portionMetrics.bumilBusui.totalHarga > 0 ? formatRupiah(portionMetrics.bumilBusui.totalHarga) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-900">
                  <thead>
                    <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
                      <th rowSpan={2} className="py-2 px-2 font-bold w-10 border-r border-slate-700">No</th>
                      <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-700 text-left min-w-[200px]">Bahan Pangan (Master)</th>
                      <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700">BDD</th>
                      <th colSpan={2} className="py-1 px-2 font-bold border-r border-slate-700 bg-amber-950 text-amber-200">
                        Porsi Kecil ({targetCounts.porsiKecil})
                      </th>
                      <th colSpan={2} className="py-1 px-2 font-bold border-r border-slate-700 bg-emerald-950 text-emerald-200">
                        Porsi Besar ({targetCounts.porsiBesar})
                      </th>
                      <th colSpan={2} className="py-1 px-2 font-bold border-r border-slate-700 bg-blue-950 text-blue-200">
                        Balita ({targetCounts.balita})
                      </th>
                      <th colSpan={2} className="py-1 px-2 font-bold border-r border-slate-700 bg-purple-950 text-purple-200">
                        Bumil & Busui ({targetCounts.bumilBusui})
                      </th>
                      <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700 bg-emerald-900 text-emerald-100">
                        TOTAL (kg)
                      </th>
                      <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700 bg-teal-900 text-teal-100">
                        Buffer 5%
                      </th>
                      <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700">
                        Pembulatan
                      </th>
                      <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700 bg-slate-900 text-slate-200">
                        Satuan
                      </th>
                      <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-700 bg-teal-900 text-teal-100 text-right">
                        Harga Dasar (Rp)
                      </th>
                      <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-700 bg-emerald-950 text-emerald-200 text-right">
                        Total Harga (Rp)
                      </th>
                      {!isReadOnly && <th rowSpan={2} className="py-2 px-2 font-bold w-8">Aksi</th>}
                    </tr>
                    <tr className="bg-slate-700 text-[10px] text-slate-200 dark:bg-slate-900 border-b border-slate-600 text-center">
                      <th className="py-1 px-1 border-r border-slate-700">gr</th>
                      <th className="py-1 px-1 border-r border-slate-700">kg</th>
                      <th className="py-1 px-1 border-r border-slate-700">gr</th>
                      <th className="py-1 px-1 border-r border-slate-700">kg</th>
                      <th className="py-1 px-1 border-r border-slate-700">gr</th>
                      <th className="py-1 px-1 border-r border-slate-700">kg</th>
                      <th className="py-1 px-1 border-r border-slate-700">gr</th>
                      <th className="py-1 px-1 border-r border-slate-700">kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {ingredients.map((item, index) => {
                      const bdd = Number(item.bddPercent) || 100;
                      
                      // Gross values
                      const grossKecil = calcGross(Number(item.porsiKecilNet) || 0, bdd);
                      const reqKecil = calcReqKg(grossKecil, targetCounts.porsiKecil);

                      const grossBesar = calcGross(Number(item.porsiBesarNet) || 0, bdd);
                      const reqBesar = calcReqKg(grossBesar, targetCounts.porsiBesar);

                      const grossBalita = calcGross(Number(item.balitaNet) || 0, bdd);
                      const reqBalita = calcReqKg(grossBalita, targetCounts.balita);

                      const grossBumil = calcGross(Number(item.bumilBusuiNet) || 0, bdd);
                      const reqBumil = calcReqKg(grossBumil, targetCounts.bumilBusui);

                      const totalKg = Number((reqKecil + reqBesar + reqBalita + reqBumil).toFixed(2));
                      const bufferKg = Number((totalKg * 0.05).toFixed(2));
                      const totalPlusBuffer = Number((totalKg + bufferKg).toFixed(2));

                      // Harga dasar tersinkronisasi dari RAB sesuai acuan tanggal aktif
                      const itemHargaDasar = Number(item.hargaPerKg) || 0;
                      const pNum = Number(item.pembulatan);
                      const qtyCalc = (pNum > 0) ? pNum : totalPlusBuffer;
                      const itemTotalHarga = itemHargaDasar > 0 ? Math.round(qtyCalc * itemHargaDasar) : 0;

                      return (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2 px-2 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                            {item.no}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                            {renderBahanPanganCell(item, index)}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 border-r border-slate-200 dark:border-slate-800">
                            {bdd}%
                          </td>

                          {/* Porsi Kecil */}
                          <td className="py-2 px-1 text-center font-mono border-r border-slate-200 dark:border-slate-800">{item.porsiKecilNet}</td>
                          <td className="py-2 px-1 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10 border-r border-slate-200 dark:border-slate-800">{reqKecil.toFixed(2)}</td>

                          {/* Porsi Besar */}
                          <td className="py-2 px-1 text-center font-mono border-r border-slate-200 dark:border-slate-800">{item.porsiBesarNet}</td>
                          <td className="py-2 px-1 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-r border-slate-200 dark:border-slate-800">{reqBesar.toFixed(2)}</td>

                          {/* Balita */}
                          <td className="py-2 px-1 text-center font-mono border-r border-slate-200 dark:border-slate-800">{item.balitaNet}</td>
                          <td className="py-2 px-1 text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 border-r border-slate-200 dark:border-slate-800">{reqBalita.toFixed(2)}</td>

                          {/* Bumil */}
                          <td className="py-2 px-1 text-center font-mono border-r border-slate-200 dark:border-slate-800">{item.bumilBusuiNet}</td>
                          <td className="py-2 px-1 text-center font-bold text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/10 border-r border-slate-200 dark:border-slate-800">{reqBumil.toFixed(2)}</td>

                          {/* Totals */}
                          <td className="py-2 px-2 text-center font-black text-slate-900 dark:text-slate-100 bg-slate-100/60 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-800">
                            {totalKg.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center text-teal-700 dark:text-teal-400 font-semibold border-r border-slate-200 dark:border-slate-800">
                            {bufferKg.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                            {isReadOnly ? (
                              item.pembulatan
                            ) : (
                              <input
                                type="text"
                                value={item.pembulatan}
                                onChange={(e) => handleUpdateItem(index, 'pembulatan', e.target.value)}
                                className="w-14 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-bold text-slate-900 dark:text-slate-100 text-xs"
                              />
                            )}
                          </td>

                          {/* Satuan Editable */}
                          <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                            {isReadOnly ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                {item.satuan || 'Kg'}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={item.satuan || 'Kg'}
                                onChange={(e) => handleUpdateItem(index, 'satuan', e.target.value)}
                                className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            )}
                          </td>

                          {/* Harga Dasar Editable: Terhubung ke RAB Bahan Baku, Kosong jika belum terisi */}
                          <td className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-800">
                            {isReadOnly ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs font-mono">
                                {itemHargaDasar > 0 ? formatRupiah(itemHargaDasar) : '-'}
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[10px] text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="500"
                                  placeholder="Kosong"
                                  value={itemHargaDasar > 0 ? itemHargaDasar : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                                    handleUpdateItem(index, 'hargaPerKg', val);
                                    syncHargaDasarToRab(item.bahanPangan, val, [effectivePriceDate, tanggalPelaksanaan || ''].filter(Boolean));
                                  }}
                                  className="w-20 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                                  title={itemHargaDasar > 0 ? `Harga satuan tersinkron ke RAB (${effectivePriceDate}): ${formatRupiah(itemHargaDasar)}` : `Harga belum terisi di RAB Bahan Baku tanggal ${effectivePriceDate}`}
                                />
                              </div>
                            )}
                          </td>

                          {/* Total Harga */}
                          <td className="py-2 px-3 text-right font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                            {itemTotalHarga > 0 ? formatRupiah(itemTotalHarga) : '-'}
                          </td>

                          {!isReadOnly && (
                            <td className="py-2 px-1 text-center">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
