import React from 'react';

export const HowToGuide: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700">
      {/* 4단계 이용 방법 가이드 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-indigo-600"></i>
          이미지 리사이즈 4단계 이용 가이드
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              1
            </span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">이미지 업로드 또는 샘플 불러오기</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                파일 드롭 영역으로 이미지를 드래그하거나 클릭하여 선택하세요. 빠른 테스트를 위해 '샘플 이미지 불러오기' 버튼을 사용할 수도 있습니다. (최대 50장, 장당 30MB)
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              2
            </span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">리사이즈 방식 및 크기 설정</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                픽셀(px), 백분율(%), 긴 변 기준, 목표 용량(KB) 중 원하는 단위를 선택하고, 네이버 블로그/유튜브/인스타 등 원클릭 SNS 프리셋을 적용하세요.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              3
            </span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">고급 포맷 & 화질 최적화</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                차세대 WebP 포맷 또는 원본/JPEG/PNG를 선택하고, 압축 품질 슬라이더(10~100%)와 파일명 접미사를 원하는 대로 설정할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              4
            </span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">일괄 변환 & 다운로드</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                '리사이즈 시작'을 누르면 즉시 초고속 변환이 진행되며, 개별 다운로드 또는 'ZIP 일괄 다운로드'로 한 번에 압축 저장할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 맞춤 방식 (Fit Mode) 상세 안내 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-crop-simple text-indigo-600"></i>
          이미지 맞춤 방식 (Fit Mode) 비교
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-crop"></i>
              중앙 크롭 (Cover)
            </div>
            <p className="text-slate-600 leading-relaxed">
              지정한 해상도를 빈 공간 없이 꽉 채우도록 중앙을 기준으로 남는 부분을 잘라냅니다. 블로그 썸네일, 유튜브 커버 등 여백 없이 꽉 찬 이미지가 필요할 때 권장합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-maximize"></i>
              비율 유지 (Contain)
            </div>
            <p className="text-slate-600 leading-relaxed">
              원본의 가로/세로 비율을 그대로 유지하면서 지정한 상자 안에 온전히 들어가도록 리사이즈합니다. 이미지의 어떤 부분도 잘리지 않아야 할 때 적합합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-up-right-and-down-left-from-center"></i>
              강제 맞춤 (Stretch)
            </div>
            <p className="text-slate-600 leading-relaxed">
              비율을 무시하고 지정된 가로와 세로 길이에 맞춰 강제로 늘리거나 줄입니다. 고정 픽셀 규격의 배너 제작 시 필요에 따라 활용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 개인정보 및 보안 안내 */}
      <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/70 flex items-start gap-3.5">
        <i className="fa-solid fa-shield-halved text-emerald-600 text-xl mt-0.5"></i>
        <div className="text-xs text-emerald-950 space-y-1">
          <h4 className="font-bold text-emerald-900 text-sm">100% 클라이언트 사이드 보안 처리</h4>
          <p className="text-emerald-800 leading-relaxed">
            모든 이미지 크기 변경, 압축 및 ZIP 파일 생성 작업은 사용자의 브라우저(HTML5 Canvas & WebAssembly) 내부 메모리에서만 이루어집니다. 이미지가 서버로 전송되거나 저장되지 않으므로 민감한 사진도 안심하고 처리하세요.
          </p>
        </div>
      </div>
    </div>
  );
};
