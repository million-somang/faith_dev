import React, { useState } from 'react';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

export default function ContactUsPage() {
    const { user, logout } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !message) {
            alert('이름, 이메일, 문의 내용을 입력해 주세요.');
            return;
        }
        setSubmitted(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO
                title="문의하기 - VERA (베라)"
                description="VERA 서비스 이용 문의, 제휴 제안, 오류 제보 및 고객 지원 센터입니다."
                path="/contact"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">문의하기 (Contact Us)</h1>
                    <p className="text-slate-500 text-sm mb-8 border-b border-slate-100 pb-4">
                        VERA 서비스 이용 중 궁금한 점이나 제휴 및 제보 사항이 있으시면 언제든지 문의해 주세요.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6 md:col-span-1">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                                <i className="fas fa-envelope text-blue-600 text-xl mb-2"></i>
                                <h3 className="font-bold text-slate-800 text-sm">대표 이메일</h3>
                                <p className="text-xs text-slate-600 font-mono mt-1">contact@veranex.app</p>
                                <p className="text-xs text-slate-600 font-mono">sukman@naver.com</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                                <i className="fas fa-clock text-blue-600 text-xl mb-2"></i>
                                <h3 className="font-bold text-slate-800 text-sm">운영 시간</h3>
                                <p className="text-xs text-slate-600 mt-1">월~금: 09:00 ~ 18:00</p>
                                <p className="text-xs text-slate-400">주말 및 공휴일 휴무 (이메일 24시간 접수)</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                                <i className="fas fa-handshake text-blue-600 text-xl mb-2"></i>
                                <h3 className="font-bold text-slate-800 text-sm">제휴 및 광고 문의</h3>
                                <p className="text-xs text-slate-600 mt-1">비즈니스 제휴 및 포털 서비스 광고 연동 문의</p>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            {submitted ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                                    <i className="fas fa-paper-plane text-4xl text-emerald-500 mb-4"></i>
                                    <h3 className="text-xl font-bold text-emerald-900 mb-2">문의가 성공적으로 접수되었습니다!</h3>
                                    <p className="text-sm text-emerald-700 mb-6">
                                        보내주신 의견을 신속하게 검토한 후 입력하신 이메일({email})로 회신해 드리겠습니다.
                                    </p>
                                    <button
                                        onClick={() => { setSubmitted(false); setMessage(''); setSubject(''); }}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                                    >
                                        추가 문의하기
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">성함 / 닉네임 *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="홍길동"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">회신받으실 이메일 *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="example@domain.com"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">문의 제목</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="제휴 문의 / 제보 / 서비스 의견"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">문의 내용 *</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={5}
                                            placeholder="문의 내용을 상세히 작성해 주세요."
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-paper-plane"></i> 문의 보내기
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
