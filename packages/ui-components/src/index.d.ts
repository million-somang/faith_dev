import React from 'react';
export declare const Button: ({ children, onClick, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}) => import("react/jsx-runtime").JSX.Element;
export declare const Card: ({ children, className }: {
    children: React.ReactNode;
    className?: string;
}) => import("react/jsx-runtime").JSX.Element;
export declare const NewsCard: ({ news, index, isBookmarked, onBookmarkToggle, hideActions, onVote }: {
    news: any;
    index?: number;
    isBookmarked?: boolean;
    onBookmarkToggle?: (id: number) => void;
    hideActions?: boolean;
    onVote?: (id: number, type: "up" | "down") => void;
}) => import("react/jsx-runtime").JSX.Element;
export declare const Header: ({ user, onLogout }?: {
    user?: any;
    onLogout?: () => void;
}) => import("react/jsx-runtime").JSX.Element;
export declare const QuickMenu: () => import("react/jsx-runtime").JSX.Element;
export declare const Footer: () => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map