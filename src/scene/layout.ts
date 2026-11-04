export type LabelRect={x:number;y:number;width:number;height:number;selected?:boolean};
export function visibleLabels(labels:LabelRect[]):number[]{
 const kept:number[]=[];
 const order=labels.map((_,i)=>i).sort((a,b)=>Number(Boolean(labels[b].selected))-Number(Boolean(labels[a].selected))||labels[b].y-labels[a].y);
 for(const i of order){const a=labels[i];if(!kept.some(j=>{const b=labels[j];return a.x<b.x+b.width+2&&a.x+a.width+2>b.x&&a.y<b.y+b.height+2&&a.y+a.height+2>b.y;}))kept.push(i);}
 return kept;
}
export function cameraDistance(aspect:number){return Math.max(22,11.5/(2*Math.tan(Math.PI/8)*Math.max(.25,aspect)));}
