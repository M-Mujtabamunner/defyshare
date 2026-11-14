import { Archive, File, FileText, Film, Image as ImageIcon, Music, type LucideIcon } from 'lucide-react';
import { extensionOf, isArchive } from '@/lib/fileTypes';
import type { MessageKey } from '@/lib/i18n';

export type FileKind = 'image' | 'video' | 'audio' | 'doc' | 'archive' | 'other';

const DOC_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'rtf', 'odt', 'ods', 'odp', 'pages', 'numbers', 'key', 'json', 'xml', 'html']);

export const kindOf = (file: { type: string; name: string }): FileKind => {
  const type = file.type || '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (isArchive(type, file.name)) return 'archive';
  if (type.startsWith('text/') || type.includes('pdf') || type.includes('document') || type.includes('sheet') || type.includes('presentation')) return 'doc';
  if (DOC_EXT.has(extensionOf(file.name))) return 'doc';
  return 'other';
};

export const KIND_ORDER: FileKind[] = ['image', 'video', 'audio', 'doc', 'archive', 'other'];

export const KIND_LABEL: Record<FileKind, MessageKey> = {
  image: 'kindImages',
  video: 'kindVideos',
  audio: 'kindAudio',
  doc: 'kindDocs',
  archive: 'kindArchives',
  other: 'kindOther',
};

export const KIND_ICON: Record<FileKind, LucideIcon> = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  doc: FileText,
  archive: Archive,
  other: File,
};

export const isPreviewable = (type: string) =>
  type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/') || type === 'application/pdf' || type === 'text/plain';

export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/** Time left before a file is deleted, e.g. "2h 14m". `soon` is true in the last 15 minutes. */
export const timeLeft = (expiresAt: string, now = Date.now()) => {
  const diffMs = new Date(expiresAt).getTime() - now;
  if (diffMs <= 0) return { label: '0m', soon: true };
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  const h = Math.floor(mins / 60);
  return { label: h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`, soon: mins <= 15 };
};

export const splitPath = (name: string) => {
  const i = name.lastIndexOf('/');
  return i === -1 ? { dir: '', base: name } : { dir: name.slice(0, i), base: name.slice(i + 1) };
};
