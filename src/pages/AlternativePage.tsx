import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import { COMPETITORS, DEFYSHARE_FEATURES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TableOfContents } from '@/components/TableOfContents';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

const TOC_ITEMS = [
  { id: 'what-is', label: 'What is it?' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'why-defyshare', label: 'Why DefyShare?' },
  { id: 'comparison', label: 'Feature Comparison' },
  { id: 'how-to-switch', label: 'How to Switch' },
  { id: 'faq', label: 'FAQ' },
];

export default function AlternativePage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const competitorSlug = slug.replace(/-alternative$/, '');
  const competitor = COMPETITORS.find((c) => c.slug === competitorSlug);

  if (!competitor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/90 mb-2">Page not found</p>
          <Link to="/" className="text-primary hover:underline">
            Go to DefyShare →
          </Link>
        </div>
      </div>
    );
  }

  const defaultTitle = `Best ${competitor.name} Alternative in 2026 — DefyShare`;
  const defaultDescription = `Looking for a ${competitor.name} alternative? DefyShare is a free, browser-based P2P file sharing app with no file size limits, no account required, and zero cloud uploads.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/${competitor.slug}-alternative`;

  const faqs = [
    {
      question: `Is DefyShare a good ${competitor.name} alternative?`,
      answer: `Yes. DefyShare offers everything ${competitor.name} does — and more — completely free, with no account requirement, no file size limits, and true peer-to-peer transfers that never touch a server.`,
    },
    {
      question: `Does DefyShare require an account like ${competitor.name}?`,
      answer: `No. DefyShare works instantly in any modern browser with zero sign-up. Just open the app on two devices on the same network and start transferring files.`,
    },
    {
      question: `What is the file size limit in DefyShare compared to ${competitor.name}?`,
      answer: `DefyShare has no file size limit. Files are transferred directly between devices using WebRTC, so they are never uploaded to a server and are only limited by your device's storage.`,
    },
  ];

  const relatedLinks = [
    {
      label: `DefyShare vs ${competitor.name}`,
      href: `/vs/${competitor.slug}`,
      description: `Side-by-side comparison of features and performance`,
    },
    {
      label: 'Share files between Windows and Mac',
      href: '/share-files-between-windows-and-macos',
      description: 'Cross-platform local file transfer guide',
    },
    {
      label: 'Share large video files instantly',
      href: '/share-mp4-files',
      description: 'Transfer MP4 and MKV files with no size limit',
    },
    {
      label: 'Best file sharing for developers',
      href: '/best-file-sharing-for-developers',
      description: 'P2P tools built for engineering workflows',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        ogTitle={title}
        ogDescription={description}
      />
      <JsonLd
        schema={[
          buildWebAppSchema(),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://defyshare.app' },
            { name: 'Alternatives', url: 'https://defyshare.app/alternatives' },
            {
              name: `${competitor.name} Alternative`,
              url: canonical,
            },
          ]),
          buildFaqSchema(faqs),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb
          items={[
            { label: 'Alternatives', href: '/alternatives' },
            { label: `${competitor.name} Alternative` },
          ]}
        />

        <div className="flex gap-12">
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium mb-4">
                <Zap className="w-3 h-3" />
                Free {competitor.name} Alternative
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Best {competitor.name} Alternative in 2026
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {competitor.name} is {competitor.description}. While it works well, many users need
                something faster, more private, and completely free. <strong className="text-foreground/90">DefyShare</strong> delivers
                all of that — directly in your browser, with no installs, no accounts, and no cloud uploads.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors"
              >
                Try DefyShare Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* What is competitor */}
            <section id="what-is" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                What is {competitor.name}?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {competitor.name} is {competitor.description}. It has been a popular choice for
                quick file transfers, but it comes with constraints that increasingly frustrate users
                in professional and everyday use cases.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                As your file transfer needs grow — whether you're dealing with large video files,
                confidential documents, or cross-platform teams — the limitations of {competitor.name}{' '}
                become more apparent. That's why thousands of users search for a {competitor.name}{' '}
                alternative every month.
              </p>
            </section>

            {/* Limitations */}
            <section id="limitations" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Why People Look for a {competitor.name} Alternative
              </h2>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 mb-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground/90 mb-1">Key Limitation of {competitor.name}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {competitor.name} {competitor.limitation}. This means that professionals
                      dealing with large files, sensitive data, or cross-platform environments often
                      hit a wall.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  `File transfer slowdowns when using ${competitor.name} over internet connections`,
                  `Privacy concerns about files being routed through third-party infrastructure`,
                  `Account requirements or app installations creating friction for recipients`,
                  `File size restrictions blocking transfer of large videos, CAD files, and datasets`,
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Why DefyShare */}
            <section id="why-defyshare" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Why DefyShare is the Best {competitor.name} Alternative
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                DefyShare uses WebRTC peer-to-peer technology to transfer files directly between
                devices on the same local network. This means your files never touch our servers
                — they go straight from one device to the other at the full speed of your local
                network (often 100–1000 Mbps).
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-amber-500" />,
                    title: 'Blazing Fast',
                    desc: 'Transfer at full LAN speed — up to 1 Gbps on modern networks',
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-green-600" />,
                    title: 'Truly Private',
                    desc: 'P2P transfer — zero data uploaded to any server',
                  },
                  {
                    icon: <Globe className="w-5 h-5 text-primary" />,
                    title: 'Universal',
                    desc: 'Works on Windows, Mac, Linux, iOS, and Android',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="mb-3">{card.icon}</div>
                    <p className="font-semibold text-foreground/90 mb-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Comparison table */}
            <section id="comparison" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                DefyShare vs {competitor.name}: Feature Comparison
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="text-left px-4 py-3 font-semibold text-foreground/80">Feature</th>
                      <th className="text-center px-4 py-3 font-semibold text-primary">DefyShare</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                        {competitor.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEFYSHARE_FEATURES.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={`border-b border-border/60 ${i % 2 === 0 ? 'bg-card/50' : ''}`}
                      >
                        <td className="px-4 py-3 text-foreground/80">
                          <div>{row.feature}</div>
                          <div className="text-xs text-muted-foreground">{row.description}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* How to switch */}
            <section id="how-to-switch" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                How to Switch from {competitor.name} to DefyShare
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Switching from {competitor.name} to DefyShare takes less than 30 seconds. There is
                nothing to uninstall, no data to migrate, and no settings to configure.
              </p>
              <ol className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Open DefyShare on the sending device',
                    desc: `Open defyshare.app in Chrome, Safari, Firefox, or Edge on the device you want to send files from. No account or download required.`,
                  },
                  {
                    step: '2',
                    title: 'Open DefyShare on the receiving device',
                    desc: 'On the other device, open the same URL. Both devices must be on the same Wi-Fi or local network. They will automatically discover each other.',
                  },
                  {
                    step: '3',
                    title: 'Drag and drop your files',
                    desc: 'Drag any file — regardless of size — onto the DefyShare drop zone and it will transfer instantly at full local network speed.',
                  },
                  {
                    step: '4',
                    title: 'Done — files arrive instantly',
                    desc: 'The receiving device gets a notification and can download the file. The entire transfer happens peer-to-peer with no upload to any cloud.',
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/90 mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-xl border border-border bg-card/70 p-5"
                  >
                    <h3 className="font-semibold text-foreground/90 mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <ReviewTrust />
            <InternalLinks links={relatedLinks} />

            {/* CTA */}
            <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Ready to try the best {competitor.name} alternative?
              </h2>
              <p className="text-muted-foreground mb-6">
                No sign-up. No download. No file size limits. Just open and share.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 transition-colors"
              >
                Start Using DefyShare Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <TableOfContents items={TOC_ITEMS} />
        </div>
      </div>
    </div>
  );
}
