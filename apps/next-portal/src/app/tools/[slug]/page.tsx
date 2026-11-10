import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS_DATA, getToolBySlug } from '@/data/toolsData';
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
  return TOOLS_DATA.map((tool) => ({ slug: tool.slug }));
}

// 2. 동적 SEO 메타데이터 생성 (구글봇 검색 의도 최적화)
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) return {};

  const pageUrl = `https://veranex.app/tools/${tool.slug}`;
  const cleanSeoTitle = (tool.title || `${tool.name} - 무료 온라인 계산기 · 유틸리티`).replace(
    /\s*\|\s*VERA$/i,
    ''
  );

  return {
    title: cleanSeoTitle,
    description: tool.description,
    keywords: [...tool.keywords, tool.name, '무료계산기', 'VERA', '베라', '생활도구'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${cleanSeoTitle} | VERA`,
      description: tool.description,
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
      title: `${cleanSeoTitle} | VERA`,
      description: tool.description,
    },
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  const pageUrl = `https://veranex.app/tools/${tool.slug}`;
  const relatedTools = TOOLS_DATA.filter((item) => item.slug !== tool.slug);

  return (
    <main className="min-h-screen bg-[#f5f6f7] flex flex-col items-center py-6 w-full">
      {/* 구조화 데이터 주입 (AEO & Rich Snippet) */}
      <JsonLd item={tool} url={pageUrl} />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 flex flex-col items-center">
        {/* 상단 브레드크럼 & 뒤로가기 네비게이션 */}
        <nav
          aria-label="Breadcrumb"
          className="w-full flex items-center justify-between gap-2 mb-4 min-w-0"
        >
          <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-gray-500 whitespace-nowrap min-w-0 overflow-hidden">
            <Link href="/" className="hover:text-blue-600 transition-colors shrink-0">
              홈
            </Link>
            <span className="shrink-0">/</span>
            <Link href="/lifestyle" className="hover:text-blue-600 transition-colors shrink-0">
              생활도구
            </Link>
            <span className="shrink-0">/</span>
            <span className="font-semibold text-gray-800 truncate">{tool.name}</span>
          </div>

          <Link
            href="/lifestyle"
            className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all"
          >
            <i className="fas fa-th-large text-[10px] sm:text-[11px]"></i>
            전체 도구 보기
          </Link>
        </nav>

        {/* 단일 <h1> 원칙 준수 시맨틱 헤더 (구글 SEO 가이드) */}
        <header className="w-full text-center mb-6 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-2 whitespace-nowrap">
            <i className={tool.icon}></i>
            {tool.categoryLabel} 도구
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {tool.description}
          </p>
        </header>

        {/* 상단 Zero-CLS 애드센스 슬롯 */}
        <AdSlot format="horizontal" />

        {/* 핵심 뷰어 (원페이지 통합: 도구 실행 + 산출 공식 + 실전 사례 + 사용법 + FAQ) */}
        <section aria-label={`${tool.name} 실행 및 공식 가이드`} className="w-full">
          <ToolViewer item={tool} isStandalone={true} />
        </section>

        {/* 내부 링크 강화: 함께 사용하면 좋은 VERA 생활도구 & 계산기 */}
        <section
          aria-label="관련 추천 생활도구 및 계산기"
          className="w-full mt-8 bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <i className="fas fa-compass text-blue-600"></i>
              함께 사용하면 좋은 무료 계산기 & 웹 유틸리티
            </h2>
            <Link
              href="/lifestyle"
              className="text-xs font-bold text-blue-600 hover:underline shrink-0"
            >
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedTools.map((rel) => (
              <Link
                key={rel.slug}
                href={`/tools/${rel.slug}`}
                className="group p-3.5 rounded-xl border border-gray-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${rel.iconBg} ${rel.iconColor} flex items-center justify-center shrink-0 text-sm`}
                >
                  <i className={rel.icon}></i>
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-700 truncate">
                    {rel.name}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                    {rel.directAnswer || rel.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 하단 Zero-CLS 애드센스 슬롯 */}
        <AdSlot format="rectangle" />
      </div>
    </main>
  );
}
