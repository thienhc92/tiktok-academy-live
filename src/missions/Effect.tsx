import { t } from '../i18n/vi';
import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LiveState } from './rules';
export function MissionEffect({effect}:{effect:NonNullable<LiveState['effect']>}){
 const points=useRef<THREE.Points>(null),positions=useMemo(()=>new Float32Array(Array.from({length:48},(_,i)=>i%3===1?1+(i%7)*.15:Math.sin(i*2.3)*1.3)),[]);
 useFrame(({clock})=>{if(points.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)points.current.rotation.y=clock.elapsedTime*.6;});
 return <group position={[0,0,1]}><points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial size={.12} color={effect.kind==='gift'?'#e5a654':'#8ebc65'} depthWrite={false}/></points><Html center position={[0,2.7,0]}><div className="promotion-title">{effect.kind==='gift'?t("🎁 Quà tặng · Điểm cống hiến"):t("✓ Hoàn thành nhiệm vụ")}</div></Html></group>;
}
