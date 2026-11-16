import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QR Studio Uncaught Error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center p-6 text-center select-none animate-fade-in">
          <div className="w-full max-w-sm my-auto space-y-4 bg-white p-6 rounded-3xl border border-[#EBE6DD] shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl shadow-xs border border-rose-200">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2D2A26] mb-1">
                일시적인 연산 오류가 발생했습니다
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                입력하신 데이터 길이나 형식을 확인해 주세요. 아래 버튼을 눌러 안전하게 초기화할 수 있습니다.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
              >
                초기화 후 다시 시도
              </button>
            </div>
          </div>
          <div className="text-[10px] text-stone-400">
            © 2026 VeraNex. Secure Client-Side Sandbox.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
