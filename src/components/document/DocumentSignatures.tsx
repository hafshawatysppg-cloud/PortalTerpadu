import React from 'react';
import { useDocumentTemplate } from '../../contexts/DocumentTemplateContext';
import { MasterSignature } from '../../types/documentTemplate';

export interface DocumentSignaturesProps {
  documentTypeId?: string;
  signatureIds?: string[];
  layout?: '1-kolom' | '2-kolom' | '3-kolom';
  cityDate?: string;
  className?: string;
}

export const DocumentSignatures: React.FC<DocumentSignaturesProps> = ({
  documentTypeId,
  signatureIds,
  layout,
  cityDate,
  className = ''
}) => {
  const { config, getDocTypeConfig } = useDocumentTemplate();
  const docTypeConfig = documentTypeId ? getDocTypeConfig(documentTypeId) : undefined;

  // Determine active signatures to display
  const targetIds = signatureIds || docTypeConfig?.selectedSignatureIds || [];
  let displaySignatures: MasterSignature[] = [];

  if (targetIds.length > 0) {
    displaySignatures = targetIds
      .map(id => config.signatures.find(s => s.id === id))
      .filter((s): s is MasterSignature => Boolean(s && s.isActive));
  } else {
    // Default to active default signatures
    displaySignatures = config.signatures.filter(s => s.isActive && s.isDefault);
  }

  if (displaySignatures.length === 0) {
    return null;
  }

  const effectiveLayout = layout || docTypeConfig?.signatureLayout || 
    (displaySignatures.length === 1 ? '1-kolom' : displaySignatures.length === 3 ? '3-kolom' : '2-kolom');

  const now = new Date();
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const locationDateStr = cityDate || `${config.profile.kabupaten.replace('Kab. ', '') || 'Probolinggo'}, ${formattedToday}`;

  const gridColsClass = 
    effectiveLayout === '1-kolom' ? 'grid-cols-1 justify-items-end' :
    effectiveLayout === '3-kolom' ? 'grid-cols-1 sm:grid-cols-3' :
    'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`w-full mt-8 pt-4 page-break-inside-avoid text-slate-900 ${className}`}>
      {/* CITY AND DATE HEADER (RIGHT-ALIGNED ON TOP IF MULTI-COLUMN) */}
      <div className="flex justify-end mb-4 text-xs font-medium text-slate-700">
        <span>{locationDateStr}</span>
      </div>

      <div className={`grid ${gridColsClass} gap-8 text-center text-xs`}>
        {displaySignatures.map((sig, idx) => (
          <div key={sig.id || idx} className="flex flex-col items-center justify-between min-h-[140px]">
            {/* JABATAN & KETERANGAN */}
            <div className="space-y-0.5">
              <span className="block text-slate-600 font-medium">
                {sig.keterangan || 'Mengetahui,'}
              </span>
              <span className="block font-bold text-slate-900 uppercase">
                {sig.jabatan}
              </span>
            </div>

            {/* SIGNATURE SPACE OR DIGITAL SIGNATURE IMAGE */}
            <div className="h-16 my-2 flex items-center justify-center relative">
              {sig.signatureImageUrl ? (
                <img 
                  src={sig.signatureImageUrl} 
                  alt={`Tanda Tangan ${sig.nama}`} 
                  className="max-h-14 max-w-[140px] object-contain"
                />
              ) : (
                <div className="w-32 h-14 border border-dashed border-transparent" />
              )}

              {/* DIGITAL STAMP IF AVAILABLE */}
              {sig.stampImageUrl && (
                <img 
                  src={sig.stampImageUrl} 
                  alt="Cap Resmi SPPG" 
                  className="absolute -right-4 -top-2 w-12 h-12 opacity-80 pointer-events-none"
                />
              )}
            </div>

            {/* NAMA LENGKAP & NIP */}
            <div className="space-y-0.5 w-full">
              <span className="block font-bold text-slate-950 underline underline-offset-2">
                {sig.nama}
              </span>
              {sig.nip && (
                <span className="block text-[11px] font-mono text-slate-600">
                  NIP. {sig.nip}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
