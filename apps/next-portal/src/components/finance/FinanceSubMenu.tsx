'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@faithportal/ui';

const MENU_ITEMS = [
    { path: '/finance', label: '주식', icon: 'fas fa-chart-line' },
    { path: '/finance/stocks', label: '종목', icon: 'fas fa-magnifying-glass-chart' },
    { path: '/finance/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
    { path: '/finance/banking', label: '은행', icon: 'fas fa-university' },
    { path: '/finance/util', label: '금융Util', icon: 'fas fa-chart-pie' },
];

export default function FinanceSubMenu() {
    const pathname = usePathname();

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm w-full" aria-label="금융 서브 네비게이션">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 w-full">
                {/* 모바일 알약 탭 */}
                <div className="flex sm:hidden gap-1.5 py-2.5 overflow-x-auto hide-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const isActive =
                            item.path === '/finance'
                                ? pathname === '/finance'
                                : pathname === item.path || pathname.startsWith(item.path + '/');
                        const isUtil = item.path === '/finance/util';

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? isUtil
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-green-600 text-white shadow-sm'
                                        : isUtil
                                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <i className={`${item.icon} text-base`}></i>
                                <span>{t(item.label)}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* 데스크톱 밑줄 탭 */}
                <div className="hidden sm:flex space-x-8 overflow-x-auto hide-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const isActive =
                            item.path === '/finance'
                                ? pathname === '/finance'
                                : pathname === item.path || pathname.startsWith(item.path + '/');
                        const isUtil = item.path === '/finance/util';

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`px-4 py-4 whitespace-nowrap transition-all flex items-center gap-2 font-medium ${
                                    isActive
                                        ? isUtil
                                            ? 'text-amber-600 border-b-2 border-amber-600 font-extrabold'
                                            : 'text-green-600 border-b-2 border-green-600 font-extrabold'
                                        : isUtil
                                          ? 'text-amber-700 hover:text-amber-800 font-bold hover:border-b-2 hover:border-amber-600'
                                          : 'text-gray-700 hover:text-green-600 hover:border-b-2 hover:border-green-600'
                                }`}
                            >
                                <i className={item.icon}></i>
                                <span>{t(item.label)}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
