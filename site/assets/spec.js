import { parse } from './notation-parser.js';

const src = document.getElementById('src');
const verdict = document.getElementById('verdict');
const reading = document.getElementById('reading');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function who(t) { return t.player ? `<b>${esc(t.player)}</b> ` : ''; }

function inkastWords(k) {
  const parts = [];
  if (k.I || (!k.R && !k.P && !k.Y && !k.Q && !k.N)) parts.push(`${plural(k.I, 'kubb', 'kubbs')} thrown in`);
  if (k.Y) parts.push(plural(k.Y, 'failed rescue attempt', 'failed rescue attempts'));
  if (k.Q) parts.push(plural(k.Q, 'kubb rescued', 'kubbs rescued'));
  if (k.R) parts.push(plural(k.R, 'rethrow', 'rethrows'));
  if (k.P) parts.push(plural(k.P, 'penalty kubb', 'penalty kubbs'));
  if (k.N) parts.push(plural(k.N, 'neighbor', 'neighbors'));
  if (k.illegalKing) parts.push('and a kubb knocked over the king: the throwing team loses');
  return parts.join(', ');
}

function batonWords(b) {
  switch (b.kind) {
    case 'hit': {
      const p = [];
      if (b.field) p.push(plural(b.field, 'field kubb', 'field kubbs'));
      if (b.base) p.push(plural(b.base, 'base kubb', 'base kubbs'));
      let s = p.length ? p.join(', then ') : 'nothing (a count of zero)';
      if (b.illegalKing) s += ', and a kubb knocked over the king: the throwing team loses';
      return s;
    }
    case 'miss': return 'miss';
    case 'king-miss': return 'missed the king';
    case 'king': return 'the king: game over, the throwing team wins';
    case 'unthrown': return 'not thrown';
    case 'illegal-king': return 'knocked over the king too early: the throwing team loses';
    case 'illegal-throw': return 'illegal throw';
    case 'win': return 'game called: the throwing team wins';
    case 'resign': return 'resigned';
  }
  return b.kind;
}

function advantageWords(a) {
  if (a.legacy) return `advantage line (${{ BA: 'near the baseline', MA: 'near the middle', CA: 'near the center line' }[a.legacy]}, 2012 style)`;
  return a.meters === null ? 'throwing from an advantage line' : `throwing from an advantage line ${plural(a.meters, 'meter', 'meters')} in`;
}

function show() {
  const text = src.value;
  if (!text.trim()) { verdict.innerHTML = ''; reading.innerHTML = ''; return; }
  let g;
  try {
    g = parse(text);
  } catch (e) {
    if (!e.location) throw e;
    const { line, column } = e.location.start;
    const lineText = text.split(/\r\n|\n|\r/)[line - 1] ?? '';
    const caret = ' '.repeat(column - 1) + '^';
    verdict.innerHTML = `<div class="verdict err"><b>Not valid.</b> Line ${line}, column ${column}: ${esc(e.message)}<pre>${esc(lineText)}\n${caret}</pre></div>`;
    reading.innerHTML = '';
    return;
  }
  const nt = g.turns.length;
  verdict.innerHTML = `<div class="verdict ok"><b>Valid.</b> ${plural(g.headers.length, 'header', 'headers')}, ${plural(nt, 'turn', 'turns')}.</div>`;
  const rows = [];
  for (const h of g.headers) rows.push(`<tr><td class="l"><code>[${esc(h.key)}]</code></td><td class="l">${esc(h.value)}</td></tr>`);
  g.turns.forEach((t, i) => {
    rows.push(`<tr class="sep"><td class="l">Turn ${t.number ?? i + 1}</td><td class="l">${t.note ? `<span class="muted">${esc(t.note)}</span>` : ''}</td></tr>`);
    for (const k of t.inkasts) rows.push(`<tr><td class="l"><code>${esc(k.player ? k.player + ':' : '')}${esc(k.text)}</code></td><td class="l">${who(k)}${inkastWords(k)}</td></tr>`);
    if (t.advantage) rows.push(`<tr><td class="l"><code>${esc(t.advantage.text)}</code></td><td class="l">${advantageWords(t.advantage)}</td></tr>`);
    t.batons.forEach((b, j) => rows.push(`<tr><td class="l"><code>${esc(b.player ? b.player + ':' : '')}${esc(b.text)}</code></td><td class="l">Baton ${j + 1}: ${who(b)}${batonWords(b)}</td></tr>`));
  });
  const strip = JSON.stringify(g, (k, v) => (k === 'location' ? undefined : v), 1)
    .replace(/\n\s+/g, ' ').replace(/(\{ "number")/g, '\n  $1');
  reading.innerHTML = `<div class="tablewrap reading"><table><tbody>${rows.join('')}</tbody></table></div>
    <details class="src"><summary>The parsed result as JSON</summary><pre>${esc(strip)}</pre></details>`;
}

let timer;
src.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(show, 100); });
show();

fetch('/spec/planet-kubb-notation.peggy').then(r => r.text()).then(t => {
  document.getElementById('grammar-src').textContent = t;
});
