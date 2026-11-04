import { t } from '../i18n/vi';
import { useEffect, useState } from 'react';
import { applyEvent, createGame, parseProgress, saveProgress, STORAGE_KEY } from './engine';
import type { GameState, LiveEvent } from './engine';

export function useGame(nicknames: string[]) {
  const [initial] = useState(() => {
    const fallback = createGame(nicknames);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return { state: fallback, writable: true, warning: '' };
      const saved = parseProgress(raw);
      if (saved) return { state: saved, writable: true, warning: '' };
      return { state: fallback, writable: false, warning: t("Saved progress is unreadable. Temporary session active; existing save preserved.") };
    } catch {
      return { state: fallback, writable: false, warning: t("Storage unavailable. Progress lasts only for this session.") };
    }
  });
  const [game, setGame] = useState(initial.state);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  useEffect(() => {
    if (!initial.writable) return;
    try { saveProgress(window.localStorage, game); setStorageWarning(''); }
    catch { setStorageWarning(t("Progress could not be saved. Keep this tab open; storage may be full or disabled.")); }
  }, [game, initial.writable]);
  function dispatch(event: LiveEvent) { setGame(state => applyEvent(state, event)); }
  function update(reducer:(state:GameState)=>GameState){setGame(reducer);}
  return { game, dispatch, update, storageWarning };
}
