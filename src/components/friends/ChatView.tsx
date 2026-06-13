import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Download, FileIcon, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, MessageRow } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { triggerBlobDownload } from '@/lib/storageUrls';
import type { ProfileRow } from '@/hooks/useFriendsData';
import { cn } from '@/lib/utils';

interface Props {
  conversationId: string | null;
  title: string;
  subtitle?: string;
  photo?: string | null;
  /** Member id -> profile lookup. */
  memberProfiles: Map<string, ProfileRow>;
  isGroup?: boolean;
  /** Hide input + show notice. */
  disabledNotice?: string | null;
  onOpenSettings?: () => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const MessageMedia: React.FC<{ msg: MessageRow }> = ({ msg }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (msg.file_url) {
      supabase.storage
        .from('chat-media')
        .createSignedUrl(msg.file_url, 3600)
        .then(({ data }) => {
          if (active) setUrl(data?.signedUrl ?? null);
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
          className="rounded-md max-h-64 object-cover block"
        />
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download image"
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-foreground text-xs shadow-md opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-background"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    );
  }
  if (msg.message_type === 'video') {
    return (
      <div className="relative group/media">
        <video src={url} controls className="rounded-md max-h-64 block" />
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download video"
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-foreground text-xs shadow-md opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-background"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    );
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
  const { messages, sendText, sendFile, uploading } = useMessages(conversationId);
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendText(text);
    setText('');
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

  const grouped = useMemo(() => messages, [messages]);

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
          <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-2">
          {grouped.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Say hi 👋
            </p>
          )}
          {grouped.map((m) => {
            const mine = m.sender_id === uid;
            const sender = memberProfiles.get(m.sender_id);
            return (
              <div
                key={m.id}
                className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}
              >
                {!mine && (
                  <UserAvatar
                    name={sender?.google_name}
                    photo={sender?.google_photo}
                    className="h-7 w-7 mt-0.5"
                  />
                )}
                <div className={cn('max-w-[75%]', mine && 'items-end')}>
                  {isGroup && !mine && (
                    <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {sender?.google_name || 'User'}
                    </div>
                  )}
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
                        'text-[10px] mt-1 text-right',
                        mine ? 'opacity-80' : 'text-muted-foreground',
                      )}
                    >
                      {formatTime(m.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

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
            onChange={(e) => setText(e.target.value)}
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
