import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Header, Footer } from '@faithportal/ui';

const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [birthTime, setBirthTime] = useState('unknown');
    const [isSolar, setIsSolar] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        setLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const { data } = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
                name,
                email,
                password,
                phone,
                birthDate: birthDate || null,
                gender,
                birthTime: birthTime !== 'unknown' ? birthTime : null,
                isSolar
            }, { withCredentials: true });

            if (data.success) {
                // 브라우저 로컬스토리지에도 저장하여 즉시 사주/마이페이지 연동
                if (birthDate) {
                    localStorage.setItem('user_birth_date', birthDate);
                    localStorage.setItem('faith_saju_birth_date', birthDate);
                }
                if (birthTime !== 'unknown') {
                    localStorage.setItem('faith_saju_birth_time', birthTime);
                }
                localStorage.setItem('faith_saju_gender', gender);
                localStorage.setItem('faith_saju_is_solar', isSolar ? 'true' : 'false');
                localStorage.setItem('faith_saju_name', name);

                login(data.user);
                navigate('/');
            } else {
                setError(data.message || '회원가입에 실패했습니다.');
            }
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('서버 통신에 문제가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />

            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
                        <p className="text-gray-500 text-sm">Faith Portal의 새로운 식구가 되어주세요</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">이름 <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="홍길동"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">이메일 <span className="text-rose-500">*</span></label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호 <span className="text-rose-500">*</span></label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="비밀번호 (6자 이상)"
                                required
                            />
                        </div>

                        {/* 생년월일 및 성별 (사주/마이페이지 자동 연동) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <i className="fas fa-calendar-check text-blue-600"></i> 생년월일 및 사주 정보 (선택)
                                </span>
                                <span className="text-[11px] text-slate-400">자동 사주 분석 연동</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">생년월일</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">성별</label>
                                    <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setGender('M')}
                                            className={`py-1.5 text-xs font-bold rounded ${gender === 'M' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            남성
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('F')}
                                            className={`py-1.5 text-xs font-bold rounded ${gender === 'F' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            여성
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">달력 구분</label>
                                    <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(true)}
                                            className={`py-1.5 text-xs font-bold rounded ${isSolar ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            양력
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(false)}
                                            className={`py-1.5 text-xs font-bold rounded ${!isSolar ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            음력
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-gray-700">태어난 시간 (12시진)</label>
                                    <button
                                        type="button"
                                        onClick={() => setBirthTime(birthTime === 'unknown' ? '12' : 'unknown')}
                                        className="text-[11px] text-blue-600 hover:underline"
                                    >
                                        {birthTime === 'unknown' ? '시간 선택하기' : '시간 모름'}
                                    </button>
                                </div>
                                <select
                                    value={birthTime}
                                    onChange={(e) => setBirthTime(e.target.value)}
                                    disabled={birthTime === 'unknown'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="unknown">시간 모름 (기본)</option>
                                    <option value="0">자시 (子時 · 23:30 ~ 01:30)</option>
                                    <option value="2">축시 (丑時 · 01:30 ~ 03:30)</option>
                                    <option value="4">인시 (寅時 · 03:30 ~ 05:30)</option>
                                    <option value="6">묘시 (卯時 · 05:30 ~ 07:30)</option>
                                    <option value="8">진시 (辰時 · 07:30 ~ 09:30)</option>
                                    <option value="10">사시 (巳時 · 09:30 ~ 11:30)</option>
                                    <option value="12">오시 (午時 · 11:30 ~ 13:30)</option>
                                    <option value="14">미시 (未時 · 13:30 ~ 15:30)</option>
                                    <option value="16">신시 (申時 · 15:30 ~ 17:30)</option>
                                    <option value="18">유시 (酉時 · 17:30 ~ 19:30)</option>
                                    <option value="20">술시 (戌時 · 19:30 ~ 21:30)</option>
                                    <option value="22">해시 (亥時 · 21:30 ~ 23:30)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호 (선택)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="010-0000-0000"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg text-white font-bold text-lg transition-colors flex items-center justify-center ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {loading ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>가입 중...</>
                                ) : '가입하기'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-600 text-sm">
                            이미 계정이 있으신가요?
                            <Link to="/login" className="text-blue-600 font-bold ml-2 hover:underline">
                                로그인하기
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SignupPage;
