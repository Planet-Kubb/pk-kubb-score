// Write conformance/archive.json: what the grammar and the reader make of
// every archived game.
//
// The snapshot in the repository was taken on 2026-11-21 from the notation 1
// grammar and reader, before any notation 2 change. It is the guard that old
// sheets keep their meaning, so it is not regenerated as part of normal work:
// a change that moves it is a change to what an old sheet means. Run this only
// to record such a decision, and say so in the commit.
//
//   node tools/snapshot-archive.mjs --rewrite
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { parse } from '../site/assets/notation-parser.js';
import { analyze } from '../site/assets/kubb.js';
import { shapeParse, shapeReading, shapeError } from './lib/shape.mjs';

export function snapshot() {
  const dir = new URL('../games/', import.meta.url);
  const games = [];
  for (const file of readdirSync(dir).filter(f => f.endsWith('.txt')).sort()) {
    const text = readFileSync(new URL(file, dir), 'utf8');
    let grammar;
    try { grammar = { valid: true, ...shapeParse(parse(text)) }; }
    catch (e) { grammar = { valid: false, ...shapeError(e) }; }
    games.push({ file, grammar, reading: shapeReading(analyze(text)) });
  }
  return games;
}

export function serialize(games) {
  return '[\n' + games.map(g => JSON.stringify(g)).join(',\n') + '\n]\n';
}

if (process.argv.includes('--rewrite')) {
  const games = snapshot();
  writeFileSync(new URL('../conformance/archive.json', import.meta.url), serialize(games));
  console.log(`conformance/archive.json rewritten: ${games.length} games`);
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Nothing written. See the comment at the top of this file before using --rewrite.');
}
