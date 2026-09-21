import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, AlertTriangle, Play, Calendar, Users, ShoppingBag, Plus, Trash2, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { MasterBarang } from '../../types';

interface MenuRecipeIngredient {
  barangId: string;
  namaBahan: string;
  kebutuhanPerPorsi: number; // e.g. 0.1 kg per porsi
  satuan: string;
}

interface MenuItemRecipe {
  id: string;
  namaMenu: string;
  kategoriMeal: 'Makan Pagi' | 'Makan Siang' | 'Makan Sore';
  hari: string;
  targetPorsi: number;
  ingredients: MenuRecipeIngredient[];
}

export const MenuPlannerView: React.FC = () => {
  const [stockItems, setStockItems] = useState<MasterBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetServings, setTargetServings] = useState<number>(2500);
  const [cookingStatus, setCookingStatus] = useState<string | null>(null);

  // Initial Menu Plan Recipes
  const [menuList, setMenuList] = useState<MenuItemRecipe[]>([
    {
      id: 'MNU-REC-001',
      namaMenu: 'Nasi Putih + Ayam Goreng Lengkuas + Sayur Sop Bening + Pisang',
      kategoriMeal: 'Makan Siang',
      hari: 'Senin',
      targetPorsi: 2500,
      ingredients: [
        { barangId: 'BRG-001', namaBahan: 'Kertas HVS A4 80gsm PaperOne (Box)', kebutuhanPerPorsi: 0.001, satuan: 'Box' },
        { barangId: 'BRG-003', namaBahan: 'Barcode & QR Scanner Wireless Wireless 2D', kebutuhanPerPorsi: 0.0001, satuan: 'Unit' }
      ]
    }
  ]);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stock/barang');
      const data = await res.json();
      if (data.success) {
        setStockItems(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Compute total ingredients required for current menu list
  const computeIngredientSummary = () => {
    const map = new Map<string, { barangId: string; namaBahan: string; totalDibutuhkan: number; satuan: string }>();

    menuList.forEach(m => {
      m.ingredients.forEach(ing => {
        const key = ing.barangId || ing.namaBahan;
        const total = ing.kebutuhanPerPorsi * targetServings;

        if (map.has(key)) {
          const prev = map.get(key)!;
          prev.totalDibutuhkan += total;
        } else {
          map.set(key, {
            barangId: ing.barangId,
            namaBahan: ing.namaBahan,
            totalDibutuhkan: total,
            satuan: ing.satuan
          });
        }
      });
    });

    return Array.from(map.values()).map(req => {
      const master = stockItems.find(s => s.id === req.barangId || s.namaBarang.toLowerCase().includes(req.namaBahan.toLowerCase()));
      const stokSekarang = master ? master.stokSekarang : 0;
      const isSufficient = stokSekarang >= req.totalDibutuhkan;
      const kekurangan = isSufficient ? 0 : req.totalDibutuhkan - stokSekarang;

      return {
        ...req,
        stokSekarang,
        isSufficient,
        kekurangan,
        masterItem: master
      };
    });
  };

  const ingredientSummary = computeIngredientSummary();
  const hasDeficit = ingredientSummary.some(i => !i.isSufficient);

  // Handle Cook & Deduct Stock
  const handleCookMenu = async () => {
    setCookingStatus('Memproses pemotongan stok bahan baku...');
    try {
      for (const item of ingredientSummary) {
        if (item.masterItem && item.totalDibutuhkan > 0) {
          await fetch('/api/v1/stock/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jenis: 'Keluar',
              barangId: item.masterItem.id,
              jumlah: Math.ceil(item.totalDibutuhkan),
              referensiNota: `COOK-${new Date().toISOString().split('T')[0]}`,
              penerimaTujuan: 'Dapur SPPG (Pengolahan Menu)',
              keterangan: `Eksekusi Memasak Menu (${targetServings} Porsi)`,
              petugas: 'Chef Dapur SPPG'
            })
          });
        }
      }

      setCookingStatus('Pemotongan stok bahan baku berhasil! Log transaksi tercatat.');
      fetchStock();
      setTimeout(() => setCookingStatus(null), 3500);
    } catch (err) {
      console.error('Error cooking menu:', err);
      setCookingStatus('Gagal memproses pemotongan stok.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-extrabold uppercase rounded-full">
              Dapur SPPG Kitchen Module
            </span>
            <span className="text-xs text-amber-100">Evaluasi Otomatis Kecukupan Stok Bahan</span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <ChefHat className="w-7 h-7" /> Perencanaan Menu & Evaluasi Stok Dapur
          </h2>
          <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
            Perhitungkan otomatis kebutuhan bahan baku berdasarkan target porsi penerima manfaat, cek ketersediaan stok fisik di gudang, dan lakukan potong stok otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20">
          <div className="text-right">
            <span className="text-[10px] text-amber-100 uppercase block font-bold">Target Produksi Porsi</span>
            <input
              type="number"
              value={targetServings}
              onChange={(e) => setTargetServings(Number(e.target.value) || 0)}
              className="w-28 text-center bg-white text-slate-900 font-extrabold px-2 py-1 rounded-xl text-sm focus:outline-none"
            />
          </div>
          <Users className="w-6 h-6 text-amber-200" />
        </div>
      </div>

      {cookingStatus && (
        <div className="p-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-md text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" /> {cookingStatus}
        </div>
      )}

      {/* Grid: Left Menu Recipes, Right Stock Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Menu Recipes List */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" /> Daftar Resep Menu Aktif
            </h3>
            <span className="text-xs font-semibold text-slate-400">Target: {targetServings.toLocaleString('id-ID')} Porsi</span>
          </div>

          <div className="space-y-3">
            {menuList.map((menu) => (
              <div
                key={menu.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold rounded-full">
                    {menu.hari} - {menu.kategoriMeal}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {menu.id}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {menu.namaMenu}
                </h4>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 block">Bahan Baku Utama Terhubung:</span>
                  {menu.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                      <span>&bull; {ing.namaBahan}</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {(ing.kebutuhanPerPorsi * targetServings).toFixed(1)} {ing.satuan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Ingredient Stock Adequacy Check */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Analisis Kecukupan Stok Gudang
            </h3>
            {hasDeficit ? (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Stok Kurang!
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Stok Cukup
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {ingredientSummary.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  item.isSufficient
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.namaBahan}</span>
                  <span className="text-[11px] text-slate-500">
                    Kebutuhan ({targetServings} porsi): <strong className="text-slate-800 dark:text-slate-200">{item.totalDibutuhkan.toFixed(1)} {item.satuan}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold block">
                    Stok Fisik: <span className={item.isSufficient ? 'text-emerald-600' : 'text-rose-600'}>{item.stokSekarang} {item.satuan}</span>
                  </span>

                  {!item.isSufficient && (
                    <span className="text-[10px] font-extrabold text-rose-600 block">
                      Defisit: -{item.kekurangan.toFixed(1)} {item.satuan}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCookMenu}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Masak Menu & Potong Stok FIFO/FEFO Otomatis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
