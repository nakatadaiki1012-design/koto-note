/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kotoBunkafu.draft.v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-stone-800">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-stone-900 mb-2">
              画面の読み込み中にエラーが発生しました
            </h1>
            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              ブラウザに保存された以前の下書きデータと新しいバージョンの形式が異なっている可能性があります。「初期データで再読込する」を押すと復旧できます。
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-600 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" /> 初期データで再読込する
            </button>
            {this.state.error && (
              <details className="mt-4 text-left w-full">
                <summary className="text-[10px] text-stone-400 cursor-pointer">
                  エラー詳細情報
                </summary>
                <pre className="mt-2 text-[10px] bg-stone-50 p-2 rounded border border-stone-200 overflow-x-auto text-red-600">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
