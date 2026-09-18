import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout, Field } from './SignUp';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const res = await signIn(email.trim(), password);
    if (!res.ok) {
      setError(res.error ?? 'Could not sign in.');
      return;
    }
    navigate('/home');
  };

  const handleDemo = async () => {
    await signInDemo();
    navigate('/home');
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-500">Sign in to continue your preparation.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Field>

        <button type="submit" className="btn-primary w-full text-base py-3.5">
          Sign in
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-200" />
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-ink-200" />
      </div>

      <button onClick={handleDemo} className="btn-secondary w-full text-base py-3.5">
        <Sparkles className="h-4.5 w-4.5 text-brand-600" />
        Continue with Demo Account
      </button>

      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
