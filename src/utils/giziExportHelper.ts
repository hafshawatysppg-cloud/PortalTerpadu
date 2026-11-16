import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MasterMenuRecord } from '../types/masterMenu';
import { SiklusIngredientRow } from '../components/nutrition/SiklusMenuView';

export interface DateRangeFilterInfo {
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface SiklusMenuPrintEntry {
  tanggal: string;
  porsiKecil: SiklusIngredientRow[];
  porsiBesar: SiklusIngredientRow[];
  customColumns: { id: string; label: string; unit: string }[];
  masterMenuDishes: string[];
}

// Helper formatting dates in Indonesian
export const formatIndonesianDate = (dateStr: string): string => {
  try {
    const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const d = new Date(normalized);
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

export const formatPeriodeLabel = (filterInfo?: DateRangeFilterInfo): string => {
  if (!filterInfo) return 'Semua Tanggal';
  const { startDate, endDate, dateFilter } = filterInfo;
  if (startDate && endDate) {
    if (startDate === endDate) return `${formatIndonesianDate(startDate)} (${startDate})`;
    return `${startDate} s/d ${endDate}`;
  }
  if (startDate) return `Mulai ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;
  if (dateFilter) return `${formatIndonesianDate(dateFilter)} (${dateFilter})`;
  return 'Semua Tanggal';
};

const getFileSuffix = (filterInfo?: DateRangeFilterInfo): string => {
  if (filterInfo?.startDate && filterInfo?.endDate) {
    return filterInfo.startDate === filterInfo.endDate
      ? `_${filterInfo.startDate}`
      : `_${filterInfo.startDate}_sd_${filterInfo.endDate}`;
  }
  if (filterInfo?.startDate) return `_mulai_${filterInfo.startDate}`;
  if (filterInfo?.endDate) return `_sd_${filterInfo.endDate}`;
  if (filterInfo?.dateFilter) return `_${filterInfo.dateFilter}`;
  return `_${new Date().toISOString().split('T')[0]}`;
};

const loadImageAsBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

const escapeHtml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const printHtmlInHiddenIframe = (html: string): void => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // Ignore cleanup failure
      }
    }, 3000);
  }, 300);
};

/**
 * EXPORT MASTER MENU KE EXCEL (.xlsx)
 */
export const exportMasterMenuToExcel = (
  records: MasterMenuRecord[],
  filterInfo?: DateRangeFilterInfo
) => {
  const wb = XLSX.utils.book_new();
  const sortedRecords = [...records].sort((a, b) =>
    a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan)
  );

  const excelRows: any[] = [];
  excelRows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  excelRows.push(['LAPORAN DAFTAR MASTER MENU & RESEP STANDAR']);
  excelRows.push([
    `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Menu: ${sortedRecords.length} Jadwal`
  ]);
  excelRows.push([`Periode Tanggal: ${formatPeriodeLabel(filterInfo)}`]);
  if (filterInfo?.searchTerm) {
    excelRows.push([`Kata Kunci Pencarian: ${filterInfo.searchTerm}`]);
  }
  excelRows.push([]);

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

  sortedRecords.forEach((rec, idx) => {
    let dayName = '-';
    try {
      const d = new Date(`${rec.tanggalPelaksanaan}T00:00:00`);
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
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 14 },
    { wch: 24 },
    { wch: 28 },
    { wch: 24 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master Menu SPPG');
  XLSX.writeFile(wb, `Master_Menu_SPPG${getFileSuffix(filterInfo)}.xlsx`);
};

/**
 * EXPORT MASTER MENU KE PDF (.pdf)
 */
export const exportMasterMenuToPdf = async (
  records: MasterMenuRecord[],
  filterInfo?: DateRangeFilterInfo
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const sortedRecords = [...records].sort((a, b) =>
    a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan)
  );

  // Kop Surat resmi SPPG
  try {
    const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 9, 16, 16);
    }
  } catch {
    // Continue without logo
  }

  const textX = 34;
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', textX, 13);

  doc.setFontSize(10);
  doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN', textX, 17.5);

  doc.setFontSize(9);
  doc.text('YAYASAN HAFSHAWATY ZAINUL HASAN', textX, 21.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', textX, 25.2);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(14, 28.5, 196, 28.5);

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text('DAFTAR MASTER MENU & RESEP STANDAR SPPG', 105, 35, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Periode Tanggal : ${formatPeriodeLabel(filterInfo)}`, 14, 41.5);
  doc.text(`Total Jadwal Menu : ${sortedRecords.length} Hari  |  Dicetak : ${printDate}`, 14, 46);

  const tableHead = [['No', 'Tanggal Pelaksanaan', 'Hari', 'Susunan Komponen Menu Masakan']];
  const tableBody = sortedRecords.map((rec, idx) => {
    let day = '-';
    try {
      const d = new Date(`${rec.tanggalPelaksanaan}T00:00:00`);
      day = d.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      day = '-';
    }
    const formattedDate = formatIndonesianDate(rec.tanggalPelaksanaan);
    const menuList = rec.menuItems.map((m, i) => `${i + 1}. ${m}`).join('\n');

    return [String(idx + 1), `${formattedDate}\n(${rec.tanggalPelaksanaan})`, day, menuList];
  });

  autoTable(doc, {
    startY: 50,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      valign: 'middle'
    },
    headStyles: {
      font: 'times',
      fillColor: [217, 232, 245],
      textColor: [0, 0, 0],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 11, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = ((doc as any).lastAutoTable?.finalY || 200) + 12;
  if (finalY > 245) {
    doc.addPage('a4', 'portrait');
    finalY = 25;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  doc.text('Disiapkan Oleh,', 40, finalY, { align: 'center' });
  doc.text('Petugas Pengawas / Ahli Gizi', 40, finalY + 4.5, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Fitria, S.ST', 40, finalY + 24, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.text('Disetujui Oleh,', 162, finalY, { align: 'center' });
  doc.text('Kepala SPPG', 162, finalY + 4.5, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Sri Rohayu, S.Pd', 162, finalY + 24, { align: 'center' });

  doc.save(`Master_Menu_SPPG${getFileSuffix(filterInfo)}.pdf`);
};

/**
 * PRINT OUT MASTER MENU (A4 PORTRAIT ISOLATED IFRAME)
 */
export const printMasterMenuA4 = async (
  records: MasterMenuRecord[],
  filterInfo?: DateRangeFilterInfo
): Promise<void> => {
  const logoDataUrl = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const logoSrc = logoDataUrl || `${window.location.origin}/badan-gizi-nasional-seeklogo.png`;

  const sortedRecords = [...records].sort((a, b) =>
    a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan)
  );

  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const rowsHtml = sortedRecords
    .map((rec, idx) => {
      let day = '-';
      try {
        day = new Date(`${rec.tanggalPelaksanaan}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long' });
      } catch {
        day = '-';
      }
      const listHtml = rec.menuItems
        .map((m, i) => `<div>${i + 1}. ${escapeHtml(m)}</div>`)
        .join('');
      return `
        <tr>
          <td class="c">${idx + 1}</td>
          <td class="b">${escapeHtml(formatIndonesianDate(rec.tanggalPelaksanaan))}<br/><span class="muted">(${escapeHtml(rec.tanggalPelaksanaan)})</span></td>
          <td class="c">${escapeHtml(day)}</td>
          <td>${listHtml}</td>
        </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Master Menu SPPG - ${escapeHtml(formatPeriodeLabel(filterInfo))}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 16mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.35; }
    .kop { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .kop img { width: 58px; height: 58px; object-fit: contain; }
    .kop h1 { margin: 0; font-size: 13pt; font-weight: 700; text-transform: uppercase; }
    .kop h1 span { font-style: italic; font-weight: 600; }
    .kop p { margin: 1px 0 0 0; font-size: 9.5pt; font-weight: 600; }
    .kop .addr { font-size: 8.5pt; font-weight: 400; }
    .title { text-align: center; font-size: 12pt; font-weight: 700; text-transform: uppercase; margin: 10px 0 10px 0; letter-spacing: 0.4px; }
    .meta { width: 100%; margin-bottom: 10px; font-size: 10pt; border-collapse: collapse; }
    .meta td { padding: 1.5px 0; border: none; }
    .data { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    .data th, .data td { border: 1px solid #000; padding: 5px 7px; vertical-align: middle; }
    .data th { background: #D9E8F5; font-weight: 700; text-align: center; text-transform: uppercase; }
    .c { text-align: center; }
    .b { font-weight: 700; }
    .muted { font-size: 8.5pt; font-weight: 400; color: #333; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 26px; page-break-inside: avoid; font-size: 10pt; }
    .sig-space { height: 54px; }
    .sig-name { font-weight: 700; margin: 0; }
  </style>
</head>
<body>
  <div class="kop">
    <img src="${logoSrc}" alt="Logo BGN" />
    <div>
      <h1>BADAN GIZI NASIONAL <span>(NATIONAL NUTRITION AGENCY)</span></h1>
      <p>SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN</p>
      <p>YAYASAN HAFSHAWATY ZAINUL HASAN</p>
      <p class="addr">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</p>
    </div>
  </div>
  <h2 class="title">DAFTAR MASTER MENU &amp; RESEP STANDAR SPPG</h2>
  <table class="meta">
    <tr><td style="width: 135px;">Periode Tanggal</td><td style="width: 12px;">:</td><td class="b">${escapeHtml(formatPeriodeLabel(filterInfo))}</td></tr>
    <tr><td>Total Jadwal Menu</td><td>:</td><td>${sortedRecords.length} Hari Pelaksanaan</td></tr>
    <tr><td>Tanggal Cetak</td><td>:</td><td>${escapeHtml(printDate)}</td></tr>
  </table>
  <table class="data">
    <thead>
      <tr>
        <th style="width: 34px;">No</th>
        <th style="width: 175px;">Tanggal Pelaksanaan</th>
        <th style="width: 82px;">Hari</th>
        <th>Susunan Komponen Menu Masakan</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="sigs">
    <div>
      <div>Disiapkan Oleh,</div>
      <div>Petugas Pengawas / Ahli Gizi</div>
      <div class="sig-space"></div>
      <p class="sig-name">Fitria, S.ST</p>
    </div>
    <div>
      <div>Disetujui Oleh,</div>
      <div>Kepala SPPG</div>
      <div class="sig-space"></div>
      <p class="sig-name">Sri Rohayu, S.Pd</p>
    </div>
  </div>
</body>
</html>`;

  printHtmlInHiddenIframe(html);
};

// Shared calculator for Siklus Menu totals
const calcSiklusSum = (
  rows: SiklusIngredientRow[],
  customColumns: { id: string; label: string; unit: string }[] = []
) => {
  const customs: Record<string, number> = {};
  rows.forEach(r => {
    customColumns.forEach(col => {
      customs[col.id] = (customs[col.id] || 0) + (Number(r.customFields?.[col.id]) || 0);
    });
  });
  return {
    bb: rows.reduce((a, c) => a + (Number(c.beratBersih) || 0), 0),
    e: rows.reduce((a, c) => a + (Number(c.energi) || 0), 0),
    p: rows.reduce((a, c) => a + (Number(c.protein) || 0), 0),
    l: rows.reduce((a, c) => a + (Number(c.lemak) || 0), 0),
    kh: rows.reduce((a, c) => a + (Number(c.karbohidrat) || 0), 0),
    s: rows.reduce((a, c) => a + (Number(c.serat) || 0), 0),
    customs
  };
};

/**
 * EXPORT SIKLUS MENU (SINGLE ATAU RENTANG TANGGAL) KE EXCEL (.xlsx)
 */
export const exportSiklusMenuToExcel = (
  selectedDate: string,
  porsiKecil: SiklusIngredientRow[],
  porsiBesar: SiklusIngredientRow[],
  customColumns: { id: string; label: string; unit: string }[] = [],
  masterMenuDishes: string[] = []
) => {
  exportSiklusMenuRangeToExcel(
    [
      {
        tanggal: selectedDate,
        porsiKecil,
        porsiBesar,
        customColumns,
        masterMenuDishes
      }
    ],
    { dateFilter: selectedDate }
  );
};

export const exportSiklusMenuRangeToExcel = (
  entries: SiklusMenuPrintEntry[],
  filterInfo?: DateRangeFilterInfo
) => {
  const wb = XLSX.utils.book_new();

  entries.forEach((entry) => {
    const formattedDate = formatIndonesianDate(entry.tanggal);
    const cols = entry.customColumns || [];

    const rekap: any[] = [];
    rekap.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
    rekap.push([`FORM KANDUNGAN GIZI & EVALUASI AKG - ${formattedDate} (${entry.tanggal})`]);
    if (entry.masterMenuDishes.length > 0) {
      rekap.push([`Susunan Menu Utama: ${entry.masterMenuDishes.join(', ')}`]);
    }
    rekap.push([]);

    const headersLeft = [
      'Nama Masakan',
      'Bahan Masakan',
      'Berat Bersih (gram)',
      'Energi (kkal)',
      'Protein (gram)',
      'Lemak (gram)',
      'Karbohidrat (gram)',
      'Serat (gram)',
      ...cols.map(c => `${c.label} (${c.unit})`)
    ];
    const headersRight = [...headersLeft];

    rekap.push([
      'PORSI KECIL (Target AKG: 625 - 710 Kkal)',
      ...Array(headersLeft.length - 1).fill(''),
      '',
      'PORSI BESAR (Target AKG: 710 - 800 Kkal)',
      ...Array(headersRight.length - 1).fill('')
    ]);
    rekap.push([...headersLeft, '', ...headersRight]);

    const maxLen = Math.max(entry.porsiKecil.length, entry.porsiBesar.length);
    for (let i = 0; i < maxLen; i++) {
      const k = entry.porsiKecil[i];
      const b = entry.porsiBesar[i];
      const rowLeft = k
        ? [
            k.namaMasakan,
            k.bahanMasakan,
            k.beratBersih,
            k.energi,
            k.protein,
            k.lemak,
            k.karbohidrat,
            k.serat,
            ...cols.map(c => Number(k.customFields?.[c.id]) || 0)
          ]
        : Array(headersLeft.length).fill('');
      const rowRight = b
        ? [
            b.namaMasakan,
            b.bahanMasakan,
            b.beratBersih,
            b.energi,
            b.protein,
            b.lemak,
            b.karbohidrat,
            b.serat,
            ...cols.map(c => Number(b.customFields?.[c.id]) || 0)
          ]
        : Array(headersRight.length).fill('');
      rekap.push([...rowLeft, '', ...rowRight]);
    }

    const totK = calcSiklusSum(entry.porsiKecil, cols);
    const totB = calcSiklusSum(entry.porsiBesar, cols);

    rekap.push([
      'TOTAL',
      '-',
      parseFloat(totK.bb.toFixed(2)),
      parseFloat(totK.e.toFixed(1)),
      parseFloat(totK.p.toFixed(2)),
      parseFloat(totK.l.toFixed(2)),
      parseFloat(totK.kh.toFixed(2)),
      parseFloat(totK.s.toFixed(2)),
      ...cols.map(c => parseFloat((totK.customs[c.id] || 0).toFixed(2))),
      '',
      'TOTAL',
      '-',
      parseFloat(totB.bb.toFixed(2)),
      parseFloat(totB.e.toFixed(1)),
      parseFloat(totB.p.toFixed(2)),
      parseFloat(totB.l.toFixed(2)),
      parseFloat(totB.kh.toFixed(2)),
      parseFloat(totB.s.toFixed(2)),
      ...cols.map(c => parseFloat((totB.customs[c.id] || 0).toFixed(2)))
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rekap);
    const baseSheetName = entry.tanggal.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, baseSheetName);
  });

  XLSX.writeFile(wb, `Siklus_Menu_Gizi_SPPG${getFileSuffix(filterInfo)}.xlsx`);
};

/**
 * EXPORT SIKLUS MENU (SINGLE ATAU RENTANG TANGGAL) KE PDF (.pdf)
 */
export const exportSiklusMenuToPdf = async (
  selectedDate: string,
  porsiKecil: SiklusIngredientRow[],
  porsiBesar: SiklusIngredientRow[],
  customColumns: { id: string; label: string; unit: string }[] = [],
  masterMenuDishes: string[] = []
) => {
  await exportSiklusMenuRangeToPdf(
    [
      {
        tanggal: selectedDate,
        porsiKecil,
        porsiBesar,
        customColumns,
        masterMenuDishes
      }
    ],
    { dateFilter: selectedDate }
  );
};

export const exportSiklusMenuRangeToPdf = async (
  entries: SiklusMenuPrintEntry[],
  filterInfo?: DateRangeFilterInfo
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const sortedEntries = [...entries].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  sortedEntries.forEach((entry, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }

    const formattedDate = formatIndonesianDate(entry.tanggal);
    const cols = entry.customColumns || [];

    // Kop Surat resmi SPPG
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 7, 15, 15);
      } catch {
        // Ignore logo draw error
      }
    }

    const textX = 33;
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', textX, 11);
    doc.setFontSize(10);
    doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN', textX, 15.2);
    doc.setFontSize(8.5);
    doc.text('YAYASAN HAFSHAWATY ZAINUL HASAN | Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', textX, 19);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 23, 283, 23);

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('LEMBAR ANALISIS KANDUNGAN GIZI SIKLUS MENU', 148.5, 28.5, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Hari / Tanggal : ${formattedDate} (${entry.tanggal})`, 14, 33.5);
    doc.text(`Periode Laporan : ${formatPeriodeLabel(filterInfo)}`, 283, 33.5, { align: 'right' });
    if (entry.masterMenuDishes.length > 0) {
      doc.text(`Menu Utama : ${entry.masterMenuDishes.join(', ')}`, 14, 37.8);
    }

    const totK = calcSiklusSum(entry.porsiKecil, cols);
    const totB = calcSiklusSum(entry.porsiBesar, cols);

    const buildPdfTableData = (rows: SiklusIngredientRow[], tot: ReturnType<typeof calcSiklusSum>) => {
      const body: any[] = rows.map(r => [
        r.namaMasakan,
        r.bahanMasakan,
        String(r.beratBersih),
        String(r.energi),
        String(r.protein),
        String(r.lemak),
        String(r.karbohidrat),
        String(r.serat),
        ...cols.map(c => String(r.customFields?.[c.id] || 0))
      ]);

      body.push([
        'TOTAL',
        '-',
        String(parseFloat(tot.bb.toFixed(2))),
        tot.e.toFixed(1),
        tot.p.toFixed(2),
        tot.l.toFixed(2),
        tot.kh.toFixed(2),
        tot.s.toFixed(2),
        ...cols.map(c => parseFloat((tot.customs[c.id] || 0).toFixed(2)).toString())
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
      'Serat (g)',
      ...cols.map(c => `${c.label} (${c.unit})`)
    ];

    const startY1 = entry.masterMenuDishes.length > 0 ? 42.5 : 38.5;
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('1. PORSI KECIL (SD / MI) - Target AKG: 625 - 710 Kkal', 14, startY1);

    autoTable(doc, {
      startY: startY1 + 1.5,
      head: [headers],
      body: buildPdfTableData(entry.porsiKecil, totK),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 1.4
      },
      headStyles: {
        font: 'times',
        fillColor: [245, 158, 11],
        textColor: [0, 0, 0],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 44 },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === entry.porsiKecil.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY1 = ((doc as any).lastAutoTable?.finalY || 100) + 6;
    let startY2 = finalY1;
    if (startY2 > 140) {
      doc.addPage('a4', 'landscape');
      startY2 = 16;
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('2. PORSI BESAR (SMP / SMA / MA) - Target AKG: 710 - 800 Kkal', 14, startY2);

    autoTable(doc, {
      startY: startY2 + 1.5,
      head: [headers],
      body: buildPdfTableData(entry.porsiBesar, totB),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 1.4
      },
      headStyles: {
        font: 'times',
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 44 },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === entry.porsiBesar.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
        }
      },
      margin: { left: 14, right: 14 }
    });

    let sigY = ((doc as any).lastAutoTable?.finalY || 170) + 8;
    if (sigY > 176) {
      doc.addPage('a4', 'landscape');
      sigY = 25;
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Ahli Gizi SPPG,', 55, sigY, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('Fitria, S.ST', 55, sigY + 18, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.text('Kepala SPPG,', 235, sigY, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('Sri Rohayu, S.Pd', 235, sigY + 18, { align: 'center' });
  });

  doc.save(`Siklus_Menu_Gizi_SPPG${getFileSuffix(filterInfo)}.pdf`);
};

/**
 * PRINT OUT SIKLUS MENU (A4 LANDSCAPE ISOLATED IFRAME)
 */
export const printSiklusMenuA4 = async (
  entries: SiklusMenuPrintEntry[],
  filterInfo?: DateRangeFilterInfo
): Promise<void> => {
  const logoDataUrl = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const logoSrc = logoDataUrl || `${window.location.origin}/badan-gizi-nasional-seeklogo.png`;

  const sortedEntries = [...entries].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const renderPortionTableHtml = (
    heading: string,
    targetAkg: string,
    rows: SiklusIngredientRow[],
    cols: { id: string; label: string; unit: string }[]
  ) => {
    const tot = calcSiklusSum(rows, cols);
    const extraHead = cols
      .map(c => `<th class="r">${escapeHtml(c.label)} (${escapeHtml(c.unit)})</th>`)
      .join('');

    const bodyHtml = rows
      .map(
        r => `
        <tr>
          <td class="b">${escapeHtml(r.namaMasakan)}</td>
          <td>${escapeHtml(r.bahanMasakan || '-')}</td>
          <td class="r">${r.beratBersih}</td>
          <td class="r b">${r.energi}</td>
          <td class="r">${r.protein}</td>
          <td class="r">${r.lemak}</td>
          <td class="r">${r.karbohidrat}</td>
          <td class="r">${r.serat}</td>
          ${cols.map(c => `<td class="r">${r.customFields?.[c.id] || 0}</td>`).join('')}
        </tr>`
      )
      .join('');

    return `
      <div class="portion-block">
        <div class="portion-title">${escapeHtml(heading)} <span>(Target AKG: ${escapeHtml(targetAkg)})</span></div>
        <table class="gizi-table">
          <thead>
            <tr>
              <th>Nama Masakan</th>
              <th>Bahan Masakan</th>
              <th class="r">Berat Bersih (gr)</th>
              <th class="r">Energi (kkal)</th>
              <th class="r">Protein (gr)</th>
              <th class="r">Lemak (gr)</th>
              <th class="r">Karbohidrat (gr)</th>
              <th class="r">Serat (gr)</th>
              ${extraHead}
            </tr>
          </thead>
          <tbody>
            ${bodyHtml}
            <tr class="total-row">
              <td colspan="2" class="c">TOTAL</td>
              <td class="r">${parseFloat(tot.bb.toFixed(2))}</td>
              <td class="r">${parseFloat(tot.e.toFixed(1))}</td>
              <td class="r">${parseFloat(tot.p.toFixed(2))}</td>
              <td class="r">${parseFloat(tot.l.toFixed(2))}</td>
              <td class="r">${parseFloat(tot.kh.toFixed(2))}</td>
              <td class="r">${parseFloat(tot.s.toFixed(2))}</td>
              ${cols.map(c => `<td class="r">${parseFloat((tot.customs[c.id] || 0).toFixed(2))}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>`;
  };

  const pagesHtml = sortedEntries
    .map((entry, idx) => {
      const formattedDate = formatIndonesianDate(entry.tanggal);
      const cols = entry.customColumns || [];
      return `
        <div class="page-section ${idx > 0 ? 'page-break' : ''}">
          <div class="kop">
            <img src="${logoSrc}" alt="Logo BGN" />
            <div>
              <h1>BADAN GIZI NASIONAL <span>(NATIONAL NUTRITION AGENCY)</span></h1>
              <p>SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN &bull; YAYASAN HAFSHAWATY ZAINUL HASAN</p>
              <p class="addr">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</p>
            </div>
          </div>
          <h2 class="title">LEMBAR ANALISIS KANDUNGAN GIZI SIKLUS MENU</h2>
          <div class="meta-bar">
            <div><strong>Hari / Tanggal:</strong> ${escapeHtml(formattedDate)} (${escapeHtml(entry.tanggal)})</div>
            <div><strong>Periode:</strong> ${escapeHtml(formatPeriodeLabel(filterInfo))}</div>
          </div>
          ${
            entry.masterMenuDishes.length > 0
              ? `<div class="menu-line"><strong>Susunan Menu Utama:</strong> ${escapeHtml(entry.masterMenuDishes.join(', '))}</div>`
              : ''
          }
          <div class="tables-grid">
            ${renderPortionTableHtml('1. PORSI KECIL (SD / MI)', '625 - 710 Kkal', entry.porsiKecil, cols)}
            ${renderPortionTableHtml('2. PORSI BESAR (SMP / SMA / MA)', '710 - 800 Kkal', entry.porsiBesar, cols)}
          </div>
          <div class="sigs">
            <div>
              <div>Ahli Gizi SPPG,</div>
              <div class="sig-space"></div>
              <p class="sig-name">Fitria, S.ST</p>
            </div>
            <div>
              <div>Kepala SPPG,</div>
              <div class="sig-space"></div>
              <p class="sig-name">Sri Rohayu, S.Pd</p>
            </div>
          </div>
        </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Siklus Menu (Kandungan Gizi) - ${escapeHtml(formatPeriodeLabel(filterInfo))}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.25; }
    .page-break { page-break-before: always; }
    .kop { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .kop img { width: 48px; height: 48px; object-fit: contain; }
    .kop h1 { margin: 0; font-size: 12pt; font-weight: 700; text-transform: uppercase; }
    .kop h1 span { font-style: italic; font-weight: 600; }
    .kop p { margin: 1px 0 0 0; font-size: 8.5pt; font-weight: 600; }
    .kop .addr { font-size: 8pt; font-weight: 400; }
    .title { text-align: center; font-size: 11pt; font-weight: 700; text-transform: uppercase; margin: 6px 0; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 3px; }
    .menu-line { font-size: 8.5pt; margin-bottom: 8px; }
    .portion-block { margin-bottom: 10px; page-break-inside: avoid; }
    .portion-title { background: #F59E0B; color: #000; font-weight: 700; padding: 3px 8px; border: 1px solid #000; border-bottom: none; font-size: 9pt; }
    .portion-title span { font-weight: 400; font-size: 8.5pt; }
    .gizi-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
    .gizi-table th, .gizi-table td { border: 1px solid #000; padding: 3px 5px; }
    .gizi-table th { background: #FEF3C7; font-weight: 700; text-align: left; }
    .gizi-table th.r, .gizi-table td.r { text-align: right; }
    .gizi-table td.c { text-align: center; }
    .gizi-table td.b { font-weight: 700; }
    .total-row td { background: #FDE68A; font-weight: 700; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 14px; page-break-inside: avoid; font-size: 9pt; }
    .sig-space { height: 42px; }
    .sig-name { font-weight: 700; margin: 0; }
  </style>
</head>
<body>${pagesHtml}</body>
</html>`;

  printHtmlInHiddenIframe(html);
};
