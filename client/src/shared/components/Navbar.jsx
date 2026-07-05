import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-secondary/15 bg-white/80 backdrop-blur dark:bg-[#1E1E1E]/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-heading text-lg font-semibold">
          Insight<span className="text-accent">Flow</span> AI
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-1.5 font-medium hover:bg-secondary/10">
                Dashboard
              </Link>
              <Link to="/leads" className="rounded-lg px-3 py-1.5 font-medium hover:bg-secondary/10">
                Leads
              </Link>
              <button
                onClick={() => logout.mutate()}
                className="rounded-lg px-3 py-1.5 font-medium text-accent hover:bg-accent/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg px-3 py-1.5 font-medium hover:bg-secondary/10">
              Log in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
