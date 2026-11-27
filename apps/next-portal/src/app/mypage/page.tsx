'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { t } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MyLifeSection } from '@/components/mypage/MyLifeSection';
import { DriveVideoPlayerSection } from '@/components/mypage/DriveVideoPlayerSection';
import { FrequentAppsSection } from '@/components/mypage/FrequentAppsSection';
import { useMinihome } from '@/hooks/useMinihome';
import { useAzitGame } from '@/hooks/useAzitGame';
import { useWebPush } from '@/hooks/useWebPush';
import type { AzitZoneType } from '@/types/azit-game.types';
import type { MinihomeGardenState } from '@/types/minihome.types';
import { IsometricRoomCanvas } from '@/components/minihome/IsometricRoomCanvas';
import { MinihomeShopDrawer } from '@/components/minihome/MinihomeShopDrawer';
import { MinihomeGuestbook } from '@/components/minihome/MinihomeGuestbook';
import { NotificationCenterPanel } from '@/components/notifications/NotificationCenterPanel';
import { MINIHOME_MOODS, VERA_POINT_SHOP_ENABLED, getCatalogItemById } from '@/data/minihomeCatalogData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─── 명리학 사주 연산 이식 (사주 미니앱 알고리즘 일치) ───
const CHEONGAN = ['갑(甲)', '을(을)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];
const CHEONGAN_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '갑(甲)': 'wood', '을(을)': 'wood', '병(丙)': 'fire', '정(丁)': 'fire', '무(戊)': 'earth', '기(己)': 'earth', '경(庚)': 'metal', '신(辛)': 'metal', '임(壬)': 'water', '계(癸)': 'water'
};
const JIJI_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '인(寅)': 'wood', '묘(卯)': 'wood', '사(巳)': 'fire', '오(午)': 'fire', '진(辰)': 'earth', '미(未)': 'earth', '술(戌)': 'earth', '축(丑)': 'earth', '신(申)': 'metal', '유(酉)': 'metal', '자(子)': 'water', '해(亥)': 'water'
};

const SCHEDULE_COLOR_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badge: string; dot: string }> = {
    blue: { label: '업무', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
    emerald: { label: '개인', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
    amber: { label: '미팅', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
    rose: { label: '중요', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', badge: 'bg-rose-500 text-white', dot: 'bg-rose-500' },
    purple: { label: '기타', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80', badge: 'bg-purple-500 text-white', dot: 'bg-purple-500' },
};

function getSeedHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function calculateSaju(name: string, dateStr: string): { wood: number; fire: number; earth: number; metal: number; water: number; nature: string } {
    const seed = getSeedHash(`${name}_${dateStr}`);

    const yearIndex = (seed % 10);
    const yearJijiIndex = ((seed + 2) % 12);
    const monthIndex = ((seed + 3) % 10);
    const monthJijiIndex = ((seed + 5) % 12);
    const dayIndex = ((seed + 7) % 10);
    const dayJijiIndex = ((seed + 1) % 12);

    const yearGan = CHEONGAN[yearIndex];
    const yearJi = JIJI[yearJijiIndex];
    const monthGan = CHEONGAN[monthIndex];
    const monthJi = JIJI[monthJijiIndex];
    const dayGan = CHEONGAN[dayIndex];
    const dayJi = JIJI[dayJijiIndex];

    const eightCharacters = [
        { type: 'gan', elem: CHEONGAN_ELEMENT[yearGan] },
        { type: 'ji', elem: JIJI_ELEMENT[yearJi] },
        { type: 'gan', elem: CHEONGAN_ELEMENT[monthGan] },
        { type: 'ji', elem: JIJI_ELEMENT[monthJi] },
        { type: 'gan', elem: CHEONGAN_ELEMENT[dayGan] },
        { type: 'ji', elem: JIJI_ELEMENT[dayJi] }
    ];

    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    eightCharacters.forEach((char, idx) => {
        let weight = 10;
        if (char.type === 'ji') weight = 15;
        if (idx === 4) weight = 20; // 일간 가중치
        counts[char.elem] += weight;
    });

    const totalWeight = Object.values(counts).reduce((a, b) => a + b, 0);
    const elements = {
        wood: Math.round((counts.wood / totalWeight) * 100),
        fire: Math.round((counts.fire / totalWeight) * 100),
        earth: Math.round((counts.earth / totalWeight) * 100),
        metal: Math.round((counts.metal / totalWeight) * 100),
        water: Math.round((counts.water / totalWeight) * 100)
    };

    // 보정
    const sum = elements.wood + elements.fire + elements.earth + elements.metal + elements.water;
    if (sum !== 100) {
        elements.wood += (100 - sum);
    }

    const dayElement = CHEONGAN_ELEMENT[dayGan];
    let nature = "";
    if (dayElement === 'wood') {
        nature = "자비롭고 선구적인 목(木)의 성향을 타고나 성장 역량이 뛰어납니다.";
    } else if (dayElement === 'fire') {
        nature = "명랑하고 정의로운 화(火)의 기운을 가져 표현과 사교성이 풍부합니다.";
    } else if (dayElement === 'earth') {
        nature = "듬직하고 포용력 있는 토(土)의 기운으로 주위의 신망이 아주 두텁습니다.";
    } else if (dayElement === 'metal') {
        nature = "결단력 있고 강한 의지의 금(金)의 기질로 매사에 빈틈없이 추진합니다.";
    } else {
        nature = "유연하고 지혜로운 수(水)의 성질로 뛰어난 적응력과 임기응변을 보입니다.";
    }

    return { ...elements, nature };
}

export default function MyPage() {
    const { user, logout, isLoading, updateUser } = useAuth();
    const router = useRouter();
    const azitRefreshRef = useRef<(() => void) | null>(null);

    const {
        profile: minihomeProfile,
        guestbook: minihomeGuestbook,
        surfData: minihomeSurfData,
        isLoading: minihomeLoading,
        toastMessage: minihomeToastMessage,
        isEditMode: minihomeEditMode,
        isShopModalOpen: minihomeShopModalOpen,
        setIsShopModalOpen: setMinihomeShopModalOpen,
        shopModalInitialTab: minihomeShopInitialTab,
        shopModalInitialCategory: minihomeShopInitialCategory,
        handleOpenShopModal: handleMinihomeOpenShopModal,
        isGuestbookModalOpen: minihomeGuestbookModalOpen,
        setIsGuestbookModalOpen: setMinihomeGuestbookModalOpen,
        isSaving: minihomeSaving,
        isBuyingItemId: minihomeBuyingItemId,
        draftLayout: minihomeDraftLayout,
        setDraftLayout: setMinihomeDraftLayout,
        draftRoomTitle: minihomeDraftRoomTitle,
        setDraftRoomTitle: setMinihomeDraftRoomTitle,
        draftMood: minihomeDraftMood,
        setDraftMood: setMinihomeDraftMood,
        draftStatusMessage: minihomeDraftStatusMessage,
        setDraftStatusMessage: setMinihomeDraftStatusMessage,
        draftBgmTrackId: minihomeDraftBgmTrackId,
        setDraftBgmTrackId: setMinihomeDraftBgmTrackId,
        selectedTargetId: minihomeSelectedTargetId,
        setSelectedTargetId: setMinihomeSelectedTargetId,
        handleEnterEditMode: handleMinihomeEnterEditMode,
        handleCancelEditMode: handleMinihomeCancelEditMode,
        handleTileClick: handleMinihomeTileClick,
        handleApplyCatalogItem: handleMinihomeApplyCatalogItem,
        handleFlipSelectedItem: handleMinihomeFlipSelectedItem,
        handleRemoveSelectedItem: handleMinihomeRemoveSelectedItem,
        handleResetDefaultRoom: handleMinihomeResetDefaultRoom,
        handleSaveMinihome,
        handleBuySeed: handleMinihomeBuySeed,
        handlePlantCrop: handleMinihomePlantCrop,
        handleWaterPlot: handleMinihomeWaterPlot,
        handleHarvestPlot: handleMinihomeHarvestPlot,
        handleClearPlot: handleMinihomeClearPlot,
        handlePurchaseItem: handleMinihomePurchaseItem,
        handleAddGuestbook: handleMinihomeAddGuestbook,
        handleReplyGuestbook: handleMinihomeReplyGuestbook,
        handleSoftDeleteGuestbook: handleMinihomeSoftDeleteGuestbook,
        syncAzitState,
        showToast: showMinihomeToast,
    } = useMinihome('me', {
        onGardenSynced: () => azitRefreshRef.current?.(),
    });

    const [showSurfModal, setShowSurfModal] = useState<boolean>(false);
    const [shopCategoryOverride, setShopCategoryOverride] = useState<'fertilizer' | null>(null);
    const activeMoodId = minihomeEditMode ? minihomeDraftMood : (minihomeProfile?.statusMood || 'happy');
    const currentMoodMeta = MINIHOME_MOODS.find((m) => m.id === activeMoodId) || MINIHOME_MOODS[0];

    const handleRandomSurf = () => {
        if (!minihomeSurfData.randomHandle) {
            showMinihomeToast('아직 방문 가능한 다른 회원의 아지트가 없습니다.');
            return;
        }
        router.push(`/minihome/${encodeURIComponent(minihomeSurfData.randomHandle)}`);
    };

    const handleShareMinihome = async () => {
        if (typeof window === 'undefined' || !minihomeProfile) return;
        const shareUrl = `${window.location.origin}/minihome/${encodeURIComponent(minihomeProfile.handle)}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${minihomeProfile.ownerName}님의 VERA 아지트`,
                    text: `${minihomeProfile.roomTitle} - 내 아지트 구경 오세요!`,
                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showMinihomeToast('🔗 내 아지트 주소가 클립보드에 복사되었습니다!');
            }
        } catch (_) {
            // 공유 취소 무시
        }
    };

    const webPush = useWebPush({ enabled: Boolean(user) });
    const isPushSubscribed = webPush.isSubscribed;
    const pushLoading = webPush.isBusy;
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [requestedAzitZone, setRequestedAzitZone] = useState<AzitZoneType | null>(null);
    const [azitZoneSyncNonce, setAzitZoneSyncNonce] = useState<number>(0);

    const handleTogglePush = useCallback(async () => {
        const ok = await webPush.toggleSubscription();
        if (!ok && webPush.needsIosHomeScreenInstall) {
            setIsNotificationModalOpen(true);
        }
    }, [webPush]);

    // ─── activeSection 디폴트를 dashboard(내 아지트)로 개편 ───
    const [activeSection, setActiveSection] = useState<'dashboard' | 'schedule' | 'video' | 'apps'>('dashboard');

    const applyNotificationUrl = useCallback((rawUrl: string) => {
        if (typeof window === 'undefined') return;
        try {
            const parsed = new URL(rawUrl, window.location.origin);
            if (parsed.pathname !== window.location.pathname) {
                router.push(`${parsed.pathname}${parsed.search}${parsed.hash}`);
                return;
            }
            const sec = parsed.searchParams.get('section');
            const zone = parsed.searchParams.get('zone');
            const isValidZone = zone === 'indoor' || zone === 'garden' || zone === 'kitchen' || zone === 'camp';

            if (sec === 'video' || sec === 'schedule' || sec === 'dashboard' || sec === 'apps') {
                setActiveSection(sec);
            } else if (isValidZone) {
                setActiveSection('dashboard');
            }

            if (isValidZone) {
                setRequestedAzitZone(zone);
                setAzitZoneSyncNonce((prev) => prev + 1);
                azitRefreshRef.current?.();
            }

            const nextPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
            if (window.location.pathname + window.location.search + window.location.hash !== nextPath) {
                window.history.replaceState(null, '', nextPath);
            }
        } catch {
            // ignore malformed URL
        }
    }, [router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const syncSectionFromUrl = () => {
            applyNotificationUrl(window.location.href);
        };
        const handleOpenVideoPlayer = () => {
            setActiveSection('video');
        };
        const handleSwMessage = (event: MessageEvent) => {
            const msgData = event.data as { type?: unknown; url?: unknown; notificationId?: unknown } | null;
            if (!msgData || typeof msgData !== 'object') return;
            if (msgData.type === 'VERA_NOTIFICATION_NAVIGATE' && typeof msgData.url === 'string') {
                if (typeof msgData.notificationId === 'number' && msgData.notificationId > 0) {
                    webPush.markRead(msgData.notificationId).catch(() => {});
                }
                applyNotificationUrl(msgData.url);
            }
        };
        syncSectionFromUrl();
        window.addEventListener('popstate', syncSectionFromUrl);
        window.addEventListener('vera:open-video-player', handleOpenVideoPlayer);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSwMessage);
        }
        return () => {
            window.removeEventListener('popstate', syncSectionFromUrl);
            window.removeEventListener('vera:open-video-player', handleOpenVideoPlayer);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSwMessage);
            }
        };
    }, [applyNotificationUrl, webPush.markRead]);
    // 데이터 상태 관리 (목업 데이터 없이 실데이터만 연동)
    const [newsData, setNewsData] = useState<{ keywords: any[], keywordNews: any[], bookmarks: any[] }>({ keywords: [], keywordNews: [], bookmarks: [] });
    const [stocksData, setStocksData] = useState<{ stats: any, watchlist: any[] }>({ stats: {}, watchlist: [] });
    const [shoppingItems, setShoppingItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleDeleteKeyword = async (keywordId?: number | string, keywordName?: string) => {
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            if (keywordId) {
                await instance.delete(`/api/user/keywords/${keywordId}`);
            } else if (keywordName) {
                // Find matching keyword in newsData.keywords
                const matched = newsData.keywords.find((k: any) => (typeof k === 'string' ? k : k.keyword) === keywordName);
                if (matched && matched.id) {
                    await instance.delete(`/api/user/keywords/${matched.id}`);
                }
            }
            const [kwRes, kwNewsRes] = await Promise.all([
                instance.get('/api/user/keywords').catch(() => ({ data: {} })),
                instance.get('/api/user/news/keywords?limit=5').catch(() => ({ data: {} }))
            ]);
            setNewsData(prev => ({
                ...prev,
                keywords: kwRes.data.keywords || [],
                keywordNews: kwNewsRes.data.news || []
            }));
        } catch (err) {
            console.error('Failed to delete keyword:', err);
        }
    };

    const [veraPointsData, setVeraPointsData] = useState<{
        points: number;
        pendingAmount: number;
        attendanceRatio: number;
        activityRatio: number;
    }>({
        points: 0,
        pendingAmount: 0,
        attendanceRatio: 0,
        activityRatio: 0
    });

    const handleSyncAzitToMypage = useCallback(
        (veraPoints: number, garden?: MinihomeGardenState) => {
            syncAzitState(veraPoints, garden);
            setVeraPointsData((prev) => ({
                ...prev,
                points: veraPoints,
            }));
        },
        [syncAzitState]
    );

    const azitGame = useAzitGame({
        enabled: Boolean(user),
        onSyncState: handleSyncAzitToMypage,
        onToast: showMinihomeToast,
    });

    useEffect(() => {
        azitRefreshRef.current = () => {
            azitGame.refreshState().catch(() => {});
        };
    }, [azitGame.refreshState]);

    const [bizAgenda, setBizAgenda] = useState<{ id: number | string; schedule_date?: string; end_date?: string; schedule_time?: string; end_time?: string; time?: string; schedule_text?: string; text?: string; color?: string }[]>([]);
    const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

    const [newAgendaDate, setNewAgendaDate] = useState(todayStr);
    const [newAgendaEndDate, setNewAgendaEndDate] = useState(todayStr);
    const [newAgendaTime, setNewAgendaTime] = useState('09:00');
    const [newAgendaEndTime, setNewAgendaEndTime] = useState('18:00');
    const [newAgendaText, setNewAgendaText] = useState('');
    const [newAgendaColor, setNewAgendaColor] = useState('blue');
    const [isAllDay, setIsAllDay] = useState(false);

    const handleToggleAllDay = () => {
        if (!isAllDay) {
            setIsAllDay(true);
            setNewAgendaTime('00:00');
            setNewAgendaEndTime('23:59');
        } else {
            setIsAllDay(false);
            setNewAgendaTime('09:00');
            setNewAgendaEndTime('18:00');
        }
    };

    const handleSetPresetDuration = (days: number) => {
        if (!newAgendaDate) return;
        const sDate = new Date(newAgendaDate);
        sDate.setDate(sDate.getDate() + (days - 1));
        const eStr = sDate.toISOString().substring(0, 10);
        setNewAgendaEndDate(eStr);
    };

    const handleAddAgenda = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgendaText.trim()) return;
        const targetDate = newAgendaDate || todayStr;
        let targetEndDate = newAgendaEndDate || targetDate;
        if (targetEndDate < targetDate) targetEndDate = targetDate;
        const targetTime = isAllDay ? '00:00' : (newAgendaTime || '09:00');
        const targetEndTime = isAllDay ? '23:59' : (newAgendaEndTime || '18:00');
        const targetColor = newAgendaColor || 'blue';
        const targetText = newAgendaText.trim();

        const newItem = {
            id: Date.now(),
            schedule_date: targetDate,
            end_date: targetEndDate,
            schedule_time: targetTime,
            end_time: targetEndTime,
            schedule_text: targetText,
            color: targetColor
        };

        // UI & LocalStorage 우선 즉시 업데이트 (항상 저장 보장)
        setBizAgenda(prev => {
            const updated = [...prev, newItem];
            localStorage.setItem('faith_user_schedules', JSON.stringify(updated));
            return updated;
        });
        setNewAgendaText('');
        setSelectedDate(targetDate);

        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.post('/api/user/schedules', {
                date: targetDate,
                endDate: targetEndDate,
                time: targetTime,
                endTime: targetEndTime,
                text: targetText,
                color: targetColor
            });
            if (res.data && res.data.success && Array.isArray(res.data.schedules) && res.data.schedules.length > 0) {
                setBizAgenda(res.data.schedules);
                localStorage.setItem('faith_user_schedules', JSON.stringify(res.data.schedules));
            }
        } catch (err) {
            console.error('API call failed, schedule saved to local storage:', err);
        }
    };

    const handleRemoveAgenda = async (id: number | string) => {
        setBizAgenda(prev => {
            const updated = prev.filter(item => item.id !== id);
            localStorage.setItem('faith_user_schedules', JSON.stringify(updated));
            return updated;
        });

        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.delete(`/api/user/schedules/${id}`);
            if (res.data && res.data.success && Array.isArray(res.data.schedules)) {
                setBizAgenda(res.data.schedules);
                localStorage.setItem('faith_user_schedules', JSON.stringify(res.data.schedules));
            }
        } catch (err) {
            console.error('Failed to delete schedule on server:', err);
        }
    };

    const handlePrevMonth = () => {
        if (calMonth === 1) {
            setCalYear(y => y - 1);
            setCalMonth(12);
        } else {
            setCalMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (calMonth === 12) {
            setCalYear(y => y + 1);
            setCalMonth(1);
        } else {
            setCalMonth(m => m + 1);
        }
    };

    const handleGoToday = () => {
        const now = new Date();
        setCalYear(now.getFullYear());
        setCalMonth(now.getMonth() + 1);
        const dateStr = now.toISOString().substring(0, 10);
        setSelectedDate(dateStr);
        setNewAgendaDate(dateStr);
    };

    const calendarDays = useMemo(() => {
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();

        const cells = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevM = calMonth === 1 ? 12 : calMonth - 1;
            const prevY = calMonth === 1 ? calYear - 1 : calYear;
            const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum,
                isCurrentMonth: false,
                isToday: dateStr === todayStr
            });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: true,
                isToday: dateStr === todayStr
            });
        }

        const remaining = (7 - (cells.length % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            const nextM = calMonth === 12 ? 1 : calMonth + 1;
            const nextY = calMonth === 12 ? calYear + 1 : calYear;
            const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: false,
                isToday: dateStr === todayStr
            });
        }

        return cells;
    }, [calYear, calMonth, todayStr]);

    const schedulesByDate = useMemo(() => {
        const map: Record<string, typeof bizAgenda> = {};
        bizAgenda.forEach(item => {
            const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
            const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;

            let curr = new Date(sDate);
            const end = new Date(eDate);
            let limit = 0;
            while (curr <= end && limit < 365) {
                const dateKey = curr.toISOString().substring(0, 10);
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(item);
                curr.setDate(curr.getDate() + 1);
                limit++;
            }
        });
        return map;
    }, [bizAgenda, todayStr]);

    const displaySchedules = useMemo(() => {
        if (selectedDate) {
            return bizAgenda.filter(item => {
                const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
                const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
                return selectedDate >= sDate && selectedDate <= eDate;
            });
        }
        const yearMonthPrefix = `${calYear}-${String(calMonth).padStart(2, '0')}`;
        return bizAgenda.filter(item => {
            const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
            const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
            return sDate.startsWith(yearMonthPrefix) || eDate.startsWith(yearMonthPrefix) || (sDate <= `${yearMonthPrefix}-31` && eDate >= `${yearMonthPrefix}-01`);
        });
    }, [bizAgenda, selectedDate, calYear, calMonth, todayStr]);

    // 생년월일 관리: DB(user.birth_date) 우선, 로컬스토리지 백업
    const [birthDate, setBirthDate] = useState(() => {
        const localBirth = typeof window !== 'undefined' ? (localStorage.getItem('user_birth_date') || localStorage.getItem('faith_saju_birth_date')) : null;
        return user?.birth_date || localBirth || '';
    });
    const [tempBirthDate, setTempBirthDate] = useState(birthDate);
    const [showBirthEditor, setShowBirthEditor] = useState(!birthDate);

    // user 객체의 birth_date가 변경되거나 로드될 때 동기화
    useEffect(() => {
        if (user?.birth_date) {
            setBirthDate(user.birth_date);
            setTempBirthDate(user.birth_date);
            setShowBirthEditor(false);
            localStorage.setItem('user_birth_date', user.birth_date);
            localStorage.setItem('faith_saju_birth_date', user.birth_date);
        }
    }, [user?.birth_date]);

    const handleSaveBirth = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = tempBirthDate.trim();
        if (!trimmed) return;

        // 1. 로컬 스토리지 즉시 반영
        localStorage.setItem('user_birth_date', trimmed);
        localStorage.setItem('faith_saju_birth_date', trimmed);
        setBirthDate(trimmed);
        setShowBirthEditor(false);

        // 2. 서버 DB 영구 저장 & AuthContext 전역 동기화
        if (updateUser) {
            try {
                await updateUser({ birth_date: trimmed, birthDate: trimmed } as any);
            } catch (err) {
                console.error('Failed to persist birth_date to server DB:', err);
            }
        }
    };

    // 로그인 회원의 사주 계산 및 가이드 (항상 Early Return 상단에서 호출)
    const saju = useMemo(() => {
        return (birthDate && user?.name) ? calculateSaju(user.name, birthDate) : null;
    }, [birthDate, user?.name]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user) return;

        const loadSectionData = async () => {
            setLoading(true);
            try {
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });

                // ─── 내 아지트(dashboard)는 아지트 관련 포인트 상태만 경량 조회 ───
                if (activeSection === 'dashboard') {
                    const veraPointsRes = await instance.get(`/api/user/vera-points`).catch(() => ({ data: {} }));
                    if (veraPointsRes.data && veraPointsRes.data.success) {
                        setVeraPointsData({
                            points: veraPointsRes.data.points ?? 0,
                            pendingAmount: veraPointsRes.data.pendingAmount ?? 0,
                            attendanceRatio: veraPointsRes.data.attendanceRatio ?? 0,
                            activityRatio: veraPointsRes.data.activityRatio ?? 0
                        });
                    }
                }

                // ─── My Life(schedule)는 라이프·퍼스널 통합 위젯 실데이터를 일괄 조회 ───
                else if (activeSection === 'schedule') {
                    const [kwRes, kwNewsRes, statsStocksRes, wlRes, schedulesRes, veraPointsRes] = await Promise.all([
                        instance.get(`/api/user/keywords`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/news/keywords?limit=6`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/schedules`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/vera-points`).catch(() => ({ data: {} }))
                    ]);

                    const fetchedWatchlist = (wlRes.data && Array.isArray(wlRes.data.stocks))
                        ? wlRes.data.stocks
                        : [];

                    const activeKeywords = (kwRes.data && Array.isArray(kwRes.data.keywords) && kwRes.data.keywords.length > 0)
                        ? kwRes.data.keywords
                        : (kwNewsRes.data && kwNewsRes.data.keywords ? kwNewsRes.data.keywords : []);

                    setNewsData(prev => ({
                        ...prev,
                        keywords: activeKeywords,
                        keywordNews: kwNewsRes.data.news || [],
                    }));
                    setStocksData({
                        stats: statsStocksRes.data.stats || {},
                        watchlist: fetchedWatchlist
                    });
                    const localSavedSchedules = JSON.parse(localStorage.getItem('faith_user_schedules') || '[]');
                    const fetchedSchedules = (schedulesRes.data && Array.isArray(schedulesRes.data.schedules) && schedulesRes.data.schedules.length > 0)
                        ? schedulesRes.data.schedules
                        : localSavedSchedules;
                    setBizAgenda(fetchedSchedules);

                    if (veraPointsRes.data && veraPointsRes.data.success) {
                        setVeraPointsData({
                            points: veraPointsRes.data.points ?? 0,
                            pendingAmount: veraPointsRes.data.pendingAmount ?? 0,
                            attendanceRatio: veraPointsRes.data.attendanceRatio ?? 0,
                            activityRatio: veraPointsRes.data.activityRatio ?? 0
                        });
                    }

                    // 쇼핑 신박템 추천 로드
                    fetch('/api/shopping/viral')
                        .then(res => res.json())
                        .then(json => {
                            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                                setShoppingItems(json.data.slice(0, 2));
                            }
                        })
                        .catch(() => {});
                }
            } catch (error) {
                console.error(`Failed to load data for ${activeSection}:`, error);
            } finally {
                setLoading(false);
            }
        };

        loadSectionData();
    }, [activeSection, user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
                
                {/* 상단 타이틀 & 광고 영역 */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-sm shadow-xs shrink-0">
                                <i className="fas fa-user"></i>
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap shrink-0">
                                {t('마이페이지')}
                            </h1>
                            <span className="text-xs font-bold text-slate-400 ml-1 truncate min-w-0">
                                {user.name}{t('님')}
                            </span>
                        </div>
                        {user.email && (
                            <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 max-w-full min-w-0">
                                <i className="fas fa-envelope text-violet-500 shrink-0"></i>
                                <span className="truncate">{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 히어로 배너 바로 아래: 상단 가로 탭 바 */}
                <div className="bg-white rounded-2xl shadow-sm p-2 border border-slate-200/80 mb-6 block">
                    <nav className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar p-1">
                        <button
                            onClick={() => setActiveSection('dashboard')}
                            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'dashboard'
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <span>🏠</span>
                            <span>{t('내 아지트')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('schedule')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'schedule'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-sparkles text-amber-300 text-sm"></i>
                            <span>{t('My Life')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('video')}
                            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'video'
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <span>🎬</span>
                            <span>{t('비디오 플레이어')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('apps')}
                            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'apps'
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <span>📱</span>
                            <span>{t('자주쓰는앱')}</span>
                        </button>
                    </nav>
                </div>

                {/* 메인 컨텐츠 영역 (100% 전체 너비로 확장) */}
                <div className="w-full">
                    {loading && activeSection !== 'dashboard' && activeSection !== 'video' && activeSection !== 'schedule' && activeSection !== 'apps' ? (
                        <div className="bg-white rounded-3xl shadow-sm p-16 border border-slate-200/80 min-h-[400px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-400"></div>
                        </div>
                    ) : (
                        <>
                            {/* ─── [내 아지트 전용 뷰] 🏠 아지트 프로필·2.5D 룸·상점·방명록·이웃 아지트 ─── */}
                            {activeSection === 'dashboard' && (
                                <div className="animate-fade-in space-y-6">
                                    {/* 내 아지트 토스트 알림 */}
                                    {minihomeToastMessage && (
                                        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-indigo-400/40 animate-bounce">
                                            {minihomeToastMessage}
                                        </div>
                                    )}

                                    {/* 1. 내 아지트 메인 12컬럼 스테이지 (좌측 아지트 프로필 4 : 우측 통합 헤더 + 2.5D 아지트 8) */}
                                    {minihomeLoading && !minihomeProfile ? (
                                        <div className="bg-[#f0f4f8] rounded-3xl border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] p-14 text-center space-y-3">
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            <p className="text-sm font-bold text-[#64748b]">
                                                내 아지트 공간과 소품을 불러오는 중입니다...
                                            </p>
                                        </div>
                                    ) : minihomeProfile ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* 좌측 사이드바: Today is 기분 & 아바타 프로필 & 아지트 전용 퀵스탯 & 이웃 아지트 (lg:col-span-4) */}
                                            <aside className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-5 min-w-0">
                                                <div className="bg-[#f0f4f8] rounded-3xl border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] p-5 sm:p-6 flex flex-col space-y-4">
                                                    {/* Today is... 상태창 */}
                                                    <div
                                                        className={`p-3.5 rounded-2xl border ${currentMoodMeta.badgeBg} ${currentMoodMeta.border} shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] flex items-center justify-between`}
                                                    >
                                                        <span className="text-xs font-black tracking-wider text-[#64748b] uppercase">
                                                            TODAY IS...
                                                        </span>
                                                        <span className={`text-sm font-black ${currentMoodMeta.badgeText} flex items-center gap-1.5`}>
                                                            <span className="text-base">{currentMoodMeta.emoji}</span>
                                                            <span>{currentMoodMeta.label}</span>
                                                        </span>
                                                    </div>

                                                    {/* 기분 선택 칩 (꾸미기 모드일 때) */}
                                                    {minihomeEditMode && (
                                                        <div className="grid grid-cols-3 gap-1.5">
                                                            {MINIHOME_MOODS.map((m) => (
                                                                <button
                                                                    key={m.id}
                                                                    type="button"
                                                                    onClick={() => setMinihomeDraftMood(m.id)}
                                                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                                                                        minihomeDraftMood === m.id
                                                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm'
                                                                            : 'bg-[#e8edf2] text-[#64748b] border-white/80 hover:bg-white'
                                                                    }`}
                                                                >
                                                                    {m.emoji} {m.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* 대표 아바타 카드 & 주인장 소개 */}
                                                    <div className="text-center p-4 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] border border-white/70 space-y-2">
                                                        <div className="w-20 h-20 rounded-2xl bg-white border-2 border-indigo-200 shadow-xs mx-auto flex items-center justify-center p-1.5 overflow-hidden">
                                                            <img
                                                                src={
                                                                    getCatalogItemById(
                                                                        (minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout)
                                                                            .minimiItemId
                                                                    )?.spriteUrl || '/images/minihome/items/minimi-casual.png'
                                                                }
                                                                alt="대표 아바타 캐릭터"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="font-black text-base text-[#1e293b]">
                                                            {minihomeProfile.ownerName || user.name}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-indigo-600">
                                                            {getCatalogItemById((minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout).minimiItemId)?.name ||
                                                                '캐주얼 데일리 아바타'}
                                                        </div>

                                                        {minihomeEditMode ? (
                                                            <textarea
                                                                rows={3}
                                                                maxLength={100}
                                                                value={minihomeDraftStatusMessage}
                                                                onChange={(e) => setMinihomeDraftStatusMessage(e.target.value)}
                                                                placeholder="프로필 자기소개 한마디를 입력하세요"
                                                                className="w-full mt-2 p-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-[#1e293b] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.25),inset_-2px_-2px_4px_rgba(255,255,255,0.75)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        ) : (
                                                            <p className="text-xs text-[#64748b] font-medium leading-relaxed pt-1">
                                                                “{minihomeProfile.statusMessage}”
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* 아지트 꾸미기 / 상점 팝업 / 알림 설정 (상단 밀착 그룹) */}
                                                    <div className="space-y-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!minihomeEditMode) {
                                                                    handleMinihomeEnterEditMode(true);
                                                                } else {
                                                                    setMinihomeShopModalOpen(true);
                                                                }
                                                            }}
                                                            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                                        >
                                                            <i className="fas fa-store"></i>
                                                            <span>아지트 꾸미기 &amp; 아이템 상점 (전 품목 무료)</span>
                                                        </button>

                                                        {minihomeEditMode && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveMinihome()}
                                                                    disabled={minihomeSaving}
                                                                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                                >
                                                                    <i className="fas fa-check"></i>
                                                                    <span>{minihomeSaving ? '저장 중...' : '배치 완료·저장'}</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleMinihomeCancelEditMode}
                                                                    className="py-2.5 px-3 rounded-xl bg-[#e8edf2] hover:bg-white text-[#64748b] font-extrabold text-xs shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                                >
                                                                    <span>꾸미기 종료</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setIsNotificationModalOpen(true)}
                                                            className="w-full py-2.5 px-3.5 rounded-xl bg-[#e8edf2] hover:bg-white text-[#1e293b] border border-white/80 shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.85)] font-extrabold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer"
                                                        >
                                                            <span className="flex items-center gap-1.5">
                                                                <span>🔔</span>
                                                                <span>푸시 알림 센터 &amp; 설정</span>
                                                            </span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <span
                                                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                                        isPushSubscribed
                                                                            ? 'bg-emerald-500 text-white'
                                                                            : 'bg-slate-200 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {isPushSubscribed ? 'ON' : 'OFF'}
                                                                </span>
                                                                {webPush.unreadCount > 0 && (
                                                                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                                                                        {webPush.unreadCount}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {/* 아지트 전용 퀵 스탯 (베라포인트 · 보유 가구·소품) */}
                                                    <div className="pt-3 border-t border-slate-200/70">
                                                        <div className="grid grid-cols-2 gap-2.5 text-left">
                                                            <div
                                                                onClick={() => user?.email === 'sukman@naver.com' && router.push('/reward/exchange')}
                                                                className="p-3 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] border border-white/70 cursor-pointer hover:bg-white/80 text-left transition-colors"
                                                            >
                                                                <div className="text-[10px] font-bold text-amber-700 flex items-center justify-between">
                                                                    <span>💎 베라포인트(P)</span>
                                                                </div>
                                                                <div className="text-xs font-black text-[#1e293b] mt-0.5 font-mono truncate">
                                                                    {(azitGame.state?.veraPoints ?? minihomeProfile.veraPoints ?? veraPointsData.points).toLocaleString()} P
                                                                </div>
                                                            </div>
                                                            <div
                                                                onClick={() => {
                                                                    if (!minihomeEditMode) {
                                                                        handleMinihomeEnterEditMode(true);
                                                                    } else {
                                                                        setMinihomeShopModalOpen(true);
                                                                    }
                                                                }}
                                                                className="p-3 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] border border-white/70 cursor-pointer hover:bg-white/80 text-left transition-colors"
                                                            >
                                                                <div className="text-[10px] font-bold text-indigo-700 flex items-center justify-between">
                                                                    <span>🎁 보유 가구·소품</span>
                                                                    <i className="fas fa-chevron-right text-[8px]"></i>
                                                                </div>
                                                                <div className="text-xs font-black text-[#1e293b] mt-0.5 truncate">
                                                                    {minihomeProfile.ownedItemIds.length}종 보유
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 실제 이웃 회원 아지트가 있을 때만 표시 */}
                                                {minihomeSurfData.popularRooms.length > 0 && (
                                                    <div className="bg-[#f0f4f8] rounded-3xl border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] p-5 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-xs sm:text-sm font-black text-[#1e293b] flex items-center gap-1.5">
                                                                <span>🌊</span>
                                                                <span>이웃 아지트 놀러가기</span>
                                                            </h3>
                                                            <button
                                                                type="button"
                                                                onClick={handleRandomSurf}
                                                                className="text-[11px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                                                            >
                                                                랜덤 방문 →
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {minihomeSurfData.popularRooms.slice(0, 4).map((room) => (
                                                                <Link
                                                                    key={room.handle}
                                                                    href={`/minihome/${encodeURIComponent(room.handle)}`}
                                                                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#e8edf2]/80 hover:bg-white shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.75)] border border-white/70 transition-colors"
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-extrabold text-[#1e293b] truncate">
                                                                            {room.ownerName}
                                                                        </div>
                                                                        <div className="text-[11px] text-[#64748b] truncate">
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
                                                )}
                                            </aside>

                                            {/* 우측 메인 스테이지: 2.5D 아이소메트릭 아지트 + 방문자 방명록 (lg:col-span-8) */}
                                            <div className="order-1 lg:order-2 lg:col-span-8 flex flex-col min-w-0">
                                                {/* 1) 2.5D 아이소메트릭 아지트 캔버스 (통합 헤더 포함) */}
                                                <IsometricRoomCanvas
                                                    layout={minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout}
                                                    ownerName={minihomeProfile.ownerName || user.name}
                                                    roomTitle={minihomeEditMode ? minihomeDraftRoomTitle : minihomeProfile.roomTitle}
                                                    handle={minihomeProfile.handle || (user.email ? user.email.split('@')[0] : 'vera_room')}
                                                    todayVisitors={minihomeProfile.todayVisitors ?? 1}
                                                    totalVisitors={minihomeProfile.totalVisitors ?? 1}
                                                    headingTag="h2"
                                                    hasNeighbors={minihomeSurfData.popularRooms.length > 0}
                                                    onRandomSurf={handleRandomSurf}
                                                    onOpenSurfModal={() => setShowSurfModal(true)}
                                                    onShare={handleShareMinihome}
                                                    isOwner={Boolean(minihomeProfile.isOwner)}
                                                    onSaveRoomTitle={(newTitle) => {
                                                        setMinihomeDraftRoomTitle(newTitle);
                                                        handleSaveMinihome({ roomTitle: newTitle });
                                                    }}
                                                    guestbookCount={minihomeGuestbook.length}
                                                    onOpenGuestbookModal={() => setMinihomeGuestbookModalOpen(true)}
                                                    isEditMode={minihomeEditMode}
                                                    selectedTargetId={minihomeSelectedTargetId}
                                                    onSelectTarget={(id) => {
                                                        if (!minihomeEditMode) {
                                                            handleMinihomeEnterEditMode(false);
                                                        }
                                                        setMinihomeSelectedTargetId(id);
                                                    }}
                                                    onTileClick={handleMinihomeTileClick}
                                                    onFlipSelected={handleMinihomeFlipSelectedItem}
                                                    onRemoveSelected={handleMinihomeRemoveSelectedItem}
                                                    onChangeSpeechBubble={(text) =>
                                                        setMinihomeDraftLayout((prev) => ({ ...prev, speechBubble: text }))
                                                    }
                                                    onOpenShopModal={() => {
                                                        setShopCategoryOverride(null);
                                                        handleMinihomeOpenShopModal('shop', 'all');
                                                    }}
                                                    onOpenSeedShopModal={() => {
                                                        setShopCategoryOverride(null);
                                                        handleMinihomeOpenShopModal('shop', 'seed');
                                                    }}
                                                    onOpenFertilizerShopModal={() => {
                                                        setShopCategoryOverride('fertilizer');
                                                        handleMinihomeOpenShopModal('shop', 'all');
                                                    }}
                                                    onOpenWarehouseModal={() => {
                                                        setShopCategoryOverride(null);
                                                        handleMinihomeOpenShopModal('warehouse', 'all');
                                                    }}
                                                    onSaveRoom={() => handleSaveMinihome()}
                                                    onCancelEdit={handleMinihomeCancelEditMode}
                                                    isSaving={minihomeSaving}
                                                    onPlantCrop={handleMinihomePlantCrop}
                                                    onWaterPlot={handleMinihomeWaterPlot}
                                                    onHarvestPlot={handleMinihomeHarvestPlot}
                                                    onClearPlot={handleMinihomeClearPlot}
                                                    azitGame={azitGame}
                                                    requestedZone={requestedAzitZone}
                                                    zoneSyncNonce={azitZoneSyncNonce}
                                                    onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
                                                    isPushSubscribed={isPushSubscribed}
                                                    unreadNotificationCount={webPush.unreadCount}
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* 3. 아지트 아이템 상점 & 방명록 팝업 모달 */}
                                    {minihomeProfile && (
                                        <>
                                            <MinihomeShopDrawer
                                                isOpen={minihomeShopModalOpen}
                                                onClose={() => {
                                                    setShopCategoryOverride(null);
                                                    setMinihomeShopModalOpen(false);
                                                }}
                                                ownedItemIds={minihomeProfile.ownedItemIds}
                                                veraPoints={azitGame.state?.veraPoints ?? minihomeProfile.veraPoints}
                                                draftLayout={minihomeDraftLayout}
                                                isBuyingItemId={minihomeBuyingItemId}
                                                onApplyItem={(item) => {
                                                    if (!minihomeEditMode) {
                                                        handleMinihomeEnterEditMode(true);
                                                    }
                                                    handleMinihomeApplyCatalogItem(item);
                                                }}
                                                onPurchaseItem={handleMinihomePurchaseItem}
                                                onBuySeed={handleMinihomeBuySeed}
                                                onBuyFertilizer={azitGame.buyFertilizer}
                                                onResetRoom={handleMinihomeResetDefaultRoom}
                                                onSaveRoom={() => handleSaveMinihome()}
                                                isSaving={minihomeSaving}
                                                isActing={azitGame.isActing}
                                                azitLevel={azitGame.state?.profile.azitLevel}
                                                cropCatalog={azitGame.state?.catalog.crops}
                                                fertilizerCatalog={azitGame.state?.catalog.fertilizers}
                                                initialMode={minihomeShopInitialTab}
                                                initialCategory={shopCategoryOverride ?? minihomeShopInitialCategory}
                                            />

                                            <MinihomeGuestbook
                                                isOpen={minihomeGuestbookModalOpen}
                                                onClose={() => setMinihomeGuestbookModalOpen(false)}
                                                entries={minihomeGuestbook}
                                                isOwner={minihomeProfile.isOwner}
                                                ownerName={minihomeProfile.ownerName || user.name}
                                                onAddEntry={handleMinihomeAddGuestbook}
                                                onReplyEntry={handleMinihomeReplyGuestbook}
                                                onDeleteEntry={handleMinihomeSoftDeleteGuestbook}
                                            />
                                        </>
                                    )}

                                    {/* 이웃 아지트 전체보기 모달 */}
                                    {showSurfModal && (
                                        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                                            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                                        <span>🌊</span>
                                                        <span>이웃 아지트 목록</span>
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
                                                    {minihomeSurfData.popularRooms.map((room) => (
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
                                                        🌊 랜덤 이웃 아지트로 이동
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                                    {/* ─── 🌟 My Life (사주, 날씨/증시, 명언, TO-DO, 일정 달력, 주식, 뉴스, 포인트, 쇼핑 통합 뷰) ─── */}
                                    {activeSection === 'schedule' && (
                                        <MyLifeSection
                                            user={user}
                                            birthDate={birthDate}
                                            showBirthEditor={showBirthEditor}
                                            setShowBirthEditor={setShowBirthEditor}
                                            tempBirthDate={tempBirthDate}
                                            setTempBirthDate={setTempBirthDate}
                                            handleSaveBirth={handleSaveBirth}
                                            saju={saju}
                                            calYear={calYear}
                                            calMonth={calMonth}
                                            calendarDays={calendarDays}
                                            selectedDate={selectedDate}
                                            setSelectedDate={setSelectedDate}
                                            handlePrevMonth={handlePrevMonth}
                                            handleNextMonth={handleNextMonth}
                                            handleGoToday={handleGoToday}
                                            isPushSubscribed={isPushSubscribed}
                                            pushLoading={pushLoading}
                                            handleTogglePush={handleTogglePush}
                                            schedulesByDate={schedulesByDate}
                                            displaySchedules={displaySchedules}
                                            newAgendaDate={newAgendaDate}
                                            setNewAgendaDate={setNewAgendaDate}
                                            newAgendaEndDate={newAgendaEndDate}
                                            setNewAgendaEndDate={setNewAgendaEndDate}
                                            newAgendaTime={newAgendaTime}
                                            setNewAgendaTime={setNewAgendaTime}
                                            newAgendaEndTime={newAgendaEndTime}
                                            setNewAgendaEndTime={setNewAgendaEndTime}
                                            isAllDay={isAllDay}
                                            handleToggleAllDay={handleToggleAllDay}
                                            newAgendaText={newAgendaText}
                                            setNewAgendaText={setNewAgendaText}
                                            newAgendaColor={newAgendaColor}
                                            setNewAgendaColor={setNewAgendaColor}
                                            handleSetPresetDuration={handleSetPresetDuration}
                                            handleAddAgenda={handleAddAgenda}
                                            handleRemoveAgenda={handleRemoveAgenda}
                                            SCHEDULE_COLOR_CONFIG={SCHEDULE_COLOR_CONFIG}
                                            watchlist={stocksData.watchlist}
                                            newsKeywords={newsData.keywords}
                                            keywordNews={newsData.keywordNews}
                                            onDeleteKeyword={handleDeleteKeyword}
                                            veraPointsData={{
                                                ...veraPointsData,
                                                points: azitGame.state?.veraPoints ?? minihomeProfile?.veraPoints ?? veraPointsData.points,
                                            }}
                                            shoppingItems={shoppingItems}
                                            onNavigateSection={(sec) => {
                                                if (sec === 'dashboard' || sec === 'schedule' || sec === 'video') {
                                                    setActiveSection(sec);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                } else if (sec === 'stocks') {
                                                    router.push('/finance');
                                                } else if (sec === 'news') {
                                                    router.push('/news');
                                                } else if (sec === 'games') {
                                                    router.push('/game');
                                                } else if (sec === 'utils') {
                                                    router.push('/lifestyle');
                                                } else {
                                                    setActiveSection('apps');
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                        />
                                    )}

                                    {/* ─── [신설] 🎬 구글 드라이브 연동 비디오 플레이어 섹션 ─── */}
                                    {activeSection === 'video' && (
                                        <DriveVideoPlayerSection />
                                    )}

                                    {/* ─── [신설] 📱 자주쓰는앱 스마트폰 홈 화면 런처 섹션 ─── */}
                                    {activeSection === 'apps' && (
                                        <FrequentAppsSection />
                                    )}
                                </>
                            )}
                    </div>
                </div>

            {/* 범용 웹 푸시 알림 센터 & 설정 모달 */}
            <NotificationCenterPanel
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                webPush={webPush}
                onNavigateUrl={applyNotificationUrl}
            />
        </div>
    );
}
