/** MOCK thresholds only. Rank is derived, never persisted or converted from merit. */
export const CONTRIBUTION_RANKS=Object.freeze([
    {level:1,threshold:0},{level:2,threshold:100},{level:3,threshold:500},
    {level:4,threshold:2000},{level:5,threshold:10000},
] as const);
export type ContributionLevel=typeof CONTRIBUTION_RANKS[number]['level'];
export function contributionRank(score:number,ranks:readonly {level:ContributionLevel;threshold:number}[]=CONTRIBUTION_RANKS){
    let rank=ranks[0];for(const candidate of ranks)if(score>=candidate.threshold)rank=candidate;return rank;
}
/** Stable arrival-order ties match the existing seating comparator, including the waiting list. */
export function topContributors<T extends {id:string;contributionScore:number}>(users:readonly T[],limit=10):T[]{
    return users.map((user,arrival)=>({user,arrival})).sort((a,b)=>b.user.contributionScore-a.user.contributionScore||a.arrival-b.arrival).slice(0,limit).map(a=>a.user);
}
