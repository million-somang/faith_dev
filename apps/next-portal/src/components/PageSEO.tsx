'use client';

import React, { useEffect } from 'react';

export interface ArticleMetadata {
    author?: string;
    authorRole?: string;
    publishedAt?: string;
    updatedAt?: string;
    section?: string;
    tags?: string[];
    isTech?: boolean;
}

export interface ToolSchemaProps {
    name: string;
    description: string;
    url: string;
    category?: string;
    applicationCategory?: string;
    breadcrumbParent?: { name: string; item: string };
    directAnswer?: string;
    howTo?: {
        name: string;
        steps: { name: string; text: string }[];
    };
    faqs?: {
        question: string;
        answer: string;
    }[];
}

export interface GameSchemaProps {
    name: string;
    description: string;
    url: string;
    genre?: string;
    numberOfPlayers?: string;
    howTo?: {
        name: string;
        steps: { name: string; text: string }[];
    };
    faqs?: {
        question: string;
        answer: string;
    }[];
}

export interface PageSEOProps {
    title: string;
    description: string;
    path?: string;
    type?: string;
    image?: string;
    robots?: string;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
    article?: ArticleMetadata;
    tool?: ToolSchemaProps;
    game?: GameSchemaProps;
}

export function PageSEO({
    title,
    description,
    path = '/',
    type = 'website',
    image,
    robots,
    jsonLd,
    article,
    tool,
    game,
}: PageSEOProps) {
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = title.includes('VERA') ? title : `${title} | VERA`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', description);
            }
        }
    }, [title, description]);

    return null;
}
