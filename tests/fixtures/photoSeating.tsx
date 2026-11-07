// Local browser fixture only: not a production Vite entry or application control.
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PhotoLive} from '../../src/photo/PhotoLive';
import {LIVE_ROSTER} from '../../src/photo/liveModel';
import {SEAT_IMAGE,SEAT_MAP} from '../../src/photo/seatMap';
import '../../src/photo/style.css';
const count=Number(new URLSearchParams(location.search).get('count')??20);
if(!Number.isInteger(count)||count<1||count>SEAT_MAP.length)throw Error('Invalid fixture occupancy');
function Fixture(){
    const [operator,setOperator]=useState(false);
    return <main className="photo-app photo-live-active"><section className="photo-stage photo-live-stage">
        <img src={SEAT_IMAGE.src} alt="Đại Hùng Điện"/>
        <PhotoLive photoAspect={SEAT_IMAGE.width/SEAT_IMAGE.height} initialVisitors={LIVE_ROSTER.slice(0,count).map(p=>p.id)} operator={operator} onControls={()=>setOperator(v=>!v)}/>
    </section></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
