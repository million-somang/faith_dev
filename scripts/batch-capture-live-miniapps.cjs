const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const UPLOAD_DIRS = [
    path.resolve(__dirname, '../public/uploads/marketing/screenshots'),
    path.resolve(__dirname, '../apps/api-server/public/uploads/marketing/screenshots')
];

for (const dir of UPLOAD_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveImages(slug, aliases, buffers) {
    const allNames = Array.from(new Set([slug, ...aliases]));
    for (const name of allNames) {
        for (let i = 0; i < 3; i++) {
            const buf = buffers[i] || buffers[0];
            if (!buf) continue;
            const step = i + 1;
            const files = [
                `${name}_step${step}.png`,
                `${name}_key${step}.png`
            ];
            if (step === 1) files.push(`${name}.png`);

            for (const fn of files) {
                for (const dir of UPLOAD_DIRS) {
                    fs.writeFileSync(path.join(dir, fn), buf);
                }
            }
        }
    }
}

// 딜레이 헬퍼
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function captureApp(browser, appMeta) {
    const { slug, aliases = [], url, interactions } = appMeta;
    console.log(`\n========================================`);
    console.log(`[Capture Start] ${slug} -> ${url}`);
    console.log(`========================================`);

    const page = await browser.newPage();
    const buffers = [];

    try {
        await page.setViewport({
            width: 430,
            height: 860,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });

        // alert/confirm 무조건 자동 승인
        page.on('dialog', async d => { try { await d.dismiss(); } catch (e) {} });

        // 리액트 인풋 트리거 헬퍼 주입
        await page.evaluateOnNewDocument(() => {
            window.alert = () => {};
            window.confirm = () => true;
            window.setReactVal = (el, val) => {
                if (!el) return;
                const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, 'value');
                if (desc && desc.set) desc.set.call(el, val);
                else el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
        });

        // 1. 페이지 접속
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
        
        // 스플래시 및 로딩 인트로 대기 (최대 4초)
        await page.waitForFunction(() => {
            const loader = document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"], .loading-container');
            return !loader || loader.offsetWidth === 0;
        }, { timeout: 6000 }).catch(() => {});
        await sleep(1500);

        // [1단계: 진입 실화면 캡처]
        console.log(`  📸 [Step 1: Entry] Capturing initial loaded screen...`);
        const shot1 = await page.screenshot({ type: 'png' });
        buffers.push(shot1);

        // 2. 조작 단계 (Action) 실행
        console.log(`  ⚡ [Step 2: Action] Performing user interactions...`);
        if (interactions && interactions.action) {
            await page.evaluate(interactions.action).catch(err => console.warn(`    ⚠️ action error:`, err.message));
        } else {
            // 표준 data-screenshot-* 감지
            await page.evaluate(() => {
                const inp = document.querySelector('[data-screenshot-input]');
                if (inp && window.setReactVal) {
                    window.setReactVal(inp, inp.getAttribute('data-screenshot-input') || '100');
                }
                const btn = document.querySelector('[data-screenshot-click="action"]');
                if (btn) btn.click();
            }).catch(() => {});
        }
        await sleep(1200);

        // [2단계: 조작 실화면 캡처]
        const shot2 = await page.screenshot({ type: 'png' });
        buffers.push(shot2);

        // 3. 결과 단계 (Result) 실행
        console.log(`  🎯 [Step 3: Result] Triggering calculation & results...`);
        if (interactions && interactions.result) {
            await page.evaluate(interactions.result).catch(err => console.warn(`    ⚠️ result error:`, err.message));
        } else {
            // 표준 data-screenshot-* 감지
            await page.evaluate(() => {
                const resBtn = document.querySelector('[data-screenshot-click="result"]');
                if (resBtn) resBtn.click();
                const resPoint = document.querySelector('[data-screenshot-point="result"]');
                if (resPoint) resPoint.scrollIntoView({ behavior: 'instant', block: 'start' });
            }).catch(() => {});
        }
        await sleep(1500);

        // [3단계: 결과 실화면 캡처]
        const shot3 = await page.screenshot({ type: 'png' });
        buffers.push(shot3);

        // 저장
        saveImages(slug, aliases, buffers);
        console.log(`  ✅ [Saved] 3 real screenshots saved for ${slug} (${aliases.join(', ')})`);
    } catch (err) {
        console.error(`  ❌ Failed capturing ${slug}:`, err.message);
    } finally {
        await page.close().catch(() => {});
    }
}

const APPS_TO_CAPTURE = [
    {
        slug: 'saju',
        aliases: ['lotto'],
        url: 'https://veranex.app/app/saju/',
        interactions: {
            action: () => {
                // 생년월일 폼에 샘플 입력 및 오행/궁합 버튼 조작
                const nameInp = document.querySelector('input[placeholder*="이름"]') || document.querySelector('input[type="text"]');
                if (nameInp && window.setReactVal) window.setReactVal(nameInp, '홍길동');
                // 남성/여성 라디오 또는 성별 칩
                const maleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('남'));
                if (maleBtn) maleBtn.click();
            },
            result: () => {
                // 사주 분석 또는 결과 버튼 클릭
                const submitBtn = Array.from(document.querySelectorAll('button')).find(b => 
                    b.textContent && (b.textContent.includes('사주') || b.textContent.includes('분석') || b.textContent.includes('결과') || b.textContent.includes('보기'))
                );
                if (submitBtn) submitBtn.click();
            }
        }
    },
    {
        slug: 'calculator',
        aliases: ['calculator'],
        url: 'https://veranex.app/app/calculator/',
        interactions: {
            action: () => {
                // 7 * 8 입력
                const clickText = (txt) => {
                    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === txt);
                    if (btn) btn.click();
                };
                clickText('7');
                clickText('×') || clickText('*');
                clickText('8');
            },
            result: () => {
                // = 버튼 클릭
                const eqBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === '=');
                if (eqBtn) eqBtn.click();
            }
        }
    },
    {
        slug: 'webp-converter',
        aliases: ['webp'],
        url: 'https://veranex.app/app/webp-converter/',
        interactions: {
            action: () => {
                // 샘플 이미지 로드
                const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('샘플'));
                if (sampleBtn) sampleBtn.click();
            },
            result: () => {
                // WebP 변환 실행
                const convertBtn = document.querySelector('[data-screenshot-click="result"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('변환'));
                if (convertBtn) convertBtn.click();
            }
        }
    },
    {
        slug: 'dday-calc',
        aliases: ['dday'],
        url: 'https://veranex.app/app/dday-calc/',
        interactions: {
            action: () => {
                const chips = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('100일') || b.textContent.includes('시험') || b.textContent.includes('기념일') || b.textContent.includes('추가')));
                if (chips) chips.click();
            },
            result: () => {
                const card = document.querySelector('.card, [data-screenshot-point="result"]') || document.querySelector('button');
                if (card) card.click();
            }
        }
    },
    {
        slug: 'interest-calc',
        aliases: ['interest'],
        url: 'https://veranex.app/app/interest-calc/',
        interactions: {
            action: () => {
                const numInp = document.querySelector('input[type="number"]') || document.querySelector('input');
                if (numInp && window.setReactVal) window.setReactVal(numInp, '10000000');
                const rateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('적금'));
                if (rateBtn) rateBtn.click();
            },
            result: () => {
                const calcBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('계산') || b.textContent.includes('결과')));
                if (calcBtn) calcBtn.click();
            }
        }
    },
    {
        slug: 'severance-calc',
        aliases: ['salary', 'severance'],
        url: 'https://veranex.app/app/severance-calc/',
        interactions: {
            action: () => {
                const numInp = document.querySelector('input[placeholder*="급여"]') || document.querySelector('input[type="number"]');
                if (numInp && window.setReactVal) window.setReactVal(numInp, '3500000');
            },
            result: () => {
                const calcBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('퇴직금') || b.textContent.includes('계산')));
                if (calcBtn) calcBtn.click();
            }
        }
    },
    {
        slug: 'customs-calc',
        aliases: ['customs'],
        url: 'https://veranex.app/app/customs-calc/',
        interactions: {
            action: () => {
                const usdInp = document.querySelector('input[placeholder*="$"]') || document.querySelector('input[type="number"]');
                if (usdInp && window.setReactVal) window.setReactVal(usdInp, '250');
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('계산') || b.textContent.includes('조회')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'text-checker',
        aliases: ['text'],
        url: 'https://veranex.app/app/text-checker/',
        interactions: {
            action: () => {
                const ta = document.querySelector('textarea');
                if (ta && window.setReactVal) {
                    window.setReactVal(ta, '안녕하세요. 베라넥스 글자수 세기 및 맞춤법 검사기 테스트 실화면입니다. 다양한 글자와 줄바꿈을 지원합니다.');
                }
            },
            result: () => {
                const chkBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('검사') || b.textContent.includes('맞춤법')));
                if (chkBtn) chkBtn.click();
            }
        }
    },
    {
        slug: 'pyeong-calc',
        aliases: ['pyeong'],
        url: 'https://veranex.app/app/pyeong-calc/',
        interactions: {
            action: () => {
                const btn84 = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('84'));
                if (btn84) btn84.click();
            },
            result: () => {
                const btn34 = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('34'));
                if (btn34) btn34.click();
            }
        }
    },
    {
        slug: 'base64-converter',
        aliases: ['base64'],
        url: 'https://veranex.app/app/base64-converter/',
        interactions: {
            action: () => {
                const smp = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('샘플'));
                if (smp) smp.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('인코딩') || b.textContent.includes('변환')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'json-formatter',
        aliases: ['json'],
        url: 'https://veranex.app/app/json-formatter/',
        interactions: {
            action: () => {
                const smp = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('샘플'));
                if (smp) smp.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('정렬') || b.textContent.includes('포맷')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'svg-converter',
        aliases: ['svg'],
        url: 'https://veranex.app/app/svg-converter/',
        interactions: {
            action: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('샘플') || b.textContent.includes('컬러')));
                if (btn) btn.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('변환') || b.textContent.includes('SVG')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'age-calc',
        aliases: ['age'],
        url: 'https://veranex.app/app/age-calc/',
        interactions: {
            action: () => {
                const dateInp = document.querySelector('input[type="date"]');
                if (dateInp && window.setReactVal) window.setReactVal(dateInp, '1998-08-25');
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('계산') || b.textContent.includes('확인')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'ocr',
        aliases: ['ocr'],
        url: 'https://veranex.app/app/ocr/',
        interactions: {
            action: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('샘플') || b.textContent.includes('테스트')));
                if (btn) btn.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('추출') || b.textContent.includes('인식')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: '2048',
        aliases: ['game-2048'],
        url: 'https://veranex.app/app/2048/',
        interactions: {
            action: () => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            },
            result: () => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            }
        }
    },
    {
        slug: 'sudoku',
        aliases: ['sudoku'],
        url: 'https://veranex.app/app/sudoku/',
        interactions: {
            action: () => {
                const cell = document.querySelector('.sudoku-cell, td, [data-row]');
                if (cell) cell.click();
                const key = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === '5');
                if (key) key.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('힌트') || b.textContent.includes('메모') || b.textContent.includes('새 게임')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'minesweeper',
        aliases: ['minesweeper'],
        url: 'https://veranex.app/app/minesweeper/',
        interactions: {
            action: () => {
                const cells = Array.from(document.querySelectorAll('button, div[data-x]'));
                const mid = cells[Math.floor(cells.length / 2)];
                if (mid) mid.click();
            },
            result: () => {
                const cells = Array.from(document.querySelectorAll('button, div[data-x]'));
                if (cells[0]) cells[0].click();
            }
        }
    },
    {
        slug: 'baseball',
        aliases: ['baseball'],
        url: 'https://veranex.app/app/baseball/',
        interactions: {
            action: () => {
                const clickNum = (n) => {
                    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === String(n));
                    if (btn) btn.click();
                };
                clickNum(1); clickNum(2); clickNum(3);
            },
            result: () => {
                const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('투구') || b.textContent.includes('확인') || b.textContent.includes('입력')));
                if (submitBtn) submitBtn.click();
            }
        }
    },
    {
        slug: 'omok',
        aliases: ['omok'],
        url: 'https://veranex.app/app/omok/',
        interactions: {
            action: () => {
                // 보드 중앙 근처 클릭
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const evt = new MouseEvent('click', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, bubbles: true });
                    canvas.dispatchEvent(evt);
                }
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('무르기') || b.textContent.includes('새 대국') || b.textContent.includes('AI 대전')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'freecell',
        aliases: ['freecell'],
        url: 'https://veranex.app/app/freecell/',
        interactions: {
            action: () => {
                const card = document.querySelector('.card, [data-card]');
                if (card) card.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('힌트') || b.textContent.includes('실행취소') || b.textContent.includes('새 게임')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'janggi',
        aliases: ['janggi'],
        url: 'https://veranex.app/app/janggi/',
        interactions: {
            action: () => {
                const piece = document.querySelector('.piece, [data-piece]');
                if (piece) piece.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('새 대국') || b.textContent.includes('기보') || b.textContent.includes('AI')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'vera-pop',
        aliases: ['vera-pop'],
        url: 'https://veranex.app/app/vera-pop/',
        interactions: {
            action: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('시작') || b.textContent.includes('PLAY')));
                if (btn) btn.click();
            },
            result: () => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    canvas.dispatchEvent(new MouseEvent('click', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height * 0.3, bubbles: true }));
                }
            }
        }
    },
    {
        slug: 'novel',
        aliases: ['novel'],
        url: 'https://veranex.app/app/novel/',
        interactions: {
            action: () => {
                const item = document.querySelector('a[href*="chapter"], .novel-card, [data-novel]');
                if (item) item.click();
            },
            result: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('다음') || b.textContent.includes('서재') || b.textContent.includes('북마크')));
                if (btn) btn.click();
            }
        }
    },
    {
        slug: 'comboy',
        aliases: ['comboy'],
        url: 'https://veranex.app/app/comboy/',
        interactions: {
            action: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('게임') || b.textContent.includes('SELECT') || b.textContent.includes('START')));
                if (btn) btn.click();
            },
            result: () => {
                const canvas = document.querySelector('canvas');
                if (canvas) canvas.click();
            }
        }
    },
    {
        slug: 'sfc',
        aliases: ['sfc'],
        url: 'https://veranex.app/app/sfc/',
        interactions: {
            action: () => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('게임') || b.textContent.includes('SELECT') || b.textContent.includes('START')));
                if (btn) btn.click();
            },
            result: () => {
                const canvas = document.querySelector('canvas');
                if (canvas) canvas.click();
            }
        }
    }
];

async function main() {
    console.log('[Puppeteer] Launching headless browser for REAL SCREENSHOTS...');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    let successCount = 0;
    for (const app of APPS_TO_CAPTURE) {
        try {
            await captureApp(browser, app);
            successCount++;
        } catch (e) {
            console.error(`Error processing ${app.slug}:`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 [COMPLETE] Successfully captured real live screenshots for ${successCount}/${APPS_TO_CAPTURE.length} mini apps!`);
}

main().catch(err => {
    console.error('Fatal batch capture error:', err);
    process.exit(1);
});
