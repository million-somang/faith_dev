import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

export default function PrivacyPolicyPage() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO
                title="개인정보처리방침 - VERA (베라)"
                description="VERA 포털의 개인정보처리방침, 쿠키 및 Google AdSense 광고 식별자 수집 안내입니다."
                path="/privacy"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">개인정보처리방침</h1>
                    <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                        최종 수정일: 2026년 8월 10일
                    </p>

                    <div className="prose prose-slate max-w-none text-slate-700 space-y-8 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">1. 개인정보의 수집 및 이용 목적</h2>
                            <p>
                                VERA(이하 "회사" 또는 "포털")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수하고 있습니다. 본 방침은 포털이 수집하는 개인정보 항목과 수집 목적, 수집된 개인정보의 보유 및 이용 기간을 이용자에게 안내하기 위해 작성되었습니다.
                            </p>
                        </section>

                        <section className="bg-blue-50/70 border border-blue-100 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <i className="fas fa-shield-alt text-blue-600"></i>
                                2. 쿠키(Cookie) 및 맞춤형 광고(Google AdSense) 관련 안내 [필수]
                            </h2>
                            <p className="text-slate-700 mb-4">
                                본 웹사이트는 이용자에게 개별적인 맞춤 서비스를 제공하고, 타겟팅 광고를 게재하기 위해 <strong>쿠키(Cookie)</strong> 및 기타 인터넷 기술을 사용합니다.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-700">
                                <li>
                                    <strong>제3자 광고 제공업체 서비스 이용</strong>: 구글(Google LLC)을 포함한 제3자 제공업체는 웹사이트 방문자의 이전 방문 기록을 바탕으로 광고를 게재합니다.
                                </li>
                                <li>
                                    <strong>Google 광고 쿠키(DART 쿠키) 사용</strong>: 구글 및 그 파트너는 쿠키를 통해 본 사이트 및 인터넷상의 다른 사이트 방문을 기반으로 맞춤형 광고를 제공합니다.
                                </li>
                                <li>
                                    <strong>맞춤형 광고 수집 거부(Opt-Out) 방법</strong>: 이용자는 구글 광고 설정 페이지(<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">https://www.google.com/settings/ads</a>)에 방문하여 맞춤형 광고 설정을 해제할 수 있습니다. 또한, <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">www.aboutads.info</a>를 방문하여 제3자 제공업체의 맞춤형 광고 쿠키 사용을 차단할 수 있습니다.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">3. 수집하는 개인정보 항목 및 수집 방법</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>회원 가입 시</strong>: 이메일 주소, 비밀번호, 닉네임</li>
                                <li><strong>서비스 이용 과정에서 자동 수집되는 정보</strong>: IP 주소, 쿠키, 방문 일시, 기기 정보, 브라우저 유형, 서비스 이용 기록</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">4. 개인정보의 보유 및 이용 기간</h2>
                            <p>
                                원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 지정된 기간 동안 보관합니다.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-slate-600">
                                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
                                <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">5. 이용자의 권리와 그 행사 방법</h2>
                            <p>
                                이용자는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있으며, 마이페이지 또는 개인정보 보호책임자 이메일을 통해 요청하실 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">6. 개인정보 보호책임자 및 문의처</h2>
                            <p>
                                이용자의 개인정보 관련 문의 및 불만 처리를 위해 아래와 같이 담당 부서를 운영하고 있습니다.
                            </p>
                            <div className="bg-slate-100 rounded-xl p-4 mt-3 text-sm">
                                <p><strong>개인정보 보호 담당자</strong>: VERA 관리팀</p>
                                <p><strong>이메일 문의</strong>: contact@veranex.app / sukman@naver.com</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
