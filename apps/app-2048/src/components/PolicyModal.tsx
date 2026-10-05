export type PolicyType = 'about' | 'privacy' | 'terms' | 'contact';

interface PolicyModalProps {
    isOpen: boolean;
    type: PolicyType;
    onClose: () => void;
}

export default function PolicyModal({ isOpen, type, onClose }: PolicyModalProps) {
    if (!isOpen) return null;

    const titles: Record<PolicyType, string> = {
        about: '서비스 소개 (About VeraNex 2048)',
        privacy: '개인정보처리방침 (Privacy Policy)',
        terms: '이용약관 (Terms of Service)',
        contact: '고객지원 및 문의 (Contact Us)'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900">
                        {titles[type]}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <i className="fas fa-xmark text-sm"></i>
                    </button>
                </div>

                <div className="overflow-y-auto py-3 text-xs text-slate-600 space-y-3 leading-relaxed">
                    {type === 'about' && (
                        <>
                            <p className="font-bold text-slate-800">
                                VeraNex 2048은 100% 공인 공정 엔진을 탑재한 클래식 숫자 슬라이드 퍼즐 유틸리티입니다.
                            </p>
                            <p>
                                4×4 격자판 위에서 상하좌우 슬라이드를 통해 동일한 숫자를 합쳐 최종 2048 타일을 달성하는 수학적 전략 게임으로, 치매 예방 및 두뇌 인지 민첩성 훈련을 위해 완전 무료로 제공됩니다.
                            </p>
                            <p className="text-[11px] text-slate-400">
                                버전: 2026 PRO v3.0 | 서비스 운영사: VeraNex Media
                            </p>
                        </>
                    )}

                    {type === 'privacy' && (
                        <>
                            <p className="font-bold text-slate-800">
                                1. 수집하는 개인정보 항목 및 목적
                            </p>
                            <p>
                                베라 2048은 이용자의 개인 식별 정보를 서버로 전송하지 않습니다. 모든 최고 점수, 게임 설정 및 진행 상태는 이용자의 브라우저 로컬 저장소(LocalStorage)에만 안전하게 격리 보관됩니다.
                            </p>
                            <p className="font-bold text-slate-800">
                                2. 쿠키 및 구글 애드센스 (Google DART 쿠키) 안내
                            </p>
                            <p>
                                본 서비스는 사용자 경험 개선 및 제휴 광고 송출을 위해 제3자 공급업체(Google 등)의 쿠키를 활용할 수 있습니다. Google의 DART 쿠키 사용을 통해 사용자의 웹사이트 방문 기록을 기반으로 한 맞춤형 광고가 게재될 수 있으며, 사용자는 Google 광고 설정 페이지에서 이를 언제든지 비활성화할 수 있습니다.
                            </p>
                        </>
                    )}

                    {type === 'terms' && (
                        <>
                            <p className="font-bold text-slate-800">제1조 (목적 및 효력)</p>
                            <p>
                                본 약관은 VeraNex가 제공하는 베라 2048 서비스의 이용 조건 및 권리·의무 사항을 규정합니다. 이용자가 본 서비스를 실행함과 동시에 약관에 동의한 것으로 간주합니다.
                            </p>
                            <p className="font-bold text-slate-800">제2조 (공정한 게임 환경 보장)</p>
                            <p>
                                이용자는 비정상적인 방법(메모리 변조, 불법 매크로 스크립트 등)을 통해 랭킹 점수를 왜곡해서는 안 되며, 적발 시 전적 및 기록이 영구 박탈될 수 있습니다.
                            </p>
                        </>
                    )}

                    {type === 'contact' && (
                        <>
                            <p className="font-bold text-slate-800">VeraNex 고객지원 센터</p>
                            <p>
                                서비스 이용 중 발견된 버그 제보, 수학적 알고리즘 오류 보고, 비즈니스 제휴 문의는 아래 공식 지원 채널로 접수해 주시기 바랍니다.
                            </p>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                                <p className="font-bold text-slate-700">이메일: support@veranex.app</p>
                                <p className="text-[11px] text-slate-500">운영시간: 평일 10:00 ~ 18:00 (KST)</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
