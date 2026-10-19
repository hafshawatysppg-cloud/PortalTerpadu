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
