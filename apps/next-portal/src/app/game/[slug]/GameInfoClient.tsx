'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import GameLeaderboard from '@/components/games/GameLeaderboard';
import { getGameSeoData } from '@/data/gamesSeoData';
import { GUIDES_DATA } from '@/data/guidesData';

import { GAME_CONFIGS } from '@/data/gameConfigs';

interface GameInfoClientProps {
    slug: string;
}

export default function GameInfoClient({ slug }: GameInfoClientProps) {
    const { user } = useAuth();
    const { launchApp } = useAppLauncher();
    const router = useRouter();

    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const toggleFaq = (idx: number) => {
        setOpenFaqIndex((prev) => (prev === idx ? null : idx));
    };

    const config = GAME_CONFIGS[slug];
    const seoData = getGameSeoData(slug);
    const relatedGuide = seoData?.relatedGuideSlug
        ? GUIDES_DATA.find((g) => g.slug === seoData.relatedGuideSlug)
        : undefined;

    useEffect(() => {
        if (!config) {
            router.replace('/game');
        }
    }, [config, router]);

    if (!config) return null;

    const getFallbackBg = (gameSlug: string) => {
        switch (gameSlug) {
            case 'janggi':
                return 'bg-blue-600';
            case 'omok':
                return 'bg-amber-600';
            case 'baseball':
                return 'bg-amber-600';
            case 'flight':
                return 'bg-sky-600';
            case 'vera-pop':
                return 'bg-indigo-600';
            case 'sudoku':
                return 'bg-violet-600';
            case '2048':
                return 'bg-cyan-600';
            case 'minesweeper':
                return 'bg-red-600';
            case 'freecell':
                return 'bg-emerald-600';
            case 'billiards':
                return 'bg-blue-600';
            default:
                return 'bg-blue-600';
        }
    };

    const getFallbackInlineStyle = (gameSlug: string) => {
        switch (gameSlug) {
            case 'janggi':
                return { background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #e11d48 100%)' };
            case 'omok':
                return { background: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%)' };
            default:
                return undefined;
        }
    };

    return (
        <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8 w-full">
            {/* 상단: 뒤로가기 네비게이션 */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2 min-w-0">
                <button
                    onClick={() => router.push('/game')}
                    className="shrink-0 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
                >
                    <i className="fas fa-arrow-left text-[11px] sm:text-xs"></i> 게임 목록으로
                </button>

                <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-slate-400 whitespace-nowrap min-w-0 overflow-hidden">
                    <Link href="/" className="hover:text-slate-600 transition-colors shrink-0">홈</Link>
                    <span className="shrink-0">/</span>
                    <Link href="/game" className="hover:text-slate-600 transition-colors shrink-0">게임</Link>
                    <span className="shrink-0">/</span>
                    <span className="font-semibold text-slate-700 truncate">{config.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
                {/* 왼쪽: 히어로 카드 + 게임 시작(팝업) + AEO 가이드 + 조작법 + FAQ */}
                <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6 min-w-0">
                    {/* 🎮 히어로 정보 카드 */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-44 h-44 bg-slate-500/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
                        <div className="relative flex items-center sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-5 min-w-0">
                            <div
                                style={getFallbackInlineStyle(slug)}
                                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${getFallbackBg(slug)} bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-md`}
                            >
                                <i className={`${config.icon} text-white text-lg sm:text-2xl`}></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-[17px] sm:text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight whitespace-nowrap truncate">
                                    {config.label}
                                </h1>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1 truncate sm:whitespace-normal">{config.tagline}</p>
                            </div>
                        </div>

                        <p className="relative text-slate-600 text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6">
                            {config.description}
                            {!user && (
                                <span className="block mt-2 text-amber-500 italic text-xs">
                                    비회원도 자유롭게 플레이할 수 있으며, 로그인 시 명예의 전당 랭킹에 기록됩니다.
                                </span>
                            )}
                        </p>

                        {/* 🚀 게임 시작 버튼 (450x850 팝업 실행 방식) - 고대비 선명화 */}
                        <div className="pt-1 sm:pt-2">
                            <button
                                onClick={() => launchApp(config.appUrl, config.appName)}
                                style={getFallbackInlineStyle(slug)}
                                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-8 py-3.5 sm:py-4 rounded-2xl ${getFallbackBg(slug)} bg-gradient-to-r ${config.buttonGradient} text-white font-black text-sm sm:text-xl whitespace-nowrap shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer ring-4 ring-slate-100 hover:ring-slate-200`}
                            >
                                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                                    <i className="fas fa-play text-[10px] sm:text-xs text-white"></i>
                                </span>
                                <span className="tracking-wide whitespace-nowrap">지금 바로 게임 시작 (팝업)</span>
                            </button>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-2.5 flex items-center gap-1.5">
                                <i className="fas fa-info-circle text-indigo-500 shrink-0"></i>
                                <span className="truncate sm:whitespace-normal">게임 시작을 누르면 새 팝업 창에서 게임이 열립니다. (팝업 차단을 해제해 주세요)</span>
                            </p>
                        </div>
                    </div>

                    {seoData && (
                        <>
                            {/* 1. Direct Answer Callout Box (AI 핵심 직답 요약) */}
                            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 rounded-2xl border border-indigo-150 p-5 sm:p-7 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm whitespace-nowrap shrink-0">
                                        <i className="fas fa-sparkles text-[11px]"></i>
                                        AI 핵심 요약 (AEO Direct Answer)
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium hidden sm:inline whitespace-nowrap">
                                        인공지능 검색 인용 최적화 답변
                                    </span>
                                </div>
                                <blockquote className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium pl-3.5 border-l-4 border-indigo-500 my-1">
                                    {seoData.directAnswer}
                                </blockquote>
                            </div>

                            {/* 2. 핵심 룰 & 전략 공식 카드 */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
                                <div className="flex items-center justify-between mb-4 gap-2 min-w-0">
                                    <h2 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-2 min-w-0 truncate">
                                        <i className="fas fa-chess-board text-indigo-500 shrink-0"></i>
                                        <span className="truncate">{seoData.strategyRules.title}</span>
                                    </h2>
                                    <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 whitespace-nowrap">
                                        승률 극대화 공식
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    {seoData.strategyRules.description}
                                </p>

                                {/* 공식 디스플레이 바 */}
                                <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm shadow-inner flex items-center justify-between gap-3 overflow-x-auto">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 whitespace-nowrap">
                                            FORMULA
                                        </span>
                                        <span className="font-semibold text-white">
                                            {seoData.strategyRules.formulaOrPrinciple}
                                        </span>
                                    </div>
                                    <i className="fas fa-calculator text-slate-500 shrink-0"></i>
                                </div>

                                {/* 전술 카드 그리드 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {seoData.strategyRules.tactics.map((tactic, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <h3 className="font-bold text-sm text-slate-800">
                                                    {tactic.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed pl-7">
                                                {tactic.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. 3단계 입문 및 마스터 가이드 */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
                                <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2.5">
                                    <i className="fas fa-graduation-cap text-amber-500"></i>
                                    3단계 입문 & 마스터 가이드
                                </h2>
                                <p className="text-xs text-slate-500 mb-5">
                                    초보자부터 랭커까지 단계별 필승 워크플로우
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {seoData.howToSteps.map((step, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 flex flex-col justify-between shadow-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                                        {idx + 1}
                                                    </span>
                                                    <h3 className="font-bold text-sm text-slate-800">
                                                        {step.name}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    {step.text}
                                                </p>
                                            </div>
                                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                                <span>STEP 0{idx + 1}</span>
                                                <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* 🎮 조작법 카드 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                            <i className="fas fa-gamepad text-slate-400"></i>
                            플레이 방법 및 조작 가이드
                        </h2>
                        <div className="flex flex-col gap-3">
                            {config.controls.map((c) => (
                                <div key={c.keys} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
                                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5 min-w-[90px] text-center shrink-0">
                                        {c.keys}
                                    </span>
                                    <span className="text-xs sm:text-sm text-slate-500 text-right">{c.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ❓ 자주 묻는 질문 (FAQ Accordion) */}
                    {seoData && seoData.faqs.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
                            <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2.5">
                                <i className="fas fa-circle-question text-blue-500"></i>
                                자주 묻는 질문 (FAQ)
                            </h2>
                            <p className="text-xs text-slate-500 mb-5">
                                규칙, 판정, 공략 팁에 관해 이용자분들이 가장 자주 묻는 질문입니다.
                            </p>

                            <div className="flex flex-col gap-2.5">
                                {seoData.faqs.map((faq, idx) => {
                                    const isOpen = openFaqIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 bg-white"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                                                aria-expanded={isOpen}
                                            >
                                                <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                                    <span className="text-blue-600 font-extrabold text-sm">Q.</span>
                                                    {faq.question}
                                                </span>
                                                <i
                                                    className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${
                                                        isOpen ? 'rotate-180 text-blue-600' : ''
                                                    }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                                    <div className="flex items-start gap-2 pt-1">
                                                        <span className="text-emerald-600 font-bold shrink-0">A.</span>
                                                        <div>{faq.answer}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 📚 관련 지식 가이드 추천 */}
                    {relatedGuide && (
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-semibold border border-indigo-400/30">
                                        <i className="fas fa-book-bookmark text-[10px]"></i>
                                        관련 전문가 지식 가이드
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {relatedGuide.readTime} 소요
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                                    {relatedGuide.title}
                                </h3>
                                <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 mb-4">
                                    {relatedGuide.description}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 flex-wrap gap-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <i className="fas fa-user-pen text-slate-400"></i>
                                        <span>{relatedGuide.author}</span>
                                    </div>
                                    <Link
                                        href={`/guides/${relatedGuide.slug}`}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                                    >
                                        공략 전문 읽기
                                        <i className="fas fa-arrow-right text-[10px]"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 오른쪽: 실시간 랭킹 (명예의 전당) or 에뮬레이터 보안 안내 */}
                <div className="lg:col-span-1 flex flex-col items-center lg:items-stretch lg:sticky lg:top-6">
                    {slug === 'comboy' || slug === 'sfc' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <i className="fas fa-shield-halved text-slate-500"></i>
                                보안 및 개인정보 보호정책
                            </h3>
                            <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                                <p>
                                    <strong>1. 100% 로컬 구동</strong><br />
                                    {slug === 'sfc' ? 'Vera Super Comboy' : 'Vera Comboy'}는 웹 어셈블리/자바스크립트 엔진 기반으로 동작하여 사용자가 올린 게임 ROM 파일을 서버로 절대 업로드하지 않고 브라우저 메모리상에서만 구동합니다.
                                </p>
                                <p>
                                    <strong>2. 클라우드 세이브 보안</strong><br />
                                    저장 시 게임 데이터 자체가 아닌 현재 에뮬레이터의 일시적인 램 상태(바이너리 텍스트)만 추출하여 포털 데이터베이스에 암호화하여 백업합니다.
                                </p>
                                <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                                    ※ 저작권을 준수하며 어떠한 ROM 파일도 서버에 보관하거나 배포하지 않습니다. 유저가 합법적으로 소유한 파일만 실행할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <GameLeaderboard apiUrl={config.leaderboardUrl} gameId={slug} />
                    )}
                </div>
            </div>
        </main>
    );
}
