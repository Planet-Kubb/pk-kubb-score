// Compile grammar/planet-kubb-notation.peggy into site/assets/notation-parser.js
// (an ES module exporting parse and SyntaxError) and copy the grammar into
// site/spec/ so the spec page can link to it. Run: npm run grammar
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import peggy from 'peggy';

const root = new URL('../', import.meta.url);
const src = new URL('grammar/planet-kubb-notation.peggy', root);
const grammar = readFileSync(src, 'utf8');
const code = peggy.generate(grammar, {
  output: 'source',
  format: 'es',
  grammarSource: 'planet-kubb-notation.peggy',
  // The lenient form and the canonical form: parse(text, { startRule }).
  allowedStartRules: ['Game', 'CanonicalGame'],
});
writeFileSync(new URL('site/assets/notation-parser.js', root),
  '// Generated from grammar/planet-kubb-notation.peggy by tools/build-grammar.mjs. Do not edit.\n' + code);
mkdirSync(new URL('site/spec/', root), { recursive: true });
copyFileSync(src, new URL('site/spec/planet-kubb-notation.peggy', root));
console.log('site/assets/notation-parser.js and site/spec/planet-kubb-notation.peggy written');

// Railroad diagrams: replace each <!-- diagram:Rule -->...<!-- /diagram --> block
// in site/spec/index.html with a fresh inline SVG of that rule.
const page = new URL('site/spec/index.html', root);
if (existsSync(page)) {
  const tracks = fileURLToPath(new URL('node_modules/.bin/peggy-tracks', root));
  let html = readFileSync(page, 'utf8');
  let n = 0;
  html = html.replace(/<!-- diagram:(\w+) -->[\s\S]*?<!-- \/diagram -->/g, (_, rule) => {
    n++;
    const out = join(tmpdir(), `peggy-tracks-${rule}.svg`);
    execFileSync(tracks, ['-s', rule, '-o', out, fileURLToPath(src)]);
    const svg = readFileSync(out, 'utf8')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<svg /, `<svg role="img" aria-label="Railroad diagram of the ${rule} rule" `).trim();
    return `<!-- diagram:${rule} -->\n${svg}\n<!-- /diagram -->`;
  });
  writeFileSync(page, html);
  console.log(`${n} railroad diagrams drawn into site/spec/index.html`);
}
