/**
 * Праздничные эффекты (конфетти) для ключевых моментов.
 * Использует canvas-confetti — лёгкий canvas-эффект без DOM.
 */
import confetti from 'canvas-confetti';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];

/** Короткий салют по бокам экрана — завершение урока. */
export function fireLessonComplete() {
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: COLORS });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Длинный салют + фонтан из центра — новый уровень. */
export function fireLevelUp() {
  const end = Date.now() + 1800;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: COLORS, scalar: 1.1 });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: COLORS, scalar: 1.1 });
    confetti({ particleCount: 3, startVelocity: 35, spread: 360, ticks: 90, origin: { x: 0.5, y: 0.4 }, colors: COLORS, scalar: 1.3 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
