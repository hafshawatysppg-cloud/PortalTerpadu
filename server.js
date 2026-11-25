import fs from 'node:fs';
import { execSync } from 'node:child_process';

if (!fs.existsSync('./dist/server.cjs')) {
  console.log('Folder dist/server.cjs belum ditemukan. Menjalankan npm run build...');
  execSync('npm run build', { stdio: 'inherit' });
}

await import('./dist/server.cjs');