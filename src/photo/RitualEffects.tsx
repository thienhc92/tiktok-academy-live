import React from 'react';
import {projectRitualPoint,RITUAL_ANCHORS} from './live/rituals';
import type {RitualCue} from './live/rituals';
import type {ProjectedSeat} from './seatMap';
import './rituals.css';
export function RitualEffects({cues,slots,width,height,aspect}:{cues:readonly RitualCue[];slots:ReadonlyMap<string,ProjectedSeat>;width:number;height:number;aspect:number}){
    const incense=projectRitualPoint(RITUAL_ANCHORS.incense.x,RITUAL_ANCHORS.incense.y,width,height,aspect);
    const incenseCue=[...cues].reverse().find(c=>c.kind==='incense');
    return <div className="pl-ritual-effects" aria-hidden="true">
        {incenseCue&&<div key={incenseCue.id} className="pl-incense-effect" style={{left:incense.x,top:incense.y}}><i className="pl-incense-sticks"/><i className="pl-smoke"/><i className="pl-smoke pl-smoke-second"/></div>}
        {cues.filter(c=>c.kind==='flower').map(cue=>{
            const slot=slots.get(cue.userId);if(!slot)return null;
            const anchor=RITUAL_ANCHORS.flowers[Array.from(cue.userId).reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%2],target=projectRitualPoint(anchor.x,anchor.y,width,height,aspect);
            const x=slot.x,y=slot.y+slot.height,dx=target.x-x,dy=target.y-y;
            return <span className="pl-lotus-offering" key={cue.id} style={{left:x,top:y,'--ritual-dx':`${dx}px`,'--ritual-dy':`${dy}px`,'--ritual-mid-x':`${dx*.45}px`,'--ritual-mid-y':`${dy*.6}px`} as React.CSSProperties}>🪷</span>;
        })}
    </div>;
}
