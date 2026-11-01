import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MasterMenuRecord } from '../types/masterMenu';
import { SiklusIngredientRow, SiklusMenuData } from '../components/nutrition/SiklusMenuView';

// Helper formatting dates in Indonesian
export const formatIndonesianDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * EXPORT MASTER MENU KE EXCEL (.xlsx)
 */
export const exportMasterMenuToExcel = (
  records: MasterMenuRecord[],
  filterInfo?: { dateFilter?: string; searchTerm?: string }
) => {
  const wb = XLSX.utils.book_new();

  // Create rows
  const excelRows: any[] = [];

  // Title rows
  excelRows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  excelRows.push(['LAPORAN DAFTAR MASTER MENU & RESEP STANDAR']);
  excelRows.push([
    `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Menu: ${records.length} Jadwal`
  ]);
  if (filterInfo?.dateFilter) {
    excelRows.push([`Filter Tanggal: ${formatIndonesianDate(filterInfo.dateFilter)}`]);
  }
  excelRows.push([]); // blank row

  // Table Headers
  excelRows.push([
    'No',
    'Tanggal Pelaksanaan',
    'Hari',
    'Menu 1 (Karbohidrat)',
    'Menu 2 (Lauk Hewani)',
    'Menu 3 (Lauk Nabati)',
    'Menu 4 (Sayuran)',
    'Menu 5 (Buah / Pelengkap)',
    'Menu Tambahan',
    'Seluruh Susunan Menu'
  ]);

  // Data rows
  records.forEach((rec, idx) => {
    let dayName = '-';
    try {
      const d = new Date(rec.tanggalPelaksanaan);
      dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      dayName = '-';
    }

    const m1 = rec.menuItems[0] || '-';
    const m2 = rec.menuItems[1] || '-';
    const m3 = rec.menuItems[2] || '-';
    const m4 = rec.menuItems[3] || '-';
    const m5 = rec.menuItems[4] || '-';
    const extra = rec.menuItems.slice(5).join(', ') || '-';
    const fullMenu = rec.menuItems.join(' + ');

    excelRows.push([
      idx + 1,
      rec.tanggalPelaksanaan,
      dayName,
      m1,
      m2,
      m3,
      m4,
      m5,
      extra,
      fullMenu
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(excelRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 20 }, // Tanggal Pelaksanaan
    { wch: 14 }, // Hari
    { wch: 24 }, // Menu 1
    { wch: 28 }, // Menu 2
    { wch: 24 }, // Menu 3
    { wch: 26 }, // Menu 4
    { wch: 26 }, // Menu 5
    { wch: 22 }, // Extra
    { wch: 45 }, // Full
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master Menu SPPG');

  const dateSuffix = filterInfo?.dateFilter ? `_${filterInfo.dateFilter}` : `_${new Date().toISOString().split('T')[0]}`;
  XLSX.writeFile(wb, `Master_Menu_SPPG${dateSuffix}.xlsx`);
};

/**
 * EXPORT MASTER MENU KE PDF (.pdf)
 */
export const exportMasterMenuToPdf = (
  records: MasterMenuRecord[],
  filterInfo?: { dateFilter?: string; searchTerm?: string }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner Background
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.rect(0, 0, 210, 26, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN GIZI NASIONAL - SPPG', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SATUAN PELAYANAN PROGRAM GIZI | DAFTAR MASTER MENU & RESEP STANDAR', 14, 18);

  // Subheader / Metadata
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DOKUMEN RESMI MASTER MENU PELAKSANAAN SPPG', 14, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Tanggal Cetak: ${printDate} | Total Data: ${records.length} Jadwal`, 14, 38);
  if (filterInfo?.dateFilter) {
    doc.text(`Filter Tanggal Spesifik: ${formatIndonesianDate(filterInfo.dateFilter)} (${filterInfo.dateFilter})`, 14, 43);
  }

  // Build table data
  const tableHead = [['No', 'Tanggal', 'Hari', 'Daftar Komposisi Masakan']];
  const tableBody = records.map((rec, idx) => {
    let day = '-';
    try {
      const d = new Date(rec.tanggalPelaksanaan);
      day = d.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      day = '-';
    }
    const formattedDate = formatIndonesianDate(rec.tanggalPelaksanaan);
    const menuList = rec.menuItems.map((m, i) => `${i + 1}. ${m}`).join('\n');

    return [String(idx + 1), `${formattedDate}\n(${rec.tanggalPelaksanaan})`, day, menuList];
  });

  autoTable(doc, {
    startY: filterInfo?.dateFilter ? 47 : 42,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer / Signatures
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 220;

  if (finalY < 250) {
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    // Left Signature
    doc.text('Disiapkan Oleh,', 25, finalY);
    doc.text('Petugas Pengawas / QC Gizi', 25, finalY + 5);
    doc.line(25, finalY + 24, 75, finalY + 24);
    doc.text('( ................................................ )', 25, finalY + 28);
    doc.text('NIP. ........................................', 25, finalY + 32);

    // Right Signature
    doc.text('Disetujui Oleh,', 140, finalY);
    doc.text('Kepala Satuan Pelayanan Gizi', 140, finalY + 5);
    doc.line(140, finalY + 24, 190, finalY + 24);
    doc.text('( ................................................ )', 140, finalY + 28);
    doc.text('NIP. ........................................', 140, finalY + 32);
  }

  const dateSuffix = filterInfo?.dateFilter ? `_${filterInfo.dateFilter}` : `_${new Date().toISOString().split('T')[0]}`;
  doc.save(`Master_Menu_SPPG${dateSuffix}.pdf`);
};

/**
 * EXPORT SIKLUS MENU (KANDUNGAN GIZI) KE EXCEL (.xlsx)
 */
export const exportSiklusMenuToExcel = (
  selectedDate: string,
  porsiKecil: SiklusIngredientRow[],
  porsiBesar: SiklusIngredientRow[],
  customColumns: { id: string; label: string; unit: string }[] = [],
  masterMenuDishes: string[] = []
) => {
  const wb = XLSX.utils.book_new();
  const formattedDate = formatIndonesianDate(selectedDate);

  // Helper to build sheet data for a specific portion
  const buildPortionSheet = (
    portionTitle: string,
    targetAkg: string,
    rows: SiklusIngredientRow[]
  ) => {
    const sheetData: any[] = [];

    // Header banner
    sheetData.push([`BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)`]);
    sheetData.push([`FORM KANDUNGAN GIZI & EVALUASI AKG: ${portionTitle}`]);
    sheetData.push([`Hari / Tanggal Pelaksanaan: ${formattedDate} (${selectedDate})`]);
    sheetData.push([`Target AKG Standar SPPG: ${targetAkg}`]);
    if (masterMenuDishes.length > 0) {
      sheetData.push([`Susunan Menu Utama: ${masterMenuDishes.join(', ')}`]);
    }
    sheetData.push([]); // blank line

    // Table Header
    const headers = [
      'Nama Masakan',
      'Bahan Masakan',
      'Berat Bersih (gram)',
      'Energi (kkal)',
      'Protein (gram)',
      'Lemak (gram)',
      'Karbohidrat (gram)',
      'Serat (gram)'
    ];

    customColumns.forEach(col => {
      headers.push(`${col.label} (${col.unit})`);
    });

    sheetData.push(headers);

    // Sum accumulators
    let totalBerat = 0;
    let totalEnergi = 0;
    let totalProtein = 0;
    let totalLemak = 0;
    let totalKarbo = 0;
    let totalSerat = 0;
    const totalCustoms: Record<string, number> = {};

    rows.forEach(r => {
      totalBerat += Number(r.beratBersih) || 0;
      totalEnergi += Number(r.energi) || 0;
      totalProtein += Number(r.protein) || 0;
      totalLemak += Number(r.lemak) || 0;
      totalKarbo += Number(r.karbohidrat) || 0;
      totalSerat += Number(r.serat) || 0;

      const rowItem: any[] = [
        r.namaMasakan,
        r.bahanMasakan,
        r.beratBersih,
        r.energi,
        r.protein,
        r.lemak,
        r.karbohidrat,
        r.serat
      ];

      customColumns.forEach(col => {
        const val = Number(r.customFields?.[col.id]) || 0;
        totalCustoms[col.id] = (totalCustoms[col.id] || 0) + val;
        rowItem.push(val);
      });

      sheetData.push(rowItem);
    });

    // Total Row
    const totalRow: any[] = [
      'TOTAL KANDUNGAN GIZI',
      '-',
      parseFloat(totalBerat.toFixed(2)),
      parseFloat(totalEnergi.toFixed(2)),
      parseFloat(totalProtein.toFixed(2)),
      parseFloat(totalLemak.toFixed(2)),
      parseFloat(totalKarbo.toFixed(2)),
      parseFloat(totalSerat.toFixed(2))
    ];

    customColumns.forEach(col => {
      totalRow.push(parseFloat((totalCustoms[col.id] || 0).toFixed(2)));
    });

    sheetData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!cols'] = [
      { wch: 22 }, // Nama Masakan
      { wch: 26 }, // Bahan Masakan
      { wch: 18 }, // Berat Bersih
      { wch: 16 }, // Energi
      { wch: 16 }, // Protein
      { wch: 16 }, // Lemak
      { wch: 18 }, // Karbo
      { wch: 16 }, // Serat
      ...customColumns.map(() => ({ wch: 18 }))
    ];

    return ws;
  };

  // Sheet 1: Porsi Kecil
  const wsKecil = buildPortionSheet('PORSI KECIL (SD / MI)', '625 - 710 Kkal', porsiKecil);
  XLSX.utils.book_append_sheet(wb, wsKecil, 'Porsi Kecil');

  // Sheet 2: Porsi Besar
  const wsBesar = buildPortionSheet('PORSI BESAR (SMP / SMA)', '710 - 800 Kkal', porsiBesar);
  XLSX.utils.book_append_sheet(wb, wsBesar, 'Porsi Besar');

  // Sheet 3: Rekap Side-by-Side (Persis Screenshot Referensi Pengguna)
  const rekapSideBySide: any[] = [];
  rekapSideBySide.push(['PORSI KECIL', '', '', '', '', '', '', '', 'PORSI BESAR', '', '', '', '', '', '', '']);
  rekapSideBySide.push([formattedDate, '', '', '', '', '', '', '', formattedDate, '', '', '', '', '', '', '']);

  const sideHeadersLeft = ['Nama Masakan', 'Bahan Masakan', 'Berat Bersih (gram)', 'Energi (kkal)', 'Protein (gram)', 'Lemak (gram)', 'Karbohidrat (gram)', 'Serat (gram)'];
  const sideHeadersRight = ['Nama Masakan', 'Bahan Masakan', 'Berat Bersih (gram)', 'Energi (kkal)', 'Protein (gram)', 'Lemak (gram)', 'Karbohidrat (gram)', 'Serat (gram)'];
  rekapSideBySide.push([...sideHeadersLeft, '', ...sideHeadersRight]);

  const maxLen = Math.max(porsiKecil.length, porsiBesar.length);
  for (let i = 0; i < maxLen; i++) {
    const k = porsiKecil[i];
    const b = porsiBesar[i];
    const rowLeft = k
      ? [k.namaMasakan, k.bahanMasakan, k.beratBersih, k.energi, k.protein, k.lemak, k.karbohidrat, k.serat]
      : ['', '', '', '', '', '', '', ''];
    const rowRight = b
      ? [b.namaMasakan, b.bahanMasakan, b.beratBersih, b.energi, b.protein, b.lemak, b.karbohidrat, b.serat]
      : ['', '', '', '', '', '', '', ''];
    rekapSideBySide.push([...rowLeft, '', ...rowRight]);
  }

  // Totals side by side
  const totK = {
    bb: porsiKecil.reduce((a, c) => a + (Number(c.beratBersih) || 0), 0),
    e: porsiKecil.reduce((a, c) => a + (Number(c.energi) || 0), 0),
    p: porsiKecil.reduce((a, c) => a + (Number(c.protein) || 0), 0),
    l: porsiKecil.reduce((a, c) => a + (Number(c.lemak) || 0), 0),
    kh: porsiKecil.reduce((a, c) => a + (Number(c.karbohidrat) || 0), 0),
    s: porsiKecil.reduce((a, c) => a + (Number(c.serat) || 0), 0)
  };
  const totB = {
    bb: porsiBesar.reduce((a, c) => a + (Number(c.beratBersih) || 0), 0),
    e: porsiBesar.reduce((a, c) => a + (Number(c.energi) || 0), 0),
    p: porsiBesar.reduce((a, c) => a + (Number(c.protein) || 0), 0),
    l: porsiBesar.reduce((a, c) => a + (Number(c.lemak) || 0), 0),
    kh: porsiBesar.reduce((a, c) => a + (Number(c.karbohidrat) || 0), 0),
    s: porsiBesar.reduce((a, c) => a + (Number(c.serat) || 0), 0)
  };

  rekapSideBySide.push([
    'TOTAL', '-', totK.bb, parseFloat(totK.e.toFixed(1)), parseFloat(totK.p.toFixed(2)), parseFloat(totK.l.toFixed(2)), parseFloat(totK.kh.toFixed(2)), parseFloat(totK.s.toFixed(2)),
    '',
    'TOTAL', '-', totB.bb, parseFloat(totB.e.toFixed(1)), parseFloat(totB.p.toFixed(2)), parseFloat(totB.l.toFixed(2)), parseFloat(totB.kh.toFixed(2)), parseFloat(totB.s.toFixed(2))
  ]);

  const wsSide = XLSX.utils.aoa_to_sheet(rekapSideBySide);
  XLSX.utils.book_append_sheet(wb, wsSide, 'Bersandingan (Excel Referensi)');

  XLSX.writeFile(wb, `Siklus_Menu_Gizi_SPPG_${selectedDate}.xlsx`);
};

/**
 * EXPORT SIKLUS MENU (KANDUNGAN GIZI) KE PDF (.pdf)
 */
export const exportSiklusMenuToPdf = (
  selectedDate: string,
  porsiKecil: SiklusIngredientRow[],
  porsiBesar: SiklusIngredientRow[],
  customColumns: { id: string; label: string; unit: string }[] = [],
  masterMenuDishes: string[] = []
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const formattedDate = formatIndonesianDate(selectedDate);

  // Top Emerald Header Banner
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)', 14, 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('EVALUASI ANGKA KECUKUPAN GIZI (AKG) & STANDAR PORSI MAKANAN BERGIZI', 14, 17);

  // Document Details Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR KERJA ANALISIS KANDUNGAN GIZI SIKLUS MENU', 14, 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hari / Tanggal: ${formattedDate} (${selectedDate})`, 14, 35);
  if (masterMenuDishes.length > 0) {
    doc.text(`Menu Utama Master Menu: ${masterMenuDishes.join(', ')}`, 14, 40);
  }

  // Calculate Totals helper
  const calcSum = (rows: SiklusIngredientRow[]) => {
    return {
      bb: rows.reduce((a, c) => a + (Number(c.beratBersih) || 0), 0),
      e: rows.reduce((a, c) => a + (Number(c.energi) || 0), 0),
      p: rows.reduce((a, c) => a + (Number(c.protein) || 0), 0),
      l: rows.reduce((a, c) => a + (Number(c.lemak) || 0), 0),
      kh: rows.reduce((a, c) => a + (Number(c.karbohidrat) || 0), 0),
      s: rows.reduce((a, c) => a + (Number(c.serat) || 0), 0)
    };
  };

  const totK = calcSum(porsiKecil);
  const totB = calcSum(porsiBesar);

  // Build Table Body Helper
  const buildPdfTableData = (rows: SiklusIngredientRow[], tot: ReturnType<typeof calcSum>) => {
    const body: any[] = [];
    rows.forEach(r => {
      body.push([
        r.namaMasakan,
        r.bahanMasakan,
        String(r.beratBersih),
        String(r.energi),
        String(r.protein),
        String(r.lemak),
        String(r.karbohidrat),
        String(r.serat)
      ]);
    });

    body.push([
      'TOTAL',
      '-',
      String(tot.bb),
      tot.e.toFixed(1),
      tot.p.toFixed(2),
      tot.l.toFixed(2),
      tot.kh.toFixed(2),
      tot.s.toFixed(2)
    ]);

    return body;
  };

  const headers = [
    'Nama Masakan',
    'Bahan Masakan',
    'Berat (gr)',
    'Energi (kkal)',
    'Prot (g)',
    'Lemak (g)',
    'Karbo (g)',
    'Serat (g)'
  ];

  // SECTION 1: PORSI KECIL
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // amber-700
  const startY1 = masterMenuDishes.length > 0 ? 45 : 40;
  doc.text('1. PORSI KECIL (SD / MI) - Target AKG: 625 - 710 Kkal', 14, startY1);

  autoTable(doc, {
    startY: startY1 + 2,
    head: [headers],
    body: buildPdfTableData(porsiKecil, totK),
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' }
    },
    didParseCell: (data) => {
      // Bold and background on Total row
      if (data.row.index === porsiKecil.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 243, 199]; // amber-100
        data.cell.styles.textColor = [120, 53, 15]; // amber-900
      }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY1 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 110;

  // Check if Section 2 fits on the same page or add new page
  let startY2 = finalY1 + 8;
  if (startY2 > 130) {
    doc.addPage('a4', 'landscape');
    startY2 = 20;
  }

  // SECTION 2: PORSI BESAR
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('2. PORSI BESAR (SMP / SMA / MA) - Target AKG: 710 - 800 Kkal', 14, startY2);

  autoTable(doc, {
    startY: startY2 + 2,
    head: [headers],
    body: buildPdfTableData(porsiBesar, totB),
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9], // amber-700
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === porsiBesar.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 243, 199];
        data.cell.styles.textColor = [120, 53, 15];
      }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY2 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;

  // Summary and Sign-off signatures
  if (finalY2 < 175) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Left Signature
    doc.text('Petugas Ahli Gizi SPPG,', 25, finalY2);
    doc.line(25, finalY2 + 18, 75, finalY2 + 18);
    doc.text('( ................................................ )', 25, finalY2 + 22);
    doc.text('NIP. ........................................', 25, finalY2 + 26);

    // Right Signature
    doc.text('Kepala Satuan Pelayanan Gizi,', 215, finalY2);
    doc.line(215, finalY2 + 18, 265, finalY2 + 18);
    doc.text('( ................................................ )', 215, finalY2 + 22);
    doc.text('NIP. ........................................', 215, finalY2 + 26);
  }

  doc.save(`Siklus_Menu_Gizi_SPPG_${selectedDate}.pdf`);
};
