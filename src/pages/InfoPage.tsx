import { Link, useLocation } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead';

type Section = { h: string; p: string[] };
type Doc = { title: string; description: string; sections: Section[] };

const UPDATED = 'September 29, 2026';

const DOCS: Record<string, Doc> = {
  '/about': {
    title: 'About DefyShare',
    description: 'Who builds DefyShare, why it exists, and how it helps people move files between their own devices.',
    sections: [
      { h: 'Our mission', p: ['DefyShare exists to make moving a file from one of your devices to another as simple as dropping it on a page. No app installs, no sign-up, no cables — open DefyShare on both devices on the same network and your files appear on each.'] },
      { h: 'How it works', p: ['When you open DefyShare, your browser is placed in a private room based on the network you are connected to. Everyone on the same Wi-Fi or office network sees the same room. Files and text you drop in are shared with devices in that room and automatically expire after a limited time.', 'Because rooms are tied to your network, a phone, laptop and tablet at home can exchange photos, documents and links instantly, while people on other networks never see them.'] },
      { h: 'Who uses it', p: ['Students sending lecture notes from phone to laptop, designers moving exports between machines, developers passing logs and snippets, families sharing holiday photos — anyone tired of emailing files to themselves.'] },
      { h: 'Built by DefyScale', p: ['DefyShare is built and maintained by DefyScale. We ship improvements continuously, including folder uploads, parallel transfers, per-file progress, and installable app support for desktop and mobile.'] },
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How DefyShare handles your files, text and personal information.',
    sections: [
      { h: 'Summary', p: [`Last updated: ${UPDATED}. DefyShare does not require an account. Files you share are stored temporarily so other devices on your network can download them, then deleted automatically.`] },
      { h: 'Information we process', p: ['Files and text you choose to share; a network-derived room identifier used to group devices; basic technical data such as browser type. If you optionally sign in with Google, we receive your name and email address.'] },
      { h: 'Retention', p: ['Shared files and text expire automatically (typically within about 30 hours) and are permanently deleted from storage. You can delete items earlier at any time using the delete buttons.'] },
      { h: 'Advertising and cookies', p: ['We use Google AdSense to show ads. Google and its partners may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising at Google Ads Settings (adssettings.google.com) or www.aboutads.info.', 'We may use analytics cookies to understand how the service is used so we can improve it.'] },
      { h: 'Your choices', p: ['You can clear shared items, sign out, clear your browser storage, or contact us to ask about data associated with your email address.'] },
      { h: 'Contact', p: ['Questions about privacy: mujtaba.muneer@defyscale.com'] },
    ],
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'The rules for using DefyShare.',
    sections: [
      { h: 'Acceptance', p: [`Last updated: ${UPDATED}. By using DefyShare you agree to these terms.`] },
      { h: 'Acceptable use', p: ['Do not use DefyShare to share illegal content, malware, content that infringes others\' rights, or material that exploits or harms anyone. We may remove content and block access that violates these rules.'] },
      { h: 'Your content', p: ['You keep ownership of what you share. You are responsible for having the right to share it. Shared items are temporary and may be deleted at any time; do not use DefyShare as your only copy of important files.'] },
      { h: 'No warranty', p: ['DefyShare is provided "as is" without warranties. To the extent permitted by law, we are not liable for lost data or indirect damages arising from use of the service.'] },
      { h: 'Changes', p: ['We may update these terms; continued use means you accept the updated version.'] },
    ],
  },
  '/contact': {
    title: 'Contact DefyShare',
    description: 'Get help, report a problem or send feedback to the DefyShare team.',
    sections: [
      { h: 'Email', p: ['General support and feedback: mujtaba.muneer@defyscale.com. We usually reply within two business days.'] },
      { h: 'Report abuse', p: ['To report content that violates our terms, email mujtaba.muneer@defyscale.com with the subject "Abuse report" and describe what you saw and when.'] },
      { h: 'Press', p: ['Media enquiries are welcome — see our press page for logos and product details.'] },
    ],
  },
};

const InfoPage = () => {
  const { pathname } = useLocation();
  const doc = DOCS[pathname] ?? DOCS['/about'];
  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={`${doc.title} — DefyShare`} description={doc.description} canonical={`https://defyshare.app${pathname}`} />
      <article className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to DefyShare</Link>
        <header>
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          <p className="mt-2 text-muted-foreground">{doc.description}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.h} className="space-y-2">
            <h2 className="text-xl font-semibold">{s.h}</h2>
            {s.p.map((t, i) => <p key={i} className="text-muted-foreground leading-relaxed">{t}</p>)}
          </section>
        ))}
      </article>
    </div>
  );
};

export default InfoPage;
