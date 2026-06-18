import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

interface InsuranceCategory {
    key: string;
    name: string;
    desc: string;
    icon: string;
    color: string; // 아이콘 배경/글자 색 (tailwind)
}

const CATEGORIES: InsuranceCategory[] = [
    { key: 'auto', name: '자동차보험', desc: '의무가입 자동차 책임·종합보험', icon: 'fas fa-car', color: 'text-blue-600 bg-blue-50' },
    { key: 'health', name: '실손의료보험', desc: '병원비·치료비 실비 보장', icon: 'fas fa-heart-pulse', color: 'text-red-600 bg-red-50' },
    { key: 'life', name: '생명보험', desc: '사망·질병 대비 생활 보장', icon: 'fas fa-shield-heart', color: 'text-green-600 bg-green-50' },
    { key: 'travel', name: '여행자보험', desc: '해외여행 중 사고·질병·휴대품', icon: 'fas fa-plane', color: 'text-sky-600 bg-sky-50' },
    { key: 'fire', name: '화재보험', desc: '주택·상가 화재 및 재산 손해', icon: 'fas fa-fire', color: 'text-orange-600 bg-orange-50' },
    { key: 'pension', name: '연금보험', desc: '노후 대비 연금·저축성 보험', icon: 'fas fa-piggy-bank', color: 'text-purple-600 bg-purple-50' },
];

export default function InsurancePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/" className="hover:text-green-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">보험</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
                {/* 인트로 */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
                            <i className="fas fa-umbrella"></i>
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">보험</h1>
                            <p className="text-sm text-gray-500">내게 맞는 보험을 한눈에 살펴보세요.</p>
                        </div>
                    </div>
                </section>

                {/* 보험 종류 */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-layer-group text-green-600 mr-2"></i>보험 종류
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CATEGORIES.map((c) => (
                            <div
                                key={c.key}
                                className="relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all"
                            >
                                <span className="absolute top-4 right-4 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    준비중
                                </span>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 ${c.color}`}>
                                    <i className={c.icon}></i>
                                </div>
                                <div className="font-bold text-gray-900 mb-1">{c.name}</div>
                                <p className="text-sm text-gray-500">{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 준비중 안내 */}
                <section className="mb-10">
                    <Card className="p-8 text-center">
                        <i className="fas fa-screwdriver-wrench text-3xl text-gray-300 mb-3"></i>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">보험료 비교·계산 기능 준비중</h3>
                        <p className="text-sm text-gray-500">
                            보험사별 상품 비교와 예상 보험료 계산 기능을 곧 제공할 예정입니다.
                        </p>
                    </Card>
                </section>
            </main>

            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
