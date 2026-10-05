export default function Guide2048Tab() {
    const guides = [
        {
            icon: 'fa-anchor',
            color: 'text-rose-600 bg-rose-50 border-rose-200',
            title: '1. 코너 락 (Corner Lock) 절대 원칙',
            desc: '가장 큰 숫자의 타일(예: 512, 1024)을 보드의 네 모서리 중 한 곳(추천: 좌측 하단)에 절대 움직이지 않도록 고정하는 것이 승리의 제1원칙입니다. 모서리가 흔들리는 순간 작은 숫자 타일들이 안쪽으로 끼어들어 블록 이동이 마비됩니다.'
        },
        {
            icon: 'fa-worm',
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            title: '2. 스네이크 (Snake) 내림차순 지그재그 배치',
            desc: '모서리의 최댓값 타일부터 시작하여 바로 옆 칸에 그 다음으로 큰 숫자를 지그재그 방향으로 내림차순 정렬하세요(예: 1024 - 512 - 256 - 128). 이렇게 하면 작은 타일들이 단계별로 합쳐지며 도미노처럼 연쇄 결합하여 초대형 타일이 탄생합니다.'
        },
        {
            icon: 'fa-ban',
            color: 'text-purple-600 bg-purple-50 border-purple-200',
            title: '3. 3방향 통제: 절대로 누르지 말아야 할 금기의 방향키',
            desc: '가장 큰 타일을 아래쪽에 모았다면, 위쪽 방향키(↑)는 절대로 누르지 않는 3방향(좌, 우, 하) 통제 원칙을 엄수하세요. 위로 미는 순간 모서리에 고정해 둔 대형 타일이 위로 밀려나고 그 아래에 2가 생성되어 게임이 급격히 불리해집니다.'
        },
        {
            icon: 'fa-rotate-left',
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            title: '4. 되돌리기 (Undo) 활용 및 위기 탈출법',
            desc: '의도치 않게 모서리가 풀렸거나 엉뚱한 방향키를 눌렀다면 당황하지 말고 우측 상단의 되돌리기(Undo) 버튼을 눌러 직전 상태로 복원하세요. 3회의 기회를 전략적으로 분배하는 것이 2048 타일 완성의 열쇠입니다.'
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                        2048 수학적 슬라이드 공략 가이드
                    </h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    단순한 무작위 밀기가 아닌 연역적 기하학 정렬 원리를 익히면 2048 타일을 넘어 4096, 8192 타일까지 안정적으로 달성할 수 있습니다.
                </p>
            </div>

            <div className="space-y-2.5">
                {guides.map((g, idx) => (
                    <article
                        key={idx}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0 ${g.color}`}>
                                <i className={`fas ${g.icon}`}></i>
                            </div>
                            <h3 className="text-xs font-black text-slate-800">
                                {g.title}
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed pl-9">
                            {g.desc}
                        </p>
                    </article>
                ))}
            </div>

            <div className="p-3 bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl border border-rose-100 text-center">
                <span className="text-[11px] font-bold text-rose-800">
                    💡 코너 락과 3방향 통제를 유지하면 클리어 확률이 95% 이상으로 상승합니다!
                </span>
            </div>
        </div>
    );
}
