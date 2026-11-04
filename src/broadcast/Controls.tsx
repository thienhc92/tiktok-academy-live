import { t } from '../i18n/vi';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { toggleFullscreen } from './fullscreen';

export function BroadcastControls({ broadcast, open, onOpen, onEnter, onExit, simulationControls }: {
  broadcast: boolean; open: boolean; onOpen: (open: boolean) => void;
  onEnter: () => void; onExit: () => void; simulationControls: ReactNode;
}) {
  const [message, setMessage] = useState('');
  async function fullscreen() {
    setMessage(await toggleFullscreen({
      active: Boolean(document.fullscreenElement),
      enter: document.documentElement.requestFullscreen ? () => document.documentElement.requestFullscreen() : undefined,
      exit: document.exitFullscreen ? () => document.exitFullscreen() : undefined,
    }));
  }
  if (!broadcast) return <nav className="mode-switch" aria-label={t("Presentation mode")}>
    <button aria-pressed="true">{t("Admin Mode")}</button>
    <button className="enter-broadcast" onClick={() => { setMessage(''); onOpen(false); onEnter(); }}>{t("Enter Broadcast")}</button>
  </nav>;
  return <div className="broadcast-tools">
    {!open ? <button className="show-broadcast-tools" aria-label={t("Show broadcast controls")} onClick={() => onOpen(true)}>{t("Controls")}</button> :
      <div className="broadcast-tool-panel" role="group" aria-label={t("Broadcast controls")}>
        <div className="broadcast-tool-buttons">
          {simulationControls}
          <button onClick={onExit}>{t("Admin Mode")}</button>
          <button onClick={fullscreen}>{t("Fullscreen")}</button>
          <button onClick={() => { setMessage(''); onOpen(false); }}>{t("Hide controls")}</button>
        </div>
        {message && <p role="status">{message}</p>}
      </div>}
  </div>;
}
