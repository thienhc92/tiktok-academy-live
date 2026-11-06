export type ShrineView = 'front' | 'left' | 'right' | 'close';
export function shrineCamera(view: ShrineView, aspect: number): {
    position: [
        number,
        number,
        number
    ];
    target: [
        number,
        number,
        number
    ];
} {
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    const retreat = Math.max(11.2, 3.55 / (Math.tan(42 * Math.PI / 360) * safeAspect) - 2.8);
    if (view === 'close')
        return { position: [0, 5.8, Math.max(3.4, retreat - 8)], target: [0, 6.05, -2.8] };
    const x = view === 'left' ? -retreat * .28 : view === 'right' ? retreat * .28 : 0;
    return { position: [x, 3.2, retreat], target: [0, 3.4, -2.8] };
}
