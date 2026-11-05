import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { FrameDriver } from '../broadcast/FrameDriver';
import { TEMPLE_PEOPLE, templePosition } from './model';
import { t } from '../i18n/vi';
function CameraFit() {
    const { camera, size } = useThree();
    useEffect(() => {
        camera.position.set(0, 12, 19);
        camera.lookAt(0, 0, 0);
        if ('zoom' in camera)
            camera.zoom = Math.min(size.width / 9.6, size.height / 5.6);
        camera.updateProjectionMatrix();
    }, [camera, size]);
    return null;
}
function Visitor({ index, selected, onSelect }: {
    index: number;
    selected: boolean;
    onSelect: () => void;
}) {
    const ref = useRef<Group>(null), reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)'));
    useFrame(({ clock }) => {
        if (ref.current && !reduced.current.matches)
            ref.current.rotation.z = Math.sin(clock.elapsedTime * .65 + index) * .012;
    });
    return <group position={templePosition(index)} onClick={event => {
        event.stopPropagation();
        onSelect();
    }}>
 <group ref={ref}>
 <mesh position={[0, .16, .12]} scale={[.42, .16, .37]}><sphereGeometry args={[1, 12, 8]}/><meshStandardMaterial color="#969ba5" roughness={.9}/></mesh>
 <mesh position={[0, .51, 0]}><cylinderGeometry args={[.18, .34, .66, 12]}/><meshStandardMaterial color={selected ? '#c0c6cc' : '#a4a9b2'} roughness={.9}/></mesh>
 <mesh position={[0, .94, -.025]}><sphereGeometry args={[.17, 12, 10]}/><meshStandardMaterial color="#caaa8e" roughness={.85}/></mesh>
 <mesh position={[0, 1.005, .018]} scale={[1, 1, .9]}><sphereGeometry args={[.174, 12, 8, 0, Math.PI * 2, 0, 1.85]}/><meshStandardMaterial color={index % 4 === 0 ? '#635549' : '#312c27'} roughness={.9}/></mesh>
 {index % 3 !== 0 && <mesh position={[0, 1.085, .13]}><sphereGeometry args={[.08, 8, 8]}/><meshStandardMaterial color="#342d27"/></mesh>}
 {[-1, 1].map(side => <mesh key={side} position={[side * .235, .57, -.01]} rotation={[.25, 0, side * .24]}><capsuleGeometry args={[.085, .32, 4, 8]}/><meshStandardMaterial color={selected ? '#c0c6cc' : '#a4a9b2'}/></mesh>)}
 <mesh position={[0, .57, .197]}><boxGeometry args={[.012, .48, .012]}/><meshStandardMaterial color="#787e8b"/></mesh>
 </group>
 {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .012, .08]}><ringGeometry args={[.48, .51, 40]}/><meshBasicMaterial color="#eed092" transparent opacity={.8}/></mesh>}
 <Html position={[0, .02, .57]} center zIndexRange={[8, 0]} style={{ pointerEvents: 'auto' }}><button className={`temple-name ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected} title={TEMPLE_PEOPLE[index].name}><span>✿</span><span className="temple-person-name">{TEMPLE_PEOPLE[index].name}</span></button></Html>
 </group>;
}
export function TempleScene({ selected, onSelect }: {
    selected: string;
    onSelect: (id: string) => void;
}) {
    const [visible, setVisible] = useState(!document.hidden);
    useEffect(() => {
        const update = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);
    return <Suspense fallback={<p className="temple-loading">{t('Temple opening')}</p>}><Canvas orthographic frameloop={visible ? 'demand' : 'never'} dpr={1} camera={{ position: [0, 12, 19], zoom: 40, near: .1, far: 80 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} fallback={<p className="temple-loading">{t('Temple WebGL fallback')}</p>}><CameraFit /><FrameDriver visible={visible}/><ambientLight intensity={1.7}/><directionalLight position={[-3, 8, 5]} color="#ffe5b4" intensity={2.2}/><directionalLight position={[3, 5, -5]} color="#e5b672" intensity={1.3}/>{TEMPLE_PEOPLE.map((person, index) => <Visitor key={person.id} index={index} selected={person.id === selected} onSelect={() => onSelect(person.id)}/>)}</Canvas></Suspense>;
}
