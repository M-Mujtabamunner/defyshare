import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, Code2 } from 'lucide-react';
import { useState } from 'react';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';

const EMBED_CODE = `<iframe
  src="https://defyshare.app/drop"
  width="100%"
  height="480"
  style="border:none;border-radius:16px;background:#0B0B0F;"
  allow="camera;microphone"
  title="DefyShare — Free Local Network File Sharing"
></iframe>`;

const BADGE_CODE = `<a href="https://defyshare.app" target="_blank" rel="noopener">
  <img
    src="https://defyshare.app/defyshare-badge.svg"
    alt="Share files free with DefyShare"
    width="160"
    height="40"
  />
</a>`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground/80 px-3 py-1.5 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        title="DefyShare Brand Kit — Logos, Embed Widgets & Press Assets"
        description="Download DefyShare logos, embed the DefyShare file sharing widget on your website, and access brand assets for press and media use."
        canonical="https://defyshare.app/brand"
      />
      <JsonLd
        schema={[
          buildWebAppSchema(),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://defyshare.app' },
            { name: 'Brand Kit', url: 'https://defyshare.app/brand' },
          ]),
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: 'Brand Kit' }]} />

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
            DefyShare Brand Kit
          </h1>
          <p className="text-muted-foreground text-lg">
            Embed DefyShare on your site, download our logos, or use our brand assets for press and
            media. Everything is free to use under the DefyShare brand guidelines.
          </p>
        </div>

        {/* Embed widget */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Embed DefyShare on Your Website</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            Add the DefyShare widget to your website so your visitors can share files directly. Every
            embed creates a backlink to DefyShare and lets your users experience instant P2P file
            transfer without leaving your site.
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
              <span className="text-xs text-muted-foreground font-mono">Embed Code</span>
              <CopyButton text={EMBED_CODE} />
            </div>
            <pre className="p-4 text-xs text-foreground/80 overflow-x-auto font-mono leading-relaxed whitespace-pre">
              {EMBED_CODE}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The embed works on any website. The iframe uses a responsive width so it adapts to your
            layout automatically.
          </p>
        </section>

        {/* Badge */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Link Badge</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Add a DefyShare badge to your site, README, or blog post to recommend DefyShare to your
            audience.
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
              <span className="text-xs text-muted-foreground font-mono">Badge HTML</span>
              <CopyButton text={BADGE_CODE} />
            </div>
            <pre className="p-4 text-xs text-foreground/80 overflow-x-auto font-mono leading-relaxed whitespace-pre">
              {BADGE_CODE}
            </pre>
          </div>
        </section>

        {/* Brand colors */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Brand Colors</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { name: 'Brand Orange', hex: '#FD6F3B', class: 'bg-[#FD6F3B]' },
              { name: 'Cream Background', hex: '#F4EFE6', class: 'bg-[#F4EFE6]' },
              { name: 'Logo Black', hex: '#000000', class: 'bg-black' },
              { name: 'Ink', hex: '#211C18', class: 'bg-[#211C18]' },
            ].map((color) => (
              <div key={color.name} className="rounded-xl overflow-hidden border border-border">
                <div className={`h-16 ${color.class}`} />
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground/90">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Typography</h2>
          <div className="rounded-xl border border-border bg-card/70 p-6">
            <p className="text-xs text-muted-foreground mb-2 font-mono">Primary Typeface</p>
            <p className="text-3xl font-extrabold text-foreground mb-1">Inter / System UI</p>
            <p className="text-muted-foreground text-sm">
              DefyShare uses Inter (or the system UI font stack) for all interface text. Headings are
              extrabold (900 weight). Body text uses regular (400) weight.
            </p>
          </div>
        </section>

        {/* Brand manifesto */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Brand Manifesto</h2>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              <strong className="text-primary">DefyShare</strong> is built on a single belief: your
              files belong to you, and sharing them should be instant, free, and private.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We use WebRTC peer-to-peer technology to transfer files directly between devices on the
              same local network — no cloud servers, no storage limits, no account requirements. This
              is not a limitation; it is a deliberate architectural choice that gives users maximum
              speed, zero latency, and complete data sovereignty.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              DefyShare is forever free. We do not charge for storage, we do not sell your data, and
              we do not restrict file sizes. We believe that the infrastructure of sharing should be
              as open and frictionless as the web itself.
            </p>
          </div>
        </section>

        {/* Press kit link */}
        <div className="rounded-xl border border-border bg-card/70 p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground/90 mb-1">Looking for press assets?</p>
            <p className="text-sm text-muted-foreground">Download logos, screenshots, and technical documentation on the Press Kit page.</p>
          </div>
          <Link
            to="/press"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 transition-colors shrink-0 ml-4"
          >
            Press Kit <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
