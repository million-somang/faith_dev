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

interface PageSEOProps {
    title: string;
    description: string;
    path?: string;
    type?: string;
    image?: string;
    robots?: string;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
    article?: ArticleMetadata;
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
}: PageSEOProps) {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path}`;

    // Schema.org Article / TechArticle 자동 생성 및 보강
    let effectiveJsonLd = jsonLd;
    if (!effectiveJsonLd && type === 'article' && article) {
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
