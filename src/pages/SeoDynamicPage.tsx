import { useLocation } from 'react-router-dom';
import { COMPETITORS, DEVICES, FORMATS, INDUSTRIES } from '@/data/seoData';
import AlternativePage from './AlternativePage';
import FormatPage from './FormatPage';
import IndustryPage from './IndustryPage';
import DeviceSharingPage from './DeviceSharingPage';
import NotFound from './NotFound';

export default function SeoDynamicPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');

  // /snapdrop-alternative
  for (const c of COMPETITORS) {
    if (slug === `${c.slug}-alternative`) return <AlternativePage />;
  }

  // /share-pdf-files
  for (const f of FORMATS) {
    if (slug === `share-${f.slug}-files`) return <FormatPage />;
  }

  // /share-files-between-windows-and-macos
  if (slug.startsWith('share-files-between-')) {
    const rest = slug.replace('share-files-between-', '');
    for (const d1 of DEVICES) {
      if (rest.startsWith(`${d1.slug}-and-`)) {
        const d2Slug = rest.replace(`${d1.slug}-and-`, '');
        if (DEVICES.some((d) => d.slug === d2Slug)) return <DeviceSharingPage />;
      }
    }
  }

  // /best-file-sharing-for-developers
  if (slug.startsWith('best-file-sharing-for-')) {
    const industrySlug = slug.replace('best-file-sharing-for-', '');
    if (INDUSTRIES.some((i) => i.slug === industrySlug)) return <IndustryPage />;
  }

  return <NotFound />;
}
