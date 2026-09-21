import React, { useState, useEffect } from 'react';
import { Menu, Plus, MoveUp, MoveDown, Trash2, Edit3, Circle, Check, Palette, Layers } from 'lucide-react';
import { MenuItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const DynamicMenuView: React.FC = () => {
  const { refreshMenus } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    path: '',
    icon: 'Folder',
    color: '#3B82F6',
    order: 1,
    targetModule: 'portal' as MenuItem['targetModule']
  });

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/v1/menus');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/v1/menus/${editingItem.id}` : '/api/v1/menus';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setEditingItem(null);
        setForm({ title: '', path: '', icon: 'Folder', color: '#3B82F6', order: items.length + 1, targetModule: 'portal' });
        fetchMenus();
        refreshMenus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini dari database?')) return;
    try {
      const res = await fetch(`/api/v1/menus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMenus();
        refreshMenus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap order
    const tempOrder = newItems[index].order;
    newItems[index].order = newItems[targetIndex].order;
    newItems[targetIndex].order = tempOrder;

    setItems(newItems);

    try {
      await fetch('/api/v1/menus/reorder/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: newItems.map(m => ({ id: m.id, order: m.order }))
        })
      });
      fetchMenus();
      refreshMenus();
    } catch (err) {
      console.error(err);
    }
  };

  const iconsList = ['LayoutDashboard', 'Mail', 'Boxes', 'Database', 'Users', 'Menu', 'FileText', 'Code2', 'BookOpen', 'Settings', 'Folder', 'Shield', 'BarChart', 'Bell'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Menu className="w-5 h-5 text-cyan-600" /> Pengelola Menu Dinamis (Database Driven)
          </h2>
          <p className="text-xs text-slate-500">
            Tambah, ubah nama, ganti icon, atur warna, ubah urutan, & kaitkan modul baru tanpa merubah source code
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setForm({ title: '', path: '', icon: 'Folder', color: '#3B82F6', order: items.length + 1, targetModule: 'portal' });
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Menu Baru
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Urutan</th>
              <th className="p-3">Judul Menu</th>
              <th className="p-3">Path Target</th>
              <th className="p-3">Icon & Warna</th>
              <th className="p-3">Modul Terkait</th>
              <th className="p-3 text-right">Aksi Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {items.map((menu, idx) => (
              <tr key={menu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-mono font-bold">
                  <div className="flex items-center gap-1">
                    <span>{menu.order}</span>
                    <button
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === items.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{menu.title}</td>
                <td className="p-3 font-mono text-slate-500">{menu.path}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border shadow-xs" style={{ backgroundColor: menu.color }} />
                    <span className="font-mono text-slate-700 dark:text-slate-300">{menu.icon}</span>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={menu.targetModule === 'esurat' ? 'success' : menu.targetModule === 'stock' ? 'warning' : 'primary'}>
                    {menu.targetModule}
                  </Badge>
                </td>
                <td className="p-3 text-right space-x-1">
                  <button
                    onClick={() => {
                      setEditingItem(menu);
                      setForm({
                        title: menu.title,
                        path: menu.path,
                        icon: menu.icon,
                        color: menu.color || '#3B82F6',
                        order: menu.order,
                        targetModule: menu.targetModule
                      });
                      setIsAddOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingItem ? 'Edit Menu Dinamis' : 'Tambah Menu Dinamis Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Judul Menu</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Path URL Target</label>
                <input
                  type="text"
                  required
                  placeholder="/nama-modul"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Icon Lucide</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  >
                    {iconsList.map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Warna Accent Icon</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 h-9 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Hubungkan dengan Modul</label>
                <select
                  value={form.targetModule}
                  onChange={(e) => setForm({ ...form, targetModule: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value="portal">Portal Utama & Core System</option>
                  <option value="esurat">e-Surat Digital Modul</option>
                  <option value="stock">Stock Opname Modul</option>
                  <option value="external">External Enterprise Application</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Menu Dinamis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
