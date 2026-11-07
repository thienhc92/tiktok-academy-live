import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLE_PEOPLE, visitorLayout, BLESSING_KEYS } from '../src/temple/model.ts';
import { statSync, readFileSync } from 'node:fs';
import { vi } from '../src/i18n/vi.ts';
test('temple has 52 stable identities in a layered reference layout', () => {
    assert.equal(TEMPLE_PEOPLE.length, 52);
    assert.equal(new Set(TEMPLE_PEOPLE.map(p => p.id)).size, 52);
    const positions = TEMPLE_PEOPLE.map((_, i) => visitorLayout(i));
    assert.equal(new Set(positions.map(p => `${p.x},${p.y}`)).size, 52);
    assert.ok(positions.every(p => Number.isFinite(p.x) && p.x > 0 && p.x < 1 && p.y > .4 && p.y < 1 && p.height > .05 && p.height < .1));
    for (const i of [-1, 52, NaN, 1.5])
        assert.throws(() => visitorLayout(i));
});
test('every reflection card uses the central Vietnamese catalog', () => {
    for (const key of BLESSING_KEYS) {
        assert.ok(vi[key]);
        assert.ok(vi[key + ' title']);
        assert.ok(vi[key].length <= 110);
    }
    assert.match(vi['Temple disclaimer'], /Mô phỏng/);
    assert.match(vi['Temple disclaimer'], /không dự đoán/);
});
test('realistic assets are local and stay within the mobile download budget', () => {
    for (const [path, max] of [['shrine-realistic.webp', 500000], ['devotee-realistic.webp', 30000], ['devotee-standing.webp', 30000], ['fonts/Charm-Bold.ttf', 200000]] as const) {
        const bytes = statSync('public/temple/' + path).size;
        assert.ok(bytes > 0 && bytes < max, path);
    }
    assert.match(readFileSync('public/temple/fonts/OFL.txt', 'utf8'), /SIL OPEN FONT LICENSE/);
    const foreground = visitorLayout(51);
    assert.equal(foreground.x, .5);
    assert.ok(foreground.y > .9);
    const copy = visitorLayout(0);
    copy.x = 100;
    assert.ok(visitorLayout(0).x < 1);
});
