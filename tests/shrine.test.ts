import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shrineCamera } from '../src/shrine/views.ts';
test('3D camera fits portrait, separates side views and offers a real closer view', () => {
    const landscape = shrineCamera('front', 16 / 9), portrait = shrineCamera('front', 9 / 16);
    assert.ok(portrait.position[2] > landscape.position[2]);
    assert.ok(shrineCamera('left', 16 / 9).position[0] < 0);
    assert.ok(shrineCamera('right', 16 / 9).position[0] > 0);
    assert.ok(shrineCamera('close', 16 / 9).position[2] < landscape.position[2]);
    assert.deepEqual(shrineCamera('front', 0), shrineCamera('front', NaN));
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
