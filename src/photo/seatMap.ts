/** Measured lotus centers on each real red/gold cushion of the owner's new PNG. */
export const SEAT_IMAGE = {width:1086,height:1448,
    src:'/images/476F2A78-424C-424C-8954-C43DFEC82BC7.png'} as const;
const ROWS = [
    {y:842, height:22, xs:[272,322,372,424,472,612,662,712,763,815]},
    {y:864, height:25, xs:[250,304,357,411,465,621,675,729,784,837]},
    {y:888, height:28, xs:[226,285,342,401,459,629,687,746,803,860]},
    {y:912, height:31, xs:[202,265,329,392,453,636,699,762,825,887]},
    {y:940, height:35, xs:[177,245,313,381,448,641,709,778,845,913]},
    {y:976, height:39, xs:[149,222,295,368,441,646,720,793,866,940]},
    {y:1015,height:44, xs:[122,198,275,353,429,656,735,813,891,969]},
    {y:1058,height:50, xs:[95,176,258,341,420,663,745,828,911,994]},
    {y:1108,height:57, xs:[66,153,240,328,414,672,760,848,933,1022]},
    {y:1164,height:64, xs:[40,132,225,315,402,680,771,863,957,1048]},
    {y:1224,height:73, xs:[114,213,309,393,690,781,882,980]},
] as const;
export type Seat = Readonly<{
    id:string; x:number; y:number; scale:number; width:number; row:number;
    zone:`${'front'|'middle'|'rear'}-${'left'|'right'}`; rankPriority:number;
}>;
/** x/y are normalized floor contacts; scale is figure height / image height. */
export const SEAT_MAP:readonly Seat[] = Object.freeze(ROWS.flatMap((line,row)=>line.xs.map((px,column)=>{
    const x=px/SEAT_IMAGE.width, side=x<.5?'left':'right';
    const depth=row<5?'front':row<10?'middle':'rear';
    return Object.freeze({id:`cushion-${row+1}-${column+1}`,x,y:line.y/SEAT_IMAGE.height,
        scale:line.height/SEAT_IMAGE.height,width:Math.max(24,line.height*.8)/SEAT_IMAGE.width,
        row,zone:`${depth}-${side}` as Seat['zone'],
        rankPriority:(ROWS.length-row)*1000+Math.round((1-Math.abs(x-.5)*2)*100)});
})));
export type SeatingUser = {id:string; contributionScore:number};
/** Stable ties preserve arrival order. No nickname identity or mutation of inputs. */
export function assignSeats<T extends SeatingUser>(users:readonly T[],seats:readonly Seat[]=SEAT_MAP) {
    const ids=new Set<string>();
    for(const user of users) {
        if(typeof user.id!=='string'||!user.id.trim()||user.id!==user.id.trim()||ids.has(user.id)||!Number.isFinite(user.contributionScore)||user.contributionScore<0)
            throw Error('Invalid seating user');
        ids.add(user.id);
    }
    const ranked=users.map((user,arrival)=>({user,arrival})).sort((a,b)=>b.user.contributionScore-a.user.contributionScore||a.arrival-b.arrival);
    const priority=[...seats].sort((a,b)=>b.rankPriority-a.rankPriority||a.id.localeCompare(b.id));
    return {seated:ranked.slice(0,priority.length).map(({user},i)=>({user,seat:priority[i]})),
        waiting:ranked.slice(priority.length).map(({user})=>user)};
}
/** Exact centered contain projection: never compress/move rows for UI. */
export function projectSeats(width:number,height:number,aspect:number) {
    if(![width,height,aspect].every(n=>Number.isFinite(n)&&n>0)) throw Error('Invalid photo bounds');
    const imageHeight=Math.min(height,width/aspect),imageWidth=imageHeight*aspect;
    const left=(width-imageWidth)/2,top=(height-imageHeight)/2;
    return SEAT_MAP.map(seat=>({...seat,imageWidth,x:left+seat.x*imageWidth,y:top+(seat.y-seat.scale)*imageHeight,
        width:seat.width*imageWidth,height:seat.scale*imageHeight,
        labelWidth:Math.min(64,Math.max(38,seat.width*imageWidth+12))}));
}
export type ProjectedSeat = ReturnType<typeof projectSeats>[number];
export type LabelObstacle = {left:number;right:number;top:number;bottom:number};
/** Every occupied seat gets a name behind its figure, above the head.
 * Pack around chat/footer without moving avatars. Physical ordering is stable.
 */
export function layoutSeatLabels(seats:readonly ProjectedSeat[],frameWidth:number,
    options:{bottom?:number;blocked?:readonly LabelObstacle[]}={}) {
    const labels=new Map<string,{x:number;y:number;width:number;height:number;fontSize:number}>();
    const rows=[...new Set(seats.map(s=>s.row))].sort((a,b)=>b-a);
    const compact=(seats[0]?.imageWidth??frameWidth)<600;
    const height=compact?10:12,fontSize=compact?8:9,gap=3;
    const blocked=options.blocked??[];
    let nextTop=options.bottom??Infinity;
    for(const row of rows) {
        const members=seats.filter(s=>s.row===row);
        let y=Math.min(Math.min(...members.map(s=>s.y))-height-2,nextTop-height-1);
        const groups=(['left','right'] as const).map(side=>({side,seats:members.filter(s=>s.zone.endsWith(side)).sort((a,b)=>a.x-b.x)}));
        const bandsFor=(side:'left'|'right')=>{
            const wing=members.filter(s=>s.zone.endsWith(side));
            const imageLeft=(frameWidth-(members[0]?.imageWidth??frameWidth))/2;
            let bands=side==='left'?[[imageLeft+2,Math.max(...wing.map(s=>s.x+s.width/2))]]:
                [[Math.min(...wing.map(s=>s.x-s.width/2)),frameWidth-imageLeft-2]];
            for(const box of blocked.filter(b=>y<b.bottom&&y+height>b.top)) {
                bands=bands.flatMap(([l,r])=>box.right<=l||box.left>=r?[[l,r]]:
                    [[l,Math.min(r,box.left-3)],[Math.max(l,box.right+3),r]].filter(([a,b])=>b>a));
            }
            return bands;
        };
        // A full-width long comment can require the label row to move above it.
        for(let attempt=0;attempt<=blocked.length;attempt++) {
            if(groups.every(g=>!g.seats.length||bandsFor(g.side).some(([l,r])=>r-l>=g.seats.length*28+(g.seats.length-1)*gap))) break;
            const active=blocked.filter(b=>y<b.bottom&&y+height>b.top);
            if(!active.length) break;
            y=Math.min(...active.map(b=>b.top))-height-2;
        }
        nextTop=y;
        for(const {side,seats:group} of groups) {
            if(!group.length) continue;
            const center=group.reduce((sum,s)=>sum+s.x,0)/group.length;
            const bands=bandsFor(side).filter(([l,r])=>r-l>=group.length*28+(group.length-1)*gap);
            const [l,r]=bands.sort((a,b)=>Math.abs((a[0]+a[1])/2-center)-Math.abs((b[0]+b[1])/2-center))[0]??(side==='left'?[2,frameWidth/2-3]:[frameWidth/2+3,frameWidth-2]);
            const nearestGap=group.length>1?Math.min(...group.slice(1).map((s,i)=>s.x-group[i].x)):Infinity;
            const width=Math.min(64,Math.max(28,nearestGap-gap),Math.min(...group.map(s=>s.labelWidth)),(r-l-gap*(group.length-1))/group.length);
            const positions:number[]=[];
            for(const [i,seat] of group.entries()) positions.push(Math.max(l+width/2,seat.x,i?positions[i-1]+width+gap:-Infinity));
            for(let i=positions.length-1;i>=0;i--) positions[i]=Math.min(positions[i],r-width/2,i<positions.length-1?positions[i+1]-width-gap:Infinity);
            for(const [i,seat] of group.entries()) labels.set(seat.id,{x:positions[i],y,width,height,fontSize});
        }
    }
    return labels;
}
