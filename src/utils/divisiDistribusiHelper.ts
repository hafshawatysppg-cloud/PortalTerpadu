import { MasterDivisi } from '../types';

const isValidSignerName = (val?: string | null): val is string => {
  const clean = String(val || '').trim();
  return Boolean(clean && clean !== '-' && clean !== '—');
};

/**
 * Mengambil nama penandatangan Tim Distribusi dari data Master Divisi (bagian Divisi Distribusi).
 * Memprioritaskan kecocokan nama "Divisi Distribusi", lalu divisi yang mengandung kata "distribusi".
 */
export function resolveDivisiDistribusiName(
  divisiList: Array<Pick<MasterDivisi, 'nama' | 'kode' | 'kepalaDivisi'>>
): string | null {
  if (!Array.isArray(divisiList) || divisiList.length === 0) return null;

  // 1. Persis "Divisi Distribusi" dengan kepalaDivisi terisi
  const exactMatch = divisiList.find(
    (d) =>
      String(d?.nama || '').trim().toLowerCase() === 'divisi distribusi' &&
      isValidSignerName(d?.kepalaDivisi)
  );
  if (exactMatch) return exactMatch.kepalaDivisi!.trim();

  // 2. Mengandung "Divisi Distribusi" dengan kepalaDivisi terisi
  const containsDivisiDistribusi = divisiList.find(
    (d) =>
      String(d?.nama || '').trim().toLowerCase().includes('divisi distribusi') &&
      isValidSignerName(d?.kepalaDivisi)
  );
  if (containsDivisiDistribusi) return containsDivisiDistribusi.kepalaDivisi!.trim();

  // 3. Mengandung kata "distribusi" atau berkode DIST / DST dengan kepalaDivisi terisi
  const containsDistribusi = divisiList.find(
    (d) =>
      (String(d?.nama || '').trim().toLowerCase().includes('distribusi') ||
        ['DIST', 'DST'].includes(String(d?.kode || '').trim().toUpperCase())) &&
      isValidSignerName(d?.kepalaDivisi)
  );
  if (containsDistribusi) return containsDistribusi.kepalaDivisi!.trim();

  return null;
}

/**
 * Mengambil nama Pengawas Keuangan dari Master Divisi (fallback: Muhammad Fadil, S.Akun).
 */
export function resolvePengawasKeuanganName(
  divisiList: Array<Pick<MasterDivisi, 'nama' | 'kode' | 'kepalaDivisi'>>,
  fallback = 'Muhammad Fadil, S.Akun'
): string {
  if (!Array.isArray(divisiList) || divisiList.length === 0) return fallback;

  const exactMatch = divisiList.find(
    (d) =>
      String(d?.nama || '').trim().toLowerCase() === 'pengawas keuangan' &&
      isValidSignerName(d?.kepalaDivisi)
  );
  if (exactMatch) return exactMatch.kepalaDivisi!.trim();

  const containsPengawasKeuangan = divisiList.find(
    (d) =>
      (String(d?.nama || '').trim().toLowerCase().includes('pengawas keuangan') ||
        ['PK', 'KEU-PK', 'PENGAWAS-KEUANGAN'].includes(String(d?.kode || '').trim().toUpperCase())) &&
      isValidSignerName(d?.kepalaDivisi)
  );
  if (containsPengawasKeuangan) return containsPengawasKeuangan.kepalaDivisi!.trim();

  // Hanya gunakan divisi "Keuangan" jika user telah mengubah nama default placeholder seed
  const containsKeuangan = divisiList.find(
    (d) =>
      String(d?.nama || '').trim().toLowerCase().includes('keuangan') &&
      isValidSignerName(d?.kepalaDivisi) &&
      d.kepalaDivisi!.trim() !== 'Drs. Bambang Hariyanto, M.Si'
  );
  if (containsKeuangan) return containsKeuangan.kepalaDivisi!.trim();

  return fallback;
}

/**
 * Mengambil nama Kepala SPPG (Ka. SPPG) dari Master Divisi (fallback: Sri Rohayu, S.Pd).
 */
export function resolveKepalaSppgName(
  divisiList: Array<Pick<MasterDivisi, 'nama' | 'kode' | 'kepalaDivisi'>>,
  fallback = 'Sri Rohayu, S.Pd'
): string {
  if (!Array.isArray(divisiList) || divisiList.length === 0) return fallback;

  const exactMatch = divisiList.find((d) => {
    const namaLower = String(d?.nama || '').trim().toLowerCase();
    return (
      (namaLower === 'kepala sppg' || namaLower === 'ka. sppg' || namaLower === 'ka sppg') &&
      isValidSignerName(d?.kepalaDivisi)
    );
  });
  if (exactMatch) return exactMatch.kepalaDivisi!.trim();

  const containsKepala = divisiList.find((d) => {
    const namaLower = String(d?.nama || '').trim().toLowerCase();
    const kodeUpper = String(d?.kode || '').trim().toUpperCase();
    return (
      (namaLower.includes('kepala sppg') ||
        namaLower.includes('ka. sppg') ||
        namaLower.includes('ka sppg') ||
        ['KA-SPPG', 'KSPPG', 'SPPG'].includes(kodeUpper)) &&
      isValidSignerName(d?.kepalaDivisi)
    );
  });
  if (containsKepala) return containsKepala.kepalaDivisi!.trim();

  return fallback;
}

