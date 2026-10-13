import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

export default function NewsWritePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [category, setCategory] = useState('fun');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [source, setSource] = useState('VERA 펀뉴스');
    const [aiSummary, setAiSummary] = useState('');
    const [sentiment, setSentiment] = useState('positive');
    const [keywords, setKeywords] = useState('재미, 화제, 유머');
    const [apiKey, setApiKey] = useState('vera-news-api-key-2026');

    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('기사 제목을 입력해 주세요.');
            return;
        }
        if (!content.trim() && !summary.trim()) {
            alert('기사 본문 또는 요약 내용을 입력해 주세요.');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setSuccessData(null);

        const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);

        const payload = {
            category,
            title: title.trim(),
            content: content.trim(),
            summary: summary.trim(),
            imageUrl: imageUrl.trim(),
            sourceUrl: sourceUrl.trim(),
            source: source.trim(),
            aiSummary: aiSummary.trim(),
            sentiment,
            keywords: keywordArray
        };

        try {
            const res = await axios.post('/api/news/create', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey.trim()
                }
            });

            if (res.data.success) {
                setSuccessData(res.data);
            } else {
                setErrorMessage(res.data.error?.message || '뉴스 등록에 실패했습니다.');
            }
        } catch (err: any) {
            console.error('[News Write Error]', err);
            const msg = err.response?.data?.error?.message || err.message || '서버 통신 오류가 발생했습니다.';
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <PageSEO
                title="뉴스 기사 등록 웹 폼 - VERA"
                description="VERA 포털 뉴스 기사를 쉽고 빠르게 등록할 수 있는 웹 폼 페이지입니다."
                path="/news/write"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                        <span className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md">
                            <i className="fas fa-pen-nib text-xl"></i>
                        </span>
                        뉴스 기사 쉽게 작성 / 등록하기
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">
                        어려운 수동 복사/붙여넣기 없이 아래 양식에 제목과 내용을 입력하고 클릭 한 번으로 간편하게 뉴스를 올려보세요!
                    </p>
                </div>

                {successData && (
                    <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-3xl shadow-lg animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0">
                                <i className="fas fa-check"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-emerald-900 mb-1">🎉 뉴스가 성공적으로 등록되었습니다!</h3>
                                <p className="text-emerald-700 text-sm mb-4 font-medium">
                                    기사 ID: #{successData.article?.id} | 카테고리: {successData.article?.category}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate(`/news/${successData.article?.id}`)}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                                    >
                                        <span>🔗 등록된 기사 바로 보러가기</span>
                                        <i className="fas fa-arrow-right text-xs"></i>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSuccessData(null);
                                            setTitle('');
                                            setContent('');
                                            setSummary('');
                                            setImageUrl('');
                                        }}
                                        className="px-5 py-3 bg-white border border-emerald-300 text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors"
                                    >
                                        ➕ 새 기사 계속 작성하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-8 p-5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-3">
                        <i className="fas fa-exclamation-circle text-rose-600 text-xl shrink-0"></i>
                        <span>등록 오류: {errorMessage}</span>
                    </div>
                )}

                <Card className="p-6 sm:p-10 shadow-xl border-gray-100 rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. 카테고리 선택 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                📌 카테고리 선택 (Category)
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                                <option value="fun">🎈 재미있는 뉴스 (fun)</option>
                                <option value="general">📰 일반 (general)</option>
                                <option value="politics">🏛️ 정치 (politics)</option>
                                <option value="economy">📈 경제 (economy)</option>
                                <option value="tech">💻 IT/과학 (tech)</option>
                                <option value="sports">⚽ 스포츠 (sports)</option>
                                <option value="entertainment">🎬 엔터 (entertainment)</option>
                                <option value="stock">📊 주식 (stock)</option>
                            </select>
                        </div>

                        {/* 2. 기사 제목 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                ✏️ 기사 제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="예: [재미있는 뉴스] 세상에서 가장 독특한 반려견 대화법"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        {/* 3. 기사 본문 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                📝 기사 본문 내용 (HTML 태그 지원) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="기사 본문 내용을 자유롭게 입력하세요 (HTML <p> 태그 포함 가능)"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                            />
                        </div>

                        {/* 4. 기사 요약 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                💡 기사 짧은 요약문 (선택)
                            </label>
                            <input
                                type="text"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="미입력 시 본문 160자가 자동으로 요약문으로 지정됩니다."
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* 5. 썸네일 이미지 URL */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    🖼️ 대표 이미지 URL (선택)
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>

                            {/* 6. 원문 링크 URL */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    🔗 원문 출처 주소 (선택)
                                </label>
                                <input
                                    type="url"
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="https://veranex.app"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {/* 7. 출처/언론사명 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    🏢 출처 / 언론사명
                                </label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="VERA 펀뉴스"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>

                            {/* 8. 감정 분석 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    😃 감정 평가 (Sentiment)
                                </label>
                                <select
                                    value={sentiment}
                                    onChange={(e) => setSentiment(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="positive">긍정 / 호재 (positive)</option>
                                    <option value="neutral">중립 (neutral)</option>
                                    <option value="negative">부정 / 악재 (negative)</option>
                                </select>
                            </div>

                            {/* 9. 키워드 태그 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    🏷️ 키워드 태그 (콤마 구분)
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="재미, 강아지, 유머"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* 10. AI 3줄 요약 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                🤖 AI 3줄 요약 (선택)
                            </label>
                            <textarea
                                rows={3}
                                value={aiSummary}
                                onChange={(e) => setAiSummary(e.target.value)}
                                placeholder="1. 요약 첫 번째 줄&#10;2. 요약 두 번째 줄&#10;3. 요약 세 번째 줄"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        {/* 11. API KEY 인증 (기본 채워짐) */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                🔒 API 보안 인증키 (자동 채워짐)
                            </label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 outline-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-lg rounded-2xl shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>뉴스를 서버에 등록하는 중...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane text-xl"></i>
                                    <span>🚀 뉴스 기사 작성 / 등록 완료하기</span>
                                </>
                            )}
                        </button>
                    </form>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
