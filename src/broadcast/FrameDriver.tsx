import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
/** Demand rendering: cap idle animation at 30fps, stop ticking hidden tabs. */
export function FrameDriver({ visible }: { visible: boolean }) {
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    if (!visible) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    function update() {
      window.clearInterval(timer);
      invalidate();
      if (!media.matches) timer = window.setInterval(invalidate, 1000 / 30);
    }
    update();
    media.addEventListener('change', update);
    return () => { window.clearInterval(timer); media.removeEventListener('change', update); };
  }, [visible, invalidate]);
  return null;
}
