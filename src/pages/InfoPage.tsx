import { Link, useLocation } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead';

type Section = { h: string; p: string[] };
type Doc = { title: string; description: string; sections: Section[] };

const UPDATED = 'November 18, 2026';

const DOCS: Record<string, Doc> = {
  '/about': {
    title: 'About DefyShare',
    description: 'Who builds DefyShare, why it exists, and how it helps people move files between their own devices.',
    sections: [
      { h: 'Our mission', p: ['DefyShare exists to make moving a file from one of your devices to another as simple as dropping it on a page. No app installs, no sign-up, no cables — open DefyShare on both devices on the same network and your files appear on each.'] },
      { h: 'How it works', p: ['When you open DefyShare, your browser looks up your public IP address and joins a room for it. Devices on the same Wi-Fi or office network usually share one public IP, so they land in the same room automatically.', 'When you drop a file, your browser uploads it over HTTPS straight to temporary cloud storage (Backblaze B2) using a short-lived signed link, and the file is listed for the room through our database (Supabase). Other devices in the room download it the same way. Transfers are not peer-to-peer, so both devices need an internet connection.', 'Every file and text is deleted automatically 3 hours after it is shared. Each file can be up to 30 MB.'] },
      { h: 'Who uses it', p: ['Students sending lecture notes from phone to laptop, designers moving exports between machines, developers passing logs and snippets, families sharing holiday photos — anyone tired of emailing files to themselves.'] },
      { h: 'What it is not', p: ['DefyShare is a quick hand-off tool, not a backup or a secure vault. Files are not end-to-end encrypted, and anyone on the same network who opens DefyShare can see what is shared in that room. Do not use it for confidential, medical, financial or other sensitive data.'] },
      { h: 'Built by DefyScale', p: ['DefyShare is built and maintained by DefyScale. We ship improvements continuously, including folder uploads, parallel transfers, per-file progress, and installable app support for desktop and mobile.'] },
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How DefyShare handles your files, text and personal information, and which third parties are involved.',
    sections: [
      { h: 'Summary', p: [`Last updated: ${UPDATED}. DefyShare does not require an account. Files and text you share are stored temporarily on cloud servers so other devices on your network can download them, then deleted automatically after 3 hours. The site shows ads and uses analytics.`] },
      { h: 'Information we process', p: ['Files and text you choose to share, with their names, sizes and types.', 'Your public IP address. We use it as your room identifier, so it is stored alongside the items shared in that room. Devices with the same public IP see the same room.', 'The device name you choose, and a random device identifier kept in your browser, so others in your room can see who shared what.', 'Basic technical data such as browser type and request logs, which our hosting provider records.', 'If you sign in (optional, and only when sign-in is offered), your name and email address.'] },
      { h: 'Who can see what you share', p: ['Anything you share is listed to every device in your room — normally every device on the same network that opens DefyShare. On shared networks such as offices, schools, cafés or mobile carriers, that can include people you do not know. Files are protected in transit by HTTPS but are not end-to-end encrypted, so we and our storage provider could technically access them while they are stored.'] },
      { h: 'Retention', p: ['Shared files and text are permanently deleted from storage 3 hours after they are shared. You can delete items earlier at any time using the delete buttons. Your browser keeps some settings and a short cache of the room list locally; clearing your browser storage removes them.'] },
      { h: 'Third-party services', p: ['Supabase — database and realtime updates for the list of shared items, room membership and device names; also sign-in when it is offered.', 'Backblaze B2 — cloud storage where shared files are kept until they are deleted.', 'Vercel — hosts the website and the small server functions that create signed upload and download links; it records standard request logs.', 'ipify (and ipapi.co as a fallback) — returns your public IP address to your browser so DefyShare can pick your room.', 'Google Analytics — measures how the site is used, using cookies.', 'Google AdSense — shows ads. Google and its partners may use cookies to serve ads based on your prior visits to this and other websites.', 'Google Fonts — delivers the fonts used on the site; your browser requests them from Google.', 'Each of these providers processes data under its own privacy policy.'] },
      { h: 'Advertising and cookies', p: ['You can opt out of personalised advertising at Google Ads Settings (adssettings.google.com) or www.aboutads.info. You can also block or delete cookies in your browser settings; the file sharing itself still works without them.'] },
      { h: 'Your choices', p: ['You can delete shared items, change your device name, clear your browser storage, or contact us to ask about data associated with your email address or device.'] },
      { h: 'Contact', p: ['Questions about privacy: contact@toolsdocks.com'] },
    ],
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'The rules for using DefyShare.',
    sections: [
      { h: 'Acceptance', p: [`Last updated: ${UPDATED}. By using DefyShare you agree to these terms.`] },
      { h: 'The service', p: ['DefyShare lets devices on the same network share files and text through temporary cloud storage. Each file can be up to 30 MB, and everything shared is deleted automatically after 3 hours. Features and limits may change.'] },
      { h: 'Acceptable use', p: ['Do not use DefyShare to share illegal content, malware, content that infringes others\' rights, or material that exploits or harms anyone. We may remove content and block access that violates these rules.'] },
      { h: 'Your content', p: ['You keep ownership of what you share. You are responsible for having the right to share it. Anything you share is visible to other devices in your room. Shared items are temporary and may be deleted at any time; do not use DefyShare as your only copy of important files, or for confidential or regulated data.'] },
      { h: 'No warranty', p: ['DefyShare is provided "as is" without warranties. To the extent permitted by law, we are not liable for lost data or indirect damages arising from use of the service.'] },
      { h: 'Changes', p: ['We may update these terms; continued use means you accept the updated version.'] },
    ],
  },
  '/contact': {
    title: 'Contact DefyShare',
    description: 'Get help, report a problem or send feedback to the DefyShare team.',
    sections: [
      { h: 'Email', p: ['General support and feedback: contact@toolsdocks.com. We usually reply within two business days.'] },
      { h: 'Report abuse', p: ['To report content that violates our terms, email contact@toolsdocks.com with the subject "Abuse report" and describe what you saw and when.'] },
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
