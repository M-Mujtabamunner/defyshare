export const slugify = (s: string): string =>
  (s || 'user')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'user';

export const userSlug = (userId: string, name?: string | null): string => {
  const base = slugify(name || 'user');
  return `${base}-${userId.slice(0, 6)}`;
};

export const groupSlug = (id: string, name: string): string => {
  return `${slugify(name)}-${id.slice(0, 6)}`;
};

export const idFromSlug = (slug: string | undefined): string | null => {
  if (!slug) return null;
  const m = slug.match(/-([a-f0-9]{6})$/i);
  return m ? m[1] : null;
};
