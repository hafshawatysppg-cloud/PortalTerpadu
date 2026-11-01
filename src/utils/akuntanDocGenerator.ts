import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  GajiKaryawanRecord,
  GajiStafRecord,
  InsentifPicRecord,
  InsentifFasilitasRecord,
  RabBahanBakuItem,
  RealisasiBahanBakuItem
} from '../types/akuntan';

/**
 * Konversi angka rupiah ke kalimat teks Indonesia (Terbilang)
 */
export function terbilang(n: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas'
  ];

  const val = Math.floor(Math.abs(n));

  if (val < 12) {
    return bilangan[val];
  } else if (val < 20) {
    return terbilang(val - 10) + ' Belas';
  } else if (val < 100) {
    return (
      terbilang(Math.floor(val / 10)) +
      ' Puluh ' +
      bilangan[val % 10]
    ).trim();
  } else if (val < 200) {
    return ('Seratus ' + terbilang(val - 100)).trim();
  } else if (val < 1000) {
    return (
      terbilang(Math.floor(val / 100)) +
      ' Ratus ' +
      terbilang(val % 100)
    ).trim();
  } else if (val < 2000) {
    return ('Seribu ' + terbilang(val - 1000)).trim();
  } else if (val < 1000000) {
    return (
      terbilang(Math.floor(val / 1000)) +
      ' Ribu ' +
      terbilang(val % 1000)
    ).trim();
  } else if (val < 1000000000) {
    return (
      terbilang(Math.floor(val / 1000000)) +
      ' Juta ' +
      terbilang(val % 1000000)
    ).trim();
  } else if (val < 1000000000000) {
    return (
      terbilang(Math.floor(val / 1000000000)) +
      ' Miliar ' +
      terbilang(val % 1000000000)
    ).trim();
  }
  return 'Nol';
}

export function formatRupiah(val: number): string {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

/**
 * GENERATE SLIP GAJI PDF
 */
export function generateSlipGajiPdf(
  record: GajiKaryawanRecord | GajiStafRecord,
  tipe: 'KARYAWAN' | 'STAF'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(13, 148, 136); // Teal-600
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN GIZI NASIONAL - SPPG', 14, 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `SATUAN PELAYANAN PROGRAM GIZI | SLIP GAJI RESMI ${tipe}`,
    14,
    17
  );

  // Document Info Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BUKTI PEMBAYARAN PENGHASILAN (SLIP GAJI)', 14, 32);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Slip  : ${record.nomorSlip}`, 14, 38);
  doc.text(`Periode      : ${record.periode}`, 14, 43);
  doc.text(`Tanggal Bayar: ${record.tanggalBayar}`, 14, 48);

  doc.text(`Nama Lengkap : ${record.nama}`, 120, 38);
  doc.text(`NIK / ID      : ${record.nik}`, 120, 43);
  doc.text(`Jabatan       : ${record.jabatan}`, 120, 48);

  // Income & Deduction breakdown table
  const earnings: any[] = [];
  const deductions: any[] = [];

  earnings.push(['Gaji Pokok', formatRupiah(record.gajiPokok)]);

  if ('tunjanganHadir' in record && record.tunjanganHadir) {
    earnings.push(['Tunjangan Kehadiran', formatRupiah(record.tunjanganHadir)]);
  }
  if ('tunjanganJabatan' in record && record.tunjanganJabatan) {
    earnings.push(['Tunjangan Jabatan', formatRupiah(record.tunjanganJabatan)]);
  }
  if ('tunjanganTransport' in record && record.tunjanganTransport) {
    earnings.push(['Tunjangan Transport', formatRupiah(record.tunjanganTransport)]);
  }
  if ('uangMakan' in record && record.uangMakan) {
    earnings.push(['Uang Makan', formatRupiah(record.uangMakan)]);
  }
  if ('uangLembur' in record && record.uangLembur) {
    earnings.push(['Uang Lembur', formatRupiah(record.uangLembur)]);
  }
  if ('lembur' in record && record.lembur) {
    earnings.push(['Uang Lembur', formatRupiah(record.lembur)]);
  }
  if ('bonusKinerja' in record && record.bonusKinerja) {
    earnings.push(['Bonus Kinerja', formatRupiah(record.bonusKinerja)]);
  }

  // Deductions
  if (record.potonganBpjs) {
    deductions.push(['Potongan BPJS', formatRupiah(record.potonganBpjs)]);
  }
  if ('potonganAbsensi' in record && record.potonganAbsensi) {
    deductions.push(['Potongan Absensi', formatRupiah(record.potonganAbsensi)]);
  }
  if ('potonganPph21' in record && record.potonganPph21) {
    deductions.push(['Potongan PPh 21', formatRupiah(record.potonganPph21)]);
  }
  if (deductions.length === 0) {
    deductions.push(['Tidak ada potongan', 'Rp 0']);
  }

  const maxRows = Math.max(earnings.length, deductions.length);
  const tableBody: any[] = [];

  for (let i = 0; i < maxRows; i++) {
    const e = earnings[i] || ['', ''];
    const d = deductions[i] || ['', ''];
    tableBody.push([e[0], e[1], d[0], d[1]]);
  }

  tableBody.push([
    'TOTAL PENERIMAAN (A)',
    formatRupiah(record.totalPenerimaan),
    'TOTAL POTONGAN (B)',
    formatRupiah(record.totalPotongan)
  ]);

  autoTable(doc, {
    startY: 54,
    head: [
      [
        { content: 'PENERIMAAN (EARNINGS)', colSpan: 2, styles: { halign: 'center', fillColor: [13, 148, 136] } },
        { content: 'POTONGAN (DEDUCTIONS)', colSpan: 2, styles: { halign: 'center', fillColor: [225, 29, 72] } }
      ],
      ['Komponen', 'Nominal', 'Komponen', 'Nominal']
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fontSize: 8.5,
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === maxRows) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 130;

  // Take Home Pay Box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.roundedRect(14, finalY + 4, 182, 22, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('GAJI BERSIH (TAKE HOME PAY):', 20, finalY + 12);
  doc.setFontSize(13);
  doc.text(formatRupiah(record.gajiBersih), 115, finalY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(51, 65, 85);
  doc.text(`Terbilang: "# ${terbilang(record.gajiBersih)} Rupiah #"`, 20, finalY + 20);

  // Signatures
  const sigY = finalY + 36;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  doc.text('Penerima Gaji,', 25, sigY);
  doc.line(25, sigY + 20, 75, sigY + 20);
  doc.text(`( ${record.nama} )`, 25, sigY + 25);
  doc.text(`NIK. ${record.nik}`, 25, sigY + 29);

  doc.text('Bagian Keuangan / Akuntan SPPG,', 130, sigY);
  doc.line(130, sigY + 20, 185, sigY + 20);
  doc.text('( Bagian Keuangan SPPG )', 130, sigY + 25);
  doc.text('Status: LUNAS TRANSFER', 130, sigY + 29);

  doc.save(`Slip_Gaji_${tipe}_${record.nama.replace(/\s+/g, '_')}_${record.periode.replace(/\s+/g, '_')}.pdf`);
}

/**
 * GENERATE SLIP GAJI EXCEL
 */
export function generateSlipGajiExcel(
  records: (GajiKaryawanRecord | GajiStafRecord)[],
  sheetTitle: string
) {
  const wb = XLSX.utils.book_new();
  const rows: any[] = [];

  rows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  rows.push([`REKAPITULASI PEMBAYARAN GAJI: ${sheetTitle.toUpperCase()}`]);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`]);
  rows.push([]);

  rows.push([
    'No',
    'Nomor Slip',
    'NIK',
    'Nama Lengkap',
    'Jabatan',
    'Gaji Pokok (Rp)',
    'Total Penerimaan (Rp)',
    'Total Potongan (Rp)',
    'Gaji Bersih / THP (Rp)',
    'Terbilang',
    'Periode',
    'Status Pembayaran',
    'Rekening Bank'
  ]);

  records.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.nomorSlip,
      r.nik,
      r.nama,
      r.jabatan,
      r.gajiPokok,
      r.totalPenerimaan,
      r.totalPotongan,
      r.gajiBersih,
      `${terbilang(r.gajiBersih)} Rupiah`,
      r.periode,
      r.statusBayar,
      r.rekeningBank
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 },
    { wch: 25 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 30));
  XLSX.writeFile(wb, `Rekap_Gaji_${sheetTitle.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * GENERATE KWITANSI INSENTIF PIC PDF
 */
export function generateKwitansiPdf(record: InsentifPicRecord) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5'
  });

  // Border & Header
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, 194, 132);

  doc.setFillColor(13, 148, 136);
  doc.rect(8, 8, 194, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN GIZI NASIONAL - SPPG', 14, 16);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('KWITANSI PEMBAYARAN INSENTIF PIC DISTRIBUSI', 14, 22);

  doc.setFontSize(9);
  doc.text(`No: ${record.nomorKwitansi}`, 145, 18);

  // Body content
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  let y = 35;
  const lineGap = 9;

  doc.setFont('helvetica', 'bold');
  doc.text('Telah Diterima Dari :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Bendahara / Akuntan SPPG Badan Gizi Nasional', 55, y);

  y += lineGap;
  doc.setFont('helvetica', 'bold');
  doc.text('Uang Sejumlah      :', 14, y);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(13, 148, 136);
  doc.text(`" ${terbilang(record.totalInsentif)} Rupiah "`, 55, y);
  doc.setTextColor(30, 41, 59);

  y += lineGap;
  doc.setFont('helvetica', 'bold');
  doc.text('Untuk Pembayaran   :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Insentif Koordinator & PIC Distribusi Program Gizi - ${record.lembaga}`,
    55,
    y
  );
  doc.text(`Periode: ${record.periode} (${record.jumlahSasaran} Porsi Sasaran)`, 55, y + 5);

  y += lineGap + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Penerima      :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.namaPic} (${record.nik})`, 55, y);

  // Amount badge
  y += 14;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 70, 16, 2, 2, 'FD');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(record.totalInsentif), 20, y + 11);

  // Signatures on right
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tempat: Probolinggo, ${record.tanggalKwitansi}`, 125, y - 4);
  doc.text('Yang Menerima,', 125, y + 2);

  doc.line(125, y + 22, 185, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${record.namaPic} )`, 125, y + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(`Telp. ${record.telepon}`, 125, y + 31);

  doc.save(`Kwitansi_${record.nomorKwitansi.replace(/[\/\\]/g, '_')}_${record.namaPic.replace(/\s+/g, '_')}.pdf`);
}

/**
 * GENERATE KWITANSI EXCEL
 */
export function generateKwitansiExcel(records: InsentifPicRecord[], title: string) {
  const wb = XLSX.utils.book_new();
  const rows: any[] = [];

  rows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  rows.push([`REKAPITULASI KWITANSI PEMBAYARAN INSENTIF PIC: ${title.toUpperCase()}`]);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`]);
  rows.push([]);

  rows.push([
    'No',
    'Nomor Kwitansi',
    'Nama PIC',
    'NIK',
    'Lembaga / Sekolah',
    'Kategori',
    'Sasaran Porsi',
    'Insentif Pokok (Rp)',
    'Uang Transport (Rp)',
    'Total Insentif (Rp)',
    'Terbilang',
    'Periode',
    'Tanggal Kwitansi',
    'Status Pembayaran',
    'No Telepon'
  ]);

  records.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.nomorKwitansi,
      r.namaPic,
      r.nik,
      r.lembaga,
      r.kategori,
      r.jumlahSasaran,
      r.insentifPokok,
      r.uangTransport,
      r.totalInsentif,
      `${terbilang(r.totalInsentif)} Rupiah`,
      r.periode,
      r.tanggalKwitansi,
      r.statusBayar,
      r.telepon
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Kwitansi PIC');
  XLSX.writeFile(wb, `Rekap_Kwitansi_${title.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * GENERATE BERITA ACARA INSENTIF FASILITAS PDF
 */
export function generateBeritaAcaraFasilitasPdf(record: InsentifFasilitasRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Garuda / BGN
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN GIZI NASIONAL - SPPG', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('BERITA ACARA SERAH TERIMA & PEMANFAATAN FASILITAS OPERASIONAL', 14, 18);

  // Document details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BERITA ACARA PEMANFAATAN & INSENTIF FASILITAS PENDUKUNG', 14, 33);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Berita Acara : ${record.nomorBa}`, 14, 39);
  doc.text(`Periode Pemanfaatan : ${record.periode}`, 14, 44);
  doc.text(`Tanggal Pembuatan   : ${record.tanggalBeritaAcara}`, 14, 49);

  // Narrative Text
  doc.setFontSize(8.5);
  doc.text(
    'Pada hari ini, yang bertanda tangan di bawah ini masing-masing pihak telah bersepakat mengenai',
    14,
    58
  );
  doc.text(
    'pemanfaatan fasilitas operasional dan kompensasi insentif fasilitas Satuan Pelayanan Program Gizi (SPPG):',
    14,
    63
  );

  // Parties Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 68, 182, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 68, 182, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.text('1. PIHAK PERTAMA (Penyelenggara SPPG):', 18, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Penanggung Jawab : ${record.pihakPertama}`, 24, 80);
  doc.text('Jabatan               : Kepala / Bagian Keuangan SPPG Badan Gizi Nasional', 24, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('2. PIHAK KEDUA (Pengelola / Penyedia Fasilitas):', 18, 92);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pengelola        : ${record.pihakKedua} (${record.pemilikPenyedia})`, 24, 98);

  // Rincian Fasilitas Table
  const tableData = record.fasilitasRincian.map((item, idx) => [
    String(idx + 1),
    item,
    'Tersedia & Layak Pakai Higienis',
    '100%'
  ]);

  tableData.push([
    '',
    'Kompensasi Pemanfaatan Fasilitas Per Bulan',
    'Nilai Pokok',
    formatRupiah(record.kompensasiBulan)
  ]);
  tableData.push([
    '',
    'Alokasi Subsidi Utilitas (Air Bersih, Sanitasi & Listrik)',
    'Nilai Tambahan',
    formatRupiah(record.biayaUtilitas)
  ]);
  tableData.push([
    '',
    'TOTAL DANA INSENTIF FASILITAS',
    'Lunas / Disetujui',
    formatRupiah(record.totalInsentif)
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['No', 'Uraian Komponen Fasilitas / Hak Kompensasi', 'Kondisi Operasional', 'Nilai / Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      fontSize: 8.5,
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  // Amount in words
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text(`Terbilang: "# ${terbilang(record.totalInsentif)} Rupiah #"`, 14, finalY + 8);

  // Signatures
  const sigY = finalY + 20;
  doc.setFont('helvetica', 'bold');
  doc.text('PIHAK PERTAMA,', 25, sigY);
  doc.setFont('helvetica', 'normal');
  doc.text('Satuan Pelayanan Program Gizi', 25, sigY + 5);
  doc.line(25, sigY + 24, 75, sigY + 24);
  doc.text(`( ${record.pihakPertama} )`, 25, sigY + 28);
  doc.text('NIP / ID. BGN-SPPG-2026', 25, sigY + 32);

  doc.setFont('helvetica', 'bold');
  doc.text('PIHAK KEDUA,', 135, sigY);
  doc.setFont('helvetica', 'normal');
  doc.text('Pengelola / Penyedia Fasilitas', 135, sigY + 5);
  doc.line(135, sigY + 24, 185, sigY + 24);
  doc.text(`( ${record.pihakKedua} )`, 135, sigY + 28);
  doc.text(`Fasilitas: ${record.namaFasilitas}`, 135, sigY + 32);

  doc.save(`BAST_Fasilitas_${record.nomorBa.replace(/[\/\\]/g, '_')}.pdf`);
}

/**
 * GENERATE BERITA ACARA EXCEL
 */
export function generateBeritaAcaraFasilitasExcel(records: InsentifFasilitasRecord[]) {
  const wb = XLSX.utils.book_new();
  const rows: any[] = [];

  rows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  rows.push(['REKAPITULASI BERITA ACARA & INSENTIF FASILITAS PENDUKUNG']);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`]);
  rows.push([]);

  rows.push([
    'No',
    'Nomor Berita Acara',
    'Nama Fasilitas',
    'Lokasi',
    'Pemilik / Penyedia',
    'Pihak Pertama (SPPG)',
    'Pihak Kedua (Pengelola)',
    'Kompensasi Pokok (Rp)',
    'Biaya Utilitas (Rp)',
    'Total Insentif (Rp)',
    'Terbilang',
    'Periode',
    'Tanggal Berita Acara',
    'Status'
  ]);

  records.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.nomorBa,
      r.namaFasilitas,
      r.lokasi,
      r.pemilikPenyedia,
      r.pihakPertama,
      r.pihakKedua,
      r.kompensasiBulan,
      r.biayaUtilitas,
      r.totalInsentif,
      `${terbilang(r.totalInsentif)} Rupiah`,
      r.periode,
      r.tanggalBeritaAcara,
      r.status
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 26 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Insentif Fasilitas');
  XLSX.writeFile(wb, `Rekap_Insentif_Fasilitas_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * EXPORT RAB / REALISASI EXCEL
 */
export function exportTableToExcel(data: any[], headers: string[], fileName: string, sheetName: string) {
  const wb = XLSX.utils.book_new();
  const rows: any[] = [];
  rows.push(['BADAN GIZI NASIONAL - SATUAN PELAYANAN PROGRAM GIZI (SPPG)']);
  rows.push([`LAPORAN KEUANGAN: ${sheetName.toUpperCase()}`]);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`]);
  rows.push([]);
  rows.push(headers);

  data.forEach(item => {
    rows.push(item);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
