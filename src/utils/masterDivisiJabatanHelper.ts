import { MasterDivisi, MasterJabatan } from '../types';

export interface MasterDivisiJabatanOption {
  divisiId: string;
  kodeDivisi: string;
  namaDivisi: string;
  jabatan: string;
  kepalaDivisi: string;
  isMasterDivisi: boolean;
}

export interface ResolvedJabatanDivisi {
  jabatan: string;
  divisi: string;
  kodeDivisi: string;
  divisiId: string;
  kepalaDivisi: string;
  matchedMaster: boolean;
}

const cleanText = (val?: string | null): string => String(val || '').trim();

const LEGACY_PLACEHOLDER_DIVISI_REGEX = /^(dapur\s*&\s*distribusi|staf operasional|petugas operasional dapur)$/i;

/**
 * Membangun daftar opsi Jenis Jabatan yang tersinkronisasi langsung dengan Master Divisi & Master Jabatan.
 * Sumber utama: Master Divisi (`divisiList`), dihubungkan via `jabatanId` atau `kode` ke `jabatanList`.
 */
export function buildMasterDivisiJabatanOptions(
  divisiList: Array<Partial<MasterDivisi>> = [],
  jabatanList: Array<Partial<MasterJabatan>> = []
): MasterDivisiJabatanOption[] {
  const options: MasterDivisiJabatanOption[] = [];
  const seenKeys = new Set<string>();

  const jabById = new Map<string, Partial<MasterJabatan>>();
  const jabByKode = new Map<string, Partial<MasterJabatan>>();
  for (const j of jabatanList || []) {
    const jId = cleanText(j?.id);
    const jKode = cleanText(j?.kode).toUpperCase();
    if (jId) jabById.set(jId, j);
    if (jKode) jabByKode.set(jKode, j);
  }

  for (const d of divisiList || []) {
    const namaDivisi = cleanText(d?.nama);
    const kodeDivisi = cleanText(d?.kode).toUpperCase();
    const jabId = cleanText(d?.jabatanId);
    const linkedJab =
      (jabId ? jabById.get(jabId) : undefined) ||
      (kodeDivisi ? jabByKode.get(kodeDivisi) : undefined);

    const canonicalJabatan =
      cleanText(linkedJab?.nama) ||
      cleanText(d?.jabatanNama) ||
      namaDivisi;

    if (!canonicalJabatan && !namaDivisi) continue;

    const finalJabatan = canonicalJabatan || namaDivisi;
    const finalDivisi = namaDivisi || canonicalJabatan;
    const dedupKey = `${kodeDivisi}|${finalJabatan.toLowerCase()}|${finalDivisi.toLowerCase()}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    options.push({
      divisiId: cleanText(d?.id) || `DIV-${kodeDivisi || options.length + 1}`,
      kodeDivisi: kodeDivisi || cleanText(linkedJab?.kode).toUpperCase(),
      namaDivisi: finalDivisi,
      jabatan: finalJabatan,
      kepalaDivisi: cleanText(d?.kepalaDivisi),
      isMasterDivisi: true
    });
  }

  // Sertakan Master Jabatan tambahan yang belum tertaut ke baris Master Divisi mana pun
  for (const j of jabatanList || []) {
    const jNama = cleanText(j?.nama);
    const jKode = cleanText(j?.kode).toUpperCase();
    if (!jNama) continue;
    const alreadyCovered = options.some(
      (opt) =>
        opt.jabatan.toLowerCase() === jNama.toLowerCase() ||
        (jKode && opt.kodeDivisi === jKode)
    );
    if (!alreadyCovered) {
      options.push({
        divisiId: cleanText(j?.id) || `JAB-${options.length + 1}`,
        kodeDivisi: jKode,
        namaDivisi: cleanText(j?.divisiNama) || jNama,
        jabatan: jNama,
        kepalaDivisi: '',
        isMasterDivisi: false
      });
    }
  }

  return options;
}

interface KeywordRule {
  kodes: string[];
  optionKeywords: string[];
  inputPatterns: string[];
}

const SEMANTIC_DIVISION_RULES: KeywordRule[] = [
  {
    kodes: ['OLAH', 'MASAK'],
    optionKeywords: ['pengolahan', 'masak'],
    inputPatterns: ['pengolahan', 'asisten juru masak', 'cook helper', 'asisten masak']
  },
  {
    kodes: ['CHEF', 'KJM', 'KOKI'],
    optionKeywords: ['head chef', 'chef', 'kepala juru masak', 'kepala koki'],
    inputPatterns: ['head chef', 'kepala chef', 'kepala juru masak', 'kepala koki', 'chef']
  },
  {
    kodes: ['OMP', 'CUCI'],
    optionKeywords: ['cuci ompreng', 'ompreng'],
    inputPatterns: ['cuci ompreng', 'ompreng', 'cuci & higiene', 'petugas cuci']
  },
  {
    kodes: ['SIAP', 'PREP'],
    optionKeywords: ['persiapan', 'preparasi'],
    inputPatterns: ['persiapan', 'preparasi']
  },
  {
    kodes: ['PORSI', 'PACK'],
    optionKeywords: ['pemorsian', 'porsi'],
    inputPatterns: ['pemorsian', 'tim pemorsian', 'pemorsian & packing']
  },
  {
    kodes: ['DIS', 'DIST', 'DST'],
    optionKeywords: ['distribusi'],
    inputPatterns: ['distribusi', 'driver distribusi', 'armada', 'driver']
  },
  {
    kodes: ['ASLAP'],
    optionKeywords: ['asisten lapangan'],
    inputPatterns: ['asisten lapangan', 'aslap']
  },
  {
    kodes: ['PLOG', 'GIZI'],
    optionKeywords: ['pengawas gizi', 'ahli gizi', 'gizi'],
    inputPatterns: ['pengawas gizi', 'ahli gizi', 'pengawas mutu', 'gizi']
  },
  {
    kodes: ['PLOK', 'KEU', 'KEU-PK'],
    optionKeywords: ['pengawas keuangan', 'keuangan', 'bendahara'],
    inputPatterns: ['pengawas keuangan', 'keuangan', 'bendahara', 'administrasi sppg', 'akuntan']
  },
  {
    kodes: ['KA.SPPG', 'KA-SPPG', 'KSPPG'],
    optionKeywords: ['ka. sppg', 'kepala sppg', 'ka sppg'],
    inputPatterns: ['kepala sppg', 'ka. sppg', 'ka sppg']
  },
  {
    kodes: ['BRS', 'KEB', 'SAN'],
    optionKeywords: ['kebersihan', 'lingkungan', 'cleaning'],
    inputPatterns: ['kebersihan', 'lingkungan', 'cleaning']
  },
  {
    kodes: ['SEC', 'KEAM', 'SATPAM'],
    optionKeywords: ['security', 'keamanan', 'satpam'],
    inputPatterns: ['security', 'keamanan', 'satpam']
  },
  {
    kodes: ['LOG', 'GDG'],
    optionKeywords: ['logistik', 'gudang'],
    inputPatterns: ['logistik', 'gudang']
  }
];

function findOptionByCandidateText(
  candidateText: string,
  candidateKode: string,
  options: MasterDivisiJabatanOption[]
): MasterDivisiJabatanOption | null {
  if (options.length === 0) return null;

  const cleanKode = cleanText(candidateKode).toUpperCase();
  if (cleanKode) {
    const byKode = options.find((opt) => opt.kodeDivisi === cleanKode);
    if (byKode) return byKode;
  }

  const normalized = cleanText(candidateText).toLowerCase();
  if (!normalized || LEGACY_PLACEHOLDER_DIVISI_REGEX.test(normalized)) return null;

  // 1. Exact match on canonical jabatan, namaDivisi, or kodeDivisi
  const exactMatch = options.find(
    (opt) =>
      opt.jabatan.toLowerCase() === normalized ||
      opt.namaDivisi.toLowerCase() === normalized ||
      (opt.kodeDivisi && opt.kodeDivisi.toLowerCase() === normalized)
  );
  if (exactMatch) return exactMatch;

  // 2. Semantic rule matching (e.g. legacy seed titles -> current Master Divisi / Master Jabatan)
  const wantsLeader = /\b(ketua|koordinator|koor)\b/i.test(normalized);
  for (const rule of SEMANTIC_DIVISION_RULES) {
    const inputMatches = rule.inputPatterns.some((pat) => normalized.includes(pat));
    if (!inputMatches) continue;

    const candidates = options.filter((opt) => {
      if (opt.kodeDivisi && rule.kodes.includes(opt.kodeDivisi)) return true;
      const optBlob = `${opt.jabatan} ${opt.namaDivisi}`.toLowerCase();
      return rule.optionKeywords.some((kw) => optBlob.includes(kw));
    });
    if (candidates.length > 0) {
      const preferred = candidates.find((opt) => {
        const isLeader =
          opt.kodeDivisi.startsWith('KET-') ||
          /\b(ketua|koordinator)\b/i.test(opt.jabatan);
        return wantsLeader ? isLeader : !isLeader;
      });
      return preferred || candidates[0];
    }
  }

  // 3. Fallback substring match against dynamic custom Master Divisi names
  const cleanWords = normalized
    .replace(/^(divisi|ketua divisi|petugas|tim|tenaga)\s+/i, '')
    .trim();
  if (cleanWords.length >= 4) {
    const partialMatch = options.find((opt) => {
      const jabLower = opt.jabatan.toLowerCase();
      const divLower = opt.namaDivisi.toLowerCase();
      return (
        jabLower.includes(cleanWords) ||
        divLower.includes(cleanWords) ||
        normalized.includes(jabLower) ||
        normalized.includes(divLower)
      );
    });
    if (partialMatch) return partialMatch;
  }

  return null;
}

/**
 * Menyelesaikan Jenis Jabatan dan Nama Divisi kanonik suatu petugas / slip / rincian gaji
 * berdasarkan data Master Divisi & Master Jabatan yang aktif.
 */
export function resolveJabatanAndDivisiFromMaster(params: {
  rawJabatan?: string | null;
  rawDivisi?: string | null;
  rawKodeDivisi?: string | null;
  petugasJabatan?: string | null;
  petugasDivisi?: string | null;
  petugasKodeDivisi?: string | null;
  divisiList: Array<Partial<MasterDivisi>>;
  jabatanList?: Array<Partial<MasterJabatan>>;
}): ResolvedJabatanDivisi {
  const options = buildMasterDivisiJabatanOptions(params.divisiList, params.jabatanList || []);

  const rawJab = cleanText(params.rawJabatan);
  const rawDiv = cleanText(params.rawDivisi);
  const rawKode = cleanText(params.rawKodeDivisi);
  const petJab = cleanText(params.petugasJabatan);
  const petDiv = cleanText(params.petugasDivisi);
  const petKode = cleanText(params.petugasKodeDivisi);

  // Prioritaskan kecocokan terhadap kode/jabatan petugas aktif bila tersedia, lalu data slip/record
  const candidates: Array<{ text: string; kode: string }> = [
    ...(petJab || petKode ? [{ text: petJab, kode: petKode }] : []),
    ...(petDiv ? [{ text: petDiv, kode: petKode }] : []),
    { text: rawJab, kode: rawKode },
    ...(rawDiv && rawDiv !== rawJab ? [{ text: rawDiv, kode: rawKode }] : [])
  ];

  for (const cand of candidates) {
    const matched = findOptionByCandidateText(cand.text, cand.kode, options);
    if (matched) {
      return {
        jabatan: matched.jabatan,
        divisi: matched.namaDivisi,
        kodeDivisi: matched.kodeDivisi,
        divisiId: matched.divisiId,
        kepalaDivisi: matched.kepalaDivisi,
        matchedMaster: true
      };
    }
  }

  const fallbackJabatan = petJab || rawJab || 'Staf Operasional';
  const cleanFallbackDiv =
    petDiv && !LEGACY_PLACEHOLDER_DIVISI_REGEX.test(petDiv)
      ? petDiv
      : rawDiv && !LEGACY_PLACEHOLDER_DIVISI_REGEX.test(rawDiv)
      ? rawDiv
      : fallbackJabatan;

  return {
    jabatan: fallbackJabatan,
    divisi: cleanFallbackDiv,
    kodeDivisi: petKode || rawKode || '',
    divisiId: '',
    kepalaDivisi: '',
    matchedMaster: false
  };
}
