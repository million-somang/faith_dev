import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS_DATA } from '@/data/toolsData';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolViewer } from '@/components/tools/ToolViewer';
import { AdSlot } from '@/components/adsense/AdSlot';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

// 1. 빌드 타임 정적 페이지 생성 (SSG)
export async function generateStaticParams() {
  return Object.keys(TOOLS_DATA).map((slug) => ({ slug }));
}

// 2. 동적 SEO 메타데이터 생성 (구글봇 완벽 대응)
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = TOOLS_DATA[params.slug];
  if (!tool) return {};

  const pageUrl = `https://veranex.app/tools/${tool.slug}`;

  return {
    title: `${tool.name} - 무료 온라인 웹 유틸리티`,
    description: tool.description,
    keywords: [...tool.keywords, 'VERA', '베라', '생활도구'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${tool.name} | VERA 스마트 도구`,
      description: tool.summary,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: '/logo-512.png',
          width: 512,
          height: 512,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} | VERA`,
      description: tool.summary,
    },
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = TOOLS_DATA[params.slug];
  if (!tool) notFound();

  const pageUrl = `https://veranex.app/tools/${tool.slug}`;

  return (
    <main className="min-h-screen bg-[#f5f6f7] flex flex-col items-center py-6 px-4 sm:px-6">
      {/* 구조화 데이터 주입 (AEO & Rich Snippet) */}
      <JsonLd item={tool} url={pageUrl} />

      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* 상단 브레드크럼 & 뒤로가기 네비게이션 */}
        <nav aria-label="Breadcrumb" className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              홈
            </Link>
            <span>/</span>
            <Link href="/utility" className="hover:text-blue-600 transition-colors">
              도구 모음
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">{tool.name}</span>
          </div>

          <Link
            href="/utility"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all"
          >
            <i className="fas fa-th-large text-[11px]"></i>
            전체 도구 보기
          </Link>
        </nav>

        {/* 단일 <h1> 원칙 준수 시맨틱 헤더 (구글 SEO 가이드) */}
        <header className="w-full text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-2">
            <i className={tool.icon}></i>
            {tool.categoryLabel}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
            {tool.summary}
          </p>
        </header>

        {/* 상단 Zero-CLS 애드센스 슬롯 */}
        <AdSlot format="horizontal" />

        {/* 핵심 뷰어 (핵심기능 / 사용방법 / FAQ 3탭) */}
        <section aria-label={`${tool.name} 실행 및 사용 가이드`} className="w-full">
          <ToolViewer item={tool} isStandalone={true} />
        </section>

        {/* 하단 Zero-CLS 애드센스 슬롯 */}
        <AdSlot format="rectangle" />
      </div>
    </main>
  );
}
