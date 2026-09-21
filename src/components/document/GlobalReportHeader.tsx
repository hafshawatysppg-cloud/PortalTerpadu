import React from 'react';
import { useDocumentTemplate } from '../../contexts/DocumentTemplateContext';

export interface GlobalReportHeaderProps {
  documentTypeId?: string;
  title?: string;
  subTitle?: string;
  documentNumber?: string;
  documentDate?: string;
  showMetaGrid?: boolean;
  metadata?: Array<{ label: string; value: string | React.ReactNode }>;
  hideBorder?: boolean;
  className?: string;
  isPrintPreview?: boolean;
}

export const GlobalReportHeader: React.FC<GlobalReportHeaderProps> = ({
  documentTypeId,
  title,
  subTitle,
  documentNumber,
  documentDate,
  showMetaGrid = true,
  metadata = [],
  hideBorder = false,
  className = '',
  isPrintPreview = false
}) => {
  const { config, getDocTypeConfig } = useDocumentTemplate();
  const letterhead = config.letterhead;
  const profile = config.profile;
  const docTypeConfig = documentTypeId ? getDocTypeConfig(documentTypeId) : undefined;

  // Check if letterhead is disabled specifically for this doc type
  if (docTypeConfig && docTypeConfig.enableLetterhead === false) {
    return null;
  }

  const effectiveTitle = title || docTypeConfig?.customTitle;
  const effectiveSubTitle = subTitle || docTypeConfig?.customSubTitle;

  // Build full address string if not overridden
  const fullAddress = letterhead.alamatLengkap || 
    `${profile.alamat}${profile.rtRw ? ` RT/RW ${profile.rtRw}` : ''}, Desa ${profile.desa}, Kec. ${profile.kecamatan}, ${profile.kabupaten}, Prov. ${profile.provinsi} ${profile.kodePos ? `(${profile.kodePos})` : ''}`;

  const borderStyleMap: Record<string, string> = {
    solid: 'border-solid',
    double: 'border-double',
    dashed: 'border-dashed'
  };

  const textAlignClass = 
    letterhead.textAlign === 'left' ? 'text-left' :
    letterhead.textAlign === 'right' ? 'text-right' : 'text-center';

  return (
    <header className={`w-full text-slate-900 select-none ${className}`}>
      {/* KOP SURAT RESMI */}
      <div 
        className={`flex items-center pb-3 ${
          letterhead.logoPosition === 'center' 
            ? 'flex-col justify-center text-center' 
            : letterhead.logoPosition === 'right' 
            ? 'flex-row-reverse justify-between' 
            : 'flex-row justify-between'
        }`}
        style={{
          gap: `${letterhead.gapLogoWithText || 16}px`,
          fontFamily: letterhead.fontFamily === 'inherit' ? undefined : letterhead.fontFamily
        }}
      >
        {/* LOGO RESMI */}
        {letterhead.showLogo && (
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={letterhead.logoUrl || '/badan_gizi_logo.jpg'}
              alt="Logo BGN SPPG"
              style={{
                width: `${letterhead.logoSize || 68}px`,
                height: `${letterhead.logoSize || 68}px`,
                objectFit: 'cover'
              }}
              className="rounded-full shadow-xs border border-slate-300"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/badan_gizi_logo.jpg';
              }}
            />
          </div>
        )}

        {/* IDENTITAS RESMI LEMBAGA */}
        <div className={`flex-1 min-w-0 ${textAlignClass}`}>
          {/* NAMA INSTANSI INDUK */}
          <h1 
            className={`uppercase tracking-tight leading-tight ${letterhead.isBoldInstansi ? 'font-extrabold text-slate-950' : 'font-medium text-slate-800'}`}
            style={{ fontSize: `${letterhead.instansiFontSize || 15}px` }}
          >
            {letterhead.namaInstansi || profile.namaInstansi}
          </h1>

          {/* NAMA UNIT LAYANAN SPPG */}
          <h2 
            className={`uppercase tracking-normal leading-snug mt-0.5 ${letterhead.isBoldSppg ? 'font-bold text-slate-900' : 'font-normal text-slate-700'}`}
            style={{ fontSize: `${letterhead.sppgFontSize || 13}px` }}
          >
            {letterhead.namaSppg || profile.namaSppg}
          </h2>

          {/* NAMA YAYASAN */}
          {(letterhead.namaYayasan || profile.namaYayasan) && (
            <h3 
              className={`tracking-tight leading-snug ${letterhead.isBoldYayasan ? 'font-semibold text-slate-800' : 'font-normal text-slate-600'}`}
              style={{ fontSize: `${letterhead.yayasanFontSize || 12}px` }}
            >
              {letterhead.namaYayasan || profile.namaYayasan}
            </h3>
          )}

          {/* ALAMAT LENGKAP */}
          <p 
            className={`leading-relaxed mt-1 text-slate-600 ${letterhead.isItalicAlamat ? 'italic' : ''}`}
            style={{ fontSize: `${letterhead.alamatFontSize || 10}px` }}
          >
            {fullAddress}
          </p>

          {/* KONTAK, EMAIL, WEB */}
          {letterhead.showContactInfo && (
            <p 
              className="leading-tight text-slate-500 mt-0.5"
              style={{ fontSize: `${Math.max((letterhead.alamatFontSize || 10) - 1, 8)}px` }}
            >
              {profile.nomorTelepon ? `Telp: ${profile.nomorTelepon}` : ''}
              {profile.email ? ` • Email: ${profile.email}` : ''}
              {profile.website ? ` • Web: ${profile.website}` : ''}
            </p>
          )}
        </div>

        {/* BADGE DOKUMEN RESMI (JIKA POSISI BUKAN CENTER) */}
        {letterhead.logoPosition !== 'center' && (
          <div className="hidden sm:flex flex-col items-end justify-center shrink-0 pl-2">
            <span className="px-2.5 py-1 bg-blue-950 text-white font-bold text-[9px] tracking-wider rounded uppercase">
              DOKUMEN RESMI
            </span>
            <span className="text-[9px] font-mono text-slate-500 mt-1">
              SPPG BGN RI
            </span>
          </div>
        )}
      </div>

      {/* GARIS HORIZONTAL PEMBATAS RESMI (KOP SURAT) */}
      {!hideBorder && (
        <div 
          className={`w-full ${borderStyleMap[letterhead.borderStyle || 'double'] || 'border-double'}`}
          style={{
            borderBottomWidth: `${letterhead.borderThickness || 3}px`,
            borderBottomColor: letterhead.borderColor || '#0f172a',
            marginBottom: `${letterhead.kopMarginBottom || 16}px`
          }}
        />
      )}

      {/* JUDUL DOKUMEN & SUBJUDUL */}
      {(effectiveTitle || effectiveSubTitle) && (
        <div className="text-center my-3 space-y-1">
          {effectiveTitle && (
            <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-950 uppercase underline underline-offset-4">
              {effectiveTitle}
            </h3>
          )}
          {effectiveSubTitle && (
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {effectiveSubTitle}
            </p>
          )}
        </div>
      )}

      {/* METADATA SUMMARY BAR / GRID */}
      {showMetaGrid && (documentNumber || documentDate || metadata.length > 0) && (
        <div className="my-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs text-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {documentNumber && (
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nomor Dokumen
              </span>
              <span className="font-mono font-bold text-blue-950 text-[11px]">
                {documentNumber}
              </span>
            </div>
          )}
          {documentDate && (
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tanggal Terbit
              </span>
              <span className="font-semibold text-slate-900">
                {documentDate}
              </span>
            </div>
          )}
          {metadata.map((item, idx) => (
            <div key={idx}>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {item.label}
              </span>
              <span className="font-medium text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
