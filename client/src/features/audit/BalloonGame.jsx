import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Something to do while the audit runs: balloons drift down from the top, pop on click.
// Pure client-side fun — emoji + transform animations, at most MAX_BALLOONS nodes, and the
// whole thing unmounts with ProgressView. Zero effect on the audit or page load.
const MAX_BALLOONS = 8;
const SPAWN_EVERY_MS = 1300;
let nextId = 0;

const spawnBalloon = () => ({
  id: nextId++,
  x: 4 + Math.random() * 88, // vw
  size: 40 + Math.random() * 28, // px font-size
  duration: 9 + Math.random() * 6, // s to cross the screen
  hue: Math.floor(Math.random() * 360), // recolors the red balloon emoji
  sway: Math.random() * 40 - 20, // px horizontal drift
});

export default function BalloonGame() {
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBalloons((bs) => (bs.length >= MAX_BALLOONS ? bs : [...bs, spawnBalloon()]));
    }, SPAWN_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  const remove = (id) => setBalloons((bs) => bs.filter((b) => b.id !== id));
  const pop = (id) => {
    setScore((s) => s + 1);
    remove(id);
  };

  // Decorative game: hidden from assistive tech and out of the tab order on purpose.
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {score > 0 && (
        <p className="absolute right-4 top-16 rounded-full bg-primary/20 px-3 py-1 font-heading text-sm font-semibold">
          🎈 {score} popped
        </p>
      )}
      <AnimatePresence>
        {balloons.map((b) => (
          <motion.button
            key={b.id}
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} // decorative button must never take focus (aria-hidden ancestor)
            onClick={() => pop(b.id)}
            className="pointer-events-auto absolute top-0 cursor-pointer select-none leading-none"
            style={{ left: `${b.x}vw`, fontSize: b.size, filter: `hue-rotate(${b.hue}deg)` }}
            initial={{ y: -80 }}
            animate={{ y: '105vh', x: b.sway }}
            exit={{ scale: 1.8, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: b.duration, ease: 'linear' }}
            onAnimationComplete={() => remove(b.id)}
          >
            🎈
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
