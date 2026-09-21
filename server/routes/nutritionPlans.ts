import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { 
  NutritionPlan, 
  NutritionPlanItem, 
  MasterBahanPangan, 
  MasterMenuResep,
  NutritionPlanRekapItem 
} from '../../src/types';
import { syncSaveDoc, syncDeleteDoc, syncSaveBatch } from '../db/firestore';

const router = Router();

// Helper calculation function
function computePlanItem(
  planId: string,
  menuName: string,
  targetGroup: string,
  targetCount: number,
  itemData: any,
  idx: number
): NutritionPlanItem {
  const ingredient = dbStore.masterBahanPangan.find(b => b.id === itemData.ingredientId);
  const ingredientName = itemData.ingredientName || ingredient?.namaBahan || 'Bahan Pangan Baru';
  const netWeightGram = Number(itemData.netWeightGram) || 0;
  
  let bddPercent = Number(itemData.bddPercent);
  if (isNaN(bddPercent) || bddPercent <= 0) {
    bddPercent = ingredient?.bddDefault || 100;
  }
  bddPercent = Math.min(100, Math.max(0.1, bddPercent));

  // Formula 1: Berat Kotor (gr) = Berat Bersih / (BDD / 100)
  const grossWeightGram = Number((netWeightGram / (bddPercent / 100)).toFixed(2));

  // Formula 2: Kebutuhan Bahan Pangan (kg) = (Berat Kotor * Jumlah Sasaran) / 1000
  const requiredKg = Number(((grossWeightGram * targetCount) / 1000).toFixed(4));

  // Price & Total
  const pricePerKg = Number(itemData.pricePerKg ?? ingredient?.hargaDasarPerKg ?? 0);
  
  // Formula 3: Harga Total = Kebutuhan (kg) * Harga Dasar / kg
  const totalPrice = Math.round(requiredKg * pricePerKg);

  // Stock & Deficit from Stock Opname / Master Barang
  let stockAvailable = Number(itemData.stockAvailable ?? 0);
  if (ingredient) {
    // Search matching barang in stock opname store by name
    const matchingStockBarang = dbStore.barang.find(b => 
      b.namaBarang.toLowerCase().includes(ingredient.namaBahan.toLowerCase()) ||
      ingredient.namaBahan.toLowerCase().includes(b.namaBarang.toLowerCase())
    );
    if (matchingStockBarang) {
      stockAvailable = matchingStockBarang.stokSekarang;
    } else {
      stockAvailable = 50; // default stock available fallback
    }
  }

  // Formula 4: Shortage = Kebutuhan (kg) - Stock Tersedia
  const shortageKg = Number(Math.max(0, requiredKg - stockAvailable).toFixed(4));

  let status: 'CUKUP' | 'PERLU PENGADAAN' | 'HARGA BELUM ADA' | 'DATA BELUM LENGKAP' = 'CUKUP';
  if (!ingredient && !itemData.ingredientId) {
    status = 'DATA BELUM LENGKAP';
  } else if (pricePerKg <= 0) {
    status = 'HARGA BELUM ADA';
  } else if (shortageKg > 0) {
    status = 'PERLU PENGADAAN';
  } else {
    status = 'CUKUP';
  }

  return {
    id: itemData.id || `PLI-${Date.now()}-${idx + 1}`,
    planId,
    menuName: itemData.menuName || menuName,
    ingredientId: itemData.ingredientId || `CUSTOM-${Date.now()}`,
    ingredientName,
    targetGroup: itemData.targetGroup || targetGroup,
    netWeightGram,
    bddPercent,
    grossWeightGram,
    targetCount,
    requiredKg,
    pricePerKg,
    totalPrice,
    stockAvailable,
    shortageKg,
    status,
    notes: itemData.notes || (shortageKg > 0 ? `Defisit ${shortageKg} kg` : 'Stok Cukup')
  };
}

// 1. GET TARGET COUNT AUTOMATICALLY FROM PENERIMA MANFAAT
router.get('/target-count', (req: Request, res: Response): void => {
  const tanggal = (req.query.tanggal as string) || new Date().toISOString().split('T')[0];
  const targetGroup = (req.query.targetGroup as string) || 'Porsi Besar';

  const count = dbStore.getTargetCountForDateAndGroup(tanggal, targetGroup);

  res.json({
    success: true,
    tanggal,
    targetGroup,
    targetCount: count
  });
});

// 1.1 GET REAL-TIME SYNC CONTEXT (Menu Harian Tugas Divisi + Penerima Manfaat + Existing Plan)
router.get('/sync-context', (req: Request, res: Response): void => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tanggal = (req.query.tanggal as string) || todayStr;

  // 1. Get menu from Tugas Divisi
  const tugasRecords = dbStore.getTugasDivisiForDate(tanggal);
  const foundMenuTugas = tugasRecords.find(r => r.menuHarian && r.menuHarian.trim() !== '')?.menuHarian || '';

  // 2. Get beneficiary summary & target counts
  const summary = dbStore.getBeneficiarySummaryForDate(tanggal);
  const pb = summary.portionBreakdown || {
    porsiBesar: 2220,
    porsiKecil: 471,
    balita: 75,
    bumilBusui: 43
  };

  const targetCounts = {
    porsiKecil: pb.porsiKecil || 0,
    porsiBesar: pb.porsiBesar || 0,
    balita: pb.balita || 0,
    bumilBusui: pb.bumilBusui || 0,
    total: summary.totalPenerima || (pb.porsiKecil + pb.porsiBesar + pb.balita + pb.bumilBusui)
  };

  // 3. Existing plan
  const existingPlan = dbStore.nutritionPlans.find(p => p.tanggalPelaksanaan === tanggal) || null;

  res.json({
    success: true,
    tanggal,
    menuTugasDivisi: foundMenuTugas,
    hasTugasDivisiMenu: Boolean(foundMenuTugas && foundMenuTugas.trim().length > 0),
    targetCounts,
    beneficiarySummary: summary,
    existingPlan
  });
});

// 2. GET MASTER INGREDIENTS (Bahan Pangan)
router.get('/master/ingredients', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.masterBahanPangan
  });
});

// 3. POST / PUT MASTER INGREDIENT
router.post('/master/ingredients', (req: Request, res: Response): void => {
  const { namaBahan, kategori, satuanPembelian, satuanPerhitungan, bddDefault, hargaDasarPerKg, supplier, lokasi, keterangan, faktorKonversi } = req.body;

  if (!namaBahan) {
    res.status(400).json({ success: false, message: 'Nama bahan pangan wajib diisi' });
    return;
  }

  const newIng: MasterBahanPangan = {
    id: `ING-${String(dbStore.masterBahanPangan.length + 1).padStart(3, '0')}`,
    namaBahan,
    kategori: kategori || 'Lain-lain',
    satuanPembelian: satuanPembelian || 'kg',
    satuanPerhitungan: satuanPerhitungan || 'gram',
    bddDefault: Number(bddDefault) || 100,
    hargaDasarPerKg: Number(hargaDasarPerKg) || 0,
    supplier: supplier || '',
    lokasi: lokasi || '',
    keterangan: keterangan || '',
    statusAktif: 'Aktif',
    faktorKonversi: faktorKonversi || '1 kg = 1000 gram',
    updatedAt: new Date().toISOString()
  };

  dbStore.masterBahanPangan.push(newIng);
  dbStore.addLog('USR-SYSTEM', 'Ahli Gizi', 'Perencanaan Bahan', 'Tambah Master Bahan', `Menambahkan bahan: ${namaBahan}`);

  res.json({ success: true, data: newIng, message: 'Bahan pangan berhasil ditambahkan ke master data' });
});

router.put('/master/ingredients/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.masterBahanPangan.findIndex(b => b.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Bahan pangan tidak ditemukan' });
    return;
  }

  dbStore.masterBahanPangan[idx] = {
    ...dbStore.masterBahanPangan[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  dbStore.addLog('USR-SYSTEM', 'Ahli Gizi', 'Perencanaan Bahan', 'Update Master Bahan', `Update bahan: ${dbStore.masterBahanPangan[idx].namaBahan}`);
  res.json({ success: true, data: dbStore.masterBahanPangan[idx], message: 'Data bahan pangan diperbarui' });
});

// 4. GET MASTER RECIPES (Menu Resep)
router.get('/master/recipes', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.masterMenuResep
  });
});

// 5. GET ALL NUTRITION PLANS
router.get('/', (req: Request, res: Response): void => {
  const { tanggal, status, q } = req.query;

  let plans = [...dbStore.nutritionPlans];

  if (tanggal) {
    plans = plans.filter(p => p.tanggalPelaksanaan === tanggal || p.tanggalPerencanaan === tanggal);
  }

  if (status) {
    plans = plans.filter(p => p.status === status);
  }

  if (q) {
    const query = (q as string).toLowerCase();
    plans = plans.filter(p => 
      p.menuName.toLowerCase().includes(query) ||
      p.targetGroup.toLowerCase().includes(query) ||
      p.nutritionistName.toLowerCase().includes(query)
    );
  }

  // Attach items to each plan
  const plansWithItems = plans.map(p => ({
    ...p,
    items: dbStore.nutritionPlanItems.filter(i => i.planId === p.id)
  }));

  res.json({
    success: true,
    total: plansWithItems.length,
    data: plansWithItems
  });
});

// 6. GET SINGLE NUTRITION PLAN BY ID
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const plan = dbStore.nutritionPlans.find(p => p.id === id);

  if (!plan) {
    res.status(404).json({ success: false, message: 'Perencanaan bahan pangan tidak ditemukan' });
    return;
  }

  const items = dbStore.nutritionPlanItems.filter(i => i.planId === plan.id);

  res.json({
    success: true,
    data: {
      ...plan,
      items
    }
  });
});

// 6.1 GET PLAN BY TANGGAL PELAKSANAAN
router.get('/by-date/:tanggal', (req: Request, res: Response): void => {
  const { tanggal } = req.params;
  const plan = dbStore.nutritionPlans.find(p => p.tanggalPelaksanaan === tanggal);

  if (!plan) {
    res.status(404).json({ success: false, message: `Belum ada perencanaan menu untuk tanggal ${tanggal}` });
    return;
  }

  const items = dbStore.nutritionPlanItems.filter(i => i.planId === plan.id);

  res.json({
    success: true,
    data: {
      ...plan,
      items
    }
  });
});

// 6.2 SAVE OR UPDATE PLAN SPECIFICALLY BY TANGGAL PELAKSANAAN
router.post('/save-by-date', (req: Request, res: Response): void => {
  const {
    tanggalPerencanaan,
    tanggalPelaksanaan,
    menuId,
    menuName,
    targetGroup,
    targetCount,
    periode,
    keterangan,
    nutritionistId,
    nutritionistName,
    kepalaSppgName,
    status,
    items,
    ingredientsData,
    targetCountsConfig,
    totalCost: customCost,
    totalWeightKg: customWeight
  } = req.body;

  if (!tanggalPelaksanaan) {
    res.status(400).json({ success: false, message: 'Tanggal pelaksanaan wajib dipilih' });
    return;
  }

  if (!menuName) {
    res.status(400).json({ success: false, message: 'Nama menu utama wajib diisi' });
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const planDate = tanggalPerencanaan || todayStr;
  const execDate = tanggalPelaksanaan;

  const totalSasaran = targetCountsConfig 
    ? (targetCountsConfig.porsiKecil + targetCountsConfig.porsiBesar + targetCountsConfig.balita + targetCountsConfig.bumilBusui)
    : (Number(targetCount) || 2809);

  // Check if an existing plan exists for this tanggalPelaksanaan
  const existingIdx = dbStore.nutritionPlans.findIndex(p => p.tanggalPelaksanaan === execDate);

  // If existing plan is already FINAL, prevent saving/overwriting unless explicitly authorized
  if (existingIdx !== -1 && dbStore.nutritionPlans[existingIdx].status === 'Final' && !req.body.allowRevision) {
    res.status(403).json({
      success: false,
      message: `Perencanaan menu untuk tanggal pelaksanaan ${execDate} sudah berstatus FINAL & TERKUNCI (${dbStore.nutritionPlans[existingIdx].menuName}). Buka kunci revisi terlebih dahulu untuk mengubah data.`
    });
    return;
  }

  let planId: string;
  let isUpdate = false;

  if (existingIdx !== -1) {
    planId = dbStore.nutritionPlans[existingIdx].id;
    isUpdate = true;
  } else {
    planId = `PLAN-${execDate.replace(/-/g, '')}-${String(dbStore.nutritionPlans.length + 1).padStart(3, '0')}`;
  }

  // Process items if provided
  let processedItems: NutritionPlanItem[] = [];
  if (Array.isArray(items) && items.length > 0) {
    dbStore.nutritionPlanItems = dbStore.nutritionPlanItems.filter(i => i.planId !== planId);
    processedItems = items.map((it, idx) => computePlanItem(planId, menuName, targetGroup || 'Multi-Kelompok', totalSasaran, it, idx));
    dbStore.nutritionPlanItems.push(...processedItems);
  }

  const calculatedCost = processedItems.length > 0 
    ? processedItems.reduce((acc, curr) => acc + curr.totalPrice, 0)
    : (Number(customCost) || 0);

  const calculatedWeight = processedItems.length > 0 
    ? Number(processedItems.reduce((acc, curr) => acc + curr.requiredKg, 0).toFixed(2))
    : (Number(customWeight) || 0);

  const planPayload: NutritionPlan = {
    id: planId,
    tanggalPerencanaan: planDate,
    tanggalPelaksanaan: execDate,
    menuId: menuId || undefined,
    menuName,
    targetGroup: targetGroup || 'Multi-Kelompok (Porsi Kecil, Besar, Balita, Bumil/Busui)',
    targetCount: totalSasaran,
    periode: periode || 'Harian',
    keterangan: keterangan || 'Standar Menu SPPG Probolinggo Krejengan Temenggungan',
    nutritionistId: nutritionistId || 'USR-006',
    nutritionistName: nutritionistName || 'Fitria, S. ST',
    kepalaSppgName: kepalaSppgName || 'Sri Rohayu, S. Pd',
    status: status || 'Draft',
    totalCost: calculatedCost,
    totalWeightKg: calculatedWeight,
    ingredientsData: ingredientsData || undefined,
    targetCountsConfig: targetCountsConfig || undefined,
    createdAt: isUpdate ? dbStore.nutritionPlans[existingIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isUpdate) {
    dbStore.nutritionPlans[existingIdx] = planPayload;
  } else {
    dbStore.nutritionPlans.unshift(planPayload);
  }

  // Persist Nutrition Plan to Firestore
  syncSaveDoc('nutritionPlans', planPayload.id, planPayload);
  if (processedItems && processedItems.length > 0) {
    syncSaveBatch('nutritionPlanItems', processedItems);
  }

  // Synchronize Final / Revisi status to RAB Plan for same execution date
  const rabPlan = dbStore.getOrCreateRABForDate(execDate);
  if (status === 'Final') {
    rabPlan.status = 'Final';
    rabPlan.approvedAt = new Date().toISOString();
    rabPlan.approvedBy = kepalaSppgName || 'Sri Rohayu, S. Pd (Kepala SPPG)';
    rabPlan.updatedAt = new Date().toISOString();
  } else if (status === 'Revisi' || status === 'Draft') {
    if (rabPlan.status === 'Final' && req.body.allowRevision) {
      rabPlan.status = 'Draft';
      rabPlan.updatedAt = new Date().toISOString();
    }
  }
  syncSaveDoc('rabPlans', rabPlan.id, rabPlan);

  // Real-time synchronization to Tugas Divisi menu harian
  if (req.body.syncToTugasDivisi !== false && menuName) {
    const tugasRecords = dbStore.getOrCreateTugasDivisiForDate(execDate);
    tugasRecords.forEach(r => {
      r.menuHarian = menuName;
    });
    syncSaveBatch('tugasDivisi', tugasRecords);
  }

  dbStore.addLog(
    planPayload.nutritionistId,
    planPayload.nutritionistName,
    'Perencanaan Bahan',
    isUpdate ? 'Update Perencanaan Menu' : 'Simpan Perencanaan Menu',
    `Menyimpan perencanaan menu untuk tanggal pelaksanaan ${execDate}: ${menuName} (${totalSasaran} sasaran)`
  );

  dbStore.addNotification(
    'Tugas Divisi',
    `Perencanaan Menu Tanggal ${execDate}`,
    `Perencanaan menu "${menuName}" untuk tanggal pelaksanaan ${execDate} berhasil disimpan.`,
    'info',
    '/perencanaan-bahan'
  );

  res.json({
    success: true,
    message: `Perencanaan menu untuk tanggal pelaksanaan ${execDate} berhasil disimpan!`,
    data: {
      ...planPayload,
      items: processedItems
    }
  });
});

// 7. CREATE NEW NUTRITION PLAN
router.post('/', (req: Request, res: Response): void => {
  const {
    tanggalPerencanaan,
    tanggalPelaksanaan,
    menuId,
    menuName,
    targetGroup,
    targetCount,
    periode,
    keterangan,
    nutritionistId,
    nutritionistName,
    status,
    items
  } = req.body;

  if (!menuName || !targetGroup) {
    res.status(400).json({ success: false, message: 'Nama menu dan kelompok sasaran wajib diisi' });
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const planDate = tanggalPerencanaan || todayStr;
  const execDate = tanggalPelaksanaan || todayStr;

  const finalTargetCount = Number(targetCount) || dbStore.getTargetCountForDateAndGroup(execDate, targetGroup);

  const planId = `PLAN-${execDate.replace(/-/g, '')}-${String(dbStore.nutritionPlans.length + 1).padStart(3, '0')}`;

  // Process items
  const processedItems: NutritionPlanItem[] = Array.isArray(items) 
    ? items.map((it, idx) => computePlanItem(planId, menuName, targetGroup, finalTargetCount, it, idx))
    : [];

  const totalCost = processedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalWeightKg = Number(processedItems.reduce((acc, curr) => acc + curr.requiredKg, 0).toFixed(2));

  const newPlan: NutritionPlan = {
    id: planId,
    tanggalPerencanaan: planDate,
    tanggalPelaksanaan: execDate,
    menuId: menuId || undefined,
    menuName,
    targetGroup,
    targetCount: finalTargetCount,
    periode: periode || 'Harian',
    keterangan: keterangan || '',
    nutritionistId: nutritionistId || 'USR-006',
    nutritionistName: nutritionistName || 'Rina Wijaya, S.Gz., M.Gizi',
    status: status || 'Draft',
    totalCost,
    totalWeightKg,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.nutritionPlans.unshift(newPlan);
  dbStore.nutritionPlanItems.push(...processedItems);

  dbStore.addLog(
    newPlan.nutritionistId,
    newPlan.nutritionistName,
    'Perencanaan Bahan',
    'Buat Perencanaan',
    `Membuat perencanaan bahan pangan: ${menuName} (${finalTargetCount} sasaran)`
  );

  dbStore.addNotification(
    'Tugas Divisi',
    'Perencanaan Bahan Pangan Baru',
    `Perencanaan bahan pangan "${menuName}" untuk ${finalTargetCount} sasaran telah dibuat.`,
    'info',
    '/perencanaan-bahan'
  );

  res.json({
    success: true,
    message: 'Perencanaan kebutuhan bahan pangan berhasil disimpan',
    data: {
      ...newPlan,
      items: processedItems
    }
  });
});

// 8. UPDATE EXISTING NUTRITION PLAN
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.nutritionPlans.findIndex(p => p.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Perencanaan tidak ditemukan' });
    return;
  }

  const existing = dbStore.nutritionPlans[idx];
  if (existing.status === 'Final' && !req.body.allowRevision) {
    res.status(403).json({
      success: false,
      message: `Perencanaan menu "${existing.menuName}" sudah berstatus FINAL & TERKUNCI. Buka kunci revisi terlebih dahulu untuk mengubah data.`
    });
    return;
  }
  const body = req.body;

  const targetGroup = body.targetGroup || existing.targetGroup;
  const execDate = body.tanggalPelaksanaan || existing.tanggalPelaksanaan;
  const targetCount = Number(body.targetCount) || dbStore.getTargetCountForDateAndGroup(execDate, targetGroup);
  const menuName = body.menuName || existing.menuName;

  let processedItems: NutritionPlanItem[] = [];

  if (Array.isArray(body.items)) {
    // Replace items
    dbStore.nutritionPlanItems = dbStore.nutritionPlanItems.filter(i => i.planId !== id);
    processedItems = body.items.map((it: any, itemIdx: number) => 
      computePlanItem(id, menuName, targetGroup, targetCount, it, itemIdx)
    );
    dbStore.nutritionPlanItems.push(...processedItems);
  } else {
    processedItems = dbStore.nutritionPlanItems.filter(i => i.planId === id);
  }

  const totalCost = processedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalWeightKg = Number(processedItems.reduce((acc, curr) => acc + curr.requiredKg, 0).toFixed(2));

  dbStore.nutritionPlans[idx] = {
    ...existing,
    ...body,
    targetCount,
    totalCost,
    totalWeightKg,
    updatedAt: new Date().toISOString()
  };

  dbStore.addLog(
    dbStore.nutritionPlans[idx].nutritionistId,
    dbStore.nutritionPlans[idx].nutritionistName,
    'Perencanaan Bahan',
    'Edit Perencanaan',
    `Memperbarui perencanaan: ${menuName}`
  );

  res.json({
    success: true,
    message: 'Perencanaan berhasil diperbarui',
    data: {
      ...dbStore.nutritionPlans[idx],
      items: processedItems
    }
  });
});

// 9. FINALIZE NUTRITION PLAN
router.post('/:id/finalize', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.nutritionPlans.findIndex(p => p.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Perencanaan tidak ditemukan' });
    return;
  }

  const now = new Date().toISOString();
  dbStore.nutritionPlans[idx].status = 'Final';
  dbStore.nutritionPlans[idx].finalizedAt = now;
  dbStore.nutritionPlans[idx].finalizedBy = req.body.nutritionistName || dbStore.nutritionPlans[idx].nutritionistName;
  dbStore.nutritionPlans[idx].updatedAt = now;

  // Also finalize corresponding RAB
  const execDate = dbStore.nutritionPlans[idx].tanggalPelaksanaan;
  if (execDate) {
    const rabPlan = dbStore.getOrCreateRABForDate(execDate);
    rabPlan.status = 'Final';
    rabPlan.approvedAt = now;
    rabPlan.approvedBy = req.body.kepalaSppgName || 'Sri Rohayu, S. Pd (Kepala SPPG)';
    rabPlan.updatedAt = now;
  }

  dbStore.addLog(
    dbStore.nutritionPlans[idx].nutritionistId,
    dbStore.nutritionPlans[idx].nutritionistName,
    'Perencanaan Bahan',
    'Finalisasi Perencanaan',
    `Finalisasi & Kunci perencanaan bahan: ${dbStore.nutritionPlans[idx].menuName}`
  );

  res.json({
    success: true,
    message: 'Perencanaan berhasil difinalisasi dan dikunci',
    data: dbStore.nutritionPlans[idx]
  });
});

// 9b. UNLOCK / REQUEST REVISION FOR NUTRITION PLAN
router.post('/:id/unlock-revision', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { reason, revisedBy } = req.body;

  const idx = dbStore.nutritionPlans.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Perencanaan tidak ditemukan' });
    return;
  }

  const existing = dbStore.nutritionPlans[idx];
  const now = new Date().toISOString();
  const revReason = (reason && String(reason).trim()) || 'Perubahan dan penyesuaian bahan baku';
  const revUser = revisedBy || existing.nutritionistName || 'Petugas Gizi / Logistik';

  const historyRecord = {
    version: (existing.revisionCount || 0) + 1,
    reason: revReason,
    revisedBy: revUser,
    revisedAt: now,
    snapshotMenuName: existing.menuName,
    snapshotTotalCost: existing.totalCost,
    snapshotTotalWeightKg: existing.totalWeightKg
  };

  const updatedHistory = Array.isArray(existing.revisionHistory) 
    ? [...existing.revisionHistory, historyRecord] 
    : [historyRecord];

  dbStore.nutritionPlans[idx] = {
    ...existing,
    status: 'Revisi',
    revisionReason: revReason,
    revisionCount: (existing.revisionCount || 0) + 1,
    revisionRequestedAt: now,
    revisionRequestedBy: revUser,
    revisionHistory: updatedHistory,
    updatedAt: now
  };

  dbStore.addLog(
    existing.nutritionistId,
    revUser,
    'Perencanaan Bahan',
    'Buka Kunci Revisi Menu',
    `Membuka kunci status Final untuk revisi bahan menu "${existing.menuName}" (${existing.tanggalPelaksanaan}). Alasan: ${revReason}`
  );

  dbStore.addNotification(
    'Perencanaan Bahan',
    `Kunci Menu Dibuka: ${existing.tanggalPelaksanaan}`,
    `Menu "${existing.menuName}" untuk tanggal ${existing.tanggalPelaksanaan} telah dibuka untuk revisi bahan baku. Alasan: ${revReason}`,
    'warning',
    '/perencanaan-bahan'
  );

  res.json({
    success: true,
    message: `Kunci menu "${existing.menuName}" berhasil dibuka untuk revisi bahan baku.`,
    data: dbStore.nutritionPlans[idx]
  });
});

// 9c. UNLOCK / REVISE BY EXECUTION DATE
router.post('/unlock-revision-by-date', (req: Request, res: Response): void => {
  const { tanggalPelaksanaan, reason, revisedBy } = req.body;
  if (!tanggalPelaksanaan) {
    res.status(400).json({ success: false, message: 'Tanggal pelaksanaan wajib disertakan' });
    return;
  }

  const idx = dbStore.nutritionPlans.findIndex(p => p.tanggalPelaksanaan === tanggalPelaksanaan);
  if (idx === -1) {
    res.status(404).json({ success: false, message: `Perencanaan untuk tanggal ${tanggalPelaksanaan} tidak ditemukan` });
    return;
  }

  const existing = dbStore.nutritionPlans[idx];
  const now = new Date().toISOString();
  const revReason = (reason && String(reason).trim()) || 'Perubahan dan penyesuaian bahan baku';
  const revUser = revisedBy || existing.nutritionistName || 'Petugas Gizi / Logistik';

  const historyRecord = {
    version: (existing.revisionCount || 0) + 1,
    reason: revReason,
    revisedBy: revUser,
    revisedAt: now,
    snapshotMenuName: existing.menuName,
    snapshotTotalCost: existing.totalCost,
    snapshotTotalWeightKg: existing.totalWeightKg
  };

  const updatedHistory = Array.isArray(existing.revisionHistory) 
    ? [...existing.revisionHistory, historyRecord] 
    : [historyRecord];

  dbStore.nutritionPlans[idx] = {
    ...existing,
    status: 'Revisi',
    revisionReason: revReason,
    revisionCount: (existing.revisionCount || 0) + 1,
    revisionRequestedAt: now,
    revisionRequestedBy: revUser,
    revisionHistory: updatedHistory,
    updatedAt: now
  };

  // Synchronize unlock to RAB Plan for same execution date
  const targetRabByDate = dbStore.rabPlans.find(r => r.tanggalPelaksanaan === tanggalPelaksanaan);
  if (targetRabByDate) {
    targetRabByDate.status = 'Draft';
    targetRabByDate.updatedAt = now;
  }

  dbStore.addLog(
    existing.nutritionistId,
    revUser,
    'Perencanaan Bahan',
    'Buka Kunci Revisi Menu',
    `Membuka kunci status Final untuk revisi bahan menu "${existing.menuName}" (${existing.tanggalPelaksanaan}). Alasan: ${revReason}`
  );

  dbStore.addNotification(
    'Perencanaan Bahan',
    `Kunci Menu Dibuka: ${existing.tanggalPelaksanaan}`,
    `Menu "${existing.menuName}" untuk tanggal ${existing.tanggalPelaksanaan} telah dibuka untuk revisi bahan baku. Alasan: ${revReason}`,
    'warning',
    '/perencanaan-bahan'
  );

  res.json({
    success: true,
    message: `Kunci menu "${existing.menuName}" untuk tanggal ${tanggalPelaksanaan} berhasil dibuka untuk revisi bahan baku.`,
    data: dbStore.nutritionPlans[idx]
  });
});

// 10. DUPLICATE NUTRITION PLAN
router.post('/:id/duplicate', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { newTanggalPelaksanaan, newTargetGroup } = req.body;

  const original = dbStore.nutritionPlans.find(p => p.id === id);
  if (!original) {
    res.status(404).json({ success: false, message: 'Perencanaan asal tidak ditemukan' });
    return;
  }

  const targetDate = newTanggalPelaksanaan || original.tanggalPelaksanaan;
  const targetGroup = newTargetGroup || original.targetGroup;
  const targetCount = dbStore.getTargetCountForDateAndGroup(targetDate, targetGroup);

  const newPlanId = `PLAN-${targetDate.replace(/-/g, '')}-${String(dbStore.nutritionPlans.length + 1).padStart(3, '0')}`;

  const originalItems = dbStore.nutritionPlanItems.filter(i => i.planId === id);
  const duplicatedItems = originalItems.map((it, idx) => computePlanItem(
    newPlanId,
    original.menuName,
    targetGroup,
    targetCount,
    { ...it, id: undefined },
    idx
  ));

  const totalCost = duplicatedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalWeightKg = Number(duplicatedItems.reduce((acc, curr) => acc + curr.requiredKg, 0).toFixed(2));

  const newPlan: NutritionPlan = {
    ...original,
    id: newPlanId,
    tanggalPerencanaan: new Date().toISOString().split('T')[0],
    tanggalPelaksanaan: targetDate,
    targetGroup,
    targetCount,
    status: 'Draft',
    totalCost,
    totalWeightKg,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finalizedAt: undefined,
    finalizedBy: undefined
  };

  dbStore.nutritionPlans.unshift(newPlan);
  dbStore.nutritionPlanItems.push(...duplicatedItems);

  dbStore.addLog('USR-SYSTEM', 'Ahli Gizi', 'Perencanaan Bahan', 'Duplikasi Perencanaan', `Duplikasi perencanaan ke tanggal ${targetDate}`);

  res.json({
    success: true,
    message: 'Perencanaan berhasil diduplikasi',
    data: {
      ...newPlan,
      items: duplicatedItems
    }
  });
});

// 11. DELETE NUTRITION PLAN
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.nutritionPlans.findIndex(p => p.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Perencanaan tidak ditemukan' });
    return;
  }

  const removed = dbStore.nutritionPlans.splice(idx, 1)[0];
  dbStore.nutritionPlanItems = dbStore.nutritionPlanItems.filter(i => i.planId !== id);

  dbStore.addLog('USR-SYSTEM', 'Ahli Gizi', 'Perencanaan Bahan', 'Hapus Perencanaan', `Menghapus perencanaan: ${removed.menuName}`);

  res.json({
    success: true,
    message: `Perencanaan "${removed.menuName}" berhasil dihapus`
  });
});

// 12. GET REKAP & AGGREGATED PENGADAAN
router.get('/rekap/aggregate', (req: Request, res: Response): void => {
  const { tanggal } = req.query;

  let plans = dbStore.nutritionPlans;
  if (tanggal) {
    plans = plans.filter(p => p.tanggalPelaksanaan === tanggal);
  }

  const planIds = plans.map(p => p.id);
  const items = dbStore.nutritionPlanItems.filter(i => planIds.includes(i.planId));

  const rekapMap: Record<string, NutritionPlanRekapItem> = {};

  items.forEach(it => {
    const ing = dbStore.masterBahanPangan.find(b => b.id === it.ingredientId);
    const key = it.ingredientId || it.ingredientName;

    if (!rekapMap[key]) {
      rekapMap[key] = {
        ingredientId: it.ingredientId,
        ingredientName: it.ingredientName,
        category: ing?.kategori || 'Bahan Pangan',
        unit: ing?.satuanPembelian || 'kg',
        totalNetWeightGram: 0,
        totalGrossWeightGram: 0,
        totalRequiredKg: 0,
        pricePerKg: it.pricePerKg,
        totalPrice: 0,
        stockAvailable: it.stockAvailable,
        shortageKg: 0,
        status: 'CUKUP',
        menusInvolved: []
      };
    }

    rekapMap[key].totalNetWeightGram += it.netWeightGram * it.targetCount;
    rekapMap[key].totalGrossWeightGram += it.grossWeightGram * it.targetCount;
    rekapMap[key].totalRequiredKg += it.requiredKg;
    rekapMap[key].totalPrice += it.totalPrice;

    if (!rekapMap[key].menusInvolved.includes(it.menuName)) {
      rekapMap[key].menusInvolved.push(it.menuName);
    }
  });

  // Recompute shortage & status for each aggregate
  const rekapList: NutritionPlanRekapItem[] = Object.values(rekapMap).map(rk => {
    const totalReqKg = Number(rk.totalRequiredKg.toFixed(2));
    const bufferKg = Number((totalReqKg * 0.05).toFixed(2));
    const totalWithBufferKg = Number((totalReqKg + bufferKg).toFixed(2));

    rk.totalRequiredKg = totalReqKg;
    rk.bufferPercent = 5;
    rk.bufferKg = bufferKg;
    rk.totalWithBufferKg = totalWithBufferKg;
    rk.satuanBeli = rk.unit || 'Kg';
    
    // Auto default pembulatan
    if (rk.unit === 'pcs' || rk.unit === 'renteng' || rk.unit === 'ikat') {
      rk.pembulatan = Math.ceil(totalWithBufferKg);
    } else {
      rk.pembulatan = Math.round(totalWithBufferKg);
    }

    rk.shortageKg = Number(Math.max(0, totalWithBufferKg - rk.stockAvailable).toFixed(2));
    
    if (rk.pricePerKg <= 0) {
      rk.status = 'HARGA BELUM ADA';
    } else if (rk.shortageKg > 0) {
      rk.status = 'PERLU PENGADAAN';
    } else {
      rk.status = 'CUKUP';
    }

    return rk;
  });

  const totalRekapCost = rekapList.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalRekapKg = Number(rekapList.reduce((acc, curr) => acc + curr.totalRequiredKg, 0).toFixed(2));

  res.json({
    success: true,
    tanggal: tanggal || 'Semua Periode',
    totalIngredients: rekapList.length,
    totalRekapCost,
    totalRekapKg,
    data: rekapList
  });
});

// =========================================================
// 8. RENCANA ANGGARAN BELANJA (RAB) API ENDPOINTS
// =========================================================

// 8.1 Get Live Synced RAB for a specific date
router.get('/rab/sync-context', (req: Request, res: Response): void => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tanggal = (req.query.tanggal as string) || todayStr;

  const rabPlan = dbStore.getOrCreateRABForDate(tanggal);

  res.json({
    success: true,
    data: rabPlan,
    message: `RAB tersinkronisasi untuk tanggal ${tanggal}`
  });
});

// 8.2 Calculate RAB simulation on-the-fly with custom inputs
router.post('/rab/calculate', (req: Request, res: Response): void => {
  const { tanggal, targetCounts, tarifConfig, komposisiConfig, itemsBahanBaku, biayaOperasionalItems, biayaKemasanDistribusiItems, cadanganTakTerduga, namaMenu } = req.body;
  const targetDate = tanggal || new Date().toISOString().split('T')[0];

  const calculated = dbStore.calculateRABPlan(targetDate, {
    namaMenu,
    targetCounts,
    tarifConfig,
    komposisiConfig,
    itemsBahanBaku,
    biayaOperasionalItems,
    biayaKemasanDistribusiItems,
    cadanganTakTerduga
  });

  res.json({
    success: true,
    data: calculated
  });
});

// 8.3 Save or Update RAB Plan
router.post('/rab/save', (req: Request, res: Response): void => {
  const rabData = req.body;
  if (!rabData.tanggalPelaksanaan) {
    res.status(400).json({ success: false, message: 'Tanggal pelaksanaan wajib diisi' });
    return;
  }

  const existingIdx = dbStore.rabPlans.findIndex(r => r.tanggalPelaksanaan === rabData.tanggalPelaksanaan || r.id === rabData.id);
  const calculated = dbStore.calculateRABPlan(rabData.tanggalPelaksanaan, rabData);

  if (existingIdx >= 0) {
    dbStore.rabPlans[existingIdx] = calculated;
  } else {
    dbStore.rabPlans.push(calculated);
  }

  syncSaveDoc('rabPlans', calculated.id, calculated);

  dbStore.addLog('USR-SYSTEM', 'Ahli Gizi & Bendahara', 'Perencanaan Anggaran', 'Simpan RAB', `Menyimpan RAB ${calculated.id} (${calculated.namaMenu}) - Total Rp ${calculated.grandTotalRAB.toLocaleString('id-ID')}`);

  res.json({
    success: true,
    data: calculated,
    message: 'Rencana Anggaran Belanja (RAB) berhasil disimpan'
  });
});

// 8.4 Approve RAB Plan
router.post('/rab/status', (req: Request, res: Response): void => {
  const { id, tanggal, status, approverName } = req.body;
  const targetRAB = dbStore.rabPlans.find(r => r.id === id || r.tanggalPelaksanaan === tanggal);

  if (!targetRAB) {
    res.status(404).json({ success: false, message: 'Data RAB tidak ditemukan' });
    return;
  }

  targetRAB.status = status || 'Disetujui';
  const now = new Date().toISOString();
  let menuPlan: any = null;
  if (status === 'Disetujui' || status === 'Final') {
    targetRAB.approvedAt = now;
    targetRAB.approvedBy = approverName || 'Sri Rohayu, S. Pd (Kepala SPPG)';

    // Synchronize status to corresponding Nutrition Plan
    menuPlan = dbStore.nutritionPlans.find(p => p.tanggalPelaksanaan === targetRAB.tanggalPelaksanaan);
    if (menuPlan) {
      menuPlan.status = 'Final';
      menuPlan.finalizedAt = now;
      menuPlan.finalizedBy = approverName || 'Sri Rohayu, S. Pd (Kepala SPPG)';
      menuPlan.updatedAt = now;
      syncSaveDoc('nutritionPlans', menuPlan.id, menuPlan);
    }
  } else if (status === 'Revisi' || status === 'Draft') {
    menuPlan = dbStore.nutritionPlans.find(p => p.tanggalPelaksanaan === targetRAB.tanggalPelaksanaan);
    if (menuPlan) {
      menuPlan.status = status;
      menuPlan.updatedAt = now;
      syncSaveDoc('nutritionPlans', menuPlan.id, menuPlan);
    }
  }
  targetRAB.updatedAt = now;
  syncSaveDoc('rabPlans', targetRAB.id, targetRAB);

  dbStore.addLog('USR-SYSTEM', 'Kepala SPPG', 'Perencanaan Anggaran', 'Persetujuan RAB', `Mengubah status RAB ${targetRAB.id} & Perencanaan Menu menjadi ${status}`);

  res.json({
    success: true,
    data: targetRAB,
    message: `Status RAB berhasil diperbarui menjadi ${status}`
  });
});

// 8.5 Get List of All Saved RAB Plans
router.get('/rab/list', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.rabPlans
  });
});

// 9. Purchase Order (PO) 5-Hari Period Aggregation & Management Endpoints
router.get('/po/list', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.getAllPO()
  });
});

router.post('/po/aggregate', (req: Request, res: Response): void => {
  const { startDate, dates } = req.body;
  const result = dbStore.aggregatePeriodPO(startDate || new Date().toISOString().split('T')[0], dates);
  res.json({
    success: true,
    data: result
  });
});

router.post('/po/save', (req: Request, res: Response): void => {
  const poDoc = dbStore.savePO(req.body);
  syncSaveDoc('purchaseOrders', poDoc.id, poDoc);
  dbStore.addLog('USR-SYSTEM', req.body.pemesan || 'Admin SPPG', 'Purchase Order', 'Simpan PO', `Menyimpan Purchase Order ${poDoc.poNumber} (${poDoc.poType})`);
  res.json({
    success: true,
    data: poDoc,
    message: `Purchase Order ${poDoc.poNumber} berhasil disimpan!`
  });
});

router.post('/po/save-batch', (req: Request, res: Response): void => {
  const batch = req.body.batch || [];
  const saved = dbStore.savePOBatch(batch);
  syncSaveBatch('purchaseOrders', saved);
  dbStore.addLog('USR-SYSTEM', 'Admin SPPG', 'Purchase Order', 'Simpan Paket PO 5-Hari', `Menyimpan ${saved.length} Dokumen PO Harian Paket Periode`);
  res.json({
    success: true,
    data: saved,
    message: `Berhasil menerbitkan ${saved.length} Dokumen PO Harian Paket Periode 5 Hari!`
  });
});

router.post('/po/confirm-admin', (req: Request, res: Response): void => {
  const { poId, confirmedBy, notes } = req.body;
  if (!poId) {
    res.status(400).json({ success: false, message: 'poId wajib dikirim' });
    return;
  }
  const updated = dbStore.confirmPOByAdmin(poId, confirmedBy, notes);
  if (updated) {
    syncSaveDoc('purchaseOrders', updated.id, updated);
    dbStore.addLog('USR-ADMIN', confirmedBy || 'Sri Rohayu, S. Pd', 'Purchase Order', 'Konfirmasi Admin', `Admin mengonfirmasi PO ${updated.poNumber} dan merilis ke Portal Supplier`);
    res.json({
      success: true,
      data: updated,
      message: `PO ${updated.poNumber} berhasil dikonfirmasi oleh Admin dan kini tampil di Status Pemesanan Portal Supplier!`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Dokumen PO ${poId} tidak ditemukan`
    });
  }
});

router.post('/po/confirm-admin-batch', (req: Request, res: Response): void => {
  const { poIds, confirmedBy, notes } = req.body;
  if (!Array.isArray(poIds) || poIds.length === 0) {
    res.status(400).json({ success: false, message: 'poIds (array) wajib dikirim' });
    return;
  }
  const confirmed = dbStore.confirmPOBatchByAdmin(poIds, confirmedBy, notes);
  syncSaveBatch('purchaseOrders', confirmed);
  dbStore.addLog('USR-ADMIN', confirmedBy || 'Sri Rohayu, S. Pd', 'Purchase Order', 'Konfirmasi Admin Batch', `Admin mengonfirmasi ${confirmed.length} Dokumen PO dan merilis ke Portal Supplier`);
  res.json({
    success: true,
    data: confirmed,
    message: `Berhasil mengonfirmasi ${confirmed.length} PO! Dokumen kini aktif dan muncul di Status Pemesanan Supplier.`
  });
});

router.get('/po/supplier-list', (req: Request, res: Response): void => {
  const list = dbStore.getSupplierPortalPOs();
  res.json({
    success: true,
    data: list
  });
});

router.post('/po/supplier-progress', (req: Request, res: Response): void => {
  const { poId, status, supplierData } = req.body;
  if (!poId || !status) {
    res.status(400).json({ success: false, message: 'poId dan status wajib dikirim' });
    return;
  }
  const updated = dbStore.updatePOSupplierShoppingProgress(poId, status, supplierData);
  if (updated) {
    syncSaveDoc('purchaseOrders', updated.id, updated);
    dbStore.addLog('USR-SUPPLIER', supplierData?.acceptedBy || 'Mitra Supplier SPPG', 'Portal Supplier', `Update Status PO: ${status}`, `Status PO ${updated.poNumber} diperbarui menjadi ${status}`);
    res.json({
      success: true,
      data: updated,
      message: `Status pesanan ${updated.poNumber} berhasil diperbarui menjadi '${status}'!`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Dokumen PO ${poId} tidak ditemukan`
    });
  }
});

router.post('/po/supplier-progress-batch', (req: Request, res: Response): void => {
  const { poIds, status, supplierData } = req.body;
  if (!Array.isArray(poIds) || poIds.length === 0 || !status) {
    res.status(400).json({ success: false, message: 'poIds (array) dan status wajib dikirim' });
    return;
  }
  const updatedList: any[] = [];
  poIds.forEach((id: string) => {
    const updated = dbStore.updatePOSupplierShoppingProgress(id, status, supplierData);
    if (updated) updatedList.push(updated);
  });
  syncSaveBatch('purchaseOrders', updatedList);
  dbStore.addLog(
    'USR-SUPPLIER',
    supplierData?.acceptedBy || 'Mitra Supplier SPPG',
    'Portal Supplier',
    `Update Status Batch PO: ${status}`,
    `Status ${updatedList.length} PO diperbarui menjadi ${status}`
  );
  res.json({
    success: true,
    data: updatedList,
    message: `Status ${updatedList.length} pesanan berhasil diperbarui menjadi '${status}'!`
  });
});

router.post('/po/confirm-supplier', (req: Request, res: Response): void => {
  const { poId, confirmedBy, notes } = req.body;
  const updated = dbStore.confirmPOBySupplier(poId, confirmedBy, notes);
  if (updated) {
    syncSaveDoc('purchaseOrders', updated.id, updated);
    dbStore.addLog('USR-SYSTEM', confirmedBy || 'Koperasi Zantara', 'Purchase Order', 'Konfirmasi Supplier', `Konfirmasi PO Online ${poId}`);
    res.json({
      success: true,
      data: updated,
      message: `Status PO ${poId} berhasil dikonfirmasi & disetujui oleh Supplier!`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Dokumen PO ${poId} tidak ditemukan`
    });
  }
});

router.delete('/po/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const deleted = dbStore.deletePO(id);
  if (deleted) {
    syncDeleteDoc('purchaseOrders', id);
  }
  res.json({
    success: deleted,
    message: deleted ? 'Purchase Order berhasil dihapus' : 'Purchase Order tidak ditemukan'
  });
});

export default router;

