import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLE_PEOPLE, templePosition, BLESSING_KEYS } from '../src/temple/model.ts';
import { vi } from '../src/i18n/vi.ts';
test('temple has 28 stable identities in distinct bounded positions', () => {
    assert.equal(TEMPLE_PEOPLE.length, 28);
    assert.equal(new Set(TEMPLE_PEOPLE.map(p => p.id)).size, 28);
    const positions = TEMPLE_PEOPLE.map((_, i) => templePosition(i));
    assert.equal(new Set(positions.map(String)).size, 28);
    assert.ok(positions.every(([x, y, z]) => Number.isFinite(x) && Math.abs(x) <= 3.4 && y === 0 && z >= -3.4 && z <= 3.3));
    for (const i of [-1, 28, NaN, 1.5])
        assert.throws(() => templePosition(i));
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
