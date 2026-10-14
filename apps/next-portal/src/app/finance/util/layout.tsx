import React from 'react';
import type { Metadata } from 'next';
import { FINANCE_SEO_DATA } from '@/data/financeSeoData';

export const metadata: Metadata = {
  title: '금융 시뮬레이터 & 세금 계산기 - 미국 배당주 세금, 주담대 스트레스 DSR, 퇴직금·IRP',
  description:
    '2026 최신 세법 및 금융당국 규정을 반영한 미국 배당주 배당소득세·종합소득세 계산기, 스트레스 DSR 2단계 주택담보대출 한도 계산기, 법정 퇴직금 및 실업급여 실수령액 시뮬레이터를 무료로 제공합니다.',
  keywords: [
    '미국배당주세금계산기',
    '배당소득세계산기',
    '금융소득종합과세',
    '스트레스DSR계산기',
    '주담대DSR계산기',
    'LTV계산기',
    '퇴직금계산기',
    '실업급여계산기',
    'VERA금융',
  ],
  alternates: {
    canonical: 'https://veranex.app/finance/util',
  },
  openGraph: {
    title: '스마트 금융 시뮬레이터 - 배당주 세금 · 스트레스 DSR · 퇴직금 계산기 | VERA',
    description:
      '미국 배당주 세후 현금흐름, 주담대 스트레스 DSR 2단계 대출 한도, 퇴직금·실업급여 실수령액을 즉시 시뮬레이션하세요.',
    url: 'https://veranex.app/finance/util',
    type: 'website',
  },
};

export default function FinanceUtilLayout({ children }: { children: React.ReactNode }) {
  const allFaqs = Object.values(FINANCE_SEO_DATA).flatMap((item) => item.faqs);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'VERA 스마트 금융 시뮬레이터 (배당주 세금 · DSR · 퇴직금)',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        url: 'https://veranex.app/finance/util',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: allFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
