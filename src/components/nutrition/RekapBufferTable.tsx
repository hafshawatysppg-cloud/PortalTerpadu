import React from 'react';
import { MultiGroupIngredientItem, TargetCountConfig } from './nutritionData';
import { Scale, CheckCircle2, AlertCircle, ShoppingCart, Download, DollarSign } from 'lucide-react';

interface RekapBufferTableProps {
  ingredients: MultiGroupIngredientItem[];
  targetCounts: TargetCountConfig;
  onChangeIngredients?: (items: MultiGroupIngredientItem[]) => void;
  isReadOnly?: boolean;
}

export const RekapBufferTable: React.FC<RekapBufferTableProps> = ({
  ingredients,
  targetCounts,
  onChangeIngredients,
  isReadOnly = false
}) => {
  const calcGross = (net: number, bdd: number) => {
    const safeBdd = bdd > 0 ? bdd / 100 : 1;
    return Number((net / safeBdd).toFixed(2));
  };

  const calcReqKg = (gross: number, target: number) => {
    return Number(((gross * target) / 1000).toFixed(2));
  };

  let grandTotalKebutuhanKg = 0;
  let grandTotalBufferKg = 0;
  let grandTotalWithBufferKg = 0;
  let grandEstimatedCost = 0;

  const handleUpdatePembulatan = (index: number, val: string) => {
    if (!onChangeIngredients) return;
    const copy = [...ingredients];
    copy[index].pembulatan = val;
    onChangeIngredients(copy);
  };

  const handleUpdateSatuan = (index: number, val: string) => {
    if (!onChangeIngredients) return;
    const copy = [...ingredients];
    copy[index].satuan = val;
    onChangeIngredients(copy);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Information */}
      <div className="bg-emerald-950/10 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Rekapitulasi Total Kebutuhan Bahan Pangan & Buffer 5%
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format Standar Tabel Rekapitulasi Pengadaan Halaman 5 SPPG Badan Gizi Nasional.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700">
            Buffer Cadangan Gizi: 5.0%
          </span>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
              <th className="py-2.5 px-3 font-bold w-12 border-r border-slate-700">NO</th>
              <th className="py-2.5 px-4 font-bold border-r border-slate-700 text-left">Bahan Pangan</th>
              <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-slate-900 text-slate-200">
                TOTAL KEBUTUHAN (kg)
              </th>
              <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-teal-900 text-teal-100">
                Buffer 5% (kg)
              </th>
              <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-emerald-900 text-emerald-100">
                Total (kg)
              </th>
              <th className="py-2.5 px-3 font-bold border-r border-slate-700 bg-amber-950 text-amber-200">
                Pembulatan
              </th>
              <th className="py-2.5 px-3 font-bold border-r border-slate-700">
                Satuan
              </th>
              <th className="py-2.5 px-3 font-bold">
                Estimasi Biaya
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {ingredients.map((item, index) => {
              const bdd = Number(item.bddPercent) || 100;
              const grossKecil = calcGross(Number(item.porsiKecilNet) || 0, bdd);
              const reqKecil = calcReqKg(grossKecil, targetCounts.porsiKecil);

              const grossBesar = calcGross(Number(item.porsiBesarNet) || 0, bdd);
              const reqBesar = calcReqKg(grossBesar, targetCounts.porsiBesar);

              const grossBalita = calcGross(Number(item.balitaNet) || 0, bdd);
              const reqBalita = calcReqKg(grossBalita, targetCounts.balita);

              const grossBumil = calcGross(Number(item.bumilBusuiNet) || 0, bdd);
              const reqBumil = calcReqKg(grossBumil, targetCounts.bumilBusui);

              const totalKg = Number((reqKecil + reqBesar + reqBalita + reqBumil).toFixed(2));
              const bufferKg = Number((totalKg * 0.05).toFixed(2));
              const totalPlusBuffer = Number((totalKg + bufferKg).toFixed(2));
              
              const itemCost = Math.round(totalPlusBuffer * (item.hargaPerKg || 0));

              grandTotalKebutuhanKg += totalKg;
              grandTotalBufferKg += bufferKg;
              grandTotalWithBufferKg += totalPlusBuffer;
              grandEstimatedCost += itemCost;

              return (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                    {item.no}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                    {item.bahanPangan}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                    {totalKg.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-teal-700 dark:text-teal-400 bg-teal-50/40 dark:bg-teal-950/20 border-r border-slate-200 dark:border-slate-800">
                    {bufferKg.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-r border-slate-200 dark:border-slate-800">
                    {totalPlusBuffer.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/10">
                    {isReadOnly ? (
                      <span className="font-bold text-amber-800 dark:text-amber-300">{item.pembulatan}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.pembulatan}
                        onChange={(e) => handleUpdatePembulatan(index, e.target.value)}
                        className="w-16 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-bold text-slate-900 dark:text-slate-100 text-xs shadow-2xs"
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                    {isReadOnly ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.satuan}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.satuan}
                        onChange={(e) => handleUpdateSatuan(index, e.target.value)}
                        className="w-16 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-semibold text-slate-900 dark:text-slate-100 text-xs"
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    Rp {itemCost.toLocaleString('id-ID')}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white dark:bg-slate-950 font-bold border-t-2 border-slate-700">
              <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                TOTAL KESELURUHAN (24 BAHAN):
              </td>
              <td className="py-3 px-3 text-center text-xs font-bold text-slate-300">
                {grandTotalKebutuhanKg.toFixed(2)} kg
              </td>
              <td className="py-3 px-3 text-center text-xs font-bold text-teal-300">
                {grandTotalBufferKg.toFixed(2)} kg
              </td>
              <td className="py-3 px-3 text-center text-sm font-black text-emerald-400 bg-emerald-950">
                {grandTotalWithBufferKg.toFixed(2)} kg
              </td>
              <td colSpan={2} className="py-3 px-3 text-center text-xs text-slate-400">
                Satuan Pasar Pengadaan
              </td>
              <td className="py-3 px-3 text-right text-sm font-black text-amber-300">
                Rp {grandEstimatedCost.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
