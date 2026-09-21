export interface MultiGroupIngredientItem {
  no: number;
  bahanPangan: string;
  porsiKecilNet: number;
  porsiBesarNet: number;
  balitaNet: number;
  bumilBusuiNet: number;
  bddPercent: number;
  satuan: string;
  pembulatan: number | string;
  hargaPerKg?: number;
}

export const INITIAL_PDF_INGREDIENTS: MultiGroupIngredientItem[] = [
  { no: 1, bahanPangan: 'Beras kepompong 25kg', porsiKecilNet: 50, porsiBesarNet: 75, balitaNet: 50, bumilBusuiNet: 75, bddPercent: 100, satuan: 'Kg', pembulatan: 190, hargaPerKg: 15000 },
  { no: 2, bahanPangan: 'Daging ayam fillet', porsiKecilNet: 50, porsiBesarNet: 50, balitaNet: 50, bumilBusuiNet: 50, bddPercent: 100, satuan: 'Kg', pembulatan: 113, hargaPerKg: 38000 },
  { no: 3, bahanPangan: 'Tepung terigu Segitiga Biru 1 Kg', porsiKecilNet: 10, porsiBesarNet: 10, balitaNet: 10, bumilBusuiNet: 10, bddPercent: 100, satuan: 'Kg', pembulatan: 50, hargaPerKg: 13000 },
  { no: 4, bahanPangan: 'Tepung panir 10Kg', porsiKecilNet: 10, porsiBesarNet: 10, balitaNet: 10, bumilBusuiNet: 10, bddPercent: 100, satuan: 'Pcs', pembulatan: 3, hargaPerKg: 22000 },
  { no: 5, bahanPangan: 'Daun pisang', porsiKecilNet: 5, porsiBesarNet: 5, balitaNet: 5, bumilBusuiNet: 5, bddPercent: 100, satuan: 'Ikat', pembulatan: '-', hargaPerKg: 5000 },
  { no: 6, bahanPangan: 'Tahu', porsiKecilNet: 50, porsiBesarNet: 50, balitaNet: 50, bumilBusuiNet: 50, bddPercent: 100, satuan: 'Pcs', pembulatan: 142, hargaPerKg: 10000 },
  { no: 7, bahanPangan: 'Wortel', porsiKecilNet: 25, porsiBesarNet: 25, balitaNet: 25, bumilBusuiNet: 25, bddPercent: 100, satuan: 'Kg', pembulatan: 60, hargaPerKg: 14000 },
  { no: 8, bahanPangan: 'Kentang', porsiKecilNet: 25, porsiBesarNet: 25, balitaNet: 25, bumilBusuiNet: 25, bddPercent: 100, satuan: 'Kg', pembulatan: 60, hargaPerKg: 18000 },
  { no: 9, bahanPangan: 'Kelengkeng', porsiKecilNet: 100, porsiBesarNet: 100, balitaNet: 100, bumilBusuiNet: 100, bddPercent: 100, satuan: 'Kg', pembulatan: 130, hargaPerKg: 35000 },
  { no: 10, bahanPangan: 'Minyak goreng filma 2ltr', porsiKecilNet: 15, porsiBesarNet: 15, balitaNet: 15, bumilBusuiNet: 15, bddPercent: 100, satuan: 'Pcs', pembulatan: 50, hargaPerKg: 36000 },
  { no: 11, bahanPangan: 'Bumbu kari jepang 40g', porsiKecilNet: 1, porsiBesarNet: 1, balitaNet: 1, bumilBusuiNet: 1, bddPercent: 100, satuan: 'Pcs', pembulatan: 10, hargaPerKg: 12000 },
  { no: 12, bahanPangan: 'Bawang putih kupas', porsiKecilNet: 1, porsiBesarNet: 1, balitaNet: 1, bumilBusuiNet: 1, bddPercent: 100, satuan: 'Kg', pembulatan: 3, hargaPerKg: 38000 },
  { no: 13, bahanPangan: 'Bawang merah kupas', porsiKecilNet: 1, porsiBesarNet: 1, balitaNet: 1, bumilBusuiNet: 1, bddPercent: 100, satuan: 'Kg', pembulatan: 3, hargaPerKg: 34000 },
  { no: 14, bahanPangan: 'Bawang bombay', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 2, hargaPerKg: 26000 },
  { no: 15, bahanPangan: 'Cabe merah besar', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 2, hargaPerKg: 30000 },
  { no: 16, bahanPangan: 'Jahe', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 1, hargaPerKg: 20000 },
  { no: 17, bahanPangan: 'Kunyit', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 1, hargaPerKg: 16000 },
  { no: 18, bahanPangan: 'Ketumbar', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 0.5, hargaPerKg: 25000 },
  { no: 19, bahanPangan: 'Kemiri', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 1, hargaPerKg: 40000 },
  { no: 20, bahanPangan: 'Daun jeruk', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Kg', pembulatan: 0.25, hargaPerKg: 25000 },
  { no: 21, bahanPangan: 'Gula', porsiKecilNet: 1, porsiBesarNet: 1, balitaNet: 1, bumilBusuiNet: 1, bddPercent: 100, satuan: 'Kg', pembulatan: 3, hargaPerKg: 17500 },
  { no: 22, bahanPangan: 'Garam cap kapal 250 gr', porsiKecilNet: 1, porsiBesarNet: 1, balitaNet: 1, bumilBusuiNet: 1, bddPercent: 100, satuan: 'Pcs', pembulatan: 10, hargaPerKg: 3000 },
  { no: 23, bahanPangan: 'Ladaku', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Renteng', pembulatan: 1, hargaPerKg: 12000 },
  { no: 24, bahanPangan: 'Kaldu jamur totole 200 gr', porsiKecilNet: 0.5, porsiBesarNet: 0.5, balitaNet: 0.5, bumilBusuiNet: 0.5, bddPercent: 100, satuan: 'Pcs', pembulatan: 7, hargaPerKg: 18000 }
];

export interface TargetCountConfig {
  porsiKecil: number;
  porsiBesar: number;
  balita: number;
  bumilBusui: number;
}

export const DEFAULT_TARGET_COUNTS: TargetCountConfig = {
  porsiKecil: 471,
  porsiBesar: 2220,
  balita: 75,
  bumilBusui: 43
};
