#!/usr/bin/env python3
"""Turn the Planet Kubb wiki's turn-by-turn game pages into Kubb Notation text files.

Reads Game-namespace pages (ns 824) with {{Game turn}} templates from the MediaWiki XML dump,
plus the deleted games saved in sources/deleted/, and writes one games/*.txt file per game:
PGN-style [Key "value"] headers, a blank line, then one notation line per turn.

The turn lines follow the wiki's own renderer (Template:Game turn, the hidden Notation row):
    n. [p:]KUBBS [A] p:BATON p:BATON ... # note
"""
import gzip, json, re, sys, unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUMP = Path.home() / "Projects/mediawiki-archive/wiki.planetkubb.com-Sun-7.xml.gz"
WIKI = "https://wiki.planetkubb.com/wiki/"

# Pages with turn data that duplicate another page; value is the page kept.
DUPLICATES = {
    # Same game entered twice from a scoring app; this copy has "undefinedF1B" batons in turn 1.
    "Game:2015 U.S. National Kub Championship Quarterfinals Game 2 King Pin vs Damage Inc":
        "Game:2015 U.S. National Kubb Championship Quarterfinals Game 2 King Pin vs Damage Inc",
}


def load_pages(path):
    pages = {}
    for _, el in ET.iterparse(gzip.open(path)):
        if el.tag.endswith("}page"):
            kids = {c.tag.split("}")[1]: c for c in el}
            rev = [c for c in el if c.tag.endswith("revision")][-1]
            rk = {c.tag.split("}")[1]: c for c in rev}
            pages[kids["title"].text] = dict(ns=kids["ns"].text, ts=rk["timestamp"].text,
                                             text=rk["text"].text or "")
            el.clear()
    return pages


def templates(text):
    """Yield (name, params) for each top-level {{...}} in text."""
    i = 0
    while (i := text.find("{{", i)) >= 0:
        depth, j = 0, i
        while j < len(text):
            if text.startswith("{{", j):
                depth += 1; j += 2
            elif text.startswith("}}", j):
                depth -= 1; j += 2
                if depth == 0:
                    break
            else:
                j += 1
        body, parts, buf, depth, k = text[i + 2:j - 2], [], "", 0, 0
        while k < len(body):
            two = body[k:k + 2]
            if two in ("{{", "[["):
                depth += 1; buf += two; k += 2
            elif two in ("}}", "]]"):
                depth -= 1; buf += two; k += 2
            elif body[k] == "|" and depth == 0:
                parts.append(buf); buf = ""; k += 1
            else:
                buf += body[k]; k += 1
        parts.append(buf)
        params = {}
        for p in parts[1:]:
            if "=" in p:
                key, v = p.split("=", 1)
                params[key.strip()] = v.strip()
        yield parts[0].strip(), params
        i = j


def clean(s):
    s = re.sub(r"<br\s*/?>", " ", s or "")
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_date(s):
    for fmt in ("%B %d, %Y %I:%M:%S %p", "%B %d, %Y %H:%M:%S", "%B %d, %Y",
                "%Y/%m/%d %I:%M:%S %p", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(s.strip(), fmt)
        except (ValueError, AttributeError):
            pass
    return None


def pid(p):
    """Player id as used in the notation: lowercase, no spaces ("Grant Scott" -> "grant_scott").
    The forms defaulted some player fields to "0" or "-", which mean nobody."""
    p = p.strip().lower()
    return "" if p in ("0", "-") else re.sub(r"\s+", "_", p)


def kubb_part(turn):
    """The inkast: numbered fields ('5i2r', with an optional thrower) or the older numeric ones."""
    out = []
    for n in ("1", "2", "3"):
        v = turn.get(f"Kubb throw {n}", "")
        if v and v != "-":
            p = turn.get(f"Kubb throw {n} player", "")
            out.append((pid(p) + ":" if pid(p) else "") + v.upper())
    if not out and turn.get("Kubb throw", "") not in ("",):
        p = turn.get("Kubb throw player", "")
        s = turn["Kubb throw"] + "I"
        for key, letter in (("Kubb rethrow", "R"), ("Kubb penalty", "P")):
            c = turn.get(key, "0") or "0"
            if c != "0":
                s += ("" if c == "1" else c) + letter
        out.append((pid(p) + ":" if pid(p) else "") + s)
    return out


def baton(turn, n):
    v = turn.get(f"Throw {n}", "")
    if not v:
        return None
    p = turn.get(f"Throw {n} player", "")
    if ":" in v:  # some scorers typed the player into the value ("c:2f")
        p, v = v.split(":", 1)
    return (pid(p) + ":" if pid(p) else "") + v.upper()


def turn_line(n, turn):
    parts = [f"{n}."] + kubb_part(turn)
    if turn.get("Advantage line") == "Yes":
        parts.append("A")
    parts += [b for b in (baton(turn, i) for i in range(1, 7)) if b]
    note = clean(turn.get("Note", ""))
    if note:
        parts.append("# " + note)
    return " ".join(parts)


def first_team(turns, winner):
    """The wiki assumed Team A threw first. When the last turn takes the king, the side that
    threw it is the winner, which fixes who opened; otherwise keep the wiki's assumption."""
    last = [(baton(turns[-1], i) or "").split(":")[-1] for i in range(1, 7)]
    if "K" in last and winner in ("Team A", "Team B"):
        odd = len(turns) % 2 == 1
        other = "Team B" if winner == "Team A" else "Team A"
        return winner if odd else other
    return "Team A"


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def convert(title, text, source, events):
    game, players, turns = {}, [], []
    for name, p in templates(text):
        if name == "Game":
            game = p
        elif name.startswith("Game player"):
            team = name[len("Game player"):].strip() or p.get("Team", "")
            players.append((team, clean(p.get("Player", "")), pid(p.get("Initial", "")),
                            clean(p.get("Note", ""))))
        elif name == "Game turn":
            turns.append(p)
    a, b = clean(game.get("Team A")), clean(game.get("Team B"))

    opener = first_team(turns, clean(game.get("Winner"))) if turns else "Team A"
    # Which side each initial threw for, from the turns it appears in (Team A attacks odd turns).
    threw = {}
    for n, t in enumerate(turns, 1):
        side = "Team A" if n % 2 else "Team B"
        if opener == "Team B":
            side = "Team B" if side == "Team A" else "Team A"
        for key, v in t.items():
            if not v:
                continue
            if key.endswith(" player"):
                threw.setdefault(pid(v), set()).add(side)
            elif ":" in v and key.startswith("Throw "):
                threw.setdefault(pid(v.split(":")[0]), set()).add(side)

    def side_of(team, initial):
        if team in ("Team A", "Team B"):
            return team
        if team and team in (a, b):
            return "Team A" if team == a else "Team B"
        sides = threw.get(initial, set())
        return next(iter(sides)) if len(sides) == 1 else None

    def roster(side):
        listed = [f"{pl} ({i})" if i else pl for t, pl, i, _ in players if side_of(t, i) == side]
        return ", ".join(listed) or clean(game.get(f"{side} Players", ""))

    start, end = parse_date(game.get("Start date", "")), parse_date(game.get("End date", ""))
    event = clean(game.get("Event"))
    if not event:  # a few pages left Event blank; their titles start with the event name
        event = max((e for e in events if title.split(":", 1)[1].startswith(e)), key=len, default="")
    h = [("Event", event), ("Location", clean(game.get("Location")))]
    timed = start and (start.hour, start.minute) != (0, 0)  # midnight means only a date was entered
    if start:
        h.append(("Start", start.strftime("%Y-%m-%d %H:%M" if timed else "%Y-%m-%d")))
    elif event in events:
        # No game date: fall back to the first day of the event, from its Event: page.
        start = events[event]
        h.append(("Event date", start.strftime("%Y-%m-%d")))
    if timed and end and end > start:
        h.append(("End", end.strftime("%Y-%m-%d %H:%M")))
        mins = round((end - start).total_seconds() / 60)
        if 0 < mins < 300:
            h.append(("Duration", f"{mins}m"))
    h += [("Surface", clean(game.get("Pitch surface"))),
          ("Team A", a), ("Team A Players", roster("Team A")),
          ("Team B", b), ("Team B Players", roster("Team B")),
          ("First", first_team(turns, clean(game.get("Winner")))), ("Win", clean(game.get("Winner"))),
          ("Scored by", clean(game.get("Scored by"))), ("Entered by", clean(game.get("Entered by"))),
          ("Video", clean(game.get("Video URL"))), ("Video offset", clean(game.get("Video offset"))),
          ("Stats", clean(game.get("Include stats"))), ("Source", source)]
    for _, pl, i, note in players:
        if note:
            h.append(("Player note", f"{i or pl}: {note}"))
    head = "\n".join(f'[{k} "{v.replace(chr(34), chr(39))}"]' for k, v in h if v)
    body = "\n".join(turn_line(n, t) for n, t in enumerate(turns, 1))
    return start, a, b, head + "\n\n" + body + "\n", turns, clean(game.get("Winner"))


def check(turns, winner):
    """Flags for a human to look at; nothing here changes the output."""
    flags, prev = [], None
    for n, t in enumerate(turns, 1):
        hits = [baton(t, i) for i in range(1, 7)]
        hits = [h.split(":")[-1] for h in hits if h]
        down = sum(int(m.group(1) or 1) for h in hits for m in re.finditer(r"(\d*)[FB]", h))
        kp = kubb_part(t)
        if prev is not None and kp:
            m = re.match(r"(?:\w+:)?(\d*)I", kp[0])
            thrown = sum(int(re.match(r"(?:\w+:)?(\d*)I", k).group(1) or 1)
                         for k in kp if re.match(r"(?:\w+:)?(\d*)I", k))
            if m and thrown != prev:
                flags.append(f"turn {n}: {thrown} kubbs thrown in, {prev} knocked down in turn {n - 1}")
        if t.get("Advantage line") not in (None, "Yes", "No", "0"):  # "0" is a 2015 app's No
            flags.append(f"turn {n}: Advantage line={t.get('Advantage line')!r}")
        for h in hits:
            if not re.fullmatch(r"-|=|X|K|!|Z|\d*F?\d*B?|\d*F", h):
                flags.append(f"turn {n}: odd baton {h!r}")
        prev = down
    last = turns[-1]
    codes = [(baton(last, i) or "").split(":")[-1] for i in range(1, 7)]
    if "K" in codes:
        if first_team(turns, winner) == "Team B":
            flags.append("Team B threw first (the wiki assumed Team A); player sides follow the turns")
    elif "!" not in codes:
        flags.append(f"no king in the last turn ({len(turns)} turns): game may be unfinished")
    return flags


def main():
    pages = load_pages(DUMP)
    games = [(t, p["text"], WIKI + t.replace(" ", "_")) for t, p in pages.items()
             if p["ns"] == "824" and "{{Game turn" in p["text"] and t not in DUPLICATES]
    events = {}
    for t, p in pages.items():
        if p["ns"] == "828":
            ev = dict(next((kv for n, kv in templates(p["text"]) if n == "Event"), {}))
            d = parse_date(ev.get("Start date", ""))
            if d:
                events[t.split(":", 1)[1]] = d
    for f in sorted((ROOT / "sources/deleted").glob("*.wiki")):
        text = f.read_text()
        title = re.match(r"<!-- (Game:[^|]+?) \|", text).group(1)
        games.append((title, text, f"sources/deleted/{f.name} (deleted 2013-02-06)"))

    sheets = {t: f for f, t in json.loads((ROOT / "tools/scoresheets.json").read_text()).items()}
    out = ROOT / "games"
    for old in out.glob("*.txt"):
        old.unlink()
    report, seen = [], {}
    for title, text, source in sorted(games):
        start, a, b, doc, turns, winner = convert(title, text, source, events)
        name = slugify(title.split(":", 1)[1].replace("/", " "))
        name = (start.strftime("%Y-%m-%d-") if start else "undated-") + name
        if name in seen:
            sys.exit(f"filename clash: {name}")
        seen[name] = title
        if title in sheets:
            doc = doc.replace("[Source ", f'[Scoresheet "scoresheets/{sheets[title]}"]\n[Source ', 1)
        (out / f"{name}.txt").write_text(doc)
        report.append(dict(file=f"games/{name}.txt", title=title, turns=len(turns),
                           flags=check(turns, winner)))
    (ROOT / "tools/report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(f"{len(report)} games written; {sum(1 for r in report if r['flags'])} with flags")


if __name__ == "__main__":
    main()
