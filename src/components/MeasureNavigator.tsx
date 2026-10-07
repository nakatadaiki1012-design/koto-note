/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import {
  Plus,
  Maximize2,
  ZoomIn,
  Smartphone,
  Monitor,
  Search,
  HandMetal
} from 'lucide-react';

interface MeasureNavigatorProps {
  totalMeasures: number;
  currentMeasure: number;
  perLine: number;
  layout: 'vertical' | 'horizontal';
  zoom: number;
  isFitAll: boolean;
  onSelectMeasure: (mIdx: number) => void;
  onAddMeasure: () => void;
  onSetPerLine: (perLine: number) => void;
  onToggleFitAll: () => void;
  onSetZoom100: () => void;
}

export const MeasureNavigator: React.FC<MeasureNavigatorProps> = ({
  totalMeasures,
  currentMeasure,
  perLine,
  layout,
  zoom,
  isFitAll,
  onSelectMeasure,
  onAddMeasure,
  onSetPerLine,
  onToggleFitAll,
  onSetZoom100
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
    <div className="flex flex-col gap-1 rounded-xl border border-stone-200/90 bg-white/95 px-2.5 py-1.5 shadow-2xs backdrop-blur-xs no-print text-xs transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Quick Measure Jump Scrubber */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="font-semibold text-stone-500 shrink-0 text-[11px] hidden sm:inline">
            小節:
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

        {/* Zoom & Fit-All Switcher (全体表示 vs 100% 表示) */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-stone-200">
          {/* Fit All / 100% Toggle */}
          <button
            onClick={onToggleFitAll}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              isFitAll
                ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-500'
                : 'border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
            title="曲全体が見渡せる縮小表示と、詳細な100%表示を切り替え（ダブルタップでも可能）"
          >
            {isFitAll ? (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-stone-950" />
                <span>全体表示中</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5 text-stone-600" />
                <span>全体表示</span>
              </>
            )}
          </button>

          {isFitAll && (
            <button
              onClick={onSetZoom100}
              className="flex items-center gap-0.5 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-900 hover:bg-indigo-100 cursor-pointer"
              title="100%標準サイズに戻す"
            >
              <ZoomIn className="h-3 w-3" />
              <span>100%</span>
            </button>
          )}

          {/* Column per Line toggle */}
          <div className="hidden sm:flex items-center gap-0.5 border-l border-stone-200 pl-1">
            <button
              onClick={() => onSetPerLine(2)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                perLine === 2 ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="2小節/段（スマホ縦画面に最適）"
            >
              <Smartphone className="h-3 w-3 inline mr-0.5" />
              2小節
            </button>
            <button
              onClick={() => onSetPerLine(4)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                perLine === 4 ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="4小節/段（標準表示）"
            >
              <Monitor className="h-3 w-3 inline mr-0.5" />
              4小節
            </button>
          </div>
        </div>
      </div>

      {/* Touch Gesture Guide Sub-bar (スワイプ / ダブルタップの案内) */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium px-0.5 pt-0.5 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <span>💡 画面を<b>左右スワイプ</b>で小節送り</span>
          <span className="hidden sm:inline">・</span>
          <span className="hidden sm:inline"><b>ダブルタップ</b>で全体表示 ⇔ 100%切替</span>
          <span className="hidden sm:inline">・</span>
          <span className="hidden sm:inline"><b>ピンチ操作</b>で無段階拡大縮小</span>
        </div>
        <div className="font-mono text-stone-500 font-semibold">
          表示倍率: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};
