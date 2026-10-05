// Single source of truth for page titles, descriptions and the URL list.
// Used by the page templates, scripts/prerender-seo.mjs (per-route HTML) and the sitemap.
// Keep this file free of path aliases and non-erasable TS syntax: Node runs it directly.
import { COMPETITORS, DEVICES, FORMATS, INDUSTRIES, KEYWORD_PAGES } from './seoData.ts';

export const SITE_URL = 'https://defyshare.app';
export const SEO_YEAR = 2026;

const TITLE_MAX = 60;
const DESC_MAX = 158;

export interface SeoMeta {
  path: string;
  title: string;
  description: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly';
}

/** First candidate that fits in Google's title width, else the shortest. */
const pickTitle = (...candidates: string[]) =>
  candidates.find((t) => t.length <= TITLE_MAX) ?? candidates.reduce((a, b) => (b.length < a.length ? b : a));

/** Join sentences, dropping trailing ones that would push past the snippet width. */
const fitDesc = (...sentences: string[]) => {
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length <= DESC_MAX) out = next;
  }
  if (out) return out;
  const cut = sentences[0].slice(0, DESC_MAX - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—-]+$/, '') + '…';
};

const an = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
// Capitalises all-lowercase words only, so "iPhone" and "macOS" survive.
const titleCase = (s: string) => s.replace(/\b[a-z]+\b/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

/** "PDF" -> "PDF files", "Word documents" stays; filesLabel is the title-case form. */
const filesNoun = (name: string) => (/\b(files|documents|spreadsheets|images|video|code)$/i.test(name) ? name : `${name} files`);
const filesLabel = (name: string) => titleCase(filesNoun(name));

const CLOSER = 'Free, no sign-up, auto-deleted after 3 hours.';

const meta = (
  path: string,
  title: string,
  description: string[],
  priority: number,
  changefreq: SeoMeta['changefreq'] = 'monthly',
): SeoMeta => ({ path, title, description: fitDesc(...description), priority, changefreq });

const KEYWORD_BENEFIT: Record<string, string[]> = {
  general: ['Free, No Sign-Up', 'No Sign-Up', 'Free'],
  platform: ['Free, Works in Browser', 'Free, No Install', 'No Install', 'Free'],
  feature: ['Free & Instant', 'Instant', 'Free'],
  howto: [`${SEO_YEAR} Guide`, 'Free & Easy', 'Free'],
  speed: [`Free (${SEO_YEAR})`, `${SEO_YEAR}`, 'Free'],
};

const KEYWORD_LINE: Record<string, string> = {
  general: 'Send files, folders, photos and text between phone, tablet and PC on the same Wi-Fi.',
  platform: 'Share files with any phone or computer on the same Wi-Fi — right from the browser, nothing to install.',
  feature: 'Drop files, folders or text and they appear on your other devices in seconds.',
  howto: 'Open DefyShare on both devices on the same Wi-Fi, drop your files, and download them on the other side.',
  speed: 'Transfers start instantly and run at your Wi-Fi speed, with live progress for every file.',
};

const keywordMeta = (p: (typeof KEYWORD_PAGES)[number]) => {
  const core = p.title.split(' — ')[0].split(' | ')[0].replace(/\s*\b20\d\d\b/, '').trim();
  // Skip benefits that repeat a word already in the keyword ("Free File Sharing — Free").
  const benefits = (KEYWORD_BENEFIT[p.category] ?? ['Free']).filter(
    (b) => !b.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.length > 2 && core.toLowerCase().includes(w)),
  );
  const title = pickTitle(...benefits.map((b) => `${core} — ${b} | DefyShare`), `${core} | DefyShare`, core);
  const description = [`${core}: ${KEYWORD_LINE[p.category] ?? KEYWORD_LINE.general}`, CLOSER, 'Free, no sign-up.'];
  return meta(`/${p.slug}`, title, description, p.category === 'general' ? 0.9 : 0.8, 'weekly');
};

const STATIC_PAGES: SeoMeta[] = [
  meta(
    '/',
    'DefyShare: Share Files Between Phone & PC Instantly (Free)',
    ['Send files, folders, photos, videos and text between your phone, laptop and tablet on the same Wi-Fi.', 'No app, no sign-up — just open and drop. 100% free.'],
    1.0,
    'daily',
  ),
  meta('/brand', 'DefyShare Brand Kit — Logos & Embed Badge', ['Download the DefyShare logo, colours and embed badge for your website, article or video. Free to use when linking to DefyShare.'], 0.4),
  meta('/press', 'DefyShare Press Kit — Media Assets & Facts', ['Facts, screenshots and logos for writing about DefyShare, the free browser tool for sharing files between devices on the same Wi-Fi.'], 0.4),
  meta('/about', 'About DefyShare — Free Device-to-Device Sharing', ['DefyShare is a free browser tool for moving files, folders and text between your own devices on the same network. Learn who builds it and why.'], 0.5),
  meta('/privacy', 'Privacy Policy | DefyShare', ['How DefyShare handles the files and text you share: stored temporarily for your network only and permanently deleted after 3 hours.'], 0.3),
  meta('/terms', 'Terms of Use | DefyShare', ['The terms for using DefyShare, the free file and text sharing tool for devices on the same network.'], 0.3),
  meta('/contact', 'Contact DefyShare', ['Questions, feedback or partnership ideas? Get in touch with the DefyShare team.'], 0.3),
];

const alternativeMeta = (c: (typeof COMPETITORS)[number]) =>
  meta(
    `/${c.slug}-alternative`,
    pickTitle(
      `Best ${c.name} Alternative ${SEO_YEAR} — Free, No Sign-Up`,
      `Best ${c.name} Alternative ${SEO_YEAR} — Free | DefyShare`,
      `Best ${c.name} Alternative ${SEO_YEAR} | DefyShare`,
      `${c.name} Alternative ${SEO_YEAR}`,
    ),
    [
      `Looking for ${an(c.name)} ${c.name} alternative?`,
      'DefyShare sends files, folders and text between phone and PC on the same Wi-Fi in seconds.',
      'No app, no account.',
    ],
    0.8,
  );

const vsMeta = (c: (typeof COMPETITORS)[number]) =>
  meta(
    `/vs/${c.slug}`,
    pickTitle(`DefyShare vs ${c.name} (${SEO_YEAR}): Which Is Better?`, `DefyShare vs ${c.name} (${SEO_YEAR})`),
    [
      `DefyShare vs ${c.name} compared on speed, privacy, file limits, platforms and price.`,
      `See which file sharing tool fits you best in ${SEO_YEAR}.`,
    ],
    0.7,
  );

const formatMeta = (f: (typeof FORMATS)[number]) => {
  const label = filesLabel(f.name);
  return meta(
    `/share-${f.slug}-files`,
    pickTitle(`Share ${label} Instantly — Free | DefyShare`, `Share ${label} — Free | DefyShare`, `Share ${label} Free`),
    [`Send ${f.description} between your phone, laptop and tablet over Wi-Fi.`, 'Drag, drop, done — no account, no install.', CLOSER],
    0.8,
  );
};

const industryMeta = (i: (typeof INDUSTRIES)[number]) =>
  meta(
    `/best-file-sharing-for-${i.slug}`,
    pickTitle(
      `Best File Sharing for ${i.name} (${SEO_YEAR}) | DefyShare`,
      `Best File Sharing for ${i.name} (${SEO_YEAR})`,
      `File Sharing for ${i.name} | DefyShare`,
    ),
    [`Fast, private file sharing for ${i.role}.`, 'Move files, folders and links between devices on the same network in seconds.', CLOSER],
    0.7,
  );

const devicePairMeta = (a: (typeof DEVICES)[number], b: (typeof DEVICES)[number]) => {
  const A = titleCase(a.name);
  const B = titleCase(b.name);
  return meta(
    `/share-files-between-${a.slug}-and-${b.slug}`,
    pickTitle(`Share Files Between ${A} and ${B} (${SEO_YEAR})`, `${A} to ${B} File Transfer — Free`, `${A} to ${B} File Transfer`),
    [
      `Send files from ${an(a.name)} ${a.name} to ${an(b.name)} ${b.name} in seconds: open DefyShare on both on the same Wi-Fi and drop your files.`,
      'No cable, no app, no account.',
      'Free.',
    ],
    0.6,
  );
};

const formatDeviceMeta = (f: (typeof FORMATS)[number], d: (typeof DEVICES)[number]) => {
  const label = filesLabel(f.name);
  const D = titleCase(d.name);
  return meta(
    `/share-${f.slug}-from-${d.slug}`,
    pickTitle(`Share ${label} from ${D} — Free | DefyShare`, `Share ${label} from ${D} — Free`, `Share ${label} from ${D}`),
    [`Send ${f.description} from your ${d.name} to any device on the same Wi-Fi.`, `Works in ${d.browser} — no app, no account, no cable.`, 'Free and instant.'],
    0.5,
  );
};

const howToMeta = (f: (typeof FORMATS)[number], d: (typeof DEVICES)[number]) => {
  const label = filesLabel(f.name);
  const D = titleCase(d.name);
  return meta(
    `/how-to-send-${f.slug}-files-on-${d.slug}`,
    pickTitle(`How to Send ${label} on ${D} (${SEO_YEAR})`, `How to Send ${label} on ${D}`, `Send ${label} on ${D}`),
    [`Step-by-step: send ${f.description} from your ${d.name} wirelessly in under a minute.`, `Works in ${d.browser}.`, CLOSER, 'Free, no sign-up.'],
    0.5,
  );
};

const formatIndustryMeta = (f: (typeof FORMATS)[number], i: (typeof INDUSTRIES)[number]) => {
  const label = filesLabel(f.name);
  return meta(
    `/share-${f.slug}-for-${i.slug}`,
    pickTitle(`Share ${label} for ${i.name} | DefyShare`, `Share ${label} for ${i.name}`, `${label} for ${i.name}`),
    [
      [
        `The quick way for ${i.role} to share ${f.description} between devices on the same network.`,
        `The quick way for ${i.role} to share ${filesNoun(f.name)} between devices on the same network.`,
        `The quick way for ${i.name.toLowerCase()} to share ${label} between devices on the same network.`,
      ].find((s) => s.length <= DESC_MAX - 30) ?? `${label} sharing for ${i.name.toLowerCase()} on the same network.`,
      'No account, no install — files auto-delete after 3 hours.',
      'No account, no install.',
    ],
    0.4,
  );
};

let cache: Map<string, SeoMeta> | null = null;

/** Every indexable page, in sitemap order. */
export const allSeoPages = (): SeoMeta[] => {
  const pages: SeoMeta[] = [...STATIC_PAGES];
  for (const p of KEYWORD_PAGES) pages.push(keywordMeta(p));
  for (const c of COMPETITORS) pages.push(alternativeMeta(c), vsMeta(c));
  for (const f of FORMATS) pages.push(formatMeta(f));
  for (const i of INDUSTRIES) pages.push(industryMeta(i));
  for (const a of DEVICES) for (const b of DEVICES) if (a.slug !== b.slug) pages.push(devicePairMeta(a, b));
  for (const f of FORMATS) for (const d of DEVICES) pages.push(formatDeviceMeta(f, d), howToMeta(f, d));
  for (const f of FORMATS) for (const i of INDUSTRIES) pages.push(formatIndustryMeta(f, i));
  // Keyword pages win over generated ones that share a slug.
  const seen = new Set<string>();
  return pages.filter((p) => (seen.has(p.path) ? false : (seen.add(p.path), true)));
};

export const getSeoMeta = (pathname: string): SeoMeta | undefined => {
  if (!cache) cache = new Map(allSeoPages().map((p) => [p.path, p]));
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  return cache.get(path);
};
