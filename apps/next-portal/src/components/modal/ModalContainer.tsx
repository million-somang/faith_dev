'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ModalContainerProps {
  title: string;
  categoryLabel?: string;
  icon?: string;
  children: React.ReactNode;
}

export function ModalContainer({
  title,
  categoryLabel,
  icon,
  children,
}: ModalContainerProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // ESC 키 닫기 및 부모 물리 키보드 이벤트 릴레이 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // iframe 내부로 키보드 이벤트 릴레이 (MINI_APP_MODAL_SEO_GUIDE 표준)
      const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'PARENT_KEYBOARD_EVENT',
          key: e.key,
          code: e.code,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        }, '*');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // 바디 스크롤 락
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* 
        모바일: 100% 전체 화면 (시원한 풀스크린 앱 모드)
        PC: 중앙 정렬 팝업 모달 (최대 폭 520px, 높이 90vh)
      */}
      <div
        className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 바 */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                <i className={icon}></i>
              </div>
            )}
            <div>
              {categoryLabel && (
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  {categoryLabel}
                </span>
              )}
              <h2 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* 고대비 및 48px 이상의 안전한 터치 닫기 버튼 (구글 페널티 방어) */}
          <button
            onClick={handleClose}
            aria-label="닫기"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </header>

        {/* 모달 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
