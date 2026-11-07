import React from 'react';
import {t} from '../i18n/vi';
import {progressPosition} from './live/progress';
import type {ProgressCue} from './live/progress';
import type {ProjectedSeat} from './seatMap';
import './progress.css';
export function ProgressEffects({cues,slots,labels,names,allSlots,width}:{cues:readonly ProgressCue[];slots:ReadonlyMap<string,ProjectedSeat>;labels:ReadonlyMap<string,{x:number;y:number}>;names:ReadonlyMap<string,string>;allSlots:readonly ProjectedSeat[];width:number}){
    const latest=[...cues].reverse().find(c=>c.rankLevel)||[...cues].reverse().find(c=>!slots.has(c.userId));
    return <><div className="pl-progress-effects" aria-hidden="true">{cues.map(cue=>{
        const seat=slots.get(cue.userId),label=seat&&labels.get(seat.id);if(!seat||!label)return null;
        const size=Math.min(64,Math.max(24,(cue.meritDelta?String(cue.meritDelta).length*7+13:0)+(cue.rankLevel?18:0)));
        const position=progressPosition(label,seat,allSlots,width,size);
        return <span className="pl-merit-feedback" key={`${cue.userId}:${cue.createdAt}`} data-for-viewer-id={cue.userId} data-promotion={cue.rankLevel} style={{left:position.x,top:position.y,width:position.width}}>{cue.meritDelta>0&&<b>+{cue.meritDelta}</b>}{cue.rankLevel&&<i>🪷</i>}</span>;
    })}</div>{latest&&<p className="pl-progress-notice" role="status">{latest.rankLevel?t('Temple contribution promoted',names.get(latest.userId)??'',t('Temple contribution rank '+latest.rankLevel)):t('Temple merit received',names.get(latest.userId)??'',latest.meritDelta)}</p>}</>;
}
