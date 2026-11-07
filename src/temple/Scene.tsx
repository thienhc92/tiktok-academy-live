import {useEffect,useState} from 'react';
import { TEMPLE_PEOPLE, visitorLayout } from './model';
export function TempleScene({ selected, onSelect }: {
    selected: string;
    onSelect: (id: string) => void;
}) {
    const [hidden,setHidden]=useState(document.hidden);
    useEffect(()=>{const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
    return <div className="temple-congregation" data-hidden={hidden}>{TEMPLE_PEOPLE.map((person, index) => {
            const layout = visitorLayout(index), image = index < 3 || index >= 50 ? '/temple/devotee-standing.webp' : '/temple/devotee-realistic.webp';
            return <button key={person.id} className={`temple-visitor ${selected === person.id ? 'is-selected' : ''} ${index < 3 ? 'front-visitor' : ''}`} style={{ left: `${layout.x * 100}%`, top: `${layout.y * 100}%`, height: `${layout.height * 100}%`, zIndex: layout.layer, animationDelay: `${index % 9 * -.7}s` }} onClick={() => onSelect(person.id)} aria-label={person.name} aria-pressed={selected === person.id} title={person.name}>
 <span className="visitor-shadow" aria-hidden="true"/><img className="visitor-reflection" src={image} alt="" aria-hidden="true" draggable={false}/><img className="visitor-figure" src={image} alt="" draggable={false}/>
 <span className="temple-name"><span className="visitor-profile" style={{ backgroundColor: ['#584d39', '#9e7785', '#678282', '#a3854f'][index % 4], backgroundPosition: `${index % 3 * 50}% ${index % 5 * 15}%` }}></span><span className="visitor-rank">{index % 5 + 1}</span><span className="temple-person-name"><b>{person.name}</b><i><em /></i></span><small>{index % 3 === 0 ? '🌹' : '●'}</small></span>
 </button>;
        })}</div>;
}
