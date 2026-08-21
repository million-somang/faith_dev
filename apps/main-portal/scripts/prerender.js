import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portalRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(portalRoot, 'dist');
const templateHtmlPath = path.resolve(distDir, 'index.html');

if (!fs.existsSync(templateHtmlPath)) {
    console.error('❌ dist/index.html not found. Run vite build first.');
    process.exit(1);
}

// Markdown to simple semantic HTML converter
function markdownToHtml(md) {
    let html = md
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-100 pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-gray-900 mt-8 mb-4">$1</h1>')
        // Bold & Italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        // Blockquote
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-teal-500 pl-4 py-2 my-4 bg-teal-50/40 text-gray-700 italic rounded-r">$1</blockquote>')
        // Horizontal Rule
        .replace(/^---$/gim, '<hr class="my-6 border-gray-200" />')
        // Lists
        .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-gray-700 my-1 leading-relaxed">$1</li>')
        .replace(/^[0-9]+\. (.*$)/gim, '<li class="ml-6 list-decimal text-gray-700 my-1 leading-relaxed">$1</li>')
        // Tables (simple conversion)
        .replace(/\| (.*) \|/g, (match) => {
            const cells = match.split('|').filter(c => c.trim() !== '');
            if (cells[0].includes('---')) return '';
            const tag = match.includes('자산 분류') || match.includes('법정 표기') || match.includes('저축/투자') || match.includes('구분') || match.includes('우세한') || match.includes('변주 유형') || match.includes('오류 유형') || match.includes('상환 방식')
                ? 'th class="px-4 py-2 bg-gray-100 font-bold text-left text-xs text-gray-700 border border-gray-200"'
                : 'td class="px-4 py-2 text-sm text-gray-600 border border-gray-200"';
            return `<tr class="border-b">${cells.map(c => `<${tag}>${c.trim()}</${tag.split(' ')[0]}>`).join('')}</tr>`;
        })
        // Paragraphs
        .replace(/^(?!<[h|l|b|h|t|d|p|r])(.*$)/gim, (match) => {
            if (!match.trim()) return '';
            return `<p class="text-gray-700 leading-relaxed my-3 text-base">${match}</p>`;
        });

    return html;
}

// Read guides data from compiled or direct source
async function loadGuides() {
    const guidesSourcePath = path.resolve(portalRoot, 'src/data/guidesData.ts');
    const sourceContent = fs.readFileSync(guidesSourcePath, 'utf8');

    // Extract GUIDES_DATA array using regex
    const matches = sourceContent.match(/slug:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'[\s\S]*?categoryLabel:\s*'([^']+)'[\s\S]*?readTime:\s*'([^']+)'[\s\S]*?publishedAt:\s*'([^']+)'[\s\S]*?author:\s*'([^']+)'[\s\S]*?summary:\s*'([^']+)'[\s\S]*?content:\s*`([\s\S]*?)`/g);

    if (!matches) {
        console.warn('⚠️ No guide matches found regex, fallback to dynamic import');
        return [];
    }

    const guides = [];
    for (const block of matches) {
        const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
        const title = block.match(/title:\s*'([^']+)'/)?.[1];
        const description = block.match(/description:\s*'([^']+)'/)?.[1];
        const categoryLabel = block.match(/categoryLabel:\s*'([^']+)'/)?.[1];
        const readTime = block.match(/readTime:\s*'([^']+)'/)?.[1];
        const publishedAt = block.match(/publishedAt:\s*'([^']+)'/)?.[1];
        const author = block.match(/author:\s*'([^']+)'/)?.[1];
        const summary = block.match(/summary:\s*'([^']+)'/)?.[1];
        const contentMatch = block.match(/content:\s*`([\s\S]*?)`/);
        const content = contentMatch ? contentMatch[1] : '';

        if (slug && title) {
            guides.push({
                slug,
                title,
                description,
                categoryLabel,
                readTime,
                publishedAt,
                author,
                summary,
                content
            });
        }
    }

    return guides;
}

async function prerender() {
    console.log('🚀 Starting Static HTML Prerendering (SSG for AdSense & Googlebot)...');

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf8');
    const guides = await loadGuides();

    console.log(`📚 Found ${guides.length} guides for static HTML generation.`);

    // 1. Generate /guides Hub static page
    const guidesHubHtml = generateGuidesHubHtml(templateHtml, guides);
    writeHtmlFile(path.resolve(distDir, 'guides/index.html'), guidesHubHtml);
    writeHtmlFile(path.resolve(distDir, 'blog/index.html'), guidesHubHtml);

    // 2. Generate each /guides/:slug article static page
    for (const guide of guides) {
        const articleHtml = generateArticleHtml(templateHtml, guide);
        writeHtmlFile(path.resolve(distDir, `guides/${guide.slug}/index.html`), articleHtml);
        writeHtmlFile(path.resolve(distDir, `blog/${guide.slug}/index.html`), articleHtml);
    }

    // 3. Generate static pages for Core Legal & Info pages
    generateLegalPages(templateHtml);

    // 4. Generate static pages for Finance Util Calculators
    generateFinanceUtilPages(templateHtml);

    console.log('✅ Static Prerendering completed successfully! All 18 articles and Finance Util pages have full static HTML.');
}

function writeHtmlFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  📄 Generated: ${path.relative(distDir, filePath)}`);
}

function generateGuidesHubHtml(template, guides) {
    const title = 'VERA 지식 가이드 & 전문 칼럼 허브 - 믿음의 생활 정보 포털';
    const description = '금융, 명리학, 웹소설 작법, 생활계산, 게임 전략 등 일상과 지적 성장에 도움을 주는 18편의 고품질 장문 정보성 칼럼을 제공합니다.';
    const canonical = 'https://veranex.app/guides';

    const cardsHtml = guides.map(g => `
        <article class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all mb-4">
            <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">${g.categoryLabel}</span>
                <span class="text-xs text-gray-400 font-medium">${g.readTime} 읽기</span>
                <span class="text-xs text-gray-400 font-medium">· ${g.publishedAt}</span>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">
                <a href="/guides/${g.slug}" class="hover:text-teal-600">${g.title}</a>
            </h2>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">${g.description}</p>
            <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                <span>작성자: ${g.author}</span>
                <a href="/guides/${g.slug}" class="text-teal-600 font-bold hover:underline">전문 읽기 →</a>
            </div>
        </article>
    `).join('\n');

    const prerenderBody = `
        <div class="min-h-screen bg-slate-50 font-sans">
            <header class="bg-white border-b border-gray-200 py-4 px-6">
                <div class="max-w-6xl mx-auto flex items-center justify-between">
                    <a href="/" class="text-2xl font-black text-teal-700">VERA</a>
                    <nav class="flex gap-4 text-sm font-medium text-gray-600">
                        <a href="/" class="hover:text-teal-700">홈</a>
                        <a href="/guides" class="text-teal-700 font-bold">지식 가이드</a>
                        <a href="/news" class="hover:text-teal-700">뉴스</a>
                        <a href="/lifestyle" class="hover:text-teal-700">생활도구</a>
                    </nav>
                </div>
            </header>
            <main class="max-w-6xl mx-auto px-4 py-10">
                <div class="mb-10 text-center">
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">지식 가이드 & 전문 칼럼</h1>
                    <p class="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
                        실생활에 유용한 금융, 전통문화, 창작 작법, 생활계산, 두뇌 전략의 깊이 있는 전문 지식을 나눕니다.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${cardsHtml}
                </div>
            </main>
            <footer class="bg-white border-t border-gray-200 py-8 px-6 text-center text-xs text-gray-500">
                <p>© 2026 VERA (베라) - 세상의 모든 정보를 하나로 묶는 믿음의 포털</p>
            </footer>
        </div>
    `;

    return replaceMetaTags(template, {
        title,
        description,
        canonical,
        ogType: 'website',
        bodyHtml: prerenderBody
    });
}

function generateArticleHtml(template, guide) {
    const title = `${guide.title} | VERA 지식 가이드`;
    const description = guide.description;
    const canonical = `https://veranex.app/guides/${guide.slug}`;
    const articleHtmlContent = markdownToHtml(guide.content);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": guide.title,
        "description": guide.description,
        "author": {
            "@type": "Organization",
            "name": guide.author || "VERA 편집팀"
        },
        "publisher": {
            "@type": "Organization",
            "name": "VERA (베라)",
            "url": "https://veranex.app",
            "logo": {
                "@type": "ImageObject",
                "url": "https://veranex.app/logo-512.png"
            }
        },
        "datePublished": guide.publishedAt,
        "dateModified": guide.publishedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical
        }
    };

    const prerenderBody = `
        <div class="min-h-screen bg-slate-50 font-sans">
            <header class="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
                <div class="max-w-5xl mx-auto flex items-center justify-between">
                    <a href="/" class="text-2xl font-black text-teal-700">VERA</a>
                    <nav class="flex items-center gap-4 text-sm font-medium text-gray-600">
                        <a href="/" class="hover:text-teal-700">홈</a>
                        <a href="/guides" class="text-teal-700 font-bold">지식 가이드</a>
                        <a href="/news" class="hover:text-teal-700">뉴스</a>
                    </nav>
                </div>
            </header>

            <article class="max-w-4xl mx-auto px-4 py-10" itemscope itemtype="https://schema.org/Article">
                <!-- Breadcrumbs -->
                <nav class="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
                    <a href="/" class="hover:underline">홈</a>
                    <span>/</span>
                    <a href="/guides" class="hover:underline">가이드</a>
                    <span>/</span>
                    <span class="text-gray-900 font-medium">${guide.categoryLabel}</span>
                </nav>

                <!-- Article Header -->
                <header class="mb-8 pb-8 border-b border-gray-200">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">${guide.categoryLabel}</span>
                        <span class="text-xs text-gray-500 font-medium">${guide.readTime} 소요</span>
                        <span class="text-xs text-gray-400">·</span>
                        <time datetime="${guide.publishedAt}" class="text-xs text-gray-500 font-medium">${guide.publishedAt}</time>
                    </div>
                    <h1 class="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4" itemprop="headline">${guide.title}</h1>
                    <p class="text-lg text-gray-600 leading-relaxed font-normal" itemprop="description">${guide.description}</p>
                    <div class="mt-4 text-xs text-gray-500">
                        작성자: <span itemprop="author" class="font-medium text-gray-700">${guide.author}</span>
                    </div>
                </header>

                <!-- Summary Highlight -->
                <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60 rounded-2xl p-6 mb-8 text-teal-950">
                    <div class="font-bold text-sm text-teal-800 mb-1">📌 핵심 요약</div>
                    <p class="text-sm leading-relaxed">${guide.summary}</p>
                </div>

                <!-- Main Content Body (Rich Text) -->
                <div class="prose prose-slate max-w-none text-gray-800 leading-relaxed text-base" itemprop="articleBody">
                    ${articleHtmlContent}
                </div>

                <!-- Article Footer -->
                <footer class="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <a href="/guides" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all">
                        ← 가이드 목록으로 돌아가기
                    </a>
                    <div class="text-xs text-gray-400">
                        본 콘텐츠는 VERA 편집팀에 의해 작성 및 검수되었습니다.
                    </div>
                </footer>
            </article>

            <footer class="bg-white border-t border-gray-200 py-8 px-6 text-center text-xs text-gray-500">
                <p>© 2026 VERA (베라) - 세상의 모든 정보를 하나로 묶는 믿음의 포털</p>
            </footer>
        </div>
    `;

    return replaceMetaTags(template, {
        title,
        description,
        canonical,
        ogType: 'article',
        jsonLd,
        bodyHtml: prerenderBody
    });
}

function generateLegalPages(template) {
    const pages = [
        {
            route: 'about',
            title: '서비스 소개 (About Us) | VERA',
            description: '세상의 모든 유용한 정보를 하나로 연결하는 신뢰의 라이프 포털 VERA의 비전과 서비스 소개입니다.',
            heading: 'VERA 서비스 소개',
            content: `
                <h2 class="text-2xl font-bold mb-4">우리의 비전</h2>
                <p class="text-gray-700 leading-relaxed mb-6">
                    VERA(베라)는 '진실과 신뢰'를 바탕으로 사용자의 일상에 실질적인 가치를 더하는 올인원 웹 라이프 포털입니다.
                    실시간 주요 뉴스 브리핑, 실생활 계산 유틸리티, 뇌 건강을 위한 두뇌 게임, 금융 정보, 전통 인문학 칼럼에 이르기까지 
                    신뢰할 수 있는 디지털 경험을 하나의 플랫폼에서 끊김 없이 제공합니다.
                </p>
                <h2 class="text-2xl font-bold mb-4">핵심 가치</h2>
                <ul class="list-disc ml-6 space-y-2 text-gray-700 mb-6">
                    <li><strong>투명성과 정확성:</strong> 검증된 데이터와 공신력 있는 출처 기반의 정보를 제공합니다.</li>
                    <li><strong>사용자 중심 인터페이스:</strong> 군더더기 없는 직관적인 UX와 빠른 로딩 속도를 보장합니다.</li>
                    <li><strong>지속적인 발전:</strong> 사용자의 피드백을 수렴하여 매일 새로운 기능과 양질의 지식 콘텐츠를 확장합니다.</li>
                </ul>
            `
        },
        {
            route: 'privacy',
            title: '개인정보처리방침 (Privacy Policy) | VERA',
            description: 'VERA는 이용자의 개인정보를 소중히 여기며 관련 법령을 철저히 준수합니다.',
            heading: '개인정보처리방침',
            content: `
                <p class="text-gray-700 leading-relaxed mb-6">
                    본 방침은 VERA(이하 '회사')가 제공하는 서비스의 개인정보 수집, 이용, 보관 및 파기에 관한 기준을 명시합니다.
                </p>
                <h2 class="text-2xl font-bold mb-4">1. 수집하는 개인정보 항목</h2>
                <p class="text-gray-700 leading-relaxed mb-4">
                    회사는 회원가입 및 원활한 서비스 제공을 위해 이메일, 닉네임, 서비스 이용 기록 등을 수집할 수 있습니다.
                </p>
                <h2 class="text-2xl font-bold mb-4">2. 개인정보의 이용 목적</h2>
                <p class="text-gray-700 leading-relaxed mb-4">
                    수집된 정보는 사용자 인증, 서비스 맞춤 설정, 불법 행위 방지 및 문의 응대에만 활용됩니다.
                </p>
                <h2 class="text-2xl font-bold mb-4">3. 쿠키 및 광고 식별자 안내</h2>
                <p class="text-gray-700 leading-relaxed mb-4">
                    회사는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있으며, 이용자는 브라우저 설정을 통해 쿠키 수집을 거부할 수 있습니다.
                </p>
            `
        },
        {
            route: 'terms',
            title: '서비스 이용약관 (Terms of Service) | VERA',
            description: 'VERA 서비스 이용에 관한 기본 권리와 의무를 규정합니다.',
            heading: '서비스 이용약관',
            content: `
                <h2 class="text-2xl font-bold mb-4">제1조 (목적)</h2>
                <p class="text-gray-700 leading-relaxed mb-4">
                    본 약관은 VERA 포털이 제공하는 모든 제반 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.
                </p>
                <h2 class="text-2xl font-bold mb-4">제2조 (면책 조항)</h2>
                <p class="text-gray-700 leading-relaxed mb-4">
                    포털에서 제공하는 금융, 계산기, 명리학 콘텐츠는 참고용 정보이며, 최종 투자 및 의사결정의 책임은 이용자 본인에게 있습니다.
                </p>
            `
        },
        {
            route: 'contact',
            title: '고객 문의 및 제휴 (Contact Us) | VERA',
            description: 'VERA 포털에 대한 질문, 피드백, 비즈니스 제휴 문의를 남겨주세요.',
            heading: '고객 문의 & 제휴',
            content: `
                <p class="text-gray-700 leading-relaxed mb-6">
                    VERA 서비스 이용 중 불편하신 점이나 비즈니스 제휴 제안이 있으시면 언제든지 편하게 연락 주시기 바랍니다.
                </p>
                <div class="bg-gray-100 p-6 rounded-xl text-sm text-gray-800 space-y-2">
                    <p><strong>공식 이메일:</strong> support@veranex.app / business@veranex.app</p>
                    <p><strong>응대 시간:</strong> 평일 10:00 ~ 18:00 (주말 및 공휴일 제외)</p>
                    <p><strong>운영 주체:</strong> VERA 서비스 운영팀</p>
                </div>
            `
        }
    ];

    for (const page of pages) {
        const canonical = `https://veranex.app/${page.route}`;
        const prerenderBody = `
            <div class="min-h-screen bg-slate-50 font-sans">
                <header class="bg-white border-b border-gray-200 py-4 px-6">
                    <div class="max-w-4xl mx-auto flex items-center justify-between">
                        <a href="/" class="text-2xl font-black text-teal-700">VERA</a>
                        <nav class="flex gap-4 text-sm font-medium text-gray-600">
                            <a href="/" class="hover:text-teal-700">홈</a>
                            <a href="/guides" class="hover:text-teal-700">가이드</a>
                            <a href="/about" class="hover:text-teal-700">소개</a>
                        </nav>
                    </div>
                </header>
                <main class="max-w-4xl mx-auto px-4 py-12">
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8">${page.heading}</h1>
                    <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm leading-relaxed text-gray-800">
                        ${page.content}
                    </div>
                </main>
                <footer class="bg-white border-t border-gray-200 py-8 px-6 text-center text-xs text-gray-500">
                    <p>© 2026 VERA - All rights reserved.</p>
                </footer>
            </div>
        `;

        const html = replaceMetaTags(template, {
            title: page.title,
            description: page.description,
            canonical,
            ogType: 'website',
            bodyHtml: prerenderBody
        });

        writeHtmlFile(path.resolve(distDir, `${page.route}/index.html`), html);
    }
}

function generateFinanceUtilPages(template) {
    const pages = [
        {
            route: 'finance/util',
            title: 'VERA 금융Util - 미국 배당주 세금, 주담대 DSR/LTV, 퇴직금 계산기',
            description: '미국 배당주 배당소득세(15.4%) 및 월배당 캘린더, 주택담보대출 스트레스 DSR 한도, 퇴직금 및 2026 실업급여 실수령액 시뮬레이터와 상세 설명서를 무료로 제공합니다.',
            heading: 'VERA 금융Util (스마트 금융 계산기 & 완벽 가이드)',
            faqJson: {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "미국 배당주 배당금에 부과되는 세금은 얼마인가요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "미국 주식 배당금은 한미 조세조약에 따라 미국 국세청(IRS)에서 15%를 원천징수하며, 한국 기본 배당세율(15.4%)과 조율되어 15.4% 분리과세로 종결됩니다. 단, 연간 금융소득이 2,000만 원을 초과하면 종합과세 대상이 됩니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "스트레스 DSR 2단계가 주택담보대출 한도에 미치는 영향은 무엇인가요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "스트레스 DSR은 향후 금리 인상 위험을 고려해 약정금리에 가산금리(수도권 +1.20%p, 비수도권 +0.75%p)를 더해 DSR을 산정하므로, 실제 빌릴 수 있는 최대 대출 원금 한도가 축소됩니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "퇴직금을 IRP 계좌로 수령하면 어떤 절세 혜택이 있나요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "퇴직금을 IRP(개인형 퇴직연금)로 이전한 뒤 55세 이후 연금으로 수령하면 퇴직소득세의 30%(10년 초과 수령 시 40%)를 감면받으며 과세이연 복리 효과를 누릴 수 있습니다."
                        }
                    }
                ]
            },
            content: `
                <div class="space-y-8">
                    <p class="text-gray-700 leading-relaxed text-base">
                        VERA 금융Util은 일상생활 및 자산 관리에 직결되는 3대 핵심 금융 시뮬레이터와 상세 이용 설명서를 100% 무료로 제공합니다.
                        미국 배당주 세후 실수령액, 주택담보대출 DSR/LTV 한도, 법정 퇴직금 및 실업급여를 정밀하게 계산하고 금융 절세 전략을 확인하세요.
                    </p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="p-6 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                            <h3 class="font-bold text-amber-900 text-lg">💵 미국 배당주 세금 & 월배당</h3>
                            <p class="text-xs text-gray-600 leading-relaxed">SCHD, JEPI 등 인기 ETF 배당소득세(15.4%) 공제, 12개월 입금 캘린더, 금융소득종합과세 2,000만원 한도 체크 및 ISA/IRP 절세 가이드</p>
                            <a href="/finance/util?tab=dividend" class="inline-block text-xs font-bold text-amber-700 hover:underline">계산기 & 설명서 보기 →</a>
                        </div>
                        <div class="p-6 bg-blue-50 rounded-2xl border border-blue-200 space-y-3">
                            <h3 class="font-bold text-blue-900 text-lg">🏠 주택담보대출 DSR / LTV</h3>
                            <p class="text-xs text-gray-600 leading-relaxed">2026 스트레스 DSR 2단계(수도권 +1.20%p) 적용 최대 대출 한도, 원리금/원금/만기일시 3대 상환방식별 월 납입금 및 총이자 비교</p>
                            <a href="/finance/util?tab=dsr" class="inline-block text-xs font-bold text-blue-700 hover:underline">계산기 & 설명서 보기 →</a>
                        </div>
                        <div class="p-6 bg-teal-50 rounded-2xl border border-teal-200 space-y-3">
                            <h3 class="font-bold text-teal-900 text-lg">💼 퇴직금 & 실업급여</h3>
                            <p class="text-xs text-gray-600 leading-relaxed">근속연수/통상임금 기준 법정 퇴직금 및 IRP 30% 감면 혜택, 2026 고용보험 실업급여(구직급여) 연령/가입기간별 지급일수(120~270일) 시뮬레이션</p>
                            <a href="/finance/util?tab=severance" class="inline-block text-xs font-bold text-teal-700 hover:underline">계산기 & 설명서 보기 →</a>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-4">
                        <h4 class="font-bold text-sm text-gray-900">💡 VERA 금융 계산기 3대 핵심 요약</h4>
                        <ul class="list-disc pl-5 space-y-1.5 leading-relaxed">
                            <li><strong>미국 배당주 세금:</strong> 원천징수 15%와 금융소득종합과세 2,000만원 기준선을 한눈에 게이지로 파악할 수 있습니다.</li>
                            <li><strong>주택담보대출 한도:</strong> 담보가치(LTV)와 소득기준(DSR) 중 어떤 규제가 대출을 제한하는지 실시간 분석합니다.</li>
                            <li><strong>퇴직금 및 구직급여:</strong> 1일 평균임금 기반 법정 퇴직금과 고용보험 비과세 실업급여 총수령액을 동시 비교합니다.</li>
                        </ul>
                    </div>
                </div>
            `
        }
    ];

    for (const page of pages) {
        const canonical = `https://veranex.app/${page.route}`;
        const prerenderBody = `
            <div class="min-h-screen bg-slate-50 font-sans">
                <header class="bg-white border-b border-gray-200 py-4 px-6">
                    <div class="max-w-5xl mx-auto flex items-center justify-between">
                        <a href="/" class="text-2xl font-black text-amber-600">VERA</a>
                        <nav class="flex gap-4 text-sm font-medium text-gray-600">
                            <a href="/" class="hover:text-amber-600">홈</a>
                            <a href="/finance" class="hover:text-amber-600">금융</a>
                            <a href="/finance/util" class="text-amber-600 font-bold">금융Util</a>
                            <a href="/guides" class="hover:text-amber-600">지식 가이드</a>
                        </nav>
                    </div>
                </header>
                <main class="max-w-5xl mx-auto px-4 py-12">
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">${page.heading}</h1>
                    <div class="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm leading-relaxed text-gray-800">
                        ${page.content}
                    </div>
                </main>
                <footer class="bg-white border-t border-gray-200 py-8 px-6 text-center text-xs text-gray-500">
                    <p>© 2026 VERA - All rights reserved.</p>
                </footer>
            </div>
        `;

        const html = replaceMetaTags(template, {
            title: page.title,
            description: page.description,
            canonical,
            ogType: 'website',
            jsonLd: page.faqJson,
            bodyHtml: prerenderBody
        });

        writeHtmlFile(path.resolve(distDir, `${page.route}/index.html`), html);
    }
}

function replaceMetaTags(template, { title, description, canonical, ogType, jsonLd, bodyHtml }) {
    let result = template;

    // Title
    result = result.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

    // Meta Description
    result = result.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${description}"`);

    // Canonical Link
    result = result.replace(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${canonical}"`);

    // Open Graph
    result = result.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${title}"`);
    result = result.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${description}"`);
    result = result.replace(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${canonical}"`);
    result = result.replace(/<meta property="og:type" content="[^"]*"/i, `<meta property="og:type" content="${ogType}"`);

    // Twitter
    result = result.replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${title}"`);
    result = result.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${description}"`);

    // Append JSON-LD if provided
    if (jsonLd) {
        const jsonLdTag = `\n  <script type="application/ld+json">\n  ${JSON.stringify(jsonLd, null, 2)}\n  </script>`;
        result = result.replace('</head>', `${jsonLdTag}\n</head>`);
    }

    // Insert Prerendered HTML inside <div id="root">
    result = result.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

    return result;
}

prerender().catch(err => {
    console.error('❌ Prerendering failed:', err);
    process.exit(1);
});
