import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { INDUSTRIES, DEFYSHARE_FEATURES } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TableOfContents } from '@/components/TableOfContents';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

const TOC_ITEMS = [
  { id: 'challenge', label: 'The Challenge' },
  { id: 'solution', label: 'DefyShare Solution' },
  { id: 'features', label: 'Key Features' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'faq', label: 'FAQ' },
];

export default function IndustryPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const industrySlug = slug.replace(/^best-file-sharing-for-/, '');
  const industry = INDUSTRIES.find((i) => i.slug === industrySlug);

  if (!industry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/90 mb-2">Page not found</p>
          <Link to="/" className="text-primary hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const defaultTitle = `Best Free File Sharing for ${industry.name} — No Size Limits | DefyShare`;
  const defaultDescription = `DefyShare is the best file sharing tool for ${industry.role}. Transfer large files instantly over your local network — private, fast, and completely free with no size limits.`;
  const { title, description } = getSeoMeta(pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/best-file-sharing-for-${industry.slug}`;

  const faqs = [
    {
      question: `What is the best free file sharing tool for ${industry.name}?`,
      answer: `DefyShare is the best free file sharing solution for ${industry.role}. It transfers files peer-to-peer over your local network at full LAN speed, with no file size limits, no accounts, and no cloud uploads — ideal for the large files common in ${industry.name} workflows.`,
    },
    {
      question: `Is DefyShare secure enough for ${industry.name} use?`,
      answer: `Yes. DefyShare is built for privacy-conscious workflows like ${industry.name}. Files are transferred using WebRTC with TLS 1.3 encryption, directly between devices on your network. No data is stored on any server, making it suitable for confidential documents and sensitive data.`,
    },
    {
      question: `How do ${industry.name} use DefyShare in their daily workflow?`,
      answer: `${industry.name} typically use DefyShare to ${industry.painPoint.replace('need to ', '').replace('regularly ', '')}. Because DefyShare runs in the browser with no install required, it integrates seamlessly into any existing workflow.`,
    },
  ];

  const relatedLinks = [
    {
      label: 'Share files between Windows and Mac',
      href: '/share-files-between-windows-and-macos',
      description: 'Cross-platform transfer for mixed teams',
    },
    {
      label: 'Best Dropbox alternative',
      href: '/dropbox-alternative',
      description: 'Local-first file sharing without cloud costs',
    },
    {
      label: 'Share large video files instantly',
      href: '/share-mp4-files',
      description: 'Transfer MP4 and MKV files with no size limit',
    },
    {
      label: 'DefyShare vs WeTransfer',
      href: '/vs/wetransfer',
      description: 'Why local P2P beats cloud file transfer',
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
            { name: `File Sharing for ${industry.name}`, url: canonical },
          ]),
          buildFaqSchema(faqs),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: `Best File Sharing for ${industry.name}` }]} />

        <div className="flex gap-12">
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium mb-4">
                <Users className="w-3 h-3" />
                Built for {industry.name}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Best Free File Sharing for {industry.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)}{' '}
                {industry.painPoint}. <strong className="text-foreground/90">DefyShare</strong> solves
                this with instant peer-to-peer local network file transfer — fast, private, free.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors"
              >
                Try DefyShare Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Challenge */}
            <section id="challenge" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                The File Sharing Challenge for {industry.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {industry.role.charAt(0).toUpperCase() + industry.role.slice(1)}{' '}
                {industry.painPoint}. Current solutions fall short:
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Cloud storage services (Dropbox, Google Drive) require slow uploads and have storage caps',
                  'Email has strict attachment size limits (typically 25 MB)',
                  'USB drives require physical access and are easy to lose or forget',
                  'FTP servers require IT setup and ongoing maintenance',
                  'Consumer file sharing apps often compress or alter files',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Solution */}
            <section id="solution" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                How DefyShare Solves File Sharing for {industry.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                DefyShare is a browser-based P2P file transfer app built on WebRTC technology. It
                creates a direct encrypted connection between two devices on the same network,
                enabling file transfers at full local network speed — up to 1 Gbps — without any
                file ever touching a server.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: <Zap className="w-5 h-5 text-amber-500" />, title: 'Instant Speed', desc: 'Full LAN speed up to 1 Gbps — no upload bottleneck' },
                  { icon: <Shield className="w-5 h-5 text-green-600" />, title: 'Maximum Privacy', desc: 'Zero server storage — files stay on your network' },
                  { icon: <CheckCircle2 className="w-5 h-5 text-primary" />, title: 'No Limits', desc: 'No file size limit, no storage quota, no subscriptions' },
                ].map((card) => (
                  <div key={card.title} className="rounded-xl border border-border bg-card/80 p-4">
                    <div className="mb-2">{card.icon}</div>
                    <p className="font-semibold text-foreground/90 text-sm mb-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Features */}
            <section id="features" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                DefyShare Features Designed for {industry.name}
              </h2>
              <div className="space-y-3">
                {DEFYSHARE_FEATURES.map((f) => (
                  <div key={f.feature} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground/90 text-sm">{f.feature}</span>
                      <span className="text-muted-foreground text-sm"> — {f.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Workflow */}
            <section id="workflow" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                DefyShare Workflow for {industry.name}
              </h2>
              <ol className="space-y-4">
                {[
                  { step: '1', title: 'Open DefyShare in your browser', desc: `No installation required. Any device running a modern browser — Chrome, Safari, Firefox, or Edge — can use DefyShare immediately.` },
                  { step: '2', title: 'Both devices join the same transfer room', desc: 'DefyShare automatically discovers other DefyShare instances on your local network. No IP addresses, no setup required.' },
                  { step: '3', title: 'Drag and drop files to transfer', desc: `Drop any file — a massive ${industry.name === 'Video Editors' ? 'video project' : industry.name === 'Photographers' ? 'RAW photo archive' : 'document or dataset'} — and it transfers instantly.` },
                  { step: '4', title: 'Files arrive immediately on the other device', desc: 'The receiving device gets a notification and downloads the file at full LAN speed. Transfer complete.' },
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
                Start using DefyShare in your {industry.name} workflow
              </h2>
              <p className="text-muted-foreground mb-6">Free forever. No account required. No file size limits.</p>
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
