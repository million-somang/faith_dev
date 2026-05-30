import { useState, useEffect } from 'react';

declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';
import calcLogo from './assets/calc-logo.png';

import TabBar from './components/TabBar';
import BasicCalc from './components/BasicCalc';
import ScientificCalc from './components/ScientificCalc';
import LoanCalc from './components/LoanCalc';
import BmiCalc from './components/BmiCalc';
import AgeCalc from './components/AgeCalc';
import DateCalc from './components/DateCalc';
import UnitCalc from './components/UnitCalc';
import PercentCalc from './components/PercentCalc';

type PageTab = 'calculator' | 'howto' | 'faq';

function App() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [pageTab, setPageTab] = useState<PageTab>('calculator');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleGlobalMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
        const key = e.data.key;
        const callbackType = typeof document.parentKeyboardCallback;
        console.log('[APPGLOBAL] Forwarding key to document.parentKeyboardCallback:', key, '| Current callback type:', callbackType);
        if (typeof document.parentKeyboardCallback === 'function') {
          document.parentKeyboardCallback(key);
        } else {
          console.warn('[APPGLOBAL] Forwarding failed because parentKeyboardCallback is not a function. Current value:', document.parentKeyboardCallback);
        }
      }
    };
    window.addEventListener('message', handleGlobalMessage);
    return () => window.removeEventListener('message', handleGlobalMessage);
  }, []);

  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="loading-screen" role="status" aria-label="앱 로딩 중">
          {/* 로딩 본문 영역 */}
          <div className="loading-body">
            {/* 중앙 로고 아이콘 서클 */}
            <div className="loading-icon-wrapper">
              <img src={calcLogo} alt="스마트 다기능 계산기" className="loading-logo-img" />
            </div>

            {/* 타이틀 및 설명 */}
            <h1 className="loading-title">스마트 다기능 계산기</h1>
            <p className="loading-subtitle">기본 연산부터 대출, BMI, 단위 변환까지</p>

            {/* 로딩 스피너 도트 */}
            <div className="loading-spinner" aria-hidden="true">
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
            </div>

            {/* 하단 광고 배너 영역 */}
            <aside className="loading-ad-banner" aria-label="광고">
              <div className="ad-placeholder">
                <span className="ad-badge">AD</span>
                <span className="ad-text">광고 영역</span>
              </div>
            </aside>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <MiniAppLayout title="">
      <main className="calc-main-wrapper">

        {/* 최상단 페이지 탭: 스마트계산기 / 사용방법 / FAQ */}
        <nav className="page-tab-bar" role="tablist" aria-label="페이지 탭">
          <button
            role="tab"
            aria-selected={pageTab === 'calculator'}
            className={`page-tab-btn ${pageTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setPageTab('calculator')}
          >
            <i className="fas fa-calculator" aria-hidden="true"></i>
            스마트계산기
          </button>
          <button
            role="tab"
            aria-selected={pageTab === 'howto'}
            className={`page-tab-btn ${pageTab === 'howto' ? 'active' : ''}`}
            onClick={() => setPageTab('howto')}
          >
            <i className="fas fa-book-open" aria-hidden="true"></i>
            사용방법
          </button>
          <button
            role="tab"
            aria-selected={pageTab === 'faq'}
            className={`page-tab-btn ${pageTab === 'faq' ? 'active' : ''}`}
            onClick={() => setPageTab('faq')}
          >
            <i className="fas fa-question-circle" aria-hidden="true"></i>
            FAQ
          </button>
          <button
            className="page-tab-btn page-tab-share"
            onClick={() => {
              const showToast = (msg: string) => {
                setToast(msg);
                setTimeout(() => setToast(''), 2000);
              };

              // iframe 여부 판별
              const isInIframe = window.self !== window.top;

              // 공유 URL 구성: iframe 내부 URL이 아닌 실제 서비스 URL 사용
              let shareUrl: string;
              try {
                const parentOrigin = isInIframe
                  ? (document.referrer ? new URL(document.referrer).origin : window.location.origin)
                  : window.location.origin;
                shareUrl = `${parentOrigin}/app/calculator/`;
              } catch {
                shareUrl = window.location.href;
              }

              // textarea 기반 복사 (iframe 환경에서도 안정적으로 동작)
              const fallbackCopy = (text: string): boolean => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                let success = false;
                try {
                  success = document.execCommand('copy');
                } catch {
                  success = false;
                }
                document.body.removeChild(textarea);
                return success;
              };

              // 1순위: Web Share API (top-level 컨텍스트에서만, 주로 모바일)
              if (!isInIframe && navigator.share) {
                navigator.share({
                  title: '스마트 다기능 계산기',
                  text: '기본 연산부터 대출, BMI, 단위 변환까지',
                  url: shareUrl,
                }).catch(() => {});
                return;
              }

              // 2순위: Clipboard API (iframe에서는 권한 문제로 실패할 수 있음)
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(shareUrl)
                  .then(() => showToast('✅ 링크가 복사되었습니다!'))
                  .catch(() => {
                    // Clipboard API 실패 시 폴백
                    if (fallbackCopy(shareUrl)) {
                      showToast('✅ 링크가 복사되었습니다!');
                    } else {
                      showToast('📋 링크를 복사하지 못했습니다. 주소창에서 복사해주세요.');
                    }
                  });
                return;
              }

              // 최종 폴백: execCommand
              if (fallbackCopy(shareUrl)) {
                showToast('✅ 링크가 복사되었습니다!');
              } else {
                showToast('📋 링크를 복사하지 못했습니다. 주소창에서 복사해주세요.');
              }
            }}
            aria-label="공유하기"
          >
            <i className="fas fa-share-alt" aria-hidden="true"></i>
          </button>
        </nav>

        {/* 토스트 알림 */}
        {toast && (
          <div className="calc-toast">{toast}</div>
        )}

        {/* 탭 콘텐츠 */}
        {pageTab === 'calculator' && (
          <article className="calc-article">
            {/* 좌측 데코레이션 (PC only) */}
            <aside className="calc-hero-aside" aria-label="계산기 소개">
              <div className="hero-icon-box">
                <i className="fas fa-calculator" aria-hidden="true"></i>
              </div>
              <h1 className="hero-title">스마트 다기능 계산기</h1>
              <p className="hero-desc">
                기본 연산부터 대출, BMI, 단위 변환까지<br />일상의 모든 계산을 빠르고 정확하게.
              </p>
            </aside>

            {/* 모바일 H1 */}
            <h1 className="mobile-h1">스마트 다기능 계산기</h1>

            {/* 계산기 본체 */}
            <section className="calc-section" aria-label="계산기 도구">
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="calculator-content" role="region" aria-live="polite" aria-label="계산 결과 영역">
                {activeTab === 'basic' && <BasicCalc />}
                {activeTab === 'scientific' && <ScientificCalc />}
                {activeTab === 'loan' && <LoanCalc />}
                {activeTab === 'bmi' && <BmiCalc />}
                {activeTab === 'age' && <AgeCalc />}
                {activeTab === 'date' && <DateCalc />}
                {activeTab === 'unit' && <UnitCalc />}
                {activeTab === 'percent' && <PercentCalc />}
              </div>
            </section>
          </article>
        )}

        {pageTab === 'howto' && (
          <article className="info-article" role="tabpanel">
            <div className="info-card">
              <h2>📖 사용 방법 및 계산 공식</h2>
              <ol className="howto-list">
                <li><strong>탭 선택</strong> – 상단 탭에서 원하는 계산 종류(기본, 공학, 대출, BMI, 나이, 날짜, 단위, 백분율)를 선택합니다.</li>
                <li><strong>값 입력</strong> – 각 계산기에 맞는 값을 입력합니다. 기본 계산기는 화면 버튼으로, 나머지는 입력 필드로 값을 입력합니다.</li>
                <li><strong>계산 실행</strong> – '=' 버튼 또는 '계산하기' 버튼을 누르면 페이지 새로고침 없이 즉시 결과가 표시됩니다.</li>
                <li><strong>결과 확인</strong> – 계산 결과는 해당 영역에 즉시 표시되며, 필요에 따라 값을 수정하여 재계산할 수 있습니다.</li>
              </ol>

              <div className="aeo-formula-section">
                <h3>💵 대출 이자 계산 공식 (원리금 균등상환)</h3>
                <p className="formula-desc">매월 원금과 이자의 합계액을 균등하게 분할하여 상환하는 방식입니다. AI 답변 엔진이 보증하는 표준 계산식입니다.</p>
                <div className="formula-box">
                  <code>
                    월 상환액 = P × [ r(1 + r)ⁿ ] ÷ [ (1 + r)ⁿ - 1 ]
                  </code>
                </div>
                <ul className="formula-legend">
                  <li><strong>P (Principal)</strong>: 대출 원금</li>
                  <li><strong>r (Rate)</strong>: 월 이자율 (연 이자율 ÷ 12 ÷ 100)</li>
                  <li><strong>n (Number)</strong>: 총 상환 개월수 (대출 기간 × 12)</li>
                </ul>
              </div>

              <h3>🔢 지원하는 계산기 종류</h3>
              <div className="feature-grid">
                <div className="feature-item"><i className="fas fa-calculator" aria-hidden="true"></i><span>기본 계산기</span><p>사칙연산, 백분율 등 기본 계산</p></div>
                <div className="feature-item"><i className="fas fa-square-root-alt" aria-hidden="true"></i><span>공학 계산기</span><p>삼각함수, 로그, 제곱근 등</p></div>
                <div className="feature-item"><i className="fas fa-money-bill-wave" aria-hidden="true"></i><span>대출 계산기</span><p>월 상환액, 총 이자 계산</p></div>
                <div className="feature-item"><i className="fas fa-weight" aria-hidden="true"></i><span>BMI 계산기</span><p>체질량지수 및 비만 판정</p></div>
                <div className="feature-item"><i className="fas fa-birthday-cake" aria-hidden="true"></i><span>나이 계산기</span><p>만 나이, 다음 생일까지 D-day</p></div>
                <div className="feature-item"><i className="fas fa-calendar" aria-hidden="true"></i><span>날짜 계산기</span><p>날짜 차이, 날짜 더하기/빼기</p></div>
                <div className="feature-item"><i className="fas fa-exchange-alt" aria-hidden="true"></i><span>단위 변환</span><p>길이, 무게, 넓이, 부피, 온도</p></div>
                <div className="feature-item"><i className="fas fa-percent" aria-hidden="true"></i><span>백분율 계산기</span><p>비율, 증감률 계산</p></div>
              </div>
            </div>
          </article>
        )}

        {pageTab === 'faq' && (
          <article className="info-article" role="tabpanel">
            <div className="info-card">
              <h2>❓ 자주 묻는 질문 (FAQ)</h2>
              <div className="faq-list">
                <details open>
                  <summary>대출 이자는 어떻게 계산하나요?</summary>
                  <div className="faq-content">
                    <p>대출 금액, 연 이자율(%), 대출 기간(년)을 입력하면 <strong>원리금 균등상환 방식</strong>으로 월 상환액, 총 상환액, 총 이자를 자동으로 계산합니다. 원리금 균등상환은 매달 내는 금액이 일정하여 자금 계획을 세우기에 가장 안정적인 상환 방식입니다.</p>
                  </div>
                </details>
                <details open>
                  <summary>BMI(체질량지수) 판정 기준표는 어떻게 되나요?</summary>
                  <div className="faq-content">
                    <p>대한비만학회(KSSO)의 성인 비만 기준 공식 조견표는 다음과 같습니다. 비만 판정은 만 19세 이상 성인을 기준으로 적용됩니다.</p>
                    <div className="table-responsive">
                      <table className="aeo-table">
                        <thead>
                          <tr>
                            <th>구분</th>
                            <th>BMI 범위 (kg/m²)</th>
                            <th>판정 결과</th>
                            <th>질환 위험도</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>저체중</td>
                            <td>18.5 미만</td>
                            <td><span className="badge badge-blue">저체중</span></td>
                            <td>낮음</td>
                          </tr>
                          <tr className="highlight-row">
                            <td>정상체중</td>
                            <td>18.5 이상 ~ 23 미만</td>
                            <td><span className="badge badge-green">정상체중</span></td>
                            <td>보통</td>
                          </tr>
                          <tr>
                            <td>비만전단계</td>
                            <td>23 이상 ~ 25 미만</td>
                            <td><span className="badge badge-yellow">과체중</span></td>
                            <td>약간 높음</td>
                          </tr>
                          <tr>
                            <td>1단계 비만</td>
                            <td>25 이상 ~ 30 미만</td>
                            <td><span className="badge badge-orange-light">경도 비만</span></td>
                            <td>높음</td>
                          </tr>
                          <tr>
                            <td>2단계 비만</td>
                            <td>30 이상 ~ 35 미만</td>
                            <td><span className="badge badge-orange">중등도 비만</span></td>
                            <td>매우 높음</td>
                          </tr>
                          <tr>
                            <td>3단계 비만</td>
                            <td>35 이상</td>
                            <td><span className="badge badge-red">고도 비만</span></td>
                            <td>매우 위험</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
                <details>
                  <summary>만 나이와 연 나이, 한국식 나이의 차이가 무엇인가요?</summary>
                  <div className="faq-content">
                    <p>2023년 6월 법 개정으로 대한민국은 <strong>만 나이</strong> 통일을 원칙으로 삼고 있습니다.</p>
                    <ul>
                      <li><strong>만 나이</strong>: 출생 시 0세로 시작해 생일이 지날 때마다 1세씩 더하는 전 세계 표준 법적 나이입니다.</li>
                      <li><strong>연 나이</strong>: 현재 연도에서 출생 연도를 뺀 나이로, 병역법이나 청소년보호법 등 일부 법령에서 사용됩니다.</li>
                      <li><strong>한국식 세는 나이</strong>: 출생 시 1세로 시작해 매년 1월 1일이 될 때마다 1세씩 더하는 관습적 나이입니다.</li>
                    </ul>
                  </div>
                </details>
                <details>
                  <summary>단위 변환은 어떤 종류를 지원하나요?</summary>
                  <div className="faq-content">
                    <p><strong>길이</strong>(m, km, cm, inch, ft, mile 등), <strong>무게</strong>(kg, g, ton, lb 등), <strong>넓이</strong>(m², km², 평, 에이커 등), <strong>부피</strong>(리터, ml, gal 등), <strong>온도</strong>(섭씨, 화씨, 켈빈)의 총 5대 물리량을 상호 변환해 줍니다.</p>
                  </div>
                </details>
                <details>
                  <summary>공학 계산기에서는 어떤 수학 함수를 지원하나요?</summary>
                  <div className="faq-content">
                    <p>기본 사칙연산 외 삼각함수(sin, cos, tan), 역삼각함수, 제곱근(√), 거듭제곱(xʸ), 상용로그(log), 자연로그(ln), 팩토리얼(!), 원주율(π), 자연상수(e) 등 이공계 연산에 필수적인 핵심 수학 함수를 전면 지원합니다.</p>
                  </div>
                </details>
              </div>
            </div>
          </article>
        )}

        <footer className="calc-footer">
          <p>© 2026 FaithLink · 스마트 다기능 계산기 · 무료 온라인 유틸리티</p>
        </footer>
      </main>
    </MiniAppLayout>
  );
}

export default App;
