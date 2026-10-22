'use client';

import { useEffect, useState, useMemo } from 'react';
import { t } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreferenceWizard } from '@/components/homepage/PreferenceWizard';
import { MobileTabEditor } from '@/components/homepage/MobileTabEditor';
import { MyLifeSection } from '@/components/mypage/MyLifeSection';
import { useUserPreferenceContext } from '@/context/UserPreferenceContext';
import { HomepageConfig, DEFAULT_HOMEPAGE_CONFIG } from '@/types/homepage.types';
import { useMinihome } from '@/hooks/useMinihome';
import { IsometricRoomCanvas } from '@/components/minihome/IsometricRoomCanvas';
import { MinihomeBgmPlayer } from '@/components/minihome/MinihomeBgmPlayer';
import { MinihomeShopDrawer } from '@/components/minihome/MinihomeShopDrawer';
import { MinihomeGuestbook } from '@/components/minihome/MinihomeGuestbook';
import { MinihomePersonalHubSection } from '@/components/minihome/MinihomePersonalHubSection';
import { MINIHOME_MOODS, getCatalogItemById } from '@/data/minihomeCatalogData';

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

const DAILY_QUOTES = [
    { quote: "성공의 비결은 시작하는 것이다. 시작하는 비결은 복잡한 일들을 잘게 나누어 첫 번째 조각부터 해치우는 것이다.", author: "마크 트웨인", category: "성장" },
    { quote: "오늘 할 수 있는 일에 온 힘을 쏟아라. 그러면 내일은 한 걸음 더 나아가 있을 것이다.", author: "아이작 뉴턴", category: "실행" },
    { quote: "인생에서 가장 큰 위험은 아무런 위험도 감수하지 않는 것이다.", author: "마크 저커버그", category: "도전" },
    { quote: "마음속에 품은 생각이 곧 당신의 미래가 된다. 긍정적인 생각으로 오늘을 채워라.", author: "마르쿠스 아우렐리우스", category: "마인드" },
    { quote: "지혜로운 사람은 당황하지 않고, 어진 사람은 근심하지 않으며, 용기 있는 사람은 두려워하지 않는다.", author: "공자", category: "지혜" },
    { quote: "작은 일에도 정성을 다하라. 작은 일에 정성을 다하면 세상을 변화시킬 수 있다.", author: "중용(中庸)", category: "정성" },
    { quote: "당신이 할 수 있다고 믿든, 할 수 없다고 믿든, 믿는 대로 될 것이다.", author: "헨리 포드", category: "신념" },
    { quote: "가장 어두운 밤도 언젠가는 끝나고 해는 떠오를 것이다.", author: "빅토르 위고", category: "희망" },
    { quote: "단순함이 궁극의 정교함이다. 오늘 하루를 군더더기 없이 심플하게 집중하라.", author: "레오나르도 다빈치", category: "집중" },
    { quote: "행복은 이미 만들어진 것이 아니다. 당신의 행동에서 비롯되는 것이다.", author: "달라이 라마", category: "행복" },
    { quote: "위대한 일을 해내는 유일한 방법은 당신이 하는 일을 사랑하는 것이다.", author: "스티브 잡스", category: "열정" },
    { quote: "물은 어떤 그릇에 담기느냐에 따라 모양이 바뀐다. 유연함이 최고의 지혜다.", author: "노자", category: "처세" },
];

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function MyPage() {
    const { user, logout, isLoading, updateUser } = useAuth();
    const router = useRouter();

    const {
        profile: minihomeProfile,
        guestbook: minihomeGuestbook,
        surfData: minihomeSurfData,
        isLoading: minihomeLoading,
        toastMessage: minihomeToastMessage,
        isEditMode: minihomeEditMode,
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
        handlePurchaseItem: handleMinihomePurchaseItem,
        handleAddGuestbook: handleMinihomeAddGuestbook,
        handleReplyGuestbook: handleMinihomeReplyGuestbook,
        handleSoftDeleteGuestbook: handleMinihomeSoftDeleteGuestbook,
        showToast: showMinihomeToast,
    } = useMinihome('me');

    const [showSurfModal, setShowSurfModal] = useState<boolean>(false);
    const activeMoodId = minihomeEditMode ? minihomeDraftMood : (minihomeProfile?.statusMood || 'happy');
    const currentMoodMeta = MINIHOME_MOODS.find((m) => m.id === activeMoodId) || MINIHOME_MOODS[0];

    const handleRandomSurf = () => {
        const target = minihomeSurfData.randomHandle || 'vera_official';
        router.push(`/minihome/${encodeURIComponent(target)}`);
    };

    const handleShareMinihome = async () => {
        if (typeof window === 'undefined' || !minihomeProfile) return;
        const shareUrl = `${window.location.origin}/minihome/${encodeURIComponent(minihomeProfile.handle)}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${minihomeProfile.ownerName}님의 VERA 미니홈피`,
                    text: `${minihomeProfile.roomTitle} - 내 방 구경 오세요!`,
                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showMinihomeToast('🔗 내 미니홈피 주소가 클립보드에 복사되었습니다!');
            }
        } catch (_) {
            // 공유 취소 무시
        }
    };

    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    setIsPushSubscribed(!!sub);
                });
            });
        }
    }, []);

    const handleTogglePush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('이 브라우저는 웹 푸시 알림을 지원하지 않습니다.');
            return;
        }

        try {
            setPushLoading(true);
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해 주세요.');
                setPushLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            let sub = await registration.pushManager.getSubscription();

            if (sub) {
                // Unsubscribe
                await sub.unsubscribe();
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
                await instance.delete('/api/user/push-subscription', { data: { endpoint: sub.endpoint } });
                setIsPushSubscribed(false);
                alert('일정 1시간 전 푸시 알림이 해제되었습니다.');
            } else {
                // Subscribe
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
                const keyRes = await instance.get('/api/user/push-key');
                if (!keyRes.data || !keyRes.data.publicKey) {
                    throw new Error('VAPID public key load failed');
                }
                const convertedKey = urlBase64ToUint8Array(keyRes.data.publicKey);
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedKey
                });

                await instance.post('/api/user/push-subscription', {
                    subscription: sub.toJSON()
                });

                setIsPushSubscribed(true);
                alert('🔔 일정 1시간 전 모바일 푸시 알림이 성공적으로 설정되었습니다!');
            }
        } catch (err) {
            console.error('Push toggle error:', err);
            alert('푸시 알림 설정 중 오류가 발생했습니다.');
        } finally {
            setPushLoading(false);
        }
    };

    // ─── activeSection 디폴트를 dashboard(나의 홈)로 개편 ───
    const [activeSection, setActiveSection] = useState<'dashboard' | 'schedule' | 'news' | 'stocks' | 'games' | 'utils' | 'home-customize'>('dashboard');
    const [showWizard, setShowWizard] = useState(false);
    const { config: homeConfig, isSaving: isHomeSaving, updateConfig: updateHomeConfig, saveConfig: saveHomeConfig } = useUserPreferenceContext();
    const [mobileTabsSaved, setMobileTabsSaved] = useState(false);

    const currentMobileTabs = homeConfig.mobileTabs && homeConfig.mobileTabs.length > 0
        ? homeConfig.mobileTabs
        : DEFAULT_HOMEPAGE_CONFIG.mobileTabs;

    const handleMobileTabsChange = (ids: string[]) => {
        updateHomeConfig({ mobileTabs: ids });
        setMobileTabsSaved(false);
    };

    const handleSaveMobileTabs = async () => {
        const ok = await saveHomeConfig({ mobileTabs: currentMobileTabs });
        if (ok) {
            setMobileTabsSaved(true);
            setTimeout(() => setMobileTabsSaved(false), 2000);
        }
    };

const DEFAULT_WATCHLIST = [
    { id: 1, stock_symbol: '005930', stock_name: 'SamsungElec', market_type: 'KR', target_price: 249500 },
    { id: 2, stock_symbol: '000660', stock_name: 'SK hynix', market_type: 'KR', target_price: 1759000 }
];

const DEFAULT_SHOPPING_ITEMS = [
    {
        productId: 20001,
        productName: '공중부양 3D 달 무드등 16색 리모컨 터치 조명',
        productPrice: 49800,
        originalPrice: 79000,
        discountRate: 37,
        productImage: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-levitating-moon',
        curationPoint: '360도 공중부양 회전 무드등',
        tag: '신박템'
    },
    {
        productId: 20002,
        productName: '스마트 3in1 머그컵 워머 & 고속 무선충전기 세트',
        productPrice: 28900,
        originalPrice: 42000,
        discountRate: 31,
        productImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-mug-warmer',
        curationPoint: '온도 유지 + 폰 무선충전 2in1',
        tag: '데스크꿀템'
    }
];

// ... inside MyPage component ...
    // 데이터 상태 관리
    const [newsData, setNewsData] = useState<{ keywords: any[], keywordNews: any[], bookmarks: any[] }>({ keywords: [], keywordNews: [], bookmarks: [] });
    const [stocksData, setStocksData] = useState<{ stats: any, watchlist: any[] }>({ stats: {}, watchlist: DEFAULT_WATCHLIST });
    const [gamesData, setGamesData] = useState<{ stats: any, history: any[] }>({ stats: {}, history: [] });
    const [utilsData, setUtilsData] = useState<{ settings: any, history: any[] }>({ settings: {}, history: [] });
    const [shoppingItems, setShoppingItems] = useState<any[]>(DEFAULT_SHOPPING_ITEMS);
    const [loading, setLoading] = useState(false);

    // 뉴스 키워드/주제 추가 및 삭제 처리
    const [newKeywordInput, setNewKeywordInput] = useState('');
    const [isSubmittingKeyword, setIsSubmittingKeyword] = useState(false);

    const handleAddKeyword = async (keywordToAdd?: string) => {
        const targetKeyword = (keywordToAdd || newKeywordInput).trim();
        if (!targetKeyword) return;

        setIsSubmittingKeyword(true);
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.post('/api/user/keywords', { keyword: targetKeyword });
            if (res.data && res.data.success !== false) {
                setNewKeywordInput('');
                const [kwRes, kwNewsRes] = await Promise.all([
                    instance.get('/api/user/keywords').catch(() => ({ data: {} })),
                    instance.get('/api/user/news/keywords?limit=5').catch(() => ({ data: {} }))
                ]);
                setNewsData(prev => ({
                    ...prev,
                    keywords: kwRes.data.keywords || [],
                    keywordNews: kwNewsRes.data.news || []
                }));
            }
        } catch (err) {
            console.error('Failed to add keyword:', err);
        } finally {
            setIsSubmittingKeyword(false);
        }
    };

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

    const todaySchedules = useMemo(() => {
        return schedulesByDate[todayStr] || [];
    }, [schedulesByDate, todayStr]);

    const todayFormatted = useMemo(() => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const dayName = days[now.getDay()];
        return `${m}월 ${d}일 (${dayName})`;
    }, []);

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

    const todaySajuGuide = useMemo(() => {
        if (!saju) return {
            score: 91,
            luckyColor: '에메랄드 그린',
            luckyDirection: '동남쪽',
            caution: '중요한 결정 전 3초간 심호흡하고 서두르지 마세요.',
            goodAction: '가까운 동료나 소중한 사람에게 따뜻한 안부 전하기'
        };
        
        const elemEntries = [
            { k: 'wood', v: saju.wood },
            { k: 'fire', v: saju.fire },
            { k: 'earth', v: saju.earth },
            { k: 'metal', v: saju.metal },
            { k: 'water', v: saju.water }
        ].sort((a, b) => b.v - a.v);
        const maxElem = elemEntries[0]?.k || 'wood';
        
        const guides: Record<string, { score: number; luckyColor: string; luckyDirection: string; caution: string; goodAction: string }> = {
            wood: { score: 94, luckyColor: '포레스트 그린', luckyDirection: '동쪽', caution: '지나친 고집을 피우고 주변의 조언에 귀를 기울이세요.', goodAction: '새로운 프로젝트 기획이나 산책' },
            fire: { score: 96, luckyColor: '선셋 오렌지', luckyDirection: '남쪽', caution: '감정적인 언행이나 즉흥적인 소비를 조심하세요.', goodAction: '열정적인 회의나 적극적인 의견 개진' },
            earth: { score: 92, luckyColor: '웜 옐로우', luckyDirection: '중앙/남서쪽', caution: '우유부단해져 타이밍을 놓치지 않도록 주의하세요.', goodAction: '신뢰 기반의 약속 정리 및 재무 점검' },
            metal: { score: 90, luckyColor: '클린 화이트/실버', luckyDirection: '서쪽', caution: '날카로운 비판보다 부드러운 화법을 사용하세요.', goodAction: '밀린 문서 정리나 확실한 계약 검토' },
            water: { score: 95, luckyColor: '딥 오션 블루', luckyDirection: '북쪽', caution: '생각이 너무 많아져 실행이 늦어지는 것을 경계하세요.', goodAction: '유연한 네트워킹 및 트렌드 정보 탐색' },
        };
        
        return guides[maxElem] || guides.wood;
    }, [saju]);

    const todayQuote = useMemo(() => {
        const today = new Date();
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return DAILY_QUOTES[Math.abs(dayOfYear) % DAILY_QUOTES.length];
    }, []);

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

                // ─── 대시보드(나의 홈)일 때는 모든 데이터를 일괄 취합해서 가져옴 ───
                if (activeSection === 'dashboard') {
                    const [kwRes, kwNewsRes, bmRes, statsStocksRes, wlRes, statsGamesRes, historyGamesRes, schedulesRes, veraPointsRes] = await Promise.all([
                        instance.get(`/api/user/keywords`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/news/keywords?limit=6`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/bookmarks?page=1&limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/history?limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/schedules`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/vera-points`).catch(() => ({ data: {} }))
                    ]);

                    const fetchedWatchlist = (wlRes.data && Array.isArray(wlRes.data.stocks) && wlRes.data.stocks.length > 0)
                        ? wlRes.data.stocks
                        : DEFAULT_WATCHLIST;

                    const activeKeywords = (kwRes.data && Array.isArray(kwRes.data.keywords) && kwRes.data.keywords.length > 0)
                        ? kwRes.data.keywords
                        : (kwNewsRes.data && kwNewsRes.data.keywords ? kwNewsRes.data.keywords : []);

                    setNewsData({
                        keywords: activeKeywords,
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                    setStocksData({
                        stats: statsStocksRes.data.stats || {},
                        watchlist: fetchedWatchlist
                    });
                    setGamesData({
                        stats: statsGamesRes.data.stats || {},
                        history: historyGamesRes.data.history?.history || []
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
                
                // 기존 개별 탭 렌더링용 API 호출
                else if (activeSection === 'news') {
                    const [kwRes, kwNewsRes, bmRes] = await Promise.all([
                        instance.get(`/api/user/keywords`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/news/keywords?limit=5`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/bookmarks?page=1&limit=10`).catch(() => ({ data: {} }))
                    ]);
                    setNewsData({
                        keywords: kwRes.data.keywords || [],
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                } else if (activeSection === 'stocks') {
                    const [statsRes, wlRes] = await Promise.all([
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} }))
                    ]);
                    const fetchedWatchlist = (wlRes.data && Array.isArray(wlRes.data.stocks) && wlRes.data.stocks.length > 0)
                        ? wlRes.data.stocks
                        : DEFAULT_WATCHLIST;
                    setStocksData({
                        stats: statsRes.data.stats || {},
                        watchlist: fetchedWatchlist
                    });
                } else if (activeSection === 'games') {
                    const [statsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/games/stats`),
                        instance.get(`/api/user/games/history?limit=10`)
                    ]);
                    setGamesData({
                        stats: statsRes.data.stats || {},
                        history: historyRes.data.history?.history || []
                    });
                } else if (activeSection === 'utils') {
                    const [settingsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/utils/settings`),
                        instance.get(`/api/user/utils/history?limit=10`)
                    ]);
                    setUtilsData({
                        settings: settingsRes.data.settings || {},
                        history: historyRes.data.history || []
                    });
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-sm shadow-xs">
                                <i className="fas fa-user"></i>
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                                {t('마이페이지')}
                            </h1>
                            <span className="text-xs font-bold text-slate-400 ml-1">
                                {user.name}{t('님')}
                            </span>
                        </div>
                        {user.email && (
                            <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5">
                                <i className="fas fa-envelope text-violet-500"></i>
                                <span>{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 히어로 배너 바로 아래: 상단 가로 탭 바 (Horizontal Tab Bar) */}
                <div className="bg-white rounded-2xl shadow-sm p-2 border border-slate-200/80 mb-6">
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
                            <span>{t('내 미니홈피')}</span>
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
                            onClick={() => setActiveSection('news')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'news'
                                    ? 'bg-sky-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-newspaper text-sm"></i>
                            <span>{t('뉴스')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('stocks')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'stocks'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-chart-line text-sm"></i>
                            <span>{t('주식')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('games')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'games'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-gamepad text-sm"></i>
                            <span>{t('게임')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('utils')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'utils'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-tools text-sm"></i>
                            <span>{t('유틸리티')}</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('home-customize')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'home-customize'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-magic text-sm"></i>
                            <span>{t('홈꾸미기')}</span>
                        </button>
                    </nav>
                </div>

                {/* 메인 컨텐츠 영역 (100% 전체 너비로 확장) */}
                <div className="w-full">
                    {loading && activeSection !== 'dashboard' ? (
                        <div className="bg-white rounded-3xl shadow-sm p-16 border border-slate-200/80 min-h-[400px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-400"></div>
                        </div>
                    ) : (
                        <>
                            {/* ─── [통합 메인 뷰] 🏠 내 미니홈피 + 나의 홈 다이어리 & 퍼스널 보드 ─── */}
                            {activeSection === 'dashboard' && (
                                <div className="animate-fade-in space-y-6">
                                    {/* 미니홈피 토스트 알림 */}
                                    {minihomeToastMessage && (
                                        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-indigo-400/40 animate-bounce">
                                            {minihomeToastMessage}
                                        </div>
                                    )}

                                    {/* 1. 미니홈피 대문 아우터 헤더 프레임 */}
                                    <header className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-mono font-black">
                                                        <span className="text-rose-600">
                                                            TODAY {(minihomeProfile?.todayVisitors ?? 1).toLocaleString()}
                                                        </span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="text-slate-700">
                                                            TOTAL {(minihomeProfile?.totalVisitors ?? 1).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                                        @{minihomeProfile?.handle || (user.email ? user.email.split('@')[0] : 'vera_room')}
                                                    </span>

                                                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                                                        🏠 나의 미니홈피 홈
                                                    </span>
                                                </div>

                                                {minihomeEditMode ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            maxLength={45}
                                                            value={minihomeDraftRoomTitle}
                                                            onChange={(e) => setMinihomeDraftRoomTitle(e.target.value)}
                                                            placeholder="내 미니홈피 대문 제목을 입력하세요"
                                                            className="px-3.5 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-300 text-base sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-96"
                                                        />
                                                    </div>
                                                ) : (
                                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                                        {minihomeProfile?.roomTitle || `${user.name}님의 따뜻한 VERA 미니홈피`}
                                                    </h2>
                                                )}
                                            </div>

                                            {/* 우측: BGM 미니 플레이어 & 파도타기 액션 버튼 */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                                <MinihomeBgmPlayer
                                                    trackId={minihomeEditMode ? minihomeDraftBgmTrackId : (minihomeProfile?.bgmTrackId || 'bgm-orgel')}
                                                    isEditMode={minihomeEditMode}
                                                    onChangeTrack={(newTrack) => {
                                                        setMinihomeDraftBgmTrackId(newTrack);
                                                        if (!minihomeEditMode && minihomeProfile?.isOwner) {
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

                                    {/* 2. 미니홈피 메인 12컬럼 스테이지 (좌측 프로필·브리핑 4 : 우측 2.5D 미니룸·방명록 8) */}
                                    {minihomeLoading && !minihomeProfile ? (
                                        <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center space-y-3">
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            <p className="text-sm font-bold text-slate-500">
                                                내 미니홈피 미니룸과 소품을 불러오는 중입니다...
                                            </p>
                                        </div>
                                    ) : minihomeProfile ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* 좌측 사이드바: Today is 기분 & 미니미 프로필 & 나의 홈 3대 퀵스탯 & 이웃방 (lg:col-span-4) */}
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
                                                                    getCatalogItemById(
                                                                        (minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout)
                                                                            .minimiItemId
                                                                    )?.spriteUrl || '/images/minihome/items/minimi-casual.png'
                                                                }
                                                                alt="대표 미니미 캐릭터"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="font-black text-base text-slate-900">
                                                            {minihomeProfile.ownerName || user.name}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-indigo-600">
                                                            {getCatalogItemById((minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout).minimiItemId)?.name ||
                                                                '캐주얼 데일리 미니미'}
                                                        </div>

                                                        {minihomeEditMode ? (
                                                            <textarea
                                                                rows={3}
                                                                maxLength={100}
                                                                value={minihomeDraftStatusMessage}
                                                                onChange={(e) => setMinihomeDraftStatusMessage(e.target.value)}
                                                                placeholder="프로필 자기소개 한마디를 입력하세요"
                                                                className="w-full mt-2 p-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        ) : (
                                                            <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1">
                                                                “{minihomeProfile.statusMessage}”
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* 내 방 꾸미기 / 소셜 라운지 CTA */}
                                                    <div className="space-y-2">
                                                        {!minihomeEditMode ? (
                                                            <button
                                                                type="button"
                                                                onClick={handleMinihomeEnterEditMode}
                                                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                            >
                                                                <i className="fas fa-wand-magic-sparkles"></i>
                                                                <span>내 방 꾸미기 &amp; 도토리 상점 열기</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveMinihome()}
                                                                disabled={minihomeSaving}
                                                                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                                <span>{minihomeSaving ? '저장 중...' : '꾸미기 완료 & 저장하기'}</span>
                                                            </button>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveSection('schedule')}
                                                                className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 font-extrabold text-xs text-center transition-colors cursor-pointer"
                                                            >
                                                                📅 일정 달력 (My Life)
                                                            </button>
                                                            <Link
                                                                href="/lounge"
                                                                className="py-2.5 px-3 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200/70 font-extrabold text-xs text-center transition-colors"
                                                            >
                                                                💬 소셜 라운지
                                                            </Link>
                                                        </div>
                                                    </div>

                                                    {/* 나의 홈 3대 퀵 스탯 보드 (도토리·보유가구·오늘일정·사주행운지수 통합) */}
                                                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                                        <div className="grid grid-cols-2 gap-2 text-center">
                                                            <div
                                                                onClick={() => user?.email === 'sukman@naver.com' && router.push('/reward/exchange')}
                                                                className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 cursor-pointer hover:bg-amber-100/70 transition-colors"
                                                            >
                                                                <div className="text-[10px] font-bold text-amber-700">보유 도토리(P)</div>
                                                                <div className="text-sm font-black text-amber-900 mt-0.5 font-mono">
                                                                    🌰 {(minihomeProfile.veraPoints || veraPointsData.points).toLocaleString()} P
                                                                </div>
                                                            </div>
                                                            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/70">
                                                                <div className="text-[10px] font-bold text-indigo-700">보유 가구·소품</div>
                                                                <div className="text-sm font-black text-indigo-900 mt-0.5">
                                                                    🎁 {minihomeProfile.ownedItemIds.length}종
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveSection('schedule')}
                                                                className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-left transition-colors cursor-pointer"
                                                            >
                                                                <div className="text-[10px] font-bold text-emerald-700 flex items-center justify-between">
                                                                    <span>📅 오늘 일정</span>
                                                                    <i className="fas fa-chevron-right text-[8px]"></i>
                                                                </div>
                                                                <div className="text-xs font-black text-emerald-950 mt-0.5 truncate">
                                                                    {todaySchedules.length > 0 ? `${todaySchedules.length}건 진행중` : '여유로운 날'}
                                                                </div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveSection('schedule')}
                                                                className="p-3 rounded-2xl bg-violet-50/70 hover:bg-violet-100/70 border border-violet-200/70 text-left transition-colors cursor-pointer"
                                                            >
                                                                <div className="text-[10px] font-bold text-violet-700 flex items-center justify-between">
                                                                    <span>🔮 행운 지수</span>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-200/70 text-violet-800 font-black">대길</span>
                                                                </div>
                                                                <div className="text-xs font-black text-violet-950 mt-0.5 truncate">
                                                                    {todaySajuGuide.score}점 · {todaySajuGuide.luckyColor}
                                                                </div>
                                                            </button>
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
                                                        {minihomeSurfData.popularRooms.slice(0, 4).map((room) => (
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

                                            {/* 우측 메인 스테이지: 2.5D 아이소메트릭 미니룸 + 도토리 상점 + 일촌 방명록 (lg:col-span-8) */}
                                            <div className="lg:col-span-8 space-y-6">
                                                {/* 1) 2.5D 아이소메트릭 미니룸 캔버스 */}
                                                <IsometricRoomCanvas
                                                    layout={minihomeEditMode ? minihomeDraftLayout : minihomeProfile.layout}
                                                    ownerName={minihomeProfile.ownerName || user.name}
                                                    isEditMode={minihomeEditMode}
                                                    selectedTargetId={minihomeSelectedTargetId}
                                                    onSelectTarget={(id) => {
                                                        if (!minihomeEditMode) {
                                                            handleMinihomeEnterEditMode();
                                                        }
                                                        setMinihomeSelectedTargetId(id);
                                                    }}
                                                    onTileClick={handleMinihomeTileClick}
                                                    onFlipSelected={handleMinihomeFlipSelectedItem}
                                                    onRemoveSelected={handleMinihomeRemoveSelectedItem}
                                                    onChangeSpeechBubble={(text) =>
                                                        setMinihomeDraftLayout((prev) => ({ ...prev, speechBubble: text }))
                                                    }
                                                />

                                                {/* 2) 꾸미기 모드 활성화 시: 보관함 & 도토리 상점 드로어 */}
                                                {minihomeEditMode && (
                                                    <MinihomeShopDrawer
                                                        ownedItemIds={minihomeProfile.ownedItemIds}
                                                        veraPoints={minihomeProfile.veraPoints}
                                                        draftLayout={minihomeDraftLayout}
                                                        isBuyingItemId={minihomeBuyingItemId}
                                                        onApplyItem={handleMinihomeApplyCatalogItem}
                                                        onPurchaseItem={handleMinihomePurchaseItem}
                                                        onResetRoom={handleMinihomeResetDefaultRoom}
                                                        onSaveRoom={() => handleSaveMinihome()}
                                                        onCancelEdit={handleMinihomeCancelEditMode}
                                                        isSaving={minihomeSaving}
                                                    />
                                                )}

                                                {/* 3) 일촌평 & 방문자 방명록 */}
                                                <MinihomeGuestbook
                                                    entries={minihomeGuestbook}
                                                    isOwner={minihomeProfile.isOwner}
                                                    ownerName={minihomeProfile.ownerName || user.name}
                                                    onAddEntry={handleMinihomeAddGuestbook}
                                                    onReplyEntry={handleMinihomeReplyGuestbook}
                                                    onDeleteEntry={handleMinihomeSoftDeleteGuestbook}
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* 3. 나의 홈 다이어리 & 퍼스널 보드 (기존 '나의 홈'의 모든 위젯을 미니홈피 하단에 통합) */}
                                    <MinihomePersonalHubSection
                                        userName={user.name}
                                        userEmail={user.email}
                                        todayFormatted={todayFormatted}
                                        todaySchedules={todaySchedules}
                                        scheduleColorConfig={SCHEDULE_COLOR_CONFIG}
                                        todaySajuGuide={todaySajuGuide}
                                        todayQuote={todayQuote}
                                        saju={saju}
                                        birthDate={birthDate}
                                        showBirthEditor={showBirthEditor}
                                        tempBirthDate={tempBirthDate}
                                        onToggleBirthEditor={setShowBirthEditor}
                                        onChangeTempBirthDate={setTempBirthDate}
                                        onSaveBirth={handleSaveBirth}
                                        watchlist={stocksData.watchlist}
                                        newsKeywords={newsData.keywords}
                                        keywordNews={newsData.keywordNews}
                                        onDeleteKeyword={handleDeleteKeyword}
                                        veraPointsData={{
                                            ...veraPointsData,
                                            points: minihomeProfile?.veraPoints ?? veraPointsData.points,
                                        }}
                                        shoppingItems={shoppingItems}
                                        onNavigateSection={(sec) => setActiveSection(sec)}
                                    />

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
                                                        🌊 랜덤 이웃 방으로 즉시 이동
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                                    {/* ─── [신설] 🌟 My Life (사주 주의보, 실시간 날씨, 오늘의 명언, 스마트 일정 달력 통합 뷰) ─── */}
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
                                        />
                                    )}

                                    {/* 홈 꾸미기 섹션 */}
                                    {activeSection === 'home-customize' && (
                                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center border-b pb-4">
                                                <i className="fas fa-magic mr-3 text-green-500 text-3xl"></i>내 홈페이지 꾸미기
                                            </h2>
                                            <p className="text-gray-500 text-sm mb-6">설정을 바꾸면 메인 페이지가 나만의 모습으로 바뀝니다.</p>

                                            {/* 🏠 추억의 미니홈피 2.5D 내 방 꾸미기 배너 */}
                                            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-black">
                                                        <span>NEW ✨</span>
                                                        <span>싸이월드 감성 미니룸 & 도토리 상점</span>
                                                    </div>
                                                    <h3 className="text-lg sm:text-xl font-black">
                                                        🏠 나만의 2.5D 미니룸 꾸미러 가기
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-indigo-100">
                                                        벽지·바닥·가구·미니미를 배치하고 BGM과 일촌 방명록, 파도타기를 즐겨보세요!
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveSection('dashboard');
                                                        handleMinihomeEnterEditMode();
                                                    }}
                                                    className="px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
                                                >
                                                    내 방 꾸미기 입장 →
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                                    <div className="text-xs font-bold text-green-600 mb-1 uppercase">퀵메뉴</div>
                                                    <div className="text-2xl font-black text-green-700">{homeConfig.quickMenuItems.length}개</div>
                                                    <div className="text-xs text-green-500 mt-1">선택됨</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                                    <div className="text-xs font-bold text-blue-600 mb-1 uppercase">레이아웃</div>
                                                    <div className="text-lg font-black text-blue-700">
                                                        {homeConfig.theme.layout === 'portal' ? '포털형' : homeConfig.theme.layout === 'minimal' ? '미니멀' : '카드형'}
                                                    </div>
                                                    <div className="text-xs text-blue-500 mt-1">{homeConfig.theme.colorScheme} 테마</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                                    <div className="text-xs font-bold text-purple-600 mb-1 uppercase">설정 상태</div>
                                                    <div className="text-lg font-black text-purple-700">
                                                        {homeConfig.isConfigured ? '✅ 완료' : '⚙️ 기본값'}
                                                    </div>
                                                    <div className="text-xs text-purple-500 mt-1">{homeConfig.isConfigured ? '맞춤 설정 적용중' : '아직 설정 전'}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setShowWizard(true)}
                                                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-2xl transition-all hover:shadow-lg flex items-center justify-center gap-3 group"
                                            >
                                                <i className="fas fa-magic text-xl group-hover:rotate-12 transition-transform"></i>
                                                {homeConfig.isConfigured ? '설정 다시 하기' : '지금 내 홈 꾸미기 시작!'}
                                            </button>

                                            <div className="mt-8 p-5 bg-white border border-gray-200 rounded-2xl">
                                                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                    <i className="fas fa-mobile-screen-button text-green-500"></i> 모바일 하단 탭 메뉴
                                                </h3>
                                                <p className="text-gray-500 text-xs mb-4">모바일에서 화면 아래에 표시되는 빠른 이동 탭을 직접 구성하세요.</p>
                                                <MobileTabEditor value={currentMobileTabs} onChange={handleMobileTabsChange} />
                                                <button
                                                    onClick={handleSaveMobileTabs}
                                                    disabled={isHomeSaving || currentMobileTabs.length === 0}
                                                    className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isHomeSaving ? (<><i className="fas fa-circle-notch fa-spin"></i> 저장 중...</>) : mobileTabsSaved ? (<><i className="fas fa-check"></i> 저장됨</>) : (<><i className="fas fa-save"></i> 탭 설정 저장</>)}
                                                </button>
                                            </div>

                                            {homeConfig.isConfigured && (
                                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                    <h4 className="font-bold text-yellow-800 text-sm mb-2"><i className="fas fa-info-circle mr-1"></i>현재 나만의 설정</h4>
                                                    <ul className="text-xs text-yellow-700 space-y-1">
                                                        <li>• 주 관심사: {homeConfig.preferences.mainInterest === 'news' ? '뉴스' : homeConfig.preferences.mainInterest === 'games' ? '게임' : homeConfig.preferences.mainInterest === 'utility' ? '유틸리티' : '금융'}</li>
                                                        <li>• 뉴스 카테고리: {homeConfig.preferences.newsCategories.join(', ') || '전체'}</li>
                                                        {homeConfig.theme.greeting && <li>• 인사말: "{homeConfig.theme.greeting}"</li>}
                                                        <li>• 즐겨하는 게임: {homeConfig.preferences.favoriteGames.length > 0 ? homeConfig.preferences.favoriteGames.join(', ') : '없음'}</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 뉴스 섹션 */}
                                    {activeSection === 'news' && (
                                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fade-in">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b pb-4">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                                    <i className="fas fa-newspaper mr-3 text-sky-500 text-3xl"></i>뉴스 관리와 구독
                                                </h2>
                                                <Link
                                                    href="/news"
                                                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                                                >
                                                    <span><i className="fas fa-newspaper mr-1"></i> 실시간 뉴스 서비스로 이동</span>
                                                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                                </Link>
                                            </div>

                                            <div className="mb-10 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100">
                                                    <div>
                                                        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                                            <i className="fas fa-hashtag text-sky-500"></i>키워드 구독 뉴스
                                                        </h3>
                                                        <p className="text-xs text-slate-400 mt-1">원하는 관심 주제/키워드를 추가하여 맞춤 실시간 뉴스 피드를 받아보세요.</p>
                                                    </div>

                                                    {/* 주제 추가 입력창 & 버튼 */}
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="relative flex-1 sm:w-64">
                                                            <input
                                                                type="text"
                                                                value={newKeywordInput}
                                                                onChange={(e) => setNewKeywordInput(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                                                placeholder="관심 주제/키워드 입력 (예: AI, 부동산)"
                                                                className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                                                            />
                                                            <i className="fas fa-[#] text-[11px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddKeyword()}
                                                            disabled={isSubmittingKeyword || !newKeywordInput.trim()}
                                                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                                        >
                                                            <i className="fas fa-plus text-[11px]"></i> 주제 추가
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 추천 주제 칩 목록 */}
                                                <div className="mb-5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                                                        <i className="fas fa-[#] text-amber-500 text-[10px]"></i> 추천 주제:
                                                    </span>
                                                    {['인공지능', '부동산', '주식', 'IT/기술', '금융', '경제', '정치', '엔터'].map((recKw) => {
                                                        const isSubscribed = newsData.keywords.some((k: any) => (typeof k === 'string' ? k : k.keyword) === recKw);
                                                        return (
                                                            <button
                                                                key={recKw}
                                                                type="button"
                                                                onClick={() => !isSubscribed && handleAddKeyword(recKw)}
                                                                disabled={isSubscribed}
                                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                                                    isSubscribed
                                                                        ? 'bg-slate-200/80 text-slate-500 cursor-default border border-slate-200'
                                                                        : 'bg-white hover:bg-sky-50 hover:text-sky-600 text-slate-700 border border-slate-200 shadow-2xs active:scale-95'
                                                                }`}
                                                            >
                                                                #{recKw}
                                                                {isSubscribed ? <i className="fas fa-check text-[10px] text-sky-500 ml-0.5"></i> : <i className="fas fa-plus text-[9px] text-slate-400"></i>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* 구독 중인 주제 뱃지 목록 */}
                                                <div className="flex items-center gap-2 flex-wrap mb-6">
                                                    <span className="text-xs font-bold text-slate-600 mr-1">내 구독 목록 ({newsData.keywords.length}):</span>
                                                    {newsData.keywords && newsData.keywords.length > 0 ? (
                                                        newsData.keywords.map((kw: any, idx: number) => {
                                                            const kwName = typeof kw === 'string' ? kw : (kw.keyword || kw.name || '');
                                                            const kwId = typeof kw === 'object' ? kw.id : null;
                                                            return (
                                                                <span key={kwId || idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/80 shadow-2xs">
                                                                    #{kwName}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteKeyword(kwId, kwName)}
                                                                        className="text-sky-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                                                        title="구독 해제"
                                                                    >
                                                                        <i className="fas fa-times text-[10px]"></i>
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">구독 중인 주제가 없습니다. 위 입력창이나 추천 주제를 눌러 추가해보세요.</span>
                                                    )}
                                                </div>

                                                {/* 뉴스 기사 목록 */}
                                                <div className="space-y-4">
                                                    {newsData.keywordNews && newsData.keywordNews.length > 0 ? (
                                                        newsData.keywordNews.map(news => (
                                                            <div key={news.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link href={`/news/${news.id}`} className="hover:text-brand-green">{news.title}</Link>
                                                                </h4>
                                                                <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                    {news.summary || news.description || '내용이 없습니다.'}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{news.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(news.published_at || news.created_at).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                            구독한 주제와 일치하는 뉴스가 없습니다. 새로운 키워드를 추가해보세요!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-bookmark text-amber-500 mr-2"></i>북마크한 뉴스
                                                </h3>
                                                <div className="space-y-4">
                                                    {newsData.bookmarks.length > 0 ? (
                                                        newsData.bookmarks.map(bm => (
                                                            <div key={bm.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link href={`/news/${bm.news_id || bm.id}`} className="hover:text-brand-green">{bm.title}</Link>
                                                                </h4>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{bm.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(bm.published_at || bm.created_at || Date.now()).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">북마크한 뉴스가 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 주식 섹션 */}
                                    {activeSection === 'stocks' && (
                                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fade-in">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b pb-4">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                                    <i className="fas fa-chart-line mr-3 text-green-500 text-3xl"></i>주식 / 금융
                                                </h2>
                                                <Link
                                                    href="/finance"
                                                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                                                >
                                                    <span><i className="fas fa-chart-line mr-1"></i> 금융 서비스 메인으로 이동</span>
                                                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                                </Link>
                                            </div>

                                            <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">총 종목 수</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.length}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">미국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.filter(s => s.market_type === 'US').length}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">한국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.filter(s => s.market_type === 'KR').length}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-star text-yellow-400 mr-2"></i>관심 종목
                                                </h3>
                                                <div className="space-y-3">
                                                    {stocksData.watchlist.length > 0 ? (
                                                        stocksData.watchlist.map(stock => (
                                                            <div key={stock.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${stock.market_type === 'US' ? 'bg-indigo-500' : 'bg-teal-500'}`}>
                                                                        {stock.stock_symbol.substring(0, 2)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                                            {stock.stock_name}
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stock.market_type === 'US' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                                                                                {stock.market_type}
                                                                            </span>
                                                                        </h4>
                                                                        <div className="text-sm text-gray-500 font-mono mt-0.5">{stock.stock_symbol}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right flex space-x-4 sm:space-x-0 sm:flex-col items-end justify-center">
                                                                    {stock.target_price && (
                                                                        <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-md">
                                                                            목표가: <span className="text-brand-green">{Number(stock.target_price).toLocaleString()}{stock.market_type === 'KR' ? '원' : '$'}</span>
                                                                        </div>
                                                                    )}
                                                                    {stock.memo && (
                                                                        <div className="text-xs text-gray-400 mt-2 truncate w-40 flex-1">{stock.memo}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">관심 종목이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 게임 섹션 */}
                                    {activeSection === 'games' && (
                                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fade-in">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                                    <i className="fas fa-gamepad mr-3 text-purple-500 text-3xl"></i>게임 전적 및 센터
                                                </h2>
                                                <Link
                                                    href="/game"
                                                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                                                >
                                                    <span><i className="fas fa-gamepad mr-1"></i> 게임 센터 메인으로 이동</span>
                                                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                                </Link>
                                            </div>

                                            {/* 미니게임 바로가기 빠른 실행 카드 */}
                                            <div className="mb-8 p-5 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-200/80 rounded-2xl shadow-2xs">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                                        <i className="fas fa-bolt text-purple-500"></i> 미니게임 바로가기
                                                    </h3>
                                                    <Link href="/game" className="text-xs text-purple-600 font-bold hover:underline">전체 게임 →</Link>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                    <Link href="/game/freecell" className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-spade"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">프리셀</span>
                                                    </Link>
                                                    <Link href="/game" className="p-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-hashtag"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">2048</span>
                                                    </Link>
                                                    <Link href="/game" className="p-3 bg-white hover:bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-bomb"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">지뢰찾기</span>
                                                    </Link>
                                                    <Link href="/game" className="p-3 bg-white hover:bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-border-all"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">스도쿠</span>
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-trophy text-yellow-500 mr-2"></i>최고 기록
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {Object.keys(gamesData.stats).length > 0 ? (
                                                        Object.keys(gamesData.stats).map(gameType => {
                                                            const stat = gamesData.stats[gameType];
                                                            return (
                                                                <div key={gameType} className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                                                    <i className="fas fa-medal absolute right-4 top-4 text-4xl opacity-20"></i>
                                                                    <div className="text-sm opacity-90 mb-1 font-medium font-mono">{gameType}</div>
                                                                    <div className="text-3xl font-black mb-3">{stat.best_score || stat.high_score}점</div>
                                                                    <div className="text-xs opacity-80 bg-white/20 inline-block px-2 py-1 rounded">플레이: {stat.play_count}회</div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-gray-500 text-sm sm:col-span-2 py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">게임 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-history text-gray-400 mr-2"></i>최근 플레이
                                                </h3>
                                                <div className="space-y-3">
                                                    {gamesData.history.length > 0 ? (
                                                        gamesData.history.map((game, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                                        <i className="fas fa-play"></i>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 font-mono">{game.game_type}</h4>
                                                                        <div className="text-xs text-gray-400">{new Date(game.played_at || game.created_at).toLocaleString('ko-KR')}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xl font-bold text-purple-600">{game.score}점</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">최근 플레이 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 유틸리티 섹션 */}
                                    {activeSection === 'utils' && (
                                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fade-in">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                                    <i className="fas fa-tools mr-3 text-orange-500 text-3xl"></i>유틸리티
                                                </h2>
                                                <Link
                                                    href="/lifestyle"
                                                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                                                >
                                                    <span><i className="fas fa-screwdriver-wrench mr-1"></i> 유틸리티 메인으로 이동</span>
                                                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                                </Link>
                                            </div>

                                            {/* 유틸리티 빠른 실행 카드 */}
                                            <div className="mb-8 p-5 bg-gradient-to-br from-orange-50/70 to-amber-50/50 border border-orange-200/80 rounded-2xl shadow-2xs">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                                        <i className="fas fa-bolt text-orange-500"></i> 유틸리티 서비스 바로가기
                                                    </h3>
                                                    <Link href="/lifestyle" className="text-xs text-orange-600 font-bold hover:underline">전체 도구 →</Link>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                    <Link href="/lifestyle" className="p-3 bg-white hover:bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-calculator"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">계산기 모음</span>
                                                    </Link>
                                                    <Link href="/finance/util" className="p-3 bg-white hover:bg-green-50 rounded-xl border border-green-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-coins"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">금융 계산기</span>
                                                    </Link>
                                                    <Link href="/entertainment/saju" className="p-3 bg-white hover:bg-violet-50 rounded-xl border border-violet-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-yin-yang"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">사주 / 운세</span>
                                                    </Link>
                                                    <Link href="/lifestyle" className="p-3 bg-white hover:bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2.5 transition-all group shadow-2xs">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform"><i className="fas fa-code"></i></span>
                                                        <span className="text-xs font-bold text-slate-700">개발자 도구</span>
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-cog text-gray-500 mr-2"></i>저장된 설정
                                                </h3>
                                                <div className="space-y-4">
                                                    {Object.keys(utilsData.settings).length > 0 ? (
                                                        Object.keys(utilsData.settings).map(utilType => (
                                                            <div key={utilType} className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-200 transition-colors">
                                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                                    <h4 className="font-bold text-gray-800 flex items-center">
                                                                        <i className="fas fa-wrench mr-2 text-orange-400"></i>{utilType}
                                                                    </h4>
                                                                </div>
                                                                <div className="p-4">
                                                                    <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-100 font-mono">
                                                                        {JSON.stringify(utilsData.settings[utilType], null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">저장된 설정이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-stream text-gray-400 mr-2"></i>사용 히스토리
                                                </h3>
                                                <div className="space-y-4">
                                                    {utilsData.history.length > 0 ? (
                                                        utilsData.history.map((item, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                                                                    <div className="font-bold text-gray-800 flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                                                                        {item.util_type}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                                        {new Date(item.created_at).toLocaleString('ko-KR')}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-h-40 overflow-hidden relative">
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Input Data</span>
                                                                        <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                            {typeof item.input_data === 'object' ? JSON.stringify(item.input_data) : item.input_data}
                                                                        </p>
                                                                    </div>
                                                                    {item.result_data && (
                                                                        <div>
                                                                            <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Result</span>
                                                                            <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                            {typeof item.result_data === 'object' ? JSON.stringify(item.result_data) : item.result_data}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">사용 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                    </div>
                </div>

            {/* 홈 꾸미기 마법사 모달 */}
            {showWizard && (
                <PreferenceWizard
                    currentConfig={homeConfig}
                    isSaving={isHomeSaving}
                    onSave={async (newConfig: HomepageConfig) => {
                        updateHomeConfig(newConfig);
                        const ok = await saveHomeConfig(newConfig);
                        if (ok) {
                            setShowWizard(false);
                        }
                    }}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}
