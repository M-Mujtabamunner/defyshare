import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Shield, Globe, Wifi } from 'lucide-react';
import { KEYWORD_PAGES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';
import NotFound from './NotFound';

const ICON_MAP: Record<string, React.ReactNode> = {
  general: <Globe className="w-5 h-5 text-violet-400" />,
  feature: <Shield className="w-5 h-5 text-green-400" />,
  speed: <Zap className="w-5 h-5 text-yellow-400" />,
  platform: <Wifi className="w-5 h-5 text-blue-400" />,
  howto: <CheckCircle2 className="w-5 h-5 text-violet-400" />,
};

export default function KeywordLandingPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const page = KEYWORD_PAGES.find((p) => p.slug === slug);

  if (!page) return <NotFound />;

  const canonical = `https://defyshare.app/${page.slug}`;

  const faqs = [
    {
      question: `What makes DefyShare better than other tools for ${page.h1.split('—')[0].trim()}?`,
      answer: `DefyShare combines the speed of local network transfers (up to 1 Gbps), the privacy of peer-to-peer connections (zero server storage), and the convenience of a browser app (no download, no account) — a combination no other tool offers for free.`,
    },
    {
      question: 'Does DefyShare work on all devices and operating systems?',
      answer: 'Yes. DefyShare works in any modern browser on Windows, macOS, Linux, Android, iOS, iPadOS, and ChromeOS. No native app installation is required on any platform.',
    },
    {
      question: 'Is DefyShare completely free with no hidden fees?',
      answer: 'DefyShare is 100% free with no premium tier, no storage subscription, no per-transfer fee, and no file size limit. It is funded independently and does not monetize your data.',
    },
  ];

  const relatedLinks = page.relatedSlugs.slice(0, 4).map((relSlug) => {
    const rel = KEYWORD_PAGES.find((p) => p.slug === relSlug);
    return {
      label: rel ? rel.h1.split('—')[0].trim() : relSlug,
      href: `/${relSlug}`,
      description: rel ? rel.description.split('—')[0].trim() : '',
    };
  });

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100">
      <SeoHead
        title={page.title}
        description={page.description}
        canonical={canonical}
        ogTitle={page.title}
        ogDescription={page.description}
      />
      <JsonLd schema={[
        buildWebAppSchema(),
        buildBreadcrumbSchema([
          { name: 'Home', url: 'https://defyshare.app' },
          { name: page.h1.split('—')[0].trim(), url: canonical },
        ]),
        buildFaqSchema(faqs),
      ]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: page.h1.split('—')[0].trim() }]} />

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {ICON_MAP[page.category]}
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              {page.category === 'howto' ? 'How-To Guide' : page.category.charAt(0).toUpperCase() + page.category.slice(1)}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 mb-4">
            {page.h1}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            {page.intro}
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 transition-colors">
            Try DefyShare Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Why DefyShare is the Answer
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: 'Full LAN Speed', desc: 'Up to 1 Gbps — no server upload bottleneck' },
              { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'Zero Cloud Storage', desc: 'Files never touch any server — fully private' },
              { icon: <CheckCircle2 className="w-5 h-5 text-violet-400" />, title: 'No Size Limit', desc: 'Transfer any file, any size, completely free' },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="mb-2">{card.icon}</div>
                <p className="font-semibold text-zinc-200 text-sm mb-1">{card.title}</p>
                <p className="text-xs text-zinc-400">{card.desc}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {[
              'Open in any browser — Chrome, Safari, Firefox, or Edge — on any device',
              'No account creation, no email verification, no app download',
              'Files transfer directly P2P using WebRTC over your local network',
              'TLS 1.3 encryption protects every transfer',
              'Works without internet — only needs local WiFi',
              'Real-time text sharing alongside file transfers',
              'Transfer history stored locally in your browser',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-zinc-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">How to Get Started in 30 Seconds</h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Open DefyShare on the sending device', desc: 'Go to defyshare.app in any browser. No download, no account, no permission dialogs.' },
              { step: '2', title: 'Open DefyShare on the receiving device', desc: 'Open the same URL on any other device on the same Wi-Fi or local network. Devices connect automatically.' },
              { step: '3', title: 'Drag and drop your files', desc: 'Drop files onto the DefyShare interface. Multiple files, folders, and files of any size are all supported.' },
              { step: '4', title: 'Files arrive instantly', desc: 'The receiving device gets the files at full local network speed — up to 1 Gbps. No upload delay, no compression.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-zinc-200 mb-1">{item.title}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h3 className="font-semibold text-zinc-200 mb-2">{faq.question}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <ReviewTrust />

        {relatedLinks.length > 0 && <InternalLinks links={relatedLinks} title="Related Guides" />}

        <div className="mt-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-900/20 border border-violet-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">{page.h1.split('—')[0].trim()}</h2>
          <p className="text-zinc-400 mb-6">Open DefyShare and start in seconds — no account, no download, no limits.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 transition-colors">
            Open DefyShare Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
