import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Shield, Users, AlertTriangle } from 'lucide-react';
import { FORMATS, INDUSTRIES, FILE_LIMIT, RETENTION, HOW_IT_WORKS } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
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
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/90 mb-2">Page not found</p>
          <Link to="/" className="text-primary hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const defaultTitle = `Share ${format.name} Files for ${industry.name} — Free | DefyShare`;
  const defaultDescription = `A quick way for ${industry.role} to move ${format.description} between devices on the same Wi-Fi. No account, files up to ${FILE_LIMIT}. Free.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/share-${format.slug}-for-${industry.slug}`;

  const faqs = [
    {
      question: `How can ${industry.name} share ${format.name} files quickly?`,
      answer: `For everyday hand-offs between devices on the same Wi-Fi, DefyShare is quick: no account, no install, and devices join the same room automatically. ${format.sizeNote}`,
    },
    {
      question: `Is DefyShare suitable for confidential ${format.name} files?`,
      answer: `DefyShare uses HTTPS for every transfer and deletes files after ${RETENTION}, but files are stored temporarily on third-party cloud servers and are not end-to-end encrypted. Use it for everyday files, and keep confidential or regulated material in tools approved by your organisation.`,
    },
    {
      question: `Is it free, and how large can ${format.name} files be?`,
      answer: `DefyShare is free with no account or subscription. Each file can be up to ${FILE_LIMIT}, and you can send many at once.`,
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
      label: 'How secure is DefyShare?',
      href: '/secure-file-sharing',
      description: 'What HTTPS and auto-delete do and do not protect',
    },
    {
      label: 'File size limits explained',
      href: '/no-size-limit-file-sharing',
      description: `What fits in ${FILE_LIMIT} and what to do with bigger files`,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">
              <Users className="w-3 h-3" />
              For {industry.name}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Share {format.name} Files for {industry.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)} regularly share {format.description}
            {' '}used for {format.useCases}. These files are typically {format.avgSize}.{' '}
            <strong className="text-foreground/90">DefyShare</strong> moves them between devices on the same
            Wi-Fi with no account or install — up to {FILE_LIMIT} per file, free.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors">
            Start Sharing {format.name} Files <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Why {industry.name} Need a Better Way to Share {format.name} Files
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)} {industry.painPoint}.
            For {format.name} files specifically — used for {format.useCases} — the problem is compounded
            because these files are typically {format.avgSize}. {format.sizeNote}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {HOW_IT_WORKS}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            DefyShare for {industry.name}: {format.name} File Workflow
          </h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: `Open DefyShare on both devices`, desc: `Any device in your ${industry.name} team opens defyshare.app in their browser — no account, no download.` },
              { step: '2', title: 'Devices join the same room automatically', desc: `Devices on the same Wi-Fi share a public IP address, so DefyShare groups them into one room. Nothing to configure.` },
              { step: '3', title: `Drag your ${format.name} files`, desc: `Drop ${format.name} files onto the DefyShare page. Multiple files and folders are supported; each file can be up to ${FILE_LIMIT}.` },
              { step: '4', title: 'Download on the other device', desc: `${format.name} files appear in the list on the receiving device and are deleted automatically after ${RETENTION}.` },
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

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-4">Key Benefits for {industry.name}</h2>
          <ul className="space-y-3">
            {[
              `Files up to ${FILE_LIMIT} each, delivered without compression`,
              `Automatic clean-up — everything is deleted after ${RETENTION}`,
              `No account creation — ${industry.role} can start transferring immediately`,
              `Works on all devices used by ${industry.name} — Windows, Mac, Linux, Android, iOS`,
              `Free to use — no subscription`,
              `HTTPS for every upload and download`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {industry.caution && (
          <div className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{industry.caution}</p>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">FAQ</h2>
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
            Start sharing {format.name} files in your {industry.name} workflow
          </h2>
          <p className="text-muted-foreground mb-6">Free. No account. Nothing to install.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 transition-colors">
            Open DefyShare Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
