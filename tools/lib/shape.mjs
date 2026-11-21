// The shapes the conformance suite compares. A parser in any language can be
// checked against the suite by producing these same shapes.

// What the grammar returns for a game, without source locations.
export function shapeParse(g) {
  return {
    headers: g.headers.map(h => [h.key, h.value]),
    turns: g.turns.map(t => {
      const turn = {
        n: t.number,
        kubbs: t.inkasts.map(k => ({ player: k.player, text: k.text, I: k.I, R: k.R, P: k.P,
          Y: k.Y, Q: k.Q, N: k.N, E: !!k.illegalKing })),
        advantage: t.advantage ? { meters: t.advantage.meters, legacy: t.advantage.legacy } : null,
        batons: t.batons.map(b => ({ player: b.player, text: b.text, kind: b.kind,
          field: b.field || 0, base: b.base || 0, E: !!b.illegalKing })),
        note: t.note,
      };
      if (t.comments && t.comments.length) turn.comments = t.comments;
      // Notation 2: position lines, only when the turn has any.
      if (t.lines && t.lines.length) {
        turn.lines = t.lines.map(l => ({ mark: l.mark, half: l.half, precision: l.precision, entries: l.entries }));
      }
      // Where a turn's lines disagree with each other (the lenient form reads
      // such a turn and reports it; the canonical form refuses it).
      if (t.issues && t.issues.length) turn.issues = t.issues.map(i => i.message);
      return turn;
    }),
  };
}

// What the reader (kubb.js analyze) concludes about a game.
export function shapeReading(a) {
  return {
    first: a.first, firstSource: a.firstSource,
    winner: a.winner, winHow: a.winHow, endTurn: a.endTurn,
    stats: a.stats, players: a.players, warnings: a.warnings,
    rows: a.rows.map(r => ({ turn: r.turn, n: r.n, team: r.team, inkast: r.inkast,
      inkastRecorded: r.inkastRecorded, advantage: r.advantage, leftover: r.leftover,
      startField: r.startField, startBase: r.startBase, knocked: r.knocked, btc: r.btc,
      fieldLeft: r.fieldLeft, base: r.base, warnings: r.warnings })),
  };
}

// Where a parser's error is, as the suite records it.
export function shapeError(e) {
  return { line: e.location.start.line, column: e.location.start.column };
}

// Deep equality on JSON values, with the path of the first difference.
export function firstDifference(a, b, path = '') {
  if (a === b) return null;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    return `${path || 'value'}: ${JSON.stringify(a)} is not ${JSON.stringify(b)}`;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: one is a list and one is not`;
  if (Array.isArray(a) && a.length !== b.length) return `${path}: ${a.length} items, expected ${b.length}`;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const d = firstDifference(a[k], b[k], Array.isArray(a) ? `${path}[${k}]` : `${path}.${k}`);
    if (d) return d;
  }
  return null;
}
