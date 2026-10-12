'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { path: '/entertainment/saju', label: '사주', icon: 'fas fa-yin-yang', active: true },
    { path: '/entertainment/travel', label: '여행', icon: 'fas fa-plane-departure', active: true },
    { path: '/entertainment/novel', label: '웹소설', icon: 'fas fa-book-open', active: true, isApp: false },
];

export default function EntertainmentSubMenu() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const handleAppClick = (e: React.MouseEvent, path: string, label: string) => {
        e.preventDefault();
        if (!user) {
            alert(`${label} 서비스는 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.`);
            router.push('/login?redirect=/entertainment');
        } else {
            router.push(path);
        }
    };

    return (
        <nav className="bg-white border-b border-slate-200 shadow-sm w-full">
            <div className="max-w-6xl mx-auto px-3 sm:px-4">
                <div className="flex gap-2 py-3 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                                    isActive
                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <i className={`${item.icon} text-sm`}></i>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
