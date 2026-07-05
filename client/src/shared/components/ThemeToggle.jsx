import { useState } from 'react';

// Dark mode via the `dark` class on <html>, persisted to localStorage. Initial class is set in index.html.
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-lg p-2 text-lg transition hover:bg-secondary/10"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
