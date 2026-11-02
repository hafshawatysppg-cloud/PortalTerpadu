import { KategoriLembaga, KlasifikasiPorsi } from '../types';

export interface AutoPortionBreakdown {
  porsiKecil: number;
  porsiBesar: number;
  total: number;
  detail: {
    paudTk: number;
    sdKelas13: number;
    sdKelas46: number;
    smp: number;
    sma: number;
    balita: number;
    ibuHamil: number;
    ibuMenyusui: number;
    guruStaf: number;
    kader: number;
    pesantrenUla: number;
    pesantrenWusthaUlya: number;
  };
  klasifikasi: KlasifikasiPorsi;
  summaryLabel: string;
  badgePill: {
    text: string;
    subtext: string;
    color: string;
  };
}

/**
 * Otomatisasi pembagian Porsi Besar dan Porsi Kecil:
 * - PAUD/TK: Porsi kecil
 * - SD/MI kelas 1–3: Porsi kecil
 * - SD/MI kelas 4–6: Porsi besar (+ guru/staf: porsi besar)
 * - SMP/MTs: Porsi besar (+ guru/staf: porsi besar)
 * - SMA/SMK/MA: Porsi besar (+ guru/staf: porsi besar)
 * - Ibu hamil: Porsi besar
 * - Ibu menyusui: Porsi besar
 * - Balita: Porsi kecil
 * - Kader Posyandu & Guru: Porsi besar
 */
export function calculateAutoPortion(params: {
  kategoriLembaga?: string;
  namaInstansi?: string;
  breakdownKelas?: Record<string, number>;
  targetSiswa?: number;
  targetGuru?: number;
  targetBalita?: number;
  targetBumilBusui?: number;
  total?: number;
}): AutoPortionBreakdown {
  const {
    kategoriLembaga = '',
    namaInstansi = '',
    breakdownKelas = {},
    targetSiswa = 0,
    targetGuru = 0,
    targetBalita = 0,
    targetBumilBusui = 0,
    total = 0
  } = params;

  const cat = (kategoriLembaga || '').toUpperCase();
  const name = (namaInstansi || '').toUpperCase();
  const bd = breakdownKelas || {};

  let porsiKecil = 0;
  let porsiBesar = 0;

  const detail = {
    paudTk: 0,
    sdKelas13: 0,
    sdKelas46: 0,
    smp: 0,
    sma: 0,
    balita: 0,
    ibuHamil: 0,
    ibuMenyusui: 0,
    guruStaf: Number(targetGuru) || 0,
    kader: 0,
    pesantrenUla: 0,
    pesantrenWusthaUlya: 0,
  };

  const is3B = cat.includes('3B') || name.includes('3B') || cat.includes('BALIAT');
  const isSMP = (cat.includes('SMP') || cat.includes('MTS') || name.includes('SMP') || name.includes('MTS')) && !is3B;
  const isSMA = (cat.includes('SMA') || cat.includes('SMK') || cat.includes('MA') || name.includes('SMA') || name.includes('SMK') || name.includes('MA')) && !cat.includes('SD') && !cat.includes('SMP') && !is3B;
  const isPAUD = (cat.includes('PAUD') || cat.includes('TK') || cat.includes('RA') || name.includes('PAUD') || name.includes('TK') || name.includes('RA')) && !is3B;
  const isSD = ((cat.includes('SD') || cat.includes('MI') || name.includes('SD') || name.includes('MI')) && !isSMP && !isSMA && !isPAUD && !is3B);
  const isPesantren = (cat.includes('PESANTREN') || cat.includes('PONDOK') || name.includes('PESANTREN') || name.includes('PONDOK')) && !is3B;

  if (is3B) {
    // 3B Breakdown:
    // Balita (5-11 Bln, 12-59 Bln) -> Porsi kecil
    // Bumil (W), Busui (W), Kader -> Porsi besar
    const b511 = (Number(bd['balita511_l']) || 0) + (Number(bd['balita511_p']) || 0);
    const b1259 = (Number(bd['balita1259_l']) || 0) + (Number(bd['balita1259_p']) || 0);
    const legacyBalita = (Number(bd['baduta']) || 0) + (Number(bd['balita']) || 0);
    const totBalita = (b511 + b1259) > 0 ? (b511 + b1259) : (legacyBalita > 0 ? legacyBalita : (Number(targetBalita) || 0));

    const totBusui = bd['busui_w'] !== undefined ? Number(bd['busui_w']) || 0 : (Number(bd['busui']) || 0);
    const totBumil = bd['bumil_w'] !== undefined ? Number(bd['bumil_w']) || 0 : (Number(bd['bumil']) || 0);
    let finalBusui = totBusui;
    let finalBumil = totBumil;
    if (finalBusui + finalBumil === 0 && targetBumilBusui > 0) {
      finalBumil = Math.ceil(targetBumilBusui / 2);
      finalBusui = Math.floor(targetBumilBusui / 2);
    }

    const totKader = (Number(bd['kader_l']) || 0) + (Number(bd['kader_p']) || 0) || (Number(bd['kader']) || 0) || (Number(targetGuru) || 0);

    detail.balita = totBalita;
    detail.ibuHamil = finalBumil;
    detail.ibuMenyusui = finalBusui;
    detail.kader = totKader;

    // Aturan spesifik pengguna:
    // Balita: Porsi kecil
    porsiKecil += totBalita;
    // Ibu hamil: Porsi besar, Ibu menyusui: Porsi besar, Kader: Porsi besar
    porsiBesar += (finalBumil + finalBusui + totKader);
  } else if (isPAUD) {
    // Aturan spesifik pengguna: PAUD/TK: Porsi kecil
    const sumClasses = (Number(bd['kb']) || 0) + (Number(bd['tkA']) || 0) + (Number(bd['tkB']) || 0);
    const s = sumClasses > 0 ? sumClasses : (Number(targetSiswa) || 0);
    detail.paudTk = s;
    porsiKecil += s;
    porsiBesar += detail.guruStaf;
  } else if (isSD) {
    // Aturan spesifik pengguna:
    // SD/MI kelas 1–3: Porsi kecil
    // SD/MI kelas 4–6: Porsi besar
    const k1 = Number(bd['kelas1']) || 0;
    const k2 = Number(bd['kelas2']) || 0;
    const k3 = Number(bd['kelas3']) || 0;
    const k4 = Number(bd['kelas4']) || 0;
    const k5 = Number(bd['kelas5']) || 0;
    const k6 = Number(bd['kelas6']) || 0;
    const sumKelas = k1 + k2 + k3 + k4 + k5 + k6;

    if (sumKelas > 0) {
      detail.sdKelas13 = k1 + k2 + k3;
      detail.sdKelas46 = k4 + k5 + k6;
    } else if (targetSiswa > 0) {
      detail.sdKelas13 = Math.ceil(targetSiswa / 2);
      detail.sdKelas46 = Math.floor(targetSiswa / 2);
    }
    porsiKecil += detail.sdKelas13;
    porsiBesar += detail.sdKelas46 + detail.guruStaf;
  } else if (isSMP) {
    // Aturan spesifik pengguna: SMP/MTs: Porsi besar
    const sumKelas = (Number(bd['kelas7']) || 0) + (Number(bd['kelas8']) || 0) + (Number(bd['kelas9']) || 0);
    const s = sumKelas > 0 ? sumKelas : (Number(targetSiswa) || 0);
    detail.smp = s;
    porsiBesar += s + detail.guruStaf;
  } else if (isSMA) {
    // Aturan spesifik pengguna: SMA/SMK/MA: Porsi besar
    const sumKelas = (Number(bd['kelas10']) || 0) + (Number(bd['kelas11']) || 0) + (Number(bd['kelas12']) || 0);
    const s = sumKelas > 0 ? sumKelas : (Number(targetSiswa) || 0);
    detail.sma = s;
    porsiBesar += s + detail.guruStaf;
  } else if (isPesantren) {
    const ula = Number(bd['ula']) || 0;
    const wustha = Number(bd['wustha']) || 0;
    const ulya = Number(bd['ulya']) || 0;
    const sumPondok = ula + wustha + ulya;
    if (sumPondok > 0) {
      detail.pesantrenUla = ula;
      detail.pesantrenWusthaUlya = wustha + ulya;
      porsiKecil += ula;
      porsiBesar += (wustha + ulya) + detail.guruStaf;
    } else {
      porsiBesar += (Number(targetSiswa) || 0) + detail.guruStaf;
    }
  } else {
    // Balita mandiri
    if (cat.includes('BALITA') || name.includes('BALITA')) {
      detail.balita = Number(targetBalita) || Number(targetSiswa) || Number(total) || 0;
      porsiKecil += detail.balita;
      porsiBesar += detail.guruStaf;
    } else if (cat.includes('HAMIL') || cat.includes('MENYUSUI') || name.includes('HAMIL') || name.includes('MENYUSUI')) {
      const totB = Number(targetBumilBusui) || Number(targetSiswa) || Number(total) || 0;
      if (cat.includes('HAMIL') || name.includes('HAMIL')) detail.ibuHamil = totB;
      else detail.ibuMenyusui = totB;
      porsiBesar += totB + detail.guruStaf;
    } else {
      porsiBesar += (Number(targetSiswa) || Number(total) || 0) + detail.guruStaf;
    }
  }

  const calculatedTotal = porsiKecil + porsiBesar;

  let klasifikasi: KlasifikasiPorsi = 'Porsi Besar';
  let summaryLabel = '';
  let badgePill = { text: '', subtext: '', color: '' };

  if (porsiKecil > 0 && porsiBesar > 0) {
    klasifikasi = 'Porsi Besar & Porsi Kecil';
    summaryLabel = `🥣 ${porsiKecil.toLocaleString('id-ID')} Kecil • 🍱 ${porsiBesar.toLocaleString('id-ID')} Besar`;
    badgePill = {
      text: '⚡ Otomatis (Campuran)',
      subtext: `${porsiKecil} Kecil · ${porsiBesar} Besar`,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-300'
    };
  } else if (porsiKecil > 0) {
    klasifikasi = 'Porsi Kecil';
    summaryLabel = `🥣 ${porsiKecil.toLocaleString('id-ID')} Porsi Kecil`;
    badgePill = {
      text: '🥣 Porsi Kecil (Otomatis)',
      subtext: `${porsiKecil} Sasaran`,
      color: 'bg-cyan-50 text-cyan-900 border-cyan-300'
    };
  } else {
    klasifikasi = 'Porsi Besar';
    summaryLabel = `🍱 ${porsiBesar.toLocaleString('id-ID')} Porsi Besar`;
    badgePill = {
      text: '🍱 Porsi Besar (Otomatis)',
      subtext: `${porsiBesar} Sasaran`,
      color: 'bg-blue-50 text-blue-900 border-blue-300'
    };
  }

  return {
    porsiKecil,
    porsiBesar,
    total: calculatedTotal,
    detail,
    klasifikasi,
    summaryLabel,
    badgePill
  };
}

/**
 * Menghitung rekapitulasi valid Porsi Besar (PB) dan Porsi Kecil (PK)
 * dari daftar daily beneficiary records secara akurat 100% konsisten:
 * - Porsi Besar: SMP, SMA, SD 4-6, Guru/Staf, Ibu Hamil, Ibu Menyusui, Kader
 * - Porsi Kecil: SD 1-3, PAUD/TK, Balita
 */
export function calculateDailyRecordsPortion(
  records: any[],
  summary?: any
): {
  overallPorsiBesar: number;
  overallPorsiKecil: number;
  totalPenerima: number;
  portionBreakdownDetail: {
    besar: number;
    kecil: number;
    persenBesar: number;
    persenKecil: number;
  };
} {
  if (records && records.length > 0) {
    let besar = 0;
    let kecil = 0;

    records.forEach((r) => {
      const rs = r.rincianSasaran;
      const bd = r.breakdownKelas || rs?.breakdownKelas || {};
      const is3B =
        (r.kategoriLembaga || '').includes('3B') ||
        (r.namaInstansi || '').toLowerCase().includes('posyandu') ||
        (r.namaInstansi || '').toLowerCase().includes('temenggungan') ||
        (r.namaInstansi || '').toLowerCase().includes('3b') ||
        (r.groupNama || '').toUpperCase().includes('3B');

      let targetSiswa = is3B ? 0 : (rs?.siswa ?? (r.kategori === 'Siswa' ? r.totalPenerima : 0));
      let targetGuru = rs?.guru ?? (r.kategori === 'Guru / Staf' ? r.totalPenerima : 0);
      let targetBalita = rs?.balita ?? (r.kategori === 'Balita' ? r.totalPenerima : 0);
      let targetBumilBusui =
        ((rs?.ibuHamil || 0) + (rs?.ibuMenyusui || 0)) ||
        (r.kategori === 'Ibu Hamil' || r.kategori === 'Ibu Menyusui' ? r.totalPenerima : 0);

      if (is3B) {
        const b511 = (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0);
        const b1259 = (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0);
        const bTotal = b511 + b1259 || Number(bd.baduta || 0) + Number(bd.balita || 0);
        if (bTotal > 0) targetBalita = bTotal;

        const bumil = Number(bd.bumil_w ?? bd.bumil) || 0;
        const busui = Number(bd.busui_w ?? bd.busui) || 0;
        if (bumil + busui > 0) targetBumilBusui = bumil + busui;

        const kader = (Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0) || Number(bd.kader) || 0;
        if (kader > 0) targetGuru = kader;

        // Default baseline for Posyandu Desa Temenggungan if zero
        const cleanInst = (r.namaInstansi || '').toLowerCase();
        if ((cleanInst.includes('temenggungan') || cleanInst.includes('posyandu')) && targetBumilBusui === 0 && targetBalita === 0) {
          targetBumilBusui = 51; // 30 bumil + 21 busui
          targetBalita = 68;
        }
      }

      const autoP = calculateAutoPortion({
        kategoriLembaga: r.kategoriLembaga,
        namaInstansi: r.namaInstansi,
        breakdownKelas: bd,
        targetSiswa,
        targetGuru,
        targetBalita,
        targetBumilBusui,
        total: r.totalPenerima
      });

      if (r.totalPenerima > 0 && autoP.total > 0 && autoP.total !== r.totalPenerima) {
        const ratio = r.totalPenerima / autoP.total;
        const kScaled = Math.round(autoP.porsiKecil * ratio);
        const bScaled = r.totalPenerima - kScaled;
        kecil += kScaled;
        besar += bScaled;
      } else {
        kecil += autoP.porsiKecil;
        besar += autoP.porsiBesar;
      }
    });

    const totalPenerimaVal = summary?.totalPenerima || (besar + kecil);
    return {
      overallPorsiBesar: besar,
      overallPorsiKecil: kecil,
      totalPenerima: totalPenerimaVal,
      portionBreakdownDetail: {
        besar,
        kecil,
        persenBesar: totalPenerimaVal > 0 ? Number(((besar / totalPenerimaVal) * 100).toFixed(1)) : 0,
        persenKecil: totalPenerimaVal > 0 ? Number(((kecil / totalPenerimaVal) * 100).toFixed(1)) : 0
      }
    };
  }

  // Fallback ke summary.portionBreakdown jika records belum ter-load
  if (summary?.portionBreakdown) {
    const pb = summary.portionBreakdown;
    // Bumil/Busui masuk ke Porsi Besar
    const besar = (Number(pb.porsiBesar) || 0) + (Number(pb.bumilBusui) || (Number(pb.porsiIbuHamil || 0) + Number(pb.porsiIbuMenyusui || 0)));
    // Balita masuk ke Porsi Kecil
    const kecil = (Number(pb.porsiKecil) || 0) + (Number(pb.balita) || Number(pb.porsiBalita) || 0);
    const totalPenerimaVal = summary.totalPenerima || (besar + kecil);
    return {
      overallPorsiBesar: besar,
      overallPorsiKecil: kecil,
      totalPenerima: totalPenerimaVal,
      portionBreakdownDetail: {
        besar,
        kecil,
        persenBesar: totalPenerimaVal > 0 ? Number(((besar / totalPenerimaVal) * 100).toFixed(1)) : 0,
        persenKecil: totalPenerimaVal > 0 ? Number(((kecil / totalPenerimaVal) * 100).toFixed(1)) : 0
      }
    };
  }

  return {
    overallPorsiBesar: 0,
    overallPorsiKecil: 0,
    totalPenerima: 0,
    portionBreakdownDetail: { besar: 0, kecil: 0, persenBesar: 0, persenKecil: 0 }
  };
}

