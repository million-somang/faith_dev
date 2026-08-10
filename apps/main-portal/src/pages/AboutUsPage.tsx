import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

export default function AboutUsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO
                title="서비스 소개 - VERA (베라)"
                description="VERA는 실시간 뉴스, 스마트 생활 도구, 클린 미니게임, 금융 시세를 한곳에서 편리하게 이용하는 라이프 포털입니다."
                path="/about"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
                        <i className="fas fa-compass"></i> ABOUT VERA
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                        세상의 모든 정보와 일상의 편리함을 한곳에, VERA
                    </h1>
                    <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                        VERA(베라)는 최신 실시간 뉴스부터 일상에 꼭 필요한 생활 계산기, 설치 없는 무설치 미니게임, 금융 지표를 한눈에 확인할 수 있는 통합 라이프 포털입니다.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
                        <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                                <i className="fas fa-newspaper"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">실시간 뉴스 큐레이션</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                카테고리별 주요 뉴스를 빠르게 전달하며, 핵심 내용을 요약하여 바쁜 현대인들에게 효율적인 뉴스 소비 환경을 제공합니다.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                                <i className="fas fa-calculator"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">유용한 생활 유틸리티</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                만나이 계산기, D-Day 카운터, 부동산 평수 변환기, 맞춤법/글자수 검사기 등 실생활에 꼭 필요한 계산기와 변환 도구를 무료로 지원합니다.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100">
                            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                                <i className="fas fa-gamepad"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">무설치 브라우저 미니게임</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                테트리스, 스도쿠, 2048, 지뢰찾기 등 별도의 다운로드나 복잡한 설치 없이 브라우저에서 바로 즐길 수 있는 클래식 미니게임을 제공합니다.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100">
                            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">금융 & 환율 대시보드</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                주식 시세, 환율 정보, 코스피/코스닥 주요 지표를 실시간으로 파악하여 스마트한 금융 라이프를 지원합니다.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 mt-10 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">우리의 미션</h3>
                        <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                            VERA는 불필요한 광고 공해 없이 사용자 중심의 명확한 정보와 유용한 도구를 가장 빠르게 전달하는 것을 목표로 합니다.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
