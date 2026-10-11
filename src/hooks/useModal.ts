/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

/**
 * ポップアップ（モーダル）の共通の動き。
 * - Esc キーで閉じる
 * - 開いたときにボタンのフォーカスを外す（Space や Enter で裏のボタンが動かないように）
 * - 閉じたら、開く前にフォーカスのあった場所へ戻す
 */
export function useModal(isOpen: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    previous?.blur?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      if (previous && document.contains(previous)) previous.focus?.();
    };
  }, [isOpen]);
}
