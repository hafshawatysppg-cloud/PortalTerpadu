import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getKategoriConfig, inferKategoriFromText } from '../components/common/GroupFormModal';

// Helper to convert image URL to base64 for jsPDF
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

export interface RekapPdfItem {
  id?: string;
  namaInstansi: string;
  npsn?: string;
  groupNama?: string;
  kategoriLembaga?: string;
  breakdownKelas?: Record<string, number>;
  targetSiswa?: number;
  targetGuru?: number;
  targetBalita?: number;
  targetBumilBusui?: number;
  totalPenerima?: number;
  klasifikasiPorsi?: string;
  statusKbm?: string;
  picNama?: string;
  kontakPerson?: string;
  nomorKontak?: string;
  picKontak?: string;
  rincianSasaran?: any;
}

export interface ExportRekapHarianPdfParams {
  tanggal: string;
  hariTanggal?: string;
  statusDoc?: string;
  records: RekapPdfItem[];
  userName?: string;
  autoPrint?: boolean;
}

/**
 * Generate dan Export / Print PDF Rincian Rekapitulasi Penerima Manfaat Harian
 * Lengkap dengan Logo Resmi BGN, Kop Surat, dan Rincian Demografi per Kelas & Gender (L/P)
 */
export const generateRekapHarianPdf = async ({
  tanggal,
  hariTanggal,
  statusDoc = 'FINAL',
  records,
  userName = 'Petugas SPPG',
  autoPrint = false
}: ExportRekapHarianPdfParams): Promise<void> => {
  // Initialize Landscape A4 Document (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;

  // 1. KOP SURAT RESMI BADAN GIZI NASIONAL
  // Load Logo BGN Resmi
  try {
    const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
    if (logoBase64) {
      // Width 24mm, height 24mm
      doc.addImage(logoBase64, 'PNG', marginX, 10, 24, 24);
    }
  } catch (err) {
    console.warn('Gagal memuat logo BGN untuk PDF:', err);
  }

  // Teks Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('BADAN GIZI NASIONAL REPUBLIK INDONESIA', marginX + 28, 16);

  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136); // teal-600 / bgn emerald
  doc.text('SATUAN PELAYANAN PROGRAM GIZI (SPPG) KABUPATEN PROBOLINGGO', marginX + 28, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'Alamat: Jl. Raya Kraksaan No. 45, Kraksaan, Kab. Probolinggo, Jawa Timur 67282 | Telp: (0335) 841234 | Email: sppg.probolinggo@bgn.go.id',
    marginX + 28,
    27
  );
  doc.text(
    'Program Makan Bergizi Gratis (MBG) Nasional - Pemenuhan Gizi Anak Sekolah & Kelompok Sasaran 3B',
    marginX + 28,
    31
  );

  // Garis Pembatas Kop Surat (Ganda)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginX, 36, pageWidth - marginX, 36);

  doc.setLineWidth(0.2);
  doc.line(marginX, 37.2, pageWidth - marginX, 37.2);

  // 2. JUDUL DOKUMEN & METADATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN RINCIAN REKAPITULASI PENERIMA MANFAAT PROGRAM MAKAN BERGIZI', pageWidth / 2, 44, {
    align: 'center'
  });

  // Format Hari & Tanggal jika belum disediakan
  let formattedDate = hariTanggal;
  if (!formattedDate && tanggal) {
    const [y, m, d] = tanggal.split('-').map(Number);
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      formattedDate = `${days[dateObj.getDay()]}, ${d} ${months[m - 1]} ${y}`;
    } else {
      formattedDate = tanggal;
    }
  }

  // Box Informasi Metadata
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, 48, pageWidth - marginX * 2, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Hari & Tanggal:`, marginX + 4, 55.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formattedDate} (${tanggal})`, marginX + 30, 55.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Status Dokumen:`, marginX + 115, 55.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(statusDoc === 'FINAL' ? 16 : 180, statusDoc === 'FINAL' ? 120 : 100, statusDoc === 'FINAL' ? 50 : 20);
  doc.text(`${statusDoc}`, marginX + 144, 55.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Petugas SPPG:`, marginX + 185, 55.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userName}`, marginX + 210, 55.5);

  // 3. MENYUSUN DATA TABEL BREAKDOWN KELAS & GENDER (L & P)
  let grandTotalL = 0;
  let grandTotalP = 0;
  let grandTotalGuru = 0;
  let grandTotalPorsi = 0;

  const tableRows = records.map((rec, idx) => {
    const rawCat = rec.kategoriLembaga || inferKategoriFromText(rec.namaInstansi, 'SD / MI');
    const conf = getKategoriConfig(rawCat);
    const bd = rec.breakdownKelas || rec.rincianSasaran?.breakdownKelas || {};
    const is3B = rawCat.includes('3B') || conf.id.includes('3B') || conf.targetCategory === '3B';

    let itemTotalL = 0;
    let itemTotalP = 0;
    let itemGuru = Number(rec.targetGuru) || Number(rec.rincianSasaran?.guru) || 0;
    const detailParts: string[] = [];

    if (rec.statusKbm === 'Libur Full') {
      return [
        String(idx + 1),
        `${rec.namaInstansi}${rec.npsn ? `\n(NPSN: ${rec.npsn})` : ''}`,
        conf.shortName,
        'STATUS LIBUR PENUH (0 Porsi Penyaluran)',
        '-',
        '-',
        '-',
        rec.klasifikasiPorsi || 'Porsi Besar',
        '0'
      ];
    }

    if (is3B) {
      // 3B Specific Demography
      const busuiW = Number(bd.busui_w ?? bd.busui ?? rec.targetBumilBusui ?? 0);
      const bumilW = Number(bd.bumil_w ?? bd.bumil ?? 0);
      const b511L = Number(bd.balita511_l || 0);
      const b511P = Number(bd.balita511_p || 0);
      const b1259L = Number(bd.balita1259_l || 0);
      const b1259P = Number(bd.balita1259_p || 0);
      const kL = Number(bd.kader_l || 0);
      const kP = Number(bd.kader_p || 0);

      itemTotalL = b511L + b1259L;
      itemTotalP = b511P + b1259P + busuiW + bumilW;
      itemGuru = kL + kP || Number(bd.kader) || 0;

      if (busuiW > 0) detailParts.push(`Busui: ${busuiW} W`);
      if (bumilW > 0) detailParts.push(`Bumil: ${bumilW} W`);
      if (b511L > 0 || b511P > 0) detailParts.push(`Balita 5-11 Bln: L=${b511L}, P=${b511P} (Tot ${b511L + b511P})`);
      if (b1259L > 0 || b1259P > 0) detailParts.push(`Balita 12-59 Bln: L=${b1259L}, P=${b1259P} (Tot ${b1259L + b1259P})`);
      if (kL > 0 || kP > 0) detailParts.push(`Kader: L=${kL}, P=${kP} (Tot ${kL + kP})`);
    } else {
      // Standard School Classes with Gender Breakdown
      conf.classes.forEach((cls) => {
        const valL = bd[`${cls.key}_l`] !== undefined
          ? (Number(bd[`${cls.key}_l`]) || 0)
          : (bd[cls.key] ? Math.ceil(bd[cls.key] / 2) : 0);
        const valP = bd[`${cls.key}_p`] !== undefined
          ? (Number(bd[`${cls.key}_p`]) || 0)
          : (bd[cls.key] ? Math.floor(bd[cls.key] / 2) : 0);
        const totCls = valL + valP;

        if (totCls > 0) {
          detailParts.push(`${cls.shortLabel || cls.label}: ${valL} L, ${valP} P (Tot ${totCls})`);
        }
        itemTotalL += valL;
        itemTotalP += valP;
      });
    }

    const itemTotalPorsi = Number(rec.totalPenerima) || (itemTotalL + itemTotalP + itemGuru);

    grandTotalL += itemTotalL;
    grandTotalP += itemTotalP;
    grandTotalGuru += itemGuru;
    grandTotalPorsi += itemTotalPorsi;

    const detailText = detailParts.length > 0 ? detailParts.join('\n') : `${itemTotalL + itemTotalP} Sasaran Terjadwal`;

    let institutionInfo = rec.namaInstansi;
    if (rec.npsn) institutionInfo += `\nNPSN: ${rec.npsn}`;
    const picContact = rec.picNama || rec.kontakPerson || '';
    const phoneContact = rec.nomorKontak || rec.picKontak || '';
    if (picContact || phoneContact) {
      institutionInfo += `\nPIC: ${picContact || '-'}${phoneContact ? ` (${phoneContact})` : ''}`;
    }

    return [
      String(idx + 1),
      institutionInfo,
      conf.shortName,
      detailText,
      itemTotalL > 0 ? String(itemTotalL) : '-',
      itemTotalP > 0 ? String(itemTotalP) : '-',
      itemGuru > 0 ? String(itemGuru) : '-',
      rec.klasifikasiPorsi || 'Porsi Besar',
      itemTotalPorsi.toLocaleString('id-ID')
    ];
  });

  // Baris Total / Akumulasi
  tableRows.push([
    '',
    'TOTAL AKUMULASI SELURUH SASARAN',
    `${records.length} Lembaga`,
    `Total Sasaran PM L & P: ${(grandTotalL + grandTotalP).toLocaleString('id-ID')} Orang | Tenaga Pendidik/Kader: ${grandTotalGuru.toLocaleString('id-ID')} Orang`,
    grandTotalL.toLocaleString('id-ID'),
    grandTotalP.toLocaleString('id-ID'),
    grandTotalGuru.toLocaleString('id-ID'),
    'Akumulasi Porsi',
    `${grandTotalPorsi.toLocaleString('id-ID')} Porsi`
  ]);

  // Render autoTable
  autoTable(doc, {
    startY: 64,
    head: [[
      'NO',
      'LEMBAGA / SATUAN PENDIDIKAN',
      'JENJANG',
      'RINCIAN DEMOGRAFI SASARAN PER KELAS & GENDER (L / P)',
      'TOTAL L',
      'TOTAL P',
      'GURU / STAF',
      'KLASIFIKASI',
      'TOTAL PORSI'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: 'middle',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 84 },
      4: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [29, 78, 216] }, // blue-700
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [190, 24, 93] }, // rose-700
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 22, halign: 'center', fontSize: 7 },
      8: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Highlight row total akumulasi
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
        if (data.column.index === 8) {
          data.cell.styles.fillColor = [220, 252, 231]; // emerald-100
          data.cell.styles.textColor = [20, 83, 45]; // emerald-900
        }
      }
    }
  });

  // 4. BAGIAN TANDA TANGAN / PENGESAHAN (DI AKHIR HALAMAN DOKUMEN)
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 160;

  // Cek jika halaman tidak cukup ruang untuk tanda tangan (butuh minimal 35mm)
  if (finalY + 36 > pageHeight) {
    doc.addPage();
    finalY = 20;
  }

  // Tanda Tangan 2 Kolom
  const leftColX = marginX + 15;
  const rightColX = pageWidth - marginX - 65;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  // Kolom Kiri
  doc.text('Mengetahui / Verifikator Lapangan,', leftColX, finalY);
  doc.text('Petugas Distribusi & Logistik SPPG', leftColX, finalY + 4.5);
  doc.text('( .................................................... )', leftColX, finalY + 24);
  doc.text(`Nama: ${userName}`, leftColX, finalY + 28);

  // Kolom Kanan
  doc.text(`Kraksaan, ${formattedDate || tanggal}`, rightColX, finalY);
  doc.text('Penanggung Jawab Satuan Pelayanan (SPPG)', rightColX, finalY + 4.5);
  doc.text('( .................................................... )', rightColX, finalY + 24);
  doc.text('NIP / ID: SPPG-PRB-001', rightColX, finalY + 28);

  // Footer Dokumen Resmi
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen resmi Sistem Informasi SPPG Badan Gizi Nasional | Dicetak pada: ${new Date().toLocaleString('id-ID')} WIB | Halaman ${doc.getNumberOfPages()} dari ${doc.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  // 5. PRINT ATAU DOWNLOAD
  if (autoPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Buka di iframe tersembunyi agar langsung memicu dialog cetak
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.focus();
        try {
          iframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, '_blank');
        }
      }, 300);
    };
  } else {
    doc.save(`Laporan_Rincian_Rekapitulasi_PM_${tanggal}.pdf`);
  }
};
