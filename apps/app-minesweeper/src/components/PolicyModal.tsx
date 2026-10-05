import React from 'react';

export type PolicyType = 'about' | 'privacy' | 'terms' | 'contact' | null;

interface PolicyModalProps {
    type: PolicyType;
    onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
    if (!type) return null;

    const renderContent = () => {
        switch (type) {
            case 'about':
                return (
                    <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                        <h4 className="font-black text-sm text-slate-900">베라 지뢰찾기 (Vera Minesweeper) 소개</h4>
                        <p>
                            베라 지뢰찾기는 <strong>VeraNex</strong> 인터랙티브 엔터테인먼트 엔진에서 제공하는 공인 표준 논리 추론 미니게임입니다.
                        </p>
                        <p>
                            첫 번째 클릭 시 무조건 안전한 오픈 영역을 생성하는 100% 안전 보장 알고리즘과 모바일 최적화 원터치 모드(파기 vs 깃발)를 탑재하여 누구나 쾌적하게 플레이할 수 있습니다.
                        </p>
                        <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <strong>운영 표준:</strong> 2026 VeraNex Interactive Standard Engine<br />
                            <strong>제공사:</strong> VeraNex Team
                        </p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                        <h4 className="font-black text-sm text-slate-900">개인정보처리방침 (Privacy Policy)</h4>
                        <p>
                            베라 지뢰찾기는 사용자의 프라이버시를 최우선으로 보호하며, 개인정보보호법 및 구글 애드센스 퍼블리셔 정책을 엄격히 준수합니다.
                        </p>
                        <div className="space-y-2">
                            <h5 className="font-bold text-slate-900">1. 개인정보 및 게임 데이터 로컬 격리</h5>
                            <p>
                                플레이어의 설정, 음소거 여부, 로컬 기록은 브라우저 로컬 저장소(LocalStorage)에 안전하게 격리되며 외부 서버로 무단 전송되지 않습니다.
                            </p>
                            <h5 className="font-bold text-slate-900">2. 구글 DART 쿠키 및 제3자 광고 안내</h5>
                            <p>
                                본 서비스는 타사 공급업체(Google 등)가 제공하는 쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 관련성 높은 광고를 게재할 수 있습니다. 사용자는 Google 광고 설정에서 맞춤 광고를 언제든지 선택 해제할 수 있습니다.
                            </p>
                        </div>
                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                        <h4 className="font-black text-sm text-slate-900">서비스 이용약관 (Terms of Service)</h4>
                        <p>
                            본 약관은 VeraNex가 제공하는 베라 지뢰찾기 웹 애플리케이션의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.
                        </p>
                        <p>
                            1. 서비스는 교육 및 여가 목적을 위한 무료 서비스로 제공됩니다.<br />
                            2. 비정상적인 매크로, 해킹, 역공학 시도를 엄격히 금지합니다.<br />
                            3. 알고리즘 및 UI 에셋의 지식재산권은 VeraNex에 귀속됩니다.
                        </p>
                    </div>
                );
            case 'contact':
                return (
                    <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                        <h4 className="font-black text-sm text-slate-900">고객 지원 및 문의 (Contact Us)</h4>
                        <p>
                            베라 지뢰찾기 이용 중 오류 제보, 시스템 건의, 비즈니스 제휴 문의는 아래 공식 지원 채널로 연락해 주시기 바랍니다.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-medium">
                            <div>📧 <strong>이메일:</strong> support@veranex.app</div>
                            <div>🏢 <strong>운영:</strong> VeraNex 디지털 플랫폼 사업부</div>
                            <div>⏰ <strong>응답 시간:</strong> 평일 10:00 ~ 18:00 (KST)</div>
                        </div>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'about': return '서비스 소개';
            case 'privacy': return '개인정보처리방침';
            case 'terms': return '이용약관';
            case 'contact': return '고객 지원 & 문의';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                    <h3 className="font-black text-base text-slate-900">{getTitle()}</h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                    {renderContent()}
                </div>

                <div className="pt-2 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};
