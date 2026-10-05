import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Shield, Wifi } from 'lucide-react';
import { DEVICES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TableOfContents } from '@/components/TableOfContents';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

const TOC_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'step-by-step', label: 'Step-by-Step Guide' },
  { id: 'tips', label: 'Speed Tips' },
  { id: 'faq', label: 'FAQ' },
];

export default function DeviceSharingPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const rest = slug.replace('share-files-between-', '');

  let device1 = DEVICES[0], device2 = DEVICES[1];
  let d1Slug = '', d2Slug = '';
  for (const d of DEVICES) {
    if (rest.startsWith(`${d.slug}-and-`)) {
      const candidate = rest.replace(`${d.slug}-and-`, '');
      const found = DEVICES.find((x) => x.slug === candidate);
      if (found) { device1 = d; device2 = found; d1Slug = d.slug; d2Slug = found.slug; break; }
    }
  }

  const defaultTitle = `How to Share Files Between ${device1.name} and ${device2.name} for Free (2026)`;
  const defaultDescription = `The fastest way to transfer files between a ${device1.name} and a ${device2.name} — no cables, no accounts, no cloud uploads. Use DefyShare for instant local P2P file transfer.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/share-files-between-${d1Slug || device1.slug}-and-${d2Slug || device2.slug}`;

  const faqs = [
    {
      question: `How do I send files from ${device1.name} to ${device2.name} without a USB cable?`,
      answer: `Open defyshare.app in ${device1.browser} on your ${device1.name} and in ${device2.browser} on your ${device2.name}. Both devices must be on the same Wi-Fi. They will detect each other automatically and you can drag and drop files to transfer instantly.`,
    },
    {
      question: `What is the fastest way to transfer files between ${device1.name} and ${device2.name}?`,
      answer: `DefyShare is the fastest method because it transfers files directly peer-to-peer over your local network at full LAN speed. On a standard Wi-Fi 5 network, you can achieve 50–100 Mbps. On Wi-Fi 6 or Ethernet, speeds can exceed 500 Mbps.`,
    },
    {
      question: `Is it safe to share files between ${device1.name} and ${device2.name} using DefyShare?`,
      answer: `Yes. DefyShare uses WebRTC with TLS 1.3 encryption. Files are transferred directly between your ${device1.name} and ${device2.name} and never pass through any server. Your data stays on your local network.`,
    },
  ];

  const relatedLinks = [
    {
      label: `Share files between ${device2.name} and ${device1.name}`,
      href: `/share-files-between-${d2Slug}-and-${d1Slug}`,
      description: `Reverse direction transfer guide`,
    },
    {
      label: 'Share large video files (MP4, MKV)',
      href: '/share-mp4-files',
      description: 'Transfer multi-gigabyte video files instantly',
    },
    {
      label: 'Best AirDrop alternative',
      href: '/airdrop-alternative',
      description: 'Cross-platform AirDrop that works on all devices',
    },
    {
      label: 'Best Snapdrop alternative',
      href: '/snapdrop-alternative',
      description: 'A faster, more featured Snapdrop replacement',
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
            { name: `${device1.name} to ${device2.name}`, url: canonical },
          ]),
          buildFaqSchema(faqs),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb
          items={[{ label: `${device1.name} to ${device2.name} File Transfer` }]}
        />

        <div className="flex gap-12">
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium mb-4">
                <Wifi className="w-3 h-3" />
                Local Network Transfer
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Share Files Between {device1.name} and {device2.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                The fastest, easiest, and most private way to transfer any file — no matter how
                large — from your <strong className="text-foreground/90">{device1.name}</strong> to your{' '}
                <strong className="text-foreground/90">{device2.name}</strong>. No USB cables, no cloud
                uploads, no accounts required.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors"
              >
                Transfer Files Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Overview */}
            <section id="overview" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                The Best Way to Transfer Files from {device1.name} to {device2.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most people struggle to share files between a {device1.name} and a {device2.name}{' '}
                because they rely on email (which has size limits), USB drives (which require
                physical connectors), or cloud services (which upload everything to a server and are
                slow).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground/90">DefyShare</strong> solves this by using WebRTC — the
                same technology that powers video calls in Chrome — to create a direct peer-to-peer
                connection between your {device1.name} and {device2.name} over your local Wi-Fi.
                Files transfer at your network's maximum speed: commonly 50–500 Mbps depending on
                your router.
              </p>
              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: <Zap className="w-5 h-5 text-amber-500" />, label: 'Full LAN Speed', desc: 'Up to 1 Gbps — not limited by internet upload' },
                  { icon: <Shield className="w-5 h-5 text-green-600" />, label: 'Zero Cloud Upload', desc: 'Files never leave your local network' },
                  { icon: <CheckCircle2 className="w-5 h-5 text-primary" />, label: 'No Size Limit', desc: 'Transfer files of any size — GB, TB, no cap' },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-border bg-card/80 p-4">
                    <div className="mb-2">{card.icon}</div>
                    <p className="font-semibold text-foreground/90 text-sm mb-1">{card.label}</p>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            <section id="requirements" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">What You Need</h2>
              <ul className="space-y-3">
                {[
                  `Your ${device1.name} with ${device1.browser}`,
                  `Your ${device2.name} with ${device2.browser}`,
                  'Both devices connected to the same Wi-Fi network (or same Ethernet switch)',
                  'No app installation, no account, no payment required',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Step by step */}
            <section id="step-by-step" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Step-by-Step: How to Transfer Files from {device1.name} to {device2.name}
              </h2>
              <ol className="space-y-5">
                {[
                  {
                    step: '1',
                    title: `On your ${device1.name}: Open DefyShare`,
                    desc: `Open ${device1.browser} and go to defyshare.app. The app loads instantly — no download, no sign-up.`,
                  },
                  {
                    step: '2',
                    title: `On your ${device2.name}: Open DefyShare`,
                    desc: `Open ${device2.browser} on your ${device2.name} and navigate to defyshare.app. Make sure both devices are on the same Wi-Fi network or network segment.`,
                  },
                  {
                    step: '3',
                    title: 'Devices discover each other automatically',
                    desc: `Within a few seconds, your ${device1.name} and ${device2.name} will appear as connected peers in each other's DefyShare interface. No pairing code required.`,
                  },
                  {
                    step: '4',
                    title: 'Drag your files to the drop zone',
                    desc: `On your ${device1.name}, drag any file — a video, folder, document, or archive — onto the DefyShare drop zone. The transfer begins immediately.`,
                  },
                  {
                    step: '5',
                    title: `Files arrive on your ${device2.name}`,
                    desc: `Your ${device2.name} receives a transfer notification. Accept and the file downloads instantly to your device at full local network speed.`,
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

            {/* Speed tips */}
            <section id="tips" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Tips for Maximum Transfer Speed
              </h2>
              <ul className="space-y-3">
                {[
                  'Connect both devices to a 5 GHz Wi-Fi band instead of 2.4 GHz for 3–5× faster speeds',
                  `If your ${device1.name} or ${device2.name} has an Ethernet port, use a wired connection for 10× faster transfers`,
                  'Close other browser tabs during transfer to maximize WebRTC bandwidth allocation',
                  'Use Chrome or Edge for the fastest WebRTC implementation on both devices',
                  'Transfer in the same room to minimize Wi-Fi signal loss and improve throughput',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
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
                Transfer files from {device1.name} to {device2.name} right now
              </h2>
              <p className="text-muted-foreground mb-6">Open DefyShare in your browser — it's free and instant.</p>
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
