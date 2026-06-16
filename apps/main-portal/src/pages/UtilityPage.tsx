import { useEffect, useState, useCallback } from 'react';
import { Header, Footer, Card } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { MiniAppButton } from '../components/MiniAppButton';
import { PageSEO } from '../components/PageSEO';
import axios from 'axios';

interface MiniApp {
    id: number;
    name: string;
    slug: string;
    icon_url: string;
    description: string;
    app_url: string;
    require_auth: number;
    category: string;
}

interface CategoryInfo {
    key: string;
    label: string;
    icon: string;
}

const CATEGORIES: CategoryInfo[] = [
    { key: 'all', label: '전체', icon: 'fas fa-th-large' },
    { key: 'calc', label: '계산기', icon: 'fas fa-calculator' },
    { key: 'text', label: '텍스트', icon: 'fas fa-font' },
    { key: 'dev', label: '개발 도구', icon: 'fas fa-code' },
];

/** 모달로 열어야 하는 앱의 slug 목록 */
const MODAL_APP_SLUGS = ['calculator', 'text-checker', 'pyeong-calc', 'age-calc', 'dday-calc'];

export default function UtilityPage() {
    const { user, logout } = useAuth();
    const [apps, setApps] = useState<MiniApp[]>([]);
    const [frequentApps, setFrequentApps] = useState<MiniApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 모달 상태
    const [modalOpen, setModalOpen] = useState(false);
    const [modalUrl, setModalUrl] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const loadFrequentApps = () => {
        axios.get('/api/mini-apps/frequent')
            .then(res => {
                if (res.data.success) {
                    setFrequentApps(res.data.apps.filter((app: MiniApp) => app.category !== 'game'));
                }
            })
            .catch(err => console.error('Failed to load frequent apps:', err));
    };

    useEffect(() => {
        axios.get('/api/mini-apps')
            .then(res => {
                if (res.data.success) {
                    setApps(res.data.apps);
                }
            })
            .catch(err => console.error('Failed to load apps:', err))
            .finally(() => setLoading(false));

        loadFrequentApps();
    }, []);

    // 페이지에 포커스가 돌아올 때 자주 쓰는 앱 목록 갱신
    useEffect(() => {
        const handleFocus = () => loadFrequentApps();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // ESC로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalOpen) setModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen]);

    // 모바일 탭 바 스마트 하이딩을 위해 바디 클래스 제어
    useEffect(() => {
        document.body.classList.toggle('miniapp-modal-open', modalOpen);
        return () => {
            document.body.classList.remove('miniapp-modal-open');
        };
    }, [modalOpen]);

    // 모달이 오픈될 때 자동으로 iframe 엘리먼트와 그 내부 Window에 포커스를 집행하여 물리 키보드/키패드가 즉시 동작하도록 보장
    useEffect(() => {
        if (modalOpen) {
            const timer = setTimeout(() => {
                const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                if (iframe) {
                    iframe.focus();
                    iframe.contentWindow?.focus();
                }
            }, 150); // DOM 페인팅 대기 후 완벽 집행
            return () => clearTimeout(timer);
        }
    }, [modalOpen]);

    // 자식 계산기로부터 로딩 완료/상태 변경 신호를 받아 포커스를 확실히 iframe에 집행
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && (e.data.type === 'CALCULATOR_READY' || e.data.type === 'MINI_APP_READY')) {
                const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                if (iframe) {
                    iframe.focus();
                    iframe.contentWindow?.focus();
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 모달이 열려 있을 때 부모 창에서 발생하는 모든 keydown 이벤트를 가로채어 자식 iframe으로 릴레이 전송
    useEffect(() => {
        if (!modalOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            console.log('[PARENT] caught keydown relaying key:', e.key);
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'SELECT' ||
                activeEl.tagName === 'TEXTAREA'
            )) {
                return;
            }

            const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'PARENT_KEYBOARD_EVENT',
                    key: e.key,
                    code: e.code,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }, '*');
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [modalOpen]);

    const getDevUrl = (app: MiniApp): string => {
        if (!import.meta.env.DEV) return app.app_url;
        if (app.app_url.includes('calculator')) return 'http://localhost:5019/app/calculator/';
        if (app.app_url.includes('text-checker')) return 'http://localhost:5011/app/text-checker/';
        if (app.app_url.includes('pyeong-calc')) return 'http://localhost:5014/app/pyeong-calc/';
        if (app.app_url.includes('age-calc')) return 'http://localhost:5017/app/age-calc/';
        if (app.app_url.includes('dday-calc')) return 'http://localhost:5018/app/dday-calc/';
        return app.app_url;
    };

    /** 이 앱이 모달로 열어야 하는 앱인지 판별 */
    const isModalApp = (app: MiniApp): boolean => {
        return MODAL_APP_SLUGS.some(slug => app.app_url.includes(slug) || app.slug === slug);
    };

    /** 모달 열기 콜백 */
    const handleModalOpen = useCallback((url: string, title: string) => {
        setModalUrl(url);
        setModalTitle(title);
        setModalOpen(true);
    }, []);

    const filteredApps = selectedCategory === 'all'
        ? apps.filter(app => app.category !== 'game')
        : apps.filter(app => app.category === selectedCategory);

    // 실제 앱이 존재하는 카테고리만 표시
    const activeCategories = CATEGORIES.filter(cat =>
        cat.key === 'all' || apps.some(app => app.category === cat.key)
    );

    /** 앱별 MiniAppButton을 렌더링하면서, 모달 앱이면 onModalOpen 콜백을 전달 */
    const renderAppButton = (app: MiniApp, keyPrefix = '') => (
        <MiniAppButton
            key={`${keyPrefix}${app.id}`}
            appId={String(app.id)}
            title={app.name}
            icon={<i className={`${app.icon_url || 'fas fa-cube'} text-3xl ${keyPrefix ? 'text-indigo-500' : 'text-blue-500'}`}></i>}
            url={getDevUrl(app)}
            requireAuth={app.require_auth === 1}
            isLoggedIn={!!user}
            onModalOpen={isModalApp(app) ? handleModalOpen : undefined}
        />
    );

    return (
        <div className="flex flex-col min-h-screen">
            <PageSEO
                title="생활도구 - 계산기, 변환기, 텍스트 도구"
                description="만나이 계산기, 평수 변환기, D-Day 계산기, JSON 포맷터, Base64 변환기 등 유용한 생활 도구 모음."
                path="/lifestyle"
            />
            <Header user={user} onLogout={logout} />
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-12 w-full">
                <Card className="p-8">
                    <div className="flex items-center gap-4 mb-8 border-b pb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <i className="fas fa-tools text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">유틸리티</h1>
                            <p className="text-gray-500 text-sm mt-1">일상에 유용한 도구들을 모았습니다.</p>
                        </div>
                    </div>

                    {/* 자주 쓰는 앱 섹션 */}
                    {!loading && frequentApps.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="fas fa-star text-amber-400 text-sm"></i>
                                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">자주 쓰는 앱</h2>
                            </div>
                            <div className="relative rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/60 p-5">
                                <div className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-sm pointer-events-none"></div>
                                <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
                                    {frequentApps.map(app => renderAppButton(app, 'freq-'))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 카테고리 필터 버튼 */}
                    {!loading && apps.length > 0 && (
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            {activeCategories.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                        selectedCategory === cat.key
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <i className={cat.icon}></i>
                                    {cat.label}
                                    {cat.key !== 'all' && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            selectedCategory === cat.key
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {apps.filter(a => a.category === cat.key).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 전체 앱 목록 */}
                    {loading ? (
                        <div className="py-12 text-center text-gray-500">앱 목록을 불러오는 중입니다...</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 justify-items-center">
                            {filteredApps.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-sm text-gray-500">사용 가능한 미니앱이 없습니다.</div>
                            ) : (
                                filteredApps.map(app => renderAppButton(app))
                            )}
                        </div>
                    )}
                </Card>
            </main>
            <Footer />

            {/* ======== 미니앱 모달 ======== */}
            {modalOpen && (
                <div
                    className="mini-app-modal-overlay"
                    onClick={() => setModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={modalTitle}
                >
                    <div
                        className="mini-app-modal-container"
                        onClick={(e) => {
                            e.stopPropagation();
                            const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                            if (iframe) {
                                iframe.focus();
                                iframe.contentWindow?.focus();
                            }
                        }}
                    >
                        {/* 모달 헤더 */}
                        <div className="mini-app-modal-header">
                            <span className="mini-app-modal-title">
                                <i className="fas fa-calculator" aria-hidden="true"></i>
                                {modalTitle}
                            </span>
                            <button
                                className="mini-app-modal-close"
                                onClick={() => setModalOpen(false)}
                                aria-label="닫기"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        {/* iframe 콘텐츠 */}
                        <iframe
                            key={modalUrl}
                            src={modalUrl}
                            className="mini-app-modal-iframe"
                            title={modalTitle}
                            allow="clipboard-write"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
