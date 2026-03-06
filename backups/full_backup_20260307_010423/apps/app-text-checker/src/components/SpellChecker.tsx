import { useState } from 'react';
import { SpellCheck, Keyboard, ArrowRight, AlertTriangle, CheckCircle, AlertCircle, Wand2 } from 'lucide-react';
import { findSimpleErrors, applyAllCorrections, type SpellError } from '../utils/spellRules';

interface SpellCheckerProps {
    text: string;
    onApplyCorrections: (newText: string) => void;
}

export default function SpellChecker({ text, onApplyCorrections }: SpellCheckerProps) {
    const [errors, setErrors] = useState<SpellError[] | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const handleCheck = () => {
        if (!text.trim()) {
            alert('먼저 텍스트를 입력해주세요.');
            return;
        }

        setIsChecking(true);
        // 간단한 모의 지연 효과
        setTimeout(() => {
            const result = findSimpleErrors(text);
            setErrors(result);
            setIsChecking(false);
        }, 800);
    };

    const handleFixAll = () => {
        if (!errors || errors.length === 0) return;
        const newText = applyAllCorrections(text, errors);
        onApplyCorrections(newText);
        setErrors(null);
        alert('모든 맞춤법 오류가 수정되었습니다.');
    };

    return (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <SpellCheck className="text-green-600" size={20} />
                    맞춤법 검사
                </h3>
                {isChecking ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium animate-pulse">
                        검사 중...
                    </span>
                ) : errors ? (
                    errors.length === 0 ? (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">오류 없음</span>
                    ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">{errors.length}개 발견</span>
                    )
                ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">대기 중</span>
                )}
            </div>

            <div className="min-h-[160px]">
                {!errors ? (
                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Keyboard size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>글을 입력하고<br />검사 버튼을 눌러주세요.</p>
                    </div>
                ) : errors.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                        <p className="text-green-700 font-semibold">오류가 발견되지 않았습니다!</p>
                        <p className="text-gray-500 text-sm mt-2">맞춤법이 올바릅니다.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {errors.map((error, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={16} />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800 text-sm break-keep">
                                        <span className="bg-red-100 border-b-2 border-red-400 px-1">{error.wrong}</span>
                                        <ArrowRight className="inline mx-2 text-gray-400" size={14} />
                                        <span className="bg-green-100 px-1">{error.correct}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                        <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{error.type}</span>
                                        {error.desc && <span className="text-gray-500">· {error.desc}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleFixAll}
                            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
                        >
                            <Wand2 size={16} /> 모든 오류 자동 교정
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={handleCheck}
                disabled={isChecking}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50"
            >
                <Wand2 size={20} /> 맞춤법 검사 시작
            </button>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p><strong>안내:</strong> 정규식 패턴 기반 맞춤법 검사기이므로 완벽하지 않을 수 있습니다. 최종 제출 전 다시 한번 확인하세요.</p>
            </div>
        </div>
    );
}
