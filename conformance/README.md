# Conformance suite: Planet Kubb Notation 2

Data for checking a parser, a writer or a reader of the notation, in any language. The notation
is described in `docs/notation-2.md` and defined by `grammar/planet-kubb-notation.peggy`; this
is what makes the definition testable.

`manifest.json` names the notation and the edition, and how many cases each file holds.

| File | What it holds | A conforming implementation |
|---|---|---|
| `lenient.json` | Texts valid in the lenient form, each with its `parse`. | reads each one, and gets that parse. |
| `canonical.json` | Texts valid in the canonical form, each with its `parse`. | reads each one in both forms with that parse. A writer that makes them canonical changes nothing. |
| `invalid.json` | Texts that must be refused, each with the `form` it is invalid in and where this repository's parser points (`line`, `column`, `message`). | refuses each one. `form: "lenient"` is invalid in both forms. `form: "canonical"` is valid lenient and not canonical. |
| `canonicalize.json` | Lenient texts with their canonical form and what was `reports`ed as changed or dropped, or `cannot` when there is no canonical form. | writes the same bytes. |
| `reader.json` | Texts with what a reader concludes: who won, the rules in force, and the warnings. `grammar` says whether the lenient grammar accepts the text. | concludes the same. Where `grammar` is `rejects`, a tolerant reader may still read it, and must warn. |
| `archive.json` | All 150 archived games: what the grammar and the reader made of each **under notation 1**, taken before notation 2 changed anything. | reads every archived game the way it was read then. |

Refusing is what conforms in `invalid.json`. The line and column are where one parser stops, to
help find the problem; another parser may stop a little earlier or later.

## The shapes

**A parse** (`parse` in `lenient.json` and `canonical.json`, `grammar` in `archive.json`):

```
{ "headers": [["Team A", "Ringers"], ...],
  "turns": [
    { "n": 9,                                  the number as written, or null
      "kubbs": [{ "player": "a", "text": "7I2R2P", "I": 7, "R": 2, "P": 2, "Y": 0, "Q": 0, "N": 0, "E": false }],
      "advantage": null,                       or { "meters": 2, "legacy": null }
      "batons": [{ "player": "d", "text": "3F", "kind": "hit", "field": 3, "base": 0, "E": false }, ...],
      "note": null,
      "comments": ["..."],                     only when there are comments in parentheses
      "lines": [                               only when there are position lines
        { "mark": "@", "half": "b", "precision": "cell",
          "entries": [{ "at": [4, 0], "count": 5, "mark": null }, { "at": [0, 3], "count": 1, "mark": "p" }] },
        { "mark": "~", "half": "b", "precision": "point", "entries": [{ "ends": [[4.59, 0.06], [4.63, -0.08]] }] },
        { "mark": "^", "half": "a", "precision": "point", "entries": [[4.2, 4], null] },
        { "mark": "*", "half": "b", "precision": "cell", "entries": [[{ "at": [4, 0], "count": 3 }], null] }
      ],
      "issues": ["..."] }                      only when the turn's lines disagree (lenient form)
  ] }
```

A baton's `kind` is one of `hit`, `miss`, `king`, `king-miss`, `unthrown`, `illegal-king`,
`illegal-throw`, `win`, `resign`. Positions are numbers: `[across, depth]`.

**A reading** (`reading` in `reader.json`): `first`, `winner`, `winHow`, `endTurn`, `rules`
(`baseKubbs`, `batons`, `opening`), the game's `warnings`, and for each turn the `team` whose
turn it was, the `advantageLine` read off the pitch line, the `fieldLeft` in the defender's
half, the `base` kubbs standing on each side, and the turn's `warnings`. `archive.json` records
a fuller reading, with every statistic.

Warnings are sentences for people. An implementation in another language conforms by warning
about the same things, not by matching the words.

## In this repository

```
npm test                              runs the suite, with the grammar and reader tests
node tools/conformance.mjs --write    rewrites every file but archive.json from
                                      tools/conformance-cases.mjs
```

A new case goes in `tools/conformance-cases.mjs`; `--write` records what the grammar, the
canonical writer and the reader give for it, and that expectation is reviewed in the diff.

`archive.json` is not rewritten by `--write`. It is the guard that old sheets keep their
meaning. `tools/snapshot-archive.mjs` explains when it may be retaken.
