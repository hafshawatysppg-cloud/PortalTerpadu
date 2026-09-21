import React, { useRef } from 'react';
import { MultiGroupIngredientItem, TargetCountConfig } from './nutritionData';
import { Printer, X, Download, ShieldCheck, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { GlobalReportHeader } from '../document/GlobalReportHeader';
import { GlobalReportFooter } from '../document/GlobalReportFooter';
import { DocumentSignatures } from '../document/DocumentSignatures';

interface OfficialPdfPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: MultiGroupIngredientItem[];
  targetCounts: TargetCountConfig;
  menuName: string;
  tanggalPelaksanaan: string;
}

export const OfficialPdfPrintModal: React.FC<OfficialPdfPrintModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  targetCounts,
  menuName,
  tanggalPelaksanaan
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const calcGross = (net: number, bdd: number) => {
    const safeBdd = bdd > 0 ? bdd / 100 : 1;
    return Number((net / safeBdd).toFixed(2));
  };

  const calcReqKg = (gross: number, target: number) => {
    return Number(((gross * target) / 1000).toFixed(2));
  };

  // Centralized Header from Master Template Dokumen (Single Source of Truth)
  const SPPGHeader = ({ showLogo = true }: { showLogo?: boolean }) => (
    <div className="mb-3">
      <GlobalReportHeader
        documentTypeId="laporan-menu"
        showLogo={showLogo}
        metadata={[
          { label: 'Hari/Tanggal', value: tanggalPelaksanaan || 'Minggu, 13 September 2026' },
          { label: 'Menu Perencanaan', value: menuName },
          { label: 'Kode Form', value: 'FORM SPPG-01' }
        ]}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[96vh] overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Modal Header Actions (Hidden when printing) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Preview Dokumen Cetak Resmi SPPG (Halaman 1 - 6)
              </h2>
              <p className="text-xs text-slate-500">
                Format resmi Badan Gizi Nasional sesuai standar verifikasi PLOG & Kepala SPPG.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pages Container */}
        <div ref={printContainerRef} className="p-4 sm:p-8 overflow-y-auto space-y-8 print:p-0 print:space-y-0 text-black bg-white">
          
          {/* ================= PAGE 1: PORSI KECIL ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0 page-break-after">
            <SPPGHeader />
            <div className="mb-2 font-bold text-xs uppercase bg-gray-100 p-1 border border-gray-300 text-center">
              TABEL KEBUTUHAN BAHAN PANGAN - KELOMPOK SASARAN: PORSI KECIL (JUMLAH SASARAN: {targetCounts.porsiKecil})
            </div>

            <table className="w-full text-left text-[9px] border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-200 text-center border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-6">1<br/>Menu</th>
                  <th className="p-1 border-r border-black text-left">2<br/>Bahan Pangan</th>
                  <th className="p-1 border-r border-black w-20">3<br/>Kelompok Sasaran</th>
                  <th className="p-1 border-r border-black w-14">4<br/>Berat Bersih (gr)</th>
                  <th className="p-1 border-r border-black w-14">5<br/>PERSEN BDD</th>
                  <th className="p-1 border-r border-black w-14">6<br/>Berat Kotor (gr)</th>
                  <th className="p-1 border-r border-black w-14">7<br/>Jumlah Sasaran</th>
                  <th className="p-1 border-black w-18">8<br/>Kebutuhan Bahan Pangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => {
                  const net = Number(item.porsiKecilNet) || 0;
                  const bdd = Number(item.bddPercent) || 100;
                  const gross = calcGross(net, bdd);
                  const reqKg = calcReqKg(gross, targetCounts.porsiKecil);

                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-1 text-center border-r border-black">{item.no}</td>
                      <td className="p-1 font-medium border-r border-black">{item.bahanPangan}</td>
                      <td className="p-1 text-center border-r border-black font-semibold">PORSI KECIL</td>
                      <td className="p-1 text-center border-r border-black">{net}</td>
                      <td className="p-1 text-center border-r border-black">{bdd}%</td>
                      <td className="p-1 text-center border-r border-black">{gross.toFixed(2)}</td>
                      <td className="p-1 text-center border-r border-black">{targetCounts.porsiKecil}</td>
                      <td className="p-1 text-center font-bold border-black">{reqKg.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[8px] text-right text-gray-500 italic">Halaman 1 / 6</div>
          </div>

          {/* ================= PAGE 2: PORSI BESAR ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0 page-break-after">
            <SPPGHeader />
            <div className="mb-2 font-bold text-xs uppercase bg-gray-100 p-1 border border-gray-300 text-center">
              TABEL KEBUTUHAN BAHAN PANGAN - KELOMPOK SASARAN: PORSI BESAR (JUMLAH SASARAN: {targetCounts.porsiBesar})
            </div>

            <table className="w-full text-left text-[9px] border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-200 text-center border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-6">1<br/>Menu</th>
                  <th className="p-1 border-r border-black text-left">2<br/>Bahan Pangan</th>
                  <th className="p-1 border-r border-black w-20">3<br/>Kelompok Sasaran</th>
                  <th className="p-1 border-r border-black w-14">4<br/>Berat Bersih (gr)</th>
                  <th className="p-1 border-r border-black w-14">5<br/>PERSEN BDD</th>
                  <th className="p-1 border-r border-black w-14">6<br/>Berat Kotor (gr)</th>
                  <th className="p-1 border-r border-black w-14">7<br/>Jumlah Sasaran</th>
                  <th className="p-1 border-black w-18">8<br/>Kebutuhan Bahan Pangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => {
                  const net = Number(item.porsiBesarNet) || 0;
                  const bdd = Number(item.bddPercent) || 100;
                  const gross = calcGross(net, bdd);
                  const reqKg = calcReqKg(gross, targetCounts.porsiBesar);

                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-1 text-center border-r border-black">{item.no}</td>
                      <td className="p-1 font-medium border-r border-black">{item.bahanPangan}</td>
                      <td className="p-1 text-center border-r border-black font-semibold">PORSI BESAR</td>
                      <td className="p-1 text-center border-r border-black">{net}</td>
                      <td className="p-1 text-center border-r border-black">{bdd}%</td>
                      <td className="p-1 text-center border-r border-black">{gross.toFixed(2)}</td>
                      <td className="p-1 text-center border-r border-black">{targetCounts.porsiBesar}</td>
                      <td className="p-1 text-center font-bold border-black">{reqKg.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[8px] text-right text-gray-500 italic">Halaman 2 / 6</div>
          </div>

          {/* ================= PAGE 3: BALITA ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0 page-break-after">
            <SPPGHeader />
            <div className="mb-2 font-bold text-xs uppercase bg-gray-100 p-1 border border-gray-300 text-center">
              TABEL KEBUTUHAN BAHAN PANGAN - KELOMPOK SASARAN: BALITA (JUMLAH SASARAN: {targetCounts.balita})
            </div>

            <table className="w-full text-left text-[9px] border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-200 text-center border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-6">1<br/>Menu</th>
                  <th className="p-1 border-r border-black text-left">2<br/>Bahan Pangan</th>
                  <th className="p-1 border-r border-black w-20">3<br/>Kelompok Sasaran</th>
                  <th className="p-1 border-r border-black w-14">4<br/>Berat Bersih (gr)</th>
                  <th className="p-1 border-r border-black w-14">5<br/>PERSEN BDD</th>
                  <th className="p-1 border-r border-black w-14">6<br/>Berat Kotor (gr)</th>
                  <th className="p-1 border-r border-black w-14">7<br/>Jumlah Sasaran</th>
                  <th className="p-1 border-black w-18">8<br/>Kebutuhan Bahan Pangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => {
                  const net = Number(item.balitaNet) || 0;
                  const bdd = Number(item.bddPercent) || 100;
                  const gross = calcGross(net, bdd);
                  const reqKg = calcReqKg(gross, targetCounts.balita);

                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-1 text-center border-r border-black">{item.no}</td>
                      <td className="p-1 font-medium border-r border-black">{item.bahanPangan}</td>
                      <td className="p-1 text-center border-r border-black font-semibold">BALITA</td>
                      <td className="p-1 text-center border-r border-black">{net}</td>
                      <td className="p-1 text-center border-r border-black">{bdd}%</td>
                      <td className="p-1 text-center border-r border-black">{gross.toFixed(2)}</td>
                      <td className="p-1 text-center border-r border-black">{targetCounts.balita}</td>
                      <td className="p-1 text-center font-bold border-black">{reqKg.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[8px] text-right text-gray-500 italic">Halaman 3 / 6</div>
          </div>

          {/* ================= PAGE 4: BUMIL & BUSUI ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0 page-break-after">
            <SPPGHeader />
            <div className="mb-2 font-bold text-xs uppercase bg-gray-100 p-1 border border-gray-300 text-center">
              TABEL KEBUTUHAN BAHAN PANGAN - KELOMPOK SASARAN: BUMIL & BUSUI (JUMLAH SASARAN: {targetCounts.bumilBusui})
            </div>

            <table className="w-full text-left text-[9px] border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-200 text-center border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-6">1<br/>Menu</th>
                  <th className="p-1 border-r border-black text-left">2<br/>Bahan Pangan</th>
                  <th className="p-1 border-r border-black w-20">3<br/>Kelompok Sasaran</th>
                  <th className="p-1 border-r border-black w-14">4<br/>Berat Bersih (gr)</th>
                  <th className="p-1 border-r border-black w-14">5<br/>PERSEN BDD</th>
                  <th className="p-1 border-r border-black w-14">6<br/>Berat Kotor (gr)</th>
                  <th className="p-1 border-r border-black w-14">7<br/>Jumlah Sasaran</th>
                  <th className="p-1 border-black w-18">8<br/>Kebutuhan Bahan Pangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => {
                  const net = Number(item.bumilBusuiNet) || 0;
                  const bdd = Number(item.bddPercent) || 100;
                  const gross = calcGross(net, bdd);
                  const reqKg = calcReqKg(gross, targetCounts.bumilBusui);

                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-1 text-center border-r border-black">{item.no}</td>
                      <td className="p-1 font-medium border-r border-black">{item.bahanPangan}</td>
                      <td className="p-1 text-center border-r border-black font-semibold">BUMIL & BUSUI</td>
                      <td className="p-1 text-center border-r border-black">{net}</td>
                      <td className="p-1 text-center border-r border-black">{bdd}%</td>
                      <td className="p-1 text-center border-r border-black">{gross.toFixed(2)}</td>
                      <td className="p-1 text-center border-r border-black">{targetCounts.bumilBusui}</td>
                      <td className="p-1 text-center font-bold border-black">{reqKg.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[8px] text-right text-gray-500 italic">Halaman 4 / 6</div>
          </div>

          {/* ================= PAGE 5: REKAPITULASI + BUFFER 5% ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0 page-break-after">
            <SPPGHeader />
            <div className="mb-2 font-bold text-xs uppercase bg-gray-100 p-1 border border-gray-300 text-center">
              REKAPITULASI KEBUTUHAN BAHAN PANGAN DENGAN CADANGAN BUFFER 5% (HALAMAN 5)
            </div>

            <table className="w-full text-left text-[9px] border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-200 text-center border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-8">NO</th>
                  <th className="p-1 border-r border-black text-left">Bahan Pangan</th>
                  <th className="p-1 border-r border-black w-24">TOTAL KEBUTUHAN (kg)</th>
                  <th className="p-1 border-r border-black w-20">Buffer 5% (kg)</th>
                  <th className="p-1 border-r border-black w-20 font-bold">Total (kg)</th>
                  <th className="p-1 border-r border-black w-20 font-bold">Pembulatan</th>
                  <th className="p-1 border-black w-16">Satuan</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => {
                  const bdd = Number(item.bddPercent) || 100;
                  const reqKecil = calcReqKg(calcGross(Number(item.porsiKecilNet) || 0, bdd), targetCounts.porsiKecil);
                  const reqBesar = calcReqKg(calcGross(Number(item.porsiBesarNet) || 0, bdd), targetCounts.porsiBesar);
                  const reqBalita = calcReqKg(calcGross(Number(item.balitaNet) || 0, bdd), targetCounts.balita);
                  const reqBumil = calcReqKg(calcGross(Number(item.bumilBusuiNet) || 0, bdd), targetCounts.bumilBusui);

                  const totalKg = Number((reqKecil + reqBesar + reqBalita + reqBumil).toFixed(2));
                  const bufferKg = Number((totalKg * 0.05).toFixed(2));
                  const totalPlusBuffer = Number((totalKg + bufferKg).toFixed(2));

                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-1 text-center border-r border-black">{item.no}</td>
                      <td className="p-1 font-medium border-r border-black">{item.bahanPangan}</td>
                      <td className="p-1 text-center border-r border-black">{totalKg.toFixed(2)}</td>
                      <td className="p-1 text-center border-r border-black">{bufferKg.toFixed(2)}</td>
                      <td className="p-1 text-center font-bold border-r border-black">{totalPlusBuffer.toFixed(2)}</td>
                      <td className="p-1 text-center font-bold border-r border-black">{item.pembulatan}</td>
                      <td className="p-1 text-center border-black">{item.satuan}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[8px] text-right text-gray-500 italic">Halaman 5 / 6</div>
          </div>

          {/* ================= PAGE 6: LEMBAR PENGESAHAN TANDA TANGAN ================= */}
          <div className="p-6 border border-gray-300 rounded-xl bg-white print:border-none print:p-0 print:m-0">
            <SPPGHeader />
            <div className="mb-6 font-bold text-xs uppercase bg-gray-100 p-2 border border-gray-300 text-center">
              LEMBAR PENGESAHAN PERENCANAAN BAHAN PANGAN SPPG
            </div>

            <div className="p-4 border border-gray-300 rounded-lg text-[10px] space-y-2 mb-8 bg-gray-50">
              <div className="font-bold uppercase text-black">Ringkasan Validasi SPPG:</div>
              <div>1. Menu Perencanaan: <span className="font-bold">{menuName}</span></div>
              <div>2. Total Sasaran: <span className="font-bold">{(targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui).toLocaleString('id-ID')} Penerima Manfaat</span> (Kecil: {targetCounts.porsiKecil}, Besar: {targetCounts.porsiBesar}, Balita: {targetCounts.balita}, Bumil: {targetCounts.bumilBusui})</div>
              <div>3. Total Ragam Bahan Baku: <span className="font-bold">{ingredients.length} Komoditas Pangan</span></div>
              <div>4. Buffer Cadangan: <span className="font-bold">5% Diterapkan Penuh pada Seluruh Komponen Bahan</span></div>
            </div>

            {/* Signature Block from Single Source of Truth */}
            <DocumentSignatures documentTypeId="laporan-menu" />

            <GlobalReportFooter documentTypeId="laporan-menu" currentPage={6} totalPages={6} />
          </div>

        </div>
      </div>
    </div>
  );
};
