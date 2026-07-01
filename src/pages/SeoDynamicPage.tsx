import { useLocation } from 'react-router-dom';
import { COMPETITORS, DEVICES, FORMATS, INDUSTRIES, KEYWORD_PAGES } from '@/data/seoData';
import AlternativePage from './AlternativePage';
import FormatPage from './FormatPage';
import IndustryPage from './IndustryPage';
import DeviceSharingPage from './DeviceSharingPage';
import FormatDevicePage from './FormatDevicePage';
import FormatIndustryPage from './FormatIndustryPage';
import KeywordLandingPage from './KeywordLandingPage';
import NotFound from './NotFound';

export default function SeoDynamicPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');

  // Static keyword landing pages (checked first for exact matches)
  if (KEYWORD_PAGES.some((p) => p.slug === slug)) return <KeywordLandingPage />;

  // /snapdrop-alternative
  for (const c of COMPETITORS) {
    if (slug === `${c.slug}-alternative`) return <AlternativePage />;
  }

  // /share-pdf-files  (single format, all devices)
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

  // /share-pdf-from-iphone  — format × device
  if (slug.startsWith('share-')) {
    for (const f of FORMATS) {
      if (slug.startsWith(`share-${f.slug}-from-`)) {
        const deviceSlug = slug.replace(`share-${f.slug}-from-`, '');
        if (DEVICES.some((d) => d.slug === deviceSlug)) return <FormatDevicePage />;
      }
    }
  }

  // /how-to-send-pdf-files-on-iphone — format × device (how-to variant)
  if (slug.startsWith('how-to-send-')) {
    for (const f of FORMATS) {
      if (slug.startsWith(`how-to-send-${f.slug}-files-on-`)) {
        const deviceSlug = slug.replace(`how-to-send-${f.slug}-files-on-`, '');
        if (DEVICES.some((d) => d.slug === deviceSlug)) return <FormatDevicePage />;
      }
    }
  }

  // /share-pdf-for-photographers — format × industry
  if (slug.startsWith('share-')) {
    for (const f of FORMATS) {
      if (slug.startsWith(`share-${f.slug}-for-`)) {
        const industrySlug = slug.replace(`share-${f.slug}-for-`, '');
        if (INDUSTRIES.some((i) => i.slug === industrySlug)) return <FormatIndustryPage />;
      }
    }
  }

  return <NotFound />;
}
