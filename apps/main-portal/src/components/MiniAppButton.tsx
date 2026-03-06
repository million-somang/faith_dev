import React from 'react';
import { useAppLauncher } from '../hooks/useAppLauncher';
import { recordAppUsage } from '../hooks/useFrequentApps';
import axios from 'axios';

interface MiniAppButtonProps {
    appId: string;
    icon: React.ReactNode;
    title: string;
    url: string;
    requireAuth?: boolean;
    isLoggedIn?: boolean;
}

export const MiniAppButton: React.FC<MiniAppButtonProps> = ({ appId, icon, title, url, requireAuth, isLoggedIn }) => {
    const { launchApp } = useAppLauncher();

    const handleClick = async () => {
        if (requireAuth && !isLoggedIn) {
            alert(`${title} 앱을 사용하려면 로그인이 필요합니다.`);
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        // localStorage에 앱 사용 횟수 기록 (자주 쓰는 앱 표시용)
        recordAppUsage(appId);

        try {
            // DB 실행 로그 기록
            if (appId !== 'app-calculator') {
                await axios.post(`/api/mini-apps/${appId}/log`, { action_type: 'LAUNCH' });
            }
        } catch (e) {
            console.error('Failed to log app launch', e);
        }

        launchApp(url, appId);
    };

    return (
        <button
            onClick={handleClick}
            className="flex flex-col items-center justify-center gap-2 group outline-none relative"
            aria-label={`${title} 앱 실행`}
        >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 transition-all duration-200 active:scale-95 active:opacity-80 group-hover:shadow-md border border-gray-100 relative">
                {icon}
                {requireAuth && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center text-[10px] text-orange-500 border border-orange-200" title="로그인 필요">
                        <i className="fas fa-lock"></i>
                    </div>
                )}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center break-keep leading-tight px-1">{title}</span>
        </button>
    );
};
