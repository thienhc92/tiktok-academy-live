import {assignSeats,SEAT_MAP} from '../seatMap.ts';
import type {SeatingUser} from '../seatMap.ts';
export const SEAT_REBALANCE_MS=5000;
export type SeatPlan={assigned:{userId:string;seatId:string}[];signature:string;rankedAt:number;pending:boolean};
const signature=(users:readonly SeatingUser[])=>JSON.stringify(users.map(u=>[u.id,u.contributionScore]));
export function initialSeatPlan(users:readonly SeatingUser[],now:number):SeatPlan {
    return {assigned:assignSeats(users).seated.map(({user,seat})=>({userId:user.id,seatId:seat.id})),signature:signature(users),rankedAt:now,pending:false};
}
export function updateSeatPlan(plan:SeatPlan,users:readonly SeatingUser[],now:number):SeatPlan {
    const nextSignature=signature(users),dirty=plan.pending||nextSignature!==plan.signature;
    if(dirty&&now-plan.rankedAt>=SEAT_REBALANCE_MS)return initialSeatPlan(users,now);
    if(nextSignature===plan.signature)return plan;
    // Fill vacancies immediately, but retain every other occupied seat until the ranking tick.
    const ranked=assignSeats(users),active=new Set(users.map(u=>u.id));
    const assigned=plan.assigned.filter(a=>active.has(a.userId));
    const seated=new Set(assigned.map(a=>a.userId)),used=new Set(assigned.map(a=>a.seatId));
    const available=[...SEAT_MAP].filter(s=>!used.has(s.id)).sort((a,b)=>b.rankPriority-a.rankPriority||a.id.localeCompare(b.id));
    const queue=[...ranked.seated.map(a=>a.user),...ranked.waiting].filter(u=>!seated.has(u.id));
    for(const [i,user]of queue.slice(0,available.length).entries())assigned.push({userId:user.id,seatId:available[i].id});
    return {...plan,assigned,signature:nextSignature,pending:dirty};
}
