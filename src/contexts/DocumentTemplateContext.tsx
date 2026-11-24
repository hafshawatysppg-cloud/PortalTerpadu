import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  MasterDocumentTemplateConfig, 
  DEFAULT_MASTER_TEMPLATE_CONFIG, 
  DocumentTypeTemplate,
  MasterSignature
} from '../types/documentTemplate';
import { useAuth } from '../context/AuthContext';
import { safeParseJson } from '../lib/safeJson';
import { db } from '../lib/firebase';
import {
  OperationType,
  isFirestoreQuotaError,
  isFirestoreQuotaExhausted,
  markFirestoreQuotaExhausted,
  notifyFirestoreFailure,
  sanitizeForFirestore
} from '../lib/firestoreHelper';

interface DocumentTemplateContextType {
  config: MasterDocumentTemplateConfig;
  loading: boolean;
  isSaving: boolean;
  updateConfig: (partial: Partial<MasterDocumentTemplateConfig>) => void;
  updateProfile: (profile: Partial<MasterDocumentTemplateConfig['profile']>) => void;
  updateLetterhead: (letterhead: Partial<MasterDocumentTemplateConfig['letterhead']>) => void;
  updateFormat: (format: Partial<MasterDocumentTemplateConfig['format']>) => void;
  updateFooter: (footer: Partial<MasterDocumentTemplateConfig['footer']>) => void;
  updateNumbering: (numbering: Partial<MasterDocumentTemplateConfig['numbering']>) => void;
  updateDocType: (docTypeId: string, docType: Partial<DocumentTypeTemplate>) => void;
  saveSignature: (sig: MasterSignature) => void;
  deleteSignature: (sigId: string) => void;
  saveConfig: (customConfig?: MasterDocumentTemplateConfig) => Promise<{ success: boolean; message: string }>;
  resetToDefault: () => Promise<{ success: boolean; message: string }>;
  generateDocNumber: (docCode: string) => Promise<string>;
  getDocTypeConfig: (docTypeId: string) => DocumentTypeTemplate | undefined;
  refreshConfig: () => Promise<void>;
  testPrint: (docTypeId?: string) => void;
}

const DocumentTemplateContext = createContext<DocumentTemplateContextType | undefined>(undefined);

function mergeWithDefaultTemplate(
  incoming?: Partial<MasterDocumentTemplateConfig> | null
): MasterDocumentTemplateConfig {
  if (!incoming || typeof incoming !== 'object') {
    return DEFAULT_MASTER_TEMPLATE_CONFIG;
  }
  return {
    ...DEFAULT_MASTER_TEMPLATE_CONFIG,
    ...incoming,
    profile: {
      ...DEFAULT_MASTER_TEMPLATE_CONFIG.profile,
      ...(incoming.profile || {}),
    },
    letterhead: {
      ...DEFAULT_MASTER_TEMPLATE_CONFIG.letterhead,
      ...(incoming.letterhead || {}),
    },
    format: {
      ...DEFAULT_MASTER_TEMPLATE_CONFIG.format,
      ...(incoming.format || {}),
    },
    footer: {
      ...DEFAULT_MASTER_TEMPLATE_CONFIG.footer,
      ...(incoming.footer || {}),
    },
    numbering: {
      ...DEFAULT_MASTER_TEMPLATE_CONFIG.numbering,
      ...(incoming.numbering || {}),
      currentCounters: {
        ...DEFAULT_MASTER_TEMPLATE_CONFIG.numbering.currentCounters,
        ...(incoming.numbering?.currentCounters || {}),
      },
    },
    signatures: Array.isArray(incoming.signatures)
      ? incoming.signatures
      : DEFAULT_MASTER_TEMPLATE_CONFIG.signatures,
    documentTypes: Array.isArray(incoming.documentTypes)
      ? incoming.documentTypes
      : DEFAULT_MASTER_TEMPLATE_CONFIG.documentTypes,
  };
}

export const DocumentTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<MasterDocumentTemplateConfig>(DEFAULT_MASTER_TEMPLATE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;

  // Fetch initial config from REST API + subscribe real-time from Firestore
  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/document-template');
      if (res.ok) {
        const json = await safeParseJson<{ success?: boolean; data?: MasterDocumentTemplateConfig }>(res);
        if (json?.success && json.data) {
          setConfig(mergeWithDefaultTemplate(json.data));
        }
      }
    } catch (err) {
      console.error('Could not fetch remote document template:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    if (isFirestoreQuotaExhausted()) {
      return;
    }
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(
        doc(db, 'documentTemplate', 'main'),
        (snap) => {
          if (snap.exists()) {
            setConfig(mergeWithDefaultTemplate(snap.data() as MasterDocumentTemplateConfig));
            setLoading(false);
          }
        },
        (err) => {
          if (isFirestoreQuotaError(err)) {
            markFirestoreQuotaExhausted();
            try {
              unsub?.();
            } catch (_) {}
          }
          notifyFirestoreFailure(err, OperationType.GET, 'documentTemplate/main', 'Gagal menyinkronkan template dokumen dari Firebase');
        }
      );
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        markFirestoreQuotaExhausted();
      }
      notifyFirestoreFailure(err, OperationType.GET, 'documentTemplate/main', 'Gagal menyinkronkan template dokumen dari Firebase');
    }
    return () => {
      try {
        unsub?.();
      } catch (_) {}
    };
  }, [refreshConfig]);

  // Partial update methods
  const updateConfig = useCallback((partial: Partial<MasterDocumentTemplateConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const updateProfile = useCallback((profile: Partial<MasterDocumentTemplateConfig['profile']>) => {
    setConfig(prev => ({
      ...prev,
      profile: { ...prev.profile, ...profile }
    }));
  }, []);

  const updateLetterhead = useCallback((letterhead: Partial<MasterDocumentTemplateConfig['letterhead']>) => {
    setConfig(prev => ({
      ...prev,
      letterhead: { ...prev.letterhead, ...letterhead }
    }));
  }, []);

  const updateFormat = useCallback((format: Partial<MasterDocumentTemplateConfig['format']>) => {
    setConfig(prev => ({
      ...prev,
      format: { ...prev.format, ...format }
    }));
  }, []);

  const updateFooter = useCallback((footer: Partial<MasterDocumentTemplateConfig['footer']>) => {
    setConfig(prev => ({
      ...prev,
      footer: { ...prev.footer, ...footer }
    }));
  }, []);

  const updateNumbering = useCallback((numbering: Partial<MasterDocumentTemplateConfig['numbering']>) => {
    setConfig(prev => ({
      ...prev,
      numbering: { ...prev.numbering, ...numbering }
    }));
  }, []);

  const updateDocType = useCallback((docTypeId: string, docTypePartial: Partial<DocumentTypeTemplate>) => {
    setConfig(prev => ({
      ...prev,
      documentTypes: prev.documentTypes.map(dt =>
        dt.id === docTypeId ? { ...dt, ...docTypePartial } : dt
      )
    }));
  }, []);

  const saveSignature = useCallback((sig: MasterSignature) => {
    setConfig(prev => {
      const existingIdx = prev.signatures.findIndex(s => s.id === sig.id);
      let updatedSignatures: MasterSignature[];
      if (existingIdx >= 0) {
        updatedSignatures = [...prev.signatures];
        updatedSignatures[existingIdx] = sig;
      } else {
        updatedSignatures = [...prev.signatures, sig];
      }
      return { ...prev, signatures: updatedSignatures };
    });
  }, []);

  const deleteSignature = useCallback((sigId: string) => {
    setConfig(prev => ({
      ...prev,
      signatures: prev.signatures.filter(s => s.id !== sigId)
    }));
  }, []);

  // Save directly to Firestore (with merge: true) and sync server REST API
  const saveConfig = useCallback(async (customConfig?: MasterDocumentTemplateConfig): Promise<{ success: boolean; message: string }> => {
    setIsSaving(true);
    const targetConfig = mergeWithDefaultTemplate(customConfig || configRef.current);
    try {
      setConfig(targetConfig);
      if (!isFirestoreQuotaExhausted()) {
        try {
          await setDoc(doc(db, 'documentTemplate', 'main'), sanitizeForFirestore(targetConfig), { merge: true });
        } catch (fsErr) {
          if (isFirestoreQuotaError(fsErr)) {
            markFirestoreQuotaExhausted();
            notifyFirestoreFailure(fsErr, OperationType.WRITE, 'documentTemplate/main', 'Kuota Firebase tercapai; menyimpan ke server lokal');
          } else {
            throw fsErr;
          }
        }
      }

      const res = await fetch('/api/v1/document-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': user?.nama || 'Admin Penuh'
        },
        body: JSON.stringify(targetConfig)
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.data) {
        setConfig(mergeWithDefaultTemplate(data.data));
      }
      return { success: true, message: data?.message || 'Konfigurasi template berhasil disimpan' };
    } catch (err: any) {
      const msg = notifyFirestoreFailure(err, OperationType.WRITE, 'documentTemplate/main', 'Gagal menyimpan template dokumen ke Firebase');
      return { success: false, message: msg };
    } finally {
      setIsSaving(false);
    }
  }, [user?.nama]);

  // Reset to Factory Default
  const resetToDefault = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsSaving(true);
    try {
      const defaultPayload = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));
      setConfig(defaultPayload);
      if (!isFirestoreQuotaExhausted()) {
        try {
          await setDoc(doc(db, 'documentTemplate', 'main'), sanitizeForFirestore(defaultPayload), { merge: true });
        } catch (fsErr) {
          if (isFirestoreQuotaError(fsErr)) {
            markFirestoreQuotaExhausted();
            notifyFirestoreFailure(fsErr, OperationType.WRITE, 'documentTemplate/main', 'Kuota Firebase tercapai; reset dilakukan di server lokal');
          } else {
            throw fsErr;
          }
        }
      }

      const res = await fetch('/api/v1/document-template/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': user?.nama || 'Admin Penuh'
        }
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.data) {
        setConfig(mergeWithDefaultTemplate(data.data));
      }
      return { success: true, message: data?.message || 'Template berhasil di-reset ke standar default.' };
    } catch (err: any) {
      const msg = notifyFirestoreFailure(err, OperationType.WRITE, 'documentTemplate/main', 'Gagal reset template dokumen di Firebase');
      return { success: false, message: msg };
    } finally {
      setIsSaving(false);
    }
  }, [user?.nama]);

  // Generate automated document number
  const generateDocNumber = useCallback(async (docCode: string): Promise<string> => {
    try {
      const res = await fetch('/api/v1/document-template/generate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docCode })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.number) {
          setConfig(prev => ({
            ...prev,
            numbering: {
              ...prev.numbering,
              currentCounters: { ...(prev.numbering?.currentCounters || {}), [docCode]: json.data.counter }
            }
          }));
          return json.data.number;
        }
      }
    } catch (err) {
      console.error('Error generating document number from API:', err);
    }

    const numbering = configRef.current.numbering || DEFAULT_MASTER_TEMPLATE_CONFIG.numbering;
    const current = (numbering.currentCounters?.[docCode] || 0) + 1;
    const padLen = numbering.counterLength || 3;
    const counterStr = String(current).padStart(padLen, '0');
    const now = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const monthStr = numbering.monthFormat === 'roman' ? romanMonths[now.getMonth()] : String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = numbering.yearFormat === 'YY' ? String(now.getFullYear()).slice(2) : String(now.getFullYear());
    const sep = numbering.separator || '/';

    const num = `${counterStr}${sep}${numbering.prefix}${sep}${docCode}${sep}${monthStr}${sep}${yearStr}`;
    return num;
  }, []);

  const getDocTypeConfig = useCallback((docTypeId: string): DocumentTypeTemplate | undefined => {
    return (config.documentTypes || []).find(dt => dt.id === docTypeId || dt.code === docTypeId);
  }, [config.documentTypes]);

  const testPrint = useCallback((_docTypeId?: string) => {
    window.print();
  }, []);

  const contextValue = useMemo(() => ({
    config,
    loading,
    isSaving,
    updateConfig,
    updateProfile,
    updateLetterhead,
    updateFormat,
    updateFooter,
    updateNumbering,
    updateDocType,
    saveSignature,
    deleteSignature,
    saveConfig,
    resetToDefault,
    generateDocNumber,
    getDocTypeConfig,
    refreshConfig,
    testPrint
  }), [
    config,
    loading,
    isSaving,
    updateConfig,
    updateProfile,
    updateLetterhead,
    updateFormat,
    updateFooter,
    updateNumbering,
    updateDocType,
    saveSignature,
    deleteSignature,
    saveConfig,
    resetToDefault,
    generateDocNumber,
    getDocTypeConfig,
    refreshConfig,
    testPrint
  ]);

  return (
    <DocumentTemplateContext.Provider value={contextValue}>
      {children}
    </DocumentTemplateContext.Provider>
  );
};

export const useDocumentTemplate = () => {
  const context = useContext(DocumentTemplateContext);
  if (!context) {
    throw new Error('useDocumentTemplate must be used within a DocumentTemplateProvider');
  }
  return context;
};
