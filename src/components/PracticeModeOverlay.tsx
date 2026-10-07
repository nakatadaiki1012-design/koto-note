/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  KotoScore,
  CursorPosition,
  getTuningLabel
} from '../types/koto';
import { ScoreSheetVertical } from './ScoreSheetVertical';
import { ScoreSheetHorizontal } from './ScoreSheetHorizontal';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Repeat,
  Volume2,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Music
} from 'lucide-react';

interface PracticeModeOverlayProps {
  score: KotoScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  isPlaying: boolean;
  speed: number;
  metronome: boolean;
  loopActive: boolean;
  loopRange: [number, number];
  onPlayToggle: () => void;
  onStop: () => void;
  onRewind: () => void;
  onSetSpeed: (speed: number) => void;
  onSetTempo: (tempo: number) => void;
  onSetMetronome: (active: boolean) => void;
  onSetLoop: (active: boolean, a?: number, b?: number) => void;
  onSelectMeasure: (mIdx: number) => void;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean) => void;
  onClose: () => void;
  onUpdateScoreMeta?: (meta: Partial<KotoScore>) => void;
}

export const PracticeModeOverlay: React.FC<PracticeModeOverlayProps> = ({
  score,
  cursor,
  currentPlayKey,
  isPlaying,
  speed,
  metronome,
  loopActive,
  loopRange,
  onPlayToggle,
  onStop,
  onRewind,
  onSetSpeed,
  onSetTempo,
  onSetMetronome,
  onSetLoop,
  onSelectMeasure,
  onSlotClick,
  onClose,
  onUpdateScoreMeta
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(score.view.zoom || 1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut for practice mode: Space = Play/Pause, Esc = Close, Arrow keys = Move
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayToggle();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelectMeasure(Math.max(0, cursor.m - 1));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelectMeasure(Math.min(score.measures.length - 1, cursor.m + 1));
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor.m, score.measures.length, onPlayToggle, onSelectMeasure, onClose]);

  const scoreWithZoom = {
    ...score,
    view: {
      ...score.view,
      zoom
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#edece8] text-stone-900 select-none animate-in fade-in-50 duration-200">
      {/* Top Floating Sleek Bar (Title, Tuning, Close) */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-900/90 text-stone-100 backdrop-blur-md shadow-md z-20 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-wider font-score text-sm text-amber-300">
            <Music className="h-4 w-4 text-amber-400" />
            <span>{score.title || '無題'}</span>
          </div>
          <span className="text-stone-400 hidden sm:inline">|</span>
          <span className="text-stone-300 text-[11px] hidden sm:inline">
            {getTuningLabel(score)} (♩={score.tempo})
          </span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
            演奏・練習モード
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded bg-stone-800 p-0.5 border border-stone-700">
            <button
              onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
              className="p-1 text-stone-300 hover:text-white cursor-pointer"
              title="縮小"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 font-mono text-[10px] text-stone-200">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
              className="p-1 text-stone-300 hover:text-white cursor-pointer"
              title="拡大"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 rounded bg-stone-800 px-2 py-1 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer border border-stone-700"
            title="全画面切り替え"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? '全画面解除' : '全画面'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white px-2.5 py-1 font-bold cursor-pointer border border-red-800/80 transition-colors"
            title="演奏モードを終了して編集に戻る (Esc)"
          >
            <X className="h-4 w-4" />
            <span>編集に戻る</span>
          </button>
        </div>
      </div>

      {/* Main Score Canvas (Maximized view, auto-scrolling) */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-x-auto overflow-y-auto p-2 sm:p-6 bg-[#fdfcf8] flex items-center justify-center"
      >
        <div className="max-w-[1400px] w-full bg-[#fdfcf8] rounded-xl p-2 sm:p-4 shadow-sm border border-stone-300/60">
          {score.view.layout === 'vertical' ? (
            <ScoreSheetVertical
              score={scoreWithZoom}
              cursor={cursor}
              currentPlayKey={currentPlayKey}
              selectedRange={null}
              onSlotClick={(m, b, s, low) => onSlotClick(m, b, s, low)}
              onMeasureClick={onSelectMeasure}
              onUpdateScoreMeta={onUpdateScoreMeta}
              autoScroll={true}
            />
          ) : (
            <ScoreSheetHorizontal
              score={scoreWithZoom}
              cursor={cursor}
              currentPlayKey={currentPlayKey}
              selectedRange={null}
              onSlotClick={(m, b, s, low) => onSlotClick(m, b, s, low)}
              onMeasureClick={onSelectMeasure}
              onUpdateScoreMeta={onUpdateScoreMeta}
              autoScroll={true}
            />
          )}
        </div>
      </div>

      {/* Floating Minimalist Player HUD at Bottom */}
      <div className="sticky bottom-2 mx-auto w-full max-w-[920px] px-2 z-30">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-stone-900/90 text-stone-100 p-2 sm:p-3 shadow-2xl backdrop-blur-md border border-stone-700/80">
          {/* Left: Playback & Seek */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayToggle}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-bold text-sm shadow-md transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-stone-950 hover:bg-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> 一時停止
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> 再生
                </>
              )}
            </button>

            <button
              onClick={onStop}
              className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
              title="停止"
            >
              <Square className="h-4 w-4" />
            </button>

            <button
              onClick={onRewind}
              className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
              title="先頭へ"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Measure Step Buttons */}
            <div className="flex items-center rounded-lg bg-stone-800 border border-stone-700">
              <button
                onClick={() => onSelectMeasure(Math.max(0, cursor.m - 1))}
                className="p-1.5 text-stone-300 hover:text-white cursor-pointer"
                title="前小節へ"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-amber-300">
                第{cursor.m + 1} / {score.measures.length}小節
              </span>
              <button
                onClick={() => onSelectMeasure(Math.min(score.measures.length - 1, cursor.m + 1))}
                className="p-1.5 text-stone-300 hover:text-white cursor-pointer"
                title="次小節へ"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center: Tempo BPM & Slow Practice Speed */}
          <div className="flex items-center gap-2">
            {/* Speed Presets for Slow Practice */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-800 p-1 border border-stone-700 text-xs">
              <span className="text-[10px] text-stone-400 font-semibold px-1 hidden sm:inline">速度:</span>
              {[0.5, 0.75, 1.0, 1.25].map(sp => (
                <button
                  key={sp}
                  onClick={() => onSetSpeed(sp)}
                  className={`rounded px-1.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                    speed === sp
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-stone-700'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {/* Tempo BPM Adjuster */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-800 px-2 py-1 border border-stone-700">
              <button
                onClick={() => onSetTempo(Math.max(30, score.tempo - 5))}
                className="px-1 font-bold text-stone-300 hover:text-white cursor-pointer"
                title="テンポ -5"
              >
                -
              </button>
              <span className="font-mono text-xs font-semibold text-amber-200">
                BPM {score.tempo}
              </span>
              <button
                onClick={() => onSetTempo(Math.min(240, score.tempo + 5))}
                className="px-1 font-bold text-stone-300 hover:text-white cursor-pointer"
                title="テンポ +5"
              >
                +
              </button>
            </div>
          </div>

          {/* Right: Metronome (Hyoshigi) & Loop */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetMetronome(!metronome)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                metronome
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title="拍子木メトロノームのON/OFF"
            >
              <span>拍子木 {metronome ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onSetLoop(!loopActive, loopRange[0], loopRange[1])}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                loopActive
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title="A-Bループ再生のON/OFF"
            >
              <Repeat className="h-3.5 w-3.5" />
              <span>
                ループ {loopActive ? `${loopRange[0]}〜${loopRange[1]}` : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
