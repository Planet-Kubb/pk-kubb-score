# Planet Kubb Notation 2

Edition 2026.11.

Planet Kubb Notation records a game of kubb as plain text: every kubb thrown in and every baton,
one line a turn, short enough to write at the side of the pitch. Notation 2 keeps all of that and
adds two things: a canonical form that programs write, and positions on the pitch.

This document says what the notation means. Three things together are the standard:

- this document, for meaning;
- the grammar, `grammar/planet-kubb-notation.peggy`, for what is well formed;
- the conformance suite, `conformance/`, for what a parser must accept, refuse and conclude.

Where they disagree, the grammar and the suite win, and this document has a bug.

The notation is independent of any program. `docs/notation-v2-proposal.md` is the record of how
it was designed and why.

## Versions

- A file says which notation it is in with a header: `[Notation "2"]`. The number changes only
  when files that were valid stop being valid or change meaning. A file with no `Notation`
  header is read in the lenient form, which reads notation 1 as it always was.
- A parser refuses a file whose `Notation` it does not know.
- This document has a dated edition, year and month. A later edition of notation 2 may change
  wording, add conformance cases, or add optional lines. A canonical file valid under one
  edition is valid, with the same meaning, under every later one. The edition is not written in
  game files.
- The tag a client pins is `v2-` and the edition: `v2-2026.11`.

## Two forms

**The lenient form** is for sheets typed in from paper. It is everything notation 1 allowed,
plus position lines. It is the grammar's `Game` rule.

**The canonical form** is one spelling of each thing, so that two programs that record the same
game the same way write the same bytes. It is the grammar's `CanonicalGame` rule. Every
canonical file is a lenient file with the same reading.

Any lenient file can be written in the canonical form unless a turn's position lines disagree
with each other or a count is over the canonical limit. Writing it never merges, splits or
reorders the tokens of a turn line and never invents data. `site/assets/canonical.js` does it.

## A file

A file is headers and then turns.

```
[Notation "2"]
[Opening "2-4-6"]
[Team A "Ringers"]
[Team B "Kubbitz"]

1. j:B m:-
2. k:I k:F s:B s:B k:-
@a 2,1
3. j:3I j:2F m:F j:B m:- j:- m:-
@b 3,1 2x4,0
4. k:4IRP s:2F k:F s:- k:- s:- k:-
@a 2x3,0 4,1 1,3p
5. j:3I A j:3F m:B j:B m:B j:- m:K
@a 4,1s
@b 3x4,0
```

### Headers

A header is `[Key "value"]`, on a line of its own, before the turns. Inside a value `\"` is a
quote and `\\` is a backslash. A writer may use any key.

The notation defines these keys. In the canonical form they come in this order, after
`Notation`, and any other key comes after them in code-point order.

| Key | Meaning |
|---|---|
| `Notation` | `2`. The first header of a canonical file. |
| `Event`, `Location` | Where the game was played. |
| `Start`, `Event date`, `End`, `Duration` | When. `YYYY-MM-DD HH:MM`, or the date alone. |
| `Surface` | What it was played on. |
| `Rules` | The rule set, in words. |
| `Base kubbs` | The base kubbs each side starts with. 5 when absent. |
| `Batons` | The batons in a full turn. 6 when absent. |
| `Opening` | The batons in the opening turns, in order, joined by hyphens: `2-4-6` gives the first turn two and the second four. Later turns have `Batons`. Six from the start is `6`. When absent no opening is assumed, and any turn may have up to `Batons`. |
| `Team A`, `Team B` | The teams' names. |
| `Team A Players`, `Team B Players` | `Name (id), Name (id)`: the player ids used in the turns. |
| `First` | `Team A` or `Team B`: who threw first. |
| `Win` | `Team A` or `Team B`. |
| `Scored by`, `Entered by`, `Video`, `Player note`, `Video offset`, `Stats`, `Scoresheet`, `Source` | As the archive uses them. |

A program's own keys are kept as written. An edition will only ever define keys made of letters
and spaces, so a key with any other character in it (`Engine:seed`) is the writer's for good.

### A turn line

```
n. [player:]KUBBS [A] [player:]BATON [player:]BATON ... # note
```

The teams take turns, starting with `First`. A turn line has, in order: the turn number, the
kubbs thrown in, the advantage line if there is one, a token for each baton, and a note.

**Players.** A token may start with the id of who threw: `jt:2F`.

**Kubbs thrown in.** A count and a code, run together: `7I2R2P`.

| Code | Meaning |
|---|---|
| `I` | kubbs thrown in |
| `R` | kubbs thrown a second time |
| `P` | punishment kubbs: thrown out twice and placed by the other team |
| `Y` | rescue attempts that failed |
| `Q` | kubbs rescued |
| `N` | neighbours (provisional) |
| `E` | at the end: a kubb being thrown in knocked the king over, and the throwing team loses |

`0I` says no kubbs were thrown. A turn line with no kubbs token says the scorer did not record
them.

**The advantage line.** `A`: the batons were thrown from an advantage line. Where the line runs
is on the pitch line for the thrower's own half.

**Batons.** One token a baton.

| Token | Meaning |
|---|---|
| `-` | a miss |
| `F`, `3F` | field kubbs felled |
| `B`, `2B` | base kubbs felled |
| `2FB` | field kubbs and then base kubbs with one baton |
| `3FE` | a felled kubb knocked the king over: the throwing team loses |
| `K` | the king: the throwing team wins |
| `=` | a throw at the king that missed |
| `E` | the baton knocked the king over too early: the throwing team loses |
| `X` | not thrown |
| `Z` | an illegal throw |
| `W` | the game was called for the throwing team |
| `G` | the throwing team resigned |

**The note.** Everything after `#`.

### What the lenient form also reads

A missing colon when the player is lowercase and the action starts with a capital, a digit or a
symbol (`jtB`); lowercase actions (`2f`); a player in capitals with a colon (`JT:F`, the same
player as `jt`); commas and slashes between tokens; comments in parentheses, anywhere; a bare
number for kubbs thrown in (`3`); a written count of one (`1F`); kubb codes in any order
(`7IQ2R`); `!` for `E`; a number of metres from the baseline on the advantage line (`2A`), and
the 2012 markers `BA`, `MA` and `CA`; turns with no number; blank lines and lines that are only
a `#` note; a file with no headers; any line ending.

### What the canonical form requires

| | Rule |
|---|---|
| File | UTF-8, no byte-order mark, lines ending in a line feed, the last line too. |
| Headers | One space between key and value. `[Notation "2"]` first, then the order above. No key twice. One blank line after the headers when there are turns. |
| Turn line | `n. `, tokens with one space between them, then an optional ` # note` with no space after it. Turns numbered from 1, none skipped. No blank lines, comment lines or comments in parentheses. |
| Players | Lowercase letters and `_`, with the colon. |
| Counts | 2 to 10 are written (`N` to 5) and one never is. Zero only as `0I`. |
| Kubbs thrown in | Codes in the order `I R P Y Q N`, each at most once, then `E`. |
| Advantage | `A`, with no number. |
| Batons | As the table above: uppercase, `F` before `B`, no `!`. |
| Position lines | As below. |

## The pitch frame

```
                 Team B's baseline
        +----+----+----+----+----+   depth 4
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 3
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 2      half b
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 1
        |    |    |    |    |    |
 origin O----+----+--K-+----+----+   depth 0      the centre line
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 1
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 2      half a
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 3
        |    |    |    |    |    |
        +----+----+----+----+----+   depth 4
 across 0    1    2    3    4    5
                 Team A's baseline
```

- **The origin** is the centre-line stake on Team A's left, as Team A stands on its own baseline
  facing the king. It does not move during a game.
- **Across** is metres from that stake along the centre line, 0 to 5. The king is at 2.5.
- **Depth** is metres from the centre line toward a baseline, 0 to 4, the same in both halves.
- **The half** is `a` for Team A's and `b` for Team B's. A piece exactly on the centre line is in
  the half it is in play for.
- The frame is the 5 by 8 metre pitch. A game on another pitch can be scored, but this edition
  gives it no positions.

A position is across, a comma, depth.

- **A cell** is one metre square, in whole numbers: `4,0`. Across cell 2 covers 2 up to but not
  including 3. There are five cells across (0 to 4) and four deep (0 to 3).
- **A point** has exactly two decimals in each number: `4.48,0.11`. Across runs `0.00` to
  `5.00` and depth `0.00` to `4.00`.
- **A point's cell** is the point with its decimals dropped. The far edges belong to the last
  cell: across `5.00` is in cell 4, and depth `4.00` is in cell 3. A base kubb stands at depth
  `4.00`, so it is in depth cell 3.
- **Writing a point**: round to the nearest centimetre, and a value exactly half way goes to the
  even centimetre (`1.125` is `1.12`, `1.375` is `1.38`). A zero never has a minus sign.
- A cell is an area. A program may draw it at its centre but must not write that centre back as
  a point.

## Position lines

Position lines sit under their turn line. Each starts with a mark, which says what question the
line answers, and the half it describes. A file with no position lines is complete.

| Line | The question |
|---|---|
| `@a` `@b` | **Pitch line.** Where does each field kubb in this half stand when the first baton is thrown? |
| `~a` `~b` | **Lay line.** Where did each kubb thrown in lie before it was raised? |
| `^a` `^b` | **Stance line.** Where was each baton thrown from? |
| `*a` `*b` | **Felled line.** Which kubbs did each baton fell? |

A line is all cells or all points. Lay and stance lines are always points.

### The pitch line

```
9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
@b 5x4,0 0,3p 2,0p
```

- It lists every field kubb standing in that half when the first baton is thrown. It is the
  whole half or it is left out, and a half with no field kubbs has no line. Base kubbs are not
  on it.
- Kubbs that share a cell are a count: `5x4,0`. Points take no count.
- A letter after an entry says how the kubb came to be there. No letter: thrown in this turn.
  `p`: placed this turn as a punishment kubb. `s`: standing since an earlier turn.
- A turn can have a pitch line for each half. Kubbs are thrown into the half under attack. The
  thrower's own half holds the kubbs the other team left standing, all marked `s`, and the
  advantage line runs through the one with the least depth.
- The order of entries means nothing. The canonical order is `s` entries, then unmarked, then
  `p`, each group by across and then by depth.

### The lay line

```
~b 4.59,0.06/4.63,-0.08 4.94,0.13/5.08,0.17
```

One entry for each unmarked entry on the same half's pitch line, in the same order. That pitch
line must be there and in points. An entry is the two ends of the lying kubb, and the first is
the end it was stood up on.

An end may lie up to 0.20 m outside the half: across `-0.20` to `5.20`, depth `-0.20` to `4.20`.
A negative depth is wood over the centre line. This is the only place the notation has a minus
sign.

### The stance line

```
^a 4.20,4.00 4.20,4.00 - 1.40,4.25
```

One word for each baton token on the turn line, in order: the point the baton was thrown from,
in the thrower's own half, or `-` when it was not recorded. Across is `0.00` to `5.00`. Depth is
`0.00` to `9.99`: the baseline is depth `4.00`, and a thrower may stand behind it.

### The felled line

```
*b 4.48,0.11+4.52,0.34 - 1.50,4.00
*b 3x4,0 2x4,0 2,0 - 0,3 1,3
```

One word for each baton token, in order: where each kubb that baton felled stood, joined by `+`,
or `-`. Field kubbs come first and base kubbs after, as in the token. A word gives all of its
token's kubbs or is `-`. The king has no position.

### In the canonical form

Position lines follow their turn line with nothing between. Each kind appears at most once for a
half, in the order `@a @b ~a ~b ^a ^b *a *b`. There are no spaces before the mark and one space
between entries. Pitch entries are in the canonical order, and in a felled word each group is in
order of across and then depth. A count of one is not written, and a cell is written once, with
a count.

### Agreement within a turn

A turn's lines must agree with each other:

- the entries marked `p` number the turn's `P`;
- a lay line has one entry for each unmarked entry on its pitch line;
- a stance line and a felled line have one word for each baton token;
- a felled word is `-` or has as many kubbs as its token's `F` and `B` together.

The canonical form refuses a turn that breaks one of these. The lenient form reads it and
reports it.

## Three layers

1. **Syntax**: the grammar. Is the file well formed, and do each turn's lines agree?
2. **Counting**: the reader, `site/assets/kubb.js`. Kubbs standing, who won, statistics. It also
   reports what follows from the game so far without judging the play: turns misnumbered, a
   pitch line whose kubbs do not number the field kubbs standing in that half, a line in the
   wrong half for the turn, a felled kubb that is not on the pitch line. It is tolerant: it reads
   what it can and warns, and wherever it reads something the grammar refuses, it says so.
3. **Legality**: could this game happen under the rules of kubb? That is not in the notation,
   and not in this repository.

## Notation 1

A notation 1 file is a lenient notation 2 file, with the same reading. Three things differ:

- A parenthesised comment that starts with `@` was how one program recorded positions, in
  another frame. It is a comment. It is never read as positions.
- A bare `N` is one neighbour. The notation 1 grammar read it as no number at all.
- A player written in capitals with a colon is the same player in lowercase.
