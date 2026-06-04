import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDiceSvg, facesForDie } from './diceSvgCore.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const themesPath = join(root, 'src/lib/assets/diceThemes.json');
const outRoot = join(root, 'public/dice');

const themes = JSON.parse(readFileSync(themesPath, 'utf8'));
const dieIds = Object.keys(themes);

const manifest = {
  ivory: {
    faces: ['face-1', 'face-2', 'face-3', 'face-4', 'face-5', 'face-6', 'face-devil', 'face-unrolled'],
  },
  dice: {},
};

let fileCount = 0;

for (const dieId of dieIds) {
  const theme = themes[dieId];
  const dir = join(outRoot, dieId);
  mkdirSync(dir, { recursive: true });

  const written = [];

  for (const face of facesForDie(dieId)) {
    const svg = generateDiceSvg(dieId, theme, face);
    let name;
    if (face === 'hidden') name = 'face-hidden.svg';
    else if (face === 'devil') name = 'face-devil.svg';
    else name = `face-${face}.svg`;

    writeFileSync(join(dir, name), svg, 'utf8');
    written.push(name);
    fileCount += 1;
  }

  manifest.dice[dieId] = written;
}

writeFileSync(join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`Generated ${fileCount} themed SVGs for ${dieIds.length} dice types in ${outRoot}`);
