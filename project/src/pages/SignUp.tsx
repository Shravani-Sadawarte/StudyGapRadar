import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Use at least 6 characters.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const res = await signUp(name.trim(), email.trim(), password);
    if (!res.ok) {
      setErrors({ form: res.error ?? 'Could not create account.' });
      return;
    }
    navigate('/onboarding');
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Create your account</h1>
        <p className="mt-2 text-sm text-ink-500">
          Start diagnosing what you don't know — in minutes.
        </p>
      </div>

      {errors.form && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Name" error={errors.name}>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma"
            autoComplete="name"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="input pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input
            type={showPw ? 'text' : 'password'}
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </Field>

        <button type="submit" className="btn-primary w-full text-base py-3.5">
          Create account
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden lg:flex flex-col justify-between bg-brand-700 text-white p-12 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-brand-400/20 blur-3xl"
          />
          <Link to="/" className="flex items-center gap-2.5 relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Radar className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-lg">
              StudyGapRadar
            </span>
          </Link>

          <div className="relative">
            <h2 className="font-display text-3xl font-bold leading-tight">
              Detects what you don't know — before your exam does.
            </h2>
            <p className="mt-4 text-brand-100 leading-relaxed max-w-md">
              Evidence-based diagnostics, transparent scoring, and a clear revision plan — built
              for engineering students with limited time.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-brand-50">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
                Topic-level performance, not vague scores
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
                See the evidence behind every result
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
                Know what to revise first
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-brand-200">
            © {new Date().getFullYear()} StudyGapRadar. Capstone prototype.
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="lg:hidden flex items-center gap-2.5 mb-8 justify-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Radar className="h-5 w-5" />
              </span>
              <span className="font-display font-bold text-ink-900 text-lg">
                StudyGap<span className="text-brand-600">Radar</span>
              </span>
            </Link>
            <div className="card p-6 sm:p-8 animate-fade-in">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-danger-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
