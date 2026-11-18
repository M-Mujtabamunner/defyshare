// Post-build step: writes one HTML file per SEO route (dist/<route>.html) with that
// page's own <title>, description, canonical and social tags, plus sitemap.xml.
// Without this, every route ships the homepage head until JavaScript runs.
//   node scripts/prerender-seo.mjs          (runs automatically after `npm run build`)
//   node scripts/prerender-seo.mjs --sitemap-only   (writes public/sitemap.xml)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { allSeoPages, SITE_URL } from '../src/data/seoMeta.ts';
import { HOME_FAQ } from '../src/data/homeFaq.ts';
import { allIntentPages } from '../src/data/intentPages.ts';

const sitemapOnly = process.argv.includes('--sitemap-only');
const pages = allSeoPages();
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urlFor = (p) => (p.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.path}`);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(
    (p) =>
      `  <url><loc>${urlFor(p)}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority.toFixed(1)}</priority></url>`,
  ),
  '</urlset>',
  '',
].join('\n');

// "Send X from A to B" pages get their own sitemap.
const intents = allIntentPages();
const intentSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...intents.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
  '</urlset>',
  '',
].join('\n');

await writeFile('public/sitemap.xml', sitemap);
await writeFile('public/sitemap-1-2k.xml', intentSitemap);
if (sitemapOnly) {
  console.log(`sitemap: ${pages.length} urls, sitemap-1-2k: ${intents.length} urls`);
  process.exit(0);
}
await writeFile('dist/sitemap.xml', sitemap);
await writeFile('dist/sitemap-1-2k.xml', intentSitemap);

const template = await readFile('dist/index.html', 'utf8');

const setTag = (html, pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`prerender: tag not found in dist/index.html: ${pattern}`);
  return html.replace(pattern, replacement);
};

const faqJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const render = (p) => {
  const url = urlFor(p);
  const title = esc(p.title);
  const desc = esc(p.description);
  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${desc}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${desc}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${desc}" />`);
  if (p.path === '/') {
    html = html.replace('</head>', `    <script type="application/ld+json">${faqJsonLd}</script>\n  </head>`);
  }
  return html;
};

// Text of an intent page, built into the HTML so it's readable without JavaScript.
// React replaces it when the app starts.
const intentBody = (p) => {
  const li = (xs) => xs.map((x) => `<li>${esc(x)}</li>`).join('');
  return [
    '<main style="max-width:64rem;margin:0 auto;padding:1rem;font-family:system-ui,sans-serif">',
    `<h1>${esc(p.h1)}</h1>`,
    `<p>${esc(p.intro)}</p>`,
    `<h2>How to ${esc(p.h1.charAt(0).toLowerCase() + p.h1.slice(1))}</h2><ol>${li(p.steps)}</ol>`,
    `<h2>Tips</h2><ul>${li(p.tips)}</ul>`,
    `<h2>Questions</h2><dl>${p.faq.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl>`,
    `<h2>Related</h2><ul>${p.related.map((r) => `<li><a href="${r.path}">${esc(r.label)}</a></li>`).join('')}</ul>`,
    '<p><a href="/">Open DefyShare</a> · <a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a></p>',
    '</main>',
  ].join('');
};

const renderIntent = (p) => {
  let html = render({ ...p, priority: 0.7, changefreq: 'monthly' });
  const faq = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  });
  html = html.replace('</head>', `    <script type="application/ld+json">${faq}</script>
  </head>`);
  return setTag(html, /<div id="root"><\/div>/, `<div id="root">${intentBody(p)}</div>`);
};

const homeBody = [
  '<main style="max-width:64rem;margin:0 auto;padding:1rem;font-family:system-ui,sans-serif">',
  '<h1>DefyShare: share files and text between your devices on the same Wi-Fi</h1>',
  '<p>DefyShare moves photos, videos, documents, archives, folders and text between your phone, laptop and tablet without cables, email or sign-up. Open defyshare.app on every device on the same Wi-Fi and they join the same private room automatically. Everything shared is deleted after 3 hours.</p>',
  '<h2>How to use DefyShare</h2><ol>',
  '<li>Open defyshare.app on two or more devices on the same network.</li>',
  '<li>Drop files or a folder onto the page, pick files, or paste with Ctrl+V.</li>',
  '<li>Choose who gets them: everyone, one or more devices, or a group.</li>',
  '<li>Download them on the other device. Everything is deleted after 3 hours.</li></ol>',
  `<h2>Frequently asked questions</h2><dl>${HOME_FAQ.map(({ q, a }) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>`,
  `<h2>Guides</h2><ul>${intents.filter((p) => p.path.endsWith('-between-devices')).map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`).join('')}</ul>`,
  '<p><a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a></p>',
  '</main>',
].join('');

let written = 0;
for (const p of intents) {
  await writeFile(path.join('dist', `${p.path.slice(1)}.html`), renderIntent(p));
  written++;
}
for (const p of pages) {
  const file = p.path === '/' ? 'dist/index.html' : path.join('dist', `${p.path.slice(1)}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  const html = render(p);
  await writeFile(file, p.path === '/' ? setTag(html, /<div id="root"><\/div>/, `<div id="root">${homeBody}</div>`) : html);
  written++;
}
console.log(`prerender: ${written} pages, sitemap: ${pages.length} urls, sitemap-1-2k: ${intents.length} urls`);
