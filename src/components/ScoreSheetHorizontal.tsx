/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KotoScore,
  CursorPosition,
  KANJI_STRINGS,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  getPitches,
  pc,
  NOTE_CDE,
  NOTE_DOREMI,
  getTuningLabel,
  noteName
} from '../types/koto';
import { Plus, Play, Repeat, Trash2, Copy, Edit2, Check, X, MoreVertical } from 'lucide-react';

interface ScoreSheetHorizontalProps {
  score: KotoScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  selectedRange: [number, number] | null;
  selectedSlotKeys?: Set<string>;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean, shiftKey?: boolean, ctrlKey?: boolean) => void;
  onSlotMouseDown?: (mIdx: number, bIdx: number, sIdx: number, e: React.MouseEvent) => void;
  onSlotMouseEnter?: (mIdx: number, bIdx: number, sIdx: number) => void;
  onSlotMouseUp?: () => void;
  onMeasureClick: (mIdx: number) => void;
  onLyricsChange?: (mIdx: number, bIdx: number, text: string) => void;
  onUpdateScoreMeta?: (meta: Partial<KotoScore>) => void;
  onInsertMeasure?: (mIdx: number) => void;
  onDuplicateMeasure?: (mIdx: number) => void;
  onDeleteMeasure?: (mIdx: number) => void;
  onAddMeasure?: () => void;
  onSetLoop?: (active: boolean, a?: number, b?: number) => void;
  autoScroll?: boolean;
}

export const ScoreSheetHorizontal: React.FC<ScoreSheetHorizontalProps> = ({
  score,
  cursor,
  currentPlayKey,
  selectedRange,
  selectedSlotKeys,
  onSlotClick,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  onMeasureClick,
  onLyricsChange,
  onUpdateScoreMeta,
  onInsertMeasure,
  onDuplicateMeasure,
  onDeleteMeasure,
  onAddMeasure,
  onSetLoop,
  autoScroll = true
}) => {
  const pitches = getPitches(score);
  const perLine = score.view.perLine || 4;
  const isArabic = score.view.numerals === 'arabic';
  const isRubyOn = score.view.ruby !== 'off';

  // Inline meta editing state
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'composer' | 'tempo' | null>(null);
  const [editVal, setEditVal] = useState('');
  const [activeMenuMeasure, setActiveMenuMeasure] = useState<number | null>(null);

  const startEdit = (field: 'title' | 'subtitle' | 'composer' | 'tempo', current: string | number) => {
    if (!onUpdateScoreMeta) return;
    setEditingField(field);
    setEditVal(String(current));
  };

  const saveEdit = () => {
    if (!onUpdateScoreMeta || !editingField) return;
    if (editingField === 'tempo') {
      const num = parseInt(editVal, 10);
      if (!isNaN(num) && num >= 30 && num <= 240) {
        onUpdateScoreMeta({ tempo: num });
      }
    } else {
      onUpdateScoreMeta({ [editingField]: editVal });
    }
    setEditingField(null);
  };

  // Group measures into rows
  const rows: { measures: number[] }[] = [];
  for (let i = 0; i < score.measures.length; i += perLine) {
    const measureIndices = [];
    for (let j = 0; j < perLine && i + j < score.measures.length; j++) {
      measureIndices.push(i + j);
    }
    rows.push({ measures: measureIndices });
  }

  // Auto-scroll active measure or active playing slot
  useEffect(() => {
    if (!autoScroll) return;
    const targetId = currentPlayKey ? `slot-h-${currentPlayKey}` : `measure-h-${cursor.m}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [cursor.m, currentPlayKey, autoScroll]);

  const renderRuby = (slNotes: number[], oshi: number = 0, ato?: boolean) => {
    if (score.view.ruby === 'off' || !slNotes.length) return null;
    const names = score.view.ruby === 'cde' ? NOTE_CDE : NOTE_DOREMI;
    const text = slNotes
      .map(n => {
        const base = pitches[n];
        const sounding = base + (ato ? 0 : oshi || 0);
        return names[pc(sounding)];
      })
      .join('·');
    return <span className="text-[9px] text-stone-500 font-sans tracking-tighter leading-none mt-0.5">{text}</span>;
  };

  const fontClass =
    score.view.fontStyle === 'kaisei'
      ? 'font-kaisei'
      : score.view.fontStyle === 'yuji'
      ? 'font-yuji'
      : score.view.fontStyle === 'klee'
      ? 'font-klee'
      : score.view.fontStyle === 'noto'
      ? 'font-noto'
      : 'font-shippori';

  return (
    <div
      onMouseUp={onSlotMouseUp}
      data-font={score.view.fontStyle || 'shippori'}
      style={{ zoom: score.view.zoom }}
      className={`relative flex flex-col gap-6 select-none ${fontClass} text-stone-900 transition-all w-full max-w-5xl mx-auto pb-6`}
    >
      {/* Header: Title, Subtitle, Composer */}
      <div className="flex flex-col items-center border-b border-stone-300 pb-4 text-center">
        {editingField === 'title' ? (
          <div className="flex items-center gap-1.5 z-30 bg-white p-2 rounded-lg shadow-lg border border-stone-300">
            <input
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              className="text-xl sm:text-2xl font-extrabold text-center border rounded p-1 font-score w-64"
              autoFocus
              placeholder="曲名を入力"
            />
            <button onClick={saveEdit} className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
            <button onClick={() => setEditingField(null)} className="px-1.5 text-xs text-stone-500 cursor-pointer">
              取消
            </button>
          </div>
        ) : (
          <h1
            onClick={() => startEdit('title', score.title)}
            className="group relative text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-950 font-score cursor-pointer hover:text-indigo-900 transition-colors flex items-center gap-2 justify-center"
            title="クリックして曲名を編集"
          >
            <span>{score.title || '無題'}</span>
            <Edit2 className="h-3.5 w-3.5 text-stone-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h1>
        )}

        {editingField === 'subtitle' ? (
          <div className="flex items-center gap-1.5 z-30 bg-white p-1.5 rounded-lg shadow border border-stone-300 mt-1">
            <input
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              className="text-sm font-semibold text-center border rounded p-1 w-48 font-score"
              autoFocus
              placeholder="副題を入力"
            />
            <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
          </div>
        ) : (
          <h2
            onClick={() => startEdit('subtitle', score.subtitle || '')}
            className="group text-sm font-semibold text-stone-600 mt-1 font-score tracking-wider cursor-pointer hover:text-indigo-900"
            title="クリックして副題を編集"
          >
            {score.subtitle || <span className="opacity-0 group-hover:opacity-60 text-xs">+副題を追加</span>}
          </h2>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between w-full text-xs font-sans text-stone-600 px-2">
          {editingField === 'composer' ? (
            <div className="flex items-center gap-1 z-30 bg-white p-1 rounded shadow border border-stone-300">
              <input
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="text-xs border rounded p-0.5 w-36"
                autoFocus
                placeholder="作曲 / 編曲者"
              />
              <button onClick={saveEdit} className="px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded cursor-pointer">
                保存
              </button>
            </div>
          ) : (
            <span
              onClick={() => startEdit('composer', score.composer || '')}
              className="group cursor-pointer hover:text-indigo-900"
              title="クリックして作曲・編曲者を編集"
            >
              {score.composer ? `作曲 / 編曲: ${score.composer}` : <span className="opacity-0 group-hover:opacity-60">+作曲者</span>}
            </span>
          )}

          <div className="flex items-center gap-4">
            <span className="font-semibold text-stone-800">{score.beatsPerMeasure}/4 拍子</span>

            {editingField === 'tempo' ? (
              <div className="flex items-center gap-1 z-30 bg-white p-0.5 rounded shadow border border-stone-300">
                <span className="text-[10px]">♩=</span>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  className="w-12 text-center text-xs border rounded px-1"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-0.5 text-green-700 cursor-pointer">
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => startEdit('tempo', score.tempo)}
                className="cursor-pointer hover:text-indigo-600 hover:underline"
                title="クリックしてテンポを変更"
              >
                ♩={score.tempo}
              </span>
            )}

            <span>{getTuningLabel(score)}</span>
          </div>
        </div>

        {/* Tuning Chart (Horizontal) */}
        {score.view.chart === 'on' && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-sans border border-stone-300 rounded bg-stone-50/80 px-3 py-1.5 shadow-xs">
            <span className="font-bold text-stone-700">調弦:</span>
            {KANJI_STRINGS.map((k, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="font-score font-semibold text-stone-900">{k}</span>
                <span className="text-stone-500">{noteName(pitches[i], false)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rows of Measures */}
      <div className="flex flex-col gap-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-stretch">
            {/* Row Number */}
            <div className="w-8 shrink-0 flex items-center font-sans text-xs text-stone-400 font-semibold tabular-nums">
              {row.measures[0] + 1}
            </div>

            {/* Row Measures Body */}
            <div className="flex flex-1 border border-stone-900 bg-stone-50/60 shadow-xs overflow-x-auto">
              {row.measures.map(mIdx => {
                const measure = score.measures[mIdx];
                const isSelectedMeasure =
                  selectedRange && mIdx >= selectedRange[0] && mIdx <= selectedRange[1];
                const isCurrentCursorMeasure = cursor.m === mIdx;

                return (
                  <div
                    key={mIdx}
                    id={`measure-h-${mIdx}`}
                    className={`relative flex border-l-[2.5px] first:border-l-0 border-stone-900 transition-colors ${
                      mIdx === score.measures.length - 1 ? 'border-r-4 border-double border-stone-950' : ''
                    } ${
                      isSelectedMeasure
                        ? 'bg-amber-100/60 ring-2 ring-indigo-500/50'
                        : isCurrentCursorMeasure
                        ? 'bg-indigo-50/40'
                        : ''
                    }`}
                  >
                    {/* Measure Number Clickable & Actions */}
                    <div className="absolute left-1 -top-4 z-20 flex items-center gap-0.5">
                      <button
                        onClick={() => onMeasureClick(mIdx)}
                        title={`第${mIdx + 1}小節から再生 (右アイコンで小節操作)`}
                        className="font-sans text-[10px] font-bold text-stone-500 hover:text-red-700 hover:underline px-0.5 cursor-pointer"
                      >
                        {mIdx + 1}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenuMeasure(activeMenuMeasure === mIdx ? null : mIdx);
                        }}
                        className="text-stone-300 hover:text-stone-700 p-0.5 cursor-pointer no-print opacity-60 hover:opacity-100"
                        title="小節メニュー（挿入・複製・削除・ループ）"
                      >
                        <MoreVertical className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {/* Measure Actions Popover */}
                    {activeMenuMeasure === mIdx && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute left-6 -top-2 z-40 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-xl border border-stone-300 text-xs min-w-[145px] text-stone-700 no-print"
                      >
                        <div className="flex items-center justify-between border-b pb-1 font-bold text-stone-800 text-[11px]">
                          <span>第{mIdx + 1}小節の操作</span>
                          <button
                            onClick={() => setActiveMenuMeasure(null)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            onMeasureClick(mIdx);
                            setActiveMenuMeasure(null);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                        >
                          <Play className="h-3 w-3 text-indigo-600 fill-current" /> ここから再生
                        </button>
                        {onSetLoop && (
                          <>
                            <button
                              onClick={() => {
                                onSetLoop(true, mIdx + 1, score.measures.length);
                                setActiveMenuMeasure(null);
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                            >
                              <Repeat className="h-3 w-3 text-amber-600" /> ループ開始(A)に設定
                            </button>
                            <button
                              onClick={() => {
                                onSetLoop(true, 1, mIdx + 1);
                                setActiveMenuMeasure(null);
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                            >
                              <Repeat className="h-3 w-3 text-amber-600" /> ループ終了(B)に設定
                            </button>
                          </>
                        )}
                        {onInsertMeasure && (
                          <button
                            onClick={() => {
                              onInsertMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer border-t"
                          >
                            <Plus className="h-3 w-3 text-emerald-600" /> 前に小節を挿入
                          </button>
                        )}
                        {onDuplicateMeasure && (
                          <button
                            onClick={() => {
                              onDuplicateMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                          >
                            <Copy className="h-3 w-3 text-blue-600" /> この小節を複製
                          </button>
                        )}
                        {onDeleteMeasure && score.measures.length > 1 && (
                          <button
                            onClick={() => {
                              onDeleteMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 text-red-600 rounded text-left cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" /> この小節を削除
                          </button>
                        )}
                      </div>
                    )}

                    {/* Beats in Measure */}
                    {measure.beats.map((beat, bIdx) => {
                      const div = beat.div;
                      const beatHeight = isRubyOn ? 'h-16' : 'h-14';

                      return (
                        <div
                          key={bIdx}
                          className={`relative flex flex-col w-16 sm:w-18 shrink-0 border-l first:border-l-0 border-stone-900 ${beatHeight}`}
                        >
                          {/* Inner Slots */}
                          {beat.subDiv === '8_16_16' ? (
                            /* 表8分 + 裏16分×2（裏拍のみ2分割） */
                            <div className="flex flex-1 divide-x divide-stone-300">
                              {/* 表拍 (8分音符: 幅50%) */}
                              <div
                                id={`slot-h-${mIdx}-${bIdx}-0`}
                                onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, 0, e)}
                                onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, 0)}
                                onClick={e => onSlotClick(mIdx, bIdx, 0, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                className={`relative flex w-1/2 flex-col items-center justify-center cursor-pointer transition-colors ${
                                  selectedSlotKeys?.has(`${mIdx}-${bIdx}-0`)
                                    ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                    : cursor.m === mIdx && cursor.b === bIdx && cursor.s === 0
                                    ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                    : ''
                                } ${currentPlayKey === `${mIdx}-${bIdx}-0` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                              >
                                {renderSlotContentH(beat.slots[0], isArabic, isRubyOn, renderRuby, false)}
                              </div>

                              {/* 裏拍 (16分音符×2: 幅50%を2分割) */}
                              <div className="flex w-1/2 divide-x divide-stone-300">
                                {[1, 2].map(sIdx => {
                                  const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                  const isMultiSel = selectedSlotKeys?.has(slotKey);
                                  return (
                                    <div
                                      key={sIdx}
                                      id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                      onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                      onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                      onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                      className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                        isMultiSel
                                          ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                          : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                          ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                          : ''
                                      } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                    >
                                      {renderSlotContentH(beat.slots[sIdx], isArabic, isRubyOn, renderRuby, true)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : beat.subDiv === '16_16_8' ? (
                            /* 表16分×2 + 裏8分（表拍のみ2分割） */
                            <div className="flex flex-1 divide-x divide-stone-300">
                              {/* 表拍 (16分音符×2: 幅50%を2分割) */}
                              <div className="flex w-1/2 divide-x divide-stone-300">
                                {[0, 1].map(sIdx => {
                                  const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                  const isMultiSel = selectedSlotKeys?.has(slotKey);
                                  return (
                                    <div
                                      key={sIdx}
                                      id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                      onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                      onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                      onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                      className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                        isMultiSel
                                          ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                          : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                          ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                          : ''
                                      } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                    >
                                      {renderSlotContentH(beat.slots[sIdx], isArabic, isRubyOn, renderRuby, true)}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* 裏拍 (8分音符: 幅50%) */}
                              <div
                                id={`slot-h-${mIdx}-${bIdx}-2`}
                                onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, 2, e)}
                                onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, 2)}
                                onClick={e => onSlotClick(mIdx, bIdx, 2, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                className={`relative flex w-1/2 flex-col items-center justify-center cursor-pointer transition-colors ${
                                  selectedSlotKeys?.has(`${mIdx}-${bIdx}-2`)
                                    ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                    : cursor.m === mIdx && cursor.b === bIdx && cursor.s === 2
                                    ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                    : ''
                                } ${currentPlayKey === `${mIdx}-${bIdx}-2` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                              >
                                {renderSlotContentH(beat.slots[2], isArabic, isRubyOn, renderRuby, false)}
                              </div>
                            </div>
                          ) : div === 1 ? (
                            /* 4th note (♩) full cell */
                            <div
                              id={`slot-h-${mIdx}-${bIdx}-0`}
                              onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, 0, e)}
                              onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, 0)}
                              onClick={e => onSlotClick(mIdx, bIdx, 0, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                              className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                selectedSlotKeys?.has(`${mIdx}-${bIdx}-0`)
                                  ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                  : cursor.m === mIdx && cursor.b === bIdx && cursor.s === 0
                                  ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                  : ''
                              } ${currentPlayKey === `${mIdx}-${bIdx}-0` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                            >
                              {renderSlotContentH(beat.slots[0], isArabic, isRubyOn, renderRuby)}
                            </div>
                          ) : div === 2 ? (
                            /* 8th notes (♪♪) two horizontal cells */
                            <div className="flex flex-1 divide-x divide-stone-300">
                              {beat.slots.map((sl, sIdx) => {
                                const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                const isMultiSel = selectedSlotKeys?.has(slotKey);
                                return (
                                  <div
                                    key={sIdx}
                                    id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                    onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                    onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      isMultiSel
                                        ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                        : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby)}
                                  </div>
                                );
                              })}
                            </div>
                          ) : div === 3 ? (
                            /* Triplets */
                            <div className="relative flex flex-1 divide-x divide-stone-400">
                              <span className="absolute left-0.5 bottom-0 text-[8px] italic font-sans text-stone-500 pointer-events-none">
                                3
                              </span>
                              {beat.slots.map((sl, sIdx) => {
                                const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                const isMultiSel = selectedSlotKeys?.has(slotKey);
                                return (
                                  <div
                                    key={sIdx}
                                    id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                    onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                    onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      isMultiSel
                                        ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                        : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby, true)}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* 16th notes */
                            <div className="flex flex-1 divide-x divide-stone-400">
                              {beat.slots.map((sl, sIdx) => {
                                const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                const isMultiSel = selectedSlotKeys?.has(slotKey);
                                return (
                                  <div
                                    key={sIdx}
                                    id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                    onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                    onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      isMultiSel
                                        ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                        : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby, true)}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Optional Lyrics row */}
                          {score.view.showLyrics && (
                            <input
                              type="text"
                              value={beat.lyrics || ''}
                              onChange={e => onLyricsChange && onLyricsChange(mIdx, bIdx, e.target.value)}
                              placeholder="歌詞"
                              className="w-full text-center text-[10px] font-sans border-t border-dotted border-stone-400 bg-transparent px-0.5 focus:bg-white focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {onAddMeasure && (
          <div className="flex justify-center pt-2 no-print">
            <button
              onClick={onAddMeasure}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-xs font-semibold text-stone-500 hover:border-amber-600 hover:bg-amber-50/50 hover:text-amber-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>小節を追加する</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function renderSlotContentH(
  sl: any,
  isArabic: boolean,
  isRubyOn: boolean,
  renderRuby: (notes: number[], oshi?: number, ato?: boolean) => React.ReactNode,
  small: boolean = false
) {
  if (!sl) return null;

  if (sl.rest) {
    return <span className="text-lg leading-none font-sans font-light text-stone-900">○</span>;
  }

  if (sl.tie) {
    return <span className="w-3/4 h-0.5 bg-stone-900 block"></span>;
  }

  if (sl.repeat2) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full" title="2拍繰り返し（重ね記号）">
        <span className="font-score font-black text-2xl sm:text-3xl text-stone-900 leading-none select-none tracking-tighter">
          𝄥
        </span>
      </div>
    );
  }

  let lh = '';
  if (sl.oshi === 1) lh += 'オ';
  else if (sl.oshi === 2) lh += 'ヲ';
  LEFT_HAND_ORNS.forEach(k => {
    if (sl[k]) lh += ORN_MARKS[k];
  });

  let rh = '';
  RIGHT_HAND_ORNS.forEach(k => {
    if (sl[k]) rh += ORN_MARKS[k];
  });

  const noteCount = sl.notes?.length || 0;
  const isChord = noteCount > 1;
  const fingerText = sl.finger ? String(sl.finger) : '';

  // 奏法のみの空マス表示
  if (noteCount === 0) {
    if (!lh && !rh && !fingerText) return null;

    const aloneTextSize = small ? 'text-xs' : 'text-base sm:text-lg';

    return (
      <div className="relative flex items-center justify-center w-full h-full px-0.5 overflow-hidden select-none">
        <div className="flex items-center justify-center gap-0.5 leading-none">
          {lh && (
            <span
              className={`${aloneTextSize} font-bold text-red-700 font-score leading-none tracking-tight`}
              title="押手・左手技法"
            >
              {lh}
            </span>
          )}
          {rh && (
            <span
              className={`${aloneTextSize} font-bold text-stone-900 font-score leading-none tracking-tight`}
              title="右手技法"
            >
              {rh}
            </span>
          )}
        </div>
        {fingerText && (
          <span
            className="absolute right-1 top-0.5 font-sans font-extrabold text-[9px] text-amber-950 bg-amber-200/90 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-2xs select-none"
          >
            {fingerText}
          </span>
        )}
      </div>
    );
  }

  // Horizontal chord auto-shrink scaling
  let chordTextSize = '';
  let lhTextSize = '';
  let scaleTransform = '';
  let gapClass = 'gap-0.5';

  if (small) {
    lhTextSize = isChord ? 'text-[8.5px]' : 'text-[11px]';
    if (noteCount >= 4) {
      chordTextSize = 'text-[7.5px] leading-none';
      scaleTransform = 'scale-[0.8] origin-center';
      gapClass = 'gap-0';
    } else if (noteCount === 3) {
      chordTextSize = 'text-[8.5px] leading-none';
      scaleTransform = 'scale-[0.9] origin-center';
      gapClass = 'gap-[1px]';
    } else if (noteCount === 2) {
      chordTextSize = 'text-[9.5px] leading-none font-bold';
      gapClass = 'gap-[1px]';
    } else {
      chordTextSize = 'text-xs leading-none font-bold';
    }
  } else {
    lhTextSize = isChord ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';
    if (noteCount >= 4) {
      chordTextSize = 'text-[9px] sm:text-[10px] leading-none font-extrabold';
      scaleTransform = 'scale-[0.85] origin-center';
      gapClass = 'gap-[1px]';
    } else if (noteCount === 3) {
      chordTextSize = 'text-[11px] sm:text-xs leading-none font-extrabold';
      scaleTransform = 'scale-[0.92] origin-center';
      gapClass = 'gap-0.5';
    } else if (noteCount === 2) {
      chordTextSize = 'text-xs sm:text-sm font-extrabold';
      gapClass = 'gap-0.5';
    } else {
      chordTextSize = 'text-base sm:text-lg font-bold';
    }
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full px-0.5 overflow-hidden">
      {/* Right-hand ornament (top right) */}
      {rh && (
        <span className="absolute right-0.5 top-0.5 text-[9px] font-bold text-stone-900 leading-none font-score select-none">
          {rh}
        </span>
      )}

      {/* Finger number */}
      {fingerText && (
        <span
          className="absolute right-1 top-0.5 font-sans font-extrabold text-[9px] text-amber-950 bg-amber-200/90 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-2xs select-none"
          title={`指番号: ${fingerText === '3' ? '中指 (3)' : fingerText === '2' ? '人差指 (2)' : '親指 (1)'}`}
        >
          {fingerText}
        </span>
      )}

      {/* Main notes (side by side with technique katakana adjacent) */}
      <div
        className={`w-full max-w-full flex items-center justify-center shrink-0 ${scaleTransform}`}
      >
        <div
          className={`flex items-center justify-center ${gapClass} select-none font-score leading-none`}
        >
          {lh && (
            <span
              className={`${lhTextSize} shrink-0 font-bold text-red-700 font-score tracking-tighter mr-0.5 select-none`}
              title="押手・左手技法"
            >
              {lh}
            </span>
          )}

          {sl.notes.map((n: number, idx: number) => {
            const char = isArabic ? String(n + 1) : KANJI_STRINGS[n];
            return (
              <span
                key={idx}
                className={`${chordTextSize} shrink-0 ${
                  isChord ? 'border-b border-stone-400/50 pb-0.5' : ''
                } ${isArabic ? 'font-sans' : ''}`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {isRubyOn && renderRuby(sl.notes, sl.oshi, sl.ato)}
    </div>
  );
}
