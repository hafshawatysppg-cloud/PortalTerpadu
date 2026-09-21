import React from 'react';
import { useDocumentTemplate } from '../../contexts/DocumentTemplateContext';

export interface GlobalReportFooterProps {
  documentTypeId?: string;
  currentPage?: number;
  totalPages?: number;
  customNote?: string;
  isConfidential?: boolean;
  className?: string;
}

export const GlobalReportFooter: React.FC<GlobalReportFooterProps> = ({
  documentTypeId,
  currentPage = 1,
  totalPages = 1,
  customNote,
  isConfidential,
  className = ''
}) => {
  const { config, getDocTypeConfig } = useDocumentTemplate();
  const footer = config.footer;
  const docTypeConfig = documentTypeId ? getDocTypeConfig(documentTypeId) : undefined;

  if (docTypeConfig && docTypeConfig.enableFooter === false) {
    return null;
  }

  if (!footer.showFooter) {
    return null;
  }

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);

  const pageText = (footer.pageNumberFormat || 'Halaman {page} dari {total}')
    .replace('{page}', String(currentPage))
    .replace('{total}', String(totalPages));

  const noteText = customNote || footer.customDocumentNote;
  const showConfidential = isConfidential !== undefined ? isConfidential : footer.isConfidential;

  const alignmentClass = 
    footer.footerAlignment === 'center' ? 'justify-center text-center' :
    footer.footerAlignment === 'left' ? 'justify-start text-left' :
    'justify-between items-center';

  return (
    <footer className={`w-full pt-4 mt-6 border-t border-slate-300 text-[10px] text-slate-500 select-none ${className}`}>
      {showConfidential && (
        <div className="mb-2 text-center">
          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded uppercase border border-rose-200">
            {footer.confidentialText || 'DOKUMEN RAHASIA / INTERNAL USE ONLY'}
          </span>
        </div>
      )}

      <div className={`flex flex-wrap gap-2 ${alignmentClass}`}>
        {/* NOTE OR SPPG IDENTITY */}
        {noteText && (
          <div className="font-medium text-slate-600">
            {noteText}
          </div>
        )}

        {/* PRINT DATE & PAGE NUMBER */}
        <div className="flex items-center gap-3 ml-auto text-slate-400">
          {footer.showPrintDate && (
            <span>
              Dicetak: {formattedDate} WIB
            </span>
          )}

          {footer.showPageNumber && (
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {pageText}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
