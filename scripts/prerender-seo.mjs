// Post-build step: writes one HTML file per SEO route (dist/<route>.html) with that
// page's own <title>, description, canonical and social tags, plus sitemap.xml.
// Without this, every route ships the homepage head until JavaScript runs.
//   node scripts/prerender-seo.mjs          (runs automatically after `npm run build`)
//   node scripts/prerender-seo.mjs --sitemap-only   (writes public/sitemap.xml)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { allSeoPages, SITE_URL } from '../src/data/seoMeta.ts';
import { HOME_FAQ } from '../src/data/homeFaq.ts';

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

await writeFile('public/sitemap.xml', sitemap);
if (sitemapOnly) {
  console.log(`sitemap: ${pages.length} urls`);
  process.exit(0);
}
await writeFile('dist/sitemap.xml', sitemap);

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

let written = 0;
for (const p of pages) {
  const file = p.path === '/' ? 'dist/index.html' : path.join('dist', `${p.path.slice(1)}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, render(p));
  written++;
}
console.log(`prerender: ${written} pages, sitemap: ${pages.length} urls`);
