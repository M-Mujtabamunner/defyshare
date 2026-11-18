import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Shield, FileIcon } from 'lucide-react';
import { FORMATS, FILE_LIMIT, RETENTION, HOW_IT_WORKS } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TableOfContents } from '@/components/TableOfContents';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

const TOC_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-defyshare', label: 'Why DefyShare?' },
  { id: 'how-to', label: 'How to Share' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'faq', label: 'FAQ' },
];

export default function FormatPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const formatSlug = slug.replace(/^share-/, '').replace(/-files$/, '');
  const format = FORMATS.find((f) => f.slug === formatSlug);

  if (!format) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/90 mb-2">Page not found</p>
          <Link to="/" className="text-primary hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const defaultTitle = `Share ${format.name} Files Instantly — Free | DefyShare`;
  const defaultDescription = `Send ${format.description} between devices on the same Wi-Fi. No account, no install, files up to ${FILE_LIMIT} each. Free.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/share-${format.slug}-files`;

  const faqs = [
    {
      question: `How do I share ${format.name} files between my devices?`,
      answer: `Open DefyShare on both devices on the same Wi-Fi network. Drag and drop your ${format.name} file onto the page. It is uploaded over HTTPS to temporary storage, appears on the other device, and is deleted after ${RETENTION}.`,
    },
    {
      question: `Is there a size limit for sharing ${format.name} files with DefyShare?`,
      answer: `Yes — each file can be up to ${FILE_LIMIT}. ${format.sizeNote}`,
    },
    {
      question: `Will my ${format.name} files be compressed or changed?`,
      answer: `No. DefyShare stores and delivers the exact file you dropped, byte for byte — no conversion, resizing, or recompression.`,
    },
  ];

  const relatedLinks = [
    {
      label: 'Share files between Windows and Mac',
      href: '/share-files-between-windows-and-macos',
      description: 'The definitive cross-platform transfer guide',
    },
    {
      label: 'Share files between iPhone and Android',
      href: '/share-files-between-iphone-and-android',
      description: 'Cross-platform mobile file transfer',
    },
    {
      label: 'Best Snapdrop alternative',
      href: '/snapdrop-alternative',
      description: 'A shared list instead of live transfers',
    },
    {
      label: 'Best file sharing for your industry',
      href: '/best-file-sharing-for-developers',
      description: 'Industry-specific DefyShare guides',
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
            { name: `Share ${format.name} Files`, url: canonical },
          ]),
          buildFaqSchema(faqs),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: `Share ${format.name} Files` }]} />

        <div className="flex gap-12">
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="text-5xl mb-4">{format.icon}</div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Share {format.name} Files Instantly
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Send {format.description} — commonly used for {format.useCases} — between your
                devices on the same Wi-Fi. <strong className="text-foreground/90">No account. No install.
                Up to {FILE_LIMIT} per file.</strong> Works in any browser.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors"
              >
                Share {format.name} Files Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Overview */}
            <section id="overview" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                The Problem with Sharing {format.name} Files
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {format.name} files are used for {format.useCases} and are typically {format.avgSize}.
                The usual ways of moving them between devices all add friction:
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  `Emailing files to yourself clutters your inbox, and attachments are capped`,
                  `Cloud drives need an account and keep files until you clean them up`,
                  `Messaging apps often compress photos and videos`,
                  `USB cables need the right connectors and aren't always at hand`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground/90">DefyShare removes those steps.</strong>{' '}
                {HOW_IT_WORKS}
              </p>
            </section>

            {/* Why DefyShare */}
            <section id="why-defyshare" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Why DefyShare is the Best Way to Share {format.name} Files
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-amber-500" />,
                    title: `Size: up to ${FILE_LIMIT} per file`,
                    desc: format.sizeNote,
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-green-600" />,
                    title: 'Nothing lingers',
                    desc: `Your ${format.name} files travel over HTTPS, are listed only to devices in your room, and are deleted after ${RETENTION}.`,
                  },
                  {
                    icon: <FileIcon className="w-5 h-5 text-blue-600" />,
                    title: 'No conversion or compression',
                    desc: `${format.name} files transfer byte-for-byte intact. Zero quality loss, no format conversion, no compression.`,
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
                    title: 'Works on all devices',
                    desc: `Share ${format.name} files between Windows, Mac, Linux, iPhone, iPad, Android, and Chromebook — all in the browser.`,
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-xl border border-border bg-card/80 p-5">
                    <div className="mb-3">{card.icon}</div>
                    <p className="font-semibold text-foreground/90 mb-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How to */}
            <section id="how-to" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                How to Share {format.name} Files with DefyShare
              </h2>
              <ol className="space-y-5">
                {[
                  { step: '1', title: 'Open DefyShare on both devices', desc: 'Navigate to defyshare.app in any modern browser on the sending and receiving device. Both must be on the same Wi-Fi or local network.' },
                  { step: '2', title: 'Devices join the same room', desc: 'Devices on the same Wi-Fi share a public IP address, so DefyShare groups them automatically. No codes required.' },
                  { step: '3', title: `Drag your ${format.name} file onto the drop zone`, desc: `Drag your ${format.name} file from your file manager onto the DefyShare window. Multiple files and folders are supported; each file can be up to ${FILE_LIMIT}.` },
                  { step: '4', title: 'Download it on the other device', desc: `The ${format.name} file appears in the list on the other device. Speed depends on your internet connection; small files usually take a few seconds.` },
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

            {/* Use cases */}
            <section id="use-cases" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Common Use Cases for Sharing {format.name} Files
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {format.name} files are commonly used for {format.useCases}. Here are the most
                frequent scenarios where DefyShare saves time:
              </p>
              <ul className="space-y-3">
                {[
                  `Moving ${format.name} files from a work device to a personal device quickly`,
                  `Sharing ${format.name} files with a colleague on the same office Wi-Fi without email`,
                  `Getting ${format.name} files from a phone onto a desktop`,
                  `Transferring ${format.name} files between operating systems (Windows to Mac, or Linux to Android)`,
                  `Handing ${format.name} files to a nearby device without creating an account`,
                ].map((uc) => (
                  <li key={uc} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {uc}
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.question} className="rounded-xl border border-border bg-card/70 p-5">
                    <h3 className="font-semibold text-foreground/90 mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <ReviewTrust />
            <InternalLinks links={relatedLinks} />

            <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Share your {format.name} files right now — it's free
              </h2>
              <p className="text-muted-foreground mb-6">No sign-up. No install. Just open and drag.</p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 transition-colors">
                Open DefyShare <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <TableOfContents items={TOC_ITEMS} />
        </div>
      </div>
    </div>
  );
}
