// "Send <what> from <device> to <device>" landing pages. Each URL shows the real
// DefyShare app with its own heading, steps for that exact device pair, tips for that
// file type, and links to close variations. Listed in sitemap-1-2k.xml.
// Keep this file free of path aliases and non-erasable TS syntax: Node runs it directly.
import { PLANS_ENABLED } from './features.ts';

export interface IntentPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  steps: string[];
  tips: string[];
  faq: { q: string; a: string }[];
  related: { path: string; label: string }[];
}

type Os = 'ios' | 'android' | 'windows' | 'mac' | 'chromeos' | 'linux';
type Kind = 'phone' | 'tablet' | 'computer';

interface Device {
  slug: string;
  name: string; // in sentences: "your iPhone"
  title: string; // in titles
  os: Os;
  kind: Kind;
  family: string; // pairs inside one family (Windows PC ↔ Windows laptop) are skipped
  open: string;
  pick: string;
  save: string;
}

const DEVICES: Device[] = [
  {
    slug: 'iphone', name: 'iPhone', title: 'iPhone', os: 'ios', kind: 'phone', family: 'iphone',
    open: 'On your iPhone, open Safari and go to defyshare.app.',
    pick: 'On the iPhone, tap Choose files, then Photo Library for pictures and videos or Choose File for anything in the Files app.',
    save: 'On the iPhone, tap the file and choose Download. It lands in Files → Downloads; for photos and videos, open it and tap Share → Save to Photos.',
  },
  {
    slug: 'ipad', name: 'iPad', title: 'iPad', os: 'ios', kind: 'tablet', family: 'ipad',
    open: 'On your iPad, open Safari and go to defyshare.app.',
    pick: 'On the iPad, tap Choose files, then Photo Library or Choose File, or drag files in from the Files app in Split View.',
    save: 'On the iPad, tap the file and choose Download. Find it in Files → Downloads, or use Share → Save to Photos for pictures.',
  },
  {
    slug: 'android', name: 'Android phone', title: 'Android', os: 'android', kind: 'phone', family: 'android',
    open: 'On your Android phone, open Chrome and go to defyshare.app.',
    pick: 'On the Android phone, tap Choose files and pick from Photos, Gallery or Files.',
    save: 'On the Android phone, tap the file and download it. It saves to the Downloads folder, which you can open in the Files app.',
  },
  {
    slug: 'samsung-galaxy', name: 'Samsung Galaxy', title: 'Samsung Galaxy', os: 'android', kind: 'phone', family: 'samsung',
    open: 'On your Samsung Galaxy, open Samsung Internet or Chrome and go to defyshare.app.',
    pick: 'On the Galaxy, tap Choose files and pick from Gallery or My Files.',
    save: 'On the Galaxy, tap the file and download it. Open My Files → Downloads to find it; photos and videos also show in Gallery.',
  },
  {
    slug: 'google-pixel', name: 'Google Pixel', title: 'Google Pixel', os: 'android', kind: 'phone', family: 'pixel',
    open: 'On your Pixel, open Chrome and go to defyshare.app.',
    pick: 'On the Pixel, tap Choose files and pick from Google Photos or Files by Google.',
    save: 'On the Pixel, tap the file and download it. It appears in Files by Google → Downloads.',
  },
  {
    slug: 'android-tablet', name: 'Android tablet', title: 'Android Tablet', os: 'android', kind: 'tablet', family: 'android-tablet',
    open: 'On your Android tablet, open Chrome and go to defyshare.app.',
    pick: 'On the tablet, tap Choose files and pick from Photos, Gallery or Files.',
    save: 'On the tablet, tap the file and download it. It saves to the Downloads folder in the Files app.',
  },
  {
    slug: 'windows-pc', name: 'Windows PC', title: 'Windows PC', os: 'windows', kind: 'computer', family: 'windows',
    open: 'On your Windows PC, open Edge or Chrome and go to defyshare.app.',
    pick: 'On the PC, drag files from File Explorer onto the page, or click Choose files. You can also paste with Ctrl+V.',
    save: 'On the PC, click Download. Files go to your Downloads folder (File Explorer → Downloads).',
  },
  {
    slug: 'windows-laptop', name: 'Windows laptop', title: 'Windows Laptop', os: 'windows', kind: 'computer', family: 'windows',
    open: 'On your Windows laptop, open Edge or Chrome and go to defyshare.app.',
    pick: 'On the laptop, drag files from File Explorer onto the page or click Choose files.',
    save: 'On the laptop, click Download. Files go to File Explorer → Downloads.',
  },
  {
    slug: 'mac', name: 'Mac', title: 'Mac', os: 'mac', kind: 'computer', family: 'mac',
    open: 'On your Mac, open Safari or Chrome and go to defyshare.app.',
    pick: 'On the Mac, drag files from Finder onto the page, or click Choose files. Cmd+V pastes copied files and screenshots.',
    save: 'On the Mac, click Download. Files go to the Downloads folder in Finder (or the Dock).',
  },
  {
    slug: 'macbook', name: 'MacBook', title: 'MacBook', os: 'mac', kind: 'computer', family: 'mac',
    open: 'On your MacBook, open Safari or Chrome and go to defyshare.app.',
    pick: 'On the MacBook, drag files from Finder onto the page or click Choose files.',
    save: 'On the MacBook, click Download. Files go to Finder → Downloads.',
  },
  {
    slug: 'chromebook', name: 'Chromebook', title: 'Chromebook', os: 'chromeos', kind: 'computer', family: 'chromebook',
    open: 'On your Chromebook, open Chrome and go to defyshare.app.',
    pick: 'On the Chromebook, drag files from the Files app onto the page or click Choose files.',
    save: 'On the Chromebook, click Download. Files go to the Files app → Downloads.',
  },
  {
    slug: 'linux', name: 'Linux PC', title: 'Linux', os: 'linux', kind: 'computer', family: 'linux',
    open: 'On your Linux PC, open Firefox or Chrome and go to defyshare.app.',
    pick: 'On Linux, drag files from your file manager onto the page or click Choose files.',
    save: 'On Linux, click Download. Files go to ~/Downloads.',
  },
];

interface Content {
  slug: string;
  name: string; // "photos"
  title: string; // "Photos"
  size: string; // typical size sentence
  hook: string; // short benefit for the snippet
  sizeFree?: string; // size sentence while paid plans are switched off
  hookFree?: string;
  plan: 'free' | 'plus' | 'pro';
  tips: string[];
  from?: (d: Device) => boolean;
  to?: (d: Device) => boolean;
}

const isApple = (d: Device) => d.os === 'ios' || d.os === 'mac';
const isMobile = (d: Device) => d.kind !== 'computer';
const isAndroid = (d: Device) => d.os === 'android';

const CONTENTS: Content[] = [
  {
    slug: 'photos', hook: 'in full resolution', name: 'photos', title: 'Photos', plan: 'free',
    size: 'A phone photo is usually 2–6 MB, so dozens fit in one go on the free plan.', sizeFree: 'A phone photo is usually 2–6 MB, so dozens fit in one go.',
    tips: ['Photos are sent as the original file, so they keep full resolution and their date and location info.', 'Select many photos at once; they upload in parallel.'],
  },
  {
    slug: 'videos', hook: 'in the quality you recorded', name: 'videos', title: 'Videos', plan: 'plus',
    size: 'A minute of 1080p phone video is about 60–130 MB, so longer clips need Plus (500 MB) or Pro (3 GB).', sizeFree: 'Each video can be up to 30 MB, about 15–30 seconds of 1080p phone video. Trim or split longer clips first.',
    tips: ['Videos are never re-compressed, so they arrive in the same quality you recorded.', 'Keep the screen on while a big video uploads; phones can pause uploads when they lock.'],
  },
  {
    slug: '4k-videos', hook: 'up to 3 GB per file', hookFree: 'in original quality', name: '4K videos', title: '4K Videos', plan: 'pro',
    size: 'A minute of 4K video is roughly 170–400 MB, so Pro (up to 3 GB per file) is the plan for long 4K clips.', sizeFree: 'Each file can be up to 30 MB, which is a few seconds of 4K. Export longer clips at 1080p or split them first.',
    tips: ['4K files upload in parallel 8 MB parts, so they upload as fast as your internet connection allows.', 'Plug the phone in for long 4K uploads so it doesn’t sleep halfway.'],
  },
  {
    slug: 'screenshots', hook: 'pixel-perfect', name: 'screenshots', title: 'Screenshots', plan: 'free',
    size: 'Screenshots are small (under 5 MB), so the free plan is plenty.', sizeFree: 'Screenshots are small (under 5 MB), so you can send lots at once.',
    tips: ['On a computer, copy a screenshot and press Ctrl+V or Cmd+V on the page to send it instantly.', 'Screenshots keep their exact pixels, which makes them sharp for bug reports and slides.'],
  },
  {
    slug: 'heic-photos', hook: 'as HEIC or JPG', name: 'HEIC photos', title: 'HEIC Photos', plan: 'free',
    from: (d) => d.os === 'ios',
    size: 'HEIC photos are small, usually 1–3 MB each.',
    tips: ['When you pick from the Photo Library, iOS often converts HEIC to JPG for you. To keep the original HEIC, save it to Files first and pick it with Choose File.', 'If the other device can’t open HEIC, set iPhone Settings → Camera → Formats → Most Compatible to shoot JPG instead.'],
  },
  {
    slug: 'raw-photos', hook: 'byte-for-byte, no lost edits', name: 'RAW photos', title: 'RAW Photos', plan: 'plus',
    size: 'RAW and ProRAW files are 25–75 MB each, so they need Plus (500 MB) or Pro.', sizeFree: 'Each file can be up to 30 MB, which covers most RAW files from phones and older cameras; very large RAWs are best exported to JPG first.',
    tips: ['RAW files (DNG, CR3, NEF, ARW) are sent byte-for-byte, so no editing data is lost.', 'Send a whole shoot at once; every file shows its own progress.'],
  },
  {
    slug: 'pdf-files', hook: 'ready to open', name: 'PDF files', title: 'PDF Files', plan: 'free',
    size: 'Most PDFs are under 30 MB, so the free plan covers them; scanned books may need Plus.', sizeFree: 'Most PDFs are under the 30 MB per-file limit; compress big scans first.',
    tips: ['Tap Open on the other device to view the PDF right in the browser before downloading.', 'Signed and filled-in PDFs arrive exactly as they are.'],
  },
  {
    slug: 'word-documents', hook: 'with formatting intact', name: 'Word documents', title: 'Word Documents', plan: 'free',
    size: 'Word files are usually well under 30 MB.',
    tips: ['Comments, tracked changes and formatting stay intact because the .docx file isn’t converted.', 'Need just the text? Paste it into the Text tab instead.'],
  },
  {
    slug: 'excel-spreadsheets', hook: 'with formulas intact', name: 'Excel spreadsheets', title: 'Excel Spreadsheets', plan: 'free',
    size: 'Spreadsheets are usually a few MB.',
    tips: ['Formulas, sheets and macros stay in the .xlsx file exactly as saved.', 'CSV exports work too, and open on any device.'],
  },
  {
    slug: 'powerpoint-presentations', hook: 'with videos and fonts intact', name: 'PowerPoint presentations', title: 'PowerPoint Slides', plan: 'free',
    size: 'Decks with video can pass 30 MB; Plus covers up to 500 MB.', sizeFree: 'Each file can be up to 30 MB; compress embedded videos in big decks first.',
    tips: ['Embedded videos and fonts stay in the file, so the deck plays the same on the other device.', 'Handy right before a meeting: send the deck from your laptop to the room PC in seconds.'],
  },
  {
    slug: 'zip-files', hook: 'ZIP, RAR or 7z as-is', name: 'ZIP files', title: 'ZIP Files', plan: 'free',
    size: 'Small ZIPs fit the free plan; big archives need Plus (500 MB) or Pro (3 GB).', sizeFree: 'Each archive can be up to 30 MB; split bigger ones into parts.',
    tips: ['ZIP, RAR and 7z files are sent as-is, without being unpacked.', 'Zipping many tiny files first can make a big batch faster to send.'],
  },
  {
    slug: 'music', hook: 'with tags and cover art', name: 'music', title: 'Music & MP3s', plan: 'free',
    size: 'An MP3 song is about 3–10 MB; lossless FLAC is 20–50 MB.',
    tips: ['MP3, M4A, FLAC and WAV files keep their tags and cover art.', 'Send a whole album at once by picking all the tracks.'],
  },
  {
    slug: 'voice-recordings', hook: 'in original audio quality', name: 'voice recordings', title: 'Voice Recordings', plan: 'free',
    from: isMobile,
    size: 'Voice memos are small, usually under 10 MB even for long recordings.',
    tips: ['On iPhone, open Voice Memos, tap ••• → Save to Files, then pick it in DefyShare.', 'Recordings keep their original quality for transcription or editing.'],
  },
  {
    slug: 'apk-files', hook: 'ready to install', name: 'APK files', title: 'APK Files', plan: 'free',
    to: isAndroid,
    size: 'Most APKs are 10–150 MB; bigger games need Plus.', sizeFree: 'Each APK can be up to 30 MB, which covers most apps.',
    tips: ['After downloading, Android may ask you to allow installs from your browser.', 'Only install APKs you trust.'],
  },
  {
    slug: 'folders', hook: 'with every subfolder', name: 'folders', title: 'Folders', plan: 'free',
    from: (d) => d.kind === 'computer',
    size: 'Each file in the folder counts on its own against your plan’s per-file limit.', sizeFree: 'Each file in the folder can be up to 30 MB.',
    tips: ['Click Folder (or drop a folder) and every file inside uploads with its subfolder path.', 'Use Download all on the other device to grab everything at once.'],
  },
  {
    slug: 'text-and-links', hook: 'and copy it with one tap', name: 'text and links', title: 'Text & Links', plan: 'free',
    size: 'Text up to 10,000 characters is free.',
    tips: ['Paste into the Text tab and press Send; links turn into tappable chips on the other device.', 'Great for passwords you’d otherwise retype, Wi-Fi codes, addresses and long URLs.'],
  },
  {
    slug: 'large-files', hook: 'up to 3 GB per file', hookFree: 'with live progress', name: 'large files', title: 'Large Files', plan: 'pro',
    size: 'Free sends up to 30 MB per file, Plus up to 500 MB and Pro up to 3 GB.', sizeFree: 'Each file can be up to 30 MB; split or compress anything bigger.',
    tips: ['Large files upload in parallel parts and retry by themselves if Wi-Fi drops for a moment.', 'Keep both devices on the same Wi-Fi network for the fastest transfer.'],
  },
  {
    slug: 'screen-recordings', hook: 'in full quality', name: 'screen recordings', title: 'Screen Recordings', plan: 'plus',
    size: 'A few minutes of screen recording is often 50–300 MB, which fits Plus.', sizeFree: 'Each recording can be up to 30 MB, about a minute of a typical screen recording.',
    tips: ['Recordings arrive in full quality, without the compression chat apps add.', 'Use Open on the other device to watch it before downloading.'],
  },
  {
    slug: 'ebooks', hook: 'EPUB, MOBI or PDF', name: 'eBooks', title: 'eBooks (EPUB & PDF)', plan: 'free',
    size: 'EPUB books are usually under 10 MB.',
    tips: ['EPUB, MOBI and PDF books open in Apple Books, Google Play Books or any reader app after download.', 'Send a whole series at once by selecting every file.'],
  },
];

/** A cross-platform note for the pair, so each page explains its own situation. */
const pairNote = (a: Device, b: Device) => {
  if (a.os === 'ios' && b.os === 'windows') return 'AirDrop doesn’t work between Apple devices and Windows, and iTunes or a cable is slow. DefyShare runs in the browser on both, so nothing needs installing.';
  if (a.os === 'windows' && b.os === 'ios') return 'Windows has no AirDrop to iPhone or iPad. With DefyShare you drop the file on the PC and it shows up in Safari a second later.';
  if (a.os === 'android' && b.os === 'mac') return 'Macs don’t support Android File Transfer well anymore, and Quick Share isn’t built into macOS. DefyShare works in Chrome and Safari with no cable.';
  if (a.os === 'mac' && b.os === 'android') return 'AirDrop can’t send to Android. DefyShare moves files from Finder to your phone over Wi-Fi instead.';
  if (isApple(a) && isApple(b)) return 'AirDrop works between Apple devices, but it can fail with older models, managed devices or strangers’ iPhones. DefyShare is a reliable fallback that also works with non-Apple devices.';
  if (a.os === 'android' && b.os === 'android') return 'Quick Share works between many Android phones but not all brands. DefyShare works on any Android with a browser.';
  if (isAndroid(a) && b.os === 'windows') return 'Phone Link and Quick Share for Windows need setup and sign-in. DefyShare just needs Chrome on the phone and any browser on the PC.';
  if (a.os === 'windows' && isAndroid(b)) return 'No USB cable or driver needed: drop files on the PC and download them on the phone.';
  if (a.os === 'ios' && isAndroid(b)) return 'AirDrop doesn’t reach Android phones. DefyShare works in Safari and Chrome, so it bridges iPhone and Android.';
  if (isAndroid(a) && b.os === 'ios') return 'Quick Share doesn’t work with iPhones. DefyShare works in Chrome on Android and Safari on iOS.';
  if (a.os === 'chromeos' || b.os === 'chromeos') return 'Chromebooks don’t have AirDrop or Quick Share with every device. DefyShare runs in Chrome, so it works with phones and computers alike.';
  if (a.os === 'linux' || b.os === 'linux') return 'Linux has no built-in way to share with phones. DefyShare runs in Firefox or Chrome, nothing to install.';
  return 'Both devices just need a browser and the same Wi-Fi, no cable, app or account.';
};

const sizeOf = (c: Content) => (PLANS_ENABLED ? c.size : c.sizeFree ?? c.size);
const hookOf = (c: Content) => (PLANS_ENABLED ? c.hook : c.hookFree ?? c.hook);
const LIMITS = PLANS_ENABLED
  ? 'Free sends up to 30 MB per file, Plus up to 500 MB and Pro up to 3 GB.'
  : 'Each file can be up to 30 MB.';
const planLine = (c: Content) =>
  !PLANS_ENABLED ? 'Free, up to 30 MB per file.'
    : c.plan === 'free' ? 'The free plan covers it.' : c.plan === 'plus' ? 'Bigger files need Plus (500 MB).' : 'Pro handles files up to 3 GB.';

const TITLE_MAX = 60;
const DESC_MAX = 158;
const pickTitle = (...c: string[]) => c.find((t) => t.length <= TITLE_MAX) ?? c.reduce((a, b) => (b.length < a.length ? b : a));
const fitDesc = (...sentences: string[]) => {
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length <= DESC_MAX) out = next;
  }
  return out || sentences[0].slice(0, DESC_MAX);
};

const pairOk = (a: Device, b: Device) => {
  if (a.slug === b.slug || a.family === b.family) return false;
  // "Android phone" next to a specific Android brand is the same search; keep the brand pages.
  const generic = (d: Device) => d.slug === 'android';
  if ((generic(a) && isAndroid(b) && b.kind === 'phone') || (generic(b) && isAndroid(a) && a.kind === 'phone')) return false;
  return true;
};

const contentPath = (c: Content, a: Device, b: Device) => `/send-${c.slug}-from-${a.slug}-to-${b.slug}`;
const pairPath = (a: Device, b: Device) => `/send-files-from-${a.slug}-to-${b.slug}`;
const hubPath = (c: Content) => `/send-${c.slug}-between-devices`;

const fits = (c: Content, a: Device, b: Device) => (!c.from || c.from(a)) && (!c.to || c.to(b));

const contentPage = (c: Content, a: Device, b: Device, contents: Content[]): IntentPage => {
  const verb = c.slug === 'text-and-links' ? 'Send' : 'Transfer';
  const title = pickTitle(
    `Send ${c.title} from ${a.title} to ${b.title} — No App, No Cable`,
    `Send ${c.title} from ${a.title} to ${b.title} — No App`,
    `${verb} ${c.title} ${a.title} to ${b.title} — Free`,
    `${c.title} from ${a.title} to ${b.title}`,
    `${c.title}: ${a.title} → ${b.title}`,
  );
  const description = fitDesc(
    `${c.title} from your ${a.name} to your ${b.name} in seconds, ${hookOf(c)}.`,
    'Open defyshare.app on both on the same Wi-Fi and drop.',
    'No app, no cable, no sign-up.',
    c.plan === 'free' || !PLANS_ENABLED ? 'Free.' : planLine(c),
  );
  const siblings = contents.filter((x) => x.slug !== c.slug && fits(x, a, b)).slice(0, 4);
  const related = [
    ...siblings.map((x) => ({ path: contentPath(x, a, b), label: `${x.title} from ${a.title} to ${b.title}` })),
    ...(fits(c, b, a) && pairOk(b, a) ? [{ path: contentPath(c, b, a), label: `${c.title} from ${b.title} to ${a.title}` }] : []),
    { path: pairPath(a, b), label: `Any file from ${a.title} to ${b.title}` },
    { path: hubPath(c), label: `${c.title} between any devices` },
  ];
  return {
    path: contentPath(c, a, b),
    title,
    description,
    h1: `Send ${c.name} from ${a.name} to ${b.name}`,
    intro: `${pairNote(a, b)} ${sizeOf(c)}`,
    steps: [
      `${a.open} ${b.open.replace(/^On your /, 'Do the same on your ')}`,
      'Make sure both are on the same Wi-Fi. They join the same private room automatically; no code or pairing.',
      a.pick,
      b.save,
    ],
    tips: [...c.tips, 'Everything you share is deleted automatically after 3 hours.'],
    faq: [
      {
        q: `Do I need an app to send ${c.name} from ${a.name} to ${b.name}?`,
        a: `No. DefyShare runs in the browser on both devices, so there is nothing to install and no account to make.`,
      },
      {
        q: `Will the ${c.name} lose quality?`,
        a: `No. The original file is sent as-is, never compressed. ${sizeOf(c)}`,
      },
      {
        q: `What if my ${b.name} doesn’t show up?`,
        a: `Check both devices are on the same Wi-Fi (not mobile data or a guest network) and that defyshare.app is open on each. Reload the page if it was open before switching networks.`,
      },
    ],
    related,
  };
};

const pairPage = (a: Device, b: Device, contents: Content[]): IntentPage => ({
  path: pairPath(a, b),
  title: pickTitle(
    `Send Files from ${a.title} to ${b.title} — No Cable, No App`,
    `Send Files from ${a.title} to ${b.title} — Free`,
    `Files from ${a.title} to ${b.title}`,
  ),
  description: fitDesc(
    `Move photos, videos, documents and text from your ${a.name} to your ${b.name} over Wi-Fi.`,
    'Open defyshare.app on both and drop the files. Free, no sign-up.',
  ),
  h1: `Send files from ${a.name} to ${b.name}`,
  intro: `${pairNote(a, b)} Photos, videos, documents, ZIPs and text all work.`,
  steps: [
    `${a.open} ${b.open.replace(/^On your /, 'Do the same on your ')}`,
    'Keep both on the same Wi-Fi so they join the same private room.',
    a.pick,
    b.save,
  ],
  tips: [
    'Use Send to if you only want one device, or a group, to get the files.',
    LIMITS,
    'Everything you share is deleted automatically after 3 hours.',
  ],
  faq: [
    { q: `Is it free to send files from ${a.name} to ${b.name}?`, a: PLANS_ENABLED ? 'Yes. Files up to 30 MB each are free with no account. Plus and Pro raise the limit.' : 'Yes. It is free with no account; each file can be up to 30 MB.' },
    { q: 'Do both devices need to be on the same Wi-Fi?', a: 'Yes. Devices on the same network are grouped into one private room automatically.' },
  ],
  related: contents
    .filter((c) => fits(c, a, b))
    .slice(0, 8)
    .map((c) => ({ path: contentPath(c, a, b), label: `${c.title} from ${a.title} to ${b.title}` })),
});

const hubPage = (c: Content, pairs: [Device, Device][]): IntentPage => ({
  path: hubPath(c),
  title: pickTitle(`Send ${c.title} Between Phone & PC — No App, Free`, `Send ${c.title} Between Devices — Free`, `Send ${c.title} Between Devices`),
  description: fitDesc(
    `Send ${c.name} between iPhone, Android, Windows, Mac and Chromebook over Wi-Fi in original quality.`,
    planLine(c),
    'No app, no sign-up.',
  ),
  h1: `Send ${c.name} between any of your devices`,
  intro: `${sizeOf(c)} DefyShare works in the browser on phones, tablets and computers.`,
  steps: [
    'Open defyshare.app on both devices.',
    'Keep them on the same Wi-Fi so they join the same private room.',
    `Pick the ${c.name} on one device; they appear on the other in seconds.`,
    'Tap or click Download on the receiving device.',
  ],
  tips: [...c.tips, 'Everything you share is deleted automatically after 3 hours.'],
  faq: [{ q: `What is the size limit for ${c.name}?`, a: LIMITS }],
  related: pairs
    .filter(([a, b]) => fits(c, a, b))
    .slice(0, 12)
    .map(([a, b]) => ({ path: contentPath(c, a, b), label: `${a.title} to ${b.title}` })),
});

let cache: IntentPage[] | null = null;

export const allIntentPages = (): IntentPage[] => {
  if (cache) return cache;
  const pairs: [Device, Device][] = [];
  for (const a of DEVICES) for (const b of DEVICES) if (pairOk(a, b)) pairs.push([a, b]);
  const pages: IntentPage[] = [];
  for (const c of CONTENTS) for (const [a, b] of pairs) if (fits(c, a, b)) pages.push(contentPage(c, a, b, CONTENTS));
  for (const [a, b] of pairs) pages.push(pairPage(a, b, CONTENTS));
  for (const c of CONTENTS) pages.push(hubPage(c, pairs));
  cache = pages;
  return pages;
};

let byPath: Map<string, IntentPage> | null = null;
export const getIntentPage = (path: string) => {
  if (!byPath) byPath = new Map(allIntentPages().map((p) => [p.path, p]));
  return byPath.get(path.replace(/\/$/, ''));
};
