import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PHOTO_LIMIT, validatePhoto } from '../src/photo/storage.ts';
test('photo picker validates bounded raster containers and rejects active/mismatched formats', async () => {
    assert.equal(await validatePhoto(new Blob([readFileSync('public/temple/shrine-realistic.webp')], {type:'image/webp'})),true);
    assert.equal(await validatePhoto(new Blob([new Uint8Array([255,216,255,224])],{type:'image/jpeg'})),true);
    assert.equal(await validatePhoto(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'})),true);
    for (const blob of [new Blob([],{type:'image/png'}),new Blob(['<svg onload="alert(1)"/>'],{type:'image/svg+xml'}),new Blob(['not a photo'],{type:'image/png'}),new Blob([new Uint8Array(PHOTO_LIMIT+1)],{type:'image/jpeg'}),new Blob([new Uint8Array([255,216,255])],{type:'image/png'})]) {
        assert.equal(await validatePhoto(blob),false);
    }
});
