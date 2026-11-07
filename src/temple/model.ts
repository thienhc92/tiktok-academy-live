const names = ['Ph Trọng Đoàn', 'Duy Khướn…', 'Đức…', 'phong suy…', 'Chi', 'Ying', 'thanhthao…', 'Văn Sơn', 'ivy.', 'Ngọc Diệp', 'Linh', 'Thanh Bình', 'Tuệ An', 'Đình Quý…', 'Bách', 'Minh L…', 'An Nhiên', 'Bao Chau…', 'Thiện Tâm', 'Hương Giang', 'Nguyễn…', 'Phong Di…', 'Liên', 'Diệu Anh', 'Như Ý', 'Minh Trí', 'Tâm An', 'Thanh Hòa', 'Mỹ Linh', 'Ngọc Anh', 'Hoàng Vân', 'Tuệ Minh', 'Trúc Mai', 'Diệu Hạnh', 'Minh Nguyệt', 'Nhật An', 'Xuân Mai', 'Khánh Hòa', 'Bảo An', 'Hồng Ngọc', 'Ngọc Hà', 'Bình Yên', 'Thiện An', 'Hải Yến', 'Mai Phương', 'Đức Minh', 'Thanh Tịnh', 'An Hòa', 'Tuệ Lâm', 'Diệu Linh', 'Minh Tâm', 'Khách ghé chùa'];
export const TEMPLE_PEOPLE = names.map((name, index) => ({ id: `temple-${index + 1}`, name }));
export type VisitorLayout = {
    x: number;
    y: number;
    height: number;
    layer: number;
};
const positions: VisitorLayout[] = [];
function row(xs: number[], y: number, height: number) {
    xs.forEach((x, i) => positions.push({ x, y: y + (i % 2) * .004, height: height + (i % 3) * .002, layer: Math.round(y * 100) }));
}
row([.38, .5, .62], .479, .064);
row([.08, .21, .33, .5, .68, .8, .92], .579, .073);
row([.04, .13, .22, .31, .67, .76, .85, .94], .657, .069);
row([.02, .11, .2, .29, .38, .63, .72, .81, .9, .98], .696, .065);
row([.025, .115, .205, .295, .385, .635, .725, .815, .905, .985], .731, .066);
row([.025, .10, .175, .25, .325, .40, .61, .685, .76, .835, .91, .985], .752, .064);
row([.5], .714, .082);
row([.5], .925, .074);
export function visitorLayout(index: number): VisitorLayout {
    if (!Number.isInteger(index) || index < 0 || index >= positions.length)
        throw Error('Invalid temple slot');
    return { ...positions[index] };
}
export const BLESSING_KEYS = ['Temple blessing 1', 'Temple blessing 2', 'Temple blessing 3', 'Temple blessing 4', 'Temple blessing 5'];
export const FORTUNE_NUMBERS = [52, 16, 27, 8, 41];
export const TEMPLE_NOTICES_MS = 3000;
