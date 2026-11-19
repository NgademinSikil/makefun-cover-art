// Neon Coast Cover Studio — entry program for gta6-cover-art-01 (Node 22,
// standard library only). The app itself is the static site in app/:
// index.html plus its ES modules, four sample photos, nothing fetched
// from the network. This program hands the app in: it mirrors app/ and
// screenshots/ from this repository into the output directory and writes
// dossier.json there with the vendored make.fun dossier builder.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts            # try the app at http://localhost:8080
//
// The dossier caps mirror the competition's gate (reference/gate.json):
// at most 4 screenshots of at most 256 KiB each, app/ at most 993 files
// and 48 MiB in total, no app/ path over 1000 bytes, dossier text at
// most 160 KiB. Passing those numbers to buildDossier makes the local
// run refuse an entry the scorer would refuse, instead of handing in
// something that cannot be graded.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function mirrorFolder(name) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) return;
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
mirrorFolder('app');
mirrorFolder('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Neon Coast handed in: app/ + screenshots/ + dossier.json in ${outputDir}`);
