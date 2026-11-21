# Planet Kubb Notation 2: design proposal

Status: proposal for review, 2026-11-21. Stage one of three. Nothing here is built. Stage two
(the grammar, the canonical-form rules and the conformance suite) starts when this is approved.
Stage three (the Kubb Engine writing notation 2) belongs to the engine's maintainer, against a
tagged release of this repository.

It answers [issue 5](https://github.com/Planet-Kubb/pk-kubb-score/issues/5), the engine's
requirements. Comment on any line.

**Revised 2026-11-21 after review.** The first draft wrote positions inside the turn line's
tokens (`7I2R2P@2b0@0b3`). Jamie found the kubbs-thrown-in word carrying too much, and the
engine's maintainer suggested a line of positions under the turn line. This draft takes that
idea and builds on it. The turn line is now notation 1's, untouched, and positions are on lines
of their own. The frame, cells and points, the two forms, the version header and the discrepancy
lists are as they were. [What changed](#what-changed-in-this-revision) lists each answer to the
review.

## The proposal in short

- **Two forms.** The *lenient* form is everything the grammar accepts today, plus positions. Every
  old sheet keeps its meaning. The *canonical* form is one spelling of each thing, for programs to
  write and compare. Most of the archive is already written that way: in 116 of the 150 games
  every turn line is canonical as it stands (1,225 of 1,335 turn lines), and nearly all the rest
  differ by a written `1` (`4I1R` for `4IR`).
- **The turn line says what happened, and does not change.** A scorer who writes nothing else has
  recorded the game.
- **Positions go on lines of their own under the turn line**, one question to a line. The line
  people write is the pitch line: `@b 5x40 03p 20p` is Team B's half with five kubbs in cell 40
  and a punishment kubb in each of cells 03 and 20. Three more kinds of line are for programs:
  where each kubb lay, where each thrower stood, and which kubbs each baton felled.
- **A cell is two digits, across then depth. A point is two numbers with two decimals each.**
  Dropping the decimals of a point gives its cell.
- **One frame for the whole game**: across from the centre-line stake on Team A's left, 0 to 5;
  depth from the centre line, 0 to 4; `a` or `b` for the half, written once at the start of each
  position line.
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

The lenient grammar is today's grammar with two additions: position lines and the `[Notation]`
header. Nothing is taken away, so every file that parses today parses the same way. That is the
guard for the archive: stage two snapshots what the grammar and `kubb.js` return for all 150
games before any change, and the suite fails if any of it moves.

Lenient is for sheets typed in from paper. It still allows what the canonical form does not: a
missing colon (`jtB`), lowercase actions (`2f`), commas and slashes between actions, comments in
parentheses, a bare number for kubbs thrown in (`3`), a written count of one (`1F`), kubb codes
in any order (`7IQ2R`), `!` for an illegal king hit, the advantage forms `2A`, `BA`, `MA` and
`CA`, missing turn numbers, and a file with no headers. On a position line it allows spaces
before the mark, entries in any order, and a cell written out several times in place of a count.

### Canonical

One spelling of everything. Two writers that record the same game the same way produce the same
bytes, and the canonical form of a canonical file is itself.

| | Canonical rule |
|---|---|
| File | UTF-8, no byte-order mark, `\n` line ends, one at the end of the file. |
| Headers | `[Key "value"]`, one per line, one space between key and value, no key twice. `[Notation "2"]` is the first; the rest stay in the writer's order. A key the spec does not define is kept as written. Inside a value only `\"` and `\\` are escapes. Then one blank line. |
| Turn line | `n. `, then tokens with one space between them, then an optional ` # note`. Turns are numbered from 1 with none skipped. No blank lines or comment lines between turns. |
| Player | `id:` before the action, with the colon, lowercase letters and `_`. A token may have no player. |
| Counts | 2 to 10 are written; a count of one is not (`F`, never `1F`). Zero appears only as `0I`. |
| Kubbs thrown in | Codes in the order `I R P Y Q N`, then `E`. `0I` when the scorer knows none were thrown; no token when the inkast was not recorded. The reader already treats those two differently. |
| Advantage | `A`, after the kubbs and before the batons. No `2A`, `BA`, `MA`, `CA`. |
| Batons | `-`, `F`, `B` and their counts with `F` before `B`, a trailing `E` for a kubb that took the king, `K`, `=`, `X`, `E`, `Z`, `W`, `G`. No `!`. |
| Position lines | Straight after their turn line, each kind at most once for a half, in the order `@a @b ~a ~b ^a ^b *a *b`. No spaces before the mark, one space between entries, no note. Entries in the order given below. |
| Comments | Only the note: ` # text` at the end of a turn line. No parentheses. |

Uppercase actions, lowercase players and the colon together remove every collision between a
player and an action letter (see the discrepancies).

Making a file canonical works token by token on a turn line. It never merges, splits or reorders
tokens, and it never invents data. A comment in parentheses moves into the note. Two things
cannot be carried and are reported: the number in `2A` and the 2012 markers `BA`, `MA`, `CA`. No
archived game uses either (every advantage line in the archive is a bare `A`). On a pitch line,
where the order of entries carries no meaning, it sorts them and gathers a repeated cell into a
count.

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

## Headers for the rules of the game

The reader counts on five base kubbs a side and six batons a turn. Games are played otherwise: a
kids' game with three base kubbs, or an opening where the first turns get fewer batons. Three
headers say so. Their names follow the archive's (`Team A Players`, `Event date`).

| Header | It means | When it is absent |
|---|---|---|
| `[Base kubbs "3"]` | the base kubbs each side starts with | 5 |
| `[Batons "6"]` | the batons in a full turn | 6 |
| `[Opening "2-4-6"]` | the batons in the opening turns, in order: here two on the first turn and four on the second. Later turns have `Batons`. Six from the start is `[Opening "6"]`. | no opening is assumed, and any turn may have up to `Batons`. That is what the reader does today. |

Other rules change nothing the reader counts, so they need no header of their own: a forward
throwing line shows on the stance line, and a game without punishment kubbs has no `P`. The
free-text `[Rules]` header the engine already writes is the place to name the rule set.

**A program's own headers.** The canonical form keeps any header key it does not know, as
written. An edition will only ever define keys made of letters and spaces, so a key with any
other character in it, such as `Engine:seed`, is the writer's for good.

The frame is the 5 by 8 metre pitch. A game on a smaller pitch can be scored, but this edition
gives it no positions.

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
  (`0` to `4`) and 4 deep on each side (`0` to `3`). A cell is written as its two digits, across
  then depth, like a map reference: `40` is the cell at across 4 beside the centre line, and `03`
  is the back corner at across 0. The king stands in the middle of across cell 2, on the line
  between cell `20` of one half and cell `20` of the other.
- A **number with two decimals is a point**, written across, a comma, depth: `1.32,1.87`. Always
  exactly two decimals, in both forms. Across runs `0.00` to `5.00`, depth `0.00` to `4.00`.
- **Rounding**: a writer rounds to the nearest centimetre, and a value exactly half way goes to
  the even centimetre (`1.125` is written `1.12`, `1.375` is `1.38`). That is what C's and Lua's
  `%.2f` give. JavaScript's `toFixed` gives `1.13` for the first, so a JavaScript writer cannot
  use it as it stands. A zero never has a minus sign.
- **Coarsening**: a point's cell is the point with its decimals and its comma dropped, so
  `4.61,0.12` is in cell `40`. The two far edges belong to the last cell: across `5.00` is in
  cell 4 and depth `4.00` is in cell 3. So a base kubb, which stands on its baseline at depth
  `4.00`, is in depth cell 3. Coarsening works on the written point, so a file's cells depend on
  the file alone.
- A position line is one or the other: all cells or all points.
- Two positions **agree at cell level** when they have the same half and the same cell after
  coarsening. That is how a simulated game is compared with a hand-scored one.
- A cell is an area. A program that needs somewhere to draw it may use its centre, but must not
  write that centre back as a point.

The grammar enforces the ranges. `50`, `24`, `1.3,2.0` and `6.20,1.00` are errors on a pitch
line.

## Position lines

A turn is its turn line and then, if anyone recorded them, position lines. A position line
starts with a mark that says which question it answers and the half it describes. Each line
answers one question.

| Line | The question | Who writes it | Cells or points |
|---|---|---|---|
| `@a` `@b` | **Pitch line.** Where does each field kubb in this half stand when the first baton is thrown? | people and programs | either |
| `~a` `~b` | **Lay line.** Where did each kubb thrown in lie before it was raised? | programs | points |
| `^a` `^b` | **Stance line.** Where was each baton thrown from? | programs | points |
| `*a` `*b` | **Felled line.** Which kubbs did each baton fell? | programs, or a keen scorer | either |

```
Turn        = TurnLine (PitchLine / LayLine / StanceLine / FelledLine)*
PitchLine   = "@" Half (" " Standing)+
Standing    = (Count "x")? Cell Mark?  /  Point Mark?
Mark        = "s" / "p"
LayLine     = "~" Half (" " WidePoint "/" WidePoint)+
StanceLine  = "^" Half (" " (StancePoint / "-"))+
FelledLine  = "*" Half (" " (Felled ("+" Felled)* / "-"))+
Felled      = (Count "x")? Cell  /  Point
Half        = "a" / "b"
Cell        = [0-4] [0-3]
Point       = Across "," Depth
Across      = [0-4] "." [0-9] [0-9]  /  "5.00"
Depth       = [0-3] "." [0-9] [0-9]  /  "4.00"
```

A position is spelled one way wherever it appears: a cell as two digits, a point as two numbers
and a comma. The half is never part of a position. It is written once, at the start of the line,
and it is always written: no line's half is left to be worked out from whose turn it is, because
16 archived games had that wrong on the wiki.

A reader that wants only what happened skips every line that starts with `@`, `~`, `^` or `*`
and reads the rest exactly as notation 1.

### The pitch line

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 5x40 03p 20p
```

- It lists **every field kubb standing in that half** when the first baton is thrown: the kubbs
  thrown in this turn, the punishment kubbs, and any left standing from earlier turns. It is what
  the batons face. Write the whole half or leave the line out; a half with no field kubbs has no
  line.
- **Kubbs that share a cell are a count**: `5x40` is five kubbs in cell 40. Counts run from 2 to
  10, and a count of one is not written. Points take no count, since each kubb has its own.
- **A letter after an entry says how the kubb came to be there.** No letter: thrown in this
  turn. `p`: placed this turn as a punishment kubb. `s`: standing since an earlier turn. Most
  entries on most lines have no letter.
- **A turn can have two pitch lines**, one for each half. The half under attack holds the
  targets. The attacker's own half holds the kubbs the other team left standing, all marked `s`.
- **Base kubbs are not on it.** They stand on their baseline and the reader counts them. Which
  base kubb a baton took is on the felled line.
- **The order of entries means nothing.** The canonical order is `s` entries, then unmarked,
  then `p`, each group by across and then by depth.

The pitch line and the turn line check each other. In the example the turn line says seven kubbs
were thrown and two of them became punishment kubbs; the pitch line shows five thrown kubbs and
two marked `p`.

### The advantage line

`2A` counts metres from the attacker's baseline; a position counts depth from the centre line.
They run in opposite directions because they measure different things: how far the throwing line
moved forward, and where a piece is. I would not turn the depth axis round to match. The centre
line and the king are what a kubb's place is judged against, both halves then read alike, and
the origin decision already puts depth 0 at the king.

Instead the canonical form stops writing the number. An advantage line is a bare `A` on the turn
line. Its place is on the pitch line for the attacker's own half: the line runs through the kubb
there with the least depth. In the turn below Team B throws from depth 1.63 in its own half, and
the old number is `4 - depth`, rounded down: `2A`.

```
4. k:2I A s:2F s:- k:B k:- s:- k:-
@a 1.88,0.95 2.40,1.10
@b 3.12,1.63s
```

The lenient form still reads `2A` with the meaning it has always had.

### The program lines

These three are finer than a person scores. They are optional, each stands alone, and a file
with only pitch lines is complete.

**The lay line, `~`.** One entry for each unmarked entry on the same half's pitch line, in the
same order, so the pitch line must be there and in points. An entry is the two ends of the lying
kubb with a `/` between them, and the first is the end it was stood up on.

```
~b 4.59,0.06/4.63,-0.08 4.94,0.13/5.08,0.17
```

An end may lie up to 0.20 m outside the half on any edge: across `-0.20` to `5.20`, depth
`-0.20` to `4.20`. A kubb is 0.15 m long, and the kubbs lying over a line are the ones whose
raise matters most. A negative depth is wood over the centre line. **This is the one place the
notation has a minus sign**, and it bends the decision that there are no negative numbers. I
think that is right: the decision was about where pieces stand, and every standing position is
still inside 0 to 5 and 0 to 4. The alternative is a mark that says "raised over a line" without
saying where the wood was, which hides the fact the line exists to record.

**The stance line, `^`.** One word for each baton token on the turn line, in order: the point the
baton was thrown from, or `-` when it was not recorded. The half is the thrower's own. Across is
`0.00` to `5.00`; depth is `0.00` to `9.99`, because a thrower may stand behind the baseline,
which is depth `4.00`.

```
^a 4.20,4.00 4.20,4.00 2.60,4.00 2.60,4.00 0.80,4.00 1.40,4.25
```

A stance always has both numbers. The review suggested an across value alone for "on the line".
I would not, because the reader would then have to know which line the thrower was entitled to
(the baseline, an advantage line, or a forward line in a kids' game), and that is the rules of
kubb, not notation.

**The felled line, `*`.** One word for each baton token, in order: where each kubb that baton
felled stood, joined by `+`, or `-`. Field kubbs come first and base kubbs after, as in the
token. A word gives all of its token's kubbs or is `-`. A base kubb stands at depth `4.00`. The
king has no position. In cells, kubbs from one cell take a count: `3x40`.

```
*b 4.48,0.11+4.52,0.34+4.63,0.22 4.60,0.03+4.97,0.14 2.50,0.35 - 0.40,3.80 1.50,4.00
```

### Agreement within a turn

The grammar checks each line. In the canonical form the parser also checks that a turn's lines
agree with each other, which needs nothing but the turn itself:

- each kind of line appears at most once for a half, in the canonical order;
- the entries marked `p` number the turn's `P`;
- a lay line has one entry for each unmarked entry on its pitch line, which is in points;
- a stance line and a felled line have one word for each baton token;
- a felled word is `-` or has as many positions as its token's `F` and `B` together.

A canonical file that breaks one of these is rejected. The lenient form reads the file and
reports them.

### Old `(@ ...)` positions, and old readers

Notation 2 has no `(@ ...)`. In the lenient form a parenthesised comment is a comment, so an old
engine file reads as it would with those comments deleted: they are inert, and never taken for
centre-line coordinates. In the canonical form parentheses are not allowed at all.

In the other direction, today's grammar rejects a position line at its first character (checked
for all four marks), so a notation 1 parser fails on a notation 2 file instead of misreading it.
Today's `kubb.js` is tolerant and does not fail: it takes a position line for an extra turn,
reads `03p` as three punishment kubbs, and hands every later turn to the wrong team. The grammar
is the gate, as it is now. Stage two replaces this repository's `kubb.js`, and the three places
that vendor it must sync before they are given a notation 2 file.

### What this costs

- A turn is no longer one line. A tool that works a line at a time has to keep a turn's lines
  together, and a position line means nothing without the turn line above it.
- On the stance and felled lines a word belongs to a baton by its place in the row, not by
  sitting beside it. The parser checks the count of words, which catches a slip but not a swap.
- When two players share the kubbs thrown in, the pitch line does not say whose kubb is whose.

## On paper

A scorer writes the turn line as they always have. To record the pitch they add a line under it:
`@`, the half, and two digits for each kubb or group of kubbs. "Five in the corner cell on the
centre line, a punishment kubb in the back corner and another behind the king" is
`@b 5x40 03p 20p`.
Nobody measures centimetres with a clipboard, so paper uses cells.

A future scoresheet can print a small 5 by 8 grid beside each turn, marked with the origin stake
and the two halves. The scorer puts a dot where each kubb stands, and typing the dots in is
reading off two digits a dot. The scoresheet is a separate piece of work.

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

**With coarse positions**, as a person would score it. Team A is attacking, so all seven kubbs
are in Team B's half. The sheet's note gives the two punishment kubbs' places; the five thrown
kubbs' cell is made up here to show a whole line. The note becomes data, and has to say whose
left it means, which the note never did:

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 5x40 03p 20p
```

**The same seven kubbs to the centimetre**, as a program would write them (made up for
illustration):

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 4.48,0.11 4.52,0.34 4.60,0.03 4.63,0.22 4.97,0.14 0.40,3.80p 2.50,0.35p
```

Dropping the decimals gives back `@b 5x40 03p 20p`.

**With every program line.** The third kubb lay over the centre line and the fifth over the
sideline. The last thrower stood a quarter of a metre behind the baseline:

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 4.48,0.11 4.52,0.34 4.60,0.03 4.63,0.22 4.97,0.14 0.40,3.80p 2.50,0.35p
~b 4.45,0.09/4.57,0.18 4.54,0.31/4.45,0.43 4.59,0.06/4.63,-0.08 4.61,0.19/4.70,0.31 4.94,0.13/5.08,0.17
^a 4.20,4.00 4.20,4.00 2.60,4.00 2.60,4.00 0.80,4.00 1.40,4.25
*b 4.48,0.11+4.52,0.34+4.63,0.22 4.60,0.03+4.97,0.14 2.50,0.35 - 0.40,3.80 1.50,4.00
```

Coarsened to cells, the pitch line and the felled line stay and the other two go:

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 5x40 03p 20p
*b 3x40 2x40 20 - 03 13
```

For comparison, the first draft wrote the pitch line's facts inside the turn line, as one word:

```
9. a:7I@4.48b0.11@4.52b0.34@4.60b0.03@4.63b0.22@4.97b0.142R2P@0.40b3.80@2.50b0.35 d:3F d:2F a:F a:- y:F c:B
```

**A turn from an advantage line** (made up). Team B attacks into Team A's half, throwing from the
kubb Team A left standing in Team B's half:

```
4. k:2I A s:2F s:- k:B k:- s:- k:-
@a 1.88,0.95 2.40,1.10
@b 3.12,1.63s
^b 2.10,1.63 2.10,1.63 2.50,1.63 2.50,1.63 2.10,1.63 2.50,1.63
*a 1.88,0.95+2.40,1.10 - 2.50,4.00 - - -
```

Coarsened, with the stance line gone:

```
4. k:2I A s:2F s:- k:B k:- s:- k:-
@a 10 21
@b 31s
*a 10+21 - 23 - - -
```

**What the engine writes today, and the same turn in notation 2** (from the engine's own notes):

```
3. m:2I (@ 4.39,4.61 4.34,5.21) m:F (@ 4.39,4.61) a:B (@ 1.50,8.00)
```

```
3. m:2I m:F a:B
@b 4.34,1.21 4.39,0.61
*b 4.39,0.61 1.50,4.00
```

## Three layers

1. **Syntax**: the grammar. Is this well formed? Includes position ranges and, in the canonical
   form, whether a turn's lines agree with each other.
2. **Counting**: the reader, `kubb.js`. Kubbs standing, who won, the statistics, and what a
   reader can report from the game so far without judging the play: turns misnumbered, a pitch
   line whose kubbs do not number the field kubbs the reader counts in that half, a line in the
   wrong half for the turn, a felled kubb that is not on the pitch line. It takes the base kubbs,
   the batons and the opening from the headers.
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
   retire the number on `A` from the canonical form and read the line off the pitch line for the
   attacker's own half, as the kubb there with the least depth. `2A` stays readable in the
   lenient form.
2. **Which stake.** The centre-line stake on Team A's left as Team A faces the king. It is fixed
   because the teams and their baselines are fixed for a game. Sides are `a` and `b`, always
   written, once a line.
3. **Lands or stands.** Stands, when the batons are thrown: it is what a scorer sees, what the
   batons face, what sets an advantage line, and the only meaning that fits a punishment kubb or
   a toppled kubb. That is the pitch line. Where it lay is the lay line, which only a program
   writes.
4. **Whole number against decimal.** A whole number is the one-metre cell, and a cell is two
   digits; two decimals are a point; drop the decimals to coarsen, with the far edges in the
   last cell.
5. **Syntax.** Its own: lines of positions under an unchanged turn line, each starting with a
   mark and the half. Old `(@ ...)` is a plain comment in the lenient form and not allowed in
   the canonical one.
6. **On paper.** The turn line as always, and under it `@`, the half and two digits a kubb. The
   marks parse as written.

## Issue 5, requirement by requirement

| | The engine asked for | Answer |
|---|---|---|
| 1 | Positions the grammar parses and checks | **Met.** Position lines are grammar. Out of range, malformed, and a turn whose lines disagree are errors. |
| 2 | A canonical form with one spelling | **Met.** See the table above. A position has one spelling wherever it appears. |
| 3 | A rule for whole number against decimal | **Met**, as the engine preferred: cell and point, with coarsening defined. |
| 4 | Where a kubb stands when the batons are thrown, punishment kubbs included | **Met**, on the pitch line. Punishment kubbs are marked, which today's list cannot do, and so are kubbs left from earlier turns. |
| 5 | A conformance suite | **Met in design**; built in stage two. |
| 6 | A syntax that is not `(@ ...)` | **Met.** Lines of their own. Old files read as inert comments. |
| 7 | Where a kubb lay, and which way | **Met differently.** The lay line: two end points in place of a point and an angle. The engine's maintainer has said it can write them. An end may lie a little off the half. |
| 8 | Where a baton thrower stood | **Met.** The stance line, with across and depth. |
| 9 | The advantage line on the depth axis | **Met differently.** Not a depth on `A`: the canonical form drops the number, and the line is the nearest kubb on the pitch line for the attacker's own half. |
| | No corner origin | **Agreed.** None. |
| | No legality in the grammar | **Agreed.** None. |

Three things the engine would change that it did not ask for. It writes `0I` when it knows no
kubbs were thrown (today it writes no token). It writes the whole half on a pitch line, kubbs
left from earlier turns included (today it writes only the kubbs thrown in). And a felled word
gives every kubb its baton felled or none (today it caps a token's positions at
`I + R + P + Q + N`, which counts a rethrown kubb twice).

## What changed in this revision

**Jamie's concern: the kubbs-thrown-in word carried too much.** Positions left the turn line.
They are on lines of their own, one question to a line, and the turn line is notation 1's.

It builds on the engine maintainer's suggested pitch line, and differs from it in these ways:

- The half is joined to the mark (`@b`, not `@ b:`), so the first two characters of a line say
  what it is.
- There can be a pitch line for each half. The attacker's own half holds the kubbs that set an
  advantage line, so the line no longer needs a position of its own on `A`.
- A kubb left from an earlier turn is marked `s`. A thrown kubb can knock one over and move it,
  so a reader cannot always tell old from new by comparing turns.
- Base kubbs are not on the pitch line.
- Where throwers stood and which kubbs fell are two lines, not one, each a row with one word a
  baton.

**The engine's three requests.**

1. *A lying kubb partly off the pitch.* An end on the lay line may be up to 0.20 m outside the
   half, with a minus sign when it has to. Nothing is clamped.
2. *A depth for where the thrower stood.* A stance is always across and depth, and may be behind
   the baseline. Not "across alone means on the line", for the reason given under the stance
   line.
3. *Headers for the rules, and the engine's own keys.* `Base kubbs`, `Batons` and `Opening`,
   with today's values when absent; unknown keys are kept as written, and a key with a
   character other than letters and spaces is safe from every future edition.

**Its smaller point, a value exactly between two centimetres:** it goes to the even one, and a
zero has no minus sign.

**Its two answers.** The engine can write a lying kubb's two ends, so the lay line is no longer
provisional. The positions grammar the engine vendors is dropped and not restored, which closes
a question the first draft asked.

**Found while checking the new syntax.** Today's `kubb.js` does not reject a position line: it
reads one as an extra turn (see "Old `(@ ...)` positions, and old readers").

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

- Positions in the corner frame, as a comment, capped by token and not by letter (above).
- `nA` rounded down, where the page says nearest.
- No token when no kubbs were thrown, where the archive writes `0I` (165 times).
- No player on a throw by a one-player team, and initials otherwise. Both are valid canonical
  form.

## Needs deciding before stage two

1. **Position lines under an unchanged turn line**, and their marks: `@` stands, `~` lay, `^`
   thrown from, `*` felled. This is the part hardest to change later.
2. **The pitch line is the whole half**: every field kubb, with no letter for a kubb thrown this
   turn, `p` for a punishment kubb and `s` for one left from an earlier turn.
3. **A cell is two digits and a point is two numbers with a comma**, the half written once at
   the start of the line and never left out.
4. **The canonical form drops the number on `A`**, and an advantage line's place is read off the
   pitch line for the attacker's own half.
5. **A minus sign on the lay line**, and only there, for wood that lies off the half. It bends
   the decision that the notation has no negative numbers.
6. **The three program lines** in the first edition, or the pitch line alone with the rest to
   follow. I would include all three: the engine already writes which kubbs a baton felled, in
   another form, and has said it can write the other two.
7. **The rule headers** `Base kubbs`, `Batons` and `Opening`, and the rule that keeps a
   program's own keys clear of future editions.
8. **The edition name and tag**: `2026.11` and `v2-2026.11` as described, named when tagged.
9. **Where the grammar and `kubb.js` differ, the grammar wins** and `kubb.js` reports repairs.

Outside this repository: the thingelstad.xyz gadget will need its sync when stage two changes
the grammar.
