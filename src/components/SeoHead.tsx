import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export const SeoHead = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
}: SeoHeadProps) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
      el.setAttribute('content', value);
    };

    const setMetaName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setMetaProp = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaName('description', description);
    setMetaProp('og:title', ogTitle || title);
    setMetaProp('og:description', ogDescription || description);
    if (ogImage) setMetaProp('og:image', ogImage);
    setMetaName('twitter:title', ogTitle || title);
    setMetaName('twitter:description', ogDescription || description);

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical);
    }

    return () => {
      document.title = prevTitle;
      if (canonicalEl && canonical) canonicalEl.remove();
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage]);

  return null;
};
