import React from 'react';
import { useNavigate } from 'react-router-dom';

export type SoftLockType = 'saju' | 'game' | 'novel' | 'finance' | 'calc' | 'default';

interface SoftLockModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: SoftLockType;
    extraData?: {
        score?: number;
        title?: string;
        message?: string;
        redirectUrl?: string;
    };
}

interface ModalContentConfig {
    badge: string;
    badgeColor: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    benefits: string[];
    primaryBtnText: string;
    primaryBtnBg: string;
}

export const SoftLockModal: React.FC<SoftLockModalProps> = ({
    isOpen,
    onClose,
    type = 'default',
    extraData = {},
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const getConfig = (): ModalContentConfig => {
        switch (type) {
            case 'saju':
                return {
                    badge: '🔮 사주 · 운세 알림',
                    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
                    icon: 'fa-wand-magic-sparkles',
                    iconBg: 'bg-purple-50',
                    iconColor: 'text-purple-600',
                    title: '내 사주 정보 저장하고 매일 아침 알림 받기',
                    description: '한 번만 저장하면 매일 아침 맞춤 운세와 대운·세운 흐름을 로그인 없이 마이페이지에서 바로 확인할 수 있습니다.',
                    benefits: [
                        '매일 아침 8시 맞춤 오늘의 운세 & 행운 팁 제공',
                        '사주 원국 및 오행 밸런스 영구 보관',
                        '가족 및 연인과의 2인 궁합 무제한 저장'
                    ],
                    primaryBtnText: '1초 만에 사주 정보 저장하기',
                    primaryBtnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
                };
            case 'game':
                return {
                    badge: '🏆 게임 랭킹 등록',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                    icon: 'fa-trophy',
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-500',
                    title: extraData.score ? `${extraData.score.toLocaleString()}점 달성! 랭킹에 등록할까요?` : '내 최고 점수 랭킹 등록하기',
                    description: '지금 가입하시면 방금 기록한 최고 점수가 명예의 전당 랭킹에 즉시 등록되며, 주간 랭커 배지가 부여됩니다.',
                    benefits: [
                        '전체 유저 실시간 명예의 전당 랭킹 등재',
                        '최고 점수 및 게임 플레이 통계 누적',
                        '랭킹 챌린지 리워드 포인트 적립 혜택'
                    ],
                    primaryBtnText: '랭킹 등록하고 가입하기',
                    primaryBtnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
                };
            case 'novel':
                return {
                    badge: '🔖 웹소설 선호작 & 이어보기',
                    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: 'fa-bookmark',
                    iconBg: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    title: extraData.title ? `[${extraData.title}] 선호작에 추가할까요?` : '다음 화 이어보기 북마크 저장',
                    description: '선호작으로 등록하면 내가 읽던 마지막 회차부터 즉시 이어보고, 새 회차 업데이트 알림을 가장 먼저 받아볼 수 있습니다.',
                    benefits: [
                        '읽던 위치 자동 저장 및 다음 화 원클릭 이어보기',
                        '신작 및 최신화 업로드 실시간 알림',
                        '나만의 서재에 소장 및 독서 통계 제공'
                    ],
                    primaryBtnText: '선호작 등록하고 이어보기',
                    primaryBtnBg: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
                };
            case 'finance':
            case 'calc':
                return {
                    badge: '💾 마이페이지 저장',
                    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: 'fa-chart-pie',
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    title: '관심 포트폴리오 & 계산 결과 저장하기',
                    description: '자주 쓰는 계산식과 관심 주식·환율 포트폴리오를 저장하여 언제 어디서나 편리하게 다시 불러오세요.',
                    benefits: [
                        '나만의 맞춤 계산식 및 금융 시뮬레이션 보관',
                        '관심 주식 실시간 시세 변동 한눈에 보기',
                        '마이페이지 대시보드와 자동 동기화'
                    ],
                    primaryBtnText: '포트폴리오 저장하고 시작하기',
                    primaryBtnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
                };
            default:
                return {
                    badge: '✨ VERA 회원 전용 혜택',
                    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: 'fa-star',
                    iconBg: 'bg-slate-50',
                    iconColor: 'text-blue-600',
                    title: extraData.title || '간편 가입하고 모든 혜택을 누리세요',
                    description: extraData.message || '로그인하시면 데이터가 영구 보관되며 더욱 풍성한 개인화 서비스를 이용하실 수 있습니다.',
                    benefits: [
                        '모든 도구 및 콘텐츠 데이터 영구 저장',
                        '맞춤형 대시보드 및 알림 서비스',
                        '커뮤니티 및 랭킹 참여 권한'
                    ],
                    primaryBtnText: '1초 만에 무료 회원가입',
                    primaryBtnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
                };
        }
    };

    const config = getConfig();
    const currentPath = extraData.redirectUrl || window.location.pathname + window.location.search;

    const handleSignup = () => {
        onClose();
        navigate(`/signup?redirect=${encodeURIComponent(currentPath)}`);
    };

    const handleLogin = () => {
        onClose();
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
            <div 
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 상단 닫기 바 */}
                <div className="flex justify-between items-center px-6 pt-5 pb-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeColor}`}>
                        {config.badge}
                    </span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="닫기"
                    >
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                {/* 메인 바디 */}
                <div className="px-6 py-4 text-center">
                    <div className={`w-16 h-16 ${config.iconBg} ${config.iconColor} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner`}>
                        <i className={`fas ${config.icon}`}></i>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-snug">
                        {config.title}
                    </h3>
                    <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                        {config.description}
                    </p>

                    {/* 혜택 리스트 박스 */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-left space-y-2">
                        <div className="text-[11px] font-extrabold text-slate-400 mb-1">회원 전용 무료 혜택</div>
                        {config.benefits.map((b, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                                <i className="fas fa-check-circle text-emerald-500 text-xs shrink-0"></i>
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-2.5">
                        <button
                            onClick={handleSignup}
                            className={`w-full py-3.5 px-4 text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${config.primaryBtnBg}`}
                        >
                            <span>{config.primaryBtnText}</span>
                            <i className="fas fa-arrow-right text-xs"></i>
                        </button>
                        
                        <div className="flex items-center justify-between px-1 pt-1 text-xs text-slate-500">
                            <button
                                onClick={handleLogin}
                                className="font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                            >
                                이미 계정이 있으신가요? <span className="underline font-bold">로그인</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="hover:text-slate-700 transition-colors text-slate-400 font-medium cursor-pointer"
                            >
                                나중에 하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SoftLockModal;
