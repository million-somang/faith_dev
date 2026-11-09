import React from 'react';

export const SubmarineGuide: React.FC = () => {
  return (
    <article className="w-full max-w-[450px] md:max-w-2xl mx-auto space-y-4 p-1 text-[#2D2A26] select-text">
      {/* 1. 소개 섹션 */}
      <section className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <i className="fas fa-compass text-base"></i>
          <h2 className="text-sm sm:text-base font-black">
            추억의 모눈종이 좌표 해전, 베라 서브마린
          </h2>
        </div>
        <p className="text-xs text-[#5C564D] leading-relaxed">
          학창 시절 공책의 모눈종이에 10×10 격자를 그리고 몰래 항공모함과 잠수함을 배치한 뒤, 
          &ldquo;B-7!&rdquo;, &ldquo;D-4!&rdquo;를 외치며 상대방의 배를 찾아내던 추억의 두뇌 추리 게임입니다. 
          <strong>베라 서브마린 (Vera Submarine)</strong>은 1930년대 원형 좌표 해전 룰(Salvo)을 충실히 계승하여, 
          상대 함선에 직격탄을 명중시킬 때마다 즉시 연속 공격권을 얻어 빠르고 짜릿한 긴장감을 선사합니다.
        </p>
      </section>

      {/* 2. 함대 규격 */}
      <section className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-indigo-600">
          <i className="fas fa-ship text-base"></i>
          <h2 className="text-sm sm:text-base font-black">5종 정예 함대 제원 (총 17칸)</h2>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">1</span>
              <div>
                <div className="font-black text-[#2D2A26]">핵추진 항공모함 (Carrier)</div>
                <div className="text-[10px] text-[#8C8479]">길이 5칸 · 최대형 기함</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</span>
              <div>
                <div className="font-black text-[#2D2A26]">중장갑 전함 (Battleship)</div>
                <div className="text-[10px] text-[#8C8479]">길이 4칸 · 주력 결전함</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black">3</span>
              <div>
                <div className="font-black text-[#2D2A26]">유도탄 순양함 (Cruiser)</div>
                <div className="text-[10px] text-[#8C8479]">길이 3칸 · 원거리 포격함</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-xs bg-cyan-600" />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">4</span>
              <div>
                <div className="font-black text-[#2D2A26]">공격 잠수함 (Submarine)</div>
                <div className="text-[10px] text-[#8C8479]">길이 3칸 · 은밀 침투 잠수정</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black">5</span>
              <div>
                <div className="font-black text-[#2D2A26]">고속 구축함 (Destroyer)</div>
                <div className="text-[10px] text-[#8C8479]">길이 2칸 · 정찰 초계정</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-xs bg-amber-600" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 승리 전략 가이드 */}
      <section className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-indigo-600">
          <i className="fas fa-lightbulb text-base"></i>
          <h2 className="text-sm sm:text-base font-black">제독 필승 전략: 체커보드 패리티 추론법</h2>
        </div>
        <div className="space-y-2 text-xs text-[#5C564D] leading-relaxed">
          <p>
            <strong>1. 패리티 스캔(Parity Scan) 원리</strong>: 모든 함선은 최소 2칸 이상입니다. 체스판의 검은 칸처럼 
            <code>(행 + 열) % 2 === 0</code> 좌표만 골라 사격하면 격자 전체의 50%만 탐색하고도 해역 내의 모든 함선을 놓치지 않고 반드시 1회 이상 적중시킬 수 있습니다.
          </p>
          <p>
            <strong>2. 첫 명중 후 축 탐색(Axis Tracking)</strong>: 특정 좌표에 명중(Hit)했을 때는 즉시 상하좌우 인접 4칸을 탐색합니다. 
            두 번째 명중탄이 터지면 배가 놓인 방향(가로 or 세로)이 확정되므로, 그 축의 양 끝만 집중 타격하여 침몰시킬 때까지 연속 사격을 퍼부으세요.
          </p>
          <p>
            <strong>3. 소나 정찰(Sonar Recon)의 적시 활용</strong>: 게임당 1회 제공되는 3×3 소나 정찰은 가장 찾기 어려운 2칸짜리 구축함이나 3칸짜리 잠수함이 남았을 때 
            의심 구역 중앙에 사용하여 탐색 범위를 순식간에 좁힐 수 있습니다.
          </p>
        </div>
      </section>

      {/* 4. FAQ 자주 묻는 질문 */}
      <section className="bg-white rounded-2xl p-4 border border-[#EBE6DD] shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <i className="fas fa-circle-question text-base"></i>
          <h2 className="text-sm sm:text-base font-black">자주 묻는 질문 (FAQ)</h2>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-1">
            <div className="font-black text-[#2D2A26]">Q. 상대방의 배를 맞히면 왜 계속 쏠 수 있나요?</div>
            <p className="text-[#7A756D]">
              A. 1930년대 원조 좌표 해전(Salvo Rule) 규격을 적용하여, 명중 시 즉시 추가 사격권을 획득합니다. 실력 있는 제독은 한 번의 명중으로 적함을 단숨에 격침시킬 수 있습니다.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-1">
            <div className="font-black text-[#2D2A26]">Q. 모바일과 PC 화면에서 배치가 다른가요?</div>
            <p className="text-[#7A756D]">
              A. 모바일에서는 한 손 조작을 위한 세로 Zero-Scroll로 구동되며, 태블릿 및 PC 화면에서는 좌우 2열 대시보드로 자동 확장되어 아군 레이더와 적군 타겟 그리드를 한눈에 조망할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
};
