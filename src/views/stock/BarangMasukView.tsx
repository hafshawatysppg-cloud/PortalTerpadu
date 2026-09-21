import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  ArrowUpRight, Plus, Trash2, Cloud, RefreshCw, Share2, 
  FileSpreadsheet, Sparkles, CheckCircle, AlertTriangle, Upload, X,
  Download, FileText, FileUp
} from 'lucide-react';
import { MasterBarang } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

interface RowData {
  id: string;
  barangId: string;
  namaBarang: string;
  jumlah: number | string;
  satuan: string;
  hargaSatuan?: number | string;
  kategori: string;
  tglKadaluwarsa: string;
  lokasi: string;
  catatan: string;
  isNewBahan?: boolean;
}

const SATUAN_OPTIONS = [
  'Pcs', 'Kg', 'Gram', 'Liter', 'Kardus', 'Bungkus', 'Botol', 'Karung', 
  'Box', 'Pack', 'Unit', 'Sack', 'Dus', 'Kaleng', 'Ikat', 'Butir'
];

const KATEGORI_OPTIONS = [
  'Bahan Baku', 'Operasional'
];

export const BarangMasukView: React.FC = () => {
  const { data: realtimeBarang } = useFirestoreRealtime<MasterBarang>('barang');
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);

  useEffect(() => {
    if (realtimeBarang && realtimeBarang.length > 0) {
      setBarangList(realtimeBarang);
    }
  }, [realtimeBarang]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // File import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'text'>('file');
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBlankRow = (index: number): RowData => ({
    id: `ROW-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
    barangId: '',
    namaBarang: '',
    jumlah: 0,
    satuan: 'Pcs',
    hargaSatuan: 0,
    kategori: 'Bahan Baku',
    tglKadaluwarsa: '',
    lokasi: 'Gudang Utama',
    catatan: ''
  });

  const initializeRows = (count: number) => {
    const newRows: RowData[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createBlankRow(i));
    }
    setRows(newRows);
  };

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stock/barang');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBarangList(data.data);
      }
    } catch (err) {
      console.error('Fetch barang list error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    initializeRows(5); // Default 5 rows like in screenshot
  }, []);

  // Row operations
  const handleAddRows = (count: number) => {
    setRows(prev => {
      const added: RowData[] = [];
      for (let i = 0; i < count; i++) {
        added.push(createBlankRow(prev.length + i));
      }
      return [...prev, ...added];
    });
  };

  const handlePrepare100Rows = () => {
    initializeRows(100);
    setSuccessMsg('100 baris formulir siap diisi secara massal!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleClearRows = () => {
    initializeRows(5);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createBlankRow(0)]);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof RowData, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;

      const updated = { ...r, [field]: value };

      if (field === 'barangId') {
        if (value === 'NEW') {
          updated.isNewBahan = true;
          updated.barangId = 'NEW';
        } else if (value === '') {
          updated.isNewBahan = false;
          updated.barangId = '';
          updated.namaBarang = '';
        } else {
          const item = barangList.find(b => b.id === value);
          if (item) {
            updated.barangId = item.id;
            updated.namaBarang = item.namaBarang;
            updated.satuan = item.satuan || 'Pcs';
            updated.hargaSatuan = item.hargaSatuan || 0;
            updated.kategori = item.kategoriNama || 'Bahan Baku';
            updated.isNewBahan = false;
          }
        }
      }

      return updated;
    }));
  };

  // Ready items count
  const readyRows = rows.filter(r => (r.barangId || r.namaBarang.trim()) && Number(r.jumlah) > 0);
  const readyCount = readyRows.length;

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (readyCount === 0) {
      setErrorMsg('Pilih bahan dan isi jumlah masuk terlebih dahulu.');
      return;
    }

    setSubmitting(true);

    try {
      const itemsPayload = readyRows.map(r => ({
        barangId: r.barangId === 'NEW' ? '' : r.barangId,
        namaBarang: r.namaBarang,
        jumlah: Number(r.jumlah),
        satuan: r.satuan,
        hargaSatuan: Number(r.hargaSatuan) || 0,
        kategori: r.kategori,
        tglKadaluwarsa: r.tglKadaluwarsa,
        lokasi: r.lokasi,
        vendor: r.catatan
      }));

      const res = await fetch('/api/v1/stock/movements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis: 'Masuk',
          items: itemsPayload,
          referensiNota: `RESTOCK-IN-${Date.now().toString().slice(-6)}`,
          keterangan: 'Penerimaan Barang Masuk Massal',
          petugas: 'Petugas Gudang'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Berhasil menyimpan ${readyCount} data barang masuk ke Master Stok & Database Firestore!`);
        fetchMasterData();
        initializeRows(5);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.message || 'Gagal menyimpan barang masuk.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = 
      "NAMA BAHAN,JUMLAH MASUK,SATUAN,KATEGORI,EXPIRY,LOKASI,CATATAN\n" +
      "Beras Kepompong,190,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Daging ayam fillet,115,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Selada Super,10,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Tahu,2860,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Wortel,55,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Kentang,50,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Jeruk Murcot Sweet,233,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Minyak Goreng Filma 2L,50,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Bawang putih kupas,3,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Bawang Merah Kupas,3,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Bawang Bombay,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Bumbu kari jepang 80gr,25,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Tepung terigu segitiga biru 1kg,50,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Tepung panir 7daun 10kg,40,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Ladaku Lada Bubuk,2,Renteng,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Gula,3,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Laos,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Garam cap kapal 250gr,10,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Kaldu jamur totole 200gr,7,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Jahe,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Kunyit,0.5,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Ketumbar,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Kemiri,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n" +
      "Daun Jeruk,0.25,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TEMPLATE_INPUT_BARANG_MASUK.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sample24ItemsText = `Beras Kepompong,190,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Daging ayam fillet,115,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Selada Super,10,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Tahu,2860,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Wortel,55,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Kentang,50,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Jeruk Murcot Sweet,233,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Minyak Goreng Filma 2L,50,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Bawang putih kupas,3,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Bawang Merah Kupas,3,Kg,Bumbu & Rempah,,Gudang Utama,Import Excel (TEMPLATE)
Bawang Bombay,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Bumbu kari jepang 80gr,25,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Tepung terigu segitiga biru 1kg,50,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Tepung panir 7daun 10kg,40,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Ladaku Lada Bubuk,2,Renteng,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Gula,3,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Laos,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Garam cap kapal 250gr,10,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Kaldu jamur totole 200gr,7,Pcs,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Jahe,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Kunyit,0.5,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Ketumbar,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Kemiri,1,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)
Daun Jeruk,0.25,Kg,Bahan Baku,,Gudang Utama,Import Excel (TEMPLATE)`;

  const parseMatrixToRows = (matrix: any[][], fileName?: string) => {
    if (!matrix || matrix.length === 0) return;

    let headerRowIdx = -1;
    let namaCol = 0;
    let jmlCol = 1;
    let satuanCol = 2;
    let katCol = 3;
    let expCol = 4;
    let lokCol = 5;
    let catCol = 6;

    // Detect header row
    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
      const row = matrix[i];
      if (!Array.isArray(row)) continue;
      const strRow = row.map(c => String(c || '').trim().toLowerCase());
      if (strRow.some(cell => cell.includes('nama') || cell.includes('bahan') || cell.includes('item'))) {
        headerRowIdx = i;
        strRow.forEach((cellText, cIdx) => {
          if (cellText.includes('nama') || cellText.includes('bahan') || cellText.includes('item')) namaCol = cIdx;
          else if (cellText.includes('jumlah') || cellText.includes('qty') || cellText.includes('masuk')) jmlCol = cIdx;
          else if (cellText.includes('satuan') || cellText.includes('unit')) satuanCol = cIdx;
          else if (cellText.includes('kategori') || cellText.includes('category')) katCol = cIdx;
          else if (cellText.includes('expiry') || cellText.includes('exp') || cellText.includes('kadaluwarsa')) expCol = cIdx;
          else if (cellText.includes('lokasi') || cellText.includes('storage') || cellText.includes('gudang')) lokCol = cIdx;
          else if (cellText.includes('catatan') || cellText.includes('vendor') || cellText.includes('note')) catCol = cIdx;
        });
        break;
      }
    }

    const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    const newRows: RowData[] = [];
    let cocokCount = 0;
    let baruCount = 0;

    for (let i = startIdx; i < matrix.length; i++) {
      const row = matrix[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawNama = String(row[namaCol] ?? '').trim();
      if (!rawNama || rawNama.toLowerCase().startsWith('nama bahan')) continue;

      const rawJml = row[jmlCol];
      let jml = 1;
      if (typeof rawJml === 'number') {
        jml = rawJml;
      } else if (rawJml) {
        const parsed = parseFloat(String(rawJml).replace(',', '.'));
        if (!isNaN(parsed)) jml = parsed;
      }

      const stn = String(row[satuanCol] ?? 'Pcs').trim() || 'Pcs';
      const rawKat = String(row[katCol] ?? 'Bahan Baku').trim();
      const kat = rawKat.toLowerCase().includes('operasional') ? 'Operasional' : 'Bahan Baku';
      const exp = String(row[expCol] ?? '').trim();
      const lok = String(row[lokCol] ?? 'Gudang Utama').trim() || 'Gudang Utama';
      const cat = String(row[catCol] ?? 'Import Excel (TEMPLATE)').trim() || 'Import Excel (TEMPLATE)';

      const matched = barangList.find(b => b.namaBarang.toLowerCase().trim() === rawNama.toLowerCase().trim());

      if (matched) {
        cocokCount++;
        newRows.push({
          id: `ROW-IMP-${i}-${Date.now()}`,
          barangId: matched.id,
          namaBarang: matched.namaBarang,
          jumlah: jml,
          satuan: stn !== 'Pcs' ? stn : (matched.satuan || 'Pcs'),
          kategori: matched.kategoriNama || kat,
          tglKadaluwarsa: exp,
          lokasi: lok,
          catatan: cat,
          isNewBahan: false
        });
      } else {
        baruCount++;
        newRows.push({
          id: `ROW-IMP-${i}-${Date.now()}`,
          barangId: 'NEW',
          namaBarang: rawNama,
          jumlah: jml,
          satuan: stn,
          kategori: kat,
          tglKadaluwarsa: exp,
          lokasi: lok,
          catatan: cat,
          isNewBahan: true
        });
      }
    }

    if (newRows.length > 0) {
      setRows(newRows);
      setIsImportModalOpen(false);
      setImportText('');
      const nameTag = fileName ? `dari file "${fileName}"` : 'secara massal';
      setSuccessMsg(`Berhasil mengimpor ${newRows.length} data barang masuk ${nameTag}! (${cocokCount} cocok dengan Master Stok, ${baruCount} bahan baru).`);
    } else {
      setErrorMsg('Tidak ditemukan data barang yang valid pada file Excel tersebut.');
    }
  };

  const parseTextToRows = (rawText: string, fileName?: string) => {
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const newRows: RowData[] = [];
    let cocokCount = 0;
    let baruCount = 0;

    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      // Skip header lines
      if (lower.includes('nama bahan') && (lower.includes('jumlah') || lower.includes('satuan'))) return;

      let nama = '';
      let jml = 1;
      let stn = 'Pcs';
      let kat = 'Bahan Baku';
      let exp = '';
      let lok = 'Gudang Utama';
      let cat = 'Import Excel (TEMPLATE)';

      // Check if line contains CSV/TSV separators (, or \t or ;)
      if (line.includes(',') || line.includes('\t') || line.includes(';')) {
        const parts = line.split(/,|\t|;/).map(p => p.trim());
        if (parts.length >= 2) {
          nama = parts[0];
          const jmlParsed = parseFloat(parts[1].replace(',', '.'));
          jml = isNaN(jmlParsed) ? 1 : jmlParsed;
          stn = parts[2] || 'Pcs';
          const rawKat = parts[3] || 'Bahan Baku';
          kat = rawKat.toLowerCase().includes('operasional') ? 'Operasional' : 'Bahan Baku';
          exp = parts[4] || '';
          lok = parts[5] || 'Gudang Utama';
          cat = parts[6] || 'Import Excel (TEMPLATE)';
        }
      } else {
        // Space-separated line from PDF extract or OCR (e.g. "Beras Kepompong 190 Kg")
        const match = line.trim().match(/^(.*?)\s+([0-9]+(?:[\.,][0-9]+)?)\s+([A-Za-z]+)(?:\s+(.*))?$/);
        if (match) {
          nama = match[1].trim();
          const jmlParsed = parseFloat(match[2].replace(',', '.'));
          jml = isNaN(jmlParsed) ? 1 : jmlParsed;
          stn = match[3].trim();
          const rest = match[4]?.trim() || '';
          if (rest) cat = rest;
        } else {
          nama = line.trim();
        }
      }

      if (!nama || nama.toLowerCase().startsWith('nama bahan')) return;

      const matched = barangList.find(b => b.namaBarang.toLowerCase().trim() === nama.toLowerCase().trim());

      if (matched) {
        cocokCount++;
        newRows.push({
          id: `ROW-IMP-${idx}-${Date.now()}`,
          barangId: matched.id,
          namaBarang: matched.namaBarang,
          jumlah: jml,
          satuan: stn !== 'Pcs' ? stn : (matched.satuan || 'Pcs'),
          kategori: matched.kategoriNama || kat,
          tglKadaluwarsa: exp,
          lokasi: lok,
          catatan: cat,
          isNewBahan: false
        });
      } else {
        baruCount++;
        newRows.push({
          id: `ROW-IMP-${idx}-${Date.now()}`,
          barangId: 'NEW',
          namaBarang: nama,
          jumlah: jml,
          satuan: stn,
          kategori: kat,
          tglKadaluwarsa: exp,
          lokasi: lok,
          catatan: cat,
          isNewBahan: true
        });
      }
    });

    if (newRows.length > 0) {
      setRows(newRows);
      setIsImportModalOpen(false);
      setImportText('');
      const nameTag = fileName ? `dari file "${fileName}"` : 'secara massal';
      setSuccessMsg(`Berhasil mengimpor ${newRows.length} data barang masuk ${nameTag}! (${cocokCount} cocok dengan Master Stok, ${baruCount} bahan baru).`);
    } else {
      setErrorMsg('Tidak dapat mengurai data dari teks/file yang diberikan.');
    }
  };

  const processFileImport = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          if (matrix && matrix.length > 0) {
            parseMatrixToRows(matrix, file.name);
          } else {
            setErrorMsg('File Excel kosong atau tidak memiliki data.');
          }
        } catch (err) {
          console.error('Error parsing Excel:', err);
          const textReader = new FileReader();
          textReader.onload = (textEv) => {
            const textContent = textEv.target?.result as string;
            if (textContent) parseTextToRows(textContent, file.name);
          };
          textReader.readAsText(file);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          parseTextToRows(content, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileImport(file);
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFileImport(file);
  };

  const handleParseImport = () => {
    if (!importText.trim()) return;
    parseTextToRows(importText);
  };

  const handleCopyWebLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link akses web e-Stock Opname berhasil disalin!');
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* 1. TOP CLOUD STATUS BANNER */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Database Terpusat Google Cloud
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold rounded-full border border-blue-200 dark:border-blue-800">
                Realtime Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Data tersimpan aman di Google Cloud Firestore. Bebas diakses kapanpun & di perangkat manapun.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={fetchMasterData}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Status Server Cloud</span>
          </button>

          <button
            onClick={handleCopyWebLink}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Salin Link Akses Web</span>
          </button>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-emerald-900 font-bold text-[11px] rounded-lg transition cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-[11px] rounded-lg transition cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. SECTION TITLE & ACTIONS CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0 mt-0.5">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Penerimaan Barang Masuk (Massal / Multi-Row)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Input barang masuk hingga <b className="text-slate-700 dark:text-slate-200">100 data sekaligus</b> dari form atau file Excel / PDF.
              </p>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAddRows(1)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> +1 Baris
            </button>

            <button
              onClick={() => handleAddRows(5)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> +5 Baris
            </button>

            <button
              onClick={handlePrepare100Rows}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Siapkan 100 Baris</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Impor File (Excel / PDF)</span>
            </button>

            <button
              onClick={handleClearRows}
              title="Reset Form Baris"
              className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-xl transition border border-rose-200 dark:border-rose-900 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. MULTI-ROW TABLE */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Table Header Bar */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                Tabel Input Barang Masuk ({rows.length} Baris Tersedia)
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-black text-[11px] rounded-full border border-emerald-300 dark:border-emerald-800">
                {readyCount} Siap Disimpan
              </span>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              Gunakan file Excel/PDF untuk mengisi otomatis 100 data sekaligus.
            </span>
          </div>

          {/* Scrollable Table View */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs z-10 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">NO</th>
                  <th className="p-3 min-w-[240px]">BAHAN MAKANAN (PILIH / BARU)</th>
                  <th className="p-3 w-28 text-center">JUMLAH MASUK</th>
                  <th className="p-3 w-28">SATUAN</th>
                  <th className="p-3 w-32 text-right">HARGA SATUAN (RP)</th>
                  <th className="p-3 w-36">KATEGORI</th>
                  <th className="p-3 w-36">TGL KADALUWARSA</th>
                  <th className="p-3 w-36">LOKASI STORAGE</th>
                  <th className="p-3 min-w-[150px]">CATATAN / VENDOR</th>
                  <th className="p-3 w-44 text-center">PENGGABUNGAN MASTER STOK</th>
                  <th className="p-3 w-12 text-center">AKSI</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {rows.map((row, idx) => {
                  const isReady = (row.barangId || row.namaBarang.trim()) && Number(row.jumlah) > 0;
                  
                  // Match with master stok
                  const itemInMaster = barangList.find(b => 
                    (row.barangId && row.barangId !== 'NEW' && b.id === row.barangId) ||
                    (!row.barangId && row.namaBarang && b.namaBarang.toLowerCase().trim() === row.namaBarang.toLowerCase().trim())
                  );

                  return (
                    <tr 
                      key={row.id} 
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        isReady ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* NO */}
                      <td className="p-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* BAHAN MAKANAN (PILIH / BARU) */}
                      <td className="p-2 space-y-1.5 min-w-[240px]">
                        <select
                          value={row.isNewBahan ? 'NEW' : row.barangId}
                          onChange={(e) => handleRowChange(row.id, 'barangId', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                        >
                          <option value="">-- Pilih Bahan Master Stok --</option>
                          <option value="NEW" className="font-extrabold text-amber-600 dark:text-amber-400">
                            ✨ + Tambah Bahan Baru
                          </option>
                          {barangList.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.namaBarang} ({b.stokSekarang} {b.satuan})
                            </option>
                          ))}
                        </select>

                        {/* Input custom text if NEW item or typing custom name */}
                        {(row.isNewBahan || row.barangId === 'NEW' || (!row.barangId && row.namaBarang)) && (
                          <input
                            type="text"
                            value={row.namaBarang}
                            onChange={(e) => handleRowChange(row.id, 'namaBarang', e.target.value)}
                            placeholder="Ketik nama bahan baru..."
                            className="w-full px-3 py-2 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        )}
                      </td>

                      {/* JUMLAH MASUK */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.jumlah}
                          onChange={(e) => handleRowChange(row.id, 'jumlah', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </td>

                      {/* SATUAN */}
                      <td className="p-2">
                        <select
                          value={row.satuan}
                          onChange={(e) => handleRowChange(row.id, 'satuan', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        >
                          {SATUAN_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* HARGA SATUAN (RP) */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={row.hargaSatuan ?? 0}
                          onChange={(e) => handleRowChange(row.id, 'hargaSatuan', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </td>

                      {/* KATEGORI */}
                      <td className="p-2">
                        <select
                          value={row.kategori}
                          onChange={(e) => handleRowChange(row.id, 'kategori', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        >
                          {KATEGORI_OPTIONS.map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>

                      {/* TGL KADALUWARSA */}
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.tglKadaluwarsa}
                          onChange={(e) => handleRowChange(row.id, 'tglKadaluwarsa', e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </td>

                      {/* LOKASI STORAGE */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.lokasi}
                          onChange={(e) => handleRowChange(row.id, 'lokasi', e.target.value)}
                          placeholder="Gudang Utama"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </td>

                      {/* CATATAN / VENDOR */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.catatan}
                          onChange={(e) => handleRowChange(row.id, 'catatan', e.target.value)}
                          placeholder="Nota/Vendor..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </td>

                      {/* PENGGABUNGAN MASTER STOK */}
                      <td className="p-3 text-center min-w-[150px]">
                        {(() => {
                          const qty = Number(row.jumlah) || 0;

                          if (itemInMaster) {
                            const currentStok = itemInMaster.stokSekarang || 0;
                            const projectedStok = currentStok + qty;
                            return (
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                                  Otomatis Gabung
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                                  <span className="text-slate-400 dark:text-slate-500 font-semibold">{currentStok}</span>
                                  <span>→</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{projectedStok} {row.satuan || itemInMaster.satuan}</span>
                                </span>
                              </div>
                            );
                          }

                          if (row.namaBarang.trim()) {
                            return (
                              <div className="flex items-center justify-center">
                                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 rounded-xl text-[11px] font-extrabold shadow-2xs flex items-center gap-1 whitespace-nowrap">
                                  <span>✨ Bahan Baru</span>
                                  <span>(+{qty} {row.satuan})</span>
                                </span>
                              </div>
                            );
                          }

                          return <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>;
                        })()}
                      </td>

                      {/* AKSI */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Hapus Baris Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Bar */}
          <div className="px-5 py-4 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-3">
              <span>Total Baris Form: <b>{rows.length}</b></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Siap Disimpan: <b className="text-emerald-600 dark:text-emerald-400">{readyCount} item</b></span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || readyCount === 0}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-md cursor-pointer ${
                submitting || readyCount === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{submitting ? 'MEMPROSES...' : `Simpan Semua Barang Masuk (${readyCount} Item)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* IMPORT EXCEL/PDF MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Impor Massal Barang Masuk (100 Data)</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setImportTab('file')}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'file'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>File Excel (.xlsx / .csv) & PDF (.pdf)</span>
              </button>

              <button
                type="button"
                onClick={() => setImportTab('text')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'text'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Tempel Teks Catatan</span>
              </button>
            </div>

            {/* Tab 1: File Upload Dropzone & Template Banner */}
            {importTab === 'file' ? (
              <div className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
                  className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv,.pdf,.txt"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                      Klik atau seret file <b className="font-extrabold text-slate-900 dark:text-slate-100">Excel (.xlsx, .xls)</b> atau <b className="font-extrabold text-slate-900 dark:text-slate-100">PDF (.pdf)</b> ke sini
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Mendukung hingga 100 baris data penerimaan sekaligus.
                    </p>
                  </div>
                </div>

                {/* Banner: Format Kolom Excel yang Disarankan & Quick Preset */}
                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 dark:border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                      Format Kolom PDF / Excel yang Disarankan:
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                      NAMA BAHAN | JUMLAH MASUK | SATUAN | KATEGORI | EXPIRY | LOKASI | CATATAN
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => parseTextToRows(sample24ItemsText, 'TEMPLATE INPUT BARANG (1).xlsx')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Impor 24 data contoh sesuai lampiran PDF/Excel"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Siapkan 24 Baris</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Tempel Teks Catatan */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste teks berformat baris (Nama Bahan, Jumlah, Satuan, Kategori) untuk auto-fill 100 baris sekaligus:
                </p>

                <textarea
                  rows={6}
                  placeholder={`Contoh Format (1 item per baris):\nEkomie Baksoo, 10, Kardus, Bahan Baku\nGaram Cap Kapal, 20, Pcs, Bahan Baku\nMinyak Goreng 1L, 15, Botol, Bahan Baku\nKertas HVS A4, 5, Box, Operasional`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleParseImport}
                    disabled={!importText.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Proses & Isi Form (Auto-Fill)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
