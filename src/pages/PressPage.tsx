import { Link } from 'react-router-dom';
import { Download, ExternalLink, Cpu, Shield, Zap, Globe } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { JsonLd, buildBreadcrumbSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100">
      <SeoHead
        title="DefyShare Press Kit — Media Assets, Technical Documentation & Brand Story"
        description="Official DefyShare press kit for journalists and bloggers. Download logos, screenshots, and get technical information about our WebRTC P2P architecture."
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
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-300 font-medium mb-4">
            For Journalists &amp; Media
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">
            DefyShare Press Kit
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Everything you need to write about DefyShare — logo assets, technical details, product
            screenshots, and our brand story. Questions? Contact us at{' '}
            <a href="mailto:press@defyshare.app" className="text-violet-400 hover:underline">
              press@defyshare.app
            </a>
          </p>
        </div>

        {/* One-liner */}
        <section className="mb-12 rounded-xl border border-violet-500/20 bg-violet-950/20 p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Official One-Liner</p>
          <p className="text-xl font-semibold text-zinc-100 leading-relaxed">
            "DefyShare is a free, browser-based peer-to-peer file sharing app that lets you transfer
            files of any size between any devices on the same local network — instantly, privately,
            and with zero cloud uploads."
          </p>
        </section>

        {/* Key facts */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Key Facts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Product Name', value: 'DefyShare' },
              { label: 'Website', value: 'defyshare.app' },
              { label: 'Category', value: 'File Sharing / P2P Transfer / WebRTC App' },
              { label: 'Pricing', value: 'Free forever — no premium tier' },
              { label: 'File Size Limit', value: 'None — limited only by device storage' },
              { label: 'Account Required', value: 'No — open and use instantly' },
              { label: 'Platform Support', value: 'Windows, macOS, Linux, Android, iOS, ChromeOS' },
              { label: 'Technology', value: 'WebRTC P2P, TLS 1.3, Supabase Realtime' },
              { label: 'Transfer Protocol', value: 'Peer-to-peer — files never touch servers' },
              { label: 'Open Source', value: 'Architecture is public — see Technical section below' },
            ].map((fact) => (
              <div key={fact.label} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-0.5">{fact.label}</p>
                <p className="text-sm font-medium text-zinc-200">{fact.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical architecture */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Technical Architecture</h2>
          <p className="text-zinc-400 text-sm mb-6">
            For technically accurate reporting on how DefyShare works:
          </p>
          <div className="space-y-4">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-blue-400" />,
                title: 'WebRTC Peer-to-Peer Engine',
                desc: 'DefyShare uses the WebRTC Data Channel API (available natively in Chrome, Safari, Firefox, and Edge) to establish a direct UDP/TCP connection between two browsers on the same local network. File chunks are streamed directly between browsers without passing through any DefyShare server.',
              },
              {
                icon: <Shield className="w-5 h-5 text-green-400" />,
                title: 'TLS 1.3 Encryption',
                desc: 'All WebRTC connections are secured with DTLS (Datagram Transport Layer Security) 1.3. This means file transfers are encrypted end-to-end even within the local network. No plain-text transmission occurs at any point.',
              },
              {
                icon: <Zap className="w-5 h-5 text-yellow-400" />,
                title: 'Supabase Realtime Signaling',
                desc: 'DefyShare uses Supabase Realtime (WebSocket-based) exclusively for peer discovery and WebRTC handshaking (SDP offer/answer exchange). No file data passes through Supabase — it is used only to help two peers find each other and negotiate a direct connection.',
              },
              {
                icon: <Globe className="w-5 h-5 text-violet-400" />,
                title: 'Frontend Stack',
                desc: 'Built with React 18, TypeScript, Vite 5, Tailwind CSS, and Radix UI. Deployed on Vercel with global CDN. The app achieves a Lighthouse performance score of 95+ through code splitting, lazy loading, and optimal asset compression.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-2 mb-2">
                  {item.icon}
                  <h3 className="font-semibold text-zinc-200">{item.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Talking points */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Suggested Talking Points</h2>
          <ul className="space-y-3">
            {[
              'DefyShare is the only fully browser-based P2P file transfer tool with no file size limits and no account requirement.',
              'Unlike Snapdrop or PairDrop, DefyShare includes real-time text sharing, a transfer history ledger, and a polished dark-mode UI built for professional use.',
              'DefyShare is safer for sensitive files than cloud services because files never leave the local network — there is no server-side data to breach.',
              'The tool works across every major platform (Windows, Mac, Linux, Android, iOS) without installing any software — making it the first truly universal local network file sharing tool.',
              'DefyShare is completely free with no paid tier, no storage limits, and no ads embedded in the file transfer flow.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-zinc-400 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-2" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Download assets */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Download Brand Assets</h2>
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
                className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-violet-500/40 hover:bg-violet-950/10 transition-all"
              >
                <Download className="w-4 h-4 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{asset.label}</p>
                  <p className="text-xs text-zinc-500">{asset.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-bold text-zinc-100 mb-2">Media Contact</h2>
          <p className="text-sm text-zinc-400 mb-4">
            For interviews, product demos, technical briefings, or additional assets, reach out
            directly:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:press@defyshare.app"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              press@defyshare.app <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/brand"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              Brand Kit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
