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
  Radio
} from 'lucide-react';

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
      updated[index] = {
        ...updated[index],
        bahanPangan: matchedMaster.namaBahan,
        bddPercent: matchedMaster.bddDefault || 100,
        satuan: matchedMaster.satuanPembelian || 'Kg',
        hargaPerKg: matchedMaster.hargaDasarPerKg || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        bahanPangan: selectedName
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
    const newItem: MultiGroupIngredientItem = {
      no: newNo,
      bahanPangan: firstMaster ? firstMaster.namaBahan : 'Pilih Bahan Pangan',
      porsiKecilNet: 25,
      porsiBesarNet: 50,
      balitaNet: 25,
      bumilBusuiNet: 50,
      bddPercent: firstMaster?.bddDefault || 100,
      satuan: firstMaster?.satuanPembelian || 'Kg',
      pembulatan: 1,
      hargaPerKg: firstMaster?.hargaDasarPerKg || 15000
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
            <div className="text-xs font-semibold px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              Total Seluruh Sasaran: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui).toLocaleString('id-ID')}</span> Porsi
            </div>
          </div>
        </div>

        {/* Live Beneficiary Breakdown Info Bar */}
        {beneficiaryLiveInfo && (
          <div className="mb-3 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-[11px] flex flex-wrap items-center justify-between gap-2 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">Data Riil Penerima Manfaat:</span>
              <span>{beneficiaryLiveInfo.totalPenerima?.toLocaleString('id-ID') || 0} Total Jiwa</span>
              <span className="text-emerald-400">•</span>
              <span>{beneficiaryLiveInfo.totalInstansi || 0} Lokasi/Instansi</span>
              {beneficiaryLiveInfo.statusLock && (
                <span className="px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[9px] font-bold">
                  Status: {beneficiaryLiveInfo.statusLock}
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
              Siswa: {beneficiaryLiveInfo.totalSiswa?.toLocaleString('id-ID') || 0} | Guru: {beneficiaryLiveInfo.totalGuru?.toLocaleString('id-ID') || 0} | Balita: {beneficiaryLiveInfo.totalBalita?.toLocaleString('id-ID') || 0} | Bumil: {beneficiaryLiveInfo.totalIbuHamil?.toLocaleString('id-ID') || 0} | Busui: {beneficiaryLiveInfo.totalIbuMenyusui?.toLocaleString('id-ID') || 0}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {groupConfig.map(grp => (
            <div key={grp.key} className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{grp.label}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${grp.color}`}>Aktif</span>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1" title={grp.sublabel}>
                  {grp.sublabel}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={targetCounts[grp.key]}
                  onChange={(e) => onChangeTargetCounts({
                    ...targetCounts,
                    [grp.key]: Number(e.target.value) || 0
                  })}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-medium">jiwa</span>
              </div>
            </div>
          ))}
        </div>
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
          {/* SINGLE GROUP TABLE VIEW (Exact 8-Column Format from PDF) */}
          {selectedGroupTab !== 'all' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {(() => {
                const currentGrp = groupConfig.find(g => g.key === selectedGroupTab)!;
                const netKey = (
                  selectedGroupTab === 'porsiKecil' ? 'porsiKecilNet' :
                  selectedGroupTab === 'porsiBesar' ? 'porsiBesarNet' :
                  selectedGroupTab === 'balita' ? 'balitaNet' : 'bumilBusuiNet'
                ) as keyof MultiGroupIngredientItem;

                let sumKg = 0;

                return (
                  <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-900">
                    <thead>
                      <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
                        <th className="py-2.5 px-3 font-bold w-12 border-r border-slate-700">1<br/><span className="text-[10px] font-normal">No</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-left min-w-[220px]">2<br/><span className="text-[10px] font-normal">Bahan Pangan (Master Data)</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700">3<br/><span className="text-[10px] font-normal">Kelompok Sasaran</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700">4<br/><span className="text-[10px] font-normal">Berat Bersih (gr)</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700">5<br/><span className="text-[10px] font-normal">PERSEN BDD</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700">6<br/><span className="text-[10px] font-normal">Berat Kotor (gr)</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700">7<br/><span className="text-[10px] font-normal">Jumlah Sasaran</span></th>
                        <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-emerald-900/90 text-emerald-100">8<br/><span className="text-[10px] font-normal">Kebutuhan Bahan Pangan (kg)</span></th>
                        {!isReadOnly && <th className="py-2.5 px-2 font-bold w-10">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {ingredients.map((item, index) => {
                        const netVal = Number(item[netKey]) || 0;
                        const bddVal = Number(item.bddPercent) || 100;
                        const grossVal = calcGross(netVal, bddVal);
                        const reqKg = calcReqKg(grossVal, currentGrp.count);
                        sumKg += reqKg;

                        return (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                              {item.no}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                              {renderBahanPanganCell(item, index)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-[11px] border-r border-slate-200 dark:border-slate-800">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${currentGrp.color}`}>
                                {currentGrp.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                              {isReadOnly ? (
                                netVal
                              ) : (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={netVal}
                                  onChange={(e) => handleUpdateItem(index, netKey, Number(e.target.value) || 0)}
                                  className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-semibold text-slate-900 dark:text-slate-100"
                                />
                              )}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                              {isReadOnly ? (
                                `${bddVal}%`
                              ) : (
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={bddVal}
                                  onChange={(e) => handleUpdateItem(index, 'bddPercent', Number(e.target.value) || 100)}
                                  className="w-14 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-semibold text-slate-900 dark:text-slate-100"
                                />
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {grossVal.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                              {currentGrp.count.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                              {reqKg.toFixed(2)}
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
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                        <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                          Total Kebutuhan Bahan Pangan ({currentGrp.label}):
                        </td>
                        <td className="py-3 px-3 text-center text-sm font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60">
                          {sumKg.toFixed(2)} kg
                        </td>
                        {!isReadOnly && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}
            </div>
          )}

          {/* ALL GROUPS COMBINED MATRIX VIEW */}
          {selectedGroupTab === 'all' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-900">
                <thead>
                  <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
                    <th rowSpan={2} className="py-2 px-2 font-bold w-10 border-r border-slate-700">No</th>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-700 text-left min-w-[220px]">Bahan Pangan (Master)</th>
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
                    <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-700 bg-emerald-900 text-emerald-100">
                      TOTAL (kg)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700 bg-teal-900 text-teal-100">
                      Buffer 5%
                    </th>
                    <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700">
                      Pembulatan
                    </th>
                    <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-700">
                      Satuan
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
                        <td className="py-2 px-2 text-center font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                          {masterBahan.find(b => b.namaBahan.toLowerCase() === item.bahanPangan.toLowerCase())?.satuanPembelian || item.satuan}
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
          )}
        </>
      )}
    </div>
  );
};
