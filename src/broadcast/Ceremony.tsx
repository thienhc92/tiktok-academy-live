import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RANKS } from '../game/progression';
export type CeremonyEvent = { playerId:string; nickname:string; rank:number; at:number };
export function Ceremony({event}:{event:CeremonyEvent}) {
  const points=useRef<THREE.Points>(null);
  const positions=useMemo(()=>new Float32Array(Array.from({length:96},(_,i)=>{
    const n=Math.floor(i/3),angle=n*2.4;
    return i%3===0?Math.cos(angle)*(1+n%3*.3):i%3===1?.7+(n%8)*.25:Math.sin(angle)*(1+n%3*.3);
  })),[]);
  useFrame(({clock})=>{if(points.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){points.current.rotation.y=clock.elapsedTime*.4;points.current.position.y=Math.sin(clock.elapsedTime*2)*.15;}});
  return <group position={[0,0,-1.5]}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.09,0]}><ringGeometry args={[.65,.85,32]}/><meshBasicMaterial color="#e9c45c"/></mesh>
    <spotLight position={[0,6,1.5]} color="#fff2bb" intensity={35} angle={.4} penumbra={.6} distance={12}/>
    <pointLight position={[0,2,1]} color="#fff0b1" intensity={8} distance={5}/>
    <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#e9be47" size={.11} sizeAttenuation transparent opacity={.85} depthWrite={false}/></points>
    <Html center position={[0,3.2,0]}><div className="promotion-title" role="status"><small>ACADEMY PROMOTION</small><b>{event.nickname}</b>{RANKS[event.rank]}</div></Html>
  </group>;
}
