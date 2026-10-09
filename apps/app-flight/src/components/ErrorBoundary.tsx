import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vera Flight runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-[#FAF8F5] text-[#2D2A26]">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-[#EBE6DD] shadow-sm text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#2D2A26] mb-2">일시적인 오류가 발생했습니다</h2>
            <p className="text-xs text-[#7A756D] leading-relaxed mb-6">
              게임 실행 중 예기치 않은 문제가 감지되었습니다. 게임 상태를 초기화하고 안전하게 다시 시작할 수 있습니다.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow hover:from-emerald-700 hover:to-teal-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              게임 다시 불러오기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
