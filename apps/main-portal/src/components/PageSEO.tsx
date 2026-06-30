import { Helmet } from 'react-helmet-async';

interface PageSEOProps {
    title: string;
    description: string;
    path?: string;
    type?: string;
    image?: string;
    jsonLd?: Record<string, unknown>;
}

const SITE_URL = 'https://faithlink.my';
const SITE_NAME = 'VERA';
const DEFAULT_IMAGE = `${SITE_URL}/logo-512.png`;

export function PageSEO({ title, description, path = '/', type = 'website', image = DEFAULT_IMAGE, jsonLd }: PageSEOProps) {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="ko_KR" />
            <meta property="og:image" content={image} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}
