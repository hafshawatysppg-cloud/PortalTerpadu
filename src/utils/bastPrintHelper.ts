import { BastDocument } from '../types';

/**
 * Returns raw SVG markup string for Sri Rohayu, S.Pd.'s signature
 */
export function getSriRohayuSignatureSvg(): string {
  return `
    <svg viewBox="0 0 160 65" style="height: 48px; width: auto; display: block;" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 46 C27 40, 20 26, 25 12 C28 3, 37 5, 41 15 C44 24, 42 36, 40 50 C39 56, 41 58, 45 52 C49 46, 53 34, 56 24 C58 18, 61 18, 62 25 C63 33, 61 46, 64 50 C66 53, 70 43, 74 34 C77 26, 82 24, 84 31 C86 38, 84 48, 88 51 C91 53, 95 44, 99 36 C103 28, 108 28, 111 34 C114 40, 113 48, 117 50 C121 52, 127 42, 133 33 C137 27, 141 30, 140 36 C139 44, 133 52, 125 56 C117 60, 101 61, 84 62 C64 63, 44 62, 24 61 C17 61, 13 60, 11 60"
        stroke="#134e4a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M37 17 C48 19, 68 20, 88 19 M76 11 C75 21, 74 33, 74 44"
        stroke="#134e4a"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M100 17 C106 13, 116 11, 120 17 C122 21, 118 29, 114 36"
        stroke="#134e4a"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;
}

/**
 * Generates an isolated, pristine HTML document for direct browser printing.
 * Guarantees zero blank pages, perfect A4 margins, and generous signature spacing.
 */
export function generateBastPrintHtml(bast: BastDocument, showSignature: boolean = true): string {
  const cleanDate = bast.hariTanggalFormatted.includes(',')
    ? bast.hariTanggalFormatted.split(',')[1].trim()
    : bast.hariTanggalFormatted;

  const cleanWaktu = bast.waktuPenerimaan
    ? bast.waktuPenerimaan.replace(/^Jam\s*/i, '').trim()
    : '…………… WIB';

  const signatureSvg = showSignature
    ? getSriRohayuSignatureSvg()
    : '<div style="height: 48px;"></div>';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>BAST - ${bast.namaSekolah} (${bast.nomorBast})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 12mm 8mm 12mm;
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
      font-size: 10.5pt;
      line-height: 1.25;
    }
    .sheet {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }
    .section {
      margin-bottom: 14px;
    }
    .header-box {
      position: relative;
      min-height: 54px;
      text-align: center;
      margin-bottom: 6px;
    }
    .header-logo {
      position: absolute;
      left: 0;
      top: 0;
      width: 52px;
      height: 52px;
      object-fit: contain;
    }
    .header-title-1 {
      font-size: 12.5pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.2;
    }
    .header-title-2 {
      font-size: 11.5pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 2px 0 0 0;
      line-height: 1.2;
    }
    .header-nomor {
      font-size: 10.5pt;
      margin: 2px 0 0 0;
    }
    .narrative-p {
      text-align: justify;
      margin: 6px 0 8px 0;
      line-height: 1.35;
      font-size: 10.5pt;
    }
    .row-info {
      display: flex;
      align-items: baseline;
      margin-bottom: 2px;
      font-size: 10.5pt;
    }
    .col-label-1 {
      width: 155px;
      flex-shrink: 0;
    }
    .col-label-2 {
      width: 250px;
      flex-shrink: 0;
    }
    .col-label-3 {
      width: 135px;
      flex-shrink: 0;
    }
    .signature-space {
      height: 65px;
    }
    .signature-name {
      font-weight: bold;
    }
    .signature-line {
      width: 220px;
      border-bottom: 1px solid #000000;
      margin-top: 3px;
    }
    .signatures-bottom-grid {
      display: table;
      width: 100%;
      margin-top: 4px;
    }
    .grid-cell-left {
      display: table-cell;
      width: 65%;
      vertical-align: top;
      padding-right: 12px;
    }
    .grid-cell-right {
      display: table-cell;
      width: 35%;
      vertical-align: top;
    }
    .mengetahui-box {
      border: 1px solid #000000;
      padding: 8px 10px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 9.5pt;
    }
    .mengetahui-title {
      font-size: 10pt;
      margin-bottom: 2px;
    }
    .mengetahui-name {
      font-size: 10pt;
      font-weight: bold;
      text-decoration: underline;
      line-height: 1.2;
    }
    .mengetahui-job {
      font-size: 9pt;
      line-height: 1.2;
    }
    .section-gap {
      height: 12px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- ========================================================= -->
    <!-- BAGIAN A: BERITA ACARA PENERIMAAN PAKET MAKANAN         -->
    <!-- ========================================================= -->
    <div class="section">
      <div class="header-box">
        <img src="/badan_gizi_logo.jpg" alt="Logo Badan Gizi" class="header-logo" onerror="this.style.display='none'" />
        <div class="header-title-1">BERITA ACARA PENERIMAAN PAKET MAKANAN</div>
        <div class="header-title-2">PROGRAM MAKAN BERGIZI</div>
        <div class="header-nomor">Nomor: ${bast.nomorBast}</div>
      </div>

      <div class="narrative-p">
        Pada Hari <strong>${bast.hari}</strong> Tanggal <strong>${cleanDate}</strong> Jam <strong>${cleanWaktu}</strong> Telah Diterima Paket Makanan Bergizi Gratis (MBG) Sejumlah : <strong>${bast.jumlahPaketMakanan}</strong> dalam keadaan baik dan layak dikonsumsi dari ${bast.namaSppg}.
      </div>

      <!-- Yang Menyerahkan (Atas) -->
      <div>
        <div class="row-info">
          <div class="col-label-1">Yang Menyerahkan</div>
          <div>: <strong>${bast.namaTimDistribusi}</strong></div>
        </div>
        <div class="row-info">
          <div class="col-label-1">Nomor Telpon</div>
          <div>: <strong>${bast.telponPetugasDistribusi || '085212581665'}</strong></div>
        </div>
        <!-- Generous signature space -->
        <div class="signature-space"></div>
        <div class="signature-name">(${bast.namaPetugasDistribusi || 'Abdus Salam'} )</div>
        <div class="signature-line"></div>
      </div>

      <!-- Grid Bawah: Kiri Diterima Lembaga, Kanan Mengetahui -->
      <div class="signatures-bottom-grid">
        <div class="grid-cell-left">
          <div class="row-info">
            <div class="col-label-1"><strong>Diterima Oleh Lembaga:</strong></div>
            <div><strong style="text-transform: uppercase;">${bast.namaSekolah}</strong></div>
          </div>
          <div class="row-info">
            <div class="col-label-1">PIC</div>
            <div>: ${bast.namaPic || 'Lulut Biyadillah'}</div>
          </div>
          <div class="row-info">
            <div class="col-label-1">Nomor Telpon</div>
            <div>: ${bast.telponPic || '085234834095'}</div>
          </div>
          <!-- Generous signature space -->
          <div class="signature-space"></div>
          <div class="signature-name">( ${bast.namaPic || 'Lulut Biyadillah'} )</div>
          <div class="signature-line"></div>
        </div>

        <div class="grid-cell-right">
          <div class="mengetahui-box">
            <div>
              <div class="mengetahui-title">Mengetahui:</div>
              ${signatureSvg}
            </div>
            <div>
              <div class="mengetahui-name">${bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.'}</div>
              <div class="mengetahui-job">Kepala SPPG Probolinggo</div>
              <div class="mengetahui-job">Krejengan Temenggungan</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-gap"></div>

    <!-- ========================================================= -->
    <!-- BAGIAN B: BERITA ACARA PENYERAHAN ALAT MAKAN             -->
    <!-- ========================================================= -->
    <div class="section">
      <div class="header-box">
        <img src="/badan_gizi_logo.jpg" alt="Logo Badan Gizi" class="header-logo" onerror="this.style.display='none'" />
        <div class="header-title-1">BERITA ACARA PENYERAHAN ALAT MAKAN</div>
        <div class="header-title-2">PROGRAM MAKAN BERGIZI</div>
        <div class="header-nomor">Nomor: ${bast.nomorBast}</div>
      </div>

      <div class="narrative-p">
        Pada Hari <strong>${bast.hari}</strong> Tanggal <strong>${cleanDate}</strong> Jam <strong>${cleanWaktu}</strong> Telah Diterima Kembali Alat Makan Sejumlah : <strong>${bast.jumlahAlatMakan || bast.jumlahPaketMakanan}</strong> Paket Alat Makan Bergizi Dari ${bast.namaSppg}.
      </div>

      <!-- Yang Menyerahkan (diisi oleh Lembaga) (Atas) -->
      <div>
        <div class="row-info">
          <div class="col-label-2"><strong>Yang Menyerahkan (diisi oleh Lembaga):</strong></div>
          <div><strong style="text-transform: uppercase;">${bast.namaSekolah}</strong></div>
        </div>
        <div class="row-info">
          <div class="col-label-2">PIC</div>
          <div>: ${bast.namaPic || 'Lulut Biyadillah'}</div>
        </div>
        <div class="row-info">
          <div class="col-label-2">Nomor Telpon</div>
          <div>: ${bast.telponPic || '085234834095'}</div>
        </div>
        <!-- Generous signature space -->
        <div class="signature-space"></div>
        <div class="signature-name">(${bast.namaPic || 'Lulut Biyadillah'})</div>
        <div class="signature-line"></div>
      </div>

      <!-- Grid Bawah: Kiri Diterima Tim Distribusi, Kanan Mengetahui -->
      <div class="signatures-bottom-grid">
        <div class="grid-cell-left">
          <div class="row-info">
            <div class="col-label-3">Diterima Oleh</div>
            <div>: <strong>Tim Distribusi</strong></div>
          </div>
          <div class="row-info">
            <div class="col-label-3"></div>
            <div><strong>SPPG Hafshawaty 001 Genggong</strong></div>
          </div>
          <div class="row-info">
            <div class="col-label-3">Nomor Telpon</div>
            <div>: <strong>${bast.telponPetugasDistribusi || '085212581665'}</strong></div>
        </div>
          <!-- Generous signature space -->
          <div class="signature-space"></div>
          <div class="signature-name">(${bast.namaPetugasDistribusi || 'Abdus Salam'})</div>
          <div class="signature-line"></div>
        </div>

        <div class="grid-cell-right">
          <div class="mengetahui-box">
            <div>
              <div class="mengetahui-title">Mengetahui:</div>
              ${signatureSvg}
            </div>
            <div>
              <div class="mengetahui-name">${bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.'}</div>
              <div class="mengetahui-job">Kepala SPPG Probolinggo</div>
              <div class="mengetahui-job">Krejengan Temenggungan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser's native print dialog immediately using a hidden iframe.
 * Never prints blank pages, eliminates overflow bugs, and works from anywhere.
 */
export function printBastDocumentDirectly(bast: BastDocument, showSignature: boolean = true): void {
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

  const html = generateBastPrintHtml(bast, showSignature);
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
    } catch (err) {
      console.warn('Direct iframe print error, falling back to window.print():', err);
      window.print();
    }

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (_) {}
    }, 2000);
  }, 250);
}
