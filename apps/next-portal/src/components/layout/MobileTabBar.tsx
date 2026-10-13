'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserPreferenceContext } from '@/context/UserPreferenceContext';
import { useAuth } from '@/context/AuthContext';
import { ALL_MOBILE_TAB_ITEMS, DEFAULT_HOMEPAGE_CONFIG, MAX_MOBILE_TABS, MobileTabItem } from '@/types/homepage.types';

export function MobileTabBar() {
    const pathname = usePathname();
    const { config } = useUserPreferenceContext();
    const { user } = useAuth();

    const tabMap = new Map<string, MobileTabItem>(ALL_MOBILE_TAB_ITEMS.map(t => [t.id, t]));
    const selectedTabIds = config.mobileTabs && config.mobileTabs.length > 0
        ? config.mobileTabs
        : DEFAULT_HOMEPAGE_CONFIG.mobileTabs;
    const tabItems: MobileTabItem[] = selectedTabIds
        .map(id => tabMap.get(id))
        .filter((t): t is MobileTabItem => !!t && (t.id !== 'reward' || user?.email === 'sukman@naver.com'))
        .slice(0, MAX_MOBILE_TABS);

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {tabItems.map((item) => {
                const isMyPageItem = item.id === 'mypage' || item.path === '/mypage';
                const label = isMyPageItem && !user ? '로그인' : item.label;
                const path = isMyPageItem && !user ? '/login' : item.path;
                const icon = isMyPageItem && !user ? 'fas fa-sign-in-alt' : item.icon;
                const isActive = pathname === path;

                return (
                    <Link
                        key={item.id}
                        href={path}
                        className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                        aria-label={`${label} 페이지로 이동`}
                    >
                        <i className={icon} style={item.color ? { color: item.color } : undefined} aria-hidden="true"></i>
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
