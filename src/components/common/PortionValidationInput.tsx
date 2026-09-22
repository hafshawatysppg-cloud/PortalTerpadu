import React from 'react';
import { CheckCircle2, AlertTriangle, Calculator, ShieldCheck, Check } from 'lucide-react';

export interface PortionBreakdown {
  siswa?: number;
  guru?: number;
  balita?: number;
  ibuHamil?: number;
  ibuMenyusui?: number;
  targetBumilBusui?: number;
}

export interface PortionValidationResult {
  isValid: boolean;
  subtotal: number;
  itemsSum: number;
  formula: string;
  categoryLabel: string;
  hasDiscrepancy: boolean;
  discrepancyMessage?: string;
}

/**
 * Pure calculation and validation function to ensure portions are always
 * dynamically and atomically computed from individual item inputs.
 */
export function calculatePortionValidation(params: {
  namaInstansi?: string;
  klasifikasiPorsi?: string;
  targetMain?: number;
  targetGuru?: number;
  targetBalita?: number;
  targetBumilBusui?: number;
  statusKbm?: 'Aktif' | 'Libur Full' | 'Libur Sebagian' | string;
  targetMaster?: number;
}): PortionValidationResult {
  const {
    klasifikasiPorsi = 'Porsi Besar',
    targetMain = 0,
    targetGuru = 0,
    targetBalita = 0,
    targetBumilBusui = 0,
    statusKbm = 'Aktif',
    targetMaster
  } = params;

  // Determine category label and primary target value
  let categoryLabel = 'Siswa';
  let primaryTarget = Math.max(0, Math.round(Number(targetMain) || 0));
  const guruVal = Math.max(0, Math.round(Number(targetGuru) || 0));

  const klas = (klasifikasiPorsi || '').toLowerCase();
  if (klas.includes('balita')) {
    categoryLabel = 'Balita';
    primaryTarget = targetBalita !== undefined && targetBalita > 0 ? targetBalita : primaryTarget;
  } else if (klas.includes('ibu hamil') || (klas.includes('hamil') && !klas.includes('menyusui'))) {
    categoryLabel = 'Ibu Hamil';
    primaryTarget = targetBumilBusui !== undefined && targetBumilBusui > 0 ? targetBumilBusui : primaryTarget;
  } else if (klas.includes('ibu menyusui') || klas.includes('menyusui')) {
    categoryLabel = 'Ibu Menyusui';
    primaryTarget = targetBumilBusui !== undefined && targetBumilBusui > 0 ? targetBumilBusui : primaryTarget;
  } else if (klas.includes('bumil')) {
    categoryLabel = 'Bumil/Busui';
    primaryTarget = targetBumilBusui !== undefined && targetBumilBusui > 0 ? targetBumilBusui : primaryTarget;
  }

  const itemsSum = primaryTarget + guruVal;
  const isLiburFull = statusKbm === 'Libur Full';
  const subtotal = isLiburFull ? 0 : itemsSum;

  const formula = isLiburFull
    ? `Status Libur Full: 0 Porsi`
    : guruVal > 0
    ? `${primaryTarget} (${categoryLabel}) + ${guruVal} (Guru) = ${subtotal} Porsi`
    : `${primaryTarget} (${categoryLabel}) = ${subtotal} Porsi`;

  let hasDiscrepancy = false;
  let discrepancyMessage = undefined;

  if (targetMaster !== undefined && targetMaster > 0 && !isLiburFull) {
    const diff = subtotal - targetMaster;
    if (diff !== 0) {
      hasDiscrepancy = true;
      discrepancyMessage = diff > 0 
        ? `Lebih +${diff} porsi dari target master (${targetMaster} Porsi)`
        : `Kurang ${Math.abs(diff)} porsi dari target master (${targetMaster} Porsi)`;
    }
  }

  return {
    isValid: !isNaN(subtotal) && subtotal >= 0,
    subtotal,
    itemsSum,
    formula,
    categoryLabel,
    hasDiscrepancy,
    discrepancyMessage
  };
}

/**
 * Visual Real-time Validation Badge
 * Displays dynamic calculation formula, synchronized total, and validation confirmation
 */
interface PortionValidationBadgeProps {
  subtotal: number;
  formula: string;
  categoryLabel?: string;
  hasDiscrepancy?: boolean;
  discrepancyMessage?: string;
  showFormula?: boolean;
  compact?: boolean;
}

export const PortionValidationBadge: React.FC<PortionValidationBadgeProps> = ({
  subtotal,
  formula,
  hasDiscrepancy = false,
  discrepancyMessage,
  showFormula = true,
  compact = false
}) => {
  return (
    <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'}`}>
      <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-mono text-xs font-black shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{subtotal} Porsi</span>
        <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider bg-emerald-200/60 px-1.5 py-0.2 rounded-md">
          Sinkron
        </span>
      </div>

      {showFormula && (
        <div className="text-[10px] text-slate-500 font-medium text-center truncate flex items-center justify-center gap-1">
          <Calculator className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{formula}</span>
        </div>
      )}

      {hasDiscrepancy && discrepancyMessage && (
        <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center justify-center gap-1 font-semibold">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">{discrepancyMessage}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Real-time Validated Input Field for Portion Items
 * Guarantees numbers are non-negative, sanitized, and triggers instant recalculation
 */
interface ValidatedPortionInputProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
  min?: number;
  placeholder?: string;
  className?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const ValidatedPortionInput: React.FC<ValidatedPortionInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  min = 0,
  placeholder = '0',
  className = '',
  helperText,
  icon
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = Number(raw);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.floor(num)));
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-slate-600 block mb-0.5 text-center flex items-center justify-center gap-1">
        {icon}
        <span>{label}</span>
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          disabled={disabled}
          value={value === 0 ? '0' : value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
        />
      </div>
      {helperText && (
        <span className="text-[9px] text-slate-400 text-center mt-0.5">{helperText}</span>
      )}
    </div>
  );
};

/**
 * Real-time Validation Indicator Summary Component
 * Renders a full audit bar showing live synchronization status across all items
 */
interface RealtimeValidationAuditBarProps {
  totalItems: number;
  totalSubtotal: number;
  totalMaster?: number;
  isValid: boolean;
  unitLabel?: string;
}

export const RealtimeValidationAuditBar: React.FC<RealtimeValidationAuditBarProps> = ({
  totalItems,
  totalSubtotal,
  totalMaster,
  isValid,
  unitLabel = 'Lembaga'
}) => {
  const diff = totalMaster !== undefined ? totalSubtotal - totalMaster : 0;

  return (
    <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-extrabold text-white flex items-center gap-1.5">
            <span>Validasi Porsi Real-Time:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" />
              100% Terhitung Dinamis
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Subtotal dihitung otomatis dan sinkron per item ({totalItems} {unitLabel})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Akumulasi Porsi</div>
          <div className="text-sm font-black text-emerald-400 font-mono">
            {totalSubtotal.toLocaleString('id-ID')} Porsi
          </div>
        </div>

        {totalMaster !== undefined && (
          <div className="text-right pl-3 border-l border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Target Master Kelompok</div>
            <div className={`text-sm font-black font-mono ${diff === 0 ? 'text-slate-300' : 'text-amber-400'}`}>
              {totalMaster.toLocaleString('id-ID')} Porsi
              {diff !== 0 && (
                <span className="text-xs ml-1 font-semibold">
                  ({diff > 0 ? `+${diff}` : diff})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
