import { mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const files = [
  'index.html', 'styles.css', 'app.js', 'data-core.js', 'cloud.js', 'config.js',
  'features.js', 'county-map.json', 'showcase-county-stats.json', 'environment-snapshot.json',
  'flow-lines.svg', 'app.webmanifest', 'sw.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'
];
await rm(dist, { recursive: true, force: true });
for (const name of files) {
  const target = path.join(dist, name);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, name), target);
}
// Only the publishable browser key is shipped. Account features remain gated.
console.log('Static PWA ready in dist/');
