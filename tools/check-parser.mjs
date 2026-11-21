// Run the site's parser over every archived game and summarize what it flags.
import { readFileSync, readdirSync } from 'node:fs';
import { analyze } from '../site/assets/kubb.js';
const dir = new URL('../games/', import.meta.url);
const counts = {}; let bad = 0, winMismatch = 0, unread = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith('.txt'))) {
  const g = analyze(readFileSync(new URL(f, dir), 'utf8'));
  const all = [...g.warnings, ...g.rows.flatMap(r => r.warnings)];
  for (const w of all) {
    const k = w.replace(/\d+/g, 'n').replace(/"[^"]*"/g, '"…"');
    counts[k] = (counts[k] || 0) + 1;
    if (/Couldn't read/.test(w)) unread++;
  }
  if (g.warnings.some(w => /Win header/.test(w))) { winMismatch++; console.log('WIN', f); }
  if (process.argv[2] === '-v' && all.length) console.log(f, all);
  if (all.length) bad++;
}
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]));
console.log({ gamesWithWarnings: bad, winMismatch, unread });
