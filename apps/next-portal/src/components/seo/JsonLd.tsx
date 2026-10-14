import React from 'react';
import { ToolItem } from '@/data/toolsData';
import { GameItem } from '@/data/gamesData';

interface JsonLdProps {
  item: ToolItem | GameItem;
  url: string;
}

export function JsonLd({ item, url }: JsonLdProps) {
  const isGame = !('category' in item);
  const appType = isGame ? 'GameApplication' : 'WebApplication';
  const summaryText = item.summary || item.description;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': appType,
    name: item.name,
    description: item.description,
    url: url,
    applicationCategory: isGame ? 'Game' : 'Utility',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript, HTML5, and CSS3.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  const howToSchema = item.howToSteps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${item.name} 사용 방법`,
    description: summaryText,
    step: item.howToSteps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.name,
      text: step.text,
      url: url,
    })),
  } : null;

  const faqSchema = item.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: item.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: 'https://veranex.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isGame ? '게임' : '생활도구',
        item: isGame ? 'https://veranex.app/game' : 'https://veranex.app/lifestyle',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
