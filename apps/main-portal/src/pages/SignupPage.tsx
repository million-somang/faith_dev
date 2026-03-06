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
                phone
            }, { withCredentials: true });

            if (data.success) {
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
                            <label className="block text-sm font-semibold text-gray-700 mb-1">이름</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c75a] focus:border-transparent transition-all"
                                placeholder="홍길동"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c75a] focus:border-transparent transition-all"
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c75a] focus:border-transparent transition-all"
                                placeholder="비밀번호 (6자 이상)"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호 (선택)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c75a] focus:border-transparent transition-all"
                                placeholder="010-0000-0000"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg text-white font-bold text-lg transition-colors flex items-center justify-center ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-[#03c75a] hover:bg-[#02b350]'
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
                            <Link to="/login" className="text-[#03c75a] font-bold ml-2 hover:underline">
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
