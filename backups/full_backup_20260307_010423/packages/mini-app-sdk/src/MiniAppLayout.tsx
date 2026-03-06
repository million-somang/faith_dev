import React from 'react';
interface MiniAppLayoutProps {
    title: string;
    children: React.ReactNode;
    headerRight?: React.ReactNode;
}

export const MiniAppLayout: React.FC<MiniAppLayoutProps> = ({ title, children, headerRight }) => {
    const handleClose = () => {
        if (!window.opener || window.opener === window) {
            // Direct URL entry, redirect to portal
            window.location.href = '/';
            return;
        }
        window.close();
    };

    return (
        <div className="w-full h-[100dvh] max-w-5xl mx-auto bg-gray-50 flex flex-col relative overflow-hidden pb-[env(safe-area-bottom)]">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100 flex-shrink-0 z-10 sticky top-0">
                <div className="flex-1" />
                <h1 className="text-lg font-bold text-gray-800 flex-1 text-center truncate">{title}</h1>
                <div className="flex-1 flex justify-end items-center gap-2">
                    {headerRight}
                    <button
                        onClick={handleClose}
                        className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        aria-label="닫기"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-600">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 w-full mini-app-content relative bg-gray-50 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};
