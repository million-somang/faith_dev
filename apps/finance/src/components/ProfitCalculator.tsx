import { useState } from 'react';

interface ProfitCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfitCalculator({ isOpen, onClose }: ProfitCalculatorProps) {
    const [investAmount, setInvestAmount] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');

    const formatCurrency = (value: string): string => {
        const num = value.replace(/,/g, '');
        if (!isNaN(Number(num)) && num !== '') {
            return parseInt(num).toLocaleString('ko-KR');
        }
        return value;
    };

    const handleInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(formatCurrency(e.target.value));
    };

    const parseNumber = (val: string): number => parseInt(val.replace(/,/g, '') || '0');

    const invest = parseNumber(investAmount);
    const buy = parseNumber(buyPrice);
    const current = parseNumber(currentPrice);

    const hasValues = invest > 0 && buy > 0 && current > 0;
    const shareCount = hasValues ? Math.floor(invest / buy) : 0;
    const actualInvestment = shareCount * buy;
    const currentValue = shareCount * current;
    const profitAmount = currentValue - actualInvestment;
    const profitRate = actualInvestment > 0 ? (profitAmount / actualInvestment) * 100 : 0;
    const isProfit = profitAmount >= 0;

    const reset = () => {
        setInvestAmount('');
        setBuyPrice('');
        setCurrentPrice('');
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        <i className="fas fa-calculator text-green-600 mr-2"></i>
                        수익률 계산기
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 투자 금액 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-won-sign text-blue-600 mr-1"></i>
                            투자 금액 (원)
                        </label>
                        <input
                            type="text"
                            value={investAmount}
                            onChange={handleInput(setInvestAmount)}
                            placeholder="1,000,000"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                        />
                    </div>

                    {/* 매수가 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-arrow-down text-red-600 mr-1"></i>
                            매수가 (원)
                        </label>
                        <input
                            type="text"
                            value={buyPrice}
                            onChange={handleInput(setBuyPrice)}
                            placeholder="60,000"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                        />
                    </div>

                    {/* 현재가 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-arrow-up text-green-600 mr-1"></i>
                            현재가/목표가 (원)
                        </label>
                        <input
                            type="text"
                            value={currentPrice}
                            onChange={handleInput(setCurrentPrice)}
                            placeholder="75,000"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg font-mono"
                        />
                    </div>

                    <div className="border-t-2 border-gray-200 my-6"></div>

                    {/* 결과 표시 */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">보유 수량</span>
                            <span className="text-xl font-bold text-gray-900">
                                {hasValues ? `${shareCount.toLocaleString('ko-KR')} 주` : '- 주'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">평가 금액</span>
                            <span className="text-xl font-bold text-gray-900">
                                {hasValues ? `${currentValue.toLocaleString('ko-KR')} 원` : '- 원'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">손익 금액</span>
                            <span className={`text-2xl font-bold ${hasValues ? (isProfit ? 'text-red-600' : 'text-blue-600') : 'text-green-600'}`}>
                                {hasValues
                                    ? `${isProfit ? '+' : ''}${profitAmount.toLocaleString('ko-KR')} 원`
                                    : '- 원'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">수익률</span>
                            <span className={`text-2xl font-bold ${hasValues ? (isProfit ? 'text-red-600' : 'text-blue-600') : 'text-green-600'}`}>
                                {hasValues
                                    ? `${isProfit ? '+' : ''}${profitRate.toFixed(2)} %`
                                    : '- %'}
                            </span>
                        </div>
                    </div>

                    {/* 안내문 */}
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                        <i className="fas fa-info-circle mr-1"></i>
                        투자 금액을 매수가로 나눈 수량으로 계산합니다. 수수료는 포함하지 않습니다.
                    </div>

                    {/* 초기화 버튼 */}
                    <button
                        onClick={reset}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                    >
                        <i className="fas fa-redo mr-2"></i>
                        초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
