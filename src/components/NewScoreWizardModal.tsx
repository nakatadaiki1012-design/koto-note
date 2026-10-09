/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  KotoScore,
  createNewMeasure,
  getDefaultView,
  TUNING_PRESETS
} from '../types/koto';
import {
  FilePlus,
  Music2,
  Sliders,
  Clock,
  Sparkles,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  X,
  Check
} from 'lucide-react';

interface NewScoreWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateScore: (newScore: KotoScore) => void;
}

export const NewScoreWizardModal: React.FC<NewScoreWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateScore
}) => {
  // Wizard state with sensible defaults
  const [title, setTitle] = useState('無題');
  const [subtitle, setSubtitle] = useState('');
  const [composer, setComposer] = useState('');
  const [stringCount, setStringCount] = useState<13 | 17>(13);
  const [tuningPreset, setTuningPreset] = useState('hira');
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<2 | 3 | 4>(4);
  const [measureCount, setMeasureCount] = useState(8);
  const [tempo, setTempo] = useState(72);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(false);

  if (!isOpen) return null;

  // Primary popular tunings for quick selection
  const popularTunings13 = [
    { id: 'hira', name: '平調子', tag: '最も標準的', desc: '伝統箏曲の基本調弦 (D G A B♭ D...)' },
    { id: 'kumoi', name: '雲井調子', tag: '哀愁・陰音階', desc: '哀愁と風情のある名調弦' },
    { id: 'hira_yon_up', name: '平調子(四を一音上げ)', tag: '荒城の月など', desc: '近代・唱歌に多い調弦' },
    { id: 'honkumoi', name: '本雲井調子', tag: '古典風情', desc: '独特の情緒を漂わせる調弦' },
    { id: 'nakazora', name: '中空調子', tag: '清澄', desc: '六・斗を半音上げ' },
    { id: 'nogi', name: '乃木調子', tag: '近代曲', desc: '陽音階寄りの近代調弦' }
  ];

  const handleBuildAndCreate = () => {
    const is17 = stringCount === 17;
    const selectedPreset = is17 ? 'juushichi_std' : tuningPreset;
    const root = is17 ? 36 : 62;

    const baseView = getDefaultView();
    baseView.layout = layout;

    const newScore: KotoScore = {
      app: 'koto-bunkafu',
      version: 2,
      id: `score_${Date.now()}`,
      title: title.trim() || '無題',
      subtitle: subtitle.trim(),
      composer: composer.trim(),
      tempo,
      beatsPerMeasure,
      stringCount,
      tuning: {
        preset: selectedPreset,
        root,
        custom: null
      },
      view: baseView,
      // Each measure is created with beats of div: 2 (8th-note grid, clean and blank)
      measures: Array.from({ length: measureCount }, () => createNewMeasure(beatsPerMeasure)),
      updatedAt: Date.now()
    };

    onCreateScore(newScore);
    onClose();
  };

  // Quick 1-click instant create with standard settings
  const handleInstantCreateDefault = () => {
    const baseView = getDefaultView();
    baseView.layout = 'vertical';
    const newScore: KotoScore = {
      app: 'koto-bunkafu',
      version: 2,
      id: `score_${Date.now()}`,
      title: '無題',
      subtitle: '',
      composer: '',
      tempo: 72,
      beatsPerMeasure: 4,
      stringCount: 13,
      tuning: {
        preset: 'hira',
        root: 62,
        custom: null
      },
      view: baseView,
      measures: Array.from({ length: 8 }, () => createNewMeasure(4)),
      updatedAt: Date.now()
    };
    onCreateScore(newScore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-3 sm:p-4 backdrop-blur-xs no-print animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-stone-300 shadow-2xl p-5 sm:p-6 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-sm">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-score text-stone-900 leading-tight">
                新しい楽譜を作成
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                調弦や拍子を選んで、空白の譜面を作成します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
            title="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Click Shortcut Banner */}
        <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 border border-emerald-200/80 p-3 flex items-center justify-between gap-2">
          <div className="text-xs text-emerald-950">
            <span className="font-bold flex items-center gap-1 text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> 最も一般的な設定ですぐ開始:
            </span>
            <span className="text-[11px] text-stone-600 mt-0.5 block">
              十三絃・平調子・4拍子・8小節・縦文化譜
            </span>
          </div>
          <button
            onClick={handleInstantCreateDefault}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            すぐ作成
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              曲名 <span className="text-stone-400 font-normal">（後からいつでも変更可能）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="曲名を入力（例: 六段、春の海、オリジナル曲）"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-score"
              autoFocus
            />
            {/* Optional Subtitle / Composer Toggle */}
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                {showAdvancedMeta ? '▲ 副題・作曲者を閉じる' : '▼ 副題・作曲者も入力する'}
              </button>
              {showAdvancedMeta && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-100 animate-fade-in">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-0.5">副題（任意）</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      placeholder="例: 初段、箏独奏"
                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-0.5">作曲者（任意）</label>
                    <input
                      type="text"
                      value={composer}
                      onChange={e => setComposer(e.target.value)}
                      placeholder="例: 八橋検校、宮城道雄"
                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Koto Type & Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* String Count */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                箏の種類
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStringCount(13)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    stringCount === 13
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>十三絃（標準）</span>
                  <span className="text-[10px] font-normal text-stone-500 mt-0.5">一〜巾（一般の箏）</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStringCount(17);
                    setTuningPreset('juushichi_std');
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    stringCount === 17
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>十七絃（低音）</span>
                  <span className="text-[10px] font-normal text-stone-500 mt-0.5">一〜十七（宮城系）</span>
                </button>
              </div>
            </div>

            {/* Layout Direction */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                譜面の向き
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLayout('vertical')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    layout === 'vertical'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <AlignVerticalSpaceAround className="h-3.5 w-3.5" />
                  <span>縦譜（文化譜）</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('horizontal')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    layout === 'horizontal'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <AlignHorizontalSpaceAround className="h-3.5 w-3.5" />
                  <span>横譜（横書き）</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Tuning Preset */}
          {stringCount === 13 ? (
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                調弦（チューニング）
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {popularTunings13.map(t => {
                  const isSelected = tuningPreset === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTuningPreset(t.id)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/90 ring-1 ring-amber-600 shadow-2xs'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-950' : 'text-stone-900'}`}>
                          {t.name}
                        </span>
                        {isSelected && <Check className="h-3 w-3 text-amber-700" />}
                      </div>
                      <span className="text-[10px] text-amber-800/80 font-medium mt-0.5">
                        {t.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-stone-100 p-2.5 text-xs text-stone-700">
              <span className="font-bold">十七絃標準調弦:</span> 低音C2〜D5（宮城道雄考案の十七絃標準調弦で作成されます）
            </div>
          )}

          {/* 4. Beats & Measures count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100">
            {/* Time signature */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                拍子
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[4, 3, 2].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBeatsPerMeasure(b as any)}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      beatsPerMeasure === b
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {b}/4 拍子
                  </button>
                ))}
              </div>
            </div>

            {/* Measures count */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                初期小節数
              </label>
              <div className="flex items-center gap-1">
                {[8, 12, 16, 24].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setMeasureCount(cnt)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      measureCount === cnt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {cnt}小節
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Tempo */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              テンポ: ♩={tempo}
            </span>
            <div className="flex items-center gap-1.5">
              {[60, 72, 80, 96].map(tVal => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setTempo(tVal)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    tempo === tVal
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleBuildAndCreate}
            className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FilePlus className="h-4 w-4" />
            <span>空白の楽譜を作成</span>
          </button>
        </div>
      </div>
    </div>
  );
};
