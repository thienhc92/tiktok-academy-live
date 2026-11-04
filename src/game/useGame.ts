import { t } from '../i18n/vi';
import { useEffect, useState } from 'react';
import { createGame, parseProgress, saveProgress, STORAGE_KEY } from './engine';
import { receive } from '../missions/rules';
import type { GameState, LiveEvent } from './engine';

export function useGame(nicknames: string[], remote?:{enabled:boolean;game:GameState|null}) {
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
  function dispatch(event: LiveEvent & {text?:string}) { if(remote?.enabled)return; setGame(state => receive(state, {...event,...(event.kind==='comment'?{text:event.text??'Bình luận mô phỏng '+event.id.slice(-8)}:{})}, Date.now())); }
  function update(reducer:(state:GameState)=>GameState){if(!remote?.enabled)setGame(reducer);}
  const [empty] = useState(()=>createGame([]));
  return { game:remote?.enabled?(remote.game??empty):game, dispatch, update, storageWarning:remote?.enabled?'':storageWarning };
}
