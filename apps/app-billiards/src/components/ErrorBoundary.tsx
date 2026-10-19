import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Vera Billiards Error]:', error, errorInfo);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center p-6 text-center select-none">
          <div className="w-full max-w-sm my-auto bg-white p-6 rounded-3xl border border-[#EBE6DD] shadow-sm space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#2D2A26] mb-1">
                일시적인 화면 오류가 발생했습니다
              </h2>
              <p className="text-xs text-[#7A756D] leading-relaxed">
                당구대 물리 엔진을 안전하게 초기화하여 즉시 복구할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-xs rounded-xl shadow-sm hover:from-indigo-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>당구대 초기화 및 다시 시작</span>
            </button>
          </div>
          <div className="text-[10px] text-[#8A847A]">
            © 2026 VeraNex. All rights reserved.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
