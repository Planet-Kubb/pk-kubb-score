#!/usr/bin/env python3
"""Copy the archive into site/: games/*.txt -> site/data/games.json, blank
scoresheets -> site/scoresheet/, plus PNG previews. Run after changing games/."""
import json, re, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
titles = {r['file']: r['title'].removeprefix('Game:') for r in json.load(open(ROOT / 'tools/report.json'))}

games = []
for f in sorted((ROOT / 'games').glob('*.txt')):
    text = f.read_text()
    h = dict(re.findall(r'^\[([^"\]]+?) "(.*)"\]$', text, re.M))
    date = (h.get('Start') or h.get('Event date') or f.name[:10])[:10]
    games.append({
        'id': f.stem,
        'title': titles.get(f'games/{f.name}', f.stem),
        'date': date,
        'event': h.get('Event', ''),
        'text': text,
    })
(SITE / 'data').mkdir(parents=True, exist_ok=True)
json.dump(games, open(SITE / 'data/games.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(games)} games -> site/data/games.json')

SHEETS = {
    'Planet_Kubb_Scoresheet.pdf': 'planet-kubb-scoresheet-v11.pdf',
    'Planet_Kubb_Scoresheet_10_stats_2014-02.pdf': 'planet-kubb-scoresheet-v10-stats.pdf',
    'Planet_Kubb_Scoresheet_10.pdf': 'planet-kubb-scoresheet-v10.pdf',
    'PlanetKubb_Scoresheet_3.pdf': 'planet-kubb-scoresheet-v3.pdf',
    'PlanetKubb_Scoresheet_2.pdf': 'planet-kubb-scoresheet-v2.pdf',
}
out = SITE / 'scoresheet'
out.mkdir(parents=True, exist_ok=True)
for src, dst in SHEETS.items():
    shutil.copy2(ROOT / 'scoresheets/blank' / src, out / dst)
    png = out / dst.replace('.pdf', '.png')
    subprocess.run(['sips', '-s', 'format', 'png', '-Z', '1600', str(out / dst), '--out', str(png)],
                   check=True, capture_output=True)
shutil.copy2(ROOT / 'docs/Kubb_notation_diagram.png', SITE / 'assets/notation-diagram.png')
print('scoresheets and previews -> site/scoresheet/')
