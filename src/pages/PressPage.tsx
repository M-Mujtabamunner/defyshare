import { Link } from 'react-router-dom';
import { Download, ExternalLink, Cpu, Shield, Zap, Globe } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        title="DefyShare Press Kit — Media Assets, Technical Documentation & Brand Story"
        description="Official DefyShare press kit for journalists and bloggers. Download logos and get accurate facts about how DefyShare works."
        canonical="https://defyshare.app/press"
      />
      <JsonLd
        schema={[
          buildWebAppSchema(),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://defyshare.app' },
            { name: 'Press Kit', url: 'https://defyshare.app/press' },
          ]),
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: 'Press Kit' }]} />

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-3 py-1 text-xs text-foreground/80 font-medium mb-4">
            For Journalists &amp; Media
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
            DefyShare Press Kit
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Everything you need to write about DefyShare — logo assets, technical details, product
            screenshots, and our brand story. Questions? Contact us at{' '}
            <a href="mailto:contact@toolsdocks.com" className="text-primary hover:underline">
              contact@toolsdocks.com
            </a>
          </p>
        </div>

        {/* One-liner */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Official One-Liner</p>
          <p className="text-xl font-semibold text-foreground leading-relaxed">
            "DefyShare is a free browser tool that lets devices on the same Wi-Fi share files, text
            and links instantly — no app, no account, and everything deleted after 3 hours."
          </p>
        </section>

        {/* Key facts */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Key Facts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Product Name', value: 'DefyShare' },
              { label: 'Website', value: 'defyshare.app' },
              { label: 'Category', value: 'File and text sharing web app' },
              { label: 'Pricing', value: 'Free to use, supported by ads' },
              { label: 'File Size Limit', value: '30 MB per file' },
              { label: 'Account Required', value: 'No — open and use instantly' },
              { label: 'Platform Support', value: 'Windows, macOS, Linux, Android, iOS, ChromeOS' },
              { label: 'Technology', value: 'React web app, Supabase, Backblaze B2, Vercel' },
              { label: 'How files move', value: 'Uploaded over HTTPS to temporary cloud storage, then downloaded' },
              { label: 'Retention', value: 'Everything is deleted automatically after 3 hours' },
            ].map((fact) => (
              <div key={fact.label} className="rounded-lg border border-border bg-card/70 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">{fact.label}</p>
                <p className="text-sm font-medium text-foreground/90">{fact.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical architecture */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Technical Architecture</h2>
          <p className="text-muted-foreground text-sm mb-6">
            For technically accurate reporting on how DefyShare works:
          </p>
          <div className="space-y-4">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-blue-600" />,
                title: 'Rooms by network',
                desc: 'When DefyShare opens, the browser looks up its public IP address and joins a room for it. Devices on the same Wi-Fi or office network usually share one public IP, so they see the same room without any pairing code.',
              },
              {
                icon: <Shield className="w-5 h-5 text-green-600" />,
                title: 'Temporary cloud storage',
                desc: 'Files are uploaded over HTTPS directly from the browser to Backblaze B2 using short-lived signed URLs created by a small Vercel function. Other devices download them the same way. Files are not end-to-end encrypted, and every file is deleted 3 hours after upload.',
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-500" />,
                title: 'Supabase for the shared list',
                desc: 'Supabase stores the list of shared items for each room and pushes live updates over WebSockets, so a file dropped on one device appears on the others within seconds. Shared text and links are stored there too, and also expire after 3 hours.',
              },
              {
                icon: <Globe className="w-5 h-5 text-primary" />,
                title: 'Frontend Stack',
                desc: 'Built with React 18, TypeScript, Vite 5, Tailwind CSS, and Radix UI, and deployed on Vercel. It can be installed as an app on desktop and mobile.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card/70 p-5">
                <div className="flex items-center gap-2 mb-2">
                  {item.icon}
                  <h3 className="font-semibold text-foreground/90">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Talking points */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Suggested Talking Points</h2>
          <ul className="space-y-3">
            {[
              'DefyShare needs no account and no install: devices on the same Wi-Fi join the same room automatically.',
              'Unlike live peer-to-peer tools such as Snapdrop or PairDrop, the receiving device does not need to be open when you send — files wait in the room for up to 3 hours.',
              'Everything shared is deleted automatically after 3 hours, so nothing piles up in a cloud drive.',
              'It works across every major platform (Windows, Mac, Linux, Android, iOS, ChromeOS) in the browser.',
              'DefyShare is free to use, with files up to 30 MB each, and is supported by ads.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-muted-foreground text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Download assets */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Download Brand Assets</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'DefyShare Logo (SVG)', desc: 'Vector logo for all uses', href: '/favicon.svg' },
              { label: 'DefyShare Logo (PNG 192px)', desc: 'Raster logo for web', href: '/icon-192x192.png' },
              { label: 'Dark Background Screenshot', desc: 'App screenshot on dark theme', href: '#' },
              { label: 'Social Media Card', desc: 'OG image for sharing', href: '#' },
            ].map((asset) => (
              <a
                key={asset.label}
                href={asset.href}
                download
                className="group flex items-center gap-3 rounded-xl border border-border bg-card/70 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Download className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground/90">{asset.label}</p>
                  <p className="text-xs text-muted-foreground">{asset.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-card/70 p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Media Contact</h2>
          <p className="text-sm text-muted-foreground mb-4">
            For interviews, product demos, technical briefings, or additional assets, reach out
            directly:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:contact@toolsdocks.com"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              contact@toolsdocks.com <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/brand"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground/90 text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              Brand Kit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
