import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 이용약관',
  description: 'VERA 라이프 포털 서비스 이용 조건 및 회원과 회사의 권리와 의무에 관한 약관입니다.',
  alternates: {
    canonical: 'https://veranex.app/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 mb-2">서비스 이용약관</h1>
        <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
          시행일: 2026년 8월 10일
        </p>

        <div className="prose prose-slate max-w-none text-slate-700 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 VERA(이하 &quot;회사&quot;)가 제공하는 인터넷 관련 포털 서비스(이하 &quot;서비스&quot;)를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제2조 (용어의 정의)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>&quot;서비스&quot;</strong>란 회사가 제공하는 지식 가이드, 생활 계산기 유틸리티, 미니게임, 금융 시세 정보 등 모든 서비스를 의미합니다.</li>
              <li><strong>&quot;이용자&quot;</strong>란 웹사이트에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 이용자를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제3조 (약관의 게시와 개정)</h2>
            <p>
              회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면 하단에 게시합니다. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제4조 (서비스의 제공 및 변경)</h2>
            <p>
              회사는 이용자에게 지식 칼럼, 웹 미니게임, 생활 유틸리티 도구, 금융 지표 등의 콘텐츠를 무료로 제공합니다. 서비스의 내용이나 시스템 점검이 필요한 경우 사전 또는 사후에 이를 공지하고 일시적으로 서비스를 변경하거나 중단할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제5조 (저작권의 귀속 및 이용제한)</h2>
            <p>
              회사가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 회사에 귀속합니다. 이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">제6조 (면책 조항)</h2>
            <p>
              회사는 천재지변, 서비스 점검, 제3자 통신망 장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 대한 책임이 면제됩니다. 또한, 서비스 내에서 제공되는 금융 시세, 계산기 연산 결과 등은 참고용이며, 투자 결과나 계산 결과에 대해 회사는 법적 책임을 지지 않습니다.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
          >
            홈으로 이동
          </Link>
          <Link
            href="/privacy"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </main>
  );
}
