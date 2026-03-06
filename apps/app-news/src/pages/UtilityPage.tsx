import { Header, Footer, Card } from '@faithportal/ui';

export default function UtilityPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                <Card className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-home text-4xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">생활 유틸리티</h1>
                    <p className="text-gray-500 mb-8">일상에 유용한 도구들을 모았습니다. (준비 중인 페이지입니다)</p>
                    <a href="/" className="px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-hover transition-colors inline-block">
                        홈으로 돌아가기
                    </a>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
