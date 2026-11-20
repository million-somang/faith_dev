import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || '알 수 없는 오류가 발생했습니다.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[VeraNex Todo Planner ErrorBoundary]:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between items-center p-6 text-center select-none animate-fade-in">
          <div className="w-full max-w-sm my-auto bg-white rounded-3xl p-6 border border-[#EBE6DD] shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl border border-rose-200">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#2D2A26]">
                일시적인 화면 오류가 발생했습니다
              </h2>
              <p className="text-xs text-[#7A7369] leading-relaxed">
                저장된 할 일 데이터는 안전하게 보관되어 있습니다. 아래 버튼을 눌러 화면을 복구하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
            >
              화면 복구 및 다시 시도
            </button>
          </div>
          <p className="text-[10px] text-[#A39C90]">
            © 2026 VeraNex. Secure Client-Side Sandbox.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
