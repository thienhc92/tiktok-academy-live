export const FULLSCREEN_FALLBACK = 'Fullscreen is unavailable here. Broadcast View still fits this viewport. Keep the iPad in portrait; Safari toolbar visibility depends on the device and browser.';
export type FullscreenPort = { active: boolean; enter?: () => Promise<void>; exit?: () => Promise<void> };
/** Capability detection only: never assumes fullscreen hides iOS browser chrome. */
export async function toggleFullscreen(port: FullscreenPort): Promise<string> {
  const action = port.active ? port.exit : port.enter;
  if (!action) return FULLSCREEN_FALLBACK;
  try { await action(); return ''; }
  catch { return FULLSCREEN_FALLBACK; }
}
