// Fallback MIME types for files the browser reports without one (rar, 7z, mkv, ...).
const EXT_TYPES: Record<string, string> = {
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  tgz: 'application/gzip',
  bz2: 'application/x-bzip2',
  xz: 'application/x-xz',
  iso: 'application/x-iso9660-image',
  apk: 'application/vnd.android.package-archive',
  exe: 'application/vnd.microsoft.portable-executable',
  msi: 'application/x-msi',
  dmg: 'application/x-apple-diskimage',
  pdf: 'application/pdf',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
};

export const extensionOf = (name: string) => {
  const base = name.split('/').pop() || name;
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
};

export const mimeTypeFor = (file: File) => file.type || EXT_TYPES[extensionOf(file.name)] || 'application/octet-stream';

export const isArchive = (type: string, name: string) =>
  /zip|rar|7z|tar|gzip|bzip|x-xz|iso9660/.test(type) || ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'iso'].includes(extensionOf(name));
