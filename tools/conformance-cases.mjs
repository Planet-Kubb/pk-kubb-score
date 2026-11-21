// The inputs of the conformance suite. `node tools/conformance.mjs --write`
// runs them through this repository's grammar, canonical writer and reader and
// writes conformance/*.json with what each one gives. A changed expectation
// shows up in the diff of those files, and is reviewed there.
//
// A case is [name, text] unless noted.

const N2 = '[Notation "2"]\n\n';
const T9 = '1. a:7I2R2P d:3F d:2F a:F a:- y:F c:B\n';

// A short whole game, scored by a person: cells, a 2-4-6 opening, an
// advantage line on the last turn.
export const GAME = `[Notation "2"]
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
`;

// One turn as a program writes it: seven kubbs to the centimetre, one lying
// over the centre line and one over the sideline, a thrower behind the baseline.
export const PRECISE = `${N2}${T9}@b 4.48,0.11 4.52,0.34 4.60,0.03 4.63,0.22 4.97,0.14 0.40,3.80p 2.50,0.35p
~b 4.45,0.09/4.57,0.18 4.54,0.31/4.45,0.43 4.59,0.06/4.63,-0.08 4.61,0.19/4.70,0.31 4.94,0.13/5.08,0.17
^a 4.20,4.00 4.20,4.00 2.60,4.00 2.60,4.00 0.80,4.00 1.40,4.25
*b 4.48,0.11+4.52,0.34+4.63,0.22 4.60,0.03+4.97,0.14 2.50,0.35 - 0.40,3.80 1.50,4.00
`;

// Valid in the lenient form.
export const lenient = [
  ['perfect game, bare', 'B B B B B K'],
  ['perfect game, numbered with players and a note', '1. jt:B jt:B gv:B gv:B jt:B gv:K # Perfect game, Garrick takes the king!'],
  ['players without colons', '0 jtB jtB gvB gvB jtB gvK'],
  ['a 2012 sheet line without colons', '9. a7I2R2P d3F d2F aF a- yF cB # penalty kubbs: 1 behind the king and 1 in the back left corner'],
  ['lowercase actions', 'j:2i m:2iq j:3i4ri\n3i  3f b b = ='],
  ['commas, slashes and a comment', '5I2R2N 2F (lovely) 2F, F/B - Z'],
  ['advantage with a number', '2I 4A F F B - - B\n2I 0A F F B - - B'],
  ['the 2012 advantage markers', '6. d:I BA jf:- d:- d:- d:F jf:B jf:-\n9. j:2I MA jt:F jt:F g:B g:- g:- jt:B\nI CA F'],
  ['a bare number for kubbs thrown in', '7. 3 2F F - B B = # Missed king shot!'],
  ['kubb codes out of order and a written one', '7IQ2R 4I1R 1F'],
  ['a bare N is one', '2IN F\n2I2N F'],
  ['f and b as player or action', 'fB\nFB\nfb\naF\na F'],
  ['bA is the 2012 marker, not a player', 'I bA F'],
  ['a player in capitals is the same player', 'JT:F jt:F'],
  ['kubbs that took the king, and endings', '4IE\n6I 3fe X X X X X\n12. 5I F F 2F FB 2FB W\n3. G\n5. i - - E X X X\n2I F !'],
  ['headers, a blank line, a comment line', '[Event "Twin Cities Winter Tournament 2012"]\n[Temperature "13 F"]\n\n1. 0I B - - - - -\n# a comment line\n2. I F - - - - -\n'],
  ['a quote inside a header value', '[Note "She said \\"wow\\""]\n1. B'],
  ['a notation 1 header', '[Notation "1"]\n1. B'],
  ['the engine\'s old positions are comments', '3. m:2I (@ 4.39,4.61 4.34,5.21) m:F (@ 4.39,4.61) a:B (@ 1.50,8.00)'],
  ['a zero-kubb hit reads as a hit of none', '2I 0F F'],
  ['pitch line as a person types it', `${T9}  @B 4,0 2,0P 4,0 4,0 0,3p 4,0 4,0`],
  ['a written count of one, capitals', `${T9}@b 1X0,3P 5X4,0 1x2,0p`],
  ['position lines after a blank line and a comment line', `${T9}\n# where they stood\n@b 5x4,0 0,3p 2,0p\n\n*b 3x4,0 2x4,0 2,0 - 0,3 1,3\n2. B`],
  ['position lines in any order', `1. k:2I A s:2F s:- k:B\n*a 2.40,1.10+1.88,0.95 - 2.50,4.00\n@b 3.12,1.63s\n@a 2.40,1.10 1.88,0.95\n~a 2.36,1.03/2.42,1.17 1.80,0.93/1.94,0.98\n^b 2.10,1.63 2.10,1.63 -`],
  ['lines that disagree are read and reported', `${T9}@b 5x4,0 0,3p\n@b 1,1\n*b 3x4,0 - -\n^a 4.20,4.00\n~b 4.45,0.09/4.57,0.18`],
  ['a whole game', GAME],
  ['every line, to the centimetre', PRECISE],
];

// Valid in the canonical form. Each is also valid in the lenient form with
// the same reading, and is its own canonical form.
export const canonical = [
  ['a whole game', GAME],
  ['every line, to the centimetre', PRECISE],
  ['the same turn in cells', `${N2}${T9}@b 5x4,0 0,3p 2,0p\n*b 3x4,0 2x4,0 2,0 - 0,3 1,3\n`],
  ['a turn from an advantage line', `${N2}1. k:2I A s:2F s:- k:B k:- s:- k:-\n@a 1.88,0.95 2.40,1.10\n@b 3.12,1.63s\n^b 2.10,1.63 2.10,1.63 2.50,1.63 2.50,1.63 2.10,1.63 2.50,1.63\n*a 1.88,0.95+2.40,1.10 - 2.50,4.00 - - -\n`],
  ['the same in cells', `${N2}1. k:2I A s:2F s:- k:B k:- s:- k:-\n@a 1,0 2,1\n@b 3,1s\n*a 1,0+2,1 - 2,3 - - -\n`],
  ['headers only', '[Notation "2"]\n[Team A "Ringers"]\n'],
  ['the notation header alone', '[Notation "2"]\n'],
  ['every defined header, in order, then a writer\'s own', '[Notation "2"]\n[Event "Club night"]\n[Location "The park"]\n[Start "2026-11-21 13:23"]\n[Event date "2026-11-21"]\n[End "2026-11-21 13:51"]\n[Duration "28"]\n[Surface "Grass"]\n[Rules "U.S. Championship 4.0, 2-4-6"]\n[Base kubbs "5"]\n[Batons "6"]\n[Opening "2-4-6"]\n[Team A "Ringers"]\n[Team A Players "Ann Example (a), Dee Example (d)"]\n[Team B "Kubbitz"]\n[Team B Players "Kay Example (k)"]\n[First "Team A"]\n[Win "Team B"]\n[Scored by "A scorer"]\n[Entered by "A typist"]\n[Video "https://example.org/v"]\n[Player note "none"]\n[Video offset "12"]\n[Stats "Yes"]\n[Scoresheet "v11"]\n[Source "https://example.org/g"]\n[Engine:level A "Pro"]\n[Engine:seed "7"]\n[Zeta "z"]\n\n1. B\n'],
  ['a quote and a backslash in a header value', '[Notation "2"]\n[Event "The \\"big\\" one \\\\ final"]\n\n1. B\n'],
  ['every baton code', `${N2}1. - F 2F B 2B FB 2F2B 10F FE 2FBE BE = K X E Z W G\n`],
  ['kubbs thrown in: every code, in order', `${N2}1. 0I\n2. I\n3. IRPYQN\n4. 10I2R2P2Y2Q5NE\n5. j:2I m:2I2R grant_scott:Y\n6. 2Y\n7. IE\n`],
  ['kubbs, advantage, batons and a note', `${N2}1. j:B\n2. k:I A k:F - = # a note, with (brackets) and a # in it\n`],
  ['an advantage line with no kubbs thrown', `${N2}1. A F\n2. A\n`],
  ['a kids\' game: three base kubbs, four batons', '[Notation "2"]\n[Base kubbs "3"]\n[Batons "4"]\n\n1. B B B K\n'],
  ['a field kubb and a base kubb in one cell', `${N2}1. I FB\n@a 2,3\n*a 2,3+2,3\n`],
  ['a kubb left from an earlier turn among new ones', `${N2}1. 2I F -\n@b 1,1s 2x0,0\n*b 0,0 -\n`],
  ['ten kubbs in one cell', `${N2}1. 10I 10F\n@b 10x4,0\n*b 10x4,0\n`],
  ['the edges of the pitch', `${N2}1. 4I - -\n@b 0.00,0.00 0.00,4.00 5.00,0.00 5.00,4.00\n~b 0.00,0.00/-0.01,-0.20 0.00,4.00/-0.20,4.20 5.00,0.00/5.20,-0.20 5.00,4.00/5.20,4.20\n^a 0.00,0.00 5.00,9.99\n`],
];

// Must be rejected. [name, form, text]: form is the start rule it is invalid
// in. "lenient" cases are invalid in both forms.
export const invalid = [
  // not notation at all
  ['a stray character after a baton', 'lenient', 'F-'],
  ['advantage after the batons', 'lenient', '2I F F 5A'],
  ['advantage in the middle of the batons', 'lenient', '2I F - 3A F'],
  ['kubbs thrown in after the batons', 'lenient', 'F F 2I'],
  ['a count over 10', 'lenient', '11I F'],
  ['a baton count over 10', 'lenient', '2I 12F'],
  ['more than 5N', 'lenient', '6N F'],
  ['an advantage line over 4 metres', 'lenient', '2I 5A F'],
  ['two advantage markers', 'lenient', '2I A A F'],
  ['an advantage line with a player', 'lenient', '2I b:A F'],
  ['a number after the action', 'lenient', '2I F2'],
  ['B before F', 'lenient', '2I BF'],
  ['Q for a king hit, as the published page has it', 'lenient', '5. i - - Q X X X'],
  ['an unknown token', 'lenient', '2I Q- F'],
  ['an unknown separator', 'lenient', '2I F ; F'],
  ['a turn with nothing in it', 'lenient', '1.'],
  ['a player with no action', 'lenient', 'jt:'],
  ['a double colon', 'lenient', 'jt::F'],
  ['a lowercase action after a player with no colon', 'lenient', 'jtb jtk'],
  ['a capital player with no colon', 'lenient', 'EB'],
  ['an unclosed comment', 'lenient', '2I F F (unclosed'],
  ['a comment inside a comment', 'lenient', '2I F (a (nested) one) F'],
  ['a header after the turns', 'lenient', '1. B\n[Event "late"]'],
  ['an unquoted header value', 'lenient', '[Event unquoted]'],
  ['a notation this grammar does not know', 'lenient', '[Notation "3"]\n1. B'],
  // positions
  ['a position line with no turn above it', 'lenient', '@b 4,0\n1. I F'],
  ['a position line above the headers', 'lenient', '@b 4,0\n[Team A "x"]\n1. I F'],
  ['the first draft: a position joined to a token', 'lenient', '1. 2I@1b2@3b0 F'],
  ['a position line with nothing on it', 'lenient', '1. I F\n@b'],
  ['no half', 'lenient', '1. I F\n@ 4,0'],
  ['a half that is not a or b', 'lenient', '1. I F\n@c 4,0'],
  ['the half written as its own word', 'lenient', '1. I F\n@ b: 4,0'],
  ['a cell across 5', 'lenient', '1. I F\n@b 5,0'],
  ['a cell depth 4', 'lenient', '1. I F\n@b 2,4'],
  ['a cell without its comma', 'lenient', '1. I F\n@b 40'],
  ['a point with one decimal', 'lenient', '1. I F\n@b 1.3,2.0'],
  ['half a point', 'lenient', '1. I F\n@b 4.31,1'],
  ['a point across 6.20', 'lenient', '1. I F\n@b 6.20,1.00'],
  ['a point in the old corner frame', 'lenient', '1. I F\n@b 4.39,4.61'],
  ['a point across 5.01', 'lenient', '1. I F\n@b 5.01,1.00'],
  ['a negative number on a pitch line', 'lenient', '1. I F\n@b -0.05,1.00'],
  ['cells and points on one line', 'lenient', '1. 2I F\n@b 4,0 4.10,2.00'],
  ['a count on a point', 'lenient', '1. 2I F\n@b 2x4.10,2.00'],
  ['a count after the cell', 'lenient', '1. 2I F\n@b 4,0x2'],
  ['a pitch count over 10', 'lenient', '1. 2I F\n@b 11x4,0'],
  ['a mark that is not s or p', 'lenient', '1. I F\n@b 4,0q'],
  ['a lying kubb with one end', 'lenient', '1. I F\n@b 4.60,0.03\n~b 4.59,0.06'],
  ['a lying kubb in cells', 'lenient', '1. I F\n@b 4,0\n~b 4,0/4,0'],
  ['an end more than 0.20 m off the pitch', 'lenient', '1. I F\n@b 4.97,0.14\n~b 4.94,0.13/5.21,0.17'],
  ['a zero with a minus sign', 'lenient', '1. I F\n@b 4.60,0.03\n~b 4.59,0.06/4.63,-0.00'],
  ['a stance with across alone', 'lenient', '1. I F\n^a 1.40'],
  ['a stance in cells', 'lenient', '1. I F\n^a 1,3'],
  ['a felled word ending in +', 'lenient', '1. I F\n*b 4,0+'],
  ['a felled word mixing cells and points', 'lenient', '1. 2I 2F\n*b 4,0+4.10,2.00'],
  ['a note on a position line', 'lenient', '1. I F\n@b 4,0 # here'],
  // valid lenient, not canonical
  ['no notation header', 'canonical', '[Team A "Ringers"]\n\n1. B\n'],
  ['no headers', 'canonical', '1. B\n'],
  ['notation 1', 'canonical', '[Notation "1"]\n\n1. B\n'],
  ['the notation header not first', 'canonical', '[Team A "Ringers"]\n[Notation "2"]\n\n1. B\n'],
  ['headers out of order', 'canonical', '[Notation "2"]\n[Team B "Kubbitz"]\n[Team A "Ringers"]\n\n1. B\n'],
  ['a writer\'s own headers out of order', 'canonical', '[Notation "2"]\n[Engine:seed "7"]\n[Engine:level "Pro"]\n\n1. B\n'],
  ['a writer\'s own header before a defined one', 'canonical', '[Notation "2"]\n[Engine:seed "7"]\n[Team A "Ringers"]\n\n1. B\n'],
  ['a header twice', 'canonical', '[Notation "2"]\n[Team A "Ringers"]\n[Team A "Ringers"]\n\n1. B\n'],
  ['two spaces in a header', 'canonical', '[Notation "2"]\n[Team A  "Ringers"]\n\n1. B\n'],
  ['no blank line after the headers', 'canonical', '[Notation "2"]\n1. B\n'],
  ['two blank lines after the headers', 'canonical', '[Notation "2"]\n\n\n1. B\n'],
  ['a blank line between turns', 'canonical', `${N2}1. B\n\n2. B\n`],
  ['a comment line between turns', 'canonical', `${N2}1. B\n# half time\n2. B\n`],
  ['no line feed at the end', 'canonical', `${N2}1. B`],
  ['two line feeds at the end', 'canonical', `${N2}1. B\n\n`],
  ['carriage returns', 'canonical', '[Notation "2"]\r\n\r\n1. B\r\n'],
  ['a turn with no number', 'canonical', `${N2}B B\n`],
  ['a turn number skipped', 'canonical', `${N2}1. B\n3. B\n`],
  ['turns not starting at 1', 'canonical', `${N2}2. B\n`],
  ['a turn number with a leading zero', 'canonical', `${N2}01. B\n`],
  ['two spaces between tokens', 'canonical', `${N2}1. 2I  F\n`],
  ['a space at the end of a line', 'canonical', `${N2}1. 2I F \n`],
  ['a tab between tokens', 'canonical', `${N2}1. 2I\tF\n`],
  ['a comma between tokens', 'canonical', `${N2}1. 2I,F\n`],
  ['a comment in parentheses', 'canonical', `${N2}1. 2I F (nice)\n`],
  ['a note without its spaces', 'canonical', `${N2}1. 2I F #nice\n`],
  ['an empty note', 'canonical', `${N2}1. 2I F #\n`],
  ['a note with a space after it', 'canonical', `${N2}1. 2I F # nice \n`],
  ['a player without a colon', 'canonical', `${N2}1. jtB\n`],
  ['a player in capitals', 'canonical', `${N2}1. JT:B\n`],
  ['a lowercase action', 'canonical', `${N2}1. jt:b\n`],
  ['a written count of one', 'canonical', `${N2}1. 1F\n`],
  ['a count of zero on a baton', 'canonical', `${N2}1. 0F\n`],
  ['a bare number for kubbs thrown in', 'canonical', `${N2}1. 3 F\n`],
  ['a bare zero', 'canonical', `${N2}1. 0 B\n`],
  ['zero kubbs with another code', 'canonical', `${N2}1. 0I2R B\n`],
  ['kubb codes out of order', 'canonical', `${N2}1. 2RI F\n`],
  ['a kubb code twice', 'canonical', `${N2}1. 2I3I F\n`],
  ['an advantage line with a number', 'canonical', `${N2}1. 2I 2A F\n`],
  ['a 2012 advantage marker', 'canonical', `${N2}1. I BA F\n`],
  ['! for an illegal king hit', 'canonical', `${N2}1. !\n`],
  ['spaces before a position line', 'canonical', `${N2}1. I F\n @b 4,0\n`],
  ['a half in capitals', 'canonical', `${N2}1. I F\n@B 4,0\n`],
  ['two spaces on a position line', 'canonical', `${N2}1. 2I F\n@b 4,0  3,1\n`],
  ['a blank line before a position line', 'canonical', `${N2}1. I F\n\n@b 4,0\n`],
  ['a written count of one on a pitch line', 'canonical', `${N2}1. I F\n@b 1x4,0\n`],
  ['one cell written twice', 'canonical', `${N2}1. 2I F\n@b 4,0 4,0\n`],
  ['pitch entries out of order: across', 'canonical', `${N2}1. 3I F\n@b 2x4,0 3,1\n`],
  ['pitch entries out of order: depth', 'canonical', `${N2}1. 2I F\n@b 4,1 4,0\n`],
  ['pitch entries out of order: p before unmarked', 'canonical', `${N2}1. 2IP F\n@b 0,3p 4,0\n`],
  ['pitch entries out of order: s after unmarked', 'canonical', `${N2}1. I F\n@b 4,0 1,1s\n`],
  ['points out of order', 'canonical', `${N2}1. 2I F\n@b 4.52,0.34 4.48,0.11\n`],
  ['position lines out of order: b before a', 'canonical', `${N2}1. I A F\n@b 4,0\n@a 1,1s\n`],
  ['position lines out of order: felled before pitch', 'canonical', `${N2}1. I F\n*b 4,0\n@b 4,0\n`],
  ['one kind of line twice', 'canonical', `${N2}1. 2I F\n@b 4,0\n@b 3,1\n`],
  ['fewer p than P', 'canonical', `${N2}${T9}@b 5x4,0 0,3p\n`],
  ['a p with no P on the turn line', 'canonical', `${N2}1. 2I F\n@b 4,0 0,3p\n`],
  ['a lay line without its pitch line', 'canonical', `${N2}1. I F\n~b 4.59,0.06/4.63,-0.08\n`],
  ['a lay line over a pitch line in cells', 'canonical', `${N2}1. I F\n@b 4,0\n~b 4.59,0.06/4.63,-0.08\n`],
  ['a lay line with too few kubbs', 'canonical', `${N2}1. 2I F\n@b 4.48,0.11 4.60,0.03\n~b 4.59,0.06/4.63,-0.08\n`],
  ['a lay line counting a kubb left from before', 'canonical', `${N2}1. I F\n@b 1.00,1.00s 4.60,0.03\n~b 0.97,1.00/1.12,1.00 4.59,0.06/4.63,-0.08\n`],
  ['a stance line with too few words', 'canonical', `${N2}1. I F - -\n^a 4.20,4.00 -\n`],
  ['a felled line with too many words', 'canonical', `${N2}1. I F -\n*b 4,0 - -\n`],
  ['a felled word with too few kubbs', 'canonical', `${N2}1. 2I 2F\n*b 4,0\n`],
  ['a felled word for a miss', 'canonical', `${N2}1. I - F\n*b 4,0 4,0\n`],
  ['felled kubbs out of order', 'canonical', `${N2}1. 2I 2F\n*b 4,0+3,1\n`],
  ['felled kubbs in one cell written twice', 'canonical', `${N2}1. 2I 2F\n*b 4,0+4,0\n`],
];

// The canonical form of a lenient file. [name, lenient text]. The runner
// records the canonical text and the reports, or that it cannot be written.
export const canonicalize = [
  ['a 2012 sheet line without colons', '9. a7I2R2P d3F d2F aF a- yF cB # penalty kubbs: 1 behind the king and 1 in the back left corner'],
  ['lowercase, separators, a comment, written ones, a zero hit', '1. 3 2f, F/B (lovely) - 0F 1F # ok'],
  ['two comments and no note', '1. 2I (first) F (second) -'],
  ['kubb codes out of order', '7IQ2R F'],
  ['a bare zero', '0 B B B B B K'],
  ['a player in capitals, lowercase actions', 'JT:2i jt:f'],
  ['! becomes E', '2I F !'],
  ['the number on an advantage line is dropped and reported', '2I 2A F'],
  ['a 2012 advantage marker is dropped and reported', 'I BA F'],
  ['turns are renumbered and it is reported', '3. B\n7. F'],
  ['headers are put in order, and the notation header added', '[Win "Team A"]\n[Zeta "z"]\n[Engine:seed "7"]\n[Team A "x \\"y\\""]\n1. B'],
  ['a notation 1 file becomes notation 2', '[Notation "1"]\n[Team A "Ringers"]\n1. B'],
  ['a header twice: the last is kept and it is reported', '[Team A "Ringers"]\n[Team A "The Ringers"]\n1. B'],
  ['carriage returns, blank lines and comment lines go', '[Team A "Ringers"]\r\n\r\n\r\n1. B\r\n# half time\r\n\r\n2. F\r\n'],
  ['the engine\'s old positions become a note', '3. m:2I (@ 4.39,4.61 4.34,5.21) m:F (@ 4.39,4.61) a:B (@ 1.50,8.00)'],
  ['a pitch line as a person types it', `${T9}  @B 4,0 2,0P 4,0 4,0 0,3p 4,0 4,0\n*b 4,0+4,0+4,0 4,0+4,0 2,0 - 0,3 1,3`],
  ['lines and entries are put in order, and the lay line follows its pitch line', '1. k:2I A s:2F s:- k:B\n*a 2.40,1.10+1.88,0.95 - 2.50,4.00\n@b 3.12,1.63s\n@a 2.40,1.10 1.88,0.95\n~a 2.36,1.03/2.42,1.17 1.80,0.93/1.94,0.98\n^b 2.10,1.63 2.10,1.63 -'],
  ['a field kubb and a base kubb from one cell stay apart', '1. I 2FB\n@a 2x2,3\n*a 2,3+2,3+2,3'],
  ['a canonical file is its own canonical form', GAME],
  ['cannot: a bare count over 10', '1. 12 F'],
  ['cannot: one kind of line twice', '1. 2I F\n@a 1,1\n@a 2,2'],
  ['cannot: a turn whose lines disagree', `${T9}@b 5x4,0 0,3p`],
];

// What the reader makes of a game. [name, text, grammar]: grammar is
// 'accepts' when the lenient grammar reads the text too, and 'rejects' when
// the reader is repairing something the grammar refuses. A repair always
// comes with a warning.
export const reader = [
  ['a whole game', GAME, 'accepts'],
  ['every line, to the centimetre', PRECISE, 'accepts'],
  ['a kids\' game', '[Base kubbs "3"]\n[Batons "4"]\n1. B B B K', 'accepts'],
  ['five batons where the header says four', '[Batons "4"]\n1. B B - - -', 'accepts'],
  ['three batons on the first turn of a 2-4-6 opening', '[Opening "2-4-6"]\n1. B B B', 'accepts'],
  ['six from the start', '[Opening "6"]\n1. B B B B B K', 'accepts'],
  ['seven batons with no rule headers', '1. B B - - - - -', 'accepts'],
  ['rule headers that do not read', '[Base kubbs "lots"]\n[Opening "two-four-six"]\n1. B B B B B K', 'accepts'],
  ['a pitch line with a kubb missing', GAME.replace('@b 3x4,0', '@b 2x4,0'), 'accepts'],
  ['the thrower\'s own half without s', GAME.replace('@a 4,1s', '@a 4,1'), 'accepts'],
  ['a kubb left from before not marked s', '1. B -\n2. I - -\n@a 2,1\n3. 0I A - -\n4. 0I - -\n@a 2,1', 'accepts'],
  ['lines in the wrong half for the turn', '1. B -\n2. I F -\n@a 2,1\n~b 2.00,1.00/2.15,1.00\n^a 2.50,4.00 -\n*b 2,1 -', 'accepts'],
  ['a felled kubb that is not on the pitch line', '1. B -\n2. I F -\n@a 2,1\n*a 3,3 -', 'accepts'],
  ['lines that disagree within a turn', `${T9}@b 5x4,0 0,3p\n*b 3x4,0 - -`, 'accepts'],
  ['an advantage line read off the pitch line', '1. B -\n2. I - -\n@a 2.40,1.10\n3. 0I A B -\n@a 2.40,1.10s', 'accepts'],
  ['a notation the reader does not know', '[Notation "3"]\n1. B', 'rejects'],
  ['repair: a lowercase action after a player with no colon', 'jtb jtk', 'rejects'],
  ['repair: a capital player with no colon', 'EB', 'rejects'],
  ['repair: an advantage line with a player', '2I b:A F', 'rejects'],
  ['repair: a comment inside a comment', '2I F (a (nested) one) F', 'rejects'],
  ['repair: an unclosed comment', '2I F F (unclosed', 'rejects'],
  ['repair: counts over the limit', '2I 12F\n6N F', 'rejects'],
  ['repair: an advantage line over 4 metres', '2I 5A F', 'rejects'],
  ['repair: advantage in the middle of the batons', '2I F - 3A F', 'rejects'],
  ['repair: an unknown separator', '2I F ; F', 'rejects'],
  ['repair: F- read as F', 'ml:F- B', 'rejects'],
  ['repair: Q for a king hit, as the published page has it', '5. i - - Q X X X', 'rejects'],
  ['repair: a header after the turns', '1. B\n[Event "late"]', 'rejects'],
  ['repair: a turn number with nothing after it', '1.\n2. B', 'rejects'],
  ['repair: a position line that does not read', '1. I F\n@b 40', 'rejects'],
  ['repair: a position line with no turn above it', '@b 4,0\n1. I F', 'rejects'],
];
