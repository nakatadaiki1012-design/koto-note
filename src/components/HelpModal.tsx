/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, Keyboard, Music2, Info } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-700" />
            <h2 className="text-xl font-bold font-score text-stone-900">使い方と文化譜の手引き</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm text-stone-700">
          {/* Bunkafu Concept */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Info className="h-4 w-4 text-amber-700" /> 文化譜（数字譜）の読み方と特徴
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-600 leading-relaxed">
              <li>
                <strong>縦書き（右から左）</strong>: 日本の伝統的な文化譜の形式です。列が右から左に進み、各列に小節が上から下へ並びます。
              </li>
              <li>
                <strong>十三の弦</strong>: 一、二、三、四、五、六、七、八、九、十、斗（とう）、為（い）、巾（きん）の13本です。
              </li>
              <li>
                <strong>マスの分割</strong>: 1拍の中に4分（全枠）、8分（上下2段）、3連符（3段）、16分（4枠）が入ります。
              </li>
              <li>
                <strong>空マスは延ばし</strong>: 音が入っていないマスは前の音を延ばす意味になります。音を止めたい場合は「○（休符）」を入れます。
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts Table */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Keyboard className="h-4 w-4 text-indigo-700" /> キーボード操作一覧
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-300 text-stone-500">
                    <th className="py-2 pr-4 font-semibold">操作</th>
                    <th className="py-2 font-semibold">キー</th>
                    <th className="py-2 pl-4 font-semibold">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">弦 一〜巾（数字列）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">1</kbd>〜<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">0</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">-</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">^</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">¥</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">一〜十、斗、為、巾</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">弦 一〜巾（ホーム段）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">A</kbd>〜<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">]</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">@</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">ホームポジションで素早く入力</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">音の長さ</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Q</kbd> 4分 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">W</kbd> 8分 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">E</kbd> 3連 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">R</kbd> 16分</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">次の音符にも長さが引き継がれます</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">和音（合わせ手）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd> + 弦キー</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">同じ拍に複数の音を重ねて入力</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">休符 / 延ばし</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">P</kbd> または <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">.</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">T</kbd> または <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">,</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">○（休符） / ー（タイ・延ばし）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">押し手（半音/全音）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Z</kbd> 半音(オ) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">X</kbd> 全音(ヲ)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">左手で琴柱の左側を押して音程を上げる</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">後押し・押し放し</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Y</kbd> (ア) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">U</kbd> (ハ)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">弾いてから上げる / 押して弾き放す</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">引き色・突き色・揺り色</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">I</kbd> (ヒ) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">O</kbd> (ツ) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">M</kbd> (ユ)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">余韻の繊細な音程変化やビブラート</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">スクイ・掻・引・〰・流</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">C</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">V</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">B</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">N</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">/</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">右手の爪技法（再生にも反映）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">再生 / 停止</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Space</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Esc</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500"><kbd className="bg-stone-100 border px-1 py-0.5 rounded text-[10px]">Shift+Space</kbd>でカーソル位置から再生</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">複数小節の選択</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd> + 小節クリック</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">範囲コピー、貼り付け、削除、ループ再生</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">元に戻す / やり直し</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Z</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Y</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">アンドゥ・リドゥ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
