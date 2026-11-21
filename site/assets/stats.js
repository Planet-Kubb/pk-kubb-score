import { analyze } from './kubb.js';

const $ = s => document.querySelector(s);
const input = $('#notation');
const picker = $('#archive');
const out = $('#out');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v, d = 0) => (v === null || v === undefined ? '—' : (v * 100).toFixed(d) + '%');
const num = (v, d = 0) => (v === null || v === undefined ? '—' : (+v).toFixed(d));
const sideClass = s => (s === 'A' ? 'team-a' : 'team-b');

const EXAMPLE = `[Team A "Garrick and Jamie"]
[Team A Players "Jamie Thingelstad (jt), Garrick van Buren (g)"]
[Team B "Dobbie and Jaime"]
[Team B Players "Dobbie (d), Jaime Feathers (jf)"]

1. 0I jt:- jt:- g:B g:- jt:- g:-
2. d:I d:- d:- d:- jf:- jf:- jf:F
3. jt:I g:F g:- jt:- jt:- g:- jt:-
4. d:I d:F d:- d:B jf:- jf:- jf:-
5. jt:2I jt:- jt:- g:F g:- jt:- g:-
6. d:I A jf:- d:- d:- d:F jf:B jf:-
7. g:2I g:- g:- jt:F jt:F g:F jt:-
8. d:3I jf:- d:- jf:- d:- jf:2F d:-
9. jt:2I A jt:F jt:F g:B g:- g:- jt:B
10. d:4I d:3F d:F jf:- d:F jf:- jf:B
11. g:6I g:4F g:- jt:F jt:- g:F jt:- # Great grouping by Garrick.
12. d:6I d:F jf:- d:F d:3F jf:F jf:-
13. jt:6I jt:4F jt:F g:- g:- jt:- g:- # nice blast on t1
14. d:5I A d:F d:F jf:F d:2F jf:- jf:B
15. g:6I g:F g:3F jt:F jt:F g:- jt:-
16. d:6I A d:3F jf:F d:F d:F jf:- jf:B
17. jt:7I jt:2F jt:2F g:F g:F jt:- g:F
18. d:7I A d:6F d:F jf:= jf:K X X # great grouping from Dobbie.
`;

let games = [];

// ---------- rendering ----------

function batonLabel(b) {
  switch (b.kind) {
    case 'miss': return b.f || b.b ? `${b.f}F` : '-';
    case 'hit': return (b.f ? (b.f > 1 ? b.f : '') + 'F' : '') + (b.b ? (b.b > 1 ? b.b : '') + 'B' : '') + (b.e ? 'E' : '');
    case 'king': return 'K';
    case 'kingmiss': return '=';
    case 'unthrown': return 'X';
    case 'illegalking': return 'E';
    case 'illegal': return 'Z';
    case 'win': return 'W';
    case 'resign': return 'G';
  }
  return b.raw;
}

function chip(b) {
  let cls = 'chip';
  if (b.kind === 'king') cls += ' king';
  else if (b.kind === 'hit' && !b.e) cls += ' hit';
  else if (b.kind === 'illegalking' || b.kind === 'illegal' || b.e) cls += ' bad';
  if (b.void) cls += ' void';
  const who = b.player ? `<i>${esc(b.player)}</i>` : '';
  return `<span class="${cls}" title="${esc(b.raw)}">${who}${esc(batonLabel(b))}</span>`;
}

function inkastLabel(r) {
  if (!r.inkastRecorded) return r.inkast ? `<span class="muted" title="Not recorded; worked out from the previous turn">${r.inkast}</span>` : '';
  const k = r.ink;
  let s = `${k.I}I`;
  if (k.Y) s += ` ${k.Y}Y`;
  if (k.R) s += ` ${k.R}R`;
  if (k.P) s += ` ${k.P}P`;
  if (k.Q) s += ` ${k.Q}Q`;
  if (k.N) s += ` ${k.N}N`;
  if (k.E) s += ' E';
  return s;
}

// Base kubbs still standing, out of the number each side started with (five
// unless the game's Base kubbs header says otherwise).
function dots(n, of) {
  return `<span class="dots" aria-label="${n} of ${of}">${'●'.repeat(n)}<span class="gone">${'●'.repeat(Math.max(0, of - n))}</span></span>`;
}

function chart(g) {
  const rows = g.rows;
  if (rows.length < 2) return '';
  const W = 720, H = 190, L = 28, R = 10, T = 12, B = 26;
  const n = rows.length;
  const maxField = Math.max(5, ...rows.map(r => r.startField));
  const x = i => L + (W - L - R) * (i / n);
  const bw = (W - L - R) / n;
  const start = g.rules.baseKubbs;
  const yb = v => T + (H - T - B) * (1 - v / start);
  const yf = v => T + (H - T - B) * (1 - v / maxField);
  let bars = '', lines = '';
  rows.forEach((r, i) => {
    const h = (H - T - B) - (yf(r.startField) - T);
    if (r.startField) bars += `<rect x="${(x(i) + bw * 0.18).toFixed(1)}" y="${yf(r.startField).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="var(--${r.team === 'A' ? 'a' : 'b'})" opacity="0.22"><title>Turn ${r.turn}: ${r.startField} field kubbs to clear</title></rect>`;
  });
  for (const s of ['A', 'B']) {
    let d = `M${x(0).toFixed(1)},${yb(start).toFixed(1)}`;
    rows.forEach((r, i) => { d += ` H${x(i + 1).toFixed(1)} V${yb(r.base[s]).toFixed(1)}`; });
    lines += `<path d="${d}" fill="none" stroke="var(--${s === 'A' ? 'a' : 'b'})" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  let grid = '';
  for (let v = 0; v <= start; v++) grid += `<line x1="${L}" x2="${W - R}" y1="${yb(v)}" y2="${yb(v)}" stroke="var(--rule)" stroke-width="1"/><text x="${L - 8}" y="${yb(v) + 4}" font-size="11" text-anchor="end" fill="var(--muted)">${v}</text>`;
  let ticks = '';
  const step = n > 24 ? 4 : n > 12 ? 2 : 1;
  for (let i = 0; i < n; i += step) ticks += `<text x="${(x(i) + bw / 2).toFixed(1)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="var(--muted)">${i + 1}</text>`;
  return `<div class="chart">
    <div class="legend"><span><i style="background:var(--a)"></i>${esc(g.teamName.A)} base kubbs</span><span><i style="background:var(--b)"></i>${esc(g.teamName.B)} base kubbs</span><span><i style="background:var(--muted);opacity:.4;height:8px"></i>Field kubbs to clear (scaled to ${maxField})</span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Base kubbs standing for each team after every turn">${grid}${bars}${lines}${ticks}</svg>
  </div>`;
}

function teamCard(g, s) {
  const st = g.stats[s];
  const won = g.winner === s ? '<span class="win">Won</span>' : '';
  return `<div class="team-card ${s === 'B' ? 'b' : ''}">
    <h3 class="${sideClass(s)}">${esc(g.teamName[s])}${won}</h3>
    <div class="big">
      <div><b>${pct(st.hitPct)}</b><span>Hit %</span></div>
      <div><b>${pct(st.efficiency)}</b><span>Efficiency</span></div>
      <div><b>${st.zeroBaseAt ?? '—'}</b><span>0B@T#</span></div>
      <div><b>${num(st.btcAvg, 1)}</b><span>BTC</span></div>
    </div>
  </div>`;
}

function teamTable(g) {
  const A = g.stats.A, B = g.stats.B;
  const row = (label, a, b, cls = '') => `<tr class="${cls}"><td>${label}</td><td>${a}</td><td>${b}</td></tr>`;
  const ratio = (x, y) => (y ? `${x} of ${y}` : '—');
  return `<div class="tablewrap"><table>
    <thead><tr><th>Team</th><th class="${sideClass('A')}">${esc(g.teamName.A)}</th><th class="${sideClass('B')}">${esc(g.teamName.B)}</th></tr></thead>
    <tbody>
    ${row('Turns', A.turns, B.turns)}
    ${row('Batons thrown', A.batons, B.batons)}
    ${row('Hits', A.hits, B.hits)}
    ${row('Hit %', pct(A.hitPct, 1), pct(B.hitPct, 1))}
    ${row('Field kubbs', A.field, B.field)}
    ${row('Base kubbs', A.base, B.base)}
    ${row('King: hits and misses', `${A.kings} / ${A.kingMisses}`, `${B.kings} / ${B.kingMisses}`)}
    ${row('Best single baton', A.bestBlast ? A.bestBlast + 'F' : '—', B.bestBlast ? B.bestBlast + 'F' : '—')}
    ${row('First-baton efficiency', `${pct(A.efficiency, 1)} <span class="muted small">(${A.effF}/${A.effI})</span>`, `${pct(B.efficiency, 1)} <span class="muted small">(${B.effF}/${B.effI})</span>`)}
    ${row('Zero base at throw #', A.zeroBaseAt ?? '—', B.zeroBaseAt ?? '—')}
    ${row('Batons to clear, average', num(A.btcAvg, 2), num(B.btcAvg, 2))}
    ${row('Turns that left field kubbs', A.uncleared, B.uncleared)}
    ${row('Turns from an advantage line', A.advTurns, B.advTurns)}
    ${row('Hit % from advantage', pct(A.advHitPct, 1), pct(B.advHitPct, 1))}
    ${row('Kubbs thrown in', A.I + A.Y, B.I + B.Y)}
    ${row('Rethrows', `${A.R} <span class="muted small">(${pct(A.rethrowPct)})</span>`, `${B.R} <span class="muted small">(${pct(B.rethrowPct)})</span>`)}
    ${row('Penalty kubbs', A.P, B.P)}
    ${A.Y + B.Y + A.Q + B.Q ? row('Rescue attempts / rescued', `${A.Y} / ${A.Q}`, `${B.Y} / ${B.Q}`) : ''}
    ${A.N + B.N ? row('Neighbors', A.N, B.N) : ''}
    ${row('Longest run of hits', A.hotStreak, B.hotStreak)}
    ${row('Longest run of misses', A.coldStreak, B.coldStreak)}
    </tbody></table></div>`;
}

function playerTable(g) {
  const ps = g.players.filter(p => p.batons || p.I || p.Y);
  if (!ps.length) return '<p class="muted">No player tokens in this game, so there are no player stats. Put a token in front of each baton (<code>jt:F</code>) to get them.</p>';
  ps.sort((a, b) => (a.side === b.side ? b.batons - a.batons : a.side < b.side ? -1 : 1));
  const anyInk = ps.some(p => p.I || p.Y);
  return `<div class="tablewrap"><table>
    <thead><tr><th>Player</th><th>Batons</th><th>Hits</th><th>Hit %</th><th>F</th><th>B</th><th>K</th><th>=</th><th>Best</th>${anyInk ? '<th>Inkast</th><th>R</th>' : ''}</tr></thead>
    <tbody>${ps.map(p => `<tr>
      <td><span class="${sideClass(p.side)}">●</span> ${esc(p.name || p.id)} ${p.name ? `<span class="muted small">${esc(p.id)}</span>` : ''}</td>
      <td>${p.batons}</td><td>${p.hits}</td><td>${pct(p.hitPct, 1)}</td><td>${p.field}</td><td>${p.base}</td>
      <td>${p.kings || ''}</td><td>${p.kingMisses || ''}</td><td>${p.bestBlast ? p.bestBlast + 'F' : ''}</td>
      ${anyInk ? `<td>${p.I + p.Y || ''}</td><td>${p.R || ''}</td>` : ''}
    </tr>`).join('')}</tbody></table></div>`;
}

function turnTable(g) {
  return `<div class="tablewrap"><table class="turns">
    <thead><tr><th>#</th><th class="l">Team</th><th>Inkast</th><th>Adv</th><th title="Field kubbs + base kubbs to knock down">Targets</th><th class="l">Batons</th><th title="Batons to clear the field">BTC</th><th title="Field kubbs left standing">Left</th><th class="l ${sideClass('A')}">${esc(g.teamName.A)}</th><th class="l ${sideClass('B')}">${esc(g.teamName.B)}</th></tr></thead>
    <tbody>${g.rows.map(r => `<tr>
      <td>${r.turn}</td>
      <td class="l"><span class="${sideClass(r.team)}">●</span> ${esc(short(g.teamName[r.team]))}</td>
      <td>${inkastLabel(r)}</td>
      <td>${r.advantageMarked ? (r.advantageMarked.meters != null ? r.advantageMarked.meters + 'A' : r.advantageMarked.old ? r.advantageMarked.old + 'A' : 'A') : r.advantage ? '<span class="muted">A?</span>' : ''}</td>
      <td>${r.startField}+${r.startBase}</td>
      <td class="batons">${r.batons.map(chip).join('')}
        ${r.note ? `<span class="note">${esc(r.note)}</span>` : ''}
        ${r.comments.map(c => `<span class="note">(${esc(c)})</span>`).join('')}
        ${r.warnings.map(w => `<span class="flag">⚠ ${esc(w)}</span>`).join('')}</td>
      <td>${r.startField ? (r.btc ?? '') : ''}</td>
      <td>${r.fieldLeft || ''}</td>
      <td class="l">${dots(r.base.A, g.rules.baseKubbs)}</td><td class="l">${dots(r.base.B, g.rules.baseKubbs)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

const short = s => (s.length > 22 ? s.slice(0, 20) + '…' : s);

function render() {
  const text = input.value;
  if (!text.trim()) {
    out.innerHTML = '<p class="empty">Paste a game above, or pick one from the archive, to see its stats.</p>';
    return;
  }
  const g = analyze(text);
  if (!g.rows.length) {
    out.innerHTML = `<p class="empty">No turns found yet. A turn looks like <code>3. 2I F - B - B B</code>.</p>`;
    return;
  }
  const h = g.headers;
  const date = h['Start'] || h['Event date'] || '';
  const meta = [h['Event'], h['Location'], date, h['Duration']].filter(Boolean).map(esc).join(' · ');
  let result = '';
  if (g.winner) {
    const how = { king: `took the king in turn ${g.endTurn}`, 'Win header': 'won (per the Win header)' }[g.winHow] ||
      (g.winHow.startsWith('illegal') ? `won in turn ${g.endTurn}: the other team knocked the king over illegally` :
       g.winHow.startsWith('called') ? `won in turn ${g.endTurn} when the game was called` :
       g.winHow.startsWith('resigned') ? `won in turn ${g.endTurn} when the other team resigned` : 'won');
    result = `<span class="${sideClass(g.winner)}">${esc(g.teamName[g.winner])}</span> ${how}.`;
  } else result = 'No winner yet.';
  const opened = `${esc(g.teamName[g.first])} opened${g.firstSource === 'inferred' ? ' (worked out from who took the king)' : g.firstSource === 'default' ? ' (assumed; add a First header to change it)' : ''}.`;
  const allWarn = g.warnings;
  const flagged = g.rows.filter(r => r.warnings.length).length;
  out.innerHTML = `
    <div class="result">
      <h2><span class="team-a">${esc(g.teamName.A)}</span> v. <span class="team-b">${esc(g.teamName.B)}</span></h2>
      ${meta ? `<p class="meta">${meta}</p>` : ''}
      <p class="meta">${result} ${opened} ${g.rows.length} turns.${flagged ? ` <a href="#turns">${flagged} ${flagged === 1 ? 'turn has' : 'turns have'} a warning.</a>` : ''}</p>
    </div>
    ${allWarn.length ? `<ul class="warnlist">${allWarn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    <div class="keys">${teamCard(g, 'A')}${teamCard(g, 'B')}</div>
    ${chart(g)}
    <h2>Teams</h2>${teamTable(g)}
    <h2>Players</h2>${playerTable(g)}
    <h2 id="turns">Turn by turn</h2>
    <p class="muted small">Targets are field kubbs plus base kubbs at the start of the turn. Dots are each team's base kubbs still standing after the turn. A faded baton was never thrown.</p>
    ${turnTable(g)}`;
}

// ---------- archive and URL ----------

function fillPicker() {
  const byYear = {};
  for (const g of games) (byYear[g.date.slice(0, 4)] ||= []).push(g);
  picker.innerHTML = '<option value="">Open a recorded game (150, 2011 to 2015)…</option>' +
    Object.keys(byYear).sort().map(y => `<optgroup label="${y}">${byYear[y]
      .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
      .map(g => `<option value="${esc(g.id)}">${esc(g.date.slice(5))} · ${esc(g.title.replace(/\//g, ' · '))}</option>`).join('')}</optgroup>`).join('');
}

function loadGame(id) {
  const g = games.find(x => x.id === id);
  if (!g) return false;
  input.value = g.text;
  picker.value = id;
  history.replaceState(null, '', `?game=${encodeURIComponent(id)}`);
  render();
  return true;
}

let timer;
input.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(render, 120);
  if (picker.value) { picker.value = ''; history.replaceState(null, '', location.pathname); }
});
picker.addEventListener('change', () => { if (picker.value) loadGame(picker.value); });
$('#example').addEventListener('click', () => {
  input.value = EXAMPLE; picker.value = '';
  history.replaceState(null, '', location.pathname);
  render();
});
$('#clear').addEventListener('click', () => {
  input.value = ''; picker.value = '';
  history.replaceState(null, '', location.pathname);
  render(); input.focus();
});
$('#share').addEventListener('click', async () => {
  const url = picker.value ? location.href : `${location.origin}${location.pathname}#n=${encodeURIComponent(input.value)}`;
  try { await navigator.clipboard.writeText(url); $('#share').textContent = 'Link copied'; }
  catch { history.replaceState(null, '', url); $('#share').textContent = 'Link is in the address bar'; }
  setTimeout(() => { $('#share').textContent = 'Copy link'; }, 1800);
});

function readHash() {
  if (!location.hash.startsWith('#n=')) return false;
  try { input.value = decodeURIComponent(location.hash.slice(3)); } catch { return false; }
  picker.value = '';
  return true;
}
window.addEventListener('hashchange', () => { if (readHash()) render(); });

const params = new URLSearchParams(location.search);
readHash();
render();

fetch('/data/games.json').then(r => r.json()).then(data => {
  games = data;
  fillPicker();
  if (params.get('game')) loadGame(params.get('game'));
}).catch(() => { picker.innerHTML = '<option value="">The game archive didn\'t load</option>'; });
