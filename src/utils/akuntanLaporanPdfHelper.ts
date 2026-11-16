import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  RabBahanBakuItem,
  RabOperasionalBarangItem,
  GajiKaryawanRecord,
  InsentifPicRecord,
  GajiStafRecord,
  OperasionalLainnyaItem,
  InsentifFasilitasRecord,
  RealisasiBahanBakuItem,
  RealisasiOperasionalItem
} from '../types/akuntan';
import { formatRupiah } from './akuntanDocGenerator';

export interface LaporanAkuntanSections {
  rabBahanBaku: boolean;
  rabOperasional: boolean;
  realisasiBahanBaku: boolean;
  realisasiOperasional: boolean;
}

export interface LaporanAkuntanParams {
  selectedDate: string;
  beneficiaryInfo: {
    porsiBesar: number;
    porsiKecil: number;
    totalPm: number;
  };
  rabBahanBaku: RabBahanBakuItem[];
  rabOperasionalBarang: RabOperasionalBarangItem[];
  gajiKaryawan: GajiKaryawanRecord[];
  insentifPicLembaga: InsentifPicRecord[];
  insentifPicPosyandu: InsentifPicRecord[];
  gajiStaf: GajiStafRecord[];
  operasionalLainnya: OperasionalLainnyaItem[];
  insentifFasilitas: InsentifFasilitasRecord[];
  realisasiBahanBaku: RealisasiBahanBakuItem[];
  realisasiOperasional: RealisasiOperasionalItem[];
  sections?: LaporanAkuntanSections;
}

const DEFAULT_SECTIONS: LaporanAkuntanSections = {
  rabBahanBaku: true,
  rabOperasional: true,
  realisasiBahanBaku: true,
  realisasiOperasional: true
};

const escapeHtml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(`${dateStr}T00:00:00`);
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

const getHargaRiilOperasional = (item: RealisasiOperasionalItem): number => {
  if (item.hargaSatuanRiil !== undefined && item.hargaSatuanRiil !== null) {
    return Number(item.hargaSatuanRiil) || 0;
  }
  const qty = Number(item.jumlahRiil) || 0;
  if (qty > 0) {
    return Math.round((Number(item.biayaRiil) || 0) / qty);
  }
  return Number(item.biayaRiil) || 0;
};

const computeTotals = (params: LaporanAkuntanParams) => {
  const paguBb = params.beneficiaryInfo.porsiBesar * 10000 + params.beneficiaryInfo.porsiKecil * 8000;
  const paguOp = params.beneficiaryInfo.totalPm * 3000;
  const paguFas = params.beneficiaryInfo.totalPm * 2000;
  const paguTotal = params.beneficiaryInfo.porsiBesar * 15000 + params.beneficiaryInfo.porsiKecil * 13000;

  const totalRabBb = params.rabBahanBaku.reduce((s, r) => s + (r.totalAnggaran || 0), 0);
  const totalRabOpBarang = params.rabOperasionalBarang.reduce((s, r) => s + (r.totalAnggaran || 0), 0);
  const totalGajiKaryawan = params.gajiKaryawan.reduce((s, r) => s + (r.gajiBersih || 0), 0);
  const totalPicSekolah = params.insentifPicLembaga.reduce((s, r) => s + (r.totalInsentif || 0), 0);
  const totalPicPosyandu = params.insentifPicPosyandu.reduce((s, r) => s + (r.totalInsentif || 0), 0);
  const totalOpLainnya = params.operasionalLainnya.reduce((s, r) => s + (r.jumlahBiaya || 0), 0);
  const totalFasilitas = params.insentifFasilitas.reduce((s, r) => s + (r.totalInsentif || 0), 0);

  const totalRabOperasionalSub =
    totalRabOpBarang + totalGajiKaryawan + totalPicSekolah + totalPicPosyandu + totalOpLainnya;

  const totalRealisasiBb = params.realisasiBahanBaku.reduce((s, r) => s + (r.totalRealisasi || 0), 0);
  const totalRencanaRealisasiBb = params.realisasiBahanBaku.reduce((s, r) => s + (r.totalRencana || 0), 0);
  const totalRealisasiOp = params.realisasiOperasional.reduce((s, r) => s + (r.biayaRiil || 0), 0);
  const totalAnggaranRealisasiOp = params.realisasiOperasional.reduce((s, r) => s + (r.anggaranRab || 0), 0);

  return {
    paguBb,
    paguOp,
    paguFas,
    paguTotal,
    totalRabBb,
    totalRabOpBarang,
    totalGajiKaryawan,
    totalPicSekolah,
    totalPicPosyandu,
    totalOpLainnya,
    totalFasilitas,
    totalRabOperasionalSub,
    totalRealisasiBb,
    totalRencanaRealisasiBb,
    totalRealisasiOp,
    totalAnggaranRealisasiOp
  };
};

/**
 * PRINT OUT A4 (ISOLATED IFRAME) FOR CETAK LAPORAN AKUNTAN
 * Order:
 * 1. RAB Bahan Baku
 * 2. RAB Operasional (Barang, Jasa: Gaji Karyawan, Insentif PIC Lembaga, Insentif PIC Posyandu, Operasional Lainnya, Gaji Staf, & Insentif Fasilitas)
 * 3. Realisasi Bahan Baku
 * 4. Realisasi Operasional
 */
export const printLaporanAkuntanA4 = async (params: LaporanAkuntanParams): Promise<void> => {
  const sections = params.sections || DEFAULT_SECTIONS;
  const logoDataUrl = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');
  const logoSrc = logoDataUrl || `${window.location.origin}/badan-gizi-nasional-seeklogo.png`;
  const totals = computeTotals(params);
  const tglLabel = formatTanggalIndo(params.selectedDate);
  const printedAt = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const blocks: string[] = [];

  if (sections.rabBahanBaku && params.rabBahanBaku.length > 0) {
    const rows = params.rabBahanBaku
      .map((r, i) => {
        const qty = r.pembulatan !== undefined ? r.pembulatan : r.totalKebutuhanKg || 0;
        return `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.namaBarang)}</td>
            <td class="r">${Number(qty).toLocaleString('id-ID')}</td>
            <td class="c">${escapeHtml(r.satuan)}</td>
            <td class="r">${escapeHtml(formatRupiah(r.hargaSatuan))}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.totalAnggaran))}</td>
            <td>${escapeHtml(r.keterangan || '-')}</td>
          </tr>`;
      })
      .join('');

    blocks.push(`
      <div class="section">
        <h3 class="sec-h">1. RAB BAHAN BAKU PANGAN</h3>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>Nama Bahan Baku</th>
              <th style="width:62px">Jumlah</th>
              <th style="width:52px">Satuan</th>
              <th style="width:92px">Harga Satuan</th>
              <th style="width:105px">Total Anggaran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="5" class="r">TOTAL RAB BAHAN BAKU</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalRabBb))}</td>
              <td>Pagu: ${escapeHtml(formatRupiah(totals.paguBb))}</td>
            </tr>
          </tfoot>
        </table>
      </div>`);
  }

  const hasRabOpData =
    params.rabOperasionalBarang.length > 0 ||
    params.gajiKaryawan.length > 0 ||
    params.insentifPicLembaga.length > 0 ||
    params.insentifPicPosyandu.length > 0 ||
    params.operasionalLainnya.length > 0 ||
    params.insentifFasilitas.length > 0;

  if (sections.rabOperasional && hasRabOpData) {
    const opSubBlocks: string[] = [];

    if (params.rabOperasionalBarang.length > 0) {
      const opBarangRows = params.rabOperasionalBarang
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.namaBarang || '-')}</td>
            <td class="c">${escapeHtml(r.satuan)}</td>
            <td class="r">${Number(r.jumlah || 0).toLocaleString('id-ID')}</td>
            <td class="r">${escapeHtml(formatRupiah(r.hargaSatuan))}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.totalAnggaran))}</td>
            <td>${escapeHtml(r.keterangan || r.periode || '-')}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.1. RAB Operasional — Pengadaan Barang</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>Nama Barang Operasional</th>
              <th style="width:58px">Satuan</th>
              <th style="width:55px">Jumlah</th>
              <th style="width:92px">Harga Satuan</th>
              <th style="width:105px">Total Anggaran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>${opBarangRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="5" class="r">SUBTOTAL OPERASIONAL BARANG</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalRabOpBarang))}</td>
              <td>${params.rabOperasionalBarang.length} Item</td>
            </tr>
          </tfoot>
        </table>`);
    }

    if (params.gajiKaryawan.length > 0) {
      const gkRows = params.gajiKaryawan
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.nama)} <span class="sub">(${escapeHtml(r.nomorSlip)})</span></td>
            <td>${escapeHtml(r.jabatan)}</td>
            <td class="r">${escapeHtml(formatRupiah(r.gajiPokok))}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.gajiBersih))}</td>
            <td class="c">${escapeHtml(r.statusBayar)}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.2. Jasa — Gaji Karyawan (Rekap Gaji &amp; Slip Harian)</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>Nama Karyawan / No. Slip</th>
              <th>Jabatan</th>
              <th style="width:95px">Gaji Pokok</th>
              <th style="width:105px">Gaji Bersih (THP)</th>
              <th style="width:72px">Status</th>
            </tr>
          </thead>
          <tbody>${gkRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="4" class="r">SUBTOTAL GAJI KARYAWAN (${params.gajiKaryawan.length} Petugas)</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalGajiKaryawan))}</td>
              <td class="c">${escapeHtml(params.selectedDate)}</td>
            </tr>
          </tfoot>
        </table>`);
    }

    if (params.insentifPicLembaga.length > 0) {
      const picSekolahRows = params.insentifPicLembaga
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.nomorKwitansi)}</td>
            <td>${escapeHtml(r.namaPic)}</td>
            <td>${escapeHtml(r.lembaga)}</td>
            <td class="r">${Number(r.jumlahSasaran || 0).toLocaleString('id-ID')} Siswa</td>
            <td class="r b">${escapeHtml(formatRupiah(r.totalInsentif))}</td>
            <td class="c">${escapeHtml(r.statusBayar)}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.3. Jasa — Insentif PIC Lembaga Sekolah (Rekap &amp; Kwitansi)</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>No. Kwitansi</th>
              <th>Nama PIC</th>
              <th>Lembaga Sekolah</th>
              <th style="width:74px">Sasaran</th>
              <th style="width:95px">Total Insentif</th>
              <th style="width:60px">Status</th>
            </tr>
          </thead>
          <tbody>${picSekolahRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="5" class="r">SUBTOTAL INSENTIF PIC LEMBAGA SEKOLAH</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalPicSekolah))}</td>
              <td class="c">${params.insentifPicLembaga.length} PIC</td>
            </tr>
          </tfoot>
        </table>`);
    }

    if (params.insentifPicPosyandu.length > 0) {
      const picPosyanduRows = params.insentifPicPosyandu
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.nomorKwitansi)}</td>
            <td>${escapeHtml(r.namaPic)}</td>
            <td>${escapeHtml(r.lembaga)}</td>
            <td class="r">${Number(r.jumlahSasaran || 0).toLocaleString('id-ID')} PM</td>
            <td class="r b">${escapeHtml(formatRupiah(r.totalInsentif))}</td>
            <td class="c">${escapeHtml(r.statusBayar)}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.4. Jasa — Insentif PIC Posyandu 3B &amp; Balita (Rekap &amp; Kwitansi)</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>No. Kwitansi</th>
              <th>Nama Kader PIC</th>
              <th>Nama Posyandu</th>
              <th style="width:74px">Sasaran</th>
              <th style="width:95px">Total Insentif</th>
              <th style="width:60px">Status</th>
            </tr>
          </thead>
          <tbody>${picPosyanduRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="5" class="r">SUBTOTAL INSENTIF PIC POSYANDU</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalPicPosyandu))}</td>
              <td class="c">${params.insentifPicPosyandu.length} PIC</td>
            </tr>
          </tfoot>
        </table>`);
    }

    if (params.operasionalLainnya.length > 0) {
      const opLainnyaRows = params.operasionalLainnya
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td class="c">${escapeHtml(r.tanggalTransaksi)}</td>
            <td>${escapeHtml(r.namaPengeluaran || '-')}</td>
            <td class="c">${escapeHtml(r.satuan || r.kategori || '-')}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.biayaSatuan !== undefined ? r.biayaSatuan : r.jumlahBiaya))}</td>
            <td>${escapeHtml(r.penanggungJawab)}</td>
            <td>${escapeHtml(r.buktiNota)}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.5. Jasa — Operasional Lainnya (Utilitas &amp; Lab)</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th style="width:72px">Tanggal</th>
              <th>Uraian Pengeluaran</th>
              <th style="width:60px">Satuan</th>
              <th style="width:98px">Biaya Satuan</th>
              <th>Penanggung Jawab</th>
              <th>No. Nota</th>
            </tr>
          </thead>
          <tbody>${opLainnyaRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="4" class="r">SUBTOTAL OPERASIONAL LAINNYA</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalOpLainnya))}</td>
              <td colspan="2">${params.operasionalLainnya.length} Transaksi</td>
            </tr>
          </tfoot>
        </table>`);
    }

    if (params.insentifFasilitas.length > 0) {
      const fasRows = params.insentifFasilitas
        .map(
          (r, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${escapeHtml(r.nomorBa)}</td>
            <td>${escapeHtml(r.namaFasilitas)}</td>
            <td>${escapeHtml(r.pemilikPenyedia)}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.totalInsentif))}</td>
            <td class="c">${escapeHtml(r.status)}</td>
          </tr>`
        )
        .join('');

      opSubBlocks.push(`
        <h4 class="sub-h">2.6. Insentif Fasilitas / Sewa Fasilitas Dapur (Berita Acara &amp; Rekap)</h4>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th>Nomor BAST</th>
              <th>Nama Fasilitas</th>
              <th>Pemilik / Penyedia</th>
              <th style="width:105px">Total Insentif</th>
              <th style="width:65px">Status</th>
            </tr>
          </thead>
          <tbody>${fasRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="4" class="r">SUBTOTAL INSENTIF FASILITAS (Pagu Rp 2.000 &times; ${params.beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM)</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalFasilitas))}</td>
              <td class="c">BAST</td>
            </tr>
          </tfoot>
        </table>`);
    }

    blocks.push(`
      <div class="section">
        <h3 class="sec-h">2. RAB OPERASIONAL (SELURUH SUB MENU)</h3>
        ${opSubBlocks.join('')}
        <div class="sum-strip">
          <span><strong>TOTAL AKUMULASI POS OPERASIONAL (2.1 s/d 2.5):</strong> ${escapeHtml(formatRupiah(totals.totalRabOperasionalSub))}</span>
          <span><strong>PAGU OPERASIONAL (Rp 3.000 &times; PM):</strong> ${escapeHtml(formatRupiah(totals.paguOp))}</span>
        </div>
      </div>`);
  }

  if (sections.realisasiBahanBaku && params.realisasiBahanBaku.length > 0) {
    const rbbRows = params.realisasiBahanBaku
      .map(
        (r, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td class="c">${escapeHtml(r.tanggal)}</td>
          <td>${escapeHtml(r.namaBarang)}</td>
          <td class="r">${Number(r.jumlahRencana || 0).toLocaleString('id-ID')} ${escapeHtml(r.satuan)}</td>
          <td class="r">${Number(r.jumlahRealisasi || 0).toLocaleString('id-ID')} ${escapeHtml(r.satuan)}</td>
          <td class="r">${escapeHtml(formatRupiah(r.hargaSatuanRiil))}</td>
          <td class="r b">${escapeHtml(formatRupiah(r.totalRealisasi))}</td>
          <td class="r">${r.selisih > 0 ? '+' : r.selisih < 0 ? '-' : ''}${escapeHtml(formatRupiah(Math.abs(r.selisih || 0)))}</td>
        </tr>`
      )
      .join('');

    const totalSelisihBb = totals.totalRealisasiBb - totals.totalRencanaRealisasiBb;
    blocks.push(`
      <div class="section">
        <h3 class="sec-h">3. REALISASI BAHAN BAKU (TANGGAL ${escapeHtml(params.selectedDate)})</h3>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th style="width:72px">Tanggal</th>
              <th>Nama Bahan Baku</th>
              <th style="width:72px">Qty Rencana</th>
              <th style="width:72px">Qty Riil</th>
              <th style="width:88px">Harga Riil</th>
              <th style="width:98px">Total Realisasi</th>
              <th style="width:88px">Selisih</th>
            </tr>
          </thead>
          <tbody>${rbbRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="6" class="r">TOTAL REALISASI BAHAN BAKU (${params.realisasiBahanBaku.length} Item)</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalRealisasiBb))}</td>
              <td class="r">${totalSelisihBb > 0 ? '+' : totalSelisihBb < 0 ? '-' : ''}${escapeHtml(formatRupiah(Math.abs(totalSelisihBb)))}</td>
            </tr>
          </tfoot>
        </table>
      </div>`);
  }

  if (sections.realisasiOperasional && params.realisasiOperasional.length > 0) {
    const ropRows = params.realisasiOperasional
      .map((r, i) => {
        const hRiil = getHargaRiilOperasional(r);
        return `
          <tr>
            <td class="c">${i + 1}</td>
            <td class="c">${escapeHtml(r.tanggal)}</td>
            <td>${escapeHtml(r.namaBarang)}</td>
            <td>${escapeHtml(r.kategori)}</td>
            <td class="r">${Number(r.jumlahRiil || 0).toLocaleString('id-ID')} ${escapeHtml(r.satuan)}</td>
            <td class="r">${escapeHtml(formatRupiah(hRiil))}</td>
            <td class="r b">${escapeHtml(formatRupiah(r.biayaRiil))}</td>
            <td class="r">${escapeHtml(formatRupiah(r.anggaranRab))}</td>
            <td>${escapeHtml(r.supplierPetugas || '-')}</td>
          </tr>`;
      })
      .join('');

    blocks.push(`
      <div class="section">
        <h3 class="sec-h">4. REALISASI OPERASIONAL (TANGGAL ${escapeHtml(params.selectedDate)})</h3>
        <table class="rpt-table">
          <thead>
            <tr>
              <th style="width:28px">No</th>
              <th style="width:72px">Tanggal</th>
              <th>Nama Barang Operasional</th>
              <th>Kategori</th>
              <th style="width:68px">Qty Riil</th>
              <th style="width:86px">Harga Riil</th>
              <th style="width:94px">Total Biaya Riil</th>
              <th style="width:88px">Anggaran RAB</th>
              <th>Petugas / Penyedia</th>
            </tr>
          </thead>
          <tbody>${ropRows}</tbody>
          <tfoot>
            <tr class="tot-row">
              <td colspan="6" class="r">TOTAL REALISASI OPERASIONAL (${params.realisasiOperasional.length} Item)</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalRealisasiOp))}</td>
              <td class="r">${escapeHtml(formatRupiah(totals.totalAnggaranRealisasiOp))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Keuangan Akuntan SPPG - ${escapeHtml(params.selectedDate)}</title>
  <style>
    @page { size: A4 portrait; margin: 11mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; color: #0f172a; font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.3; }
    .kop { display: flex; align-items: center; gap: 12px; border-bottom: 2.5px solid #0f172a; padding-bottom: 7px; margin-bottom: 10px; }
    .kop img { width: 48px; height: 48px; object-fit: contain; }
    .kop h1 { margin: 0; font-size: 12pt; font-weight: 700; text-transform: uppercase; }
    .kop h1 span { font-style: italic; font-weight: 600; }
    .kop p { margin: 2px 0 0 0; font-size: 8.5pt; font-weight: 700; }
    .kop .addr { font-size: 8pt; font-weight: 400; }
    .doc-title { text-align: center; margin: 6px 0 8px 0; }
    .doc-title h2 { margin: 0; font-size: 11.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .doc-title p { margin: 2px 0 0 0; font-size: 8.5pt; color: #334155; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 9px; margin-bottom: 10px; font-size: 8.5pt; }
    .section { margin-bottom: 12px; }
    .sec-h { margin: 8px 0 5px 0; padding: 4px 8px; background: #0f766e; color: #fff; font-size: 9.5pt; font-weight: 700; text-transform: uppercase; page-break-after: avoid; }
    .sub-h { margin: 8px 0 4px 0; font-size: 8.8pt; font-weight: 700; color: #0f172a; border-left: 3px solid #0f766e; padding-left: 6px; page-break-after: avoid; }
    .rpt-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 6px; }
    .rpt-table th, .rpt-table td { border: 1px solid #334155; padding: 3.5px 5px; vertical-align: middle; }
    .rpt-table thead th { background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: center; font-size: 7.5pt; text-transform: uppercase; }
    .rpt-table .c { text-align: center; }
    .rpt-table .r { text-align: right; font-variant-numeric: tabular-nums; }
    .rpt-table .b { font-weight: 700; }
    .rpt-table .sub { color: #475569; font-size: 7pt; }
    .rpt-table .empty { text-align: center; font-style: italic; color: #64748b; padding: 8px; }
    .tot-row td { background: #f1f5f9; font-weight: 700; border-top: 1.5px solid #0f172a; }
    .sum-strip { display: flex; justify-content: space-between; gap: 10px; background: #f0fdfa; border: 1px solid #0f766e; padding: 5px 8px; font-size: 8pt; margin-top: 4px; page-break-inside: avoid; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 20px; page-break-inside: avoid; font-size: 9pt; }
    .sig-space { height: 48px; }
    .sig-name { font-weight: 700; margin: 0; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="kop">
    <img src="${logoSrc}" alt="Logo Badan Gizi Nasional" />
    <div>
      <h1>BADAN GIZI NASIONAL <span>(NATIONAL NUTRITION AGENCY)</span></h1>
      <p>SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN &bull; YAYASAN HAFSHAWATY ZAINUL HASAN</p>
      <p class="addr">Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo</p>
    </div>
  </div>
  <div class="doc-title">
    <h2>LAPORAN KEUANGAN TERPADU MODUL AKUNTAN (RAB &amp; REALISASI)</h2>
    <p>Tanggal Operasional: ${escapeHtml(tglLabel)} (${escapeHtml(params.selectedDate)})</p>
  </div>
  <div class="meta-grid">
    <div><strong>Sasaran PM:</strong> ${params.beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM (PB: ${params.beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} | PK: ${params.beneficiaryInfo.porsiKecil.toLocaleString('id-ID')})</div>
    <div><strong>Pagu Harian Total:</strong> ${escapeHtml(formatRupiah(totals.paguTotal))}</div>
    <div><strong>Pagu Bahan Baku:</strong> ${escapeHtml(formatRupiah(totals.paguBb))} | <strong>Pagu Operasional:</strong> ${escapeHtml(formatRupiah(totals.paguOp))}</div>
    <div><strong>Dicetak Pada:</strong> ${escapeHtml(printedAt)}</div>
  </div>
  ${blocks.join('')}
  <div class="sigs">
    <div>
      <div>Disusun Oleh, Akuntan SPPG</div>
      <div class="sig-space"></div>
      <p class="sig-name">Akuntan / Bagian Keuangan SPPG</p>
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
 * EXPORT PDF A4 FOR CETAK LAPORAN AKUNTAN
 */
export const exportLaporanAkuntanToPdf = async (params: LaporanAkuntanParams): Promise<void> => {
  const sections = params.sections || DEFAULT_SECTIONS;
  const totals = computeTotals(params);
  const logoBase64 = await loadImageAsBase64('/badan-gizi-nasional-seeklogo.png');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const drawKop = () => {
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 12, 8, 14, 14);
      } catch {
        // Ignore logo draw error
      }
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)', 29, 12);
    doc.setFontSize(8.5);
    doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN  •  YAYASAN HAFSHAWATY ZAINUL HASAN', 29, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.text('Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo', 29, 20);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.line(12, 23, 198, 23);
  };

  drawKop();

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN KEUANGAN TERPADU MODUL AKUNTAN (RAB & REALISASI)', 105, 29, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Tanggal Operasional: ${formatTanggalIndo(params.selectedDate)} (${params.selectedDate})`,
    105,
    33.5,
    { align: 'center' }
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(12, 36.5, 186, 13, 'FD');
  doc.setFontSize(8);
  doc.text(
    `Sasaran PM: ${params.beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM (PB: ${params.beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} | PK: ${params.beneficiaryInfo.porsiKecil.toLocaleString('id-ID')})`,
    15,
    41.5
  );
  doc.text(
    `Pagu Bahan Baku: ${formatRupiah(totals.paguBb)}   |   Pagu Operasional: ${formatRupiah(totals.paguOp)}   |   Pagu Total: ${formatRupiah(totals.paguTotal)}`,
    15,
    46.5
  );

  let currentY = 54;

  const ensureSpace = (minSpace = 36) => {
    if (currentY > 280 - minSpace) {
      doc.addPage('a4', 'portrait');
      drawKop();
      currentY = 29;
    }
  };

  const drawSectionBanner = (title: string) => {
    ensureSpace(35);
    doc.setFillColor(15, 118, 110);
    doc.rect(12, currentY, 186, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(title, 15, currentY + 4.4);
    doc.setTextColor(15, 23, 42);
    currentY += 8.5;
  };

  const drawSubTitle = (title: string) => {
    ensureSpace(26);
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 12, currentY);
    currentY += 2;
  };

  const runTable = (head: any[][], body: any[][], foot?: any[][], colStyles?: Record<number, any>) => {
    autoTable(doc, {
      startY: currentY,
      margin: { left: 12, right: 12 },
      theme: 'grid',
      head,
      body,
      foot,
      showFoot: foot ? 'lastPage' : 'never',
      styles: {
        font: 'times',
        fontSize: 7.5,
        textColor: [15, 23, 42],
        lineColor: [71, 85, 105],
        lineWidth: 0.2,
        cellPadding: 1.4,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7.2
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: colStyles || {},
      didDrawPage: () => {
        // subsequent pages keep clean margin
      }
    });
    currentY = ((doc as any).lastAutoTable?.finalY || currentY + 20) + 6;
  };

  // 1. RAB BAHAN BAKU
  if (sections.rabBahanBaku && params.rabBahanBaku.length > 0) {
    drawSectionBanner('1. RAB BAHAN BAKU PANGAN');
    const body = params.rabBahanBaku.map((r, i) => {
      const qty = r.pembulatan !== undefined ? r.pembulatan : r.totalKebutuhanKg || 0;
      return [
        i + 1,
        r.namaBarang,
        Number(qty).toLocaleString('id-ID'),
        r.satuan,
        formatRupiah(r.hargaSatuan),
        formatRupiah(r.totalAnggaran),
        r.keterangan || '-'
      ];
    });
    runTable(
      [['No', 'Nama Bahan Baku', 'Jumlah', 'Satuan', 'Harga Satuan', 'Total Anggaran', 'Keterangan']],
      body,
      [[
        { content: 'TOTAL RAB BAHAN BAKU', colSpan: 5, styles: { halign: 'right' } },
        { content: formatRupiah(totals.totalRabBb), styles: { halign: 'right' } },
        `Pagu: ${formatRupiah(totals.paguBb)}`
      ]],
      {
        0: { cellWidth: 9, halign: 'center' },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    );
  }

  // 2. RAB OPERASIONAL (SELURUH SUB MENU)
  const hasRabOpDataPdf =
    params.rabOperasionalBarang.length > 0 ||
    params.gajiKaryawan.length > 0 ||
    params.insentifPicLembaga.length > 0 ||
    params.insentifPicPosyandu.length > 0 ||
    params.operasionalLainnya.length > 0 ||
    params.insentifFasilitas.length > 0;

  if (sections.rabOperasional && hasRabOpDataPdf) {
    drawSectionBanner('2. RAB OPERASIONAL (SELURUH SUB MENU)');

    // 2.1 Barang
    if (params.rabOperasionalBarang.length > 0) {
      drawSubTitle('2.1. RAB Operasional — Pengadaan Barang');
      runTable(
        [['No', 'Nama Barang Operasional', 'Satuan', 'Jumlah', 'Harga Satuan', 'Total Anggaran', 'Keterangan']],
        params.rabOperasionalBarang.map((r, i) => [
          i + 1,
          r.namaBarang || '-',
          r.satuan,
          Number(r.jumlah || 0).toLocaleString('id-ID'),
          formatRupiah(r.hargaSatuan),
          formatRupiah(r.totalAnggaran),
          r.keterangan || r.periode || '-'
        ]),
        [[
          { content: 'SUBTOTAL OPERASIONAL BARANG', colSpan: 5, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalRabOpBarang), styles: { halign: 'right' } },
          `${params.rabOperasionalBarang.length} Item`
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 14, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
        }
      );
    }

    // 2.2 Gaji Karyawan
    if (params.gajiKaryawan.length > 0) {
      drawSubTitle('2.2. Jasa — Gaji Karyawan (Rekap Gaji & Slip Harian)');
      runTable(
        [['No', 'Nama Karyawan / No. Slip', 'Jabatan', 'Gaji Pokok', 'Gaji Bersih (THP)', 'Status']],
        params.gajiKaryawan.map((r, i) => [
          i + 1,
          `${r.nama}\n(${r.nomorSlip})`,
          r.jabatan,
          formatRupiah(r.gajiPokok),
          formatRupiah(r.gajiBersih),
          r.statusBayar
        ]),
        [[
          { content: `SUBTOTAL GAJI KARYAWAN (${params.gajiKaryawan.length} Petugas)`, colSpan: 4, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalGajiKaryawan), styles: { halign: 'right' } },
          { content: params.selectedDate, styles: { halign: 'center' } }
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          3: { cellWidth: 26, halign: 'right' },
          4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center' }
        }
      );
    }

    // 2.3 PIC Lembaga
    if (params.insentifPicLembaga.length > 0) {
      drawSubTitle('2.3. Jasa — Insentif PIC Lembaga Sekolah (Rekap & Kwitansi)');
      runTable(
        [['No', 'No. Kwitansi', 'Nama PIC', 'Lembaga Sekolah', 'Sasaran', 'Total Insentif', 'Status']],
        params.insentifPicLembaga.map((r, i) => [
          i + 1,
          r.nomorKwitansi,
          r.namaPic,
          r.lembaga,
          `${Number(r.jumlahSasaran || 0).toLocaleString('id-ID')} Siswa`,
          formatRupiah(r.totalInsentif),
          r.statusBayar
        ]),
        [[
          { content: 'SUBTOTAL INSENTIF PIC SEKOLAH', colSpan: 5, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalPicSekolah), styles: { halign: 'right' } },
          { content: `${params.insentifPicLembaga.length} PIC`, styles: { halign: 'center' } }
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 16, halign: 'center' }
        }
      );
    }

    // 2.4 PIC Posyandu
    if (params.insentifPicPosyandu.length > 0) {
      drawSubTitle('2.4. Jasa — Insentif PIC Posyandu 3B & Balita (Rekap & Kwitansi)');
      runTable(
        [['No', 'No. Kwitansi', 'Nama Kader PIC', 'Nama Posyandu', 'Sasaran', 'Total Insentif', 'Status']],
        params.insentifPicPosyandu.map((r, i) => [
          i + 1,
          r.nomorKwitansi,
          r.namaPic,
          r.lembaga,
          `${Number(r.jumlahSasaran || 0).toLocaleString('id-ID')} PM`,
          formatRupiah(r.totalInsentif),
          r.statusBayar
        ]),
        [[
          { content: 'SUBTOTAL INSENTIF PIC POSYANDU', colSpan: 5, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalPicPosyandu), styles: { halign: 'right' } },
          { content: `${params.insentifPicPosyandu.length} PIC`, styles: { halign: 'center' } }
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 16, halign: 'center' }
        }
      );
    }

    // 2.5 Operasional Lainnya
    if (params.operasionalLainnya.length > 0) {
      drawSubTitle('2.5. Jasa — Operasional Lainnya (Utilitas & Lab)');
      runTable(
        [['No', 'Tanggal', 'Uraian Pengeluaran', 'Satuan', 'Biaya Satuan', 'Penanggung Jawab', 'No. Nota']],
        params.operasionalLainnya.map((r, i) => [
          i + 1,
          r.tanggalTransaksi,
          r.namaPengeluaran || '-',
          r.satuan || r.kategori || '-',
          formatRupiah(r.biayaSatuan !== undefined ? r.biayaSatuan : r.jumlahBiaya),
          r.penanggungJawab,
          r.buktiNota
        ]),
        [[
          { content: 'SUBTOTAL OPERASIONAL LAINNYA', colSpan: 4, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalOpLainnya), styles: { halign: 'right' } },
          { content: `${params.operasionalLainnya.length} Transaksi`, colSpan: 2 }
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          1: { cellWidth: 21, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
        }
      );
    }

    // 2.6 Insentif Fasilitas
    if (params.insentifFasilitas.length > 0) {
      drawSubTitle('2.6. Insentif Fasilitas / Sewa Fasilitas Dapur (Berita Acara & Rekap)');
      runTable(
        [['No', 'Nomor BAST', 'Nama Fasilitas', 'Pemilik / Penyedia', 'Total Insentif', 'Status']],
        params.insentifFasilitas.map((r, i) => [
          i + 1,
          r.nomorBa,
          r.namaFasilitas,
          r.pemilikPenyedia,
          formatRupiah(r.totalInsentif),
          r.status
        ]),
        [[
          { content: 'SUBTOTAL INSENTIF FASILITAS', colSpan: 4, styles: { halign: 'right' } },
          { content: formatRupiah(totals.totalFasilitas), styles: { halign: 'right' } },
          { content: 'BAST', styles: { halign: 'center' } }
        ]],
        {
          0: { cellWidth: 9, halign: 'center' },
          4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 18, halign: 'center' }
        }
      );
    }
  }

  // 3. REALISASI BAHAN BAKU
  if (sections.realisasiBahanBaku && params.realisasiBahanBaku.length > 0) {
    drawSectionBanner(`3. REALISASI BAHAN BAKU (TANGGAL ${params.selectedDate})`);
    const totalSelisihBb = totals.totalRealisasiBb - totals.totalRencanaRealisasiBb;
    runTable(
      [['No', 'Tanggal', 'Nama Bahan Baku', 'Qty Rencana', 'Qty Riil', 'Harga Riil', 'Total Realisasi', 'Selisih']],
      params.realisasiBahanBaku.map((r, i) => [
        i + 1,
        r.tanggal,
        r.namaBarang,
        `${Number(r.jumlahRencana || 0).toLocaleString('id-ID')} ${r.satuan}`,
        `${Number(r.jumlahRealisasi || 0).toLocaleString('id-ID')} ${r.satuan}`,
        formatRupiah(r.hargaSatuanRiil),
        formatRupiah(r.totalRealisasi),
        `${r.selisih > 0 ? '+' : r.selisih < 0 ? '-' : ''}${formatRupiah(Math.abs(r.selisih || 0))}`
      ]),
      [[
        { content: `TOTAL REALISASI BAHAN BAKU (${params.realisasiBahanBaku.length} Item)`, colSpan: 6, styles: { halign: 'right' } },
        { content: formatRupiah(totals.totalRealisasiBb), styles: { halign: 'right' } },
        { content: `${totalSelisihBb > 0 ? '+' : totalSelisihBb < 0 ? '-' : ''}${formatRupiah(Math.abs(totalSelisihBb))}`, styles: { halign: 'right' } }
      ]],
      {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 23, halign: 'right' },
        6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 23, halign: 'right' }
      }
    );
  }

  // 4. REALISASI OPERASIONAL
  if (sections.realisasiOperasional && params.realisasiOperasional.length > 0) {
    drawSectionBanner(`4. REALISASI OPERASIONAL (TANGGAL ${params.selectedDate})`);
    runTable(
      [['No', 'Tanggal', 'Nama Barang Operasional', 'Kategori', 'Qty Riil', 'Harga Riil', 'Total Biaya Riil', 'Anggaran RAB', 'Petugas / Penyedia']],
      params.realisasiOperasional.map((r, i) => [
        i + 1,
        r.tanggal,
        r.namaBarang,
        r.kategori,
        `${Number(r.jumlahRiil || 0).toLocaleString('id-ID')} ${r.satuan}`,
        formatRupiah(getHargaRiilOperasional(r)),
        formatRupiah(r.biayaRiil),
        formatRupiah(r.anggaranRab),
        r.supplierPetugas || '-'
      ]),
      [[
        { content: `TOTAL REALISASI OPERASIONAL (${params.realisasiOperasional.length} Item)`, colSpan: 6, styles: { halign: 'right' } },
        { content: formatRupiah(totals.totalRealisasiOp), styles: { halign: 'right' } },
        { content: formatRupiah(totals.totalAnggaranRealisasiOp), styles: { halign: 'right' } },
        ''
      ]],
      {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 19, halign: 'center' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 21, halign: 'right' },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 23, halign: 'right' }
      }
    );
  }

  // Signature block
  ensureSpace(34);
  const sigY = currentY + 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Disusun Oleh, Akuntan SPPG', 52, sigY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Akuntan / Bagian Keuangan SPPG', 52, sigY + 18, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.text('Mengetahui, Kepala SPPG', 158, sigY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('Sri Rohayu, S.Pd', 158, sigY + 18, { align: 'center' });

  doc.save(`Laporan_Keuangan_Akuntan_SPPG_${params.selectedDate}.pdf`);
};
