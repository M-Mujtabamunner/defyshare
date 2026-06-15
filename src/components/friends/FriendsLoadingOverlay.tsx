import React from 'react';
import logo from '@/assets/logo.png';

interface Props {
  progress: number; // 0..100
}

export const FriendsLoadingOverlay: React.FC<Props> = ({ progress }) => (
  <div
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#0a0a0a] text-white"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <img
        src={logo}
        alt="DefyShare"
        className="w-16 h-16 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
      />
      <div className="text-sm tracking-[0.3em] uppercase text-white/70">
        Defy<span className="text-primary">Share</span>
      </div>
    </div>
    <div className="w-56 h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-[width] duration-150 ease-out"
        style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
      />
    </div>
    <div className="text-[11px] text-white/40">Loading your chats…</div>
  </div>
);
