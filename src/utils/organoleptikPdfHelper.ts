import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface OrganoleptikPrintRow {
  no: number;
  namaMakanan: string;
  rasa: string;
  warna: string;
  aroma: string;
  tekstur: string;
  statusWaktu: string;
  ket: string;
}

export interface OrganoleptikPrintData {
  namaPemeriksa: string;
  tempatPemeriksaan: 'SPPG' | 'Satuan Pendidikan' | 'Posyandu/Lainnya';
  namaTempatPemeriksa: string;
  tanggalPemeriksaan: string;
  tanggalFormatted: string;
  waktuPemeriksaan: string;
  rows: OrganoleptikPrintRow[];
}

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

/**
 * Generates an isolated A4 portrait HTML document containing ONLY the
 * Checklist Uji Organoleptik attachment (starting strictly from Kop Surat)
 * and prints it via hidden iframe so no parent page UI/sidebar/tabs leak into print out.
 */
export const printOrganoleptikA4 = async (data: OrganoleptikPrintData): Promise<void> => {
  const logoDataUrl = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const logoSrc = logoDataUrl || `${window.location.origin}/badan-gizi-nasional-seeklogo.png`;

  const displayRows =
    data.rows.length > 0
      ? data.rows
      : Array.from({ length: 6 }, (_, i) => ({
          no: i + 1,
          namaMakanan: '',
          rasa: '',
          warna: '',
          aroma: '',
          tekstur: '',
          statusWaktu: '',
          ket: ''
        }));

  const rowsHtml = displayRows
    .map(
      (row) => `
      <tr>
        <td class="col-center">${row.no}</td>
        <td class="col-left">${escapeHtml(row.namaMakanan)}</td>
        <td class="col-center">${escapeHtml(row.rasa)}</td>
        <td class="col-center">${escapeHtml(row.warna)}</td>
        <td class="col-center">${escapeHtml(row.aroma)}</td>
        <td class="col-center">${escapeHtml(row.tekstur)}</td>
        <td class="col-center col-small">${escapeHtml(row.statusWaktu)}</td>
        <td class="col-center">${escapeHtml(row.ket)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Checklist Uji Organoleptik - ${escapeHtml(data.tanggalPemeriksaan || 'SPPG')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 18mm 14mm 18mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
    }
    .sheet {
      width: 100%;
    }
    .kop-surat {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #000000;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .kop-logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-text {
      flex: 1;
      text-align: left;
    }
    .kop-text h1 {
      margin: 0;
      font-size: 13.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kop-text h1 span {
      font-style: italic;
      font-weight: 600;
    }
    .kop-text .sub1 {
      margin: 2px 0 0 0;
      font-size: 10.5pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kop-text .sub2 {
      margin: 1px 0 0 0;
      font-size: 9.5pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kop-text .addr {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
    }
    .doc-title {
      text-align: center;
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }
    .identitas {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10.5pt;
    }
    .identitas td {
      padding: 2px 0;
      vertical-align: top;
      border: none;
    }
    .identitas .lbl {
      width: 165px;
    }
    .identitas .sep {
      width: 14px;
    }
    .identitas .val {
      font-weight: 600;
    }
    .identitas .val-normal {
      font-weight: 400;
    }
    .u-bold {
      font-weight: 700;
      text-decoration: underline;
    }
    .checklist {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10pt;
    }
    .checklist th,
    .checklist td {
      border: 1px solid #000000;
      padding: 5px 6px;
      vertical-align: middle;
    }
    .checklist th {
      font-weight: 700;
      text-align: center;
      background: #ffffff;
    }
    .col-center {
      text-align: center;
    }
    .col-left {
      text-align: left;
    }
    .col-small {
      font-size: 9.5pt;
    }
    .notes {
      font-size: 9.5pt;
      margin-bottom: 18px;
    }
    .notes p {
      margin: 0 0 3px 0;
      font-weight: 600;
    }
    .notes ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }
    .notes li {
      margin-bottom: 2px;
    }
    .skor-grid {
      display: grid;
      grid-template-columns: 85px 10px 1fr;
      padding-left: 6px;
      row-gap: 1px;
    }
    .signatures-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      font-size: 10.5pt;
      margin-top: 22px;
      page-break-inside: avoid;
    }
    .signatures-bottom {
      text-align: center;
      font-size: 10.5pt;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .sig-space {
      height: 54px;
    }
    .sig-name {
      font-weight: 700;
      margin: 0;
    }
    .sig-label {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="kop-surat">
      <img src="${logoSrc}" alt="Logo Badan Gizi Nasional" class="kop-logo" />
      <div class="kop-text">
        <h1>BADAN GIZI NASIONAL <span>(NATIONAL NUTRITION AGENCY)</span></h1>
        <p class="sub1">SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN</p>
        <p class="sub2">YAYASAN HAFSHAWATY ZAINUL HASAN</p>
        <p class="addr">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</p>
      </div>
    </div>

    <h2 class="doc-title">CHECKLIST UJI ORGANOLEPTIK</h2>

    <table class="identitas">
      <tbody>
        <tr>
          <td class="lbl">Nama Pemeriksa</td>
          <td class="sep">:</td>
          <td class="val">${escapeHtml(data.namaPemeriksa)}</td>
        </tr>
        <tr>
          <td class="lbl">Tempat Pemeriksaan</td>
          <td class="sep">:</td>
          <td class="val-normal">
            <span class="${data.tempatPemeriksaan === 'SPPG' ? 'u-bold' : ''}">SPPG</span> /
            <span class="${data.tempatPemeriksaan === 'Satuan Pendidikan' ? 'u-bold' : ''}">Satuan Pendidikan</span> /
            <span class="${data.tempatPemeriksaan === 'Posyandu/Lainnya' ? 'u-bold' : ''}">Posyandu/Lainnya</span>
          </td>
        </tr>
        <tr>
          <td class="lbl">Nama Tempat Pemeriksa</td>
          <td class="sep">:</td>
          <td class="val">${escapeHtml(data.namaTempatPemeriksa)}</td>
        </tr>
        <tr>
          <td class="lbl">Tanggal Pemeriksaan</td>
          <td class="sep">:</td>
          <td class="val">${escapeHtml(data.tanggalFormatted)}</td>
        </tr>
        <tr>
          <td class="lbl">Waktu Pemeriksaan</td>
          <td class="sep">:</td>
          <td class="val">${escapeHtml(data.waktuPemeriksaan)}</td>
        </tr>
      </tbody>
    </table>

    <table class="checklist">
      <thead>
        <tr>
          <th rowspan="2" style="width: 34px;">No</th>
          <th rowspan="2">Nama Makanan</th>
          <th colspan="4">Hasil Pemeriksaan (diberi skor 1-5)</th>
          <th rowspan="2" style="width: 132px; line-height: 1.2;">Sebelum Pengantaran/saat tiba di lokasi/sebelum dikonsumsi</th>
          <th rowspan="2" style="width: 66px;">KET</th>
        </tr>
        <tr>
          <th style="width: 44px;">Rasa</th>
          <th style="width: 44px;">Warna</th>
          <th style="width: 44px;">Aroma</th>
          <th style="width: 44px;">Tekstur</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr>
          <td colspan="6" style="text-align: center; font-weight: 700; padding: 6px;">Kesimpulan Menu MBG</td>
          <td style="text-align: center; font-weight: 600; padding: 6px;">Tidak/Aman dikonsumsi</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="notes">
      <p>Catatan :</p>
      <ol>
        <li>Silakan dipilih salah satu untuk pengisian hasil pelaksanaan uji organoleptic (Sebelum Pengantaran/Saat tiba di Lokasi/Sebelum dikonsumsi)</li>
        <li>Form dibawa oleh supir untuk diberikan ke penanggung jawab program MBG dan diambil Kembali bersamaan dengan pengambilan ompreng MBG, dan dibawa Kembali ke SPPG.</li>
      </ol>
      <p>Skor :</p>
      <div class="skor-grid">
        <span>Sangat baik</span><span>:</span><span>5</span>
        <span>Baik</span><span>:</span><span>4</span>
        <span>Cukup</span><span>:</span><span>3</span>
        <span>Kurang</span><span>:</span><span>2</span>
        <span>Tidak baik</span><span>:</span><span>1</span>
      </div>
    </div>

    <div class="signatures-top">
      <div>
        <p class="sig-label">Mengetahui</p>
        <div class="sig-space"></div>
        <p class="sig-name">Fitria, S.ST</p>
      </div>
      <div>
        <p class="sig-label">Pemeriksa</p>
        <div class="sig-space"></div>
        <p class="sig-name" style="font-weight: 600;">${escapeHtml(data.namaPemeriksa || '.......................................')}</p>
      </div>
    </div>

    <div class="signatures-bottom">
      <p class="sig-label">Kepala SPPG</p>
      <div class="sig-space"></div>
      <p class="sig-name">Sri Rohayu, S.Pd</p>
    </div>
  </div>
</body>
</html>`;

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
    }, 2500);
  }, 250);
};

/**
 * Downloads the exact A4 Checklist Uji Organoleptik as a Times New Roman PDF file.
 */
export const downloadOrganoleptikPdf = async (data: OrganoleptikPrintData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;

  // 1. Kop Surat + Logo BGN
  try {
    const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginX, 12, 18, 18);
    }
  } catch {
    // Continue without logo if blocked
  }

  const textStartX = marginX + 22;
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('BADAN GIZI NASIONAL ', textStartX, 16);
  const bgnWidth = doc.getTextWidth('BADAN GIZI NASIONAL ');
  doc.setFont('times', 'bolditalic');
  doc.text('(NATIONAL NUTRITION AGENCY)', textStartX + bgnWidth, 16);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN', textStartX, 20.5);

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('YAYASAN HAFSHAWATY ZAINUL HASAN', textStartX, 24.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', textStartX, 28.5);

  // Divider line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(marginX, 32.5, pageWidth - marginX, 32.5);

  // 2. Judul
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text('CHECKLIST UJI ORGANOLEPTIK', pageWidth / 2, 39.5, { align: 'center' });

  // 3. Identitas Pemeriksaan
  let y = 46;
  const labelX = marginX;
  const colonX = marginX + 43;
  const valX = marginX + 46;
  const lineStep = 5.2;

  const drawIdentityRow = (label: string, value: string, boldValue = true) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(label, labelX, y);
    doc.text(':', colonX, y);
    doc.setFont('times', boldValue ? 'bold' : 'normal');
    doc.text(value || '', valX, y);
    y += lineStep;
  };

  drawIdentityRow('Nama Pemeriksa', data.namaPemeriksa);
  drawIdentityRow('Tempat Pemeriksaan', 'SPPG / Satuan Pendidikan / Posyandu/Lainnya', false);
  drawIdentityRow('Nama Tempat Pemeriksa', data.namaTempatPemeriksa);
  drawIdentityRow('Tanggal Pemeriksaan', data.tanggalFormatted);
  drawIdentityRow('Waktu Pemeriksaan', data.waktuPemeriksaan);

  y += 2;

  // 4. Tabel Checklist Uji Organoleptik
  const displayRows =
    data.rows.length > 0
      ? data.rows
      : Array.from({ length: 6 }, (_, i) => ({
          no: i + 1,
          namaMakanan: '',
          rasa: '',
          warna: '',
          aroma: '',
          tekstur: '',
          statusWaktu: '',
          ket: ''
        }));

  const tableBody: any[] = displayRows.map((row) => [
    String(row.no),
    row.namaMakanan || '',
    row.rasa || '',
    row.warna || '',
    row.aroma || '',
    row.tekstur || '',
    row.statusWaktu || '',
    row.ket || ''
  ]);

  tableBody.push([
    {
      content: 'Kesimpulan Menu MBG',
      colSpan: 6,
      styles: { halign: 'center', fontStyle: 'bold' }
    },
    {
      content: 'Tidak/Aman dikonsumsi',
      styles: { halign: 'center', fontStyle: 'bold' }
    },
    ''
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 1.8,
      valign: 'middle'
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9.5,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      halign: 'center',
      valign: 'middle'
    },
    head: [
      [
        { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Nama Makanan', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Hasil Pemeriksaan (diberi skor 1-5)', colSpan: 4, styles: { halign: 'center', valign: 'middle' } },
        {
          content: 'Sebelum Pengantaran/saat tiba di lokasi/sebelum dikonsumsi',
          rowSpan: 2,
          styles: { halign: 'center', valign: 'middle', fontSize: 8.5 }
        },
        { content: 'KET', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        { content: 'Rasa', styles: { halign: 'center' } },
        { content: 'Warna', styles: { halign: 'center' } },
        { content: 'Aroma', styles: { halign: 'center' } },
        { content: 'Tekstur', styles: { halign: 'center' } }
      ]
    ],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 42, halign: 'center', fontSize: 8.5 },
      7: { cellWidth: contentWidth - 156, halign: 'center' }
    },
    body: tableBody
  });

  const finalY = ((doc as any).lastAutoTable?.finalY || y + 55) + 5;

  // 5. Catatan & Skor
  let ny = finalY;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('Catatan :', marginX, ny);
  ny += 4.5;

  doc.setFont('times', 'normal');
  const note1 = doc.splitTextToSize(
    '1. Silakan dipilih salah satu untuk pengisian hasil pelaksanaan uji organoleptic (Sebelum Pengantaran/Saat tiba di Lokasi/Sebelum dikonsumsi)',
    contentWidth - 4
  );
  doc.text(note1, marginX + 4, ny);
  ny += note1.length * 4;

  const note2 = doc.splitTextToSize(
    '2. Form dibawa oleh supir untuk diberikan ke penanggung jawab program MBG dan diambil Kembali bersamaan dengan pengambilan ompreng MBG, dan dibawa Kembali ke SPPG.',
    contentWidth - 4
  );
  doc.text(note2, marginX + 4, ny);
  ny += note2.length * 4 + 3;

  doc.setFont('times', 'bold');
  doc.text('Skor :', marginX, ny);
  ny += 4.5;

  doc.setFont('times', 'normal');
  const skors: Array<[string, string]> = [
    ['Sangat baik', '5'],
    ['Baik', '4'],
    ['Cukup', '3'],
    ['Kurang', '2'],
    ['Tidak baik', '1']
  ];
  for (const [label, score] of skors) {
    doc.text(label, marginX + 4, ny);
    doc.text(':', marginX + 27, ny);
    doc.text(score, marginX + 30, ny);
    ny += 4.2;
  }

  // 6. Tanda Tangan
  let sy = Math.max(ny + 8, 222);
  if (sy > 255) {
    doc.addPage();
    sy = 25;
  }

  const leftCenterX = marginX + contentWidth * 0.25;
  const rightCenterX = marginX + contentWidth * 0.75;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Mengetahui', leftCenterX, sy, { align: 'center' });
  doc.text('Pemeriksa', rightCenterX, sy, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text('Fitria, S.ST', leftCenterX, sy + 18, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text(data.namaPemeriksa || '.......................................', rightCenterX, sy + 18, { align: 'center' });

  const bottomSy = sy + 27;
  doc.text('Kepala SPPG', pageWidth / 2, bottomSy, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Sri Rohayu, S.Pd', pageWidth / 2, bottomSy + 18, { align: 'center' });

  const fileDate = data.tanggalPemeriksaan || new Date().toISOString().split('T')[0];
  doc.save(`Checklist_Uji_Organoleptik_${fileDate}.pdf`);
};
