import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distIndex = resolve('dist', 'index.html');
const dist404 = resolve('dist', '404.html');

if (existsSync(distIndex)) {
  copyFileSync(distIndex, dist404);
}
