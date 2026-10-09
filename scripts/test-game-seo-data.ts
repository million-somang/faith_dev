import {
    GAMES_SEO_DATA,
    getGameSeoItem,
    getAllGameSeoItems,
    GameSeoItem,
    GameSeoKey,
} from '../apps/main-portal/src/data/gamesSeoData';

const EXPECTED_KEYS: GameSeoKey[] = [
    'janggi',
    'omok',
    'baseball',
    '2048',
    'sudoku',
    'minesweeper',
    'freecell',
    'vera-pop',
];

const EXPECTED_GUIDE_SLUGS: Partial<Record<GameSeoKey, string>> = {
    '2048': '2048-tile-puzzle-strategy-corner-method',
    sudoku: 'sudoku-advanced-solving-techniques-naked-single-to-x-wing',
    minesweeper: 'minesweeper-probability-and-pattern-strategy',
    freecell: 'freecell-solitaire-winning-formula-and-space-utilization',
};

console.log('--- Starting verification of gamesSeoData.ts ---');

let hasError = false;

// 1. Verify object existence
if (!GAMES_SEO_DATA || typeof GAMES_SEO_DATA !== 'object') {
    console.error('FAIL: GAMES_SEO_DATA is not an object');
    process.exit(1);
}

const actualKeys = Object.keys(GAMES_SEO_DATA);
console.log(`Found ${actualKeys.length} game SEO topics: ${actualKeys.join(', ')}`);

if (actualKeys.length !== EXPECTED_KEYS.length) {
    console.error(`FAIL: Expected ${EXPECTED_KEYS.length} topics, but found ${actualKeys.length}`);
    hasError = true;
}

// 2. Verify all expected keys exist
for (const key of EXPECTED_KEYS) {
    if (!GAMES_SEO_DATA[key]) {
        console.error(`FAIL: Missing game SEO key: "${key}"`);
        hasError = true;
    }
}

// 3. Detailed validation per game topic
for (const key of EXPECTED_KEYS) {
    const item = GAMES_SEO_DATA[key];
    const prefix = `[${key}]`;

    if (!item) {
        continue;
    }

    if (item.key !== key) {
        console.error(`${prefix} FAIL: item.key ("${item.key}") does not match map key ("${key}")`);
        hasError = true;
    }

    if (!item.title || item.title.trim().length < 10) {
        console.error(`${prefix} FAIL: title is missing or too short (< 10 chars)`);
        hasError = true;
    }

    if (!item.title.includes('VERA') && !item.title.includes('베라')) {
        console.error(`${prefix} FAIL: title should mention VERA brand`);
        hasError = true;
    }

    if (!item.shortTitle || item.shortTitle.trim().length < 2) {
        console.error(`${prefix} FAIL: shortTitle is missing or too short`);
        hasError = true;
    }

    if (!item.genre || item.genre.trim().length < 2) {
        console.error(`${prefix} FAIL: genre is missing or too short`);
        hasError = true;
    }

    if (!item.description || item.description.trim().length < 30) {
        console.error(`${prefix} FAIL: description must be at least 30 chars`);
        hasError = true;
    }

    if (!Array.isArray(item.keywords) || item.keywords.length < 5) {
        console.error(`${prefix} FAIL: keywords must have at least 5 items (got ${item.keywords?.length || 0})`);
        hasError = true;
    } else {
        for (const kw of item.keywords) {
            if (!kw || typeof kw !== 'string' || kw.trim().length === 0) {
                console.error(`${prefix} FAIL: empty keyword string found`);
                hasError = true;
            }
        }
    }

    // AEO directAnswer verification (> 50 chars required)
    if (!item.directAnswer || item.directAnswer.trim().length <= 50) {
        console.error(`${prefix} FAIL: directAnswer must be > 50 chars (got ${item.directAnswer?.trim().length || 0})`);
        hasError = true;
    }

    // StrategyRules verification
    if (!item.strategyRules) {
        console.error(`${prefix} FAIL: strategyRules object is missing`);
        hasError = true;
    } else {
        if (!item.strategyRules.title || item.strategyRules.title.trim().length === 0) {
            console.error(`${prefix} FAIL: strategyRules.title is missing`);
            hasError = true;
        }
        if (!item.strategyRules.formulaOrPrinciple || item.strategyRules.formulaOrPrinciple.trim().length < 15) {
            console.error(`${prefix} FAIL: strategyRules.formulaOrPrinciple missing or too short (< 15 chars)`);
            hasError = true;
        }
        if (!item.strategyRules.description || item.strategyRules.description.trim().length < 30) {
            console.error(`${prefix} FAIL: strategyRules.description missing or too short (< 30 chars)`);
            hasError = true;
        }
        if (!Array.isArray(item.strategyRules.tactics) || item.strategyRules.tactics.length < 3) {
            console.error(`${prefix} FAIL: strategyRules.tactics must have at least 3 tactics (got ${item.strategyRules.tactics?.length || 0})`);
            hasError = true;
        } else {
            for (let i = 0; i < item.strategyRules.tactics.length; i++) {
                const tac = item.strategyRules.tactics[i];
                if (!tac.name || tac.name.trim().length === 0) {
                    console.error(`${prefix} FAIL: strategyRules.tactics[${i}].name is empty`);
                    hasError = true;
                }
                if (!tac.desc || tac.desc.trim().length < 15) {
                    console.error(`${prefix} FAIL: strategyRules.tactics[${i}].desc is missing or too short (< 15 chars)`);
                    hasError = true;
                }
            }
        }
    }

    // HowToSteps verification (exactly 3 steps)
    if (!Array.isArray(item.howToSteps) || item.howToSteps.length !== 3) {
        console.error(`${prefix} FAIL: howToSteps must have exactly 3 steps (got ${item.howToSteps?.length || 0})`);
        hasError = true;
    } else {
        for (let i = 0; i < item.howToSteps.length; i++) {
            const step = item.howToSteps[i];
            if (!step.name || step.name.trim().length === 0 || !step.text || step.text.trim().length < 15) {
                console.error(`${prefix} FAIL: howToSteps[${i}] missing name or text (< 15 chars)`);
                hasError = true;
            }
        }
    }

    // FAQs verification (at least 3 items, brief specifies 4 for all 8 games)
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
            if (!faq.answer || faq.answer.trim().length < 25) {
                console.error(`${prefix} FAIL: faqs[${i}].answer missing or too short (< 25 chars)`);
                hasError = true;
            }
        }
    }

    // relatedGuideSlug verification
    const expectedGuide = EXPECTED_GUIDE_SLUGS[key];
    if (expectedGuide) {
        if (item.relatedGuideSlug !== expectedGuide) {
            console.error(`${prefix} FAIL: expected relatedGuideSlug "${expectedGuide}", got "${item.relatedGuideSlug}"`);
            hasError = true;
        }
    } else {
        if (item.relatedGuideSlug !== undefined) {
            console.error(`${prefix} FAIL: expected relatedGuideSlug to be undefined, got "${item.relatedGuideSlug}"`);
            hasError = true;
        }
    }

    // Anti-placeholder check
    const serialized = JSON.stringify(item);
    const placeholderRegex = /\b(TODO|TBD|lorem ipsum|placeholder|임시텍스트)\b/i;
    if (placeholderRegex.test(serialized)) {
        console.error(`${prefix} FAIL: detected placeholder text in item`);
        hasError = true;
    }

    // getGameSeoItem lookup test
    const retrieved = getGameSeoItem(key);
    if (!retrieved || retrieved.key !== key) {
        console.error(`${prefix} FAIL: getGameSeoItem("${key}") lookup failed`);
        hasError = true;
    }
}

// 4. Test invalid key lookup
const invalidItem = getGameSeoItem('non-existent-game');
if (invalidItem !== undefined) {
    console.error('FAIL: getGameSeoItem("non-existent-game") should return undefined');
    hasError = true;
}

// 5. Test getAllGameSeoItems
const allItems = getAllGameSeoItems();
if (!Array.isArray(allItems) || allItems.length !== EXPECTED_KEYS.length) {
    console.error(`FAIL: getAllGameSeoItems() returned ${allItems?.length || 0} items, expected ${EXPECTED_KEYS.length}`);
    hasError = true;
}

if (hasError) {
    console.error('--- Game SEO Data Verification FAILED ---');
    process.exit(1);
} else {
    console.log(`--- Game SEO Data Verification PASSED: All ${EXPECTED_KEYS.length} games validated successfully! ---`);
    process.exit(0);
}
