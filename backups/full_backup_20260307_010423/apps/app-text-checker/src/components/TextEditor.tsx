import { Copy, Trash2, Eraser, Smile } from 'lucide-react';

interface TextEditorProps {
    text: string;
    onTextChange: (val: string) => void;
}

export default function TextEditor({ text, onTextChange }: TextEditorProps) {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        alert('클립보드에 복사되었습니다!'); // 간단한 임시 토스트 효과
    };

    const handleClear = () => {
        if (window.confirm('정말로 모든 내용을 삭제하시겠습니까?')) {
            onTextChange('');
        }
    };

    const handleRemoveSpecialChars = () => {
        const cleaned = text.replace(/<[^>]*>/g, '').replace(/[^가-힣a-zA-Z0-9\s.,!?;:\-()]/g, '');
        onTextChange(cleaned);
    };

    const handleRemoveEmojis = () => {
        const cleaned = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        onTextChange(cleaned);
    };

    return (
        <div className="flex-1 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border-b border-gray-300 flex flex-wrap gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300">
                    <Copy size={16} /> 복사
                </button>
                <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-md transition border border-gray-300">
                    <Trash2 size={16} /> 삭제
                </button>
                <button onClick={handleRemoveSpecialChars} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 hidden sm:flex">
                    <Eraser size={16} /> 특수문자 제거
                </button>
                <button onClick={handleRemoveEmojis} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 sm:ml-auto">
                    <Smile size={16} /> 이모지 제거
                </button>
            </div>

            {/* Text Area */}
            <textarea
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="여기에 내용을 입력하거나 붙여넣으세요...&#10;&#10;자소서, 레포트, 블로그 포스팅 등 어떤 글이든 입력해보세요.&#10;실시간으로 글자 수를 세고, 맞춤법을 검사해드립니다."
                className="w-full h-[350px] sm:h-[450px] lg:h-[500px] p-4 sm:p-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base lg:text-lg leading-relaxed text-gray-800"
            />
        </div>
    );
}
