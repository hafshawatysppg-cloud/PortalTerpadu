import React, { useRef } from 'react';
import { useDocumentTemplate } from '../../contexts/DocumentTemplateContext';
import { GlobalReportHeader, GlobalReportHeaderProps } from './GlobalReportHeader';
import { GlobalReportFooter, GlobalReportFooterProps } from './GlobalReportFooter';
import { DocumentSignatures, DocumentSignaturesProps } from './DocumentSignatures';
import { Printer, Download, Eye, FileText, ArrowLeft } from 'lucide-react';

export interface DocumentTemplateEngineProps {
  documentTypeId?: string;
  title?: string;
  subTitle?: string;
  documentNumber?: string;
  documentDate?: string;
  metadata?: Array<{ label: string; value: string | React.ReactNode }>;
  hideHeader?: boolean;
  hideSignatures?: boolean;
  hideFooter?: boolean;
  headerProps?: Partial<GlobalReportHeaderProps>;
  footerProps?: Partial<GlobalReportFooterProps>;
  signatureProps?: Partial<DocumentSignaturesProps>;
  paperSizeOverride?: 'A4' | 'F4' | 'Letter';
  orientationOverride?: 'portrait' | 'landscape';
  showToolbar?: boolean;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const DocumentTemplateEngine: React.FC<DocumentTemplateEngineProps> = ({
  documentTypeId,
  title,
  subTitle,
  documentNumber,
  documentDate,
  metadata = [],
  hideHeader = false,
  hideSignatures = false,
  hideFooter = false,
  headerProps,
  footerProps,
  signatureProps,
  paperSizeOverride,
  orientationOverride,
  showToolbar = true,
  onClose,
  className = '',
  children
}) => {
  const { config, getDocTypeConfig } = useDocumentTemplate();
  const docTypeConfig = documentTypeId ? getDocTypeConfig(documentTypeId) : undefined;
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Determine effective paper format
  const effectivePaperSize = paperSizeOverride || 
    (docTypeConfig?.paperSize && docTypeConfig.paperSize !== 'default' ? docTypeConfig.paperSize : config.format.paperSize) || 'A4';

  const effectiveOrientation = orientationOverride || 
    (docTypeConfig?.orientation && docTypeConfig.orientation !== 'default' ? docTypeConfig.orientation : config.format.orientation) || 'portrait';

  const handlePrint = () => {
    window.print();
  };

  // Dimensions for standard paper preview
  // A4 portrait is ~210mm x 297mm (~794px x 1123px at 96 DPI)
  // Landscape flips width and height
  const containerWidthClass = effectiveOrientation === 'landscape' ? 'max-w-[1123px]' : 'max-w-[820px]';

  return (
    <div className="w-full flex flex-col items-center">
      {/* TOOLBAR FOR SCREEN VIEW (HIDDEN ON PRINT) */}
      {showToolbar && (
        <div className="w-full max-w-5xl mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold text-xs rounded-md uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>{effectivePaperSize} • {effectiveOrientation === 'landscape' ? 'Landscape' : 'Portrait'}</span>
              </span>
              {docTypeConfig && (
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  {docTypeConfig.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* PAPER CANVAS CONTAINER */}
      <div
        ref={printContainerRef}
        id="sppg-document-print-canvas"
        className={`w-full ${containerWidthClass} bg-white text-slate-900 shadow-md sm:border border-slate-200 sm:rounded-xl p-6 sm:p-10 my-2 print:my-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full transition-all ${className}`}
        style={{
          fontFamily: config.format.defaultFontFamily || 'inherit',
          fontSize: `${config.format.defaultFontSize || 10}pt`,
          color: config.format.fontColor || '#0f172a',
          lineHeight: config.format.lineHeight || 1.4
        }}
      >
        {/* GLOBAL HEADER (KOP SURAT RESMI) */}
        {!hideHeader && (
          <GlobalReportHeader
            documentTypeId={documentTypeId}
            title={title}
            subTitle={subTitle}
            documentNumber={documentNumber}
            documentDate={documentDate}
            metadata={metadata}
            {...headerProps}
          />
        )}

        {/* DOCUMENT CONTENT / TABLES */}
        <main className="w-full my-4 space-y-4">
          {children}
        </main>

        {/* SIGNATURES SECTION */}
        {!hideSignatures && (
          <DocumentSignatures
            documentTypeId={documentTypeId}
            {...signatureProps}
          />
        )}

        {/* GLOBAL FOOTER */}
        {!hideFooter && (
          <GlobalReportFooter
            documentTypeId={documentTypeId}
            {...footerProps}
          />
        )}
      </div>

      {/* EMBEDDED PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: ${effectivePaperSize === 'F4' ? '215mm 330mm' : effectivePaperSize === 'Letter' ? 'letter' : 'A4'} ${effectiveOrientation};
            margin: ${config.format.marginTop || 15}mm ${config.format.marginRight || 15}mm ${config.format.marginBottom || 15}mm ${config.format.marginLeft || 15}mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide non-print elements */
          nav, aside, header.portal-nav, .print\\:hidden, #portal-sidebar, #portal-header {
            display: none !important;
          }
          #sppg-document-print-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
};
