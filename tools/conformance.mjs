// The conformance suite for Planet Kubb Notation 2: conformance/*.json.
//
//   node tools/conformance.mjs           check this repository against the suite
//   node tools/conformance.mjs --write   rewrite the suite's expectations from
//                                        tools/conformance-cases.mjs (never the
//                                        archive snapshot; see snapshot-archive.mjs)
//
// The suite is data, so a parser in any language can be run against it;
// conformance/README.md says what each file holds. This script is how this
// repository's own grammar, canonical writer and reader are held to it.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from '../site/assets/notation-parser.js';
import { canonicalize as toCanonical } from '../site/assets/canonical.js';
import { analyze } from '../site/assets/kubb.js';
import { shapeParse, shapeReading, shapeError, firstDifference } from './lib/shape.mjs';
import { snapshot, serialize } from './snapshot-archive.mjs';
import * as cases from './conformance-cases.mjs';

const NOTATION = 2;
const EDITION = '2026.11';
const dir = new URL('../conformance/', import.meta.url);
const problems = [];
const problem = (where, what) => problems.push(`${where}\n     ${what}`);

const read = (text, startRule) => shapeParse(parse(text, { startRule }));
const refusal = (text, startRule) => {
  try { parse(text, { startRule }); return null; }
  catch (e) { if (!e.location) throw e; return { ...shapeError(e), message: e.message }; }
};

// What the reader concludes, as the suite records it.
function reading(text) {
  const a = analyze(text);
  return { first: a.first, winner: a.winner, winHow: a.winHow, endTurn: a.endTurn, rules: a.rules,
    warnings: a.warnings, turns: a.rows.map(r => ({ team: r.team, advantageLine: r.advantageLine,
      fieldLeft: r.fieldLeft, base: r.base, warnings: r.warnings })) };
}

function build() {
  const files = {};

  files['lenient.json'] = cases.lenient.map(([name, text]) => {
    try { return { name, text, parse: read(text, 'Game') }; }
    catch (e) { problem(`lenient: ${name}`, `does not parse: ${e.message}`); return { name, text }; }
  });

  files['canonical.json'] = cases.canonical.map(([name, text]) => {
    const where = `canonical: ${name}`;
    let shape;
    try { shape = read(text, 'CanonicalGame'); }
    catch (e) { problem(where, `is not canonical: line ${e.location?.start.line}, column ${e.location?.start.column}: ${e.message}`); return { name, text }; }
    const d = firstDifference(read(text, 'Game'), shape);
    if (d) problem(where, `the lenient form reads it differently: ${d}`);
    try {
      const c = toCanonical(text);
      if (c.text !== text) problem(where, `is not its own canonical form: ${JSON.stringify(c.text)}`);
      if (c.reports.length) problem(where, `canonical form reports: ${c.reports.join(' ')}`);
    } catch (e) { problem(where, `the canonical writer fails on it: ${e.message}`); }
    return { name, text, parse: shape };
  });

  files['invalid.json'] = cases.invalid.map(([name, form, text]) => {
    const where = `invalid: ${name}`;
    const canonical = refusal(text, 'CanonicalGame');
    const lenient = refusal(text, 'Game');
    if (!canonical) problem(where, 'the canonical form accepts it');
    if (form === 'lenient' && !lenient) problem(where, 'the lenient form accepts it');
    if (form === 'canonical' && lenient) problem(where, `it is filed as valid lenient, and the lenient form refuses it: ${lenient.message}`);
    const at = form === 'lenient' ? lenient : canonical;
    return { name, form, text, ...(at || {}) };
  });

  files['canonicalize.json'] = cases.canonicalize.map(([name, lenient]) => {
    const where = `canonicalize: ${name}`;
    let c;
    try { c = toCanonical(lenient); }
    catch (e) {
      if (e.location || !name.startsWith('cannot')) problem(where, `threw: ${e.message}`);
      return { name, lenient, cannot: e.message };
    }
    if (name.startsWith('cannot')) problem(where, 'was written, and should not be');
    if (toCanonical(c.text).text !== c.text) problem(where, 'the canonical form is not its own canonical form');
    const before = analyze(lenient), after = analyze(c.text);
    const d = firstDifference({ winner: before.winner, endTurn: before.endTurn, stats: before.stats },
      { winner: after.winner, endTurn: after.endTurn, stats: after.stats });
    if (d) problem(where, `the canonical form plays out differently: ${d}`);
    return { name, lenient, canonical: c.text, reports: c.reports };
  });

  files['reader.json'] = cases.reader.map(([name, text, grammar]) => {
    const where = `reader: ${name}`;
    const r = reading(text);
    const refused = refusal(text, 'Game');
    if ((grammar === 'rejects') !== !!refused) problem(where, `filed as "grammar ${grammar}", and the lenient grammar ${refused ? 'rejects' : 'accepts'} it`);
    const warned = r.warnings.length + r.turns.reduce((n, t) => n + t.warnings.length, 0);
    if (grammar === 'rejects' && !warned) problem(where, 'the reader repairs it without a warning');
    return { name, text, grammar, reading: r };
  });

  // The manifest tells a script what to do with each file: which field of a
  // case is the input, which check to run on it, and which field holds the
  // expected result.
  const entry = (file, check, input, expect, more = {}) => ({ file, cases: files[file] ? files[file].length : 0, check, input, expect, ...more });
  files['manifest.json'] = {
    notation: NOTATION, edition: EDITION,
    startRules: { lenient: 'Game', canonical: 'CanonicalGame' },
    files: [
      entry('lenient.json', 'parse', 'text', 'parse', { form: 'lenient' }),
      entry('canonical.json', 'parse', 'text', 'parse', { form: 'canonical', also: ['same-parse-in-lenient-form', 'canonicalize-leaves-unchanged'] }),
      entry('invalid.json', 'reject', 'text', null, { formFrom: 'form', hint: ['line', 'column', 'message'] }),
      entry('canonicalize.json', 'canonicalize', 'lenient', 'canonical', { reports: 'reports', refused: 'cannot' }),
      entry('reader.json', 'read', 'text', 'reading', { lenientGrammarFrom: 'grammar' }),
      entry('archive.json', 'archive', 'file', ['grammar', 'reading'], { games: '../games/' }),
    ],
  };
  for (const [f, c] of Object.entries(files)) {
    if (!Array.isArray(c)) continue;
    const seen = new Set();
    for (const { name } of c) { if (seen.has(name)) problem(f, `two cases named "${name}"`); seen.add(name); }
  }
  return files;
}

const pretty = v => JSON.stringify(v, null, 1) + '\n';
// One case to a line keeps the files readable in a diff.
const lines = list => '[\n' + list.map(c => JSON.stringify(c)).join(',\n') + '\n]\n';

// ---------- the archive ----------

// Every archived game still gives the parse and the results it gave before
// notation 2, and its canonical form plays out the same way.
function checkArchive() {
  const then = JSON.parse(readFileSync(new URL('archive.json', dir), 'utf8'));
  const now = snapshot();
  if (then.length !== now.length) problem('archive', `${now.length} games, and the snapshot has ${then.length}`);
  let same = 0, written = 0;
  now.forEach((g, i) => {
    const d = firstDifference(JSON.parse(JSON.stringify(g)), then[i]);
    if (d) return problem(`archive: ${g.file}`, d);
    same++;
    if (!g.grammar.valid) return;
    const text = readFileSync(new URL(`../games/${g.file}`, import.meta.url), 'utf8');
    let c;
    try { c = toCanonical(text); } catch (e) { return problem(`archive: ${g.file}`, `has no canonical form: ${e.message}`); }
    const d2 = firstDifference(JSON.parse(JSON.stringify(shapeReading(analyze(c.text)))), then[i].reading);
    if (d2) return problem(`archive: ${g.file}`, `its canonical form reads differently: ${d2}`);
    written++;
  });
  return { games: now.length, same, written };
}

// ---------- run ----------

const files = build();
const archive = checkArchive();
files['manifest.json'].files.find(f => f.file === 'archive.json').cases = archive.games;

const text = Object.fromEntries(Object.entries(files).map(([f, c]) => [f, Array.isArray(c) ? lines(c) : pretty(c)]));

if (process.argv.includes('--write')) {
  for (const [f, body] of Object.entries(text)) writeFileSync(new URL(f, dir), body);
  console.log(`conformance/ written: ${Object.keys(text).join(', ')}`);
} else {
  for (const [f, body] of Object.entries(text)) {
    let onDisk;
    try { onDisk = readFileSync(new URL(f, dir), 'utf8'); } catch { problem(f, 'is missing; run with --write'); continue; }
    if (onDisk === body) continue;
    const then = JSON.parse(onDisk), now = JSON.parse(body);
    if (!Array.isArray(now)) { problem(f, firstDifference(now, then) || 'differs'); continue; }
    const byName = new Map(then.map(c => [c.name, c]));
    for (const c of now) {
      const was = byName.get(c.name);
      if (!was) problem(`${f}: ${c.name}`, 'is not in the suite; run with --write and review the change');
      else { const d = firstDifference(c, was); if (d) problem(`${f}: ${c.name}`, d); }
      byName.delete(c.name);
    }
    for (const name of byName.keys()) problem(`${f}: ${name}`, 'is in the suite and not in tools/conformance-cases.mjs');
    if (!problems.length) problem(f, 'differs from the suite in layout only; run with --write');
  }
}

const n = Object.fromEntries(files['manifest.json'].files.map(f => [f.file, f.cases]));
console.log(`conformance: notation ${NOTATION}, edition ${EDITION}`);
console.log(`  archive: ${archive.same} of ${archive.games} games read as they did under notation 1; ${archive.written} written in canonical form and read back the same`);
console.log(`  ${n['lenient.json']} lenient and ${n['canonical.json']} canonical files read, ${n['invalid.json']} refused, ${n['canonicalize.json']} made canonical, ${n['reader.json']} readings`);
if (problems.length) {
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(`${problems.length} failures`);
  process.exit(1);
}
console.log('conformance suite passes');
