import jsPDF from 'jspdf';
import { terbilang } from './akuntanDocGenerator';

export interface SlipGajiRelawanData {
  nomorUrut: number | string;
  digitLength?: number;
  kodeJenis: string;
  kodeInstansi: string;
  tanggalCetak: string;
  startDate: string;
  endDate: string;
  nama: string;
  jabatan: string;
  totalKehadiran: number;
  gajiHarian: number;
  totalGaji: number;
  namaBank?: string;
  nomorRekening?: string;
  pengawasKeuangan: string;
  kepalaSppg: string;
}

const ROMAN_MONTHS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII'
];

const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseIsoDateParts(dateStr: string): { year: number; month: number; day: number } {
  const match = String(dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  };
}

export function getRomanMonthFromDate(dateStr: string): string {
  const { month } = parseIsoDateParts(dateStr);
  return ROMAN_MONTHS[Math.max(0, Math.min(11, month - 1))] || 'XI';
}

export function getYearFromDate(dateStr: string): string {
  const { year } = parseIsoDateParts(dateStr);
  return String(year);
}

export function formatTanggalIndoLong(dateStr: string): string {
  const { year, month, day } = parseIsoDateParts(dateStr);
  const monthName = INDO_MONTHS[Math.max(0, Math.min(11, month - 1))] || '';
  return `${day} ${monthName} ${year}`;
}

export function padNomorUrutSurat(nomorUrut: number | string, digitLength: number = 3): string {
  const safeDigits = Math.max(1, Math.min(6, Math.round(Number(digitLength) || 3)));
  const raw = String(nomorUrut ?? '').trim();
  if (!raw) return '67'.padStart(safeDigits, '0');
  if (/^\d+$/.test(raw)) {
    const num = parseInt(raw, 10);
    const normalized = Number.isFinite(num) && num >= 0 ? String(num) : raw;
    return normalized.length >= safeDigits ? normalized : normalized.padStart(safeDigits, '0');
  }
  return raw;
}

export function formatNomorSlipGaji(
  nomorUrut: number | string,
  kodeJenis: string = 'SLIP.GAJI',
  kodeInstansi: string = 'SPPG-TMG',
  tanggalStr: string,
  digitLength: number = 3
): string {
  const paddedSeq = padNomorUrutSurat(nomorUrut, digitLength);
  const cleanJenis = String(kodeJenis || 'SLIP.GAJI').trim().toUpperCase() || 'SLIP.GAJI';
  const cleanInstansi = String(kodeInstansi || 'SPPG-TMG').trim().toUpperCase() || 'SPPG-TMG';
  const romanMonth = getRomanMonthFromDate(tanggalStr);
  const yearStr = getYearFromDate(tanggalStr);
  return `${paddedSeq}/${cleanJenis}/${cleanInstansi}/${romanMonth}/${yearStr}`;
}

export function formatTerbilangRupiah(amount: number): string {
  const rounded = Math.round(Math.max(0, Number(amount || 0)));
  if (rounded === 0) return 'Nol Rupiah';
  const words = terbilang(rounded).replace(/\s+/g, ' ').trim();
  return words ? `${words} Rupiah` : 'Nol Rupiah';
}

export function formatAngkaKehadiran(val: number): string {
  const num = Number(val || 0);
  if (Number.isInteger(num)) return String(num);
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export const SLIP_GAJI_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 14mm 18mm 14mm 18mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.4;
  }
  .slip-sheet {
    width: 100%;
    max-width: 174mm;
    margin: 0 auto;
    color: #000000;
    font-family: 'Times New Roman', Times, serif;
    page-break-after: always;
    break-after: page;
  }
  .slip-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .kop-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
  }
  .kop-logo-cell {
    width: 72px;
    vertical-align: middle;
    padding: 2px 10px 4px 2px;
  }
  .kop-logo {
    width: 62px;
    height: 62px;
    object-fit: contain;
    display: block;
  }
  .kop-text-cell {
    vertical-align: middle;
    text-align: left;
    padding-bottom: 4px;
  }
  .kop-agency {
    font-size: 13pt;
    font-weight: bold;
    color: #1b365d;
    letter-spacing: 0.2px;
    line-height: 1.2;
    margin: 0;
  }
  .kop-unit {
    font-size: 11.5pt;
    font-weight: normal;
    color: #1b365d;
    line-height: 1.22;
    margin: 1px 0 0 0;
  }
  .kop-yayasan {
    font-size: 11pt;
    font-weight: normal;
    color: #1b365d;
    line-height: 1.22;
    margin: 1px 0 0 0;
  }
  .kop-address {
    font-size: 9pt;
    font-weight: normal;
    color: #111827;
    line-height: 1.25;
    margin: 2px 0 0 0;
  }
  .kop-rule-top {
    border-top: 3px solid #222222;
    border-bottom: 1px solid #222222;
    height: 5px;
    margin-bottom: 18px;
  }
  .doc-title {
    text-align: center;
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
    margin: 0;
    line-height: 1.3;
  }
  .doc-nomor {
    text-align: center;
    font-size: 10.5pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 8px 0 22px 0;
    line-height: 1.3;
  }
  .doc-intro {
    text-align: justify;
    font-size: 10.5pt;
    line-height: 1.45;
    margin: 0 0 22px 0;
  }
  .detail-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 36px;
    font-size: 10.5pt;
  }
  .detail-table td {
    padding: 2.5px 0;
    vertical-align: top;
    line-height: 1.4;
  }
  .detail-label {
    width: 185px;
  }
  .detail-colon {
    width: 14px;
    text-align: center;
  }
  .detail-value {
    width: auto;
  }
  .terbilang-text {
    font-style: italic;
  }
  .sig-top-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
    margin-top: 8px;
  }
  .sig-col-left {
    width: 58%;
    vertical-align: top;
    text-align: left;
  }
  .sig-col-right {
    width: 42%;
    vertical-align: top;
    text-align: left;
  }
  .sig-space {
    height: 62px;
  }
  .sig-name {
    font-weight: bold;
  }
  .sig-center-block {
    margin-top: 14px;
    text-align: center;
    font-size: 10.5pt;
  }
  .bottom-rule {
    border-top: 3px solid #222222;
    margin-top: 52px;
  }
`;

export function renderSlipGajiSheet(data: SlipGajiRelawanData): string {
  const nomorLengkap = formatNomorSlipGaji(
    data.nomorUrut,
    data.kodeJenis,
    data.kodeInstansi,
    data.tanggalCetak,
    data.digitLength
  );
  const startIndo = formatTanggalIndoLong(data.startDate);
  const endIndo = formatTanggalIndoLong(data.endDate);
  const cetakIndo = formatTanggalIndoLong(data.tanggalCetak);
  const totalKehadiranFormatted = formatAngkaKehadiran(data.totalKehadiran);
  const totalGajiFormatted = Math.round(Math.max(0, Number(data.totalGaji || 0))).toLocaleString('id-ID');
  const terbilangText = formatTerbilangRupiah(data.totalGaji);
  const namaBankText = String(data.namaBank ?? '').trim() || '-';
  const nomorRekeningText = String(data.nomorRekening ?? '').trim() || '-';

  return `
    <div class="slip-sheet">
      <table class="kop-table">
        <tr>
          <td class="kop-logo-cell">
            <img class="kop-logo" src="/badan-gizi-nasional-seeklogo.png" alt="Logo Badan Gizi Nasional" />
          </td>
          <td class="kop-text-cell">
            <div class="kop-agency">BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)</div>
            <div class="kop-unit">SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN</div>
            <div class="kop-yayasan">YAYASAN HAFSHAWATY ZAINUL HASAN</div>
            <div class="kop-address">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</div>
          </td>
        </tr>
      </table>
      <div class="kop-rule-top"></div>

      <div class="doc-title">TANDA TERIMA UPAH RELAWAN</div>
      <div class="doc-nomor">NOMOR : ${escapeHtml(nomorLengkap)}</div>

      <p class="doc-intro">
        Bersama ini kami lampirkan slip gaji Periode ${escapeHtml(startIndo)} s/d ${escapeHtml(endIndo)} atas nama relawan yang bersangkutan sebagai bukti pembayaran gaji sesuai dengan periode diatas. Upah telah ditransfer/dikirimkan secara harian selama periode diatas, dan tanda terima ini ditandatangani sebagai bukti konfirmasi penerimaan total upah untuk periode tersebut. Slip ini memuat informasi mengenai pendapatan total gaji yang diterima.
      </p>

      <table class="detail-table">
        <tr>
          <td class="detail-label">Nama</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(data.nama)}</td>
        </tr>
        <tr>
          <td class="detail-label">Jabatan</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(data.jabatan)}</td>
        </tr>
        <tr>
          <td class="detail-label">Total Kehadiran</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(totalKehadiranFormatted)}</td>
        </tr>
        <tr>
          <td class="detail-label">Total gaji yang diterima</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(totalGajiFormatted)}</td>
        </tr>
        <tr>
          <td class="detail-label">Terbilang</td>
          <td class="detail-colon">:</td>
          <td class="detail-value"><span class="terbilang-text">${escapeHtml(terbilangText)}</span></td>
        </tr>
        <tr>
          <td class="detail-label">Nama Bank</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(namaBankText)}</td>
        </tr>
        <tr>
          <td class="detail-label">No Rekening</td>
          <td class="detail-colon">:</td>
          <td class="detail-value">${escapeHtml(nomorRekeningText)}</td>
        </tr>
      </table>

      <table class="sig-top-table">
        <tr>
          <td class="sig-col-left">
            <div>&nbsp;</div>
            <div>Penerima</div>
            <div class="sig-space"></div>
            <div class="sig-name">${escapeHtml(data.nama)}</div>
          </td>
          <td class="sig-col-right">
            <div>Probolinggo, ${escapeHtml(cetakIndo)}</div>
            <div>Pengawas Keuangan</div>
            <div class="sig-space"></div>
            <div class="sig-name">${escapeHtml(data.pengawasKeuangan)}</div>
          </td>
        </tr>
      </table>

      <div class="sig-center-block">
        <div>Mengetahui,</div>
        <div>Ka. SPPG</div>
        <div class="sig-space"></div>
        <div class="sig-name">${escapeHtml(data.kepalaSppg)}</div>
      </div>

      <div class="bottom-rule"></div>
    </div>
  `;
}

export function generateSlipGajiPrintHtml(items: SlipGajiRelawanData[]): string {
  const sheets = items.map(renderSlipGajiSheet).join('\n');
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Tanda Terima Upah Relawan - Slip Gaji SPPG</title>
  <style>
    ${SLIP_GAJI_PRINT_CSS}
  </style>
</head>
<body>
  ${sheets}
</body>
</html>`;
}

function waitForIframeImagesAndPrint(iframe: HTMLIFrameElement, fallbackMs: number = 2200): void {
  const win = iframe.contentWindow;
  const doc = win?.document;
  const triggerPrint = () => {
    try {
      win?.focus();
      win?.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      try {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch {
        // ignore cleanup error
      }
    }, 1500);
  };

  if (!doc) {
    setTimeout(triggerPrint, 250);
    return;
  }

  const imgs = Array.from(doc.querySelectorAll('img'));
  if (imgs.length === 0) {
    setTimeout(triggerPrint, 250);
    return;
  }

  let printed = false;
  const printOnce = () => {
    if (printed) return;
    printed = true;
    setTimeout(triggerPrint, 120);
  };

  const pending = imgs.map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      })
  );

  Promise.race([
    Promise.all(pending),
    new Promise<void>((resolve) => setTimeout(resolve, fallbackMs))
  ]).then(printOnce);
}

export function printSlipGajiDirectly(item: SlipGajiRelawanData): void {
  printAllSlipGajiDirectly([item]);
}

export function printAllSlipGajiDirectly(items: SlipGajiRelawanData[]): void {
  if (!items || items.length === 0) return;

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

  const html = generateSlipGajiPrintHtml(items);
  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  waitForIframeImagesAndPrint(iframe, Math.min(3500, 1500 + items.length * 40));
}

async function loadLogoPngDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/badan-gizi-nasional-seeklogo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawSlipGajiPdfPage(
  doc: jsPDF,
  data: SlipGajiRelawanData,
  logoDataUrl: string | null
): void {
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm
  const centerX = pageWidth / 2;

  // Kop Surat Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginX, 14, 17, 17);
    } catch {
      // skip if image decode failed
    }
  }

  const textX = marginX + 21;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(27, 54, 93);
  doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', textX, 18.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(11.5);
  doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN', textX, 23.5);

  doc.setFontSize(11);
  doc.text('YAYASAN HAFSHAWATY ZAINUL HASAN', textX, 28);

  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(
    'Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo',
    textX,
    32.2
  );

  // Kop Double Rule
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.9);
  doc.line(marginX, 34.8, pageWidth - marginX, 34.8);
  doc.setLineWidth(0.3);
  doc.line(marginX, 36.1, pageWidth - marginX, 36.1);

  // Title & Letter Number
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  const titleText = 'TANDA TERIMA UPAH RELAWAN';
  doc.text(titleText, centerX, 46, { align: 'center' });
  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.35);
  doc.line(centerX - titleWidth / 2, 46.8, centerX + titleWidth / 2, 46.8);

  const nomorLengkap = formatNomorSlipGaji(
    data.nomorUrut,
    data.kodeJenis,
    data.kodeInstansi,
    data.tanggalCetak,
    data.digitLength
  );
  doc.setFontSize(10.5);
  doc.text(`NOMOR : ${nomorLengkap}`, centerX, 53.5, { align: 'center' });

  // Intro Paragraph
  const startIndo = formatTanggalIndoLong(data.startDate);
  const endIndo = formatTanggalIndoLong(data.endDate);
  const introText = `Bersama ini kami lampirkan slip gaji Periode ${startIndo} s/d ${endIndo} atas nama relawan yang bersangkutan sebagai bukti pembayaran gaji sesuai dengan periode diatas. Upah telah ditransfer/dikirimkan secara harian selama periode diatas, dan tanda terima ini ditandatangani sebagai bukti konfirmasi penerimaan total upah untuk periode tersebut. Slip ini memuat informasi mengenai pendapatan total gaji yang diterima.`;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginX, 65, { align: 'left', maxWidth: contentWidth });

  // Detail Block
  let y = 65 + introLines.length * 5.2 + 7;
  const colonX = marginX + 49;
  const valX = marginX + 53;

  const totalKehadiranFormatted = formatAngkaKehadiran(data.totalKehadiran);
  const totalGajiFormatted = Math.round(Math.max(0, Number(data.totalGaji || 0))).toLocaleString('id-ID');
  const terbilangText = formatTerbilangRupiah(data.totalGaji);
  const namaBankText = String(data.namaBank ?? '').trim() || '-';
  const nomorRekeningText = String(data.nomorRekening ?? '').trim() || '-';

  const detailRows: Array<{ label: string; value: string; italic?: boolean }> = [
    { label: 'Nama', value: data.nama },
    { label: 'Jabatan', value: data.jabatan },
    { label: 'Total Kehadiran', value: totalKehadiranFormatted },
    { label: 'Total gaji yang diterima', value: totalGajiFormatted },
    { label: 'Terbilang', value: terbilangText, italic: true },
    { label: 'Nama Bank', value: namaBankText },
    { label: 'No Rekening', value: nomorRekeningText }
  ];

  for (const row of detailRows) {
    doc.setFont('times', 'normal');
    doc.text(row.label, marginX, y);
    doc.text(':', colonX, y);
    if (row.italic) {
      doc.setFont('times', 'italic');
      const wrapped = doc.splitTextToSize(row.value, contentWidth - 53);
      doc.text(wrapped, valX, y);
      y += Math.max(1, wrapped.length) * 5.5;
    } else {
      doc.setFont('times', 'normal');
      doc.text(row.value, valX, y);
      y += 5.5;
    }
  }

  // Signatures
  const sigStartY = Math.max(y + 12, 126);
  const rightColX = marginX + 100;
  const cetakIndo = formatTanggalIndoLong(data.tanggalCetak);

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('Penerima', marginX, sigStartY + 5);
  doc.text(`Probolinggo, ${cetakIndo}`, rightColX, sigStartY);
  doc.text('Pengawas Keuangan', rightColX, sigStartY + 5);

  const sigNameY = sigStartY + 26;
  doc.setFont('times', 'bold');
  doc.text(data.nama, marginX, sigNameY);
  doc.text(data.pengawasKeuangan, rightColX, sigNameY);

  // Center Ka. SPPG
  const mengetahuiY = sigNameY + 11;
  doc.setFont('times', 'normal');
  doc.text('Mengetahui,', centerX, mengetahuiY, { align: 'center' });
  doc.text('Ka. SPPG', centerX, mengetahuiY + 5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text(data.kepalaSppg, centerX, mengetahuiY + 26, { align: 'center' });

  // Bottom thick rule
  const bottomRuleY = mengetahuiY + 42;
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.9);
  doc.line(marginX, bottomRuleY, pageWidth - marginX, bottomRuleY);
}

export async function downloadSlipGajiOfficialPdf(item: SlipGajiRelawanData): Promise<void> {
  await downloadAllSlipGajiOfficialPdf([item]);
}

export async function downloadAllSlipGajiOfficialPdf(items: SlipGajiRelawanData[]): Promise<void> {
  if (!items || items.length === 0) return;

  const logoDataUrl = await loadLogoPngDataUrl();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  items.forEach((item, index) => {
    if (index > 0) doc.addPage();
    drawSlipGajiPdfPage(doc, item, logoDataUrl);
  });

  const fileName =
    items.length === 1
      ? `Slip_Gaji_${items[0].nama.replace(/[^a-zA-Z0-9]+/g, '_')}_${items[0].startDate}_sd_${items[0].endDate}.pdf`
      : `Slip_Gaji_Semua_Relawan_${items[0].startDate}_sd_${items[0].endDate}.pdf`;

  doc.save(fileName);
}
