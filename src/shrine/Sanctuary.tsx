import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { BakeShadows, ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls, useGLTF } from '@react-three/drei';
import { AdditiveBlending, BackSide, ClampToEdgeWrapping, DoubleSide, LinearFilter, Mesh, RGBAFormat, DataTexture, UnsignedByteType, Vector3 } from 'three';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import { shrineCamera, shrineOrbit } from './views';
import type { ShrineView } from './views';
function Model() {
    const { scene } = useGLTF('/temple3d/sanctuary.glb', false);
    const { invalidate } = useThree();
    useEffect(() => {
        scene.traverse(object => {
            if (object instanceof Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                if (object.name.startsWith('FLOOR__'))
                    object.visible = false;
            }
        });
        invalidate();
    }, [scene, invalidate]);
    return <primitive object={scene}/>;
}
function Rays() {
    const texture = useMemo(() => {
        const w = 32, h = 128, data = new Uint8Array(w * h * 4);
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
                const edge = Math.sin(Math.PI * x / (w - 1)) ** 2, fade = Math.sin(Math.PI * y / (h - 1));
                const i = (y * w + x) * 4;
                data[i] = 255;
                data[i + 1] = 216;
                data[i + 2] = 156;
                data[i + 3] = Math.round(edge * fade * 60);
            }
        const t = new DataTexture(data, w, h, RGBAFormat, UnsignedByteType);
        t.minFilter = LinearFilter;
        t.magFilter = LinearFilter;
        t.wrapS = ClampToEdgeWrapping;
        t.wrapT = ClampToEdgeWrapping;
        t.needsUpdate = true;
        return t;
    }, []);
    useEffect(() => () => texture.dispose(), [texture]);
    return <group>{[0, 1, 2, 3].map(i => <mesh key={i} position={[-3.4 + i * .7, 3.65, 1.4 + i * .55]} rotation={[0, .12, .62]}><planeGeometry args={[.45 + i * .16, 9]}/><meshBasicMaterial map={texture} transparent opacity={.22} blending={AdditiveBlending} depthWrite={false} side={DoubleSide}/></mesh>)}</group>;
}
function Smoke() {
    const curves = useMemo(() => Array.from({ length: 3 }, (_, i) => Array.from({ length: 40 }, (_, j) => {
        const v = j / 39;
        return new Vector3(Math.sin(v * 8 + i * 1.5) * (.03 + v * .13), 1.52 + v * 1.75, 1.05 + Math.cos(v * 6 + i) * v * .12);
    })), []);
    // Static spatial threads keep the room idle; no permanent render timer for smoke.
    return <group>{curves.map((points, i) => <line key={i}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}/></bufferGeometry><lineBasicMaterial color="#e7dfcd" transparent opacity={.22 - i * .04} depthWrite={false}/></line>)}</group>;
}
function Rig({ view, reset, onManual }: {
    onManual: () => void;
    view: ShrineView;
    reset: number;
}) {
    const { camera, size, invalidate } = useThree(), ref = useRef<OrbitImpl>(null);
    useEffect(() => {
        const v = shrineCamera(view, size.width / size.height);
        // Discard residual orbit deltas before applying an exact preset.
        if (ref.current) { ref.current.enableDamping = false; ref.current.update(); }
        camera.position.set(...v.position);
        camera.lookAt(...v.target);
        ref.current?.target.set(...v.target);
        ref.current?.update();
        camera.updateProjectionMatrix();
        invalidate();
    }, [camera, size, view, reset, invalidate]);
    return <OrbitControls ref={ref} makeDefault enablePan={false} {...shrineOrbit} enableDamping={false} onStart={onManual}/>;
}
export function Sanctuary({ view, reset, detail, sunbeams, smoke, onManual }: {
    onManual: () => void;
    view: ShrineView;
    reset: number;
    detail: boolean;
    sunbeams: boolean;
    smoke: boolean;
}) {
    return <><color attach="background" args={['#a3ab8e']}/><fog attach="fog" args={['#a3ab8e', 28, 65]}/><ambientLight intensity={.18} color="#ffe5c4"/><hemisphereLight intensity={.48} color="#f7e7cc" groundColor="#52300e"/>
 <directionalLight position={[-8, 8, 4]} intensity={3.1} color="#fff2d7" castShadow shadow-mapSize={detail ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={12} shadow-camera-bottom={-4} shadow-bias={-.001}/>
 <directionalLight position={[7, 7, 1]} intensity={.8} color="#ffd193"/><pointLight position={[0, 5, 4]} intensity={24} distance={18} color="#ffdeb0" decay={2}/>
 <Environment resolution={128} frames={1} environmentIntensity={.8}><mesh><sphereGeometry args={[40, 16, 8]}/><meshBasicMaterial color="#a39680" side={BackSide}/></mesh><Lightformer form="rect" intensity={2} color="#fff0d6" position={[-6, 5, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 5, 1]}/><Lightformer form="rect" intensity={1.5} color="#ffe2ac" position={[6, 6, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 5, 1]}/><Lightformer form="rect" intensity={1.5} color="#fff9eb" position={[0, 8, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 10, 1]}/><Lightformer form="rect" intensity={.5} color="#e9c580" position={[0, 4, 8]} scale={[8, 8, 1]}/></Environment>
 <Model /><BakeShadows key={detail ? "detail" : "mobile"} />
 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.003, 1]} receiveShadow><planeGeometry args={[17, 22]}/><MeshReflectorMaterial resolution={detail ? 512 : 256} blur={[detail ? 100 : 50, 25]} mirror={.25} mixBlur={1} mixStrength={.85} roughness={.46} depthScale={.1} minDepthThreshold={.5} maxDepthThreshold={1.5} metalness={.22} color="#817a69"/></mesh>
 <ContactShadows position={[0, .007, 0]} opacity={.45} scale={20} blur={2} far={9} resolution={256} frames={1} color="#36210d"/>
 {sunbeams && <Rays />}{smoke && <Smoke />}<Rig view={view} reset={reset} onManual={onManual}/>
 </>;
}
