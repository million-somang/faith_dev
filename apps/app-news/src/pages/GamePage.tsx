import { Header, Footer, Card } from '@faithportal/ui';

export default function GamePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                <Card className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-gamepad text-4xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">미니 게임</h1>
                    <p className="text-gray-500 mb-8">다양한 미니 게임과 점수 순위를 확인하세요. (준비 중인 페이지입니다)</p>
                    <a href="/" className="px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-hover transition-colors inline-block">
                        홈으로 돌아가기
                    </a>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
