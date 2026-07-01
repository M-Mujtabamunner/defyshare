import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Shield, FileIcon } from 'lucide-react';
import { FORMATS } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
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
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-200 mb-2">Page not found</p>
          <Link to="/" className="text-violet-400 hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const title = `Share ${format.name} Files Instantly — Free & No Size Limit | DefyShare`;
  const description = `Transfer ${format.description} of any size directly between devices over your local network. No cloud uploads, no accounts, no size limits. Free forever.`;
  const canonical = `https://defyshare.app/share-${format.slug}-files`;

  const faqs = [
    {
      question: `How do I share ${format.name} files without uploading to the cloud?`,
      answer: `Open DefyShare on both devices on the same Wi-Fi network. Drag and drop your ${format.name} file onto the DefyShare interface. It transfers directly peer-to-peer — no upload to any server.`,
    },
    {
      question: `Is there a size limit for sharing ${format.name} files with DefyShare?`,
      answer: `No. DefyShare has no file size limit. ${format.name} files — which can range from ${format.avgSize} — transfer at full local network speed regardless of file size.`,
    },
    {
      question: `What is the fastest way to share ${format.name} files between two computers?`,
      answer: `DefyShare on a local network is the fastest method — transfers happen at LAN speed (up to 1 Gbps) with no server round-trip. For a 1 GB ${format.name} file, this takes just seconds vs. minutes with cloud services.`,
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
      description: 'Faster and more private browser file sharing',
    },
    {
      label: 'Best file sharing for your industry',
      href: '/best-file-sharing-for-developers',
      description: 'Industry-specific DefyShare guides',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100">
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
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 mb-4">
                Share {format.name} Files Instantly
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                Transfer {format.description} — commonly used for {format.useCases} — of any size,
                directly between devices. <strong className="text-zinc-200">No cloud upload.
                No account. No size limit.</strong> Works in any browser.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 transition-colors"
              >
                Share {format.name} Files Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Overview */}
            <section id="overview" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">
                The Problem with Sharing {format.name} Files
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                {format.name} files are used for {format.useCases}. They can be {format.avgSize},
                which creates real problems when trying to share them:
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  `Email attachments have a 25 MB limit — far too small for most ${format.name} files`,
                  `Cloud services like Google Drive and Dropbox require slow uploads before sharing`,
                  `WeTransfer limits free transfers to 2 GB`,
                  `USB drives require physical access and aren't always available`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">DefyShare eliminates all of these constraints.</strong>{' '}
                By using WebRTC peer-to-peer technology, it creates a direct connection between two
                devices on the same network and transfers your {format.name} files at full LAN speed.
              </p>
            </section>

            {/* Why DefyShare */}
            <section id="why-defyshare" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">
                Why DefyShare is the Best Way to Share {format.name} Files
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-yellow-400" />,
                    title: `No ${format.name} file size limit`,
                    desc: `Transfer ${format.name} files of any size — from small ${format.avgSize} files to entire archives — without restrictions.`,
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-green-400" />,
                    title: 'Files stay private',
                    desc: `Your ${format.name} files never touch a server. They go directly from device to device over your encrypted local network.`,
                  },
                  {
                    icon: <FileIcon className="w-5 h-5 text-blue-400" />,
                    title: 'No conversion or compression',
                    desc: `${format.name} files transfer byte-for-byte intact. Zero quality loss, no format conversion, no compression.`,
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-violet-400" />,
                    title: 'Works on all devices',
                    desc: `Share ${format.name} files between Windows, Mac, Linux, iPhone, iPad, Android, and Chromebook — all in the browser.`,
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="mb-3">{card.icon}</div>
                    <p className="font-semibold text-zinc-200 mb-1">{card.title}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How to */}
            <section id="how-to" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-zinc-100 mb-6">
                How to Share {format.name} Files with DefyShare
              </h2>
              <ol className="space-y-5">
                {[
                  { step: '1', title: 'Open DefyShare on both devices', desc: 'Navigate to defyshare.app in any modern browser on the sending and receiving device. Both must be on the same Wi-Fi or local network.' },
                  { step: '2', title: 'Devices connect automatically', desc: 'DefyShare uses WebRTC to automatically discover and pair the two devices. No codes, no QR scanning required.' },
                  { step: '3', title: `Drag your ${format.name} file onto the drop zone`, desc: `Simply drag your ${format.name} file from your file manager onto the DefyShare window. Multiple files and folders are supported.` },
                  { step: '4', title: 'Transfer completes at full network speed', desc: `The ${format.name} file arrives on the other device in seconds. Transfer speed depends on your network — Wi-Fi 6 can achieve 500+ Mbps, meaning a 1 GB file transfers in about 15 seconds.` },
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

            {/* Use cases */}
            <section id="use-cases" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">
                Common Use Cases for Sharing {format.name} Files
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                {format.name} files are commonly used for {format.useCases}. Here are the most
                frequent scenarios where DefyShare saves time:
              </p>
              <ul className="space-y-3">
                {[
                  `Moving ${format.name} files from a work device to a personal device quickly`,
                  `Sharing ${format.name} files with a colleague in the same office without email size limits`,
                  `Backing up ${format.name} files from a mobile device to a desktop`,
                  `Transferring ${format.name} files between operating systems (Windows to Mac, or Linux to Android)`,
                  `Sharing ${format.name} files on-site with clients without uploading to the cloud`,
                ].map((uc) => (
                  <li key={uc} className="flex items-start gap-3 text-zinc-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    {uc}
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-10 scroll-mt-24">
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
            <InternalLinks links={relatedLinks} />

            <div className="mt-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-900/20 border border-violet-500/20 p-8 text-center">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                Share your {format.name} files right now — it's free
              </h2>
              <p className="text-zinc-400 mb-6">No sign-up. No size limit. Just open and drag.</p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 transition-colors">
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
