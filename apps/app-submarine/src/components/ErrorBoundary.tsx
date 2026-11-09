import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Submarine Game Error Boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center text-[#2D2A26]">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-3">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-lg font-black">작전 통신 일시 두절</h2>
          <p className="text-xs text-[#7A756D] mt-1 max-w-xs">
            해상 통신 중 예기치 않은 오류가 발생했습니다. 아래 버튼을 눌러 레이더를 재부팅해 주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            함대 레이더 재가동
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
