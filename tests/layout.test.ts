import {test} from 'node:test';import assert from 'node:assert/strict';
import {cameraDistance,visibleLabels} from '../src/scene/layout.ts';
test('portrait camera fits a wider scene and reset distance is deterministic',()=>{assert.ok(cameraDistance(9/16)>cameraDistance(1.5));assert.equal(cameraDistance(9/16),cameraDistance(9/16));assert.ok(Number.isFinite(cameraDistance(0)));});
test('overlapping labels prioritize selected student without mutating layout',()=>{const rects=[{x:0,y:0,width:40,height:20},{x:1,y:1,width:40,height:20,selected:true},{x:80,y:0,width:40,height:20}];assert.deepEqual(visibleLabels(rects).sort(),[1,2]);assert.equal(rects.length,3);});
test('separated labels remain visible',()=>{assert.equal(visibleLabels(Array.from({length:20},(_,i)=>({x:i%4*60,y:Math.floor(i/4)*30,width:40,height:20}))).length,20);});
