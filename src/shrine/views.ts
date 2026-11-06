export type ShrineView = 'front' | 'left' | 'right' | 'close';
/** Keep the lens below the beams and inside the central aisle. */
export const shrineOrbit = {
    minPolarAngle: 1.54,
    maxPolarAngle: 1.64,
    minAzimuthAngle: -.14,
    maxAzimuthAngle: .14,
    minDistance: 6.8,
    maxDistance: 27,
} as const;
export function shrineCamera(view: ShrineView, aspect: number): {
    position: [number, number, number];
    target: [number, number, number];
} {
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    const retreat = Math.max(12.4, 3.95 / (Math.tan(42 * Math.PI / 360) * safeAspect) - 3);
    if (view === 'close')
        return { position: [0, 5.2, Math.max(4, retreat - 8)], target: [0, 5.65, -3] };
    const x = view === 'left' ? -1.25 : view === 'right' ? 1.25 : 0;
    return { position: [x, 3.95, retreat], target: [0, 4.1, -3] };
}
