import type { Translate } from '@/lib/i18n';

export const timeAgo = (ts: number, t: Translate) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return t('minutesAgo', { n: mins });
  const h = Math.round(mins / 60);
  return h < 24 ? t('hoursAgo', { n: h }) : t('daysAgo', { n: Math.round(h / 24) });
};
