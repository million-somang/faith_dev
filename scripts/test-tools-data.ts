import { TOOLS_DATA, getToolBySlug, ToolDetailItem } from '../apps/main-portal/src/data/toolsData';

const EXPECTED_SLUGS = [
    'severance-calc',
    'age-calc',
    'pyeong-calc',
    'interest-calc',
    'dday-calc',
    'customs-calc',
    'text-checker',
    'calculator',
    'json-formatter',
    'ocr',
    'base64-converter',
    'svg-converter',
    'finance-dsr',
];

const VALID_CATEGORIES = ['calc', 'finance', 'text', 'dev'];

console.log('--- Starting verification of toolsData.ts ---');

let hasError = false;

// 1. Verify total count
if (!Array.isArray(TOOLS_DATA)) {
    console.error('FAIL: TOOLS_DATA is not an array');
    process.exit(1);
}

if (TOOLS_DATA.length !== EXPECTED_SLUGS.length) {
    console.error(`FAIL: Expected ${EXPECTED_SLUGS.length} tools, but found ${TOOLS_DATA.length}`);
    hasError = true;
}

// 2. Verify all expected slugs are present
const actualSlugs = new Set(TOOLS_DATA.map(t => t.slug));
for (const slug of EXPECTED_SLUGS) {
    if (!actualSlugs.has(slug)) {
        console.error(`FAIL: Missing tool slug: "${slug}"`);
        hasError = true;
    }
}

// 3. Detailed validation per tool
for (const tool of TOOLS_DATA) {
    const prefix = `[${tool.slug || 'UNKNOWN'}]`;

    if (!EXPECTED_SLUGS.includes(tool.slug)) {
        console.error(`${prefix} FAIL: Unexpected slug "${tool.slug}"`);
        hasError = true;
    }

    if (!tool.name || tool.name.trim().length < 2) {
        console.error(`${prefix} FAIL: Invalid name`);
        hasError = true;
    }

    if (!tool.title || !tool.title.includes('VERA')) {
        console.error(`${prefix} FAIL: Title must include "VERA" brand (got "${tool.title}")`);
        hasError = true;
    }

    if (!tool.description || tool.description.trim().length < 20) {
        console.error(`${prefix} FAIL: Description must be at least 20 chars`);
        hasError = true;
    }

    if (!Array.isArray(tool.keywords) || tool.keywords.length < 3) {
        console.error(`${prefix} FAIL: Keywords must have at least 3 items`);
        hasError = true;
    }

    if (!VALID_CATEGORIES.includes(tool.category)) {
        console.error(`${prefix} FAIL: Invalid category "${tool.category}"`);
        hasError = true;
    }

    if (!tool.categoryLabel || tool.categoryLabel.trim().length === 0) {
        console.error(`${prefix} FAIL: Empty categoryLabel`);
        hasError = true;
    }

    if (!tool.icon || !tool.icon.startsWith('fa')) {
        console.error(`${prefix} FAIL: Invalid FontAwesome icon "${tool.icon}"`);
        hasError = true;
    }

    if (!tool.iconBg || !tool.iconColor) {
        console.error(`${prefix} FAIL: Missing iconBg or iconColor`);
        hasError = true;
    }

    // AEO directAnswer verification
    if (!tool.directAnswer || tool.directAnswer.trim().length < 30) {
        console.error(`${prefix} FAIL: directAnswer must be at least 30 chars (AEO requirement)`);
        hasError = true;
    }

    // Formula verification
    if (!tool.formula || !tool.formula.title || !tool.formula.expression || !tool.formula.explanation) {
        console.error(`${prefix} FAIL: Incomplete formula object`);
        hasError = true;
    } else if (!Array.isArray(tool.formula.variables) || tool.formula.variables.length === 0) {
        console.error(`${prefix} FAIL: Formula variables must contain at least 1 variable`);
        hasError = true;
    }

    // Example verification
    if (!tool.example || !tool.example.scenario || !tool.example.calculation || !tool.example.result) {
        console.error(`${prefix} FAIL: Incomplete example object (scenario, calculation, result required)`);
        hasError = true;
    }

    // HowToSteps verification
    if (!Array.isArray(tool.howToSteps) || tool.howToSteps.length < 3) {
        console.error(`${prefix} FAIL: howToSteps must have at least 3 steps`);
        hasError = true;
    } else {
        for (let i = 0; i < tool.howToSteps.length; i++) {
            const step = tool.howToSteps[i];
            if (!step.name || !step.text) {
                console.error(`${prefix} FAIL: Step ${i + 1} missing name or text`);
                hasError = true;
            }
        }
    }

    // FAQs verification
    if (!Array.isArray(tool.faqs) || tool.faqs.length < 2) {
        console.error(`${prefix} FAIL: faqs must have at least 2 questions`);
        hasError = true;
    } else {
        for (let i = 0; i < tool.faqs.length; i++) {
            const faq = tool.faqs[i];
            if (!faq.question || !faq.question.includes('?')) {
                console.error(`${prefix} FAIL: FAQ ${i + 1} question must include '?'`);
                hasError = true;
            }
            if (!faq.answer || faq.answer.trim().length < 15) {
                console.error(`${prefix} FAIL: FAQ ${i + 1} answer too short (< 15 chars)`);
                hasError = true;
            }
        }
    }

    // AppUrl verification
    if (!tool.appUrl || !tool.appUrl.startsWith('/')) {
        console.error(`${prefix} FAIL: appUrl must start with '/'`);
        hasError = true;
    }

    // getToolBySlug lookup test
    const retrieved = getToolBySlug(tool.slug);
    if (!retrieved || retrieved.slug !== tool.slug) {
        console.error(`${prefix} FAIL: getToolBySlug(${tool.slug}) lookup failed`);
        hasError = true;
    }
}

if (hasError) {
    console.error('--- Verification FAILED ---');
    process.exit(1);
} else {
    console.log(`--- Verification PASSED: All ${TOOLS_DATA.length} tools are completely defined & valid! ---`);
    process.exit(0);
}
