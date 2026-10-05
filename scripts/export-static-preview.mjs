import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCAL_ORIGIN = 'http://127.0.0.1:4321';
const ASSET_ORIGIN = 'https://healhouseskin.com';
const PAGES_ORIGIN = 'https://jminbae.github.io/imsivitiligo';
const OUTPUT_ROOT = path.resolve('docs');

const pages = [
  { slug: '', label: '백반증 메인', source: '/ko/vitiligo/' },
  { slug: 'medication', label: '약물치료', source: '/ko/visual-vitiligo/medication/' },
  { slug: 'excimer', label: '엑시머치료', source: '/ko/visual-vitiligo/excimer/' },
  { slug: 'surgery', label: '수술치료', source: '/ko/visual-vitiligo/surgery/' },
  { slug: 'depigmentation', label: '탈색치료', source: '/ko/visual-vitiligo/depigmentation/' },
  { slug: 'care', label: '생활관리', source: '/ko/visual-vitiligo/care/' },
  { slug: 'research', label: '연구 소개', source: '/ko/visual-vitiligo/research/' },
];

const previewStyle = `
<style id="review-preview-style">
  :root { --review-blue: #365f78; --review-blue-soft: #a0c5dd; }
  body { margin: 0; }
  .review-nav {
    position: sticky; top: 0; z-index: 2147483647; display: flex; align-items: center;
    gap: 22px; min-height: 54px; padding: 0 22px; overflow-x: auto;
    background: rgba(20, 30, 40, .96); color: #fff; border-bottom: 1px solid rgba(255,255,255,.16);
    box-shadow: 0 8px 28px rgba(20,30,40,.16); backdrop-filter: blur(14px);
    font-family: Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  }
  .review-nav__mark { flex: 0 0 auto; color: var(--review-blue-soft); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
  .review-nav__links { display: flex; align-items: stretch; gap: 3px; min-width: max-content; }
  .review-nav a { display: flex; align-items: center; min-height: 54px; padding: 0 14px; color: rgba(255,255,255,.68); font-size: 14px; font-weight: 600; text-decoration: none; }
  .review-nav a:hover, .review-nav a:focus-visible, .review-nav a[aria-current="page"] { color: #fff; background: rgba(160,197,221,.12); }
  .review-nav a[aria-current="page"] { box-shadow: inset 0 -2px 0 var(--review-blue-soft); }
  html.preview-motion [data-vt-reveal]:not(.is-preview-visible),
  html.preview-motion [data-vte-reveal]:not(.is-preview-visible),
  html.preview-motion [data-research-reveal]:not(.is-preview-visible),
  html.preview-motion .vtm-reveal:not(.is-preview-visible),
  html.preview-motion .vta-reveal:not(.is-preview-visible) { opacity: 0 !important; transform: translateY(24px) !important; }
  html.preview-motion .is-preview-visible { opacity: 1 !important; transform: none !important; transition: opacity .72s ease, transform .72s ease !important; }
  @media (max-width: 767px) {
    .review-nav { gap: 12px; min-height: 48px; padding-inline: 14px; }
    .review-nav__mark { font-size: 10px; }
    .review-nav a { min-height: 48px; padding-inline: 11px; font-size: 13px; }
  }
  @media (prefers-reduced-motion: reduce) {
    html.preview-motion [data-vt-reveal], html.preview-motion [data-vte-reveal],
    html.preview-motion [data-research-reveal], html.preview-motion .vtm-reveal,
    html.preview-motion .vta-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
</style>`;

const previewScript = `
<script>
  (() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const selector = '[data-vt-reveal], [data-vte-reveal], [data-research-reveal], .vtm-reveal, .vta-reveal';
    const targets = [...document.querySelectorAll(selector)];
    document.documentElement.classList.add('preview-motion');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-preview-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
    for (const target of targets) observer.observe(target);
  })();
</script>`;

function navigation(activeSlug) {
  const links = pages.map(({ slug, label }) => {
    const href = slug ? `${PAGES_ORIGIN}/${slug}/` : `${PAGES_ORIGIN}/`;
    const current = slug === activeSlug ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  }).join('');
  return `<nav class="review-nav" aria-label="백반증 보강 화면"><span class="review-nav__mark">검수용 · 실제 운영 아님</span><div class="review-nav__links">${links}</div></nav>`;
}

function makeStatic(html, page) {
  let output = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*name=["'](?:robots|googlebot|bingbot)["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:|twitter:)[^"']*["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
    .replace(/\b(src|href|poster)=(['"])\/(?!\/)/gi, `$1=$2${ASSET_ORIGIN}/`)
    .replace(/\bsrcset=(['"])([\s\S]*?)\1/gi, (whole, quote, value) =>
      `srcset=${quote}${value.replace(/(^|[\s,])\/(?!\/)/g, `$1${ASSET_ORIGIN}/`)}${quote}`)
    .replace(/url\((['"]?)\/(?!\/)/gi, `url($1${ASSET_ORIGIN}/`);

  output = output.replace(/<a\b([^>]*)>/gi, (whole, attributes) => {
    if (!/href=["']https:\/\/healhouseskin\.com\//i.test(attributes)) return whole;
    if (/\brel=/i.test(attributes)) return whole;
    return `<a${attributes} rel="nofollow noopener noreferrer">`;
  });

  const pageUrl = page.slug ? `${PAGES_ORIGIN}/${page.slug}/` : `${PAGES_ORIGIN}/`;
  const title = `[검수용] ${page.label} 보강안 | 힐하우스피부과`;
  const description = '힐하우스피부과 백반증 페이지 개편을 위한 검토용 화면입니다. 실제 운영 페이지가 아닙니다.';
  const previewMeta = [
    `<meta name="description" content="${description}">`,
    '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">',
    '<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex">',
    '<meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet,noimageindex">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="[검수용] ${page.label} 보강안">`,
    '<meta property="og:description" content="백반증 페이지 개편을 위한 검토용 화면입니다.">',
    `<meta property="og:url" content="${pageUrl}">`,
    '<meta property="og:locale" content="ko_KR">',
    '<meta name="twitter:card" content="summary">',
  ].join('');

  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  output = output.replace('</head>', `${previewMeta}${previewStyle}</head>`);
  output = output.replace(/<body([^>]*)>/i, `<body$1>${navigation(page.slug)}`);
  output = output.replace('</body>', `${previewScript}</body>`);
  return output.replace(/[ \t]+$/gm, '');
}

for (const page of pages) {
  const response = await fetch(`${LOCAL_ORIGIN}${page.source}`);
  if (!response.ok) throw new Error(`${page.source} returned ${response.status}`);
  const outputDir = page.slug ? path.join(OUTPUT_ROOT, page.slug) : OUTPUT_ROOT;
  await mkdir(outputDir, { recursive: true });
  const html = makeStatic(await response.text(), page);
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  process.stdout.write(`exported ${page.label}\n`);
}

await writeFile(path.join(OUTPUT_ROOT, '.nojekyll'), '', 'utf8');

const notFound = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"><title>페이지를 찾을 수 없습니다 | 백반증 검수 화면</title>${previewStyle}</head><body>${navigation('')}<main style="min-height:70vh;display:grid;place-items:center;padding:40px;font-family:Pretendard,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;text-align:center"><div><p style="color:#365f78;font-weight:700;letter-spacing:.08em">404</p><h1 style="margin-top:12px;font-size:clamp(28px,5vw,48px);color:#141e28">화면을 찾을 수 없습니다</h1><p style="margin-top:18px;color:#59636a">상단 메뉴에서 검수할 백반증 화면을 선택해 주세요.</p></div></main></body></html>`;
await writeFile(path.join(OUTPUT_ROOT, '404.html'), notFound, 'utf8');
