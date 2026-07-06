import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext.jsx';
import Navbar from './shared/components/Navbar.jsx';
import Loader from './shared/components/Loader.jsx';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';
import ErrorPage from './shared/components/ErrorPage.jsx';

const LoginPage = lazy(() => import('./features/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage.jsx'));
const LandingPage = lazy(() => import('./features/audit/LandingPage.jsx'));
const AuditPage = lazy(() => import('./features/audit/AuditPage.jsx'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage.jsx'));
const LeadsPage = lazy(() => import('./features/leads/LeadsPage.jsx'));

// Gate authenticated pages; wait for the /me check before deciding, so a refresh doesn't flash to /login.
function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
}

// Keep signed-in users off the auth pages.
function GuestOnly({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/audit/:id" element={<AuditPage />} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/leads" element={<RequireAuth><LeadsPage /></RequireAuth>} />
              <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
              <Route path="*" element={<ErrorPage title="Page not found" message="That page doesn't exist or may have moved." />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
