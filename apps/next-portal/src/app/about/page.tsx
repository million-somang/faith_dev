import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개 (About VERA)',
  description: 'VERA는 실시간 지식 가이드, 스마트 생활 도구, 클린 무설치 미니게임, 금융 시세를 한곳에서 편리하게 이용하는 라이프 포털입니다.',
  alternates: {
    canonical: 'https://veranex.app/about',
  },
};

export default function AboutPage() {
  return (
    <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-12 w-full">
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
          <i className="fas fa-compass"></i> ABOUT VERA
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
          세상의 모든 정보와 일상의 편리함을 한곳에, VERA
        </h1>
        <p className="text-slate-600 text-base sm:text-lg mb-10 leading-relaxed">
          VERA(베라)는 엄격히 검증된 고품질 지식 가이드부터 일상에 꼭 필요한 생활 계산기, 설치 없는 무설치 미니게임, 금융 지표를 한눈에 확인할 수 있는 통합 라이프 포털입니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
          <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
              <i className="fas fa-book-open"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">지식 가이드 & 전문 칼럼</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              금융 공학, 전통 인문학, 스토리텔링 작법, 웹 개발 아키텍처 등 각 분야 전문 필진이 직접 집필하고 검증한 오리지널 지식 콘텐츠를 제공합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mb-4">
              <i className="fas fa-calculator"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">유용한 스마트 생활 도구</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              만나이 계산기, D-Day 카운터, 부동산 평수 변환기, 글자수 검사기, JSON 포맷터 등 브라우저 샌드박스에서 즉시 연산되는 무료 유틸리티를 지원합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-4">
              <i className="fas fa-gamepad"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">무설치 브라우저 미니게임</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              스도쿠, 2048, 지뢰찾기, 오목, 정통 장기, 베라 플라이트 1942 등 별도의 다운로드나 플러그인 없이 브라우저에서 바로 즐기는 클래식 게임을 제공합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold mb-4">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">금융 지표 및 계산기</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              DSR 계산, 배당 소득세 시뮬레이션, 퇴직금 계산기, 주요 금융 통계를 투명하고 빠르게 분석할 수 있도록 돕습니다.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 mt-10 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">우리의 미션</h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            VERA는 불필요한 광고 공해 없이 사용자 중심의 신뢰할 수 있는 정보와 스마트한 도구를 가장 빠르게 전달하는 것을 목표로 합니다.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
          >
            홈으로 이동
          </Link>
          <Link
            href="/editorial-policy"
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs sm:text-sm hover:bg-teal-700 transition-colors shadow-sm"
          >
            편집 정책 확인
          </Link>
        </div>
      </div>
    </main>
  );
}
