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
    'Free browser app for sending files, folders and text between phones, tablets and computers on the same Wi-Fi network. No account or install needed; shared items are deleted after 3 hours.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Windows, macOS, Linux, Android, iOS',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'No account required',
    'Works in any modern browser',
    'Any file type, including folders, ZIP and RAR',
    'Real-time text and link sharing',
    'Drag and drop or paste to upload',
    'Files auto-delete after 3 hours',
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
