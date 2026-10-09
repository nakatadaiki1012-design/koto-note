/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KotoScore, getTuningLabel } from '../types/koto';
import {
  Music,
  Sliders,
  FolderOpen,
  Download,
  HelpCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  Type,
  ChevronDown,
  ChevronUp,
  Settings2,
  Maximize2,
  Printer,
  FilePlus
} from 'lucide-react';

interface HeaderProps {
  score: KotoScore;
  onUpdateScoreMeta: (meta: Partial<KotoScore>) => void;
  onUpdateView: (view: Partial<KotoScore['view']>) => void;
  onOpenLibrary: () => void;
  onOpenTuning: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onOpenPracticeMode?: () => void;
  onOpenNewScoreWizard?: () => void;
  onPrint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  score,
  onUpdateScoreMeta,
  onUpdateView,
  onOpenLibrary,
  onOpenTuning,
  onOpenExport,
  onOpenHelp,
  onOpenPracticeMode,
  onOpenNewScoreWizard,
  onPrint
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const view = score.view;

  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(1.5, Math.max(0.65, Math.round((view.zoom + delta) * 100) / 100));
    onUpdateView({ zoom: nextZoom });
  };

  return (
    <header className="flex flex-col gap-1.5 rounded-xl border border-stone-200/90 bg-white/95 px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-2xs backdrop-blur-md no-print transition-all">
      {/* Top row: Brand & Primary Modals */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" title="琴譜エディタ (Koto Note)">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800 to-amber-950 text-white shadow-xs">
            <span className="font-score font-extrabold text-xs sm:text-sm">琴</span>
          </div>
          <span className="font-score font-bold text-xs text-stone-700 hidden md:inline">琴譜エディタ</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={score.title}
              onChange={e => onUpdateScoreMeta({ title: e.target.value })}
              placeholder="曲名を入力"
              className="font-score font-extrabold text-xs sm:text-sm text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-indigo-500 focus:outline-none bg-transparent max-w-[110px] sm:max-w-[200px] py-0.5"
            />
            <span className="rounded bg-amber-100/80 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-900 shrink-0">
              {score.tuning.preset === 'custom' ? 'カスタム' : score.tuning.preset}
            </span>
          </div>
        </div>

        {/* Modal & Options Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenNewScoreWizard && (
            <button
              onClick={onOpenNewScoreWizard}
              className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 sm:py-1 text-xs font-bold shadow-2xs cursor-pointer shrink-0 whitespace-nowrap transition-colors"
              title="空白の楽譜を新しく作成する (Ctrl+N)"
            >
              <FilePlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 shrink-0" />
              <span>新規楽譜</span>
            </button>
          )}

          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 sm:py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0 whitespace-nowrap"
            title="楽曲ライブラリ"
          >
            <FolderOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">楽曲集</span>
          </button>

          <button
            onClick={onOpenTuning}
            className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50/80 px-2 py-0.5 sm:py-1 text-xs font-semibold text-amber-950 hover:bg-amber-100 cursor-pointer shrink-0 whitespace-nowrap"
            title="調弦設定"
          >
            <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">調弦</span>
          </button>

          {onOpenPracticeMode && (
            <button
              onClick={onOpenPracticeMode}
              className="flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="演奏・練習モード（全画面で譜面を大きく集中表示）"
            >
              <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>演奏</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 rounded-md bg-indigo-700 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-600 cursor-pointer shrink-0 whitespace-nowrap"
            title="保存・WAV/MIDI書き出し・詳細出力"
          >
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>保存</span>
          </button>

          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-0.5 sm:py-1 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-100 cursor-pointer shrink-0 whitespace-nowrap"
              title="印刷画面・PDF保存プレビューを開く (Ctrl+P)"
            >
              <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-700 shrink-0" />
              <span>印刷</span>
            </button>
          )}

          {/* Settings / View options expand toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 sm:py-1 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              showOptions
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
            title="表示設定・詳細切り替え"
          >
            <Settings2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="hidden md:inline">設定</span>
            {showOptions ? <ChevronUp className="h-2.5 w-2.5 shrink-0" /> : <ChevronDown className="h-2.5 w-2.5 shrink-0" />}
          </button>

          <button
            onClick={onOpenHelp}
            className="flex items-center justify-center rounded-md border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100 cursor-pointer shrink-0"
            title="ヘルプ"
          >
            <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Collapsible Options & View Mode Toggles */}
      {showOptions && (
        <div className="flex flex-col gap-2 border-t border-stone-200 pt-2 text-xs text-stone-700 animate-in fade-in-50 duration-150">
          {/* Metadata: Tempo, Time signature, Subtitle, Composer */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-stone-400">テンポ:</span>
              <input
                type="number"
                min="30"
                max="260"
                value={score.tempo}
                onChange={e => onUpdateScoreMeta({ tempo: Number(e.target.value) || 80 })}
                className="w-14 rounded-md border border-stone-300 bg-white px-1.5 py-1 text-center font-bold text-stone-900 focus:outline-indigo-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-stone-400">拍子:</span>
              <select
                value={score.beatsPerMeasure}
                onChange={e => onUpdateScoreMeta({ beatsPerMeasure: Number(e.target.value) as any })}
                className="rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 text-xs"
              >
                <option value="4">4/4 拍子</option>
                <option value="3">3/4 拍子</option>
                <option value="2">2/4 拍子</option>
              </select>
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[130px]">
              <span className="text-[11px] font-semibold text-stone-400">副題:</span>
              <input
                type="text"
                value={score.subtitle}
                onChange={e => onUpdateScoreMeta({ subtitle: e.target.value })}
                placeholder="副題"
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-stone-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[130px]">
              <span className="text-[11px] font-semibold text-stone-400">作曲者:</span>
              <input
                type="text"
                value={score.composer}
                onChange={e => onUpdateScoreMeta({ composer: e.target.value })}
                placeholder="作曲・編曲"
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-stone-800 text-xs"
              />
            </div>
          </div>

          {/* View Toggles: Vertical / Horizontal, Kanji / Arabic, Ruby, Zoom */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Vertical / Horizontal */}
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
                <button
                  onClick={() => onUpdateView({ layout: 'vertical' })}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                    view.layout === 'vertical' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  縦書き琴譜
                </button>
                <button
                  onClick={() => onUpdateView({ layout: 'horizontal' })}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                    view.layout === 'horizontal' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  横書き譜
                </button>
              </div>

              {/* Kanji / Arabic */}
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
                <button
                  onClick={() => onUpdateView({ numerals: 'kanji' })}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                    view.numerals === 'kanji' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  漢数字
                </button>
                <button
                  onClick={() => onUpdateView({ numerals: 'arabic' })}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                    view.numerals === 'arabic' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  数字
                </button>
              </div>

              {/* Ruby */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">ルビ:</span>
                <select
                  value={view.ruby}
                  onChange={e => onUpdateView({ ruby: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700"
                >
                  <option value="off">非表示</option>
                  <option value="doremi">ドレミ</option>
                  <option value="cde">CDE</option>
                </select>
              </div>

              {/* Measures per line */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">1段:</span>
                <select
                  value={view.perLine}
                  onChange={e => onUpdateView({ perLine: Number(e.target.value) })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700"
                >
                  {[1, 2, 3, 4, 6, 8].map(n => (
                    <option key={n} value={n}>
                      {n}小節
                    </option>
                  ))}
                </select>
              </div>

              {/* Font selection */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">書体:</span>
                <select
                  value={view.fontStyle || 'shippori'}
                  onChange={e => onUpdateView({ fontStyle: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700 cursor-pointer"
                >
                  <option value="shippori">しっぽり明朝（正統琴譜）</option>
                  <option value="kaisei">解星デコール（優美）</option>
                  <option value="yuji">游築・筆文字（古典風格）</option>
                  <option value="klee">クレー（教科書筆記）</option>
                  <option value="noto">Noto Serif（標準明朝）</option>
                </select>
              </div>

              {/* 16th note layout (縦4段: 8分音符より縦に小さく表示 / 2x2分割) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">16分:</span>
                <select
                  value={view.sixteenthLayout || 'vertical'}
                  onChange={e => onUpdateView({ sixteenthLayout: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700 cursor-pointer"
                  title="16分音符の配置方式"
                >
                  <option value="vertical">縦4段（8分より縦に小さい）</option>
                  <option value="grid">2×2（横分割）</option>
                </select>
              </div>
            </div>

            {/* Right: Koto Board, Lyrics, Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateView({ showKotoBoard: !view.showKotoBoard })}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer border transition-colors ${
                  view.showKotoBoard
                    ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                    : 'border-stone-200 bg-white text-stone-500 hover:text-stone-800'
                }`}
                title="ページ最下部に十三絃の仮想琴台（奏台）を表示・非表示"
              >
                <Music className="h-3 w-3" />
                <span>仮想琴台</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateView({ showLyrics: !view.showLyrics })}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer border transition-colors ${
                    view.showLyrics
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-500 hover:text-stone-800'
                  }`}
                  title="歌詞の表示・非表示を切り替え"
                >
                  <Type className="h-3 w-3" />
                  <span>歌詞</span>
                </button>
                {view.showLyrics && (
                  <button
                    onClick={() =>
                      onUpdateView({
                        lyricsPosition: view.lyricsPosition === 'bottom' ? 'right' : 'bottom'
                      })
                    }
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50 cursor-pointer shadow-2xs"
                    title="歌詞の位置を切り替え（マスの右側に薄い縦列 / マスの下）"
                  >
                    <span>位置: {view.lyricsPosition === 'bottom' ? 'マスの下' : 'マスの右列'}</span>
                  </button>
                )}
              </div>

              {/* Zoom buttons */}
              <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                <button
                  onClick={() => handleZoom(-0.1)}
                  className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                  title="縮小"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="px-1 text-[10px] font-mono font-semibold text-stone-600">
                  {Math.round(view.zoom * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.1)}
                  className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                  title="拡大"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
