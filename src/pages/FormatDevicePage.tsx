import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Shield } from 'lucide-react';
import { FORMATS, DEVICES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

export default function FormatDevicePage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');

  // Supports two URL patterns:
  // /share-[format]-from-[device]
  // /how-to-send-[format]-files-on-[device]
  let formatSlug = '';
  let deviceSlug = '';

  const fromMatch = slug.match(/^share-(.+)-from-(.+)$/);
  const howToMatch = slug.match(/^how-to-send-(.+)-files-on-(.+)$/);

  if (fromMatch) { formatSlug = fromMatch[1]; deviceSlug = fromMatch[2]; }
  else if (howToMatch) { formatSlug = howToMatch[1]; deviceSlug = howToMatch[2]; }

  const format = FORMATS.find((f) => f.slug === formatSlug);
  const device = DEVICES.find((d) => d.slug === deviceSlug);

  if (!format || !device) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-200 mb-2">Page not found</p>
          <Link to="/" className="text-violet-400 hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const isHowTo = !!howToMatch;
  const title = isHowTo
    ? `How to Send ${format.name} Files on ${device.name} — Free & Wireless | DefyShare`
    : `Share ${format.name} Files from ${device.name} — Free, No Size Limit | DefyShare`;
  const description = isHowTo
    ? `Learn how to send ${format.description} from your ${device.name} wirelessly. Use DefyShare — no cloud upload, no size limit, no account. Works in ${device.browser}.`
    : `Transfer ${format.description} directly from your ${device.name} over your local network. No cloud, no size limit, no account. Free forever. Works in ${device.browser}.`;
  const canonical = `https://defyshare.app/${slug}`;

  const faqs = [
    {
      question: `How do I share ${format.name} files from my ${device.name} without a USB cable?`,
      answer: `Open DefyShare in ${device.browser} on your ${device.name}. Open DefyShare on the receiving device as well. Both must be on the same Wi-Fi network. Drag your ${format.name} file onto the DefyShare drop zone — it transfers instantly peer-to-peer.`,
    },
    {
      question: `Is there a size limit for sending ${format.name} files from a ${device.name}?`,
      answer: `No. DefyShare has no file size limit. ${format.name} files — which are typically ${format.avgSize} — transfer at full local network speed regardless of size.`,
    },
    {
      question: `What is the fastest way to send ${format.name} files from a ${device.name}?`,
      answer: `DefyShare over a local Wi-Fi or Ethernet connection is the fastest method. Transfers happen at LAN speed (50–1000 Mbps) with no cloud upload delay. A 1GB ${format.name} file transfers in under 10 seconds on a modern network.`,
    },
  ];

  const relatedLinks = [
    {
      label: `Share ${format.name} files between devices`,
      href: `/share-${format.slug}-files`,
      description: `General guide to sharing ${format.name} files`,
    },
    {
      label: `Transfer files from ${device.name} to Mac`,
      href: `/share-files-between-${device.slug}-and-macos`,
      description: `${device.name} to Mac file transfer guide`,
    },
    {
      label: `Transfer files from ${device.name} to iPhone`,
      href: `/share-files-between-${device.slug}-and-iphone`,
      description: `${device.name} to iPhone wireless transfer`,
    },
    {
      label: 'Best free file sharing app',
      href: '/free-file-sharing-app',
      description: 'The top free file sharing tools compared',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100">
      <SeoHead title={title} description={description} canonical={canonical} ogTitle={title} ogDescription={description} />
      <JsonLd schema={[
        buildWebAppSchema(),
        buildBreadcrumbSchema([
          { name: 'Home', url: 'https://defyshare.app' },
          { name: `Share ${format.name} Files`, url: `https://defyshare.app/share-${format.slug}-files` },
          { name: `From ${device.name}`, url: canonical },
        ]),
        buildFaqSchema(faqs),
      ]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[
          { label: `Share ${format.name} Files`, href: `/share-${format.slug}-files` },
          { label: `From ${device.name}` },
        ]} />

        <div className="mb-10">
          <div className="text-4xl mb-4">{format.icon}</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 mb-4">
            {isHowTo
              ? `How to Send ${format.name} Files on ${device.name}`
              : `Share ${format.name} Files from Your ${device.name}`}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Transfer {format.description} directly from your <strong className="text-zinc-200">{device.name}</strong> to any other
            device on your local network. Files are typically {format.avgSize} — DefyShare handles them at full network
            speed with <strong className="text-zinc-200">no size limit, no cloud upload, and no account</strong>.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 transition-colors">
            Share {format.name} Files Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Why {device.name} Users Need a Better Way to Share {format.name} Files
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            {format.name} files used for {format.useCases} can be {format.avgSize}. On a {device.name},
            the usual options are frustrating: email has a 25MB limit, cloud services require uploading to a
            server and waiting, and USB transfers require the right cables and adapters.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            DefyShare uses WebRTC to create a direct peer-to-peer connection between your {device.name} and
            the receiving device. {format.name} files transfer at full local network speed — no upload, no wait,
            no server ever touches your files.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Step-by-Step: Share {format.name} Files from {device.name}
          </h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: `Open DefyShare on your ${device.name}`, desc: `Open ${device.browser} and navigate to defyshare.app. No download or installation needed.` },
              { step: '2', title: 'Open DefyShare on the receiving device', desc: 'Open any modern browser on the receiving device and go to defyshare.app. Both must be on the same Wi-Fi network.' },
              { step: '3', title: `Drag your ${format.name} file onto DefyShare`, desc: `From your ${device.name}'s file manager, drag your ${format.name} file onto the DefyShare drop zone. Or tap the upload button on mobile.` },
              { step: '4', title: 'File arrives instantly', desc: `The ${format.name} file transfers directly from your ${device.name} to the receiving device at full local network speed. No cloud involved.` },
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
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Key Advantages on {device.name}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: `Full speed on ${device.name}`, desc: `${device.browser} supports WebRTC natively — DefyShare runs at full capability on your ${device.name} with no plugins.` },
              { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'TLS 1.3 encrypted', desc: `All ${format.name} files transferred from your ${device.name} are encrypted end-to-end. No file ever touches a server.` },
              { icon: <CheckCircle2 className="w-5 h-5 text-violet-400" />, title: 'No size limit on any format', desc: `Whether your ${format.name} file is 1MB or 100GB, DefyShare handles it on your ${device.name} without restrictions.` },
              { icon: <CheckCircle2 className="w-5 h-5 text-blue-400" />, title: `No extra apps for ${device.name}`, desc: `DefyShare runs entirely in ${device.browser} — no APK, no extension, no desktop client needed on your ${device.name}.` },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="mb-2">{card.icon}</div>
                <p className="font-semibold text-zinc-200 text-sm mb-1">{card.title}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">FAQ</h2>
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
            Share your {format.name} files from {device.name} right now
          </h2>
          <p className="text-zinc-400 mb-6">Free. No account. No size limit. Instant.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 transition-colors">
            Open DefyShare <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
