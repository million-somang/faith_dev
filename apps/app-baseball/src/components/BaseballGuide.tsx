import React from 'react';
import { HelpCircle, Shield, Flame, Trophy, Award, CheckCircle2, XCircle } from 'lucide-react';

export const BaseballGuide: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-3 py-1 text-slate-700">
      {/* 타이틀 배너 */}
      <div className="p-3 bg-[#f0f4f8] rounded-2xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] border border-white/60 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800">베라 숫자야구 가이드 &amp; 룰 북</h3>
          <p className="text-[10px] text-slate-500">9회말 끝내기 승리를 위한 기본 규칙과 랭킹 산정 기준</p>
        </div>
      </div>

      {/* 1. 기본 게임 룰 */}
      <div className="bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] border border-white/60 space-y-2">
        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
          <span className="text-emerald-500">⚾</span> 1. 경기 룰 및 투구 판정
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          상대 투수가 숨긴 <strong>서로 다른 3자리 숫자 (0~9)</strong>를 9회말 이닝 종료 전에 추리해내는 게임입니다.
        </p>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[11px] font-black text-amber-700">STRIKE</div>
            <div className="text-[10px] text-amber-600 mt-0.5">숫자와 자리 모두 일치</div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <div className="text-[11px] font-black text-blue-700">BALL</div>
            <div className="text-[10px] text-blue-600 mt-0.5">숫자는 맞으나 자리 다름</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-[11px] font-black text-rose-700">OUT</div>
            <div className="text-[10px] text-rose-600 mt-0.5">일치하는 숫자 0개</div>
          </div>
        </div>
      </div>

      {/* 2. 승리 등급 및 배지 */}
      <div className="bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] border border-white/60 space-y-2">
        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
          <Award className="w-4 h-4 text-amber-500" />
          <span>2. 승리 등급 및 특별 배지</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-100">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <Shield className="w-3.5 h-3.5" />
              완봉승 (Shutout)
            </span>
            <span className="text-[10px] font-bold text-slate-500">1~3이닝 이내 적중 👑</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-100">
            <span className="flex items-center gap-1.5 font-bold text-blue-700">
              <Flame className="w-3.5 h-3.5" />
              퀄리티 스타트 (QS)
            </span>
            <span className="text-[10px] font-bold text-slate-500">4~6이닝 이내 적중 🔥</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-100">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              ⚾ 정규 승리
            </span>
            <span className="text-[10px] font-bold text-slate-500">7~9이닝 적중</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="flex items-center gap-1.5 font-bold text-rose-700">
              ❌ 패배 (패전)
            </span>
            <span className="text-[10px] font-bold text-rose-500">9이닝 초과 미적중</span>
          </div>
        </div>
      </div>

      {/* 3. 랭킹 산정 기준 */}
      <div className="bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] border border-white/60 space-y-2">
        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>3. 정규 시즌 랭킹 알고리즘</span>
        </div>
        <p className="text-[11px] text-slate-600">
          동점자 발생 시 아래 순서로 엄격하게 우선순위를 판정합니다:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 font-medium pl-1">
          <li><strong>1순위: 승률 (%)</strong> (승수 / 총 경기수 × 100)</li>
          <li><strong>2순위: 다승 (Wins)</strong> 총 승리 횟수</li>
          <li><strong>3순위: 평균 소모 이닝 (ERA)</strong> 낮을수록 빠른 추론력 인정</li>
        </ol>
      </div>

      {/* 4. 회원 / 비회원 정책 비교 */}
      <div className="bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] border border-white/60 space-y-2">
        <div className="text-xs font-black text-slate-800">4. 회원 vs 비회원 혜택 비교</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200">
            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
              <XCircle className="w-3 h-3 text-slate-400" />
              비회원 (Guest)
            </div>
            <ul className="space-y-0.5 text-slate-500">
              <li>• 베라 마린스 구단명 고정</li>
              <li>• 세션 종료 시 전적 리셋</li>
              <li>• 랭킹전 참여 불가</li>
            </ul>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200">
            <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              로그인 회원 (Member)
            </div>
            <ul className="space-y-0.5 text-indigo-700 font-medium">
              <li>• 나만의 구단명 자유 지정</li>
              <li>• 영구 전적 클라우드 보존</li>
              <li>• 주간 Top 10 리워드 포인트</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
