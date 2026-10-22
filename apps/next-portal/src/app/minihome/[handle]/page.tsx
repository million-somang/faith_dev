'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMinihome } from '@/hooks/useMinihome';
import { IsometricRoomCanvas } from '@/components/minihome/IsometricRoomCanvas';
import { MinihomeBgmPlayer } from '@/components/minihome/MinihomeBgmPlayer';
import { MinihomeShopDrawer } from '@/components/minihome/MinihomeShopDrawer';
import { MinihomeGuestbook } from '@/components/minihome/MinihomeGuestbook';
import { AdSlot } from '@/components/adsense/AdSlot';
import {
    MINIHOME_HOW_TO_STEPS,
    MINIHOME_MOODS,
    MINIHOME_SEO_FAQS,
    getCatalogItemById,
} from '@/data/minihomeCatalogData';

export default function MinihomePage() {
    const params = useParams();
    const router = useRouter();
    const rawHandleParam = typeof params?.handle === 'string' ? params.handle : 'me';

    const {
        profile,
        guestbook,
        surfData,
        isLoading,
        errorMessage,
        toastMessage,
        isEditMode,
        isSaving,
        isBuyingItemId,
        draftLayout,
        setDraftLayout,
        draftRoomTitle,
        setDraftRoomTitle,
        draftMood,
        setDraftMood,
        draftStatusMessage,
        setDraftStatusMessage,
        draftBgmTrackId,
        setDraftBgmTrackId,
        selectedTargetId,
        setSelectedTargetId,
        handleEnterEditMode,
        handleCancelEditMode,
        handleTileClick,
        handleApplyCatalogItem,
        handleFlipSelectedItem,
        handleRemoveSelectedItem,
        handleResetDefaultRoom,
        handleSaveMinihome,
        handlePurchaseItem,
        handleAddGuestbook,
        handleReplyGuestbook,
        handleSoftDeleteGuestbook,
        showToast,
    } = useMinihome(rawHandleParam);

    const [seoTab, setSeoTab] = useState<'howto' | 'faq' | 'neighbors'>('howto');
    const [showSurfModal, setShowSurfModal] = useState<boolean>(false);

    const activeMoodId = isEditMode ? draftMood : (profile?.statusMood || 'happy');
    const currentMoodMeta = MINIHOME_MOODS.find((m) => m.id === activeMoodId) || MINIHOME_MOODS[0];

    const handleRandomSurf = () => {
        const target = surfData.randomHandle || 'vera_official';
        router.push(`/minihome/${encodeURIComponent(target)}`);
    };

    const handleShareMinihome = async () => {
        if (typeof window === 'undefined' || !profile) return;
        const shareUrl = `${window.location.origin}/minihome/${encodeURIComponent(profile.handle)}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile.ownerName}님의 VERA 미니홈피`,
                    text: `${profile.roomTitle} - 내 방 구경 오세요!`,
                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showToast('🔗 내 미니홈피 주소가 클립보드에 복사되었습니다!');
            }
        } catch (_) {
            // 공유 취소 무시
        }
    };

    // JSON-LD 구조화 데이터 (WebApplication + HowTo + FAQPage)
    const webAppJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: profile ? `${profile.ownerName}님의 VERA 미니홈피 (내 방 꾸미기)` : 'VERA 미니홈피 내 방 꾸미기',
        description:
            '싸이월드 감성 2.5D 아이소메트릭 미니룸 꾸미기, 도토리(베라포인트) 가구 상점, 미니미 캐릭터, 감성 BGM 플레이어, 일촌 방명록 및 파도타기를 즐길 수 있는 소셜 미니홈피 서비스입니다.',
        applicationCategory: 'SocialNetworkingApplication',
        operatingSystem: 'All',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KRW',
        },
    };

    const howToJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'VERA 미니홈피 내 방 꾸미기 사용 방법',
        step: MINIHOME_HOW_TO_STEPS.map((s, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: s.title,
            text: s.description,
        })),
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: MINIHOME_SEO_FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
            },
        })),
    };

    return (
        <main className="min-h-screen bg-[#e8edf2]/60 py-6 sm:py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 토스트 알림 */}
            {toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-indigo-400/40 animate-bounce">
                    {toastMessage}
                </div>
            )}

            {/* 상단 헤더(PortalNavbar)와 1px 오차 없이 동일한 최상위 본문 컨테이너 */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 w-full space-y-6">
                {/* ==================== 1. 미니홈피 상단 아우터 헤더 프레임 ==================== */}
                <header className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* 좌측: TODAY / TOTAL 카운터 + 미니홈피 H1 타이틀 */}
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-mono font-black">
                                    <span className="text-rose-600">
                                        TODAY {(profile?.todayVisitors ?? 1).toLocaleString()}
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-700">
                                        TOTAL {(profile?.totalVisitors ?? 1).toLocaleString()}
                                    </span>
                                </div>

                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                    @{profile?.handle || 'vera_room'}
                                </span>

                                <Link
                                    href="/mypage"
                                    className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    ← 내 미니홈피(마이페이지)로
                                </Link>
                            </div>

                            {isEditMode ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        maxLength={45}
                                        value={draftRoomTitle}
                                        onChange={(e) => setDraftRoomTitle(e.target.value)}
                                        placeholder="내 미니홈피 대문 제목을 입력하세요"
                                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-300 text-base sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-96"
                                    />
                                </div>
                            ) : (
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {profile?.roomTitle || '사이좋은 사람들의 따뜻한 VERA 미니홈피'}
                                </h1>
                            )}
                        </div>

                        {/* 우측: BGM 미니 플레이어 & 액션 버튼들 */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <MinihomeBgmPlayer
                                trackId={isEditMode ? draftBgmTrackId : (profile?.bgmTrackId || 'bgm-orgel')}
                                isEditMode={isEditMode}
                                onChangeTrack={(newTrack) => {
                                    setDraftBgmTrackId(newTrack);
                                    if (!isEditMode && profile?.isOwner) {
                                        handleSaveMinihome({ bgmTrackId: newTrack });
                                    }
                                }}
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleRandomSurf}
                                    className="px-3.5 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                >
                                    <span>🌊 파도타기</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowSurfModal(true)}
                                    className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                >
                                    <i className="fas fa-users text-[11px]"></i>
                                    <span>이웃방</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleShareMinihome}
                                    className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                    title="내 미니홈피 주소 복사/공유"
                                >
                                    <i className="fas fa-share-nodes text-[11px]"></i>
                                    <span>공유</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ==================== 2. 로딩 및 에러 상태 처리 ==================== */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm font-bold text-slate-500">
                            미니룸 가구와 소품을 불러오는 중입니다...
                        </p>
                    </div>
                ) : errorMessage || !profile ? (
                    <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center space-y-4">
                        <p className="text-sm font-extrabold text-rose-600">
                            ⚠️ {errorMessage || '미니홈피 정보를 찾을 수 없습니다.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/minihome/vera_official')}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                        >
                            공식 샘플 미니룸으로 이동
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ==================== 3. 메인 12컬럼 그리드 (좌측 프로필 4 : 우측 미니룸·방명록 8) ==================== */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* ─── 좌측 사이드바: Today is... 기분 카드 & 프로필 & 이웃 목록 (lg:col-span-4) ─── */}
                            <aside className="lg:col-span-4 space-y-5">
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
                                    {/* Today is... 상태창 */}
                                    <div
                                        className={`p-3.5 rounded-2xl border ${currentMoodMeta.badgeBg} ${currentMoodMeta.border} flex items-center justify-between`}
                                    >
                                        <span className="text-xs font-black tracking-wider text-slate-500 uppercase">
                                            TODAY IS...
                                        </span>
                                        <span className={`text-sm font-black ${currentMoodMeta.badgeText} flex items-center gap-1.5`}>
                                            <span className="text-base">{currentMoodMeta.emoji}</span>
                                            <span>{currentMoodMeta.label}</span>
                                        </span>
                                    </div>

                                    {/* 기분 선택 칩 (꾸미기 모드 또는 방 주인일 때) */}
                                    {isEditMode && (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {MINIHOME_MOODS.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setDraftMood(m.id)}
                                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                                                        draftMood === m.id
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {m.emoji} {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* 대표 미니미 카드 & 주인장 소개 */}
                                    <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-slate-50 border border-slate-200/70 space-y-2">
                                        <div className="w-20 h-20 rounded-2xl bg-white border-2 border-indigo-200 shadow-xs mx-auto flex items-center justify-center p-1.5 overflow-hidden">
                                            <img
                                                src={
                                                    getCatalogItemById((isEditMode ? draftLayout : profile.layout).minimiItemId)
                                                        ?.spriteUrl || '/images/minihome/items/minimi-casual.png'
                                                }
                                                alt="대표 미니미 캐릭터"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="font-black text-base text-slate-900">
                                            {profile.ownerName}
                                        </div>
                                        <div className="text-[11px] font-bold text-indigo-600">
                                            {getCatalogItemById((isEditMode ? draftLayout : profile.layout).minimiItemId)?.name ||
                                                '캐주얼 데일리 미니미'}
                                        </div>

                                        {isEditMode ? (
                                            <textarea
                                                rows={3}
                                                maxLength={100}
                                                value={draftStatusMessage}
                                                onChange={(e) => setDraftStatusMessage(e.target.value)}
                                                placeholder="프로필 자기소개 한마디를 입력하세요"
                                                className="w-full mt-2 p-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1">
                                                “{profile.statusMessage}”
                                            </p>
                                        )}
                                    </div>

                                    {/* 방 꾸미기 / 내 방으로 가기 CTA */}
                                    <div className="space-y-2">
                                        {!isEditMode ? (
                                            <button
                                                type="button"
                                                onClick={handleEnterEditMode}
                                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <i className="fas fa-wand-magic-sparkles"></i>
                                                <span>내 방 꾸미기 & 도토리 상점 열기</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSaveMinihome()}
                                                disabled={isSaving}
                                                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <i className="fas fa-check"></i>
                                                <span>{isSaving ? '저장 중...' : '꾸미기 완료 & 저장하기'}</span>
                                            </button>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link
                                                href="/mypage"
                                                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs text-center transition-colors"
                                            >
                                                🏠 내 미니룸 홈
                                            </Link>
                                            <Link
                                                href="/lounge"
                                                className="py-2.5 px-3 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200/70 font-extrabold text-xs text-center transition-colors"
                                            >
                                                💬 소셜 라운지
                                            </Link>
                                        </div>
                                    </div>

                                    {/* 보유 베라포인트 & 아이템 현황 */}
                                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5 text-center">
                                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                                            <div className="text-[10px] font-bold text-amber-700">보유 도토리(P)</div>
                                            <div className="text-sm font-black text-amber-900 mt-0.5">
                                                🌰 {profile.veraPoints.toLocaleString()} P
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/70">
                                            <div className="text-[10px] font-bold text-indigo-700">보유 아이템</div>
                                            <div className="text-sm font-black text-indigo-900 mt-0.5">
                                                🎁 {profile.ownedItemIds.length}종
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 파도타기 추천 이웃 미니룸 미니 리스트 */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                            <span>🌊</span>
                                            <span>인기 이웃 미니룸 놀러가기</span>
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleRandomSurf}
                                            className="text-[11px] font-extrabold text-sky-600 hover:underline cursor-pointer"
                                        >
                                            랜덤 파도타기 →
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {surfData.popularRooms.slice(0, 4).map((room) => (
                                            <Link
                                                key={room.handle}
                                                href={`/minihome/${encodeURIComponent(room.handle)}`}
                                                className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-xs font-extrabold text-slate-900 truncate">
                                                        {room.ownerName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        {room.roomTitle}
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 text-[10px] font-black shrink-0">
                                                    TODAY {room.todayVisitors}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            {/* ─── 우측 메인 스테이지: 2.5D 아이소메트릭 미니룸 + 도토리 상점 + 방명록 (lg:col-span-8) ─── */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* 1) 2.5D 아이소메트릭 미니룸 캔버스 */}
                                <IsometricRoomCanvas
                                    layout={isEditMode ? draftLayout : profile.layout}
                                    ownerName={profile.ownerName}
                                    isEditMode={isEditMode}
                                    selectedTargetId={selectedTargetId}
                                    onSelectTarget={(id) => {
                                        if (!isEditMode) {
                                            handleEnterEditMode();
                                        }
                                        setSelectedTargetId(id);
                                    }}
                                    onTileClick={handleTileClick}
                                    onFlipSelected={handleFlipSelectedItem}
                                    onRemoveSelected={handleRemoveSelectedItem}
                                    onChangeSpeechBubble={(text) =>
                                        setDraftLayout((prev) => ({ ...prev, speechBubble: text }))
                                    }
                                />

                                {/* 2) 꾸미기 모드 활성화 시: 보관함 & 베라 상점 드로어 */}
                                {isEditMode && (
                                    <MinihomeShopDrawer
                                        ownedItemIds={profile.ownedItemIds}
                                        veraPoints={profile.veraPoints}
                                        draftLayout={draftLayout}
                                        isBuyingItemId={isBuyingItemId}
                                        onApplyItem={handleApplyCatalogItem}
                                        onPurchaseItem={handlePurchaseItem}
                                        onResetRoom={handleResetDefaultRoom}
                                        onSaveRoom={() => handleSaveMinihome()}
                                        onCancelEdit={handleCancelEditMode}
                                        isSaving={isSaving}
                                    />
                                )}

                                {/* 3) 일촌평 & 방문자 방명록 */}
                                <MinihomeGuestbook
                                    entries={guestbook}
                                    isOwner={profile.isOwner}
                                    ownerName={profile.ownerName}
                                    onAddEntry={handleAddGuestbook}
                                    onReplyEntry={handleReplyGuestbook}
                                    onDeleteEntry={handleSoftDeleteGuestbook}
                                />
                            </div>
                        </div>

                        {/* ==================== 4. Zero-CLS 애드센스 광고 슬롯 ==================== */}
                        <AdSlot format="horizontal" className="my-6" />

                        {/* ==================== 5. 온페이지 SEO 3탭 섹션 (사용방법 / FAQ / 인기 미니룸) ==================== */}
                        <section
                            aria-label="베라 미니홈피 내 방 꾸미기 가이드 및 자주 묻는 질문"
                            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSeoTab('howto')}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                            seoTab === 'howto'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        📖 내 방 꾸미기 방법
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSeoTab('faq')}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                            seoTab === 'faq'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        ❓ 자주 묻는 질문 (FAQ)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSeoTab('neighbors')}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                            seoTab === 'neighbors'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        🌊 추천 미니홈피 둘러보기
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleShareMinihome}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                    <i className="fas fa-share-alt mr-1.5"></i>내 방 링크 공유하기
                                </button>
                            </div>

                            {seoTab === 'howto' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-extrabold text-slate-900">
                                        추억의 싸이월드 감성 그대로! VERA 2.5D 미니룸 꾸미기 완벽 가이드
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        VERA 미니홈피는 2000년대 미니룸과 미니미, 도토리 상점, BGM 플레이어, 투데이 방문자 카운터, 일촌 방명록의 감성을 최신 웹 표준(2.5D 아이소메트릭 벡터 그래픽 & Web Audio 신디사이저)으로 재탄생시킨 공간입니다.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        {MINIHOME_HOW_TO_STEPS.map((item) => (
                                            <div
                                                key={item.step}
                                                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                                            >
                                                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">
                                                    STEP {item.step}
                                                </span>
                                                <h3 className="text-sm font-extrabold text-slate-900">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {seoTab === 'faq' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-extrabold text-slate-900">
                                        미니홈피 & 도토리(베라포인트) 상점 자주 묻는 질문
                                    </h2>
                                    <div className="space-y-3">
                                        {MINIHOME_SEO_FAQS.map((faq, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                                            >
                                                <h3 className="text-sm font-extrabold text-indigo-950">
                                                    Q. {faq.q}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                    A. {faq.a}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {seoTab === 'neighbors' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-extrabold text-slate-900">
                                        실시간 인기 이웃 미니룸 & 파도타기 추천
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {surfData.popularRooms.map((room) => (
                                            <Link
                                                key={room.handle}
                                                href={`/minihome/${encodeURIComponent(room.handle)}`}
                                                className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 transition-all space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-black text-slate-900">
                                                        {room.ownerName}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-rose-600">
                                                        TODAY {room.todayVisitors}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-indigo-700 truncate">
                                                    {room.roomTitle}
                                                </p>
                                                <p className="text-[11px] text-slate-500 line-clamp-2">
                                                    {room.statusMessage}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            {/* 이웃 미니룸 전체보기 모달 */}
            {showSurfModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <span>🌊</span>
                                <span>이웃 미니홈피 파도타기 목록</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowSurfModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {surfData.popularRooms.map((room) => (
                                <Link
                                    key={room.handle}
                                    href={`/minihome/${encodeURIComponent(room.handle)}`}
                                    onClick={() => setShowSurfModal(false)}
                                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 transition-colors"
                                >
                                    <div>
                                        <div className="text-sm font-black text-slate-900">
                                            {room.ownerName}{' '}
                                            <span className="text-xs font-normal text-slate-400">
                                                (@{room.handle})
                                            </span>
                                        </div>
                                        <div className="text-xs font-semibold text-indigo-600 mt-0.5">
                                            {room.roomTitle}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-black text-rose-600">
                                            TODAY {room.todayVisitors}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            TOTAL {room.totalVisitors}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSurfModal(false);
                                    handleRandomSurf();
                                }}
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black cursor-pointer"
                            >
                                🌊 랜덤 이웃 방으로 즉시 이동
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
