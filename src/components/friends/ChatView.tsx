import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Paperclip,
  Send,
  Download,
  FileIcon,
  Loader2,
  MoreVertical,
  ChevronDown,
  Smile,
  Clock,
  Check,
  CheckCheck,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { UserAvatar } from '@/components/friends/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, MessageRow } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { triggerBlobDownload, getSignedChatUrl } from '@/lib/storageUrls';
import type { ProfileRow } from '@/hooks/useFriendsData';
import { cn } from '@/lib/utils';

interface Props {
  conversationId: string | null;
  title: string;
  subtitle?: string;
  photo?: string | null;
  memberProfiles: Map<string, ProfileRow>;
  isGroup?: boolean;
  disabledNotice?: string | null;
  onOpenSettings?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatRemaining = (expiresAt: string | null, now: number) => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'expiring…';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m left`;
  return `${s}s left`;
};

const MessageMedia: React.FC<{ msg: MessageRow }> = ({ msg }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (msg.file_url) {
      getSignedChatUrl(msg.file_url).then((u) => {
        if (active) setUrl(u);
      });
    }
    return () => {
      active = false;
    };
  }, [msg.file_url]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) return;
    await triggerBlobDownload(url, msg.file_name ?? 'download');
  };

  if (!url) return <div className="text-xs opacity-70">Loading…</div>;

  if (msg.message_type === 'image') {
    return (
      <div className="relative group/media">
        <img
          src={url}
          alt={msg.file_name ?? ''}
          loading="lazy"
          decoding="async"
          className="rounded-md max-h-64"
        />
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download"
          className="absolute top-1 right-1 bg-background/70 backdrop-blur p-1 rounded-md opacity-0 group-hover/media:opacity-100 transition"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (msg.message_type === 'video') {
    return <video src={url} controls className="rounded-md max-h-64" />;
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-background/40 hover:bg-background/60 transition text-left"
    >
      <FileIcon className="w-4 h-4" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{msg.file_name}</div>
        <div className="text-[10px] opacity-70">
          {msg.file_size ? formatSize(msg.file_size) : ''}
        </div>
      </div>
      <Download className="w-4 h-4 opacity-70" />
    </button>
  );
};

export const ChatView: React.FC<Props> = ({
  conversationId,
  title,
  subtitle,
  photo,
  memberProfiles,
  isGroup,
  disabledNotice,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const {
    messages,
    reactions,
    sendText,
    sendFile,
    uploading,
    typingUsers,
    toggleReaction,
    broadcastTyping,
  } = useMessages(conversationId);
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const prevCountRef = useRef(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [otherReads, setOtherReads] = useState<Record<string, string>>({});

  // tick once a minute to refresh countdown text
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // load + subscribe to other members' last_read_at
  useEffect(() => {
    if (!conversationId || !uid) return;
    let active = true;
    supabase
      .from('conversation_members')
      .select('user_id,last_read_at')
      .eq('conversation_id', conversationId)
      .then(({ data }) => {
        if (!active || !data) return;
        const map: Record<string, string> = {};
        for (const r of data as any[]) {
          if (r.user_id !== uid) map[r.user_id] = r.last_read_at;
        }
        setOtherReads(map);
      });

    const ch = supabase
      .channel(`reads-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row.user_id === uid) return;
          setOtherReads((prev) => ({ ...prev, [row.user_id]: row.last_read_at }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [conversationId, uid]);

  const isNearBottom = (el: HTMLDivElement, threshold = 120) =>
    el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevCountRef.current;
    prevCountRef.current = messages.length;
    if (messages.length > prev) {
      if (atBottom) scrollToBottom(prev === 0 ? false : true);
    }
  }, [messages.length, atBottom, scrollToBottom]);

  useEffect(() => {
    prevCountRef.current = 0;
    setAtBottom(true);
    requestAnimationFrame(() => scrollToBottom(false));
  }, [conversationId, scrollToBottom]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(isNearBottom(el));
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendText(text);
    setText('');
    setAtBottom(true);
    requestAnimationFrame(() => scrollToBottom(true));
  };

  const onPickFile = () => fileInput.current?.click();
  const onFile = async (file: File | null) => {
    if (!file) return;
    await sendFile(file);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && !disabledNotice) sendFile(file);
    },
    [sendFile, disabledNotice],
  );

  // group reactions per message
  const reactionsByMsg = useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; mine: boolean }[]>();
    for (const r of reactions) {
      const arr = map.get(r.message_id) ?? [];
      const existing = arr.find((x) => x.emoji === r.emoji);
      if (existing) {
        existing.count += 1;
        if (r.user_id === uid) existing.mine = true;
      } else {
        arr.push({ emoji: r.emoji, count: 1, mine: r.user_id === uid });
      }
      map.set(r.message_id, arr);
    }
    return map;
  }, [reactions, uid]);


  const typingNames = useMemo(() => {
    const ids = Object.keys(typingUsers).filter((id) => id !== uid);
    return ids
      .map((id) => memberProfiles.get(id)?.google_name?.split(' ')[0] || 'Someone')
      .slice(0, 3);
  }, [typingUsers, memberProfiles, uid]);

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <header className="flex items-center gap-3 p-3 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition"
        >
          <UserAvatar name={title} photo={photo} />
          <div className="min-w-0">
            <div className="truncate font-medium">{title}</div>
            {subtitle && (
              <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </button>
        {onOpenSettings && (
          <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Chat info">
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="absolute inset-0 overflow-y-auto p-4 space-y-2"
        >
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Say hi 👋
            </p>
          )}
          {messages.map((m, idx) => {
            const mine = m.sender_id === uid;
            const sender = memberProfiles.get(m.sender_id);
            const rx = reactionsByMsg.get(m.id) ?? [];
            const remaining = formatRemaining(m.expires_at, nowTick);
            
            return (
              <div
                key={m.id}
                className={cn('flex gap-2 group/msg', mine ? 'justify-end' : 'justify-start')}
              >
                {!mine && (
                  <UserAvatar
                    name={sender?.google_name}
                    photo={sender?.google_photo}
                    className="h-7 w-7 mt-0.5"
                  />
                )}
                <div className={cn('max-w-[75%] flex flex-col', mine && 'items-end')}>
                  {isGroup && !mine && (
                    <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {sender?.google_name || 'User'}
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1', mine && 'flex-row-reverse')}>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-sm',
                        mine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm',
                      )}
                    >
                      {m.message_type === 'text' ? (
                        <div className="whitespace-pre-wrap break-words">{m.text_content}</div>
                      ) : (
                        <MessageMedia msg={m} />
                      )}
                      <div
                        className={cn(
                          'text-[10px] mt-1 flex items-center gap-1 justify-end',
                          mine ? 'opacity-80' : 'text-muted-foreground',
                        )}
                      >
                        {remaining === null ? (
                          <InfinityIcon className="w-3 h-3 opacity-70" aria-label="Never expires" />
                        ) : (
                          <span className="inline-flex items-center gap-0.5 opacity-70">
                            <Clock className="w-3 h-3" />
                            {remaining}
                          </span>
                        )}
                        <span>·</span>
                        <span>{formatTime(m.created_at)}</span>
                        {mine && (
                          (() => {
                            const created = new Date(m.created_at).getTime();
                            const readBy = Object.values(otherReads).filter(
                              (iso) => new Date(iso).getTime() >= created,
                            ).length;
                            return readBy > 0 ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-300" aria-label="Read" />
                            ) : (
                              <Check className="w-3.5 h-3.5 opacity-70" aria-label="Sent" />
                            );
                          })()
                        )}
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          aria-label="React"
                          className="opacity-0 group-hover/msg:opacity-100 transition p-1 rounded-full hover:bg-secondary"
                        >
                          <Smile className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1 flex gap-1" side="top">
                        {QUICK_EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => toggleReaction(m.id, e)}
                            className="w-8 h-8 rounded-md hover:bg-secondary text-lg"
                            type="button"
                          >
                            {e}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                  {rx.length > 0 && (
                    <div className={cn('flex flex-wrap gap-1 mt-1', mine && 'justify-end')}>
                      {rx.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() => toggleReaction(m.id, r.emoji)}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full border transition',
                            r.mine
                              ? 'bg-primary/15 border-primary/40'
                              : 'bg-secondary border-border/50 hover:bg-secondary/80',
                          )}
                          type="button"
                        >
                          {r.emoji} {r.count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="text-xs text-muted-foreground italic px-1">
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
        </div>

        {!atBottom && (
          <button
            type="button"
            onClick={() => {
              setAtBottom(true);
              scrollToBottom(true);
            }}
            aria-label="Scroll to latest"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {uploading && (
        <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 border-t border-border/50">
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading {uploading.name} — {uploading.progress}%
        </div>
      )}

      {disabledNotice ? (
        <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/50">
          {disabledNotice}
        </div>
      ) : (
        <div className="p-3 border-t border-border/50 flex items-center gap-2 bg-card/30">
          <Button variant="ghost" size="icon" onClick={onPickFile} aria-label="Attach">
            <Paperclip className="w-4 h-4" />
          </Button>
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              broadcastTyping();
            }}
            placeholder="Type a message"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} size="icon" aria-label="Send">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {dragOver && !disabledNotice && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-md flex items-center justify-center pointer-events-none">
          <p className="text-sm font-medium text-primary">Drop file to send</p>
        </div>
      )}
    </div>
  );
};
