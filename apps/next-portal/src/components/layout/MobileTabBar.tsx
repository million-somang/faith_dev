'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ALL_MOBILE_TAB_ITEMS, MobileTabItem } from '@/types/homepage.types';

export function MobileTabBar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const activeTabRef = useRef<HTMLAnchorElement | null>(null);

    const tabItems: MobileTabItem[] = ALL_MOBILE_TAB_ITEMS;

    // 현재 활성화된 탭이 화면 밖이나 끝에 있을 때 자동으로 화면 중앙으로 스크롤 이동
    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [pathname]);

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {tabItems.map((item) => {
                const isMyPageItem = item.id === 'mypage' || item.path === '/mypage';
                const label = isMyPageItem && !user ? '로그인' : item.label;
                const path = isMyPageItem && !user ? '/login' : item.path;
                const icon = isMyPageItem && !user ? 'fas fa-sign-in-alt' : item.icon;
                const isActive = item.path === '/'
                    ? pathname === '/'
                    : pathname === path || pathname.startsWith(path + '/');

                return (
                    <Link
                        key={item.id}
                        ref={isActive ? activeTabRef : undefined}
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
