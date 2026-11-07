import React from 'react';
import {t} from '../i18n/vi';
import {progressPosition} from './live/progress';
import type {ProgressCue} from './live/progress';
import type {ProjectedSeat} from './seatMap';
import './progress.css';
export function ProgressEffects({cues,slots,labels,names,allSlots,width}:{cues:readonly ProgressCue[];slots:ReadonlyMap<string,ProjectedSeat>;labels:ReadonlyMap<string,{x:number;y:number;width:number;height:number}>;names:ReadonlyMap<string,string>;allSlots:readonly ProjectedSeat[];width:number}){
    const latest=[...cues].reverse().find(c=>c.rankLevel)||[...cues].reverse().find(c=>!slots.has(c.userId));
    return <><div className="pl-progress-effects" aria-hidden="true">{cues.map(cue=>{
        const seat=slots.get(cue.userId),label=seat&&labels.get(seat.id);if(!seat||!label)return null;
        const reward=cue.meritDelta>0?'+'+cue.meritDelta:t('Temple contribution delta',cue.contributionDelta);
        const symbol=cue.giftCoins===5||cue.giftCoins===30||cue.rankLevel?'🪷':null;
        const size=Math.min(110,Math.max(24,reward.length*6+(symbol?18:0)));
        const position=progressPosition(label,seat,allSlots,width,size,[...labels.values()]);
        return <span className="pl-merit-feedback" key={`${cue.userId}:${cue.createdAt}`} data-for-viewer-id={cue.userId} data-promotion={cue.rankLevel} style={{left:position.x,top:position.y,width:position.width}}><b>{reward}</b>{symbol&&<i data-gift-coins={cue.giftCoins}>{symbol}</i>}</span>;
    })}</div>{latest&&<p className="pl-progress-notice" role="status">{latest.rankLevel?t('Temple contribution promoted',names.get(latest.userId)??'',t('Temple contribution rank '+latest.rankLevel)):latest.meritDelta>0?t('Temple merit received',names.get(latest.userId)??'',latest.meritDelta):t('Temple contribution received',names.get(latest.userId)??'',latest.contributionDelta)}</p>}</>;
}
