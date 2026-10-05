import { ShieldCheck, BadgeCheck, Lock } from 'lucide-react';

export const ReviewTrust = () => {
  return (
    <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-primary">
          Technically Reviewed &amp; Verified
        </h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This page has been technically reviewed by the{' '}
        <strong className="text-foreground/90">DefyShare WebRTC Engineering Team</strong>.
        All file transfers are peer-to-peer, encrypted in transit via{' '}
        <strong className="text-foreground/90">TLS 1.3</strong>, and never pass through
        DefyShare's servers. Zero data leaves your local network.
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>TLS 1.3 encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-4 h-4 text-green-600" />
          <span>Zero server storage</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BadgeCheck className="w-4 h-4 text-green-600" />
          <span>WebRTC P2P verified</span>
        </div>
      </div>
    </div>
  );
};
