import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraDistance, visibleLabels } from './layout';
export function CameraRig({broadcast,reset}:{broadcast:boolean;reset:number}){
 const controls=useRef<Controls>(null),last=useRef(0);
 const {camera,size,invalidate,gl}=useThree();
 const distance=cameraDistance(size.width/size.height);
 useEffect(()=>{
  const target=new Vector3(0,1,1.5),direction=new Vector3(0,12,20).normalize();
  camera.position.copy(target.clone().addScaledVector(direction,distance));
  if(camera instanceof PerspectiveCamera){camera.fov=45;camera.updateProjectionMatrix();}
  controls.current?.target.copy(target);camera.lookAt(target);controls.current?.update();invalidate();
 },[camera,distance,reset,invalidate]);
 useFrame(({clock})=>{
  if(clock.elapsedTime-last.current<.15)return;last.current=clock.elapsedTime;
  const labels=Array.from((gl.domElement.closest('.canvas-wrap,.qa-preview')??gl.domElement.parentElement)?.querySelectorAll<HTMLElement>('.name-tag')??[]);
  const rects=labels.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,selected:n.classList.contains('selected')};});
  const kept=new Set(visibleLabels(rects));labels.forEach((n,i)=>{n.style.visibility=kept.has(i)?'visible':'hidden';});
 });
 return <OrbitControls ref={controls} enableDamping={false} makeDefault target={[0,1,1.5]} enableRotate={!broadcast} enableZoom={!broadcast} enablePan={false} minDistance={distance} maxDistance={distance*1.35} minPolarAngle={.6} maxPolarAngle={1} minAzimuthAngle={-.6} maxAzimuthAngle={.6}/>;
}
