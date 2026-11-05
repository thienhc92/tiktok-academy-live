export const TEMPLE_PEOPLE = ['Ngọc An', 'Minh Tâm', 'Thanh Trúc', 'Bảo Châu', 'Diệu Linh', 'Thiện Minh', 'An Nhiên', 'Hải Yến', 'Hoài Nam', 'Tâm Như', 'Khánh An', 'Tuệ Lâm', 'Phương Thảo', 'Đức Huy', 'Mai Anh', 'Nhật Quang', 'Bình An', 'Quỳnh Hoa', 'Gia Hân', 'Thanh Tịnh', 'Diệu An', 'Trúc Mai', 'Thiện Tâm', 'Hương Giang', 'Minh Nguyệt', 'Như Ý', 'An Hòa', 'Tuệ Minh'].map((name, index) => ({ id: `temple-${index + 1}`, name }));
const ROWS = [4, 6, 6, 6, 6];
export function templePosition(index: number): [
    number,
    number,
    number
] {
    if (!Number.isInteger(index) || index < 0 || index >= TEMPLE_PEOPLE.length)
        throw Error('Invalid temple slot');
    let offset = 0;
    for (let row = 0; row < ROWS.length; row++) {
        if (index < offset + ROWS[row])
            return [(index - offset - (ROWS[row] - 1) / 2) * 1.35, 0, -3.4 + row * 1.65];
        offset += ROWS[row];
    }
    throw Error('Invalid temple slot');
}
export const BLESSING_KEYS = ['Temple blessing 1', 'Temple blessing 2', 'Temple blessing 3', 'Temple blessing 4', 'Temple blessing 5'];
export const TEMPLE_NOTICES_MS = 3000;
