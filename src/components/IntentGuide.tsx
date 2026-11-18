import React from 'react';
import type { IntentPage } from '@/data/intentPages';

/** The how-to under the app on a "send X from A to B" page. */
const IntentGuide: React.FC<{ page: IntentPage }> = ({ page }) => (
  <section className="mt-10 grid gap-8 lg:grid-cols-2 text-[15px] leading-relaxed" lang="en" dir="ltr">
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-2">How to {page.h1.charAt(0).toLowerCase() + page.h1.slice(1)}</h2>
        <ol className="list-decimal ps-5 space-y-1.5 text-muted-foreground">
          {page.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Tips</h2>
        <ul className="list-disc ps-5 space-y-1.5 text-muted-foreground">
          {page.tips.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-2">Questions</h2>
        <dl className="space-y-3">
          {page.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
      {page.related.length > 0 && (
        <nav aria-label="Related guides">
          <h2 className="text-lg font-semibold mb-2">Related</h2>
          <ul className="flex flex-wrap gap-2">
            {page.related.map((r) => (
              <li key={r.path}>
                <a href={r.path} className="inline-block rounded-full border border-border px-3 py-1 text-sm hover:border-foreground/30 transition-colors">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  </section>
);

export default IntentGuide;
