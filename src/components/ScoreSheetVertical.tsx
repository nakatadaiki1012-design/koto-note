/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  KotoScore,
  CursorPosition,
  KANJI_STRINGS,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  VERT_CHAR_MAP,
  getPitches,
  pc,
  NOTE_CDE,
  NOTE_DOREMI,
  getTuningLabel,
  noteName
} from '../types/koto';
import { Plus, Play, Repeat, Trash2, Copy, Edit2, Check, X, MoreVertical } from 'lucide-react';

interface ScoreSheetVerticalProps {
  score: KotoScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  selectedRange: [number, number] | null;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean, shiftKey?: boolean) => void;
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

export const ScoreSheetVertical: React.FC<ScoreSheetVerticalProps> = ({
  score,
  cursor,
  currentPlayKey,
  selectedRange,
  onSlotClick,
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Group measures into columns
  const columns: { measures: number[] }[] = [];
  for (let i = 0; i < score.measures.length; i += perLine) {
    const measureIndices = [];
    for (let j = 0; j < perLine && i + j < score.measures.length; j++) {
      measureIndices.push(i + j);
    }
    columns.push({ measures: measureIndices });
  }

  // Auto-scroll active measure or active playing slot into center
  useEffect(() => {
    if (!autoScroll) return;
    const targetId = currentPlayKey ? `slot-${currentPlayKey}` : `measure-${cursor.m}`;
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

  const toVert = (text: string) => {
    return Array.from(text).map((char, i) => (
      <span key={i} className="inline-block leading-none">
        {VERT_CHAR_MAP[char] || char}
      </span>
    ));
  };

  return (
    <div
      ref={containerRef}
      style={{ zoom: score.view.zoom }}
      className={`relative inline-flex flex-row-reverse flex-nowrap items-start gap-x-0 select-none font-score text-stone-900 transition-all min-w-max pb-4 ${
        isRubyOn ? 'ruby-active' : ''
      }`}
    >
      {/* Title & Metadata Column (Far Right in Traditional Vertical Bunkafu) */}
      <div className="flex flex-col items-end px-3 py-1 self-stretch min-w-[90px] border-l border-dashed border-stone-300 print:border-none shrink-0">
        {/* Metas: Beats, Tempo, Clef */}
        <div className="flex flex-col items-center text-xs font-sans text-stone-600 mb-4 tabular-nums">
          <span className="font-semibold text-stone-800">{score.beatsPerMeasure}/4</span>
          {editingField === 'tempo' ? (
            <div className="flex items-center gap-1 z-30 bg-white p-1 rounded shadow border border-stone-300">
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
            <button
              onClick={() => startEdit('tempo', score.tempo)}
              className="text-[11px] hover:text-indigo-600 cursor-pointer hover:underline"
              title="クリックしてテンポを変更"
            >
              ♩={score.tempo}
            </button>
          )}
        </div>

        {/* Title, Subtitle, Composer in Vertical Calligraphy */}
        <div className="flex flex-row-reverse items-start gap-4">
          {/* Main Title */}
          {editingField === 'title' ? (
            <div className="flex flex-col items-center gap-1 z-30 bg-white p-2 rounded shadow-lg border border-stone-300">
              <input
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="w-32 text-center text-base font-bold border rounded p-1 font-score"
                autoFocus
                placeholder="曲名を入力"
              />
              <div className="flex items-center gap-1">
                <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
                  保存
                </button>
                <button onClick={() => setEditingField(null)} className="px-1 text-xs text-stone-500 cursor-pointer">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startEdit('title', score.title)}
              className="group relative flex flex-col items-center text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-950 font-score cursor-pointer hover:text-indigo-900 transition-colors"
              title="クリックして曲名を編集"
            >
              {toVert(score.title || '無題')}
              <Edit2 className="h-3 w-3 text-stone-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          )}

          {/* Subtitle */}
          {editingField === 'subtitle' ? (
            <div className="flex flex-col items-center gap-1 z-30 bg-white p-2 rounded shadow-lg border border-stone-300 mt-6">
              <input
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="w-28 text-center text-xs border rounded p-1"
                autoFocus
                placeholder="副題を入力"
              />
              <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
                保存
              </button>
            </div>
          ) : (
            <div
              onClick={() => startEdit('subtitle', score.subtitle || '')}
              className="group flex flex-col items-center text-xs sm:text-sm font-semibold tracking-wider text-stone-600 mt-6 font-score cursor-pointer hover:text-indigo-900"
              title="クリックして副題を編集"
            >
              {score.subtitle ? (
                toVert(score.subtitle)
              ) : (
                <span className="opacity-0 group-hover:opacity-60 text-[10px] [writing-mode:vertical-rl]">+副題</span>
              )}
            </div>
          )}

          {/* Composer / Arranger */}
          {editingField === 'composer' ? (
            <div className="flex flex-col items-center gap-1 z-30 bg-white p-2 rounded shadow-lg border border-stone-300 mt-12">
              <input
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="w-28 text-center text-xs border rounded p-1 font-sans"
                autoFocus
                placeholder="作曲・編曲者"
              />
              <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
                保存
              </button>
            </div>
          ) : (
            <div
              onClick={() => startEdit('composer', score.composer || '')}
              className="group flex flex-col items-center text-xs tracking-wider text-stone-500 mt-12 font-sans cursor-pointer hover:text-indigo-900"
              title="クリックして作曲・編曲者を編集"
            >
              {score.composer ? (
                toVert(score.composer)
              ) : (
                <span className="opacity-0 group-hover:opacity-60 text-[10px] [writing-mode:vertical-rl]">+作曲者</span>
              )}
            </div>
          )}
        </div>

        {/* Tuning Chart Table (調弦表) */}
        {score.view.chart === 'on' && (
          <div className="mt-6 flex flex-col text-[11px] font-sans border border-stone-400/80 rounded bg-stone-50/80 p-1.5 shadow-xs max-w-[140px]">
            <div className="text-[10px] font-bold text-stone-700 mb-1 border-b border-stone-200 pb-0.5">
              {getTuningLabel(score)}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 tabular-nums text-[10px] text-stone-600">
              {KANJI_STRINGS.map((k, i) => (
                <div key={i} className="flex justify-between">
                  <span className="font-score font-semibold text-stone-900">{k}</span>
                  <span>{noteName(pitches[i], false)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Measure Columns - Continuous Horizontal Flow (Never wrapped awkwardly) */}
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col shrink-0">
          {/* Column Header showing Measure Range */}
          <div className="h-5 px-1 font-sans text-[11px] text-stone-500 tabular-nums font-semibold flex items-center justify-between border-b border-stone-300">
            <span>{col.measures[0] + 1}〜{col.measures[col.measures.length - 1] + 1}</span>
            <span className="text-[9px] text-stone-400">段</span>
          </div>

          {/* Column Body containing Measures */}
          <div className="border border-stone-900 border-t-0 bg-stone-50/60 shadow-xs">
            {col.measures.map(mIdx => {
              const measure = score.measures[mIdx];
              const isSelectedMeasure =
                selectedRange && mIdx >= selectedRange[0] && mIdx <= selectedRange[1];
              const isCurrentCursorMeasure = cursor.m === mIdx;

              return (
                <div
                  key={mIdx}
                  id={`measure-${mIdx}`}
                  className={`relative border-t-[2.5px] border-stone-900 transition-colors ${
                    isSelectedMeasure
                      ? 'bg-amber-100/60 ring-2 ring-indigo-500/50'
                      : isCurrentCursorMeasure
                      ? 'bg-indigo-50/40'
                      : ''
                  }`}
                >
                  {/* Measure Number Clickable for Playback & Actions Menu */}
                  <div className="absolute -left-0.5 top-0.5 z-20 flex items-center">
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
                      className="absolute left-6 top-1 z-40 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-xl border border-stone-300 text-xs min-w-[145px] text-stone-700 no-print"
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
                  <div className="flex flex-col">
                    {measure.beats.map((beat, bIdx) => {
                      const div = beat.div;
                      const beatHeight = isRubyOn ? 76 : 60;

                      return (
                        <div
                          key={bIdx}
                          style={{ height: `${beatHeight}px`, width: '74px' }}
                          className="relative flex flex-col border-t first:border-t-0 border-stone-900"
                        >
                          {/* Inner Slots */}
                          {div === 1 ? (
                            /* 4th note (♩): Upper half note, lower half blank/clickable */
                            <div className="flex flex-col h-full">
                              {/* Upper half */}
                              <div
                                id={`slot-${mIdx}-${bIdx}-0`}
                                onClick={e => onSlotClick(mIdx, bIdx, 0, false, e.shiftKey)}
                                className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors border-b border-stone-300 ${
                                  cursor.m === mIdx && cursor.b === bIdx && cursor.s === 0 && !cursor.low
                                    ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                    : ''
                                } ${currentPlayKey === `${mIdx}-${bIdx}-0` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                              >
                                {renderSlotContent(beat.slots[0], isArabic, isRubyOn, renderRuby)}
                              </div>
                              {/* Lower half (Clickable to split into 8ths) */}
                              <div
                                onClick={e => onSlotClick(mIdx, bIdx, 0, true, e.shiftKey)}
                                title="クリックで8分音符に分割"
                                className={`flex flex-1 cursor-pointer transition-colors ${
                                  cursor.m === mIdx && cursor.b === bIdx && cursor.low
                                    ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                    : 'hover:bg-stone-200/40'
                                }`}
                              />
                            </div>
                          ) : div === 2 ? (
                            /* 8th notes (♪♪): Two equal halves */
                            <div className="flex flex-col h-full divide-y divide-stone-900">
                              {beat.slots.map((sl, sIdx) => (
                                <div
                                  key={sIdx}
                                  id={`slot-${mIdx}-${bIdx}-${sIdx}`}
                                  onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                  className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                    cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx && !cursor.low
                                      ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                      : ''
                                  } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                >
                                  {renderSlotContent(sl, isArabic, isRubyOn, renderRuby)}
                                </div>
                              ))}
                            </div>
                          ) : div === 3 ? (
                            /* Triplets (3連符) */
                            <div className="relative flex flex-col h-full divide-y divide-stone-400">
                              <span className="absolute left-1 bottom-0.5 text-[9px] italic font-sans text-stone-500 pointer-events-none">
                                3
                              </span>
                              {beat.slots.map((sl, sIdx) => (
                                <div
                                  key={sIdx}
                                  id={`slot-${mIdx}-${bIdx}-${sIdx}`}
                                  onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                  className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                    cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                      ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                      : ''
                                  } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                >
                                  {renderSlotContent(sl, isArabic, isRubyOn, renderRuby, true)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* 16th notes (♬) */
                            <div className="flex flex-col h-full divide-y divide-stone-900">
                              <div className="flex flex-1 divide-x divide-stone-400">
                                {[0, 1].map(sIdx => (
                                  <div
                                    key={sIdx}
                                    id={`slot-${mIdx}-${bIdx}-${sIdx}`}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContent(beat.slots[sIdx], isArabic, isRubyOn, renderRuby, true)}
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-1 divide-x divide-stone-400">
                                {[2, 3].map(sIdx => (
                                  <div
                                    key={sIdx}
                                    id={`slot-${mIdx}-${bIdx}-${sIdx}`}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContent(beat.slots[sIdx], isArabic, isRubyOn, renderRuby, true)}
                                  </div>
                                ))}
                              </div>
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

                  {/* 終止線 (Final Double Barline in Japanese Vertical Score) */}
                  {mIdx === score.measures.length - 1 && (
                    <div className="w-full flex flex-col gap-[2px] pt-1 pb-1.5 px-0.5 bg-stone-900/5 border-t border-stone-800" title="終止線">
                      <div className="w-full h-[1.5px] bg-stone-900"></div>
                      <div className="w-full h-[3.5px] bg-stone-950"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quick Add Measure Column */}
      {onAddMeasure && (
        <button
          onClick={onAddMeasure}
          className="no-print self-stretch flex flex-col items-center justify-center px-2 py-4 border border-dashed border-stone-300 rounded-lg hover:border-amber-600 hover:bg-amber-50/50 text-stone-400 hover:text-amber-800 transition-colors cursor-pointer min-w-[36px]"
          title="小節を追加"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px] font-bold mt-1 [writing-mode:vertical-rl]">小節追加</span>
        </button>
      )}
    </div>
  );
};

function renderSlotContent(
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
    return <span className="w-0.5 h-3/4 bg-stone-900 block"></span>;
  }

  if (!sl.notes || !sl.notes.length) return null;

  // Left-hand marks (オ, ヲ, ア, ハ, ヒ, ツ, ユ)
  let lh = '';
  if (sl.oshi === 1) lh += 'オ';
  else if (sl.oshi === 2) lh += 'ヲ';
  LEFT_HAND_ORNS.forEach(k => {
    if (sl[k]) lh += ORN_MARKS[k];
  });

  // Right-hand marks (ス, 掻, 引, 〰, 流)
  let rh = '';
  RIGHT_HAND_ORNS.forEach(k => {
    if (sl[k]) rh += ORN_MARKS[k];
  });

  const notesText = sl.notes
    .map((n: number) => (isArabic ? String(n + 1) : KANJI_STRINGS[n]))
    .join(isArabic ? '·' : '');

  return (
    <>
      {/* Right-hand ornament (top right) */}
      {rh && (
        <span className="absolute right-0.5 top-0.5 text-[9px] font-bold text-red-700 leading-none font-score">
          {rh}
        </span>
      )}

      {/* Main note kanji/number */}
      <span
        className={`font-score font-bold leading-none select-none tracking-tight ${
          small ? 'text-sm' : sl.notes.length > 1 ? 'text-base' : 'text-xl'
        } ${isArabic ? 'font-sans font-bold' : ''}`}
      >
        {notesText}
      </span>

      {/* Ruby note name */}
      {isRubyOn && renderRuby(sl.notes, sl.oshi, sl.ato)}

      {/* Left-hand ornament (bottom right) */}
      {lh && (
        <span className="absolute right-0.5 bottom-0.5 text-[9px] font-bold text-red-700 leading-none font-score">
          {lh}
        </span>
      )}
    </>
  );
}
