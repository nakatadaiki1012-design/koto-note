/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Plus, MoveLeft, MoveRight, Maximize2, Smartphone, Monitor } from 'lucide-react';

interface MeasureNavigatorProps {
  totalMeasures: number;
  currentMeasure: number;
  perLine: number;
  layout: 'vertical' | 'horizontal';
  onSelectMeasure: (mIdx: number) => void;
  onAddMeasure: () => void;
  onSetPerLine: (perLine: number) => void;
  onFitMobile?: () => void;
}

export const MeasureNavigator: React.FC<MeasureNavigatorProps> = ({
  totalMeasures,
  currentMeasure,
  perLine,
  layout,
  onSelectMeasure,
  onAddMeasure,
  onSetPerLine,
  onFitMobile
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the pill strip to keep active measure centered
  useEffect(() => {
    const el = document.getElementById(`nav-pill-${currentMeasure}`);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentMeasure]);

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-stone-200/90 bg-white/90 px-2.5 py-1.5 shadow-2xs backdrop-blur-xs no-print text-xs">
      {/* Quick Measure Jump Scrubber */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="font-semibold text-stone-500 shrink-0 text-[11px] hidden sm:inline">
          小節一覧:
        </span>
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin flex-1"
        >
          {Array.from({ length: totalMeasures }, (_, idx) => {
            const isCurrent = idx === currentMeasure;
            return (
              <button
                key={idx}
                id={`nav-pill-${idx}`}
                onClick={() => onSelectMeasure(idx)}
                className={`flex h-6 min-w-6 px-1.5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-700 text-white shadow-xs scale-105 ring-1 ring-indigo-400'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
                }`}
                title={`第${idx + 1}小節へジャンプ`}
              >
                {idx + 1}
              </button>
            );
          })}

          <button
            onClick={onAddMeasure}
            className="flex h-6 px-2 shrink-0 items-center gap-0.5 rounded-md border border-dashed border-stone-300 bg-stone-50 text-stone-600 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-800 text-[11px] font-semibold cursor-pointer"
            title="末尾に小節を追加"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">追加</span>
          </button>
        </div>
      </div>

      {/* Screen layout adaptation controls */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-stone-200 text-stone-600">
        <span className="text-[11px] font-semibold text-stone-400 hidden md:inline">1段:</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSetPerLine(2)}
            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
              perLine === 2
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="スマホ・縦画面向け（2小節/段: 縦スクロール不要）"
          >
            <Smartphone className="h-3 w-3" />
            <span>2小節</span>
          </button>
          <button
            onClick={() => onSetPerLine(4)}
            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
              perLine === 4
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="標準・横画面向け（4小節/段）"
          >
            <Monitor className="h-3 w-3" />
            <span>4小節</span>
          </button>
        </div>

        {onFitMobile && (
          <button
            onClick={onFitMobile}
            className="rounded bg-stone-100 hover:bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-700 hidden sm:flex items-center gap-1 cursor-pointer"
            title="現在の画面サイズに自動フィット"
          >
            <Maximize2 className="h-3 w-3" />
            <span>全体フィット</span>
          </button>
        )}
      </div>
    </div>
  );
};
