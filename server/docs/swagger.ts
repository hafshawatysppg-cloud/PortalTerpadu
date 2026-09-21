export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Portal Administrasi Terpadu REST API',
    version: '1.0.0',
    description: 'Dokumentasi REST API Gateway untuk Portal Utama, Single Sign-On (SSO), e-Surat Digital, Stock Opname, dan Master Data Terpadu.',
    contact: {
      name: 'Tim Arsitektur Sistem Enterprise',
      email: 'architecture@instansi.go.id'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Gateway Server Local / Enterprise Container'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT Token hasil login dari /auth/login'
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Single Sign-On (SSO) User Login',
        tags: ['Authentication & SSO'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'superadmin' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login Berhasil, Mengembalikan Bearer JWT Token & Direct Redirect Links' },
          401: { description: 'Kredensial Tidak Valid' }
        }
      }
    },
    '/auth/sso/verify': {
      get: {
        summary: 'Verifikasi Token SSO dari Modul Eksternal',
        tags: ['Authentication & SSO'],
        parameters: [
          { name: 'token', in: 'query', schema: { type: 'string' }, description: 'JWT Token SSO' }
        ],
        responses: {
          200: { description: 'Token Valid & Detail Identity Claims User' }
        }
      }
    },
    '/menus': {
      get: { summary: 'Ambil Daftar Menu Dinamis Portal', tags: ['Dynamic Menus'] },
      post: { summary: 'Tambah Menu Dinamis Baru', tags: ['Dynamic Menus'] }
    },
    '/users': {
      get: { summary: 'Ambil Daftar Master User Enterprise', tags: ['User Management'] },
      post: { summary: 'Tambah User Baru', tags: ['User Management'] }
    },
    '/master/pegawai': {
      get: { summary: 'Ambil Master Data Pegawai', tags: ['Master Data'] },
      post: { summary: 'Tambah Data Pegawai Baru', tags: ['Master Data'] }
    },
    '/esurat/surat-masuk': {
      get: { summary: 'Daftar Surat Masuk Digital', tags: ['e-Surat Digital'] },
      post: { summary: 'Catat Surat Masuk Baru', tags: ['e-Surat Digital'] }
    },
    '/esurat/surat-keluar': {
      get: { summary: 'Daftar Surat Keluar', tags: ['e-Surat Digital'] },
      post: { summary: 'Ajukan Draft Surat Keluar', tags: ['e-Surat Digital'] }
    },
    '/stock/barang': {
      get: { summary: 'Daftar Master Barang Gudang', tags: ['Stock Opname'] },
      post: { summary: 'Tambah Master Barang Baru', tags: ['Stock Opname'] }
    },
    '/stock/movements': {
      get: { summary: 'Riwayat Transaksi Stok Masuk/Keluar', tags: ['Stock Opname'] },
      post: { summary: 'Catat Transaksi Stok Masuk atau Keluar', tags: ['Stock Opname'] }
    },
    '/stock/opname-sessions': {
      get: { summary: 'Daftar Sesi Physical Stock Opname', tags: ['Stock Opname'] },
      post: { summary: 'Simpan Hasil Hitung Fisik Opname & Auto Adjust Stok', tags: ['Stock Opname'] }
    },
    '/search': {
      get: {
        summary: 'Global Cross-Module Search Engine',
        tags: ['Global Features'],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Kata kunci nomor surat, barang, pegawai' }]
      }
    },
    '/activity-logs': {
      get: { summary: 'Ambil Audit Trail Log Aktivitas Central', tags: ['Audit & Logs'] }
    }
  }
};
