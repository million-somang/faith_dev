import React from 'react';

export const HowToGuide: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700">
      {/* 4단계 이용 방법 가이드 */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE6DD] shadow-sm">
        <h3 className="text-lg font-black text-[#2D2A26] mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-indigo-600"></i>
          이미지 업스케일 &amp; 포맷 변환기 4단계 이용 가이드
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              1
            </span>
            <div>
              <h4 className="font-bold text-sm text-[#2D2A26] mb-1">이미지 업로드 또는 샘플 테스트</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                최대 50장(장당 30MB)까지 이미지를 끌어다 놓거나 선택하세요. 바로 테스트해 보고 싶다면 ‘저해상도(320×180) 업스케일 테스트 샘플 불러오기’ 버튼으로 즉시 체험할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              2
            </span>
            <div>
              <h4 className="font-bold text-sm text-[#2D2A26] mb-1">CSR 업스케일 엔진 &amp; 배율 선택</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                AI 초해상도(ESRGAN 2×·3×·4×)와 초고속 정밀 보간(Lanczos-3) 중 작업 목적에 맞는 엔진을 고르고, FHD/4K 및 엣지 선명화(자연스럽게/또렷하게) 옵션을 지정하세요.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              3
            </span>
            <div>
              <h4 className="font-bold text-sm text-[#2D2A26] mb-1">포맷 변환 · SNS 규격 · 용량 맞춤 병행</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                원본 유지, JPG, PNG(투명 배경 무손실 보존), WebP 포맷과 화질(70~95%)을 자유롭게 선택할 수 있으며, 필요 시 네이버 블로그·유튜브 규격이나 목표 KB 축소 모드도 전환 가능합니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              4
            </span>
            <div>
              <h4 className="font-bold text-sm text-[#2D2A26] mb-1">Before/After 비교 &amp; 일괄 저장</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                변환 완료 후 분할 슬라이더와 200% 픽셀 돋보기로 확대 선명도를 직접 비교한 뒤, 폴더 1회 선택 일괄 저장 또는 ZIP 압축 파일 1개로 저장하세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하이브리드 CSR 엔진 비교 안내 */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE6DD] shadow-sm">
        <h3 className="text-lg font-black text-[#2D2A26] mb-4 flex items-center gap-2">
          <i className="fa-solid fa-microchip text-indigo-600"></i>
          AI 초해상도(ESRGAN) vs 초고속 Lanczos-3 비교
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              AI 초해상도 (ESRGAN-Slim · 최대 4K)
            </div>
            <p className="text-stone-600 leading-relaxed">
              TensorFlow.js(WebGL2 GPU 가속 / CPU 자동 폴백)와 딥러닝 타일 분할 추론을 사용해 저해상도 사진·일러스트의 계단 현상(앨리어싱)을 줄이고 질감을 복원합니다. 브라우저 메모리 보호를 위해 긴 변 최대 4096px 안전 상한과 투명 PNG 알파 재합성을 지원합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-2">
            <div className="font-bold text-[#2D2A26] text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-bolt text-emerald-600"></i>
              초고속 정밀 보간 (Lanczos-3 · 최대 8K)
            </div>
            <p className="text-stone-600 leading-relaxed">
              별도 모델 다운로드 없이 전용 Web Worker 스레드에서 분리형 Lanczos-3(a=3) 리샘플링과 휘도(Y) 채널 적응형 언샤프 마스크를 실행합니다. 텍스트가 많은 스크린샷, 도표, 수십 장의 대량 사진 확대 시 가장 빠르고 왜곡 없는 결과를 제공합니다.
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
