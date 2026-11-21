# Planet Kubb Notation 2: design proposal

Status: proposal for review, 2026-11-21. Stage one of three. Nothing here is built. Stage two
(the grammar, the canonical-form rules and the conformance suite) starts when this is approved.
Stage three (the Kubb Engine writing notation 2) belongs to the engine's maintainer, against a
tagged release of this repository.

It answers [issue 5](https://github.com/Planet-Kubb/pk-kubb-score/issues/5), the engine's
requirements. Comment on any line.

## The proposal in short

- **Two forms.** The *lenient* form is everything the grammar accepts today, plus positions. Every
  old sheet keeps its meaning. The *canonical* form is one spelling of each thing, for programs to
  write and compare. Most of the archive is already written that way: in 116 of the 150 games
  every turn line is canonical as it stands (1,225 of 1,335 turn lines), and nearly all the rest
  differ by a written `1` (`4I1R` for `4IR`).
- **Positions are part of a token**, not a comment: `@`, then across, the side, and depth.
  `2I@1b2@3b0` is two kubbs thrown in, standing in cells 1b2 and 3b0.
  `2I@1.32b1.87@3.40b0.61` is the same turn to the centimetre.
- **A whole number is a one-metre cell. A number with two decimals is a point.** Dropping the
  decimals of a point gives its cell.
- **One frame for the whole game**: across from the centre-line stake on Team A's left, 0 to 5;
  depth from the centre line, 0 to 4; `a` or `b` for the half.
- **A position says where a kubb stands** when the batons are thrown. Where it lay is an optional
  extra that only a program would write.
- **The file says `[Notation "2"]`.** The spec document has a dated edition.
- **Three layers, kept apart**: syntax (the grammar), counting (the reader), legality (the engine).

## What was already decided

These came with the brief and are not reopened here: a formal grammar; positions at two
precisions on one scheme; a centre-line origin with the king at across 2.5, depth 0, no negative
numbers and no half-metre offsets; this repository as the notation's home, independent of
Throwing Wood; no support for the corner-origin positions the engine has written since
2026-11-16; and the split in issue 5 (this repository owns the spec, grammar, coordinate system,
version, conformance suite, reader and archive; the engine owns the writer and legality).

## Two forms

### Lenient

The lenient grammar is today's grammar with two additions: positions and the `[Notation]`
header. Nothing is taken away, so every file that parses today parses the same way. That is the
guard for the archive: stage two snapshots what the grammar and `kubb.js` return for all 150
games before any change, and the suite fails if any of it moves.

Lenient is for sheets typed in from paper. It still allows what the canonical form does not: a
missing colon (`jtB`), lowercase actions (`2f`), commas and slashes between actions, comments in
parentheses, a bare number for kubbs thrown in (`3`), a written count of one (`1F`), kubb codes
in any order (`7IQ2R`), `!` for an illegal king hit, the advantage forms `2A`, `BA`, `MA` and
`CA`, missing turn numbers, and a file with no headers.

### Canonical

One spelling of everything. Two writers that record the same game the same way produce the same
bytes, and the canonical form of a canonical file is itself.

| | Canonical rule |
|---|---|
| File | UTF-8, no byte-order mark, `\n` line ends, one at the end of the file. |
| Headers | `[Key "value"]`, one per line, one space between key and value, no key twice. `[Notation "2"]` is the first. Inside a value only `\"` and `\\` are escapes. Then one blank line. |
| Turn line | `n. `, then tokens with one space between them, then an optional ` # note`. Turns are numbered from 1 with none skipped. No blank lines or comment lines between turns. |
| Player | `id:` before the action, with the colon, lowercase letters and `_`. A token may have no player. |
| Counts | 2 to 10 are written; a count of one is not (`F`, never `1F`). Zero appears only as `0I`. |
| Kubbs thrown in | Codes in the order `I R P Y Q N`, then `E`. `0I` when the scorer knows none were thrown; no token when the inkast was not recorded. The reader already treats those two differently. |
| Advantage | `A`, after the kubbs and before the batons, with an optional position. No `2A`, `BA`, `MA`, `CA`. |
| Batons | `-`, `F`, `B` and their counts with `F` before `B`, a trailing `E` for a kubb that took the king, `K`, `=`, `X`, `E`, `Z`, `W`, `G`. No `!`. |
| Positions | As below. They are spelled the same way in both forms. |
| Comments | Only the note: ` # text` at the end of a turn line. No parentheses. |

Uppercase actions, lowercase players and the colon together remove every collision between a
player and an action letter (see the discrepancies).

Making a file canonical works token by token. It never merges, splits or reorders tokens, and it
never invents data. A comment in parentheses moves into the note. Two things cannot be carried
and are reported: the number in `2A` and the 2012 markers `BA`, `MA`, `CA`. No archived game
uses either (every advantage line in the archive is a bare `A`).

Both forms come from one Peggy grammar file with two start rules, so they cannot drift apart.

## Versions

- **In the file**: `[Notation "2"]`, a plain integer. It changes only when files that were valid
  stop being valid or change meaning. A file with no `[Notation]` header is read leniently; old
  sheets have none.
- **The spec document** carries a dated edition. Jamie floated `2026.11`. I would use exactly
  that shape, year and month, with three rules: an edition is named for the month it is tagged
  (so the first one is `2026.12` if that is when it ships), a second edition in the same month is
  `2026.11.1`, and the git tag a client pins is `v2-2026.11`. A calendar edition says how fresh
  the document is and promises nothing more, which is right, because the only compatibility
  promise is the integer. Semantic versioning would invite people to read promises into the
  second and third numbers.
- **What an edition may change** inside notation 2: wording, conformance cases, and new optional
  annotations. A canonical file valid under one edition stays valid, with the same meaning,
  under every later one. A parser older than the file's writer may reject a newer annotation; it
  never misreads it.
- The edition is not written in game files. Hand scorers should not have to know it, and two
  runs of the same match should not differ because the spec's wording changed.

## The pitch frame

```
                 Team B's baseline
        +----+----+----+----+----+   depth 4
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 3
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 2      side b
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 1
        |    |    |    |    |    |
 origin O----+----+--K-+----+----+   depth 0      the centre line
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 1
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 2      side a
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 3
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 4
 across 0    1    2    3    4    5
                 Team A's baseline
```

- **Origin**: the centre-line stake on Team A's left, as Team A stands on its own baseline facing
  the king.
- **Across**: metres from that stake along the centre line, 0 to 5. The king is at 2.5.
- **Depth**: metres from the centre line toward a baseline, 0 to 4, the same on both sides.
- **Side**: `a` for Team A's half, `b` for Team B's. A piece exactly on the centre line takes the
  side of the half it is in play for.
- **Fixed for the game**: Team A and Team B are fixed by the file's headers and a game is played
  from one pair of baselines, so the frame cannot move. The next game of a match is its own file
  and sets its own frame.

Across is what the engine already writes as x. Only its y changes, into a side and a depth.

### Cells and points

- A **whole number is a cell**, one metre square. Across cell `2` covers 2 up to but not
  including 3. Depth cell `0` is the metre next to the centre line. There are 5 cells across
  (`0` to `4`) and 4 deep on each side (`0` to `3`). The king stands in the middle of across
  cell 2, on the line between `2a0` and `2b0`.
- A **number with two decimals is a point**: `1.32b1.87`. Always exactly two, in both forms.
  Across runs `0.00` to `5.00`, depth `0.00` to `4.00`. A writer rounds to the nearest
  centimetre.
- **Coarsening**: a point's cell is the point with its decimals dropped. The two far edges
  belong to the last cell: across `5.00` is in cell 4 and depth `4.00` is in cell 3. So a base
  kubb, which stands on its baseline at depth `4.00`, is in depth cell 3.
- A position is one or the other: both numbers whole, or both with decimals.
- Two positions **agree at cell level** when they have the same side and the same cell after
  coarsening. That is how a simulated game is compared with a hand-scored one.
- A cell is an area. A program that needs somewhere to draw it may use its centre, but must not
  write that centre back as a point.

The grammar enforces the ranges. `@5b1`, `@2b4`, `@1.3b2.0` and `@6.20a1.00` are errors.

## Positions

```
Position  = Across Side Depth
Side      = "a" / "b"
Across    = [0-4]                        a cell
          / [0-4] "." [0-9] [0-9] / "5.00"     a point
Depth     = [0-3]
          / [0-3] "." [0-9] [0-9] / "4.00"
```

A position is written `@` and then the position, straight after the count and letter it
describes, with no space. Several follow one another.

| After | It means | At most |
|---|---|---|
| `I` | where a kubb thrown in this turn stands when the first baton is thrown | the count of `I` |
| `P` | where a punishment kubb was placed | the count of `P` |
| `F` | where a field kubb this baton toppled stood before the throw | the count of `F` |
| `B` | where a base kubb this baton toppled stood | the count of `B` |
| `A` | where the kubb that sets the advantage line stands | 1 |

Nothing else takes a position. `-@2b1`, `K@2b0` and `2R@1b1` are errors, and so is one position
too many (`F@1b1@2b1`).

- Positions are optional everywhere. A token may give fewer than it counts, in any order.
- Because a position follows its own letter, a punishment kubb's place is told apart from a
  thrown kubb's (`7I2R2P@2b0@0b3`), and a baton that took field kubbs and a base kubb says which
  is which (`2F@1.88a0.95@2.40a1.10B@2.50a4.00`).
- Numbers have fixed widths, so `F@1b22B` can only be read one way (cell 1b2, then `2B`). It is
  hard on the eye. When kubbs thrown in have positions on both `I` and `P`, a writer should put
  them in two tokens, which the reader already adds together: `a:7I@1b2@2b2 a:2R2P@2b0@0b3`.
- The side is always written. It would usually follow from whose turn it is, but then a position
  could only be read after working out who threw first, and 16 archived games had that wrong on
  the wiki.
- A turn line stays a row of words with spaces between them, each word complete. A simple reader
  can drop every position with one pattern (`@` digits-and-dots, a letter, digits-and-dots) and
  read the rest as it does today.

### Old `(@ ...)` positions

Notation 2 has no `(@ ...)`. In the lenient form a parenthesised comment is a comment, so an old
engine file reads as it would with those comments deleted: they are inert, and never taken for
centre-line coordinates. In the canonical form parentheses are not allowed at all. In the other
direction, today's grammar rejects an `@` outside a comment (checked), so a notation 1 parser
fails on a notation 2 position instead of misreading it.

### The advantage line

`2A` counts metres from the attacker's baseline; a position counts depth from the centre line.
They run in opposite directions because they measure different things: how far the throwing line
moved forward, and where a piece is. I would not turn the depth axis round to match. The centre
line and the king are what a kubb's place is judged against, both halves then read alike, and
the origin decision already puts depth 0 at the king.

Instead the canonical form stops writing the number. An advantage line is `A`, and when its place
is known, `A@3.12b1.63`: the position of the kubb that sets it. The line's depth is that kubb's
depth, on the same axis as everything else, and the old number is `4 - depth`. The lenient form
still reads `2A` with the meaning it has always had.

### Optional extras

Both are optional, and each can be left out of the first edition without changing anything
above. I would include the first and mark the second provisional, as `N` once was.

- **Where the thrower stood**: `^` and an across value, the last thing in a baton token.
  `j:F@1.32b1.87^2.10`, or `j:-^3` to a cell. The thrower stands on their own baseline or
  advantage line, so across is the only unknown.
- **Where a kubb lay before it was raised**: after a standing position, `~` and each end of the
  lying kubb, points only: `I@2.71a1.42~2.66a1.38~2.79a1.45`. Two ends give the direction it lay
  without an angle, which matters because angles would need a convention across two mirrored
  halves. The end nearer the standing position is the end the defender chose.

## On paper

A scorer writes the same marks the parser reads: after the action, `@`, the column, the half,
the row. `IRP@0b3` is seven characters for "one kubb, rethrown, punished, placed in the back
cell of Team B's half on Team A's left". Nobody measures centimetres with a clipboard, so paper
uses cells.

A future scoresheet can print a small 5 by 8 grid for each turn, marked with the origin stake and
the two halves. The scorer puts a dot where each kubb stands, and typing the dots in as cells is
mechanical. The scoresheet is a separate piece of work.

## Worked examples

**An old sheet line**, as the 2012 scoresheet allowed it to be written, with no colons:

```
9. a7I2R2P d3F d2F aF a- yF cB # penalty kubbs: 1 behind the king and 1 in the back left corner
```

**The same line in canonical form.** This is, byte for byte, turn 9 of the archived 2012 US
Nationals quarter-final between The Ringers and Kubbitz, game 2:

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B # penalty kubbs: 1 behind the king and 1 in the back left corner
```

**With coarse positions.** Team A is attacking, so the punishment kubbs were placed in Team B's
half. The note becomes data, and has to say whose left it means, which the note never did:

```
9. a:7I2R2P@2b0@0b3 d:3F d:2F a:F a:- y:F c:B
```

**With precise positions**, as a program would write a turn (made up for illustration). Team B
attacks into Team A's half from an advantage line set by a kubb left standing in its own half:

```
4. k:2I@1.88a0.95@2.40a1.10 A@3.12b1.63 s:2F@1.88a0.95@2.40a1.10 s:- k:B@2.50a4.00 k:- s:- k:-
```

Coarsened, the same turn is `k:2I@1a0@2a1 A@3b1 s:2F@1a0@2a1 s:- k:B@2a3 k:- s:- k:-`.

**What the engine writes today, and the same turn in notation 2** (from the engine's own notes):

```
3. m:2I (@ 4.39,4.61 4.34,5.21) m:F (@ 4.39,4.61) a:B (@ 1.50,8.00)
3. m:2I@4.39b0.61@4.34b1.21 m:F@4.39b0.61 a:B@1.50b4.00
```

## Three layers

1. **Syntax**: the grammar. Is this well formed? Includes position ranges and one position too
   many for its letter.
2. **Counting**: the reader, `kubb.js`. Kubbs standing, who won, the statistics, and warnings a
   reader can give without knowing the rules of kubb: turns misnumbered, a position on the wrong
   side for the turn, more positions than kubbs thrown.
3. **Legality**: could this game happen? The engine's, and not in this repository.

**The conformance suite** (stage two) is what makes the grammar a standard. It would hold:

- every archived game with the parse and the results it gives today;
- files that are valid, each with its expected parse as JSON: lenient sheets, canonical games,
  coarse and precise positions;
- files that must be rejected, each with the line and column of the error;
- pairs of a lenient file and its canonical form;
- a manifest naming the notation number and the edition.

Any parser can be run against it. The engine would run it over everything it writes, and check
that making its output canonical changes nothing.

## Jamie's open questions

1. **Depth direction.** Keep depth from the centre line. Do not reconcile by turning the axis:
   retire the number on `A` from the canonical form and give the line as the position of the
   kubb that sets it. `2A` stays readable in the lenient form.
2. **Which stake.** The centre-line stake on Team A's left as Team A faces the king. It is fixed
   because the teams and their baselines are fixed for a game. Sides are `a` and `b`, always
   written.
3. **Lands or stands.** Stands, when the batons are thrown: it is what a scorer sees, what the
   batons face, what sets an advantage line, and the only meaning that fits a punishment kubb or
   a toppled kubb. Where it lay is an optional, provisional extra for programs.
4. **Whole number against decimal.** A whole number is the one-metre cell; two decimals are a
   point; drop the decimals to coarsen, with the far edges in the last cell.
5. **Syntax.** Its own: `@` joined to the letter it describes. Old `(@ ...)` is a plain comment
   in the lenient form and not allowed in the canonical one.
6. **On paper.** `@`, column, half, row: four characters a kubb, and they parse as written.

## Issue 5, requirement by requirement

| | The engine asked for | Answer |
|---|---|---|
| 1 | Positions the grammar parses and checks | **Met.** Positions are grammar. Out of range, malformed, misplaced and one too many are errors. |
| 2 | A canonical form with one spelling | **Met.** See the table above. Positions have one spelling in both forms. |
| 3 | A rule for whole number against decimal | **Met**, as the engine preferred: cell and point, with coarsening defined. |
| 4 | Where a kubb stands when the batons are thrown, punishment kubbs included | **Met**, and punishment kubbs are told apart, which today's list cannot do. |
| 5 | A conformance suite | **Met in design**; built in stage two. |
| 6 | A syntax that is not `(@ ...)` | **Met.** `@` joined to the token. Old files read as inert comments. |
| 7 | Where a kubb lay, and which way | **Met differently, provisional.** Two end points in place of a point and an angle. Needs the engine's maintainer to say whether that is what the engine can write. |
| 8 | Where a baton thrower stood | **Met.** `^` and an across value. |
| 9 | The advantage line on the depth axis | **Met differently.** Not a depth on `A`, but the position of the kubb that sets the line; the canonical form drops the number. |
| | No corner origin | **Agreed.** None. |
| | No legality in the grammar | **Agreed.** None. |

Two things the engine would change that it did not ask for: it writes `0I` when it knows no kubbs
were thrown (today it writes no token), and it caps positions per letter (today it caps a token
at `I + R + P + Q + N`, which counts a rethrown kubb twice).

## Discrepancies found

### Where the brief does not match the code

- **The parser the engine runs is not this repository's.** The copies vendored into kubb-engine
  and playdate-kubb on 2026-11-16 parse `(@ ...)` as positions: decimals, chess-style squares
  `a1` to `e8`, and `^` for the thrower, all in the corner frame, with whole numbers read as
  points. `kubb.js` there warns on a position off the pitch or one too many. None of that is in
  this repository's `master`, in its history, or in the thingelstad.xyz gadget's copy: here
  `(@ ...)` is an ordinary comment. So "the grammar reads these as comments, so nothing checks
  them" is true of `master` and not of what the engine tests against. The source grammar for
  that version is not in this repository. Notation 2 replaces it either way, but the engine's
  next sync will remove a feature its notation gate relies on.
- **The engine does have a reader**, `core/gamefile.lua`, a small one for its games list. It
  deletes parenthesised comments and reads tokens by pattern, so stage three touches it.
- **The archive is not as handwritten.** `tools/wiki2kubb.py` normalised it. In the 149 games the
  grammar accepts there is no missing colon, no lowercase action, no comma or slash, no
  parenthesised comment, no unnumbered turn, no `2A` or `BA`, and no `Y`, `N`, `W`, `G`, `E` or
  `!`. The lenient form's looser spellings are kept for the published page and for paper, not
  for the archive.

### The published page (planetkubb.com/notation, read 2026-11-21; it matches the copy in `sources/`)

Each of the four known problems is confirmed.

1. **`Q` for the accidental king hit.** The example is `5. i - - Q X X X`. The page's table makes
   `Q` a rescue and `E` the illegal king hit. The grammar rejects the line. `kubb.js` drops the
   `Q` with a warning and the game never ends. This repository's own notation page already
   prints it with `E`.
2. **Comments.** The table lists `(...)` and has no row for `#`; every example uses `#`. The
   parser takes both and they are different things: a comment anywhere, and a note to the end of
   the line.
3. **`BA` and `MA`** are in turns 6, 9 and 18 of the sample game and are not defined on the page
   (the 2012 wiki page defined them, with `CA`). The grammar and `kubb.js` accept all three. No
   archived game uses them.
4. **Player and action collisions** when the colon is left out are real:
   - `aF` is player a toppling a field kubb; `a F` is an advantage line and then a field kubb.
   - `fB` is player f and a base kubb; `fb`, `Fb` and `FB` are a field kubb and a base kubb.
   - `bA` is the 2012 `BA` marker to the grammar and player b's advantage line to `kubb.js`.
   - `iI` is player i throwing one kubb.

More, found on the way:

5. "Only F and B have a number applied to them", but the table gives counts to `I R P Y Q N A`.
6. The advantage number is "rounded to the nearest integer"; the engine rounds down.
7. "An advantage line on the baseline is 4A" contradicts the page's own `0A` (already settled in
   `AGENTS.md`: `4A` is the centre line).
8. `N` and `A` have "no default"; the grammar reads a bare `N` as one.
9. The table's only separator is a space; the wiki also allowed a comma and a slash, and the
   grammar accepts all three.
10. A player is "any set of letters"; the grammar also allows `_`, which the archive and the
    engine both use.
11. `!` is gone from the page's table (it is `E` now); the grammar and `kubb.js` still read it.
12. The sample game writes `j:` for kubbs thrown in by the player it otherwise calls `jt`.
13. The page links scoresheet v10; v11 is current.
14. The header example writes dates as `1/20/2012 1:23 pm`; the archive writes
    `2012-01-20 13:23`.

### The grammar against `kubb.js`

`npm test` compares them on the archive, where they agree. Away from the archive they differ:

| Input | Grammar | `kubb.js` |
|---|---|---|
| `jtb`, `bb` | rejects | player jt, base kubb |
| `EB` | rejects | player e, base kubb |
| `bA` | the `BA` marker | player b, advantage |
| `b:A`, `a:A` | rejects | advantage with a player |
| `JT:F` | player `JT` | player `jt` |
| `2I F (a (nested) one) F` | rejects | reads it |
| `12F`, `6N` | rejects (counts stop at 10, `N` at 5) | reads them |
| `0F` | a hit of no kubbs | a miss |
| `2I F - 3A F` | rejects | reads it, warns |
| `2I F ; F` | rejects | drops the `;`, warns |

Both read `1 2I F` as kubbs `1` and `2I` with no turn number: a turn number without its period
is silently a count. Stage two would settle each of these in the conformance suite. My proposal: the grammar's reading is
the notation, and `kubb.js` reports the rest as repairs it made (as it does for `F-`), so that a
repair is never mistaken for valid notation.

### What the engine writes

- Positions in the corner frame, as a comment, uncapped per letter (above).
- `nA` rounded down, where the page says nearest.
- No token when no kubbs were thrown, where the archive writes `0I` (165 times).
- No player on a throw by a one-player team, and initials otherwise. Both are valid canonical
  form.

## Needs deciding before stage two

1. **The position syntax**: `@`, across, side, depth, joined to the letter it describes. This is
   the part hardest to change later.
2. **The side is always written**, never implied by the turn.
3. **The canonical form drops the number on `A`**, and an advantage line's place is the position
   of its kubb.
4. **The extras**: include `^` now and `~` as provisional, or leave both for a later edition.
   The engine's maintainer should say whether two end points suit what the engine knows.
5. **The edition name and tag**: `2026.11` and `v2-2026.11` as described, named when tagged.
6. **Where the grammar and `kubb.js` differ, the grammar wins** and `kubb.js` reports repairs.
7. **The positions grammar the engine vendors**: confirm it is dropped, not restored. And the
   thingelstad.xyz gadget will need its sync when stage two changes the grammar, which is outside
   this repository.
