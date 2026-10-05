import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [landing, about, research, excimer, treatments] = await Promise.all([
  readFile('src/pages/[lang]/vitiligo/index.astro', 'utf8'),
  readFile('src/components/vitiligo/VitiligoAboutPanel.astro', 'utf8'),
  readFile('src/components/vitiligo/VitiligoResearchPanel.astro', 'utf8'),
  readFile('src/components/vitiligo/VitiligoExcimerPanel.astro', 'utf8'),
  readFile('src/components/vitiligo/VitiligoSurgeryPanel.astro', 'utf8'),
]);

test('adds one patient decision guide to every existing vitiligo category without renaming routes', () => {
  assert.match(landing, /id="vt-guide-title"/);
  assert.match(about, /id="vta-activity-title"/);
  assert.match(research, /id="research-paths-title"/);
  assert.match(excimer, /id="vte-response-title"/);
  for (const id of ['vtm-course-title', 'vts-journey-title', 'vtd-decision-title', 'vtc-beyond-title']) {
    assert.match(treatments, new RegExp(`id="${id}"`));
  }
});

test('keeps new navigation localized and reuses each page reveal contract', () => {
  for (const route of ['medication', 'excimer', 'surgery', 'care']) {
    assert.match(landing, new RegExp(`localeUrl\\(lang, 'vitiligo/${route}/'\\)`));
  }
  assert.match(landing, /<li data-vt-reveal style=\{`--vt-guide-delay:/);
  assert.match(about, /vta-activity bleed vta-reveal/);
  assert.match(research, /class="research-paths"[\s\S]*data-research-reveal/);
  assert.match(excimer, /vte-response-lede" data-vte-reveal/);
  assert.match(treatments, /class="vtm-reveal"><span class="vtm-course-number"/);
});

test('does not turn editorial additions into unsupported FAQ or Service schema', () => {
  const additions = [landing, about, research, excimer, treatments].join('\n');
  assert.doesNotMatch(additions, /vt-guide-title[\s\S]{0,500}FAQPage/);
  assert.doesNotMatch(additions, /vte-response-title[\s\S]{0,500}Service/);
});
