import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { COMPETITORS, DEFYSHARE_FEATURES, FILE_LIMIT, RETENTION, HOW_IT_WORKS } from '@/data/seoData';
import { SeoHead } from '@/components/SeoHead';
import { getSeoMeta } from '@/data/seoMeta';
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildWebAppSchema } from '@/components/JsonLd';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TableOfContents } from '@/components/TableOfContents';
import { ReviewTrust } from '@/components/ReviewTrust';
import { InternalLinks } from '@/components/InternalLinks';

const TOC_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'head-to-head', label: 'Head-to-Head' },
  { id: 'performance', label: 'Performance' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'faq', label: 'FAQ' },
];

export default function VsPage() {
  const { competitor: competitorSlug } = useParams<{ competitor: string }>();
  const competitor = COMPETITORS.find((c) => c.slug === competitorSlug);

  if (!competitor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/90 mb-2">Page not found</p>
          <Link to="/" className="text-primary hover:underline">Go to DefyShare →</Link>
        </div>
      </div>
    );
  }

  const defaultTitle = `DefyShare vs ${competitor.name} (2026) — Full Comparison`;
  const defaultDescription = `DefyShare vs ${competitor.name}: an honest comparison of setup, privacy, file size limits, platform support, and cost. See which fits your use case.`;
  const { title, description } = getSeoMeta(window.location.pathname) ?? { title: defaultTitle, description: defaultDescription };
  const canonical = `https://defyshare.app/vs/${competitor.slug}`;

  const faqs = [
    {
      question: `Which is quicker to use — DefyShare or ${competitor.name}?`,
      answer: `For small files between your own devices on the same Wi-Fi, DefyShare usually takes fewer steps: no account, no app, no pairing. Transfer speed depends on your internet connection. For large files, ${competitor.name} may be the better choice — it ${competitor.strength}.`,
    },
    {
      question: `How does DefyShare handle privacy compared with ${competitor.name}?`,
      answer: `DefyShare needs no account, sends files over HTTPS, shows them only to devices in your room, and deletes them after ${RETENTION}. Files are stored temporarily on cloud servers and are not end-to-end encrypted. Compare that with ${competitor.name}'s own privacy policy for your use case.`,
    },
    {
      question: `Can DefyShare replace ${competitor.name} entirely?`,
      answer: `Not for everything. DefyShare is built for quick hand-offs between devices on the same Wi-Fi, with files up to ${FILE_LIMIT}. If you need what ${competitor.name} does best — it ${competitor.strength} — keep using it for that.`,
    },
  ];

  const relatedLinks = [
    {
      label: `Best ${competitor.name} Alternative`,
      href: `/${competitor.slug}-alternative`,
      description: `Why users switch from ${competitor.name} to DefyShare`,
    },
    {
      label: 'Share files between iPhone and Windows',
      href: '/share-files-between-iphone-and-windows',
      description: 'Cross-platform iOS to Windows guide',
    },
    {
      label: 'Best free file sharing for remote teams',
      href: '/best-file-sharing-for-remote-teams',
      description: 'Quick sharing between your own devices at home'
    },
    {
      label: 'Share video clips for free',
      href: '/share-mp4-files',
      description: `Send MP4 and MOV clips up to ${FILE_LIMIT} each`,
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
            { name: 'Comparisons', url: 'https://defyshare.app/vs' },
            { name: `DefyShare vs ${competitor.name}`, url: canonical },
          ]),
          buildFaqSchema(faqs),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb
          items={[
            { label: 'Comparisons', href: '/vs' },
            { label: `DefyShare vs ${competitor.name}` },
          ]}
        />

        <div className="flex gap-12">
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                DefyShare vs {competitor.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                An honest comparison of DefyShare and {competitor.name} across setup, privacy, file
                size limits, device compatibility, and cost. Last updated 2026.
              </p>
            </div>

            {/* Overview cards */}
            <section id="overview" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">At a Glance</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">D</div>
                    <span className="font-bold text-foreground">DefyShare</span>
                    <span className="ml-auto text-xs bg-green-500/20 text-green-600 border border-green-500/20 rounded-full px-2 py-0.5">Best for quick hand-offs</span>
                  </div>
                  <ul className="space-y-2">
                    {['Free to use', `Files up to ${FILE_LIMIT} each`, 'No account required', `Files deleted after ${RETENTION}`, 'Works on all platforms'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card/70 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-foreground/80 flex items-center justify-center text-white font-bold text-sm">
                      {competitor.name[0]}
                    </div>
                    <span className="font-bold text-foreground">{competitor.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {competitor.name} is {competitor.description}.
                  </p>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{competitor.strength.charAt(0).toUpperCase() + competitor.strength.slice(1)}.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{competitor.limitation.charAt(0).toUpperCase() + competitor.limitation.slice(1)}.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Head-to-head table */}
            <section id="head-to-head" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Head-to-Head Feature Comparison
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                What DefyShare includes. {competitor.name}&apos;s features and limits change by plan and
                version, so check its current terms for an exact comparison.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="text-left px-4 py-3 font-semibold text-foreground/80">Feature</th>
                      <th className="text-center px-4 py-3 font-semibold text-primary">DefyShare</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">{competitor.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEFYSHARE_FEATURES.map((row, i) => (
                      <tr key={row.feature} className={`border-b border-border/60 ${i % 2 === 0 ? 'bg-card/50' : ''}`}>
                        <td className="px-4 py-3 text-foreground/80">
                          <div>{row.feature}</div>
                          <div className="text-xs text-muted-foreground">{row.description}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                          Varies
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Performance */}
            <section id="performance" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">Speed and Setup</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DefyShare uploads each file over HTTPS to temporary cloud storage, and the other
                device downloads it, so transfer speed depends on your internet connection. For
                typical photos and documents under {FILE_LIMIT}, that usually means a few seconds.
                Where DefyShare saves the most time is setup: no account, no app, no pairing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {competitor.name} {competitor.strength}. For jobs that need that, it is the better pick.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-foreground/90">DefyShare</span>
                  </div>
                  <p className="text-xs text-muted-foreground">No account or pairing. Speed depends on your internet connection. Files up to {FILE_LIMIT}.</p>
                </div>
                <div className="rounded-xl border border-border bg-card/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">{competitor.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Speed and limits depend on its design and your plan.</p>
                </div>
              </div>
            </section>

            {/* Privacy */}
            <section id="privacy" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">Privacy &amp; Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {HOW_IT_WORKS} Because files are stored temporarily on third-party cloud servers and
                are not end-to-end encrypted, DefyShare is right for everyday files — not for
                confidential documents, medical records, or legal files.
              </p>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground/90 mb-1">What DefyShare does with your files</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Uploaded and downloaded over HTTPS. Listed only to devices in your room.
                      Deleted automatically after {RETENTION}. No account, so nothing is tied to your identity.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Verdict */}
            <section id="verdict" className="mb-10 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Verdict: DefyShare vs {competitor.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For quick hand-offs between your own devices on the same Wi-Fi,{' '}
                <strong className="text-foreground/90">DefyShare is the simpler choice</strong>: no
                installation, no account, devices find each other automatically, and files clean
                themselves up after {RETENTION}.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {competitor.name} is the better tool when you need what it does best — it{' '}
                {competitor.strength}. Many people use both.
              </p>
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
                Try DefyShare for your next quick hand-off
              </h2>
              <p className="text-muted-foreground mb-6">No account. No download. Free.</p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 transition-colors">
                Open DefyShare Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <TableOfContents items={TOC_ITEMS} />
        </div>
      </div>
    </div>
  );
}
