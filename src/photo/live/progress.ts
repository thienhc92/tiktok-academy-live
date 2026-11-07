import {contributionRank} from './ranks.ts';
import type {ContributionLevel} from './ranks.ts';
import type {ProjectedSeat} from '../seatMap.ts';
export const PROGRESS_LIMIT=6,PROGRESS_DURATION_MS=2400;
export type ProgressCue={id:string;userId:string;meritDelta:number;rankLevel?:ContributionLevel;noticeId?:string;createdAt:number;expiresAt:number};
export function progressCue(id:string,userId:string,meritDelta:number,beforeContribution:number,afterContribution:number,now:number):ProgressCue|undefined {
    const before=contributionRank(beforeContribution).level,after=contributionRank(afterContribution).level;
    if(meritDelta<=0&&after<=before)return;
    return {id,userId,meritDelta:Math.max(0,meritDelta),...(after>before?{rankLevel:after}:{}),createdAt:now,expiresAt:now+PROGRESS_DURATION_MS};
}
export function enqueueProgress(current:readonly ProgressCue[],cue:ProgressCue,now:number):ProgressCue[]{
    const active=current.filter(c=>c.expiresAt>now);if(cue.expiresAt<=now||active.some(c=>c.id===cue.id))return active;
    const old=active.find(c=>c.userId===cue.userId);
    if(old)return active.map(c=>c!==old?c:{...old,id:cue.id,meritDelta:old.meritDelta+cue.meritDelta,
        noticeId:cue.rankLevel?cue.noticeId:old.noticeId,
        rankLevel:cue.rankLevel&&cue.rankLevel>(old.rankLevel??0)?cue.rankLevel:old.rankLevel,
        expiresAt:cue.rankLevel&&cue.rankLevel>(old.rankLevel??0)?cue.expiresAt:old.expiresAt});
    if(active.length<PROGRESS_LIMIT)return [...active,cue];
    if(!cue.rankLevel)return active;
    const replace=active.findIndex(c=>!c.rankLevel);return [...active.filter((_,i)=>i!==(replace<0?0:replace)),cue];
}
/** Keep tiny feedback inside the cushion wing, including its glow; never enter the carpet. */
export function progressPosition(label:{x:number;y:number},seat:ProjectedSeat,slots:readonly ProjectedSeat[],frameWidth:number,width:number){
    const peers=slots.filter(s=>s.row===seat.row&&s.zone===seat.zone),leftWing=seat.zone.endsWith('left');
    const imageLeft=(frameWidth-seat.imageWidth)/2;
    const left=leftWing?imageLeft+8:Math.min(...peers.map(s=>s.x-s.width/2))+8;
    const right=leftWing?Math.max(...peers.map(s=>s.x+s.width/2))-8:imageLeft+seat.imageWidth-8;
    const boxWidth=Math.min(width,right-left);
    return {x:Math.max(left+boxWidth/2,Math.min(right-boxWidth/2,label.x)),y:label.y-18,width:boxWidth};
}
