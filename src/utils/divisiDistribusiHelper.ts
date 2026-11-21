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
