import React from 'react';
import * as Icons from 'lucide-react';
import { PurchaseOrderDocument } from '../../types';
import logoImg from '../../assets/images/badan_gizi_logo_1785799692960.jpg';
import { GlobalReportHeader } from '../document/GlobalReportHeader';
import { GlobalReportFooter } from '../document/GlobalReportFooter';
import { DocumentSignatures } from '../document/DocumentSignatures';

interface PurchaseOrderPrintModalProps {
  po: PurchaseOrderDocument | null;
  poBundle?: PurchaseOrderDocument[];
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseOrderPrintModal: React.FC<PurchaseOrderPrintModalProps> = ({ po, poBundle, isOpen, onClose }) => {
  if (!isOpen) return null;
  const docsToRender = (poBundle && poBundle.length > 0) ? poBundle : (po ? [po] : []);
  if (docsToRender.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper date formatter
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper untuk menghitung tanggal target tiba (H-1 sebelum tanggal menu/pemesanan)
  const computeTargetArrivalDate = (menuDateStr?: string): string => {
    if (!menuDateStr) return '';
    try {
      const parts = menuDateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      const d = new Date(menuDateStr);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return menuDateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Modal Toolbar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
        >
          <Icons.Printer className="w-4 h-4" />
          <span>Cetak / Save PDF ({docsToRender.length} Halaman)</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Icons.X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="w-full max-w-4xl my-auto print:m-0 print:p-0 print:w-full print:max-w-none text-xs leading-tight font-sans space-y-6 print:space-y-0">
        {docsToRender.map((doc, docIdx) => {
          const isBahanBaku = doc.poType === 'Bahan Baku';
          const minRows = 18;
          const itemsCount = doc.items ? doc.items.length : 0;
          const emptyRowsCount = Math.max(0, minRows - itemsCount);
          const emptyRows = Array.from({ length: emptyRowsCount });

          const orderDateStr = doc.orderDate || doc.date;
          const targetArrivalDateStr = doc.targetArrivalDate || computeTargetArrivalDate(orderDateStr);

          return (
            <div
              key={doc.id || docIdx}
              className="bg-white text-slate-900 p-6 md:p-10 rounded-2xl shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none page-break-after-always"
              style={{ pageBreakAfter: docIdx < docsToRender.length - 1 ? 'always' : 'auto' }}
            >
              {/* Header Insitusional dari Master Template Dokumen */}
              <GlobalReportHeader
                documentTypeId="po-harian"
                documentNumber={doc.poNumber || doc.id}
                documentDate={doc.orderDate || doc.date}
                metadata={[
                  { label: 'Kategori PO', value: isBahanBaku ? 'Bahan Baku Harian' : 'Operasional Harian' },
                  { label: 'Jadwal Hari', value: doc.dayLabel || `Hari ${doc.dayIndex || docIdx + 1} dari 5` },
                  { label: 'Periode Batch', value: `${formatDateIndo(doc.periodeStartDate)} - ${formatDateIndo(doc.periodeEndDate)}` }
                ]}
              />

              {/* Metadata Section */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="border border-slate-900 text-[11px]">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px] flex justify-between">
                    <span>JUMLAH PENERIMA MANFAAT</span>
                    <span className="text-blue-200">{formatDateIndo(orderDateStr)}</span>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                      <span className="font-medium text-slate-700">Porsi Besar :</span>
                      <span className="font-extrabold text-slate-900">
                        {(doc.porsiBesar || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Porsi Kecil :</span>
                      <span className="font-extrabold text-slate-900">
                        {(doc.porsiKecil || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-800 uppercase">TGL PEMESANAN (MENU) :</span>
                    <span className="font-extrabold text-blue-900">{formatDateIndo(orderDateStr)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-800 uppercase">TARGET KEDATANGAN (H-1) :</span>
                    <span className="font-black text-emerald-800">{formatDateIndo(targetArrivalDateStr)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-800 uppercase">NO. PO HARIAN :</span>
                    <span className="font-extrabold text-slate-900">{doc.poNumber || '-'}</span>
                  </div>
                  {doc.periodeBatchId && (
                    <div className="flex justify-between text-[10px]">
                      <span className="font-semibold text-slate-500 uppercase">ID PAKET PERIODE :</span>
                      <span className="font-mono text-slate-700">{doc.periodeBatchId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier & Ship To Side-by-Side */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="border border-slate-900">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px]">
                    SUPPLIER (PEMBAYARAN HARIAN)
                  </div>
                  <div className="p-2 space-y-1 text-[11px]">
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Nama</span>
                      <span className="font-extrabold text-slate-900">: {doc.supplier?.name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Alamat</span>
                      <span className="font-normal text-slate-800 leading-tight">: {doc.supplier?.address}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Kontak</span>
                      <span className="font-semibold text-slate-900">: {doc.supplier?.contact}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-900">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px]">
                    SHIP TO / TUJUAN KEDATANGAN
                  </div>
                  <div className="p-2 space-y-1 text-[11px]">
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Nama</span>
                      <span className="font-extrabold text-slate-900">: {doc.shipTo?.name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Alamat</span>
                      <span className="font-normal text-slate-800 leading-tight">: {doc.shipTo?.address}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium text-slate-700">Kontak</span>
                      <span className="font-semibold text-slate-900">: {doc.shipTo?.contact}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pemesan & Estimasi Kedatangan Harian */}
              <div className="grid grid-cols-2 gap-4 text-[11px] mt-3">
                <div className="border border-slate-900">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px]">
                    PEMESAN
                  </div>
                  <div className="p-2 font-bold text-slate-900">
                    {doc.pemesan || 'Muhammad Fadil, S. Akun'}
                  </div>
                </div>

                <div className="border border-slate-900">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px] flex justify-between">
                    <span>TARGET KEDATANGAN BARANG (H-1)</span>
                    <span className="text-emerald-300 font-normal">Satu Hari Sebelum Masak</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="font-black text-emerald-900 text-xs">
                      {formatDateIndo(targetArrivalDateStr)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      {doc.estimatedArrival || `${formatDateIndo(targetArrivalDateStr)} Pkl 16:00 WIB (H-1)`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Harian Banner */}
              {isBahanBaku && (
                <div className="border border-slate-900 mt-3">
                  <div className="bg-blue-950 text-white px-2 py-1 font-extrabold uppercase text-[10px] flex justify-between px-3">
                    <span>MENU TANGGAL PEMESANAN: {formatDateIndo(orderDateStr)}</span>
                    <span className="text-emerald-300 font-normal">TARGET KEDATANGAN BARANG: {formatDateIndo(targetArrivalDateStr)}</span>
                  </div>
                  <div className="p-2 text-center font-black text-slate-900 tracking-wide text-[11px] uppercase bg-slate-50">
                    {doc.menuSummary || '-'}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="border border-slate-900 overflow-hidden mt-3">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-blue-950 text-white font-extrabold uppercase border-b border-slate-900 text-center">
                      <th className="py-1.5 px-1 border-r border-slate-800 w-8">No</th>
                      <th className="py-1.5 px-3 border-r border-slate-800 text-left">Rincian Bahan Pangan Harian</th>
                      <th className="py-1.5 px-2 border-r border-slate-800 w-16">Qty</th>
                      <th className="py-1.5 px-2 border-r border-slate-800 w-16">Satuan</th>
                      <th className="py-1.5 px-3 border-r border-slate-800 text-right w-28">Harga Satuan</th>
                      <th className="py-1.5 px-3 text-right w-32">Total Hari Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {doc.items && doc.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-semibold text-slate-900">
                        <td className="py-1 px-1 text-center border-r border-slate-300 text-slate-500">{idx + 1}</td>
                        <td className="py-1 px-3 border-r border-slate-300 font-bold">{item.details}</td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-extrabold">{item.qty}</td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center text-slate-700">{item.unit}</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-right">
                          Rp{item.unitPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-1 px-3 text-right font-black">
                          Rp{item.totalPrice.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}

                    {emptyRows.map((_, idx) => (
                      <tr key={`empty-${idx}`} className="text-slate-300">
                        <td className="py-1 px-1 text-center border-r border-slate-300">{itemsCount + idx + 1}</td>
                        <td className="py-1 px-3 border-r border-slate-300">-</td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center"></td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center"></td>
                        <td className="py-1 px-3 border-r border-slate-300 text-right">Rp0,00</td>
                        <td className="py-1 px-3 text-right">Rp0,00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Additional Notes */}
              <div className="grid grid-cols-2 gap-4 items-end mt-3">
                <div className="border border-slate-900 p-2 min-h-[48px] bg-slate-50">
                  <span className="font-bold text-[10px] text-slate-600 block uppercase mb-1">Catatan Pembayaran Harian:</span>
                  <p className="text-[10.5px] text-slate-800 font-medium">
                    {doc.additionalNotes || `Pemesanan dan pembayaran harian per tanggal ${formatDateIndo(doc.date)}. Bahan wajib tiba pukul 05:00 WIB.`}
                  </p>
                </div>

                <div className="border border-slate-900 bg-slate-100 p-2 flex justify-between items-center font-black text-sm text-slate-900">
                  <span className="uppercase text-xs tracking-wider">TOTAL HARIAN ({formatDateIndo(doc.date)})</span>
                  <span className="text-base font-black text-blue-900">
                    Rp{(doc.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Approval & Footer dari Master Template Dokumen */}
              <DocumentSignatures documentTypeId="po-harian" />
              <GlobalReportFooter
                documentTypeId="po-harian"
                currentPage={docIdx + 1}
                totalPages={docsToRender.length}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
