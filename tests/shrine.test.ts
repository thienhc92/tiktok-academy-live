import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { shrineCamera, shrineOrbit } from '../src/shrine/views.ts';
test('3D camera fits portrait, separates side views and offers a real closer view', () => {
    const landscape = shrineCamera('front', 16 / 9), portrait = shrineCamera('front', 9 / 16);
    assert.ok(portrait.position[2] > landscape.position[2]);
    assert.ok(shrineCamera('left', 16 / 9).position[0] < 0);
    assert.ok(shrineCamera('right', 16 / 9).position[0] > 0);
    assert.ok(shrineCamera('close', 16 / 9).position[2] < landscape.position[2]);
    assert.deepEqual(shrineCamera('front', 0), shrineCamera('front', NaN));
});
test('camera presets stay below the roof and within the central aisle orbit limits', () => {
    assert.ok(5.65 + Math.cos(shrineOrbit.minPolarAngle) * shrineOrbit.maxDistance < 7, 'even fully zoomed out, the highest orbit stays below roof beams');
    for (const aspect of [16 / 9, 4 / 3, 3 / 4, 9 / 16]) {
        for (const view of ['front', 'left', 'right', 'close'] as const) {
            const { position: p, target: t } = shrineCamera(view, aspect);
            const dx=p[0]-t[0], dy=p[1]-t[1], dz=p[2]-t[2];
            const radius=Math.hypot(dx,dy,dz), azimuth=Math.atan2(dx,dz), polar=Math.acos(dy/radius);
            assert.ok(radius >= shrineOrbit.minDistance && radius <= shrineOrbit.maxDistance);
            assert.ok(azimuth >= shrineOrbit.minAzimuthAngle && azimuth <= shrineOrbit.maxAzimuthAngle);
            assert.ok(polar >= shrineOrbit.minPolarAngle && polar <= shrineOrbit.maxPolarAngle);
            assert.ok(p[1] < 5.5, 'camera must remain below the crossbeams');
        }
    }
});
test('download is a self-contained 3D GLB with sculpture, architecture and altar mesh groups', () => {
    const bytes = readFileSync('public/temple3d/sanctuary.glb');
    assert.equal(bytes.toString('utf8', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.ok(bytes.length < 12000000);
    const data = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
    const names = data.nodes.map((n: {
        name: string;
    }) => n.name);
    for (const prefix of ['ARCH__', 'SCULPT__', 'STATUE__', 'ALTAR__', 'FLOOR__'])
        assert.ok(names.some((n: string) => n.startsWith(prefix)), prefix);
    assert.ok(data.meshes.length > 20);
    assert.ok(data.meshes.length < 70);
    const triangles = data.meshes.flatMap((m: {
        primitives: {
            indices: number;
        }[];
    }) => m.primitives).reduce((n: number, p: {
        indices: number;
    }) => n + data.accessors[p.indices].count / 3, 0);
    assert.ok(triangles > 100000 && triangles < 500000);
    assert.ok(data.materials.some((m: {
        pbrMetallicRoughness?: {
            metallicFactor: number;
        };
    }) => (m.pbrMetallicRoughness?.metallicFactor ?? 0) > .7));
    assert.ok(data.images.length > 0);
    assert.ok(data.images.every((i: {
        uri?: string;
        bufferView?: number;
    }) => i.uri === undefined && Number.isInteger(i.bufferView)));
    assert.ok(data.buffers.every((b: {
        uri?: string;
    }) => b.uri === undefined), 'no externally fetched model buffers');
});

// Validate baked pixels, not just texture references: changing Blender colour space
// after writing pixels previously exported a black normal map and zero roughness.
function pngChannelMeans(bytes: Buffer): number[] {
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    const width=bytes.readUInt32BE(16), height=bytes.readUInt32BE(20);
    assert.equal(bytes[24],8); assert.equal(bytes[25],2, 'exported RGB PNG');
    const chunks: Buffer[]=[];
    for(let at=8;at<bytes.length;) {
        const n=bytes.readUInt32BE(at);
        if(bytes.toString('ascii',at+4,at+8)==='IDAT') chunks.push(bytes.subarray(at+8,at+8+n));
        at+=12+n;
    }
    const raw=inflateSync(Buffer.concat(chunks)), stride=width*3, sums=[0,0,0];
    let previous=Buffer.alloc(stride);
    for(let y=0;y<height;y++) {
        const filter=raw[y*(stride+1)], row=Buffer.alloc(stride);
        assert.ok(filter<=4);
        for(let x=0;x<stride;x++) {
            const a=x>=3?row[x-3]:0, b=previous[x], c=x>=3?previous[x-3]:0;
            const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
            const predict=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):pa<=pb&&pa<=pc?a:pb<=pc?b:c;
            row[x]=(raw[y*(stride+1)+1+x]+predict)&255;sums[x%3]+=row[x];
        }
        previous=row;
    }
    return sums.map(n=>n/(width*height));
}
test('embedded PBR normal and roughness pixels survive Blender export', () => {
    const bytes=readFileSync('public/temple3d/sanctuary.glb'), jsonLength=bytes.readUInt32LE(12);
    const data=JSON.parse(bytes.toString('utf8',20,20+jsonLength)), binaryStart=28+jsonLength;
    const means=(textureIndex: number) => {
        const img=data.images[data.textures[textureIndex].source], v=data.bufferViews[img.bufferView];
        return pngChannelMeans(bytes.subarray(binaryStart+(v.byteOffset??0),binaryStart+(v.byteOffset??0)+v.byteLength));
    };
    for(const material of data.materials) {
        if(material.normalTexture) {
            const [r,g,b]=means(material.normalTexture.index);
            assert.ok(r>100&&r<155&&g>100&&g<155&&b>220,material.name);
        }
    }
    const wood=data.materials.find((m: {name: string})=>m.name==='Lacquered teak');
    const roughness=means(wood.pbrMetallicRoughness.metallicRoughnessTexture.index)[1];
    assert.ok(roughness>70&&roughness<180,'lacquer must not export with mirror-like zero roughness');
});
