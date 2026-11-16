import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailySuhuPengolahanRecord } from '../components/gizi/SuhuPengolahanView';
import { DailySuhuOmprengRecord } from '../components/gizi/SuhuMasukOmprengView';

export interface LaporanMakananSections {
  tabelPengolahan: boolean;
  tabelOmpreng: boolean;
  dokPengolahan: boolean;
  dokOmpreng: boolean;
}

export interface LaporanMakananExportParams {
  pengolahanRecords: DailySuhuPengolahanRecord[];
  omprengRecords: DailySuhuOmprengRecord[];
  startDate?: string;
  endDate?: string;
  sections?: LaporanMakananSections;
}

const DEFAULT_SECTIONS: LaporanMakananSections = {
  tabelPengolahan: true,
  tabelOmpreng: true,
  dokPengolahan: true,
  dokOmpreng: true
};

const formatTanggalTable = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatTanggalBanner = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    return `${day} ${months[monthIdx] || ''} ${year}`;
  }
  return dateStr.toUpperCase();
};

const formatSuhu = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return val.toFixed(1).replace('.', ',');
};

const formatPeriodeText = (startDate?: string, endDate?: string): string => {
  if (startDate && endDate) {
    return startDate === endDate
      ? formatTanggalBanner(startDate)
      : `${formatTanggalTable(startDate)} s/d ${formatTanggalTable(endDate)}`;
  }
  if (startDate) return `Mulai ${formatTanggalTable(startDate)}`;
  if (endDate) return `Sampai ${formatTanggalTable(endDate)}`;
  return 'Semua Tanggal Tersimpan';
};

const escapeHtml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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
          resolve(canvas.toDataURL('image/jpeg', 0.85));
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

const resolveImageSrc = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * PRINT OUT A4 LANDSCAPE (ISOLATED IFRAME) FOR CETAK LAPORAN MAKANAN
 * Covers: Tabel Suhu Pengolahan, Tabel Suhu Masuk Ompreng,
 * Dokumentasi Suhu Pengolahan, and Dokumentasi Masuk Ompreng.
 */
export const printLaporanMakananA4 = async ({
  pengolahanRecords,
  omprengRecords,
  startDate,
  endDate,
  sections = DEFAULT_SECTIONS
}: LaporanMakananExportParams): Promise<void> => {
  const logoDataUrl = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const logoSrc = logoDataUrl || `${window.location.origin}/badan-gizi-nasional-seeklogo.png`;

  const periodeStr = formatPeriodeText(startDate, endDate);
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const kopHtml = `
    <div class="kop">
      <img src="${logoSrc}" alt="Logo Badan Gizi Nasional" />
      <div>
        <h1>BADAN GIZI NASIONAL <span>(NATIONAL NUTRITION AGENCY)</span></h1>
        <p>SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN &bull; YAYASAN HAFSHAWATY ZAINUL HASAN</p>
        <p class="addr">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</p>
      </div>
    </div>`;

  const renderTemperatureTableHtml = (
    title: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>,
    defaultStatus: string
  ) => {
    const bodyRows =
      records.length === 0
        ? `<tr><td colspan="15" class="empty">Tidak ada data pada periode ini.</td></tr>`
        : records
            .map(
              r => `
            <tr>
              <td class="b">${escapeHtml(formatTanggalTable(r.tanggal))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi1?.makananPokok?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi2?.makananPokok?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi3?.makananPokok?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi1?.proteinHewani?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi2?.proteinHewani?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi3?.proteinHewani?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi1?.proteinNabati?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi2?.proteinNabati?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi3?.proteinNabati?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi1?.sayuran?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi2?.sayuran?.suhu))}</td>
              <td>${escapeHtml(formatSuhu(r.sesi3?.sayuran?.suhu))}</td>
              <td>${escapeHtml(r.status || defaultStatus)}</td>
              <td>${escapeHtml(r.petugas || '-')}</td>
            </tr>`
            )
            .join('');

    return `
      <div class="section-block">
        <h3 class="sec-title">${escapeHtml(title)}</h3>
        <table class="suhu-table">
          <thead>
            <tr>
              <th rowspan="2">TANGGAL</th>
              <th colspan="3">MAKANAN POKOK</th>
              <th colspan="3">PROTEIN HEWANI</th>
              <th colspan="3">PROTEIN NABATI</th>
              <th colspan="3">SAYURAN</th>
              <th rowspan="2">STATUS</th>
              <th rowspan="2">PETUGAS</th>
            </tr>
            <tr>
              <th>SESI I</th><th>SESI II</th><th>SESI III</th>
              <th>SESI I</th><th>SESI II</th><th>SESI III</th>
              <th>SESI I</th><th>SESI II</th><th>SESI III</th>
              <th>SESI I</th><th>SESI II</th><th>SESI III</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  };

  const renderPhotoDocHtml = (
    title: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>
  ) => {
    if (records.length === 0) {
      return `
        <div class="section-block page-break">
          <h3 class="sec-title">${escapeHtml(title)}</h3>
          <p class="empty">Tidak ada dokumentasi foto pada periode ini.</p>
        </div>`;
    }

    return records
      .map(
        (rec, idx) => `
        <div class="section-block ${idx === 0 || idx > 0 ? 'page-break' : ''}">
          ${kopHtml}
          <h3 class="sec-title">${escapeHtml(title)}</h3>
          <div class="orange-banner">${escapeHtml(formatTanggalBanner(rec.tanggal))}</div>
          <table class="doc-table">
            <thead>
              <tr>
                <th style="width: 48px;">SESI</th>
                <th>MAKANAN POKOK</th>
                <th>PROTEIN HEWANI</th>
                <th>PROTEIN NABATI</th>
                <th>SAYURAN</th>
              </tr>
            </thead>
            <tbody>
              ${([1, 2, 3] as const)
                .map((sNum) => {
                  const sKey = `sesi${sNum}` as 'sesi1' | 'sesi2' | 'sesi3';
                  const sData = rec[sKey];
                  const cats = ['makananPokok', 'proteinHewani', 'proteinNabati', 'sayuran'] as const;
                  const cells = cats
                    .map((cat) => {
                      const item = sData?.[cat];
                      const suhuText = formatSuhu(item?.suhu);
                      if (item?.fotoUrl) {
                        return `
                          <td>
                            <div class="photo-wrap">
                              <img src="${resolveImageSrc(item.fotoUrl)}" alt="${cat}" />
                              <div class="cap">${suhuText !== '-' ? `${suhuText} &deg;C` : '-'}</div>
                            </div>
                          </td>`;
                      }
                      return `<td><div class="no-photo">Foto belum diunggah${suhuText !== '-' ? `<br/>(${suhuText} &deg;C)` : ''}</div></td>`;
                    })
                    .join('');
                  return `<tr><td class="b sesi-col">${sNum}</td>${cells}</tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>`
      )
      .join('');
  };

  const tableBlocks: string[] = [];
  if (sections.tabelPengolahan) {
    tableBlocks.push(
      renderTemperatureTableHtml(
        '1. TABEL DATA SUHU PENGOLAHAN MAKANAN (CCP - COOKING)',
        pengolahanRecords,
        'Sesuai Standar'
      )
    );
  }
  if (sections.tabelOmpreng) {
    tableBlocks.push(
      renderTemperatureTableHtml(
        '2. TABEL DATA SUHU MAKANAN MASUK OMPRENG',
        omprengRecords,
        'Sesuai Standar (≥ 60°C)'
      )
    );
  }

  const docBlocks: string[] = [];
  if (sections.dokPengolahan) {
    docBlocks.push(
      renderPhotoDocHtml('3. DOKUMENTASI SUHU PENGOLAHAN BAHAN PANGAN', pengolahanRecords)
    );
  }
  if (sections.dokOmpreng) {
    docBlocks.push(
      renderPhotoDocHtml('4. DOKUMENTASI SUHU MASUK OMPRENG BAHAN PANGAN', omprengRecords)
    );
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Monitoring Suhu Makanan - ${escapeHtml(periodeStr)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.25; }
    .page-break { page-break-before: always; }
    .kop { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .kop img { width: 46px; height: 46px; object-fit: contain; }
    .kop h1 { margin: 0; font-size: 12pt; font-weight: 700; text-transform: uppercase; }
    .kop h1 span { font-style: italic; font-weight: 600; }
    .kop p { margin: 1px 0 0 0; font-size: 8.5pt; font-weight: 600; }
    .kop .addr { font-size: 8pt; font-weight: 400; }
    .main-title { text-align: center; font-size: 11.5pt; font-weight: 700; text-transform: uppercase; margin: 6px 0 4px 0; }
    .meta { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 10px; border-bottom: 1px dashed #999; padding-bottom: 4px; }
    .section-block { margin-bottom: 14px; }
    .sec-title { margin: 0 0 6px 0; font-size: 10pt; font-weight: 700; text-transform: uppercase; }
    .suhu-table, .doc-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 8.5pt; }
    .suhu-table th, .suhu-table td, .doc-table th, .doc-table td { border: 1px solid #000; padding: 4px 5px; vertical-align: middle; }
    .suhu-table thead th { background: #D9E8F5; font-weight: 700; font-size: 8pt; }
    .doc-table thead th { background: #ffffff; font-weight: 700; font-size: 8.5pt; }
    .orange-banner { border: 1px solid #000; border-bottom: none; background: #F8AD7B; text-align: center; font-weight: 700; font-size: 9.5pt; padding: 4px 6px; text-transform: uppercase; }
    .photo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
    .photo-wrap img { max-height: 112px; max-width: 100%; object-fit: contain; display: block; }
    .cap { font-size: 8pt; font-weight: 700; }
    .no-photo { font-size: 8pt; color: #666; font-style: italic; padding: 24px 4px; }
    .sesi-col { font-size: 11pt; }
    .b { font-weight: 700; }
    .empty { padding: 14px; font-style: italic; color: #555; text-align: center; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 18px; page-break-inside: avoid; font-size: 9.5pt; }
    .sig-space { height: 46px; }
    .sig-name { font-weight: 700; margin: 0; }
  </style>
</head>
<body>
  ${kopHtml}
  <h2 class="main-title">LAPORAN MONITORING SUHU PENGOLAHAN &amp; MASUK OMPRENG MAKANAN</h2>
  <div class="meta">
    <div><strong>Periode Data:</strong> ${escapeHtml(periodeStr)}</div>
    <div><strong>Dicetak:</strong> ${escapeHtml(printDate)}</div>
  </div>
  ${tableBlocks.join('')}
  ${docBlocks.join('')}
  <div class="sigs">
    <div>
      <div>Petugas Pengawas / Ahli Gizi,</div>
      <div class="sig-space"></div>
      <p class="sig-name">Fitria, S.ST</p>
    </div>
    <div>
      <div>Mengetahui, Kepala SPPG</div>
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
    }, 3500);
  }, 450);
};

/**
 * EXPORT PDF A4 LANDSCAPE FOR CETAK LAPORAN MAKANAN
 * Includes all selected sections: tables + embedded documentation photos.
 */
export const exportLaporanMakananToPdf = async ({
  pengolahanRecords,
  omprengRecords,
  startDate,
  endDate,
  sections = DEFAULT_SECTIONS
}: LaporanMakananExportParams): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const periodeStr = formatPeriodeText(startDate, endDate);
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const drawKopHeader = () => {
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 12, 7, 14, 14);
      } catch {
        // Ignore logo error
      }
    }
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', 30, 11);
    doc.setFontSize(9.5);
    doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN  •  YAYASAN HAFSHAWATY ZAINUL HASAN', 30, 15.2);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', 30, 19);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(12, 22, 285, 22);
  };

  drawKopHeader();
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN MONITORING SUHU PENGOLAHAN & MASUK OMPRENG MAKANAN', 148.5, 27.5, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Periode Data : ${periodeStr}`, 12, 32.5);
  doc.text(`Dicetak : ${printDate}`, 285, 32.5, { align: 'right' });

  let currentY = 37;

  const drawTemperatureTable = (
    title: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>,
    defaultStatus: string
  ) => {
    if (currentY > 155) {
      doc.addPage('a4', 'landscape');
      drawKopHeader();
      currentY = 28;
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 12, currentY);
    currentY += 2;

    const head = [
      [
        { content: 'TANGGAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'MAKANAN POKOK', colSpan: 3, styles: { halign: 'center' } },
        { content: 'PROTEIN HEWANI', colSpan: 3, styles: { halign: 'center' } },
        { content: 'PROTEIN NABATI', colSpan: 3, styles: { halign: 'center' } },
        { content: 'SAYURAN', colSpan: 3, styles: { halign: 'center' } },
        { content: 'STATUS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'PETUGAS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        'SESI I', 'SESI II', 'SESI III',
        'SESI I', 'SESI II', 'SESI III',
        'SESI I', 'SESI II', 'SESI III',
        'SESI I', 'SESI II', 'SESI III'
      ]
    ];

    const body =
      records.length === 0
        ? [[{ content: 'Tidak ada data pada periode ini.', colSpan: 15, styles: { halign: 'center', fontStyle: 'italic' } }]]
        : records.map((r) => [
            formatTanggalTable(r.tanggal),
            formatSuhu(r.sesi1?.makananPokok?.suhu),
            formatSuhu(r.sesi2?.makananPokok?.suhu),
            formatSuhu(r.sesi3?.makananPokok?.suhu),
            formatSuhu(r.sesi1?.proteinHewani?.suhu),
            formatSuhu(r.sesi2?.proteinHewani?.suhu),
            formatSuhu(r.sesi3?.proteinHewani?.suhu),
            formatSuhu(r.sesi1?.proteinNabati?.suhu),
            formatSuhu(r.sesi2?.proteinNabati?.suhu),
            formatSuhu(r.sesi3?.proteinNabati?.suhu),
            formatSuhu(r.sesi1?.sayuran?.suhu),
            formatSuhu(r.sesi2?.sayuran?.suhu),
            formatSuhu(r.sesi3?.sayuran?.suhu),
            r.status || defaultStatus,
            r.petugas || '-'
          ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 12, right: 12 },
      theme: 'grid',
      head: head as any,
      body: body as any,
      styles: {
        font: 'times',
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1.5
      },
      headStyles: {
        font: 'times',
        fillColor: [217, 232, 245],
        textColor: [0, 0, 0],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 21, fontStyle: 'bold' },
        13: { cellWidth: 32 },
        14: { cellWidth: 28 }
      }
    });

    currentY = ((doc as any).lastAutoTable?.finalY || currentY + 25) + 8;
  };

  if (sections.tabelPengolahan) {
    drawTemperatureTable(
      '1. TABEL DATA SUHU PENGOLAHAN MAKANAN (CCP - COOKING)',
      pengolahanRecords,
      'Sesuai Standar'
    );
  }

  if (sections.tabelOmpreng) {
    drawTemperatureTable(
      '2. TABEL DATA SUHU MAKANAN MASUK OMPRENG',
      omprengRecords,
      'Sesuai Standar (≥ 60°C)'
    );
  }

  // Preload all unique photos into base64 cache for fast synchronous embedding in autoTable
  const photoCache = new Map<string, string>();
  const collectPhotos = async (records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>) => {
    const urls = new Set<string>();
    records.forEach((rec) => {
      (['sesi1', 'sesi2', 'sesi3'] as const).forEach((sKey) => {
        (['makananPokok', 'proteinHewani', 'proteinNabati', 'sayuran'] as const).forEach((cat) => {
          const u = rec[sKey]?.[cat]?.fotoUrl;
          if (u) urls.add(u);
        });
      });
    });
    await Promise.all(
      Array.from(urls).map(async (u) => {
        const b64 = await loadImageAsBase64(u);
        if (b64) photoCache.set(u, b64);
      })
    );
  };

  if (sections.dokPengolahan) await collectPhotos(pengolahanRecords);
  if (sections.dokOmpreng) await collectPhotos(omprengRecords);

  const drawPhotoSection = (
    sectionTitle: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>
  ) => {
    if (records.length === 0) {
      doc.addPage('a4', 'landscape');
      drawKopHeader();
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text(sectionTitle, 12, 28);
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.text('Tidak ada dokumentasi foto pada periode ini.', 12, 35);
      return;
    }

    records.forEach((rec) => {
      doc.addPage('a4', 'landscape');
      drawKopHeader();

      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(sectionTitle, 148.5, 27.5, { align: 'center' });

      // Orange date banner (#F8AD7B)
      doc.setFillColor(248, 173, 123);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(12, 30, 273, 7, 'FD');
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.text(formatTanggalBanner(rec.tanggal), 148.5, 34.8, { align: 'center' });

      const catKeys = ['makananPokok', 'proteinHewani', 'proteinNabati', 'sayuran'] as const;
      const cellImages: Record<string, { b64?: string; suhu: string }> = {};

      const docBody = ([1, 2, 3] as const).map((sNum) => {
        const sKey = `sesi${sNum}` as 'sesi1' | 'sesi2' | 'sesi3';
        const rowIndex = sNum - 1;
        const cells = catKeys.map((cat, cIdx) => {
          const item = rec[sKey]?.[cat];
          const b64 = item?.fotoUrl ? photoCache.get(item.fotoUrl) : undefined;
          const suhu = formatSuhu(item?.suhu);
          cellImages[`${rowIndex}_${cIdx + 1}`] = { b64, suhu };
          return b64 ? '' : 'Foto belum diunggah';
        });
        return [String(sNum), ...cells];
      });

      autoTable(doc, {
        startY: 37,
        margin: { left: 12, right: 12 },
        theme: 'grid',
        head: [['SESI', 'MAKANAN POKOK', 'PROTEIN HEWANI', 'PROTEIN NABATI', 'SAYURAN']],
        body: docBody,
        styles: {
          font: 'times',
          fontSize: 8.5,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          font: 'times',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        bodyStyles: {
          minCellHeight: 44
        },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold', fontSize: 10 },
          1: { cellWidth: 64.25 },
          2: { cellWidth: 64.25 },
          3: { cellWidth: 64.25 },
          4: { cellWidth: 64.25 }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index > 0) {
            const meta = cellImages[`${data.row.index}_${data.column.index}`];
            if (meta?.b64) {
              const pad = 2;
              const maxW = data.cell.width - pad * 2;
              const maxH = data.cell.height - 7;
              const imgW = Math.min(maxW, 46);
              const imgH = Math.min(maxH, 34);
              const x = data.cell.x + (data.cell.width - imgW) / 2;
              const y = data.cell.y + 1.8;
              try {
                doc.addImage(meta.b64, 'JPEG', x, y, imgW, imgH);
              } catch {
                // Ignore image draw failure
              }
              if (meta.suhu !== '-') {
                doc.setFont('times', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(0, 0, 0);
                doc.text(
                  `${meta.suhu} °C`,
                  data.cell.x + data.cell.width / 2,
                  data.cell.y + data.cell.height - 1.5,
                  { align: 'center' }
                );
              }
            }
          }
        }
      });

      currentY = ((doc as any).lastAutoTable?.finalY || 180) + 6;
    });
  };

  if (sections.dokPengolahan) {
    drawPhotoSection('3. DOKUMENTASI SUHU PENGOLAHAN BAHAN PANGAN', pengolahanRecords);
  }

  if (sections.dokOmpreng) {
    drawPhotoSection('4. DOKUMENTASI SUHU MASUK OMPRENG BAHAN PANGAN', omprengRecords);
  }

  // Final Signature Block
  let sigY = Math.max(currentY + 4, 175);
  if (sigY > 176) {
    doc.addPage('a4', 'landscape');
    drawKopHeader();
    sigY = 34;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Petugas Pengawas / Ahli Gizi,', 65, sigY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Fitria, S.ST', 65, sigY + 18, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.text('Mengetahui, Kepala SPPG', 230, sigY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Sri Rohayu, S.Pd', 230, sigY + 18, { align: 'center' });

  const suffix =
    startDate && endDate
      ? startDate === endDate
        ? `_${startDate}`
        : `_${startDate}_sd_${endDate}`
      : startDate
      ? `_mulai_${startDate}`
      : endDate
      ? `_sd_${endDate}`
      : `_${new Date().toISOString().split('T')[0]}`;

  doc.save(`Laporan_Suhu_Makanan_SPPG${suffix}.pdf`);
};
