import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Lock } from 'lucide-react';
import { RolePermission, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';

export const RolePermissionView: React.FC = () => {
  const [roles, setRoles] = useState<RolePermission[]>([]);

  useEffect(() => {
    fetch('/api/v1/roles')
      .then(r => r.json())
      .then(d => {
        if (d.success) setRoles(d.data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" /> Matriks Hak Akses & Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500">
          Konfigurasi hak akses 7 tingkatan Role: Super Admin, Admin, Operator, Supervisor, Manager, Staff, Viewer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.role}</h3>
              </div>
              <Badge variant="primary">RBAC Active</Badge>
            </div>

            <p className="text-xs text-slate-500">{r.description}</p>

            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300">Akses Modul:</div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {Object.entries(r.modulesAccess).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    {val ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={val ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'}>
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
