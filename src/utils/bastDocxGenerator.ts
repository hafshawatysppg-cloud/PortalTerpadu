import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle
} from 'docx';
import { BastDocument } from '../types';

/**
 * Generates an authentic Microsoft Word (.docx) document strictly matching
 * the official "BERITA ACARA PENERIMAAN PAKET MAKANA2.docx" template.
 */
export async function createBastWordDocument(bast: BastDocument): Promise<Document> {
  const waktuText = bast.waktuPenerimaan && bast.waktuPenerimaan !== 'Jam …………… WIB'
    ? bast.waktuPenerimaan.replace(/^Jam\s*/i, '').trim()
    : '…………… WIB';

  // Helper for borderless table cells
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const boxBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  };

  const cleanDateFormatted = bast.hariTanggalFormatted.includes(',')
    ? bast.hariTanggalFormatted.split(',')[1].trim()
    : bast.hariTanggalFormatted;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 in
              bottom: 720, // 0.5 in
              left: 1152,  // 0.8 in
              right: 1152, // 0.8 in
            },
          },
        },
        children: [
          // ==========================================
          // BAGIAN A: BERITA ACARA PENERIMAAN PAKET MAKANAN
          // ==========================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'BERITA ACARA PENERIMAAN PAKET MAKANAN',
                bold: true,
                underline: {},
                size: 24, // 12pt
                font: 'Times New Roman'
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'PROGRAM MAKAN BERGIZI',
                bold: true,
                underline: {},
                size: 24, // 12pt
                font: 'Times New Roman'
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 140 },
            children: [
              new TextRun({
                text: `Nomor: ${bast.nomorBast}`,
                size: 22, // 11pt
                font: 'Times New Roman'
              }),
            ],
          }),

          // Paragraf Narasi Bagian A
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 120, line: 260 },
            children: [
              new TextRun({ text: 'Pada Hari ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.hari, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Tanggal ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: cleanDateFormatted, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ` Jam ${waktuText} Telah Diterima Paket Makanan Bergizi Gratis (MBG) Sejumlah : `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${bast.jumlahPaketMakanan}`, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({
                text: ` dalam keadaan baik dan layak dikonsumsi dari ${bast.namaSppg}.`,
                font: 'Times New Roman',
                size: 21
              }),
            ],
          }),

          // Yang Menyerahkan (Bagian Atas)
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({ text: 'Yang Menyerahkan  : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.namaTimDistribusi, bold: true, font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 560 },
            children: [
              new TextRun({ text: 'Nomor Telpon        : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.telponPetugasDistribusi || '085212581665', font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: `(${bast.namaPetugasDistribusi || 'Abdus Salam'} )`,
                bold: true,
                font: 'Times New Roman',
                size: 21
              }),
            ],
          }),

          // Tabel 2 Kolom Bagian Bawah: Kiri Diterima Lembaga, Kanan Kotak Mengetahui
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  // Kolom Kiri: Diterima Oleh Lembaga
                  new TableCell({
                    width: { size: 68, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({ text: 'Diterima Oleh Lembaga: ', bold: true, font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: bast.namaSekolah, bold: true, font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({ text: 'PIC                         : ', font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: bast.namaPic || 'Lulut Biyadillah', font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 560 },
                        children: [
                          new TextRun({ text: 'Nomor Telpon        : ', font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: bast.telponPic || '085234834095', font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({
                            text: `( ${bast.namaPic || 'Lulut Biyadillah'} )`,
                            bold: true,
                            font: 'Times New Roman',
                            size: 21
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: '__________________________________',
                            font: 'Times New Roman',
                            size: 21
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Kolom Kanan: Kotak Mengetahui
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    borders: boxBorder,
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 400 },
                        children: [
                          new TextRun({ text: 'Mengetahui:', font: 'Times New Roman', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.',
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 20
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: 'Kepala SPPG Probolinggo',
                            font: 'Times New Roman',
                            size: 19
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: 'Krejengan Temenggungan',
                            font: 'Times New Roman',
                            size: 19
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Jarak Antara Dokumen 1 dan Dokumen 2
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [],
          }),

          // ==========================================
          // BAGIAN B: BERITA ACARA PENYERAHAN ALAT MAKAN
          // ==========================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'BERITA ACARA PENYERAHAN ALAT MAKAN',
                bold: true,
                underline: {},
                size: 24, // 12pt
                font: 'Times New Roman'
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'PROGRAM MAKAN BERGIZI',
                bold: true,
                underline: {},
                size: 24, // 12pt
                font: 'Times New Roman'
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 140 },
            children: [
              new TextRun({
                text: `Nomor: ${bast.nomorBast}`,
                size: 22, // 11pt
                font: 'Times New Roman'
              }),
            ],
          }),

          // Paragraf Narasi Bagian B
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 120, line: 260 },
            children: [
              new TextRun({ text: 'Pada Hari ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.hari, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Tanggal ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: cleanDateFormatted, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ` Jam ${waktuText} Telah Diterima Kembali Alat Makan Sejumlah : `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${bast.jumlahAlatMakan || bast.jumlahPaketMakanan}`, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({
                text: ` Paket Alat Makan Bergizi Dari ${bast.namaSppg}.`,
                font: 'Times New Roman',
                size: 21
              }),
            ],
          }),

          // Yang Menyerahkan (diisi oleh Lembaga)
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({ text: 'Yang Menyerahkan (diisi oleh Lembaga): ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.namaSekolah, bold: true, font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 20 },
            children: [
              new TextRun({ text: 'PIC                         : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.namaPic || 'Lulut Biyadillah', font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 560 },
            children: [
              new TextRun({ text: 'Nomor Telpon        : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.telponPic || '085234834095', font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 20 },
            children: [
              new TextRun({
                text: `(${bast.namaPic || 'Lulut Biyadillah'})`,
                bold: true,
                font: 'Times New Roman',
                size: 21
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: '__________________________________',
                font: 'Times New Roman',
                size: 21
              }),
            ],
          }),

          // Tabel 2 Kolom Bagian Bawah: Kiri Diterima Oleh Tim Distribusi, Kanan Kotak Mengetahui
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  // Kolom Kiri: Diterima Oleh Tim Distribusi
                  new TableCell({
                    width: { size: 68, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({ text: 'Diterima Oleh         : ', font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: 'Tim Distribusi', bold: true, font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({ text: '                           ', font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: 'SPPG Hafshawaty 001 Genggong', bold: true, font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 560 },
                        children: [
                          new TextRun({ text: 'Nomor Telpon        : ', font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: bast.telponPetugasDistribusi || '085212581665', font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: `(${bast.namaPetugasDistribusi || 'Abdus Salam'})`,
                            bold: true,
                            font: 'Times New Roman',
                            size: 21
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Kolom Kanan: Kotak Mengetahui
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    borders: boxBorder,
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 400 },
                        children: [
                          new TextRun({ text: 'Mengetahui:', font: 'Times New Roman', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.',
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 20
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: 'Kepala SPPG Probolinggo',
                            font: 'Times New Roman',
                            size: 19
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: 'Krejengan Temenggungan',
                            font: 'Times New Roman',
                            size: 19
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Direct client-side trigger to save the generated document as a file.
 */
export async function downloadBastDocx(bast: BastDocument): Promise<void> {
  const doc = await createBastWordDocument(bast);
  const blob = await Packer.toBlob(doc);

  const cleanSchool = bast.namaSekolah.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BAST_${cleanSchool}_${bast.tanggal}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
