// Sample room contents for checking the layout during `npm run dev` (open /?mock).
// Never imported in production builds: Index only loads it behind import.meta.env.DEV.
import type { SharedFile } from '@/hooks/useFileSharing';
import type { SharedText } from '@/hooks/useTextSharing';
import type { Member } from '@/hooks/useOnlinePresence';
import { EVERYONE } from '@/lib/recipients';

const now = Date.now();
const file = (i: number, name: string, type: string, size: number, minsAgo: number, from: [string, string], to: string | null = null): SharedFile => ({
  id: `mock-${i}`,
  name,
  type,
  size,
  file_path: `mock/${name}`,
  room_key: 'mock',
  created_at: new Date(now - minsAgo * 60000).toISOString(),
  expires_at: new Date(now + (180 - minsAgo) * 60000).toISOString(),
  keep_forever: false,
  uploader_name: from[1],
  subject: null,
  uploader_email: to,
  uploader_id: from[0],
});

const PHONE: [string, string] = ['dev-phone', 'Quiet Otter'];
const LAPTOP: [string, string] = ['dev-laptop', 'Amber Falcon'];

export const mockFiles = (meId: string, meName: string): SharedFile[] => {
  const ME: [string, string] = [meId, meName];
  return [
    file(1, 'IMG_4821.jpg', 'image/jpeg', 3_420_000, 2, PHONE),
    file(2, 'Quarterly report.pdf', 'application/pdf', 1_180_000, 9, ME, `to:${LAPTOP[0]}|${LAPTOP[1]}`),
    file(3, 'site-walkthrough.mp4', 'video/mp4', 24_600_000, 31, PHONE, `to:${meId}|${meName}`),
    file(4, 'designs/home-v3.png', 'image/png', 812_000, 48, LAPTOP),
    file(5, 'voice-note.m4a', 'audio/mp4', 640_000, 77, PHONE),
    file(6, 'project-backup.zip', 'application/zip', 18_900_000, 120, ME),
    file(7, 'notes.txt', 'text/plain', 2_100, 168, LAPTOP),
  ];
};

export const mockTexts = (meId: string, meName: string): SharedText[] =>
  [
    { id: 't1', content: 'Wi-Fi for the guest room: maple-street-5G', minsAgo: 3, from: { id: PHONE[0], name: PHONE[1] } },
    { id: 't2', content: 'Boarding pass and the hotel booking are here https://example.com/trips/lisbon-may and the address is Rua da Prata 52.', minsAgo: 40, from: { id: meId, name: meName } },
  ].map((x) => ({
    id: x.id,
    content: x.content,
    room_key: 'mock',
    created_at: new Date(now - x.minsAgo * 60000).toISOString(),
    from: x.from,
    target: EVERYONE,
  })) as unknown as SharedText[];

export const mockMembers: Member[] = [
  { id: PHONE[0], name: PHONE[1], online: true, lastSeen: now },
  { id: LAPTOP[0], name: LAPTOP[1], online: true, lastSeen: now },
  { id: 'dev-tablet', name: 'Mellow Heron', online: false, lastSeen: now - 50 * 60000 },
];
