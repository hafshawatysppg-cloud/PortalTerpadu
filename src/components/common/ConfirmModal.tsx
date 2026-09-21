import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  danger = true,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
