import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  siteName?: string;
  locale?: string;
}

export const generateSEOMetadata = ({
  title = 'NEX7 - Next.js Application',
  description = 'A modern Next.js application built with TypeScript, Tailwind CSS, and advanced performance optimizations.',
  keywords = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Performance'],
  image = '/og-image.png',
  url = 'https://nex7.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'NEX7 Team',
  siteName = 'NEX7',
  locale = 'en_US',
}: SEOProps): Metadata => {
  const fullTitle = title.includes('NEX7') ? title : `${title} | NEX7`;
  const canonicalUrl = url;
  const imageUrl = image.startsWith('http') ? image : `${url}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: author }],
    creator: author,
    publisher: siteName,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@nex7team',
    },
    
    // Additional metadata
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    
    // Other
    category: 'technology',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
        'pt-BR': `${canonicalUrl}/pt-br`,
      },
    },
  };
};

// Schema.org structured data
export const generateStructuredData = ({
  title,
  description,
  url,
  image,
  author = 'NEX7 Team',
  siteName = 'NEX7',
  publishedTime,
  modifiedTime,
}: SEOProps) => {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url,
    logo: `${url}/logo.png`,
    sameAs: [
      'https://twitter.com/nex7team',
      'https://github.com/nex7',
      'https://linkedin.com/company/nex7',
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    image,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${url}/logo.png`,
      },
    },
    ...(publishedTime && { datePublished: publishedTime }),
    ...(modifiedTime && { dateModified: modifiedTime }),
  };

  return [baseSchema, organizationSchema, webPageSchema];
};

// Breadcrumb schema
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

// FAQ schema
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};