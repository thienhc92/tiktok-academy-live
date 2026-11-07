export type RitualKind='bow'|'incense'|'flower';
export type RitualCue={id:string;userId:string;kind:RitualKind;createdAt:number;expiresAt:number};
export const RITUAL_LIMIT=6;
export const RITUAL_DURATION={bow:2200,incense:2800,flower:2400} as const;
export function ritualCue(id:string,userId:string,kind:RitualKind,now:number):RitualCue{return {id,userId,kind,createdAt:now,expiresAt:now+RITUAL_DURATION[kind]};}
export function enqueueRitual(current:readonly RitualCue[],cue:RitualCue,now:number):RitualCue[]{
    const active=current.filter(c=>c.expiresAt>now);
    if(cue.expiresAt<=now||active.some(c=>c.id===cue.id)||active.length>=RITUAL_LIMIT)return active;
    // Coalesce repeated gestures for the same person; different offerings may coexist.
    if(cue.kind!=='flower'&&active.some(c=>c.userId===cue.userId&&c.kind===cue.kind))return active;
    return [...active,cue];
}
export function projectRitualPoint(x:number,y:number,width:number,height:number,aspect:number){
    const h=Math.min(height,width/aspect),w=h*aspect;
    return {x:(width-w)/2+x*w,y:(height-h)/2+y*h};
}
// Original-image anchors, below all three faces; no background or seat coordinates are edited.
export const RITUAL_ANCHORS={incense:{x:543/1086,y:799/1448},flowers:[{x:475/1086,y:790/1448},{x:612/1086,y:790/1448}]} as const;
