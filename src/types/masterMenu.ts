export interface MasterMenuRecord {
  id: string;
  tanggalPelaksanaan: string;
  menuItems: string[];
}

export const initialMasterMenuRecords: MasterMenuRecord[] = [
  {
    id: 'MM-20261026-000',
    tanggalPelaksanaan: '2026-10-26',
    menuItems: [
      'Nasi',
      'Rolade daging',
      'Tempe krispy',
      'Tumis jagung & wortel',
      'Semangka kuning'
    ]
  },
  {
    id: 'MM-20261101-001',
    tanggalPelaksanaan: '2026-11-01',
    menuItems: [
      'Nasi Putih Pulen',
      'Chicken Krambel (Ayam Krispy)',
      'Tempe Goreng Gurih',
      'Capcay Kuah Segar',
      'Buah Kelengkeng Manis'
    ]
  },
  {
    id: 'MM-20261102-002',
    tanggalPelaksanaan: '2026-11-02',
    menuItems: [
      'Nasi Putih',
      'Ikan Fillet Krispy Saus Asam Manis',
      'Tahu Goreng Tepung',
      'Sayur Bening Bayam Jagung',
      'Buah Pisang Cavendish'
    ]
  },
  {
    id: 'MM-20261103-003',
    tanggalPelaksanaan: '2026-11-03',
    menuItems: [
      'Nasi Putih',
      'Telur Balado Bumbu Merah',
      'Orek Tempe Kering Manis',
      'Sayur Asem Segar',
      'Buah Semangka Merah'
    ]
  },
  {
    id: 'MM-20261104-004',
    tanggalPelaksanaan: '2026-11-04',
    menuItems: [
      'Nasi Pulen',
      'Daging Sapi Lada Hitam',
      'Bakwan Jagung Sayur',
      'Sop Wortel Sosis Buncis',
      'Buah Jeruk Madu'
    ]
  },
  {
    id: 'MM-20261105-005',
    tanggalPelaksanaan: '2026-11-05',
    menuItems: [
      'Nasi Kuning Gurih',
      'Ayam Suwir Bumbu Rujak',
      'Perkedel Kentang Daging',
      'Tumis Buncis Wortel Jagung',
      'Buah Apel Fuji'
    ]
  }
];
