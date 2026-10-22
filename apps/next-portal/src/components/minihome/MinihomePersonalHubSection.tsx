'use client';

import React from 'react';
import Link from 'next/link';
import { CompactDashboardWidgets } from '@/components/homepage/CompactDashboardWidgets';

export interface ScheduleColorStyle {
    label: string;
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
}

export interface MinihomeScheduleItem {
    id?: number | string;
    schedule_date?: string;
    end_date?: string;
    schedule_time?: string;
    end_time?: string;
    time?: string;
    schedule_text?: string;
    title?: string;
    text?: string;
    color?: string;
    is_all_day?: boolean;
}

export interface MinihomeWatchlistItem {
    id: number | string;
    stock_symbol: string;
    stock_name: string;
    market_type: string;
    target_price?: number;
    memo?: string;
}

export interface MinihomeKeywordNewsItem {
    id?: number | string;
    title: string;
    description?: string;
    summary?: string;
    category?: string;
    keyword?: string;
    publisher?: string;
    source?: string;
    origin_url?: string;
    url?: string;
    published_at?: string;
    created_at?: string;
}

export interface MinihomeShoppingItem {
    productId: number | string;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    curationPoint?: string;
    tag?: string;
}

export interface MinihomePersonalHubProps {
    userName: string;
    userEmail?: string;
    todayFormatted: string;
    todaySchedules: MinihomeScheduleItem[];
    scheduleColorConfig: Record<string, ScheduleColorStyle>;
    todaySajuGuide: {
        score: number;
        luckyColor: string;
        luckyDirection: string;
        caution: string;
        goodAction: string;
    };
    todayQuote: {
        quote: string;
        author: string;
        category: string;
    };
    saju: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        nature: string;
    } | null;
    birthDate: string;
    showBirthEditor: boolean;
    tempBirthDate: string;
    onToggleBirthEditor: (show: boolean) => void;
    onChangeTempBirthDate: (val: string) => void;
    onSaveBirth: (e: React.FormEvent) => void;
    watchlist: MinihomeWatchlistItem[];
    newsKeywords: Array<string | { id?: number | string; keyword?: string; name?: string }>;
    keywordNews: MinihomeKeywordNewsItem[];
    onDeleteKeyword: (id?: number | string, name?: string) => void;
    veraPointsData: {
        points: number;
        pendingAmount: number;
        attendanceRatio: number;
        activityRatio: number;
    };
    shoppingItems: MinihomeShoppingItem[];
    onNavigateSection?: (section: 'dashboard' | 'schedule' | 'news' | 'stocks' | 'games' | 'utils' | 'home-customize') => void;
}

export const MinihomePersonalHubSection: React.FC<MinihomePersonalHubProps> = ({
    userName,
    userEmail,
    todayFormatted,
    todaySchedules,
    scheduleColorConfig,
    todaySajuGuide,
    todayQuote,
    saju,
    birthDate,
    showBirthEditor,
    tempBirthDate,
    onToggleBirthEditor,
    onChangeTempBirthDate,
    onSaveBirth,
    watchlist,
    newsKeywords,
    keywordNews,
    onDeleteKeyword,
    veraPointsData,
    shoppingItems,
    onNavigateSection,
}) => {
    const woodOffset = 0;
    const fireOffset = saju ? saju.wood : 0;
    const earthOffset = saju ? saju.wood + saju.fire : 0;
    const metalOffset = saju ? saju.wood + saju.fire + saju.earth : 0;
    const waterOffset = saju ? saju.wood + saju.fire + saju.earth + saju.metal : 0;

    return (
        <section aria-label="나의 홈 다이어리 및 라이프 보드" className="space-y-6 pt-2">
            {/* 섹션 구분 타이틀 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                        <i className="fas fa-book-open"></i>
                    </span>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            나의 아지트 다이어리 &amp; 퍼스널 보드
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                            오늘의 일정, 사주 오행·주의보, 실시간 날씨·증시, 구독 뉴스, 베라포인트 정산을 내 아지트에서 한눈에 관리하세요.
                        </p>
                    </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    📅 {todayFormatted} 브리핑
                </span>
            </div>

            {/* 모바일 전용: 나의 아지트 다이어리 & 퍼스널 보드 바로 아래 가로 탭 메뉴 바 */}
            {onNavigateSection && (
                <div className="lg:hidden bg-white rounded-2xl shadow-sm p-2 border border-slate-200/80">
                    <nav className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar p-1">
                        <button
                            type="button"
                            onClick={() => onNavigateSection('dashboard')}
                            className="flex-1 min-w-[120px] py-2.5 px-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                        >
                            <span>🏠</span>
                            <span>내 아지트</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('schedule');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[110px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-sparkles text-amber-400 text-sm"></i>
                            <span>My Life</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('news');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[100px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-newspaper text-sm"></i>
                            <span>뉴스</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('stocks');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[100px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-chart-line text-sm"></i>
                            <span>주식</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('games');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[100px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-gamepad text-sm"></i>
                            <span>게임</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('utils');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[105px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-tools text-sm"></i>
                            <span>유틸리티</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateSection('home-customize');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 min-w-[110px] py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 font-bold"
                        >
                            <i className="fas fa-magic text-sm"></i>
                            <span>홈꾸미기</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* 🌤️📈 1. 실시간 날씨 & 금융/증시 슬림형 컴팩트 위젯 바 */}
            <CompactDashboardWidgets />

            {/* 🏛️ 2. 벤토 그리드 (좌측 My Life 데일리 포커스 7 : 우측 관심 주식 + 사주 오행 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ─── [좌측 와이드 카드: My Life 데일리 포커스] ─── */}
                <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-6">
                    <div>
                        {/* 카드 헤더 */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-200">
                                    <i className="fas fa-compass"></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                                        My Life 데일리 포커스
                                    </h3>
                                    <p className="text-xs text-slate-400">오늘의 일정과 사주 가이드 및 명언 종합 브리핑</p>
                                </div>
                            </div>
                            {onNavigateSection ? (
                                <button
                                    type="button"
                                    onClick={() => onNavigateSection('schedule')}
                                    className="text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                    <span>My Life 전체보기</span>
                                    <i className="fas fa-arrow-right text-[10px]"></i>
                                </button>
                            ) : (
                                <Link
                                    href="/mypage"
                                    className="text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5"
                                >
                                    <span>일정 달력 열기</span>
                                    <i className="fas fa-arrow-right text-[10px]"></i>
                                </Link>
                            )}
                        </div>

                        {/* 섹션 A: 오늘의 일정 */}
                        <div className="space-y-3 mb-5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <i className="fas fa-calendar-check text-emerald-500"></i> 오늘의 일정
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">{todayFormatted}</span>
                            </div>

                            {todaySchedules.length > 0 ? (
                                <div className="space-y-2">
                                    {todaySchedules.slice(0, 3).map((item, idx) => {
                                        const colorKey = item.color || 'blue';
                                        const colorConfig = scheduleColorConfig[colorKey] || scheduleColorConfig.blue;
                                        const timeText = item.schedule_time || item.time || (item.is_all_day ? '하루 종일' : '');
                                        const titleText = item.schedule_text || item.title || item.text || '제목 없음';

                                        return (
                                            <div
                                                key={item.id || idx}
                                                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl ${colorConfig.bg} border ${colorConfig.border} transition-all`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${colorConfig.badge} shrink-0`}>
                                                        {colorConfig.label}
                                                    </span>
                                                    {timeText && (
                                                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1 font-mono shrink-0 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                                                            <i className="far fa-clock text-[10px] text-slate-400"></i>
                                                            {timeText}
                                                        </span>
                                                    )}
                                                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">
                                                        {titleText}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                                                    진행중
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {todaySchedules.length > 3 && (
                                        <p className="text-xs font-bold text-slate-400 text-right pr-2">
                                            외 {todaySchedules.length - 3}개의 일정이 더 있습니다.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <i className="fas fa-mug-hot text-amber-500 text-sm"></i>
                                        오늘 등록된 일정이 없습니다. 여유로운 하루를 즐겨보세요!
                                    </span>
                                    {onNavigateSection && (
                                        <button
                                            type="button"
                                            onClick={() => onNavigateSection('schedule')}
                                            className="font-black text-emerald-600 hover:text-emerald-700 underline text-xs cursor-pointer shrink-0"
                                        >
                                            + 일정 추가
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 섹션 B: 오늘 사주 주의보 & 추천 행동 가이드 */}
                        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 rounded-2xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">🔮</span>
                                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                    오늘의 사주 주의보 &amp; 실천 팁
                                </h4>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 ml-auto">
                                    길방: {todaySajuGuide.luckyDirection} · 행운색: {todaySajuGuide.luckyColor}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                                <div className="flex items-start gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                    <span className="text-rose-500 font-black shrink-0">⚠️ 주의:</span>
                                    <span className="font-medium text-slate-800 leading-snug">{todaySajuGuide.caution}</span>
                                </div>
                                <div className="flex items-start gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                    <span className="text-emerald-600 font-black shrink-0">🍀 추천:</span>
                                    <span className="font-medium text-slate-800 leading-snug">{todaySajuGuide.goodAction}</span>
                                </div>
                            </div>
                        </div>

                        {/* 섹션 C: 365 데일리 명언 */}
                        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-black text-sm shrink-0">
                                <i className="fas fa-quote-left"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed italic">
                                    &ldquo;{todayQuote.quote}&rdquo;
                                </p>
                                <div className="text-[11px] font-extrabold text-slate-400 mt-1 flex items-center gap-1.5">
                                    <span>— {todayQuote.author}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                        {todayQuote.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── [우측 스택 카드: 관심 주식 + 사주 오행] ─── */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* 우측 1: 관심 주식 시황 위젯 */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                        <i className="fas fa-chart-line"></i>
                                    </div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">
                                        내 관심 주식 종목
                                    </h3>
                                </div>
                                {watchlist.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {watchlist.length}개 모니터링
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {watchlist.length > 0 ? (
                                    watchlist.slice(0, 3).map((stock) => (
                                        <Link
                                            key={stock.id}
                                            href="/finance"
                                            className="flex justify-between items-center bg-slate-50 hover:bg-emerald-50/60 p-3 rounded-2xl text-xs border border-slate-100 hover:border-emerald-200 transition-all group"
                                        >
                                            <div>
                                                <span className="font-black text-slate-800 mr-2 group-hover:text-emerald-700 transition-colors">
                                                    {stock.stock_name}
                                                </span>
                                                <span className="font-mono text-[11px] text-slate-400">
                                                    {stock.stock_symbol}
                                                </span>
                                            </div>
                                            {stock.target_price ? (
                                                <span className="font-extrabold text-emerald-600 font-mono">
                                                    목표가: {Number(stock.target_price).toLocaleString()}원
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    실시간 시세 <i className="fas fa-chevron-right text-[8px]"></i>
                                                </span>
                                            )}
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        관심 등록한 주식이 없습니다
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {onNavigateSection && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateSection('stocks')}
                                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-center text-xs rounded-xl transition-all cursor-pointer"
                                >
                                    내 종목 상세 관리
                                </button>
                            )}
                            <a
                                href="/finance"
                                className={`py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-center text-xs rounded-xl shadow-sm block transition-all ${
                                    onNavigateSection ? '' : 'col-span-2'
                                }`}
                            >
                                주식/금융 센터 열기
                            </a>
                        </div>
                    </div>

                    {/* 우측 2: 사주팔자 오행 & 에너지 밸런스 위젯 */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-500/20 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">☯️</span>
                                    <h3 className="font-extrabold text-white text-sm">
                                        {userName}님의 사주 오행
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onToggleBirthEditor(!showBirthEditor)}
                                    className="text-[10px] bg-white/15 hover:bg-white/25 text-violet-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                                >
                                    {birthDate ? '생일 수정' : '생일 등록'}
                                </button>
                            </div>

                            {showBirthEditor ? (
                                <form onSubmit={onSaveBirth} className="space-y-3 py-2">
                                    <p className="text-xs text-slate-300 font-bold">
                                        생년월일을 입력해 실시간 사주를 받아보세요.
                                    </p>
                                    <input
                                        type="date"
                                        value={tempBirthDate}
                                        onChange={(e) => onChangeTempBirthDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-violet-400"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer"
                                        >
                                            확인
                                        </button>
                                        {birthDate && (
                                            <button
                                                type="button"
                                                onClick={() => onToggleBirthEditor(false)}
                                                className="flex-1 py-2 bg-white/20 text-slate-300 rounded-xl text-xs font-black cursor-pointer"
                                            >
                                                취소
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : saju ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-200 leading-relaxed font-bold break-keep bg-white/5 p-3 rounded-2xl border border-white/10">
                                        🔮 <span className="text-violet-300 font-black">천성:</span> {saju.nature}
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-[10px] font-black text-slate-300">
                                            <span className="text-emerald-400">🌳 목 {saju.wood}%</span>
                                            <span className="text-rose-400">🔥 화 {saju.fire}%</span>
                                            <span className="text-amber-400">⛰️ 토 {saju.earth}%</span>
                                            <span className="text-stone-300">⚙️ 금 {saju.metal}%</span>
                                            <span className="text-sky-400">💧 수 {saju.water}%</span>
                                        </div>
                                        <svg
                                            viewBox="0 0 100 6"
                                            preserveAspectRatio="none"
                                            className="h-3 w-full bg-white/10 rounded-full overflow-hidden block"
                                        >
                                            <rect x={woodOffset} y={0} width={saju.wood} height={6} className="fill-emerald-500" />
                                            <rect x={fireOffset} y={0} width={saju.fire} height={6} className="fill-rose-500" />
                                            <rect x={earthOffset} y={0} width={saju.earth} height={6} className="fill-amber-500" />
                                            <rect x={metalOffset} y={0} width={saju.metal} height={6} className="fill-stone-400" />
                                            <rect x={waterOffset} y={0} width={saju.water} height={6} className="fill-sky-500" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center space-y-2">
                                    <p className="text-xs text-slate-300">
                                        생년월일을 등록하면 나만의 오행 에너지 밸런스가 표시됩니다.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => onToggleBirthEditor(true)}
                                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black cursor-pointer"
                                    >
                                        생년월일 등록하기
                                    </button>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/entertainment/saju"
                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-center text-xs rounded-xl shadow-md block transition-all"
                        >
                            전통 사주 종합 해설 열기
                        </Link>
                    </div>
                </div>
            </div>

            {/* 📰 3. 내가 구독한 주제 최신 뉴스 (매거진 스크랩북 피드) */}
            <div className="border border-slate-200/80 rounded-3xl p-6 sm:p-7 bg-white shadow-sm flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-sky-200">
                            <i className="fas fa-newspaper"></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-2">
                                내가 구독한 주제 최신 뉴스
                                <span className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                    LIVE FEED
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">구독하신 맞춤 관심 주제의 실시간 관련 뉴스 피드입니다.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {newsKeywords && newsKeywords.length > 0 ? (
                                newsKeywords.map((kw, idx) => {
                                    const kwName = typeof kw === 'string' ? kw : (kw.keyword || kw.name || '');
                                    const kwId = typeof kw === 'object' ? kw.id : undefined;
                                    return (
                                        <span
                                            key={kwId || idx}
                                            className="text-xs font-black px-3 py-1 rounded-xl bg-white border border-sky-200 text-sky-700 shadow-2xs flex items-center gap-1.5"
                                        >
                                            <i className="fas fa-hashtag text-[10px] text-sky-400"></i> {kwName}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteKeyword(kwId, kwName)}
                                                className="text-sky-300 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                                title="구독 해제"
                                            >
                                                <i className="fas fa-times text-[10px]"></i>
                                            </button>
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                                    기본 추천 키워드 (AI, 경제, IT, 기술, 금융)
                                </span>
                            )}
                        </div>
                        {onNavigateSection && (
                            <button
                                type="button"
                                onClick={() => onNavigateSection('news')}
                                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-1 active:scale-98"
                            >
                                <i className="fas fa-plus text-[11px]"></i> 주제 추가/관리
                            </button>
                        )}
                    </div>
                </div>

                {/* 구독 뉴스 기사 카드 그리드 (3열) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {keywordNews && keywordNews.length > 0 ? (
                        keywordNews.slice(0, 3).map((article, idx) => (
                            <a
                                key={article.id || idx}
                                href={article.origin_url || article.url || (article.id ? `/news/${article.id}` : '/news')}
                                target={article.origin_url || article.url ? '_blank' : undefined}
                                rel={article.origin_url || article.url ? 'noopener noreferrer' : undefined}
                                className="bg-white border border-slate-200/90 hover:border-sky-400 p-4 sm:p-5 rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">
                                            #{article.category || article.keyword || '구독뉴스'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                            {article.publisher || article.source || '주요뉴스'}
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-slate-800 text-sm line-clamp-2 group-hover:text-sky-600 transition-colors leading-snug">
                                        {article.title}
                                    </h4>
                                    {article.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-normal">
                                            {article.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] font-extrabold text-slate-400">
                                    <span className="font-mono">
                                        {article.published_at ? String(article.published_at).substring(0, 10) : '최근'}
                                    </span>
                                    <span className="text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        기사 읽기 <i className="fas fa-arrow-right text-[9px]"></i>
                                    </span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="col-span-3 text-slate-400 text-xs py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <i className="fas fa-newspaper text-slate-300 text-2xl mb-2 block"></i>
                            구독한 주제의 뉴스 기사를 불러오는 중이거나 아직 등록된 뉴스가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 4. 베라포인트 리워드 정산 & 맞춤 쇼핑 (2열 대칭 그리드) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 위젯 1: 베라포인트 정산 (Vera Points Settlement) */}
                <div className="border border-slate-200/90 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                    <i className="fas fa-coins"></i>
                                </div>
                                베라포인트 정산 &amp; 미션 센터
                            </h3>
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                POINT HUB
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                                <span className="text-[10px] text-amber-700 font-black">누적 베라포인트</span>
                                <span className="block text-lg font-mono font-black text-slate-900 mt-0.5">
                                    🪙 {veraPointsData.points.toLocaleString()} P
                                </span>
                            </div>
                            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl">
                                <span className="text-[10px] text-emerald-700 font-black">정산 대기 금액</span>
                                <span className="block text-lg font-mono font-black text-slate-900 mt-0.5">
                                    {veraPointsData.pendingAmount.toLocaleString()} 원
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <span className="text-[10px] text-slate-400 font-bold block">베라포인트 활동 달성률</span>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                                    <span>📅 출석체크 &amp; 미션 완료</span>
                                    <span className="font-mono">{veraPointsData.attendanceRatio}%</span>
                                </div>
                                <svg
                                    viewBox="0 0 100 4"
                                    preserveAspectRatio="none"
                                    className="w-full h-2 bg-slate-100 rounded-full overflow-hidden block"
                                >
                                    <rect
                                        x={0}
                                        y={0}
                                        width={Math.min(100, Math.max(0, veraPointsData.attendanceRatio))}
                                        height={4}
                                        className="fill-emerald-500"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                                    <span>💬 소셜 라운지 &amp; 아지트 활동</span>
                                    <span className="font-mono">{veraPointsData.activityRatio}%</span>
                                </div>
                                <svg
                                    viewBox="0 0 100 4"
                                    preserveAspectRatio="none"
                                    className="w-full h-2 bg-slate-100 rounded-full overflow-hidden block"
                                >
                                    <rect
                                        x={0}
                                        y={0}
                                        width={Math.min(100, Math.max(0, veraPointsData.activityRatio))}
                                        height={4}
                                        className="fill-amber-500"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {userEmail === 'sukman@naver.com' && (
                        <Link
                            href="/reward/exchange"
                            className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-all"
                        >
                            베라포인트 리워드 교환 신청
                        </Link>
                    )}
                </div>

                {/* 위젯 2: 나를 위한 맞춤 쇼핑 & 신박템 위젯 */}
                <div className="border border-slate-200/90 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                    <i className="fas fa-shopping-bag"></i>
                                </div>
                                {userName}님을 위한 맞춤 쇼핑
                            </h3>
                            <span className="text-[10px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-0.5 rounded-full font-black shadow-xs flex items-center gap-1">
                                <i className="fas fa-wand-magic-sparkles text-[9px]"></i> 신박 꿀템
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {shoppingItems && shoppingItems.length > 0 ? (
                                shoppingItems.slice(0, 2).map((item) => (
                                    <a
                                        key={item.productId}
                                        href={item.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all group"
                                    >
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200">
                                            <img
                                                src={item.productImage}
                                                alt={item.productName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {item.discountRate && (
                                                <span className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-1 rounded-bl">
                                                    {item.discountRate}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {item.curationPoint && (
                                                <div className="text-[10px] font-extrabold text-purple-700 truncate flex items-center gap-0.5 mb-0.5">
                                                    <span>💡</span> {item.curationPoint}
                                                </div>
                                            )}
                                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-600 transition-colors leading-tight">
                                                {item.productName}
                                            </h4>
                                            <div className="text-xs font-black text-slate-900 mt-0.5">
                                                {item.productPrice?.toLocaleString()}
                                                <span className="text-[10px] font-normal text-slate-500">원</span>
                                            </div>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all text-xs pr-1">
                                            <i className="fas fa-chevron-right text-[10px]"></i>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    추천 상품을 불러오는 중입니다...
                                </div>
                            )}
                        </div>
                    </div>

                    <Link
                        href="/shopping"
                        className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-all"
                    >
                        스마트 쇼핑 &amp; 핫딜 센터 바로가기
                    </Link>
                </div>
            </div>
        </section>
    );
};
