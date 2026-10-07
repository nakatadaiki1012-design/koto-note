/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  KotoScore,
  TUNING_PRESETS,
  KANJI_STRINGS,
  RITSU_NAMES,
  getPitches,
  pc,
  noteName,
  midiToHz,
  clamp
} from '../types/koto';
import { kotoSynth } from '../audio/kotoSynth';
import { Volume2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface TuningModalProps {
  score: KotoScore;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTuning: (newTuning: KotoScore['tuning']) => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  score,
  isOpen,
  onClose,
  onUpdateTuning
}) => {
  if (!isOpen) return null;

  const currentTuning = score.tuning;
  const pitches = getPitches(score);

  const handlePresetChange = (presetKey: string) => {
    if (presetKey === 'custom') {
      onUpdateTuning({
        ...currentTuning,
        preset: 'custom',
        custom: [...pitches]
      });
    } else {
      onUpdateTuning({
        ...currentTuning,
        preset: presetKey,
        custom: null
      });
    }
  };

  const handleRootChange = (newRoot: number) => {
    onUpdateTuning({
      ...currentTuning,
      root: clamp(newRoot, 40, 80)
    });
  };

  const handleTranspose = (delta: number) => {
    if (currentTuning.preset === 'custom' && currentTuning.custom) {
      onUpdateTuning({
        ...currentTuning,
        custom: currentTuning.custom.map(p => p + delta)
      });
    } else {
      onUpdateTuning({
        ...currentTuning,
        root: clamp(currentTuning.root + delta, 40, 80)
      });
    }
  };

  const handleCustomStringPitchChange = (index: number, newPitch: number) => {
    const newCustom = [...pitches];
    newCustom[index] = clamp(newPitch, 36, 96);
    onUpdateTuning({
      ...currentTuning,
      preset: 'custom',
      custom: newCustom
    });
  };

  const playPitch = (idx: number, midi: number) => {
    kotoSynth.pluck(idx, midi, 0, 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl font-bold font-score text-stone-900">調弦（ちょうげん）設定</h2>
            <p className="text-xs text-stone-500 mt-0.5">十三絃の音高・調子・基音（一の音）の調整</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">調子（プリセット）</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TUNING_PRESETS).map(([key, preset]) => {
                const isSelected = currentTuning.preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/30'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="font-bold text-sm font-score">{preset.name}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{preset.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Root Note & Transpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-stone-100/70 p-4 border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                基音（一の音）: {noteName(currentTuning.root)}（{RITSU_NAMES[pc(currentTuning.root)]}）
              </label>
              <select
                disabled={currentTuning.preset === 'custom'}
                value={currentTuning.root}
                onChange={e => handleRootChange(Number(e.target.value))}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 disabled:opacity-50"
              >
                {[
                  { m: 58, label: 'B♭3（黄鐘）/ 9本(低)' },
                  { m: 59, label: 'B3（鸞鏡）/ 10本(低)' },
                  { m: 60, label: 'C4（神仙）/ 11本(低)' },
                  { m: 61, label: 'C♯4 / D♭4（上無）/ 12本(低)' },
                  { m: 62, label: 'D4（壱越 - 標準）/ 1本' },
                  { m: 63, label: 'E♭4（断金）/ 2本' },
                  { m: 64, label: 'E4（平調）/ 3本' },
                  { m: 65, label: 'F4（勝絶）/ 4本' },
                  { m: 66, label: 'F♯4（下無）/ 5本' },
                  { m: 67, label: 'G4（双調）/ 6本' },
                  { m: 68, label: 'A♭4（鳧鐘）/ 7本' },
                  { m: 69, label: 'A4（黄鐘）/ 8本' }
                ].map(opt => (
                  <option key={opt.m} value={opt.m}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">全体移調（半音シフト）</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <ArrowDown className="h-3.5 w-3.5 text-stone-500" /> 半音下げ (-1)
                </button>
                <button
                  onClick={() => handleTranspose(1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <ArrowUp className="h-3.5 w-3.5 text-stone-500" /> 半音上げ (+1)
                </button>
              </div>
            </div>
          </div>

          {/* 13 Strings Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700">各弦の音高（十三絃一覧）</label>
              <span className="text-[11px] text-stone-500">スピーカーを押すと音色を確認できます</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KANJI_STRINGS.map((kanji, idx) => {
                const midi = pitches[idx];
                const hz = Math.round(midiToHz(midi));
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-stone-900 font-score font-bold text-stone-50">
                        {kanji}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-800">{noteName(midi)}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{hz}Hz</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {currentTuning.preset === 'custom' && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleCustomStringPitchChange(idx, midi + 1)}
                            className="px-1 text-[10px] bg-stone-100 hover:bg-stone-200 rounded"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleCustomStringPitchChange(idx, midi - 1)}
                            className="px-1 text-[10px] bg-stone-100 hover:bg-stone-200 rounded"
                          >
                            -
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => playPitch(idx, midi)}
                        className="rounded p-1 text-stone-500 hover:bg-amber-100 hover:text-amber-800"
                        title="試聴"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
