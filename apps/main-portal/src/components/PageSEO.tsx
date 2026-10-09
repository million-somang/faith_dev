import { Helmet } from 'react-helmet-async';

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

interface PageSEOProps {
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

const SITE_URL = 'https://veranex.app';
const SITE_NAME = 'VERA';
const DEFAULT_IMAGE = `${SITE_URL}/logo-512.png`;

export function PageSEO({
    title,
    description,
    path = '/',
    type = 'website',
    image = DEFAULT_IMAGE,
    robots,
    jsonLd,
    article,
    tool,
    game,
}: PageSEOProps) {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path}`;

    // Schema.org 자동 생성 및 보강
    let effectiveJsonLd = jsonLd;
    if (!effectiveJsonLd && tool) {
        const toolSchemas: Record<string, unknown>[] = [
            {
                '@type': 'WebApplication',
                name: tool.name,
                description: tool.description,
                url: tool.url,
                applicationCategory: tool.applicationCategory || tool.category || 'UtilityApplication',
                operatingSystem: 'All',
                browserRequirements: 'Requires JavaScript, HTML5, and CSS3.',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'KRW',
                },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: '홈',
                        item: SITE_URL,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: tool.breadcrumbParent?.name || '생활도구',
                        item: tool.breadcrumbParent?.item || `${SITE_URL}/lifestyle`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: tool.name,
                        item: tool.url,
                    },
                ],
            },
        ];

        if (tool.howTo && tool.howTo.steps && tool.howTo.steps.length > 0) {
            toolSchemas.push({
                '@type': 'HowTo',
                name: tool.howTo.name,
                step: tool.howTo.steps.map((s, idx) => ({
                    '@type': 'HowToStep',
                    position: idx + 1,
                    name: s.name,
                    text: s.text,
                    url: tool.url,
                })),
            });
        }

        if (tool.faqs && tool.faqs.length > 0) {
            toolSchemas.push({
                '@type': 'FAQPage',
                mainEntity: tool.faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                    },
                })),
            });
        }

        effectiveJsonLd = {
            '@context': 'https://schema.org',
            '@graph': toolSchemas,
        };
    } else if (!effectiveJsonLd && game) {
        const gameSchemas: Record<string, unknown>[] = [
            {
                '@type': ['SoftwareApplication', 'Game'],
                name: game.name,
                description: game.description,
                url: game.url,
                applicationCategory: 'GameApplication',
                genre: game.genre || 'Web Game',
                operatingSystem: 'All',
                browserRequirements: 'Requires JavaScript, HTML5, and CSS3.',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'KRW',
                },
                ...(game.numberOfPlayers ? { numberOfPlayers: game.numberOfPlayers } : {}),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: '홈',
                        item: SITE_URL,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: '게임센터',
                        item: `${SITE_URL}/game`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: game.name,
                        item: game.url,
                    },
                ],
            },
        ];

        if (game.howTo && game.howTo.steps && game.howTo.steps.length > 0) {
            gameSchemas.push({
                '@type': 'HowTo',
                name: game.howTo.name,
                step: game.howTo.steps.map((s, idx) => ({
                    '@type': 'HowToStep',
                    position: idx + 1,
                    name: s.name,
                    text: s.text,
                    url: game.url,
                })),
            });
        }

        if (game.faqs && game.faqs.length > 0) {
            gameSchemas.push({
                '@type': 'FAQPage',
                mainEntity: game.faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                    },
                })),
            });
        }

        effectiveJsonLd = {
            '@context': 'https://schema.org',
            '@graph': gameSchemas,
        };
    } else if (!effectiveJsonLd && type === 'article' && article) {
        effectiveJsonLd = {
            '@context': 'https://schema.org',
            '@type': article.isTech ? 'TechArticle' : 'Article',
            headline: fullTitle,
            description: description,
            image: image,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt || article.publishedAt,
            author: {
                '@type': 'Person',
                name: article.author || 'VERA 편집팀',
                ...(article.authorRole ? { jobTitle: article.authorRole } : {}),
                worksFor: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                },
            },
            publisher: {
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                    '@type': 'ImageObject',
                    url: DEFAULT_IMAGE,
                },
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': url,
            },
            ...(article.section ? { articleSection: article.section } : {}),
            ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
            inLanguage: 'ko-KR',
        };
    } else if (effectiveJsonLd && !Array.isArray(effectiveJsonLd) && (effectiveJsonLd['@type'] === 'Article' || effectiveJsonLd['@type'] === 'TechArticle')) {
        // 기존 Article/TechArticle jsonLd가 전달되었을 때 필수 표준 필드 누락 방지 및 보강
        const currentAuthor = effectiveJsonLd.author as Record<string, unknown> | undefined;
        effectiveJsonLd = {
            ...effectiveJsonLd,
            publisher: effectiveJsonLd.publisher || {
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                    '@type': 'ImageObject',
                    url: DEFAULT_IMAGE,
                },
            },
            dateModified: effectiveJsonLd.dateModified || article?.updatedAt || effectiveJsonLd.datePublished,
            mainEntityOfPage: effectiveJsonLd.mainEntityOfPage || {
                '@type': 'WebPage',
                '@id': url,
            },
            author: currentAuthor ? {
                '@type': currentAuthor['@type'] || 'Person',
                name: currentAuthor.name || article?.author || 'VERA 편집팀',
                ...(article?.authorRole && !currentAuthor.jobTitle ? { jobTitle: article.authorRole } : {}),
                worksFor: currentAuthor.worksFor || {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                },
                ...currentAuthor,
            } : {
                '@type': 'Person',
                name: article?.author || 'VERA 편집팀',
                ...(article?.authorRole ? { jobTitle: article.authorRole } : {}),
                worksFor: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                },
            },
            inLanguage: effectiveJsonLd.inLanguage || 'ko-KR',
        };
    }

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            {robots && <meta name="robots" content={robots} />}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="ko_KR" />
            <meta property="og:image" content={image} />

            {/* Article OG Extensions */}
            {type === 'article' && article?.publishedAt && (
                <meta property="article:published_time" content={article.publishedAt} />
            )}
            {type === 'article' && (article?.updatedAt || article?.publishedAt) && (
                <meta property="article:modified_time" content={article.updatedAt || article.publishedAt} />
            )}
            {type === 'article' && (article?.author) && (
                <meta property="article:author" content={article.author} />
            )}
            {type === 'article' && article?.section && (
                <meta property="article:section" content={article.section} />
            )}
            {type === 'article' && article?.tags?.map((tag) => (
                <meta key={tag} property="article:tag" content={tag} />
            ))}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD */}
            {effectiveJsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(effectiveJsonLd)}
                </script>
            )}
        </Helmet>
    );
}
