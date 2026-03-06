import { useEffect, useState, useMemo } from 'react';
import { Header, Footer, Card } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { MiniAppButton } from '../components/MiniAppButton';
import { getFrequentAppIds } from '../hooks/useFrequentApps';
import axios from 'axios';

interface MiniApp {
    id: number;
    name: string;
    slug: string;
    icon_url: string;
    description: string;
    app_url: string;
    require_auth: number;
}

export default function UtilityPage() {
    const { user, logout } = useAuth();
    const [apps, setApps] = useState<MiniApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        axios.get('/api/mini-apps')
            .then(res => {
                if (res.data.success) {
                    setApps(res.data.apps);
                }
            })
            .catch(err => console.error('Failed to load apps:', err))
            .finally(() => setLoading(false));
    }, []);

    // 페이지에 포커스가 돌아올 때 자주 쓰는 앱 목록 갱신
    useEffect(() => {
        const handleFocus = () => setRefreshKey(k => k + 1);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // 자주 쓰는 앱 목록 (최대 5개)
    const frequentApps = useMemo(() => {
        if (apps.length === 0) return [];
        const frequentIds = getFrequentAppIds();
        return frequentIds
            .map(id => apps.find(app => String(app.id) === id))
            .filter((app): app is MiniApp => Boolean(app));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apps, refreshKey]);

    const getDevUrl = (app: MiniApp): string => {
        if (!import.meta.env.DEV) return app.app_url;
        if (app.app_url.includes('calculator')) return 'http://localhost:5010/app/calculator/';
        if (app.app_url.includes('text-checker')) return 'http://localhost:5011/app/text-checker/';
        return app.app_url;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header user={user} onLogout={logout} />
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
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
                                <div className="relative flex flex-wrap gap-5">
                                    {frequentApps.map(app => (
                                        <MiniAppButton
                                            key={`freq-${app.id}`}
                                            appId={String(app.id)}
                                            title={app.name}
                                            icon={<i className={`${app.icon_url || 'fas fa-cube'} text-3xl text-indigo-500`}></i>}
                                            url={getDevUrl(app)}
                                            requireAuth={app.require_auth === 1}
                                            isLoggedIn={!!user}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 전체 앱 목록 */}
                    {!loading && frequentApps.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fas fa-th-large text-gray-400 text-sm"></i>
                            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">전체 앱</h2>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 text-center text-gray-500">앱 목록을 불러오는 중입니다...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {apps.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-sm text-gray-500">사용 가능한 미니앱이 없습니다.</div>
                            ) : (
                                apps.map(app => (
                                    <MiniAppButton
                                        key={app.id}
                                        appId={String(app.id)}
                                        title={app.name}
                                        icon={<i className={`${app.icon_url || 'fas fa-cube'} text-3xl text-blue-500`}></i>}
                                        url={getDevUrl(app)}
                                        requireAuth={app.require_auth === 1}
                                        isLoggedIn={!!user}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </Card>
            </main>
            <Footer />
        </div>
    );
}

