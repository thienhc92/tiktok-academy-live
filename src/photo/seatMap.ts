/** Measured cushion contact points on the owner's unchanged 1086×1448 PNG.
 * Tiny fragments whose cushion centers lie outside the image are not usable seats.
 */
export const SEAT_IMAGE = {width:1086,height:1448} as const;
const ROWS = [
    {y:794, height:16, xs:[324,375,425,475,611,662,713,764]},
    {y:807, height:17, xs:[310,365,420,473,617,674,730,786]},
    {y:820, height:19, xs:[294,352,410,467,624,684,744,804]},
    {y:834, height:21, xs:[275,337,400,461,631,696,759,825]},
    {y:850, height:24, xs:[255,322,390,455,638,708,776,844]},
    {y:867, height:28, xs:[232,305,377,446,646,721,791,861]},
    {y:888, height:32, xs:[207,286,362,436,654,733,809,882]},
    {y:912, height:36, xs:[179,265,345,424,665,748,829,909]},
    {y:939, height:41, xs:[144,236,325,413,676,765,853,941]},
    {y:972, height:47, xs:[110,210,305,399,688,783,877,974]},
    {y:1012,height:54, xs:[69,174,278,382,707,814,918,1026]},
    {y:1058,height:61, xs:[26,140,252,364,724,837,948,1060]},
    {y:1114,height:70, xs:[87,216,345,752,881,1014]},
    {y:1186,height:80, xs:[40,182,322,758,909,1054]},
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
    return SEAT_MAP.map(seat=>({...seat,x:left+seat.x*imageWidth,y:top+(seat.y-seat.scale)*imageHeight,
        width:seat.width*imageWidth,height:seat.scale*imageHeight,
        labelWidth:Math.min(64,Math.max(38,seat.width*imageWidth+12))}));
}
export type ProjectedSeat = ReturnType<typeof projectSeats>[number];
/** Show noncolliding labels; selected user first, then contribution ranking.
 * Other names remain available on tap/hover and in the simulator's selector.
 */
export function visibleSeatLabels(seats:readonly ProjectedSeat[],selectedId:string|undefined,frameWidth:number) {
    const labels=new Map<string,{x:number;width:number}>();
    const rectangles:{left:number;right:number;top:number;bottom:number}[]=[];
    const ordered=[...seats].sort((a,b)=>Number(b.id===selectedId)-Number(a.id===selectedId));
    for(const seat of ordered) {
        const x=Math.max(seat.labelWidth/2+2,Math.min(frameWidth-seat.labelWidth/2-2,seat.x));
        const rect={left:x-seat.labelWidth/2-2,right:x+seat.labelWidth/2+2,top:seat.y+seat.height,bottom:seat.y+seat.height+12};
        if(rectangles.some(r=>rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top)) continue;
        labels.set(seat.id,{x,width:seat.labelWidth});rectangles.push(rect);
    }
    return labels;
}
