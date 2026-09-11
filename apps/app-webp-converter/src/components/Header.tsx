import React from 'react';
import type { ActiveTab } from '../types/index';

interface HeaderProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    const handleShare = async () => {
        const shareData = {
            title: '이미지 WebP 변환 & 무손실 압축기 | FaithPortal',
            text: 'JPG, PNG 이미지를 차세대 WebP로 변환하고 최대 80% 용량을 절감하세요! (100% 무료 로컬 처리)',
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // 사용자가 취소한 경우 무시
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('링크가 클립보드에 복사되었습니다! 🔗');
            } catch {
                alert('URL을 복사할 수 없습니다.');
            }
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
                        <i className="fas fa-file-image text-xs"></i>
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 leading-tight">WebP 변환 &amp; 압축기</h1>
                        <span className="text-[10px] text-slate-500">2026 차세대 고효율 웹 표준</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        FREE
                    </span>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer"
                        title="공유하기"
                    >
                        <i className="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>

            {/* 3단 알약 탭 바 */}
            <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
                <button
                    type="button"
                    onClick={() => setActiveTab('converter')}
                    className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeTab === 'converter'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <i className="fas fa-bolt text-[11px]"></i>
                    <span>WebP 변환</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('howto')}
                    className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeTab === 'howto'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <i className="fas fa-book-open text-[11px]"></i>
                    <span>사용방법</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeTab === 'faq'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <i className="fas fa-question-circle text-[11px]"></i>
                    <span>FAQ</span>
                </button>
            </nav>
        </header>
    );
}
