import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Landing from '@/pages/Landing';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import DiagnosticSetup from '@/pages/DiagnosticSetup';
import Diagnostic from '@/pages/Diagnostic';
import Results from '@/pages/Results';
import Practice from '@/pages/Practice';
import PracticeComplete from '@/pages/PracticeComplete';
import Profile from '@/pages/Profile';
import AITools from '@/pages/AITools';
import Premium from '@/pages/Premium';
import Preparation from '@/pages/Preparation';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user && (!user.branch || !user.semester || !user.examGoal)) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <Onboarding />
              </RequireAuth>
            }
          />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Home />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/diagnostic/setup"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <DiagnosticSetup />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/diagnostic"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Diagnostic />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/results"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Results />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/practice"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Practice />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/practice/complete"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <PracticeComplete />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Profile />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/ai-tools"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <AITools />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/premium"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Premium />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/prep"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Preparation />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route
            path="/study-plan"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Preparation />
                </RequireOnboarding>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
