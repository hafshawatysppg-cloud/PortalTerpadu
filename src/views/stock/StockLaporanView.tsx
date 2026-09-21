import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Boxes, 
  ArrowUpRight, 
  Sparkles, 
  Coins, 
  Lightbulb, 
  Layers
} from 'lucide-react';
import { MasterBarang, StockMovement } from '../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GlobalReportHeader } from '../../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../../components/document/DocumentSignatures';

type QuickRange = 'Hari Ini' | 'Kemarin' | '7 Hari' | 'Bulan Ini' | 'Custom';

export const StockLaporanView: React.FC = () => {
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua Kategori');
  const [quickRange, setQuickRange] = useState<QuickRange>('Hari Ini');

  // Custom unit prices edited directly in the report table (map of barangId -> price)
  const [customPrices, setCustomPrices] = useState<Record<string, number | ''>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resB, resM] = await Promise.all([
        fetch('/api/v1/stock/barang'),
        fetch('/api/v1/stock/movements')
      ]);

      const dB = await resB.json();
      if (dB.success) {
        setBarangList(dB.data);
        const initPrices: Record<string, number | ''> = {};
        (dB.data as MasterBarang[]).forEach(b => {
          if (b.hargaSatuan && b.hargaSatuan > 0) {
            initPrices[b.id] = b.hargaSatuan;
          }
        });
        setCustomPrices(initPrices);
      }

      const dM = await resM.json();
      if (dM.success) {
        setMovements(dM.data);
      }
    } catch (err) {
      console.error('Error fetching stock report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Date Range Handler
  const handleQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = new Date();

    if (range === 'Hari Ini') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'Kemarin') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (range === '7 Hari') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (range === 'Bulan Ini') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filtered Stock Barang List
  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      const matchKategori = 
        selectedKategori === 'Semua Kategori' || 
        (b.kategoriNama || '').toLowerCase() === selectedKategori.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        b.namaBarang.toLowerCase().includes(q) ||
        b.kodeBarang.toLowerCase().includes(q) ||
        (b.kategoriNama && b.kategoriNama.toLowerCase().includes(q));

      return matchKategori && matchSearch;
    });
  }, [barangList, selectedKategori, searchQuery]);

  // Movements in Selected Date Range
  const movementsInPeriod = useMemo(() => {
    return movements.filter(m => {
      const mDate = (m.tanggal || '').split(' ')[0];
      const matchStart = !startDate || mDate >= startDate;
      const matchEnd = !endDate || mDate <= endDate;
      return matchStart && matchEnd;
    });
  }, [movements, startDate, endDate]);

  // Outbound (Barang Keluar) Movements in Selected Date Range
  const outboundMovementsInPeriod = useMemo(() => {
    return movementsInPeriod.filter(m => {
      if (m.jenis !== 'Keluar') return false;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        m.namaBarang.toLowerCase().includes(q) ||
        m.kodeBarang.toLowerCase().includes(q) ||
        m.referensiNota.toLowerCase().includes(q) ||
        (m.penerimaTujuan && m.penerimaTujuan.toLowerCase().includes(q)) ||
        (m.petugas && m.petugas.toLowerCase().includes(q));

      const matchedBarang = barangList.find(b => b.id === m.barangId || b.kodeBarang === m.kodeBarang);
      const mKat = matchedBarang?.kategoriNama || 'Bahan Baku';
      const matchKategori = 
        selectedKategori === 'Semua Kategori' || 
        mKat.toLowerCase() === selectedKategori.toLowerCase();

      return matchSearch && matchKategori;
    });
  }, [movementsInPeriod, searchQuery, selectedKategori, barangList]);

  // Calculate per-item statistics for the main report table
  const reportRows = useMemo(() => {
    return filteredBarang.map((b, idx) => {
      const itemMovements = movementsInPeriod.filter(
        m => m.barangId === b.id || m.kodeBarang === b.kodeBarang
      );

      const barangKeluarCount = itemMovements
        .filter(m => m.jenis === 'Keluar')
        .reduce((sum, m) => sum + (Number(m.jumlah) || 0), 0);

      const barangMasukCount = itemMovements
        .filter(m => m.jenis === 'Masuk')
        .reduce((sum, m) => sum + (Number(m.jumlah) || 0), 0);

      const stockAkhir = Number(b.stokSekarang) || 0;
      const stockAwal = Math.max(0, stockAkhir + barangKeluarCount - barangMasukCount);

      const currentPrice = customPrices[b.id] !== undefined ? customPrices[b.id] : (b.hargaSatuan || '');
      const numPrice = typeof currentPrice === 'number' ? currentPrice : 0;
      const totalNilai = stockAkhir * numPrice;

      return {
        no: idx + 1,
        item: b,
        stockAwal,
        barangKeluar: barangKeluarCount,
        stockAkhir,
        hargaSatuan: currentPrice,
        totalNilai
      };
    });
  }, [filteredBarang, movementsInPeriod, customPrices]);

  // KPI Summary Calculations
  const totalBahanBakuCount = filteredBarang.length;
  const totalBarangKeluarVolume = reportRows.reduce((sum, r) => sum + r.barangKeluar, 0);
  const totalStockAkhirVolume = reportRows.reduce((sum, r) => sum + r.stockAkhir, 0);
  const totalEstimasiNilaiStock = reportRows.reduce((sum, r) => sum + r.totalNilai, 0);

  // Outbound Table Summary Stats
  const totalOutboundTransCount = outboundMovementsInPeriod.length;
  const totalOutboundVolume = outboundMovementsInPeriod.reduce((sum, m) => sum + (Number(m.jumlah) || 0), 0);
  const totalOutboundNilai = outboundMovementsInPeriod.reduce((sum, m) => {
    const itemPrice = typeof customPrices[m.barangId] === 'number' ? (customPrices[m.barangId] as number) : (m.hargaSatuan || 0);
    return sum + (m.totalHarga || (m.jumlah * itemPrice));
  }, 0);

  // Handle Price Change for a row
  const handlePriceChange = (barangId: string, valStr: string) => {
    if (valStr === '') {
      setCustomPrices(prev => ({ ...prev, [barangId]: '' }));
      return;
    }
    const cleanNum = parseFloat(valStr.replace(/[^0-9]/g, ''));
    setCustomPrices(prev => ({ ...prev, [barangId]: isNaN(cleanNum) ? '' : cleanNum }));
  };

  // Date Label Formatter
  const formatHariTanggal = (dStr: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const periodHariLabel = useMemo(() => {
    if (startDate === endDate) {
      return formatHariTanggal(startDate);
    }
    return `${formatHariTanggal(startDate)} s/d ${formatHariTanggal(endDate)}`;
  }, [startDate, endDate]);

  // Export to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Rekapitulasi Stock Opname
    const stockData = reportRows.map((r) => ({
      'No': r.no,
      'Nama Bahan Baku': r.item.namaBarang,
      'Satuan': r.item.satuan || 'Pcs',
      'Stock Awal': r.stockAwal,
      'Barang Keluar': r.barangKeluar,
      'Stock Akhir': r.stockAkhir,
      'Harga Satuan (Opsional)': r.hargaSatuan || 0,
      'Total Nilai (Rp)': r.totalNilai || 0
    }));

    const worksheet1 = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Stock_Opname');

    // Sheet 2: Laporan History Barang Keluar (Updated Columns)
    const outboundData = outboundMovementsInPeriod.map((m, idx) => {
      const itemPrice = typeof customPrices[m.barangId] === 'number' ? (customPrices[m.barangId] as number) : (m.hargaSatuan || 0);
      const totalRp = m.totalHarga || (m.jumlah * itemPrice);
      const matchedItem = barangList.find(b => b.id === m.barangId || b.kodeBarang === m.kodeBarang);
      const sisaStock = matchedItem ? matchedItem.stokSekarang : '-';

      return {
        'No': idx + 1,
        'Tanggal & Jam': m.tanggal,
        'Nama Barang': m.namaBarang,
        'Satuan': m.satuan || 'Pcs',
        'Jumlah Keluar': m.jumlah,
        'Harga Satuan': itemPrice || 0,
        'Total Nilai': totalRp || 0,
        'Sisa Stock': sisaStock,
        'Petugas': m.petugas || 'Admin'
      };
    });

    const worksheet2 = XLSX.utils.json_to_sheet(outboundData);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'History_Barang_Keluar');

    XLSX.writeFile(workbook, `Laporan_Stock_Opname_${startDate}_sd_${endDate}.xlsx`);
  };

  // Export to PDF matching exact official Kop & Layout
  const handleExportPDF = () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Header Kop Surat Resmi
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN', 105, 17, { align: 'center' });
    doc.text('YAYASAN HAFSHAWATY ZAINUL HASAN', 105, 22, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', 105, 26, { align: 'center' });

    // Double Line Border
    doc.setLineWidth(0.8);
    doc.line(12, 29, 198, 29);
    doc.setLineWidth(0.2);
    doc.line(12, 30, 198, 30);

    // Judul Laporan
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`LAPORAN STOCK OPNAME BAHAN BAKU`, 105, 36, { align: 'center' });
    doc.setFontSize(9);
    doc.text('SPPG KREJENGAN TEMENGGUNGAN – YAYASAN HAFSHAWATY', 105, 41, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Hari & Tanggal: ${periodHariLabel}`, 105, 46, { align: 'center' });

    // Table 1: Stock Opname Table
    const stockColumns = ['No', 'Nama Bahan Baku', 'Satuan', 'Stock Awal', 'Barang Keluar', 'Stock Akhir', 'Harga Satuan (Opsional)', 'Total Nilai (Rp)'];
    const stockRows: any[] = reportRows.map(r => [
      r.no,
      r.item.namaBarang,
      r.item.satuan || 'Pcs',
      r.stockAwal,
      r.barangKeluar,
      r.stockAkhir,
      typeof r.hargaSatuan === 'number' && r.hargaSatuan > 0 ? `Rp ${r.hargaSatuan.toLocaleString('id-ID')}` : '-',
      r.totalNilai > 0 ? `Rp ${r.totalNilai.toLocaleString('id-ID')}` : '-'
    ]);

    // Total Row
    const totalStockAwal = reportRows.reduce((a, b) => a + b.stockAwal, 0);
    const totalStockAkhir = reportRows.reduce((a, b) => a + b.stockAkhir, 0);
    stockRows.push([
      'TOT AL',
      `Total (${reportRows.length} Bahan)`,
      '-',
      totalStockAwal,
      totalBarangKeluarVolume,
      totalStockAkhir,
      '-',
      totalEstimasiNilaiStock > 0 ? `Rp ${totalEstimasiNilaiStock.toLocaleString('id-ID')}` : '-'
    ]);

    autoTable(doc, {
      head: [stockColumns],
      body: stockRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 30 },
        7: { halign: 'right', cellWidth: 30 }
      }
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 120;

    // Table 2: Laporan History Barang Keluar
    if (finalY > 210) {
      doc.addPage();
      finalY = 15;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN HISTORY BARANG KELUAR', 105, finalY + 10, { align: 'center' });

    const outboundColumns = ['No', 'Tanggal & Jam', 'Nama Barang', 'Satuan', 'Jumlah Keluar', 'Harga Satuan', 'Total Nilai', 'Sisa Stock', 'Petugas'];
    const outboundRows: any[] = outboundMovementsInPeriod.map((m, idx) => {
      const itemPrice = typeof customPrices[m.barangId] === 'number' 
        ? (customPrices[m.barangId] as number) 
        : (m.hargaSatuan || 0);
      const totalRp = m.totalHarga || (m.jumlah * itemPrice);
      const matchedItem = barangList.find(b => b.id === m.barangId || b.kodeBarang === m.kodeBarang);
      const sisaStock = matchedItem ? matchedItem.stokSekarang : '-';

      return [
        idx + 1,
        m.tanggal,
        m.namaBarang,
        m.satuan || 'Pcs',
        `-${m.jumlah}`,
        itemPrice > 0 ? `Rp ${itemPrice.toLocaleString('id-ID')}` : '-',
        totalRp > 0 ? `Rp ${totalRp.toLocaleString('id-ID')}` : '-',
        sisaStock,
        m.petugas || 'Admin'
      ];
    });

    autoTable(doc, {
      head: [outboundColumns],
      body: outboundRows.length > 0 ? outboundRows : [['-', '-', 'Tidak ada data barang keluar', '-', '-', '-', '-', '-', '-']],
      startY: finalY + 14,
      theme: 'grid',
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 26 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 16 },
        8: { cellWidth: 18 }
      }
    });

    let sigY = ((doc as any).lastAutoTable?.finalY || finalY + 30) + 12;
    if (sigY > 235) {
      doc.addPage();
      sigY = 20;
    }

    // Signatures Section (Mengetahui)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Mengetahui', 12, sigY);

    sigY += 6;
    doc.text('Disusun Oleh', 35, sigY, { align: 'center' });
    doc.text('Diperiksa Oleh', 105, sigY, { align: 'center' });
    doc.text('Disetujui Oleh', 175, sigY, { align: 'center' });

    sigY += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('Asisten Lapangan', 35, sigY, { align: 'center' });
    doc.text('Pengawas Keuangan', 105, sigY, { align: 'center' });
    doc.text('Kepala SPPG', 175, sigY, { align: 'center' });

    sigY += 22;
    doc.setFont('helvetica', 'bold');
    doc.text('(Qoidul Muttaqin, M. E)', 35, sigY, { align: 'center' });
    doc.text('(Muhammad Fadil, S. E)', 105, sigY, { align: 'center' });
    doc.text('(SRI ROHAYU, S. Pd)', 175, sigY, { align: 'center' });

    doc.save(`Laporan_Stock_Opname_${startDate}_sd_${endDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-0">
      {/* 1. TOP HEADER BANNER (Screen only) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            Cetak Laporan Stock {selectedKategori !== 'Semua Kategori' ? selectedKategori : ''}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi persediaan stock awal, barang masuk, barang keluar, dan stock akhir per periode tanggal.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-[#046c4e] hover:bg-[#03523b] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-[#e11d48] hover:bg-[#be123c] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-[#1e293b] hover:bg-[#0f172a] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak / Print
          </button>
        </div>
      </div>

      {/* 2. FILTER BOX SECTION (PILIH TANGGAL LAPORAN - Screen only) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-extrabold text-xs tracking-wider uppercase">PILIH TANGGAL LAPORAN</span>
          </div>

          {/* Quick Date Range Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(['Hari Ini', 'Kemarin', '7 Hari', 'Bulan Ini'] as QuickRange[]).map((range) => (
              <button
                key={range}
                onClick={() => handleQuickRange(range)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickRange === range
                    ? 'bg-[#046c4e] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dari Tanggal */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              DARI TANGGAL
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickRange('Custom');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Sampai Tanggal */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              SAMPAI TANGGAL
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickRange('Custom');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Cari Nama / ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              CARI NAMA / ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              KATEGORI
            </label>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="Semua Kategori">Semua Kategori</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. KPI SUMMARY CARDS (Screen only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Card 1: Total Bahan Baku / Items */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TOTAL BAHAN BAKU
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalBahanBakuCount} <span className="text-xs font-medium text-slate-400">Jenis</span>
            </div>
          </div>
          <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Barang Keluar */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TOTAL BARANG KELUAR
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {totalBarangKeluarVolume.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Stock Akhir */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TOTAL STOCK AKHIR
            </span>
            <div className="text-2xl font-black text-[#046c4e] dark:text-emerald-400 mt-1">
              {totalStockAkhirVolume.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-[#046c4e] dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Estimasi Nilai Stock */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              ESTIMASI NILAI STOCK
            </span>
            <div className="text-lg font-black text-[#046c4e] dark:text-emerald-400 mt-1">
              {totalEstimasiNilaiStock > 0 ? (
                `Rp ${totalEstimasiNilaiStock.toLocaleString('id-ID')}`
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  Rp 0 <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-[#046c4e] dark:text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. MAIN STOCK SUMMARY TABLE CONTAINER (Screen View) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden print:hidden">
        {/* Banner Bar Above Table */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#046c4e] dark:text-emerald-400 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-900">
              <span className="w-2 h-2 rounded-full bg-[#046c4e] dark:bg-emerald-400 animate-pulse"></span>
              Periode Laporan: <span className="font-extrabold">{periodHariLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Harga bersifat opsional
            </span>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-[#046c4e] dark:text-emerald-300 text-xs font-black rounded-full">
              {totalBahanBakuCount} {selectedKategori !== 'Semua Kategori' ? selectedKategori : 'Bahan Baku'}
            </span>
          </div>
        </div>

        {/* Main Stock Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#046c4e] text-white font-black uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">NO</th>
                <th className="py-3.5 px-4">NAMA BAHAN BAKU</th>
                <th className="py-3.5 px-4 text-center">SATUAN</th>
                <th className="py-3.5 px-4 text-center">STOCK AWAL</th>
                <th className="py-3.5 px-4 text-center">BARANG KELUAR</th>
                <th className="py-3.5 px-4 text-center">STOCK AKHIR</th>
                <th className="py-3.5 px-4 text-center">
                  HARGA SATUAN (RP)
                  <span className="block text-[9px] font-normal normal-case opacity-90">(input opsional)</span>
                </th>
                <th className="py-3.5 px-4 text-right">TOTAL NILAI STOCK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Tidak ada data barang ditemukan sesuai filter.
                  </td>
                </tr>
              ) : (
                reportRows.map((r) => {
                  const isOps = (r.item.kategoriNama || '').toLowerCase().includes('operasional');

                  return (
                    <tr key={r.item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">
                        {r.no}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {r.item.namaBarang}
                        </div>
                        <div className="mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            isOps 
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {r.item.kategoriNama || 'Bahan Baku'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-lg">
                          {r.item.satuan || 'Pcs'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                        {r.stockAwal}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-500">
                        {r.barangKeluar}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-3 py-1 bg-[#046c4e] text-white font-extrabold text-xs rounded-lg inline-block shadow-2xs">
                          {r.stockAkhir}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/30 max-w-[160px] mx-auto">
                          <span className="text-xs font-bold text-slate-400">Rp</span>
                          <input
                            type="text"
                            placeholder="Opsional"
                            value={r.hargaSatuan === '' ? '' : r.hargaSatuan.toLocaleString('id-ID')}
                            onChange={(e) => handlePriceChange(r.item.id, e.target.value)}
                            className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder:text-slate-400/60"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {r.totalNilai > 0 ? `Rp ${r.totalNilai.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={3} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider">
                  TOTAL REKAPITULASI PERSEDIAN:
                </td>
                <td className="py-3.5 px-4 text-center font-mono">
                  {reportRows.reduce((acc, r) => acc + r.stockAwal, 0)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-rose-600 dark:text-rose-400">
                  {totalBarangKeluarVolume}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-[#046c4e] dark:text-emerald-400 text-sm">
                  {totalStockAkhirVolume}
                </td>
                <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-normal">
                  -
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  {totalEstimasiNilaiStock > 0 ? `Rp ${totalEstimasiNilaiStock.toLocaleString('id-ID')}` : '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. SECOND TABLE: LAPORAN HISTORY BARANG KELUAR (Screen View) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden print:hidden space-y-0">
        {/* Section Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-extrabold uppercase rounded-full">
                Audit Outbound History
              </span>
              <span className="text-xs text-slate-300">
                Periode: {periodHariLabel}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-rose-400" />
              Laporan History Barang Keluar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rincian transaksi pengeluaran barang dan distribusi yang mengacu pada history barang keluar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Transaksi</span>
              <span className="text-sm font-black text-white">{totalOutboundTransCount} Tx</span>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Volume</span>
              <span className="text-sm font-black text-rose-400">-{totalOutboundVolume} Pcs/Kg</span>
            </div>
          </div>
        </div>

        {/* History Barang Keluar Table (Requested Exact 9 Columns) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-slate-200 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-700">
                <th className="py-3.5 px-4 text-center w-12">NO</th>
                <th className="py-3.5 px-4">TANGGAL & JAM</th>
                <th className="py-3.5 px-4">NAMA BARANG</th>
                <th className="py-3.5 px-4 text-center">SATUAN</th>
                <th className="py-3.5 px-4 text-center">JUMLAH KELUAR</th>
                <th className="py-3.5 px-4 text-right">HARGA SATUAN</th>
                <th className="py-3.5 px-4 text-right">TOTAL NILAI</th>
                <th className="py-3.5 px-4 text-center">SISA STOCK</th>
                <th className="py-3.5 px-4">PETUGAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {outboundMovementsInPeriod.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    Tidak ada riwayat barang keluar ditemukan dalam periode tanggal {periodHariLabel}.
                  </td>
                </tr>
              ) : (
                outboundMovementsInPeriod.map((m, idx) => {
                  const itemPrice = typeof customPrices[m.barangId] === 'number' 
                    ? (customPrices[m.barangId] as number) 
                    : (m.hargaSatuan || 0);
                  const totalRp = m.totalHarga || (m.jumlah * itemPrice);
                  const matchedItem = barangList.find(b => b.id === m.barangId || b.kodeBarang === m.kodeBarang);
                  const sisaStock = matchedItem ? matchedItem.stokSekarang : '-';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {m.tanggal}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {m.namaBarang}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.kodeBarang}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {m.satuan || 'Pcs'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-lg inline-block font-mono">
                          -{m.jumlah}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {itemPrice > 0 ? `Rp ${itemPrice.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {totalRp > 0 ? `Rp ${totalRp.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#046c4e] dark:text-emerald-400 font-bold text-xs rounded-lg inline-block font-mono">
                          {sisaStock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {m.petugas || 'Admin'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {outboundMovementsInPeriod.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={4} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider">
                    TOTAL TRANSAKSI KELUAR ({periodHariLabel}):
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-rose-600 dark:text-rose-400 text-sm">
                    -{totalOutboundVolume}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                    -
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-white text-sm">
                    {totalOutboundNilai > 0 ? `Rp ${totalOutboundNilai.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="py-3.5 px-4"></td>
                  <td className="py-3.5 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. OFFICIAL PRINT DOCUMENT CONTAINER (Rendered only when window.print())   */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-slate-900 bg-white p-2 font-sans space-y-5">
        {/* Header Kop Surat dari Master Template Dokumen (Single Source of Truth) */}
        <GlobalReportHeader
          documentTypeId="stock-laporan"
          metadata={[
            { label: 'Hari & Tanggal', value: periodHariLabel },
            { label: 'Rentang Periode', value: quickRange }
          ]}
        />

        {/* Tabel 1: Stock Opname Bahan Baku */}
        <table className="w-full border-collapse border border-slate-900 text-[11px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
              <th className="border border-slate-900 p-1.5 w-8">No</th>
              <th className="border border-slate-900 p-1.5 text-left">Nama Bahan Baku</th>
              <th className="border border-slate-900 p-1.5 w-14">Satuan</th>
              <th className="border border-slate-900 p-1.5 w-16">Stock Awal</th>
              <th className="border border-slate-900 p-1.5 w-16">Barang Keluar</th>
              <th className="border border-slate-900 p-1.5 w-16">Stock Akhir</th>
              <th className="border border-slate-900 p-1.5 w-28">Harga Satuan (Opsional)</th>
              <th className="border border-slate-900 p-1.5 w-28">Total Nilai (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((r) => (
              <tr key={r.item.id} className="border-b border-slate-800">
                <td className="border border-slate-900 p-1.5 text-center font-mono">{r.no}</td>
                <td className="border border-slate-900 p-1.5 font-bold">{r.item.namaBarang}</td>
                <td className="border border-slate-900 p-1.5 text-center">{r.item.satuan || 'Pcs'}</td>
                <td className="border border-slate-900 p-1.5 text-center font-mono">{r.stockAwal}</td>
                <td className="border border-slate-900 p-1.5 text-center font-mono">{r.barangKeluar}</td>
                <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{r.stockAkhir}</td>
                <td className="border border-slate-900 p-1.5 text-center font-mono">
                  {typeof r.hargaSatuan === 'number' && r.hargaSatuan > 0 ? `Rp ${r.hargaSatuan.toLocaleString('id-ID')}` : '-'}
                </td>
                <td className="border border-slate-900 p-1.5 text-right font-mono">
                  {r.totalNilai > 0 ? `Rp ${r.totalNilai.toLocaleString('id-ID')}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-extrabold bg-slate-100 border-t-2 border-slate-900">
              <td className="border border-slate-900 p-1.5 text-center">TOT AL</td>
              <td className="border border-slate-900 p-1.5">Total ({reportRows.length} Bahan)</td>
              <td className="border border-slate-900 p-1.5 text-center">-</td>
              <td className="border border-slate-900 p-1.5 text-center font-mono">{reportRows.reduce((a, b) => a + b.stockAwal, 0)}</td>
              <td className="border border-slate-900 p-1.5 text-center font-mono">{totalBarangKeluarVolume}</td>
              <td className="border border-slate-900 p-1.5 text-center font-mono">{totalStockAkhirVolume}</td>
              <td className="border border-slate-900 p-1.5 text-center">-</td>
              <td className="border border-slate-900 p-1.5 text-right font-mono">
                {totalEstimasiNilaiStock > 0 ? `Rp ${totalEstimasiNilaiStock.toLocaleString('id-ID')}` : '-'}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Tabel 2: History Barang Keluar */}
        <div className="pt-4 space-y-2">
          <h3 className="text-xs font-black uppercase text-center">
            LAPORAN HISTORY BARANG KELUAR
          </h3>
          <table className="w-full border-collapse border border-slate-900 text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold text-center">
                <th className="border border-slate-900 p-1 w-6">No</th>
                <th className="border border-slate-900 p-1 w-24">Tanggal & Jam</th>
                <th className="border border-slate-900 p-1 text-left">Nama Barang</th>
                <th className="border border-slate-900 p-1 w-12">Satuan</th>
                <th className="border border-slate-900 p-1 w-16">Jumlah Keluar</th>
                <th className="border border-slate-900 p-1 w-20">Harga Satuan</th>
                <th className="border border-slate-900 p-1 w-22">Total Nilai</th>
                <th className="border border-slate-900 p-1 w-14">Sisa Stock</th>
                <th className="border border-slate-900 p-1 w-16">Petugas</th>
              </tr>
            </thead>
            <tbody>
              {outboundMovementsInPeriod.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-900 p-2 text-center italic">
                    Tidak ada data barang keluar
                  </td>
                </tr>
              ) : (
                outboundMovementsInPeriod.map((m, idx) => {
                  const itemPrice = typeof customPrices[m.barangId] === 'number' 
                    ? (customPrices[m.barangId] as number) 
                    : (m.hargaSatuan || 0);
                  const totalRp = m.totalHarga || (m.jumlah * itemPrice);
                  const matchedItem = barangList.find(b => b.id === m.barangId || b.kodeBarang === m.kodeBarang);
                  const sisaStock = matchedItem ? matchedItem.stokSekarang : '-';

                  return (
                    <tr key={m.id} className="border-b border-slate-800">
                      <td className="border border-slate-900 p-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-900 p-1 font-mono text-[9px]">{m.tanggal}</td>
                      <td className="border border-slate-900 p-1 font-bold">{m.namaBarang}</td>
                      <td className="border border-slate-900 p-1 text-center">{m.satuan || 'Pcs'}</td>
                      <td className="border border-slate-900 p-1 text-center font-mono font-bold">-{m.jumlah}</td>
                      <td className="border border-slate-900 p-1 text-right font-mono">
                        {itemPrice > 0 ? `Rp ${itemPrice.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-slate-900 p-1 text-right font-mono font-bold">
                        {totalRp > 0 ? `Rp ${totalRp.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-slate-900 p-1 text-center font-mono font-bold">{sisaStock}</td>
                      <td className="border border-slate-900 p-1 text-center">{m.petugas || 'Admin'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legalisasi / Mengetahui Section dari Master Template Dokumen */}
        <DocumentSignatures documentTypeId="stock-laporan" />
        <GlobalReportFooter documentTypeId="stock-laporan" />
      </div>
    </div>
  );
};
