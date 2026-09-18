import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Radar, Home as HomeIcon, Stethoscope, Dumbbell, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: HomeIcon },
  { to: '/diagnostic/setup', label: 'Diagnose', icon: Stethoscope },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/ai-tools', label: 'AI Study Tools', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
];

export function AppNav() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <>
      {/* Top bar (tablet/desktop) */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-ink-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Radar className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-ink-900 text-lg tracking-tight">
              StudyGap<span className="text-brand-600">Radar</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== '/home' && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <span
              className={`ml-2 badge ${
                user?.plan === 'premium'
                  ? 'bg-brand-100 text-brand-700 border border-brand-200'
                  : 'bg-ink-100 text-ink-500'
              }`}
            >
              {user?.plan === 'premium' ? 'Premium' : 'Free Plan'}
            </span>
            <button
              onClick={handleSignOut}
              className="ml-1 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors"
              title={`Sign out ${user?.name ?? ''}`.trim()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-ink-100 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== '/home' && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-brand-600' : 'text-ink-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label === 'AI Study Tools' ? 'AI Tools' : item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <AppNav />
      <main className="flex-1 pb-24 sm:pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
