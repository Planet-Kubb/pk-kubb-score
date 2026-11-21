// Test the formal grammar: every archived game, the examples from the docs,
// strings that must be rejected, and agreement with the site's tolerant
// reader (site/assets/kubb.js) on every turn of every game.
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '../site/assets/notation-parser.js';
import { parseGame } from '../site/assets/kubb.js';

let failed = 0;
const fail = (what, why) => { failed++; console.log(`FAIL ${what}\n     ${why}`); };
const KNOWN_INVALID = {
  // Recorded on the wiki as "F-"; the grammar rightly rejects it.
  '2012-07-28-nordic-fest-kubb-tournament-2012-finals-kubby-doo-v-baton-death-march-game-3.txt': /F-/,
};

// 1. Every archived game parses, and agrees with kubb.js.
const dir = new URL('../games/', import.meta.url);
let ok = 0, turns = 0, batons = 0;
const KIND = { miss: 'miss', hit: 'hit', king: 'king', kingmiss: 'king-miss', unthrown: 'unthrown',
  illegalking: 'illegal-king', illegal: 'illegal-throw', win: 'win', resign: 'resign' };
for (const f of readdirSync(dir).filter(f => f.endsWith('.txt')).sort()) {
  const text = readFileSync(new URL(f, dir), 'utf8');
  let g;
  try { g = parse(text); }
  catch (e) {
    const known = Object.entries(KNOWN_INVALID).find(([k]) => f.startsWith(k.replace('.txt', '')));
    if (known && known[1].test(e.message + text.split('\n')[e.location.start.line - 1])) {
      console.log(`known invalid: ${f}\n     line ${e.location.start.line}, column ${e.location.start.column}: ${e.message}`);
      continue;
    }
    fail(f, `line ${e.location?.start.line}, column ${e.location?.start.column}: ${e.message}`);
    continue;
  }
  ok++;
  const loose = parseGame(text);
  if (g.turns.length !== loose.turns.length) { fail(f, `${g.turns.length} turns vs ${loose.turns.length} in kubb.js`); continue; }
  g.turns.forEach((t, i) => {
    const l = loose.turns[i];
    turns++;
    const sum = (list, k) => list.reduce((a, x) => a + (x[k] || 0), 0);
    for (const k of ['I', 'R', 'P', 'Y', 'Q', 'N']) {
      if (sum(t.inkasts, k) !== sum(l.inkasts, k)) fail(`${f} turn ${i + 1}`, `inkast ${k}: ${sum(t.inkasts, k)} vs ${sum(l.inkasts, k)}`);
    }
    if (!!t.advantage !== !!l.advantage) fail(`${f} turn ${i + 1}`, 'advantage differs');
    if (t.batons.length !== l.batons.length) { fail(`${f} turn ${i + 1}`, `batons ${t.batons.length} vs ${l.batons.length}`); return; }
    t.batons.forEach((b, j) => {
      batons++;
      const m = l.batons[j];
      const lk = m.kind === 'hit' && !(m.f || m.b) ? 'miss' : KIND[m.kind];
      const gk = b.kind === 'hit' && !(b.field || b.base) ? 'miss' : b.kind;
      if (gk !== lk || (b.field || 0) !== (m.f || 0) || (b.base || 0) !== (m.b || 0) || (b.player || null) !== (m.player || null)) {
        fail(`${f} turn ${i + 1} baton ${j + 1}`, `${JSON.stringify(b.text)} grammar ${gk}/${b.player} vs kubb.js ${lk}/${m.player}`);
      }
    });
    if ((t.note || '') !== (l.note || '')) fail(`${f} turn ${i + 1}`, 'note differs');
  });
}
console.log(`archive: ${ok} games valid, ${turns} turns and ${batons} batons agree with kubb.js`);

// 2. Things the docs say are valid.
const VALID = [
  'B B B B B K',
  '0 B B B B B K',
  '1. B B B B B K',
  '1. 0 B B B B B K # Perfect game!',
  '1. jt:B jt:B gv:B gv:B jt:B gv:K # Perfect game, Garrick takes the king!',
  '0 jtB jtB gvB gvB jtB gvK',
  '7. 3 2F F - B B = # Missed king shot!',
  '14. jt:2I A jt:2F jt:B gv:= gv:K X X',
  '5. i - - E X X X',
  'j:2y m:2y j:3i4r',
  'j:2i m:2iq j:3i4ri',
  '3i  3f b b = =',
  '4ie',
  '6I 3fe X X X X X',
  '2I 4A F F B - - B',
  '2I 0A F F B - - B',
  '6. d:I BA jf:- d:- d:- d:F jf:B jf:-',
  '9. j:2I MA jt:F jt:F g:B g:- g:- jt:B',
  '5I2R2N 2F (lovely) 2F, F/B - Z',
  '8. 10I 10F K X X X X',
  '12. 5I F F 2F FB 2FB W',
  '3. G',
  '[Event "Twin Cities Winter Tournament 2012"]\n[Temperature "13 F"]\n\n1. 0I B - - - - -\n# a comment line\n2. I F - - - - -\n',
  '[Note "She said \\"wow\\""]\n1. B',
];
for (const v of VALID) {
  try { parse(v); } catch (e) { fail(`valid: ${JSON.stringify(v)}`, e.message); }
}
// Readings that must come out a particular way.
const reading = (s) => parse(s).turns[0];
const checks = [
  ['0 jtB gvK', t => t.batons[0].player === 'jt' && t.batons[0].kind === 'hit' && t.batons[1].kind === 'king'],
  ['fB', t => t.batons[0].player === 'f' && t.batons[0].base === 1 && !t.batons[0].field],
  ['FB', t => !t.batons[0].player && t.batons[0].field === 1 && t.batons[0].base === 1],
  ['fb', t => !t.batons[0].player && t.batons[0].field === 1 && t.batons[0].base === 1],
  ['3 2F', t => t.inkasts[0].I === 3 && t.batons[0].field === 2],
  ['4IE', t => t.inkasts[0].I === 4 && t.inkasts[0].illegalKing],
  ['2I 3A F', t => t.advantage.meters === 3],
  ['I BA F', t => t.advantage.legacy === 'BA'],
  ['j:2y m:2y j:3i4r', t => t.inkasts.length === 3 && t.inkasts[2].R === 4],
];
for (const [s, test] of checks) {
  try { if (!test(reading(s))) fail(`reading: ${s}`, JSON.stringify(reading(s))); }
  catch (e) { fail(`reading: ${s}`, e.message); }
}

// 3. Things that must be rejected.
const INVALID = [
  ['F-', 'stray character after a baton'],
  ['2I F F 5A', 'advantage after the batons'],
  ['F F 2I', 'kubbs thrown in after the batons'],
  ['11I F', 'more than 10 kubbs in one count'],
  ['2I 5A F', 'advantage over 4 meters'],
  ['2I A A F', 'two advantage markers'],
  ['2I F2', 'a number after the action'],
  ['2I Q- F', 'unknown token'],
  ['1.', 'a turn with nothing in it'],
  ['jt:', 'a player with no action'],
  ['2I F F (unclosed', 'unclosed comment'],
  ['1. B\n[Event "late"]', 'header after the turns'],
  ['[Event unquoted]', 'unquoted header value'],
  ['jt::F', 'double colon'],
];
for (const [s, why] of INVALID) {
  try { parse(s); fail(`invalid accepted: ${JSON.stringify(s)}`, why); }
  catch (e) {
    if (!e.location) fail(`invalid: ${JSON.stringify(s)}`, 'no error location');
    else if (process.argv.includes('-v')) console.log(`  ${JSON.stringify(s).padEnd(26)} col ${e.location.start.column}: ${e.message}`);
  }
}
console.log(`${VALID.length} valid examples, ${checks.length} readings, ${INVALID.length} invalid examples checked`);
if (failed) { console.log(`${failed} failures`); process.exit(1); }
console.log('all grammar tests pass');
