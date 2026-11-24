'use client';

import React, { useEffect, useState } from 'react';
import type { UseWebPushReturn } from '@/hooks/useWebPush';
import type { NotificationInboxItem } from '@/types/notification.types';

interface NotificationCenterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    webPush: UseWebPushReturn;
    onNavigateUrl?: (url: string) => void;
    initialTab?: 'settings' | 'inbox';
}

const CATEGORY_OPTIONS: Array<{
    key: string;
    emoji: string;
    label: string;
    description: string;
}> = [
    {
        key: 'azit.kitchen',
        emoji: '🍳',
        label: '아지트 요리 완성',
        description: '화구 조리가 끝나면 주방으로 바로 이동할 수 있게 알려드려요.',
    },
    {
        key: 'azit.garden',
        emoji: '💧',
        label: '아지트 작물 물주기',
        description: '8시간마다 텃밭에 물을 줄 시간이 되면 푸시 알림을 보내드려요.',
    },
    {
        key: 'azit.camp',
        emoji: '⚔️',
        label: '아지트 용병 전투 완료',
        description: '원정대가 복귀하면 용병 캠프로 바로 접속할 수 있어요.',
    },
    {
        key: 'schedule',
        emoji: '📅',
        label: 'My Life 일정 1시간 전',
        description: '캘린더에 등록한 개인 일정 시작 1시간 전에 미리 알려드려요.',
    },
    {
        key: 'system',
        emoji: '📢',
        label: '시스템 · 외부 API 알림',
        description: '포털 공지 및 범용 알림 API로 수신되는 작업 완료 알림이에요.',
    },
];

function getCategoryBadge(category: string): { emoji: string; label: string; badgeClass: string } {
    switch (category) {
        case 'azit.kitchen':
            return { emoji: '🍳', label: '주방', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
        case 'azit.garden':
            return { emoji: '💧', label: '텃밭', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        case 'azit.camp':
            return { emoji: '⚔️', label: '용병 캠프', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
        case 'schedule':
            return { emoji: '📅', label: '일정', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
        default:
            return { emoji: '📢', label: '시스템', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
}

function formatKoreanTimestamp(raw: string | null): string {
    if (!raw) return '';
    try {
        const normalized = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return raw;
        return new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    } catch {
        return raw;
    }
}

export const NotificationCenterPanel: React.FC<NotificationCenterPanelProps> = ({
    isOpen,
    onClose,
    webPush,
    onNavigateUrl,
    initialTab = 'settings',
}) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'inbox'>(initialTab);
    const [quietStartDraft, setQuietStartDraft] = useState<string>(webPush.preferences.quietStartHHMM);
    const [quietEndDraft, setQuietEndDraft] = useState<string>(webPush.preferences.quietEndHHMM);

    useEffect(() => {
        setQuietStartDraft(webPush.preferences.quietStartHHMM);
        setQuietEndDraft(webPush.preferences.quietEndHHMM);
    }, [webPush.preferences.quietStartHHMM, webPush.preferences.quietEndHHMM]);

    useEffect(() => {
        if (!isOpen) return;
        webPush.refreshAll().catch(() => {});
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, webPush.refreshAll]);

    if (!isOpen) return null;

    const handleClickInboxItem = async (item: NotificationInboxItem) => {
        if (!item.readAt) {
            await webPush.markRead(item.id);
        }
        onClose();
        if (onNavigateUrl) {
            onNavigateUrl(item.url || '/mypage');
        } else if (typeof window !== 'undefined') {
            window.location.href = item.url || '/mypage';
        }
    };

    const permissionLabel =
        webPush.permission === 'granted'
            ? '허용됨'
            : webPush.permission === 'denied'
              ? '차단됨'
              : webPush.permission === 'default'
                ? '미허용'
                : '미지원';

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-xl max-h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 상단 헤더 */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs text-base">
                            🔔
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900">
                                VERA 푸시 알림 센터
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-500">
                                연결 기기 {webPush.devices.length}대 · 이 기기{' '}
                                {webPush.isSubscribed ? '수신 ON' : '수신 OFF'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="알림 센터 닫기"
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>

                {/* 탭 전환 바 */}
                <div className="px-5 pt-3 pb-2 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'settings'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>⚙️</span>
                        <span>기기 구독 · 알림 설정</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'inbox'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>📬</span>
                        <span>최근 알림함</span>
                        {webPush.unreadCount > 0 && (
                            <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeTab === 'inbox'
                                        ? 'bg-white text-indigo-700'
                                        : 'bg-rose-500 text-white'
                                }`}
                            >
                                {webPush.unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 본문 영역 */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {webPush.feedback && (
                        <div
                            className={`p-3 rounded-2xl border text-xs font-bold flex items-start justify-between gap-2 ${
                                webPush.feedback.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : webPush.feedback.type === 'error'
                                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                                      : 'bg-sky-50 border-sky-200 text-sky-800'
                            }`}
                        >
                            <span className="leading-relaxed">{webPush.feedback.message}</span>
                            <button
                                type="button"
                                onClick={webPush.clearFeedback}
                                className="text-[11px] opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {activeTab === 'settings' ? (
                        <>
                            {/* iPhone / iOS 홈 화면 추가 안내 (iOS Safari 일반 탭 접속 시) */}
                            {webPush.needsIosHomeScreenInstall && (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                                        <span>📱</span>
                                        <span>iPhone / iPad 푸시 알림 받는 방법 (iOS 16.4+)</span>
                                    </div>
                                    <ol className="text-[11px] font-semibold text-amber-800 space-y-1 pl-4 list-decimal leading-relaxed">
                                        <li>Safari 하단의 <strong>공유 버튼(⬆️)</strong>을 눌러주세요.</li>
                                        <li>메뉴에서 <strong>「홈 화면에 추가」</strong>를 선택해 VERA 앱을 설치하세요.</li>
                                        <li>홈 화면에 생긴 <strong>VERA 아이콘</strong>으로 실행한 뒤 아래 알림 켜기를 누르면 잠금화면 푸시가 동작합니다.</li>
                                    </ol>
                                </div>
                            )}

                            {/* 1) 현재 기기 푸시 연결 & 테스트 발송 */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                            <span>📡 이 기기 푸시 수신 상태</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                    webPush.isSubscribed
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {webPush.isSubscribed ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                            브라우저 권한: {permissionLabel} · 내 계정 연결 기기 {webPush.devices.length}대
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={webPush.isBusy}
                                            onClick={() => webPush.toggleSubscription()}
                                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 ${
                                                webPush.isSubscribed
                                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                            }`}
                                        >
                                            {webPush.isBusy
                                                ? '처리 중...'
                                                : webPush.isSubscribed
                                                  ? '이 기기 해제'
                                                  : '🔔 이 기기 알림 켜기'}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={webPush.isBusy}
                                            onClick={() => webPush.sendTestPush()}
                                            className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            테스트 발송
                                        </button>
                                    </div>
                                </div>

                                {webPush.devices.length > 0 && (
                                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap gap-1.5">
                                        {webPush.devices.map((dev) => (
                                            <span
                                                key={dev.id}
                                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600"
                                            >
                                                💻 {dev.deviceLabel || '등록 기기'}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2) 카테고리별 알림 ON/OFF */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-700 px-1">
                                    알림 받을 항목
                                </h4>
                                <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                                    {CATEGORY_OPTIONS.map((cat) => {
                                        const isOn = webPush.preferences.categories[cat.key] !== false;
                                        return (
                                            <div
                                                key={cat.key}
                                                className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                                        <span>{cat.emoji}</span>
                                                        <span>{cat.label}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                        {cat.description}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isOn}
                                                    disabled={webPush.isBusy}
                                                    onClick={() =>
                                                        webPush.updatePreferences({
                                                            categories: { [cat.key]: !isOn },
                                                        })
                                                    }
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                                        isOn ? 'bg-indigo-600' : 'bg-slate-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                                            isOn ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3) 방해금지 시간 (선택형) */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-extrabold text-slate-900">
                                            🌙 방해금지 시간 (한국시간 기준)
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            켜 두면 해당 시간대 알림을 종료 시각에 묶어서 발송합니다.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={webPush.preferences.quietHoursEnabled}
                                        disabled={webPush.isBusy}
                                        onClick={() =>
                                            webPush.updatePreferences({
                                                quietHoursEnabled: !webPush.preferences.quietHoursEnabled,
                                            })
                                        }
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                            webPush.preferences.quietHoursEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                                webPush.preferences.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {webPush.preferences.quietHoursEnabled && (
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70">
                                        <input
                                            type="time"
                                            value={quietStartDraft}
                                            onChange={(e) => setQuietStartDraft(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800"
                                        />
                                        <span className="text-xs font-bold text-slate-500">~</span>
                                        <input
                                            type="time"
                                            value={quietEndDraft}
                                            onChange={(e) => setQuietEndDraft(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800"
                                        />
                                        <button
                                            type="button"
                                            disabled={webPush.isBusy}
                                            onClick={() =>
                                                webPush.updatePreferences({
                                                    quietHoursEnabled: true,
                                                    quietStartHHMM: quietStartDraft,
                                                    quietEndHHMM: quietEndDraft,
                                                })
                                            }
                                            className="ml-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            시간 저장
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* 최근 알림함 탭 */
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-700">
                                    최근 수신 알림 ({webPush.inbox.length}건)
                                </span>
                                {webPush.unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => webPush.markAllRead()}
                                        className="text-[11px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        모두 읽음 처리
                                    </button>
                                )}
                            </div>

                            {webPush.inbox.length === 0 ? (
                                <div className="py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                                    <div className="text-3xl">📭</div>
                                    <p className="text-xs font-black text-slate-700">
                                        아직 도착한 알림이 없습니다.
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500">
                                        아지트에서 요리를 시작하거나 설정 탭에서 테스트 알림을 보내면 여기에 표시됩니다.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {webPush.inbox.map((item) => {
                                        const badge = getCategoryBadge(item.category);
                                        const isUnread = !item.readAt;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`group p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                                                    isUnread
                                                        ? 'bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50/70'
                                                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleClickInboxItem(item)}
                                                    className="flex-1 text-left cursor-pointer min-w-0 space-y-1"
                                                >
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${badge.badgeClass}`}
                                                        >
                                                            {badge.emoji} {badge.label}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                                        )}
                                                        <span className="text-[10px] font-semibold text-slate-400">
                                                            {formatKoreanTimestamp(item.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-black text-slate-900 truncate">
                                                        {item.title}
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                                                        {item.body}
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => webPush.dismissInboxItem(item.id)}
                                                    aria-label="알림 숨기기"
                                                    className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs shrink-0 cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
