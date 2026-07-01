import { ShieldCheck, BadgeCheck, Lock } from 'lucide-react';

export const ReviewTrust = () => {
  return (
    <div className="mt-12 rounded-2xl border border-violet-500/20 bg-violet-950/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BadgeCheck className="w-5 h-5 text-violet-400 shrink-0" />
        <h3 className="text-sm font-semibold text-violet-300">
          Technically Reviewed &amp; Verified
        </h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        This page has been technically reviewed by the{' '}
        <strong className="text-zinc-200">DefyShare WebRTC Engineering Team</strong>.
        All file transfers are peer-to-peer, encrypted in transit via{' '}
        <strong className="text-zinc-200">TLS 1.3</strong>, and never pass through
        DefyShare's servers. Zero data leaves your local network.
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span>TLS 1.3 encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Lock className="w-4 h-4 text-green-400" />
          <span>Zero server storage</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <BadgeCheck className="w-4 h-4 text-green-400" />
          <span>WebRTC P2P verified</span>
        </div>
      </div>
    </div>
  );
};
