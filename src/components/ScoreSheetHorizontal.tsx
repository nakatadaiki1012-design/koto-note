/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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

interface ScoreSheetHorizontalProps {
  score: KotoScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  selectedRange: [number, number] | null;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean, shiftKey?: boolean) => void;
  onMeasureClick: (mIdx: number) => void;
  onLyricsChange?: (mIdx: number, bIdx: number, text: string) => void;
  autoScroll?: boolean;
}

export const ScoreSheetHorizontal: React.FC<ScoreSheetHorizontalProps> = ({
  score,
  cursor,
  currentPlayKey,
  selectedRange,
  onSlotClick,
  onMeasureClick,
  onLyricsChange,
  autoScroll = true
}) => {
  const pitches = getPitches(score);
  const perLine = score.view.perLine || 4;
  const isArabic = score.view.numerals === 'arabic';
  const isRubyOn = score.view.ruby !== 'off';

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

  return (
    <div
      style={{ zoom: score.view.zoom }}
      className="relative flex flex-col gap-6 select-none font-score text-stone-900 transition-all w-full max-w-5xl mx-auto pb-6"
    >
      {/* Header: Title, Subtitle, Composer */}
      <div className="flex flex-col items-center border-b border-stone-300 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-950 font-score">
          {score.title || '無題'}
        </h1>
        {score.subtitle && (
          <h2 className="text-sm font-semibold text-stone-600 mt-1 font-score tracking-wider">
            {score.subtitle}
          </h2>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between w-full text-xs font-sans text-stone-600 px-2">
          <span>{score.composer && `作曲 / 編曲: ${score.composer}`}</span>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-stone-800">{score.beatsPerMeasure}/4 拍子</span>
            <span>♩={score.tempo}</span>
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
                      isSelectedMeasure
                        ? 'bg-amber-100/60 ring-2 ring-indigo-500/50'
                        : isCurrentCursorMeasure
                        ? 'bg-indigo-50/40'
                        : ''
                    }`}
                  >
                    {/* Measure Number Clickable */}
                    <button
                      onClick={() => onMeasureClick(mIdx)}
                      title={`第${mIdx + 1}小節から再生`}
                      className="absolute left-1 -top-3.5 z-10 font-sans text-[10px] font-bold text-stone-500 hover:text-red-700 hover:underline px-0.5 cursor-pointer"
                    >
                      {mIdx + 1}
                    </button>

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
                          {div === 1 ? (
                            /* 4th note (♩) full cell */
                            <div
                              id={`slot-h-${mIdx}-${bIdx}-0`}
                              onClick={e => onSlotClick(mIdx, bIdx, 0, false, e.shiftKey)}
                              className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                cursor.m === mIdx && cursor.b === bIdx && cursor.s === 0
                                  ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                  : ''
                              } ${currentPlayKey === `${mIdx}-${bIdx}-0` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                            >
                              {renderSlotContentH(beat.slots[0], isArabic, isRubyOn, renderRuby)}
                            </div>
                          ) : div === 2 ? (
                            /* 8th notes (♪♪) two horizontal cells */
                            <div className="flex flex-1 divide-x divide-stone-900">
                              {beat.slots.map((sl, sIdx) => (
                                <div
                                  key={sIdx}
                                  id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                  onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                  className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                    cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                      ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                      : ''
                                  } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                >
                                  {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby)}
                                </div>
                              ))}
                            </div>
                          ) : div === 3 ? (
                            /* Triplets */
                            <div className="relative flex flex-1 divide-x divide-stone-400">
                              <span className="absolute left-0.5 bottom-0 text-[8px] italic font-sans text-stone-500 pointer-events-none">
                                3
                              </span>
                              {beat.slots.map((sl, sIdx) => (
                                <div
                                  key={sIdx}
                                  id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                  onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                  className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                    cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                      ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                      : ''
                                  } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                >
                                  {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby, true)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* 16th notes */
                            <div className="flex flex-1 divide-x divide-stone-400">
                              {beat.slots.map((sl, sIdx) => (
                                <div
                                  key={sIdx}
                                  id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                  onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey)}
                                  className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                    cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                      ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                      : ''
                                  } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                >
                                  {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby, true)}
                                </div>
                              ))}
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

  if (!sl.notes || !sl.notes.length) return null;

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

  const notesText = sl.notes
    .map((n: number) => (isArabic ? String(n + 1) : KANJI_STRINGS[n]))
    .join(isArabic ? '·' : '');

  return (
    <>
      {rh && (
        <span className="absolute right-0.5 top-0.5 text-[9px] font-bold text-red-700 leading-none font-score">
          {rh}
        </span>
      )}
      <span
        className={`font-score font-bold leading-none select-none ${
          small ? 'text-xs' : sl.notes.length > 1 ? 'text-sm' : 'text-lg'
        } ${isArabic ? 'font-sans font-bold' : ''}`}
      >
        {notesText}
      </span>
      {isRubyOn && renderRuby(sl.notes, sl.oshi, sl.ato)}
      {lh && (
        <span className="absolute right-0.5 bottom-0.5 text-[9px] font-bold text-red-700 leading-none font-score">
          {lh}
        </span>
      )}
    </>
  );
}
