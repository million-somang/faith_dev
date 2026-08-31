export function CoreServicesShowcase() {
    return (
        <section className="mb-12 space-y-6">
            {/* 섹션 타이틀 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>🌟</span>
                        <span>VERA 핵심 서비스</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        로그인 없이 브라우저에서 즉시 이용 가능한 생활도구, 미니게임, 사주명리 서비스입니다.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <i className="fas fa-bolt text-amber-500"></i> 무설치 즉시 실행
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <i className="fas fa-check-circle text-emerald-500"></i> 100% 무료
                    </span>
                </div>
            </div>

            {/* 3대 대형 카드 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. 🛠️ 스마트 생활도구 (Utility) 카드 */}
                <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                    <div>
                        {/* 카드 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                <i className="fas fa-screwdriver-wrench"></i>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                                UTILITY
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                            스마트 생활도구
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            복잡한 계산과 서식을 단 몇 초 만에! 일상과 금융, 부동산에 꼭 필요한 필수 계산 도구 모음입니다.
                        </p>

                        {/* 도구 링크 리스트 */}
                        <div className="space-y-2.5">
                            <a
                                href="/lifestyle"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-ruler-combined"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-emerald-900">
                                            부동산 평수 ↔ ㎡ 변환기
                                        </div>
                                        <div className="text-[10px] text-slate-400">아파트 공급·전용면적 자동 환산</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-emerald-600 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>

                            <a
                                href="/lifestyle"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-cake-candles"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-emerald-900">
                                            만 나이 통일법 계산기
                                        </div>
                                        <div className="text-[10px] text-slate-400">생년월일 기준 정확한 법적 만 나이</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-emerald-600 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>

                            <a
                                href="/finance/util"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-calculator"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-emerald-900">
                                            금융 · 복리이자 & DSR 계산기
                                        </div>
                                        <div className="text-[10px] text-slate-400">대출 상환 원리금 및 미국 배당세율</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-emerald-600 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>

                            <a
                                href="/lifestyle"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-calendar-day"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-emerald-900">
                                            D-Day & 기념일 계산기
                                        </div>
                                        <div className="text-[10px] text-slate-400">시험, 기념일, 전역일 카운트다운</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-emerald-600 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>
                        </div>
                    </div>

                    {/* 카드 푸터 버튼 */}
                    <a
                        href="/lifestyle"
                        className="mt-6 w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <span>생활도구 전체 모아보기</span>
                        <i className="fas fa-arrow-right text-[10px]"></i>
                    </a>
                </div>

                {/* 2. 🎮 미니게임 천국 (Games) 카드 */}
                <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                    <div>
                        {/* 카드 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                <i className="fas fa-gamepad"></i>
                            </div>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full">
                                ARCADE & PUZZLE
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                            미니게임 센터
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            설치 없이 웹에서 바로 즐기는 클래식 명작 퍼즐과 아케이드 게임! 점수를 기록하고 두뇌를 트레이닝하세요.
                        </p>

                        {/* 게임 링크 리스트 */}
                        <div className="space-y-2.5">
                            <a
                                href="/game/tetris"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-cubes"></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                                                테트리스 마스터 (Tetris)
                                            </span>
                                            <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded">
                                                HIT 🔥
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">정통 7-Bag 시스템 & 라인 클리어</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-lg group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                    플레이
                                </span>
                            </a>

                            <a
                                href="/game/2048"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-table-cells-large"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                                            2048 넘버 퍼즐
                                        </div>
                                        <div className="text-[10px] text-slate-400">숫자 타일을 합쳐 2048 블록 완성</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-lg group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                    플레이
                                </span>
                            </a>

                            <a
                                href="/game/sudoku"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-chess-board"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                                            일일 두뇌 스도쿠
                                        </div>
                                        <div className="text-[10px] text-slate-400">초급부터 고급까지 논리 숫자 퍼즐</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-lg group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                    플레이
                                </span>
                            </a>

                            <a
                                href="/game"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-trophy"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-900">
                                            지뢰찾기 & 프리셀 솔리테어
                                        </div>
                                        <div className="text-[10px] text-slate-400">추억의 윈도우 명작 게임</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-indigo-600 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>
                        </div>
                    </div>

                    {/* 카드 푸터 버튼 */}
                    <a
                        href="/game"
                        className="mt-6 w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <span>게임 센터 바로가기</span>
                        <i className="fas fa-arrow-right text-[10px]"></i>
                    </a>
                </div>

                {/* 3. 🔮 재미 & 사주 풀이 (Entertainment) 카드 */}
                <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                    <div>
                        {/* 카드 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                <i className="fas fa-yin-yang"></i>
                            </div>
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full">
                                SAJU & NOVEL
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-800 transition-colors">
                            재미 · 사주명리
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            AI 과장 없이 사람이 빚어낸 단아한 정통 만세력 분석! 8글자 오행 분포, 궁합, 12시진 바이오리듬과 웹소설 창작소입니다.
                        </p>

                        {/* 사주/재미 링크 리스트 */}
                        <div className="space-y-2.5">
                            <a
                                href="/entertainment/saju"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-amber-800 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-scroll"></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                                                베라 정통 만세력 Pro
                                            </span>
                                            <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.2 rounded">
                                                NEW ✨
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">사주 8글자 · 5각형 오행 레이더 차트</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg group-hover/item:bg-amber-800 group-hover/item:text-white transition-all">
                                    보기
                                </span>
                            </a>

                            <a
                                href="/entertainment/saju"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-amber-800 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-heart-pulse"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                                            2인 정밀 사주 궁합
                                        </div>
                                        <div className="text-[10px] text-slate-400">일주 천간합 · 지지 삼합 & 신살 조화</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg group-hover/item:bg-amber-800 group-hover/item:text-white transition-all">
                                    보기
                                </span>
                            </a>

                            <a
                                href="/entertainment/saju"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-amber-800 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                                            오늘의 12시진 바이오리듬
                                        </div>
                                        <div className="text-[10px] text-slate-400">자시~해시 시간대별 길흉 & 행운 컬러</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-amber-700 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>

                            <a
                                href="/novel"
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white text-amber-800 flex items-center justify-center text-sm shadow-sm">
                                        <i className="fas fa-book-journal-whills"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover/item:text-amber-900">
                                            AI 웹소설 & 스토리 창작소
                                        </div>
                                        <div className="text-[10px] text-slate-400">회빙환 트렌드 소설 및 스토리 감상</div>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-xs text-slate-300 group-hover/item:text-amber-700 group-hover/item:translate-x-0.5 transition-all"></i>
                            </a>
                        </div>
                    </div>

                    {/* 카드 푸터 버튼 */}
                    <a
                        href="/entertainment/saju"
                        className="mt-6 w-full py-3 px-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <span>사주 & 재미 서비스 열기</span>
                        <i className="fas fa-arrow-right text-[10px]"></i>
                    </a>
                </div>

            </div>
        </section>
    );
}
