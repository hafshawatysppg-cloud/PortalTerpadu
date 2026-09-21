import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  MasterDocumentTemplateConfig, 
  DEFAULT_MASTER_TEMPLATE_CONFIG, 
  DocumentTypeTemplate,
  MasterSignature
} from '../types/documentTemplate';
import { useAuth } from '../context/AuthContext';

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

const STORAGE_KEY = 'sppg_master_document_template';

const DocumentTemplateContext = createContext<DocumentTemplateContextType | undefined>(undefined);

export const DocumentTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<MasterDocumentTemplateConfig>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return DEFAULT_MASTER_TEMPLATE_CONFIG;
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state to local storage cache
  const updateLocalConfig = (newConfig: MasterDocumentTemplateConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Fetch initial config from server
  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/document-template');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          updateLocalConfig(json.data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch remote document template, using cached/default:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Partial update methods
  const updateConfig = useCallback((partial: Partial<MasterDocumentTemplateConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...partial };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateProfile = useCallback((profile: Partial<MasterDocumentTemplateConfig['profile']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        profile: { ...prev.profile, ...profile }
      };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateLetterhead = useCallback((letterhead: Partial<MasterDocumentTemplateConfig['letterhead']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        letterhead: { ...prev.letterhead, ...letterhead }
      };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateFormat = useCallback((format: Partial<MasterDocumentTemplateConfig['format']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        format: { ...prev.format, ...format }
      };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateFooter = useCallback((footer: Partial<MasterDocumentTemplateConfig['footer']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        footer: { ...prev.footer, ...footer }
      };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateNumbering = useCallback((numbering: Partial<MasterDocumentTemplateConfig['numbering']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        numbering: { ...prev.numbering, ...numbering }
      };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const updateDocType = useCallback((docTypeId: string, docTypePartial: Partial<DocumentTypeTemplate>) => {
    setConfig(prev => {
      const updatedDocTypes = prev.documentTypes.map(dt => 
        dt.id === docTypeId ? { ...dt, ...docTypePartial } : dt
      );
      const updated = { ...prev, documentTypes: updatedDocTypes };
      updateLocalConfig(updated);
      return updated;
    });
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
      const updated = { ...prev, signatures: updatedSignatures };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  const deleteSignature = useCallback((sigId: string) => {
    setConfig(prev => {
      const updatedSignatures = prev.signatures.filter(s => s.id !== sigId);
      const updated = { ...prev, signatures: updatedSignatures };
      updateLocalConfig(updated);
      return updated;
    });
  }, []);

  // Save to persistent server & Firestore
  const saveConfig = async (customConfig?: MasterDocumentTemplateConfig): Promise<{ success: boolean; message: string }> => {
    setIsSaving(true);
    try {
      const targetConfig = customConfig || config;
      const res = await fetch('/api/v1/document-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': user?.nama || 'Admin Penuh'
        },
        body: JSON.stringify(targetConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateLocalConfig(data.data);
        return { success: true, message: data.message || 'Konfigurasi template berhasil disimpan' };
      } else {
        return { success: false, message: data.message || 'Gagal menyimpan konfigurasi' };
      }
    } catch (err: any) {
      console.error('Error saving document template:', err);
      return { success: false, message: 'Koneksi gagal: ' + (err?.message || err) };
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Factory Default
  const resetToDefault = async (): Promise<{ success: boolean; message: string }> => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/document-template/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': user?.nama || 'Admin Penuh'
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateLocalConfig(data.data);
        return { success: true, message: data.message };
      } else {
        // Fallback local reset
        updateLocalConfig(JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG)));
        return { success: true, message: 'Template di-reset ke standar lokal.' };
      }
    } catch (err: any) {
      updateLocalConfig(JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG)));
      return { success: true, message: 'Template di-reset ke standar lokal default.' };
    } finally {
      setIsSaving(false);
    }
  };

  // Generate automated document number
  const generateDocNumber = async (docCode: string): Promise<string> => {
    try {
      const res = await fetch('/api/v1/document-template/generate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docCode })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.number) {
          // update local counter
          setConfig(prev => {
            const currentCounters = { ...prev.numbering.currentCounters, [docCode]: json.data.counter };
            const updated = {
              ...prev,
              numbering: { ...prev.numbering, currentCounters }
            };
            updateLocalConfig(updated);
            return updated;
          });
          return json.data.number;
        }
      }
    } catch {
      // fallback local generator
    }

    const numbering = config.numbering;
    const current = (numbering.currentCounters[docCode] || 0) + 1;
    const padLen = numbering.counterLength || 3;
    const counterStr = String(current).padStart(padLen, '0');
    const now = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const monthStr = numbering.monthFormat === 'roman' ? romanMonths[now.getMonth()] : String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = numbering.yearFormat === 'YY' ? String(now.getFullYear()).slice(2) : String(now.getFullYear());
    const sep = numbering.separator || '/';

    const num = `${counterStr}${sep}${numbering.prefix}${sep}${docCode}${sep}${monthStr}${sep}${yearStr}`;
    return num;
  };

  const getDocTypeConfig = useCallback((docTypeId: string): DocumentTypeTemplate | undefined => {
    return config.documentTypes.find(dt => dt.id === docTypeId || dt.code === docTypeId);
  }, [config.documentTypes]);

  const testPrint = useCallback((docTypeId?: string) => {
    window.print();
  }, []);

  return (
    <DocumentTemplateContext.Provider
      value={{
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
      }}
    >
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
