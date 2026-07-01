import { useEffect, useRef } from 'react';

interface JsonLdProps {
  schema: object | object[];
}

export const JsonLd = ({ schema }: JsonLdProps) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(Array.isArray(schema) ? schema : schema);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [schema]);

  return null;
};

export const buildWebAppSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DefyShare',
  url: 'https://defyshare.app',
  description:
    'DefyShare is a free, browser-based peer-to-peer file sharing app. Transfer files of any size instantly over your local network — no accounts, no upload limits, no cloud servers.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Windows, macOS, Linux, Android, iOS',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'No file size limit',
    'No account required',
    'Peer-to-peer — files never touch our servers',
    'Works on all devices and browsers',
    'Real-time text sharing',
    'Drag and drop interface',
  ],
  creator: {
    '@type': 'Organization',
    name: 'DefyShare',
    url: 'https://defyshare.app',
  },
});

export const buildBreadcrumbSchema = (
  crumbs: { name: string; url: string }[]
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.name,
    item: crumb.url,
  })),
});

export const buildFaqSchema = (
  faqs: { question: string; answer: string }[]
) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});
