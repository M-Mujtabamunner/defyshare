import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Shield, Users } from 'lucide-react';
import { FORMATS, INDUSTRIES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

export default function FormatIndustryPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');

  // /share-[format]-for-[industry]
  let formatSlug = '';
  let industrySlug = '';
  for (const f of FORMATS) {
    const prefix = `share-${f.slug}-for-`;
    if (slug.startsWith(prefix)) {
      formatSlug = f.slug;
      industrySlug = slug.slice(prefix.length);
      break;
    }
  }

  const format = FORMATS.find((f) => f.slug === formatSlug);
  const industry = INDUSTRIES.find((i) => i.slug === industrySlug);

  if (!format || !industry) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-200 mb-2">Page not found</p>
          <Link to="/" className="text-violet-400 hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const title = `Share ${format.name} Files for ${industry.name} — Free, Instant, Private | DefyShare`;
  const description = `The best way for ${industry.role} to share ${format.description}. DefyShare transfers files P2P over your local network — no cloud, no size limit, no account. Free forever.`;
  const canonical = `https://defyshare.app/share-${format.slug}-for-${industry.slug}`;

  const faqs = [
    {
      question: `What is the best way for ${industry.name} to share ${format.name} files?`,
      answer: `DefyShare is the best method for ${industry.role} to share ${format.name} files. It transfers files directly peer-to-peer over the local network at full LAN speed — no size limits, no cloud uploads, no accounts. Files remain private and secure on your network.`,
    },
    {
      question: `How do ${industry.name} share ${format.name} files securely?`,
      answer: `DefyShare is the most secure option for ${industry.role}. All ${format.name} file transfers are TLS 1.3 encrypted and peer-to-peer — the files never leave your local network or touch any server, making it suitable for confidential and sensitive ${industry.name} workflows.`,
    },
    {
      question: `Is there a free way for ${industry.name} to share ${format.name} files of any size?`,
      answer: `Yes. DefyShare is completely free with no file size limits. ${industry.role} can share ${format.name} files of any size — whether they're a few MB or hundreds of GB — at full local network speed. No subscription required.`,
    },
  ];

  const relatedLinks = [
    {
      label: `Best file sharing for ${industry.name}`,
      href: `/best-file-sharing-for-${industry.slug}`,
      description: `Complete guide to file sharing for ${industry.role}`,
    },
    {
      label: `Share ${format.name} files — general guide`,
      href: `/share-${format.slug}-files`,
      description: `How to transfer ${format.name} files on any device`,
    },
    {
      label: 'Secure P2P file sharing',
      href: '/secure-file-sharing',
      description: 'TLS 1.3 encrypted transfers for sensitive files',
    },
    {
      label: 'Free file sharing — no size limit',
      href: '/no-size-limit-file-sharing',
      description: 'Transfer any file size for free',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100">
      <SeoHead title={title} description={description} canonical={canonical} ogTitle={title} ogDescription={description} />
      <JsonLd schema={[
        buildWebAppSchema(),
        buildBreadcrumbSchema([
          { name: 'Home', url: 'https://defyshare.app' },
          { name: `Best for ${industry.name}`, url: `https://defyshare.app/best-file-sharing-for-${industry.slug}` },
          { name: `Share ${format.name}`, url: canonical },
        ]),
        buildFaqSchema(faqs),
      ]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[
          { label: `For ${industry.name}`, href: `/best-file-sharing-for-${industry.slug}` },
          { label: `Share ${format.name} Files` },
        ]} />

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{format.icon}</span>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs text-violet-400 font-medium">
              <Users className="w-3 h-3" />
              For {industry.name}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 mb-4">
            Share {format.name} Files for {industry.name}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)} regularly share {format.description}
            {' '}used for {format.useCases}. These files are typically {format.avgSize}.{' '}
            <strong className="text-zinc-200">DefyShare</strong> transfers them directly P2P at full local
            network speed — private, instant, and completely free.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 transition-colors">
            Start Sharing {format.name} Files <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Why {industry.name} Need a Better Way to Share {format.name} Files
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)} {industry.painPoint}.
            For {format.name} files specifically — used for {format.useCases} — the problem is compounded
            because these files can be {format.avgSize}, making cloud uploads slow and email attachments impossible.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            DefyShare solves this by using WebRTC peer-to-peer technology to transfer {format.name} files
            directly between devices on the same local network. There is no server intermediary, no upload
            wait, and no file size restriction. The entire transfer happens at your local network's maximum speed.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            DefyShare for {industry.name}: {format.name} File Workflow
          </h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: `Open DefyShare on both devices`, desc: `Any device in your ${industry.name} team opens defyshare.app in their browser — no account, no download.` },
              { step: '2', title: 'Devices connect automatically on your network', desc: `DefyShare discovers other instances on the same local network using WebRTC signaling. No IP addresses to configure.` },
              { step: '3', title: `Drag your ${format.name} files`, desc: `Drop any ${format.name} file — regardless of how large — onto the DefyShare interface. Multiple files and folders are supported.` },
              { step: '4', title: 'Transfer completes at full LAN speed', desc: `${format.name} files arrive on the receiving device instantly. For ${industry.name}, this means no more waiting for cloud uploads during critical workflows.` },
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
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Key Benefits for {industry.name}</h2>
          <ul className="space-y-3">
            {[
              `No file size limit — transfer ${format.name} files of ${format.avgSize} or larger without restrictions`,
              `Files never leave your network — ideal for ${industry.name} dealing with confidential ${format.name} files`,
              `No account creation — ${industry.role} can start transferring immediately`,
              `Works on all devices used by ${industry.name} — Windows, Mac, Linux, Android, iOS`,
              `Free forever — no subscription, no per-GB fees, no premium tier`,
              `TLS 1.3 encrypted — enterprise-grade security for ${format.name} transfers`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-zinc-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
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
            Start sharing {format.name} files in your {industry.name} workflow
          </h2>
          <p className="text-zinc-400 mb-6">Free forever. No account. No size limit.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 transition-colors">
            Open DefyShare Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
