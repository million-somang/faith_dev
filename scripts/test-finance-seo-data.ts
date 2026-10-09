import { FINANCE_SEO_DATA, getFinanceSeoItem, FinanceSeoItem } from '../apps/main-portal/src/data/financeSeoData';

const EXPECTED_KEYS: Array<FinanceSeoItem['key']> = [
    'dividend-tax',
    'mortgage-dsr',
    'severance-irp',
    'exchange-fee',
];

console.log('--- Starting verification of financeSeoData.ts ---');

let hasError = false;

// 1. Verify object existence
if (!FINANCE_SEO_DATA || typeof FINANCE_SEO_DATA !== 'object') {
    console.error('FAIL: FINANCE_SEO_DATA is not an object');
    process.exit(1);
}

const actualKeys = Object.keys(FINANCE_SEO_DATA);
console.log(`Found ${actualKeys.length} finance SEO topics: ${actualKeys.join(', ')}`);

if (actualKeys.length !== EXPECTED_KEYS.length) {
    console.error(`FAIL: Expected ${EXPECTED_KEYS.length} topics, but found ${actualKeys.length}`);
    hasError = true;
}

// 2. Verify all expected keys exist
for (const key of EXPECTED_KEYS) {
    if (!FINANCE_SEO_DATA[key]) {
        console.error(`FAIL: Missing finance SEO key: "${key}"`);
        hasError = true;
    }
}

// 3. Detailed validation per topic
for (const key of EXPECTED_KEYS) {
    const item = FINANCE_SEO_DATA[key];
    const prefix = `[${key}]`;

    if (!item) {
        continue;
    }

    if (item.key !== key) {
        console.error(`${prefix} FAIL: item.key ("${item.key}") does not match map key ("${key}")`);
        hasError = true;
    }

    if (!item.title || item.title.trim().length < 5) {
        console.error(`${prefix} FAIL: title is missing or too short`);
        hasError = true;
    }

    if (!item.shortTitle || item.shortTitle.trim().length < 2) {
        console.error(`${prefix} FAIL: shortTitle is missing or too short`);
        hasError = true;
    }

    if (!item.description || item.description.trim().length < 20) {
        console.error(`${prefix} FAIL: description must be at least 20 chars`);
        hasError = true;
    }

    if (!Array.isArray(item.keywords) || item.keywords.length < 3) {
        console.error(`${prefix} FAIL: keywords must have at least 3 items`);
        hasError = true;
    } else {
        for (const kw of item.keywords) {
            if (!kw || typeof kw !== 'string' || kw.trim().length === 0) {
                console.error(`${prefix} FAIL: empty keyword string found`);
                hasError = true;
            }
        }
    }

    // AEO directAnswer verification (> 60 chars required)
    if (!item.directAnswer || item.directAnswer.trim().length <= 60) {
        console.error(`${prefix} FAIL: directAnswer must be > 60 chars (got ${item.directAnswer?.trim().length || 0})`);
        hasError = true;
    }

    // Formula verification (title, expression, description, >= 2 variables)
    if (!item.formula) {
        console.error(`${prefix} FAIL: formula object is missing`);
        hasError = true;
    } else {
        if (!item.formula.title || item.formula.title.trim().length === 0) {
            console.error(`${prefix} FAIL: formula.title is missing`);
            hasError = true;
        }
        if (!item.formula.expression || item.formula.expression.trim().length === 0) {
            console.error(`${prefix} FAIL: formula.expression is missing`);
            hasError = true;
        }
        if (!item.formula.description || item.formula.description.trim().length === 0) {
            console.error(`${prefix} FAIL: formula.description is missing`);
            hasError = true;
        }
        if (!Array.isArray(item.formula.variables) || item.formula.variables.length < 2) {
            console.error(`${prefix} FAIL: formula.variables must have at least 2 variables (got ${item.formula.variables?.length || 0})`);
            hasError = true;
        } else {
            for (let i = 0; i < item.formula.variables.length; i++) {
                const v = item.formula.variables[i];
                if (!v.name || v.name.trim().length === 0 || !v.description || v.description.trim().length === 0) {
                    console.error(`${prefix} FAIL: formula.variables[${i}] missing name or description`);
                    hasError = true;
                }
            }
        }
    }

    // Example verification (scenario, calculation, result)
    if (!item.example) {
        console.error(`${prefix} FAIL: example object is missing`);
        hasError = true;
    } else {
        if (!item.example.scenario || item.example.scenario.trim().length === 0) {
            console.error(`${prefix} FAIL: example.scenario is missing`);
            hasError = true;
        }
        if (!item.example.calculation || item.example.calculation.trim().length === 0) {
            console.error(`${prefix} FAIL: example.calculation is missing`);
            hasError = true;
        }
        if (!item.example.result || item.example.result.trim().length === 0) {
            console.error(`${prefix} FAIL: example.result is missing`);
            hasError = true;
        }
    }

    // HowToSteps verification (exactly 3 steps)
    if (!Array.isArray(item.howToSteps) || item.howToSteps.length !== 3) {
        console.error(`${prefix} FAIL: howToSteps must have exactly 3 steps (got ${item.howToSteps?.length || 0})`);
        hasError = true;
    } else {
        for (let i = 0; i < item.howToSteps.length; i++) {
            const step = item.howToSteps[i];
            if (!step.name || step.name.trim().length === 0 || !step.text || step.text.trim().length === 0) {
                console.error(`${prefix} FAIL: howToSteps[${i}] missing name or text`);
                hasError = true;
            }
        }
    }

    // FAQs verification (at least 3 items with Q&A)
    if (!Array.isArray(item.faqs) || item.faqs.length < 3) {
        console.error(`${prefix} FAIL: faqs must have at least 3 items (got ${item.faqs?.length || 0})`);
        hasError = true;
    } else {
        for (let i = 0; i < item.faqs.length; i++) {
            const faq = item.faqs[i];
            if (!faq.question || !faq.question.includes('?')) {
                console.error(`${prefix} FAIL: faqs[${i}].question missing or does not include '?'`);
                hasError = true;
            }
            if (!faq.answer || faq.answer.trim().length < 20) {
                console.error(`${prefix} FAIL: faqs[${i}].answer missing or too short (< 20 chars)`);
                hasError = true;
            }
        }
    }

    // relatedGuideSlug verification
    if (!item.relatedGuideSlug || typeof item.relatedGuideSlug !== 'string' || item.relatedGuideSlug.trim().length === 0) {
        console.error(`${prefix} FAIL: relatedGuideSlug is missing or empty`);
        hasError = true;
    }

    // getFinanceSeoItem lookup test
    const retrieved = getFinanceSeoItem(key);
    if (!retrieved || retrieved.key !== key) {
        console.error(`${prefix} FAIL: getFinanceSeoItem("${key}") lookup failed`);
        hasError = true;
    }
}

// 4. Test invalid key lookup
const invalidItem = getFinanceSeoItem('invalid-topic-key');
if (invalidItem !== undefined) {
    console.error('FAIL: getFinanceSeoItem("invalid-topic-key") should return undefined');
    hasError = true;
}

if (hasError) {
    console.error('--- Finance SEO Data Verification FAILED ---');
    process.exit(1);
} else {
    console.log(`--- Finance SEO Data Verification PASSED: All ${EXPECTED_KEYS.length} topics validated successfully! ---`);
    process.exit(0);
}
