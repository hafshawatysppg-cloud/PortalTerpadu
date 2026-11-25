import fs from 'node:fs';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
} from 'docx';
import type { BastDocument } from '../../src/types';

function loadKepalaSppgSignatureBytes(): Uint8Array | null {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'assets',
      'aistudio',
      'Untitled_design__4__71e57967.png'
    );
    if (fs.existsSync(filePath)) {
      return new Uint8Array(fs.readFileSync(filePath));
    }
    return null;
  } catch {
    return null;
  }
}

function buildMengetahuiSignatureParagraphs(sigBytes: Uint8Array | null): Paragraph[] {
  if (!sigBytes) {
    return [
      new Paragraph({
        spacing: { before: 0, after: 400 },
        children: [
          new TextRun({ text: 'Mengetahui:', font: 'Times New Roman', size: 20 }),
        ],
      }),
    ];
  }

  return [
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({ text: 'Mengetahui:', font: 'Times New Roman', size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { before: 20, after: 40 },
      children: [
        new ImageRun({
          data: sigBytes,
          transformation: {
            width: 88,
            height: 56,
          },
          type: 'png',
        }),
      ],
    }),
  ];
}

export async function createBastWordDocument(bast: BastDocument): Promise<Document> {
  const signatureBytes = loadKepalaSppgSignatureBytes();

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

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 1152,
              right: 1152,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'BERITA ACARA PENERIMAAN PAKET MAKANAN',
                bold: true,
                underline: {},
                size: 24,
                font: 'Times New Roman',
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
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 140 },
            children: [
              new TextRun({
                text: `Nomor: ${bast.nomorBast}`,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 120, line: 260 },
            children: [
              new TextRun({ text: 'Pada Hari ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.hari, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Tanggal ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: cleanDateFormatted, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Jam ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: '................ WIB', underline: {}, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Telah Diterima Paket Makanan Bergizi Gratis (MBG) Sejumlah : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${bast.jumlahPaketMakanan}`, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({
                text: ` dalam keadaan baik dan layak dikonsumsi dari ${bast.namaSppg}.`,
                font: 'Times New Roman',
                size: 21,
              }),
            ],
          }),
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
                size: 21,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 68, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 20 },
                        children: [
                          new TextRun({ text: 'Diterima Oleh Lembaga: ', bold: true, font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: bast.npsn ? `${bast.namaSekolah} (NPSN: ${bast.npsn})` : bast.namaSekolah, bold: true, font: 'Times New Roman', size: 21 }),
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
                            size: 21,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: '__________________________________',
                            font: 'Times New Roman',
                            size: 21,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    borders: boxBorder,
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      ...buildMengetahuiSignatureParagraphs(signatureBytes),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.',
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: 'Kepala SPPG Probolinggo',
                            font: 'Times New Roman',
                            size: 19,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: 'Krejengan Temenggungan',
                            font: 'Times New Roman',
                            size: 19,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'BERITA ACARA PENYERAHAN ALAT MAKAN',
                bold: true,
                underline: {},
                size: 24,
                font: 'Times New Roman',
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
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 140 },
            children: [
              new TextRun({
                text: `Nomor: ${bast.nomorBast}`,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 120, line: 260 },
            children: [
              new TextRun({ text: 'Pada Hari ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.hari, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Tanggal ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: cleanDateFormatted, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Jam ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: '................ WIB', underline: {}, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: ' Telah Diterima Kembali Alat Makan Sejumlah : ', font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${bast.jumlahAlatMakan || bast.jumlahPaketMakanan}`, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({
                text: ` Paket Alat Makan Bergizi Dari ${bast.namaSppg}.`,
                font: 'Times New Roman',
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({ text: 'Yang Menyerahkan (diisi oleh Lembaga): ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: bast.npsn ? `${bast.namaSekolah} (NPSN: ${bast.npsn})` : bast.namaSekolah, bold: true, font: 'Times New Roman', size: 21 }),
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
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: '__________________________________',
                font: 'Times New Roman',
                size: 21,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
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
                            size: 21,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    borders: boxBorder,
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      ...buildMengetahuiSignatureParagraphs(signatureBytes),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: bast.namaKepalaSppg || 'Sri Rohayu, S.Pd.',
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 10 },
                        children: [
                          new TextRun({
                            text: 'Kepala SPPG Probolinggo',
                            font: 'Times New Roman',
                            size: 19,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: 'Krejengan Temenggungan',
                            font: 'Times New Roman',
                            size: 19,
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
}
