import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Zap, Shield, Globe, ArrowRight, Info } from 'lucide-react';
import { COMPETITORS, DEFYSHARE_FEATURES, FILE_LIMIT, RETENTION, HOW_IT_WORKS } from '@/data/seoData';
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
  const defaultDescription = `Looking for a ${competitor.name} alternative? DefyShare is a free browser tool for sharing files, text and links between devices on the same Wi-Fi — no account, no install.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/${competitor.slug}-alternative`;

  const faqs = [
    {
      question: `Is DefyShare a good ${competitor.name} alternative?`,
      answer: `It is a good alternative for moving everyday files between your own devices on the same Wi-Fi: no account, no install, and devices find each other automatically. ${competitor.name} is the better choice if you need what it does best — it ${competitor.strength}.`,
    },
    {
      question: `Does DefyShare require an account like ${competitor.name}?`,
      answer: `No. DefyShare works in any modern browser with no sign-up. Open it on two devices on the same network and they join the same room automatically.`,
    },
    {
      question: `What is the file size limit in DefyShare compared to ${competitor.name}?`,
      answer: `Each file can be up to ${FILE_LIMIT} on DefyShare, and you can send many files or a whole folder at once. Files are uploaded over HTTPS to temporary cloud storage and deleted after ${RETENTION}. If you regularly send files bigger than ${FILE_LIMIT}, ${competitor.name} or another large-file tool may suit you better.`,
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
      label: 'Share video clips',
      href: '/share-mp4-files',
      description: `Send MP4 clips up to ${FILE_LIMIT} each`,
    },
    {
      label: 'Best file sharing for developers',
      href: '/best-file-sharing-for-developers',
      description: 'Move logs, snippets and builds between machines',
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
                something quicker for everyday hand-offs between their own devices. <strong className="text-foreground/90">DefyShare</strong> runs
                in your browser with no installs and no accounts — devices on the same Wi-Fi find each other automatically.
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
                No tool fits every job. {competitor.name} is strong where it{' '}
                {competitor.strength}. But for the quick, everyday job of getting a photo, document or
                link from one of your devices to another, its setup can feel like more than the task needs.
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
                      {competitor.name} {competitor.limitation}. For quick hand-offs between nearby
                      devices, that adds steps.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  `Signing in, pairing or installing an app just to move one file`,
                  `Copying links or emailing files to yourself`,
                  `Old files piling up in storage after a one-off transfer`,
                  `Different tools for different operating systems`,
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
                {HOW_IT_WORKS} There is nothing to install and no account to create.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-amber-500" />,
                    title: 'No Setup',
                    desc: 'Devices on the same Wi-Fi join one room automatically — no codes or pairing',
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-green-600" />,
                    title: 'Nothing Lingers',
                    desc: `HTTPS transfers, no account, and every file deleted after ${RETENTION}`,
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
              <div className="mt-6 rounded-xl border border-border bg-card/70 p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground/90">When {competitor.name} is the better pick:</strong>{' '}
                  {competitor.name} {competitor.strength}. DefyShare needs an internet connection and
                  handles files up to {FILE_LIMIT} each, so use {competitor.name} for jobs beyond that.
                </p>
              </div>
            </section>

            {/* Comparison table */}
            <section id="comparison" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                DefyShare vs {competitor.name}: Feature Comparison
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                What DefyShare includes. Features and limits of {competitor.name} change by plan and
                version, so check its current terms for an exact comparison.
              </p>
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
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                          Varies
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
                    desc: 'On the other device, open the same URL. When both devices are on the same Wi-Fi, they join the same room automatically.',
                  },
                  {
                    step: '3',
                    title: 'Drag and drop your files',
                    desc: `Drag files or a folder onto the page — each file can be up to ${FILE_LIMIT}. Uploads start straight away.`,
                  },
                  {
                    step: '4',
                    title: 'Download on the other device',
                    desc: `The file appears in the list on the other device, ready to preview or download. It is deleted automatically after ${RETENTION}.`,
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
                No sign-up. No download. Just open and share.
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
