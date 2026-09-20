import { Link, useNavigate } from 'react-router-dom';
import {
  Radar,
  ArrowRight,
  Play,
  ShieldCheck,
  Target,
  ListChecks,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { signInDemo } = useAuth();

  const handleDemo = () => {
    signInDemo();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Radar className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-ink-900 text-lg tracking-tight">
              StudyGap<span className="text-brand-600">Radar</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/signin" className="btn-ghost">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
        <div aria-hidden className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full bg-brand-100/60 blur-3xl" />
        <div aria-hidden className="absolute top-20 -left-24 w-80 h-80 rounded-full bg-brand-200/40 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <span className="badge bg-brand-50 text-brand-700 border border-brand-200 mb-5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Evidence-based study diagnostics
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink-900 leading-[1.05] tracking-tight">
                Detects what you don't know —{' '}
                <span className="text-brand-600">before your exam does.</span>
              </h1>
              <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-xl">
                Know what you need to revise — with evidence. StudyGapRadar diagnoses your
                understanding topic by topic, shows you the proof, and tells you what to fix first.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="btn-primary text-base px-6 py-3.5">
                  Start Your Preparation
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <button onClick={handleDemo} className="btn-secondary text-base px-6 py-3.5">
                  <Play className="h-4 w-4" />
                  Try Demo
                </button>
              </div>

              <p className="mt-4 text-sm text-ink-400">
                No credit card. The demo walks through the full journey in minutes.
              </p>
            </div>

            {/* Visual: generic radar concept (no personalized data) */}
            <div className="relative animate-scale-in">
              <div className="card p-8 sm:p-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      How it works
                    </p>
                    <p className="font-display font-bold text-ink-900 text-lg mt-1">
                      Topic-level diagnostics
                    </p>
                  </div>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <span className="absolute inline-flex h-12 w-12 rounded-full bg-brand-400/30 animate-radar-ping" />
                    <Radar className="h-6 w-6 text-brand-600" />
                  </span>
                </div>

                <div className="space-y-3">
                  <ConceptRow label="Diagnose each topic" icon={Radar} tone="brand" />
                  <ConceptRow label="See the evidence" icon={ListChecks} tone="brand" />
                  <ConceptRow label="Know what to revise first" icon={Target} tone="warning" />
                  <ConceptRow label="Practice with purpose" icon={CheckCircle2} tone="success" />
                </div>

                <div className="mt-6 pt-5 border-t border-ink-100">
                  <div className="flex items-center gap-2 text-ink-400">
                    <Lock className="h-3.5 w-3.5" />
                    <p className="text-xs">
                      Your results are private — sign in to see your own diagnostic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink-50 border-y border-ink-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 text-center">
            A focused loop, not a feature dump
          </h2>
          <p className="mt-3 text-ink-500 text-center max-w-2xl mx-auto">
            Five steps. No chatbot, no calendar, no clutter — just a clear path from "I think I know
            it" to "I can prove I know it."
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StepCard
              n="1"
              icon={Radar}
              title="Diagnose"
              body="Answer a short, application-oriented assessment for each topic."
            />
            <StepCard
              n="2"
              icon={ListChecks}
              title="See the evidence"
              body="Every question marked Correct, Incorrect, or Unattempted — no black-box scoring."
            />
            <StepCard
              n="3"
              icon={Target}
              title="Prioritize"
              body="Weak topics ranked by severity and exam urgency so you know what comes first."
            />
            <StepCard
              n="4"
              icon={CheckCircle2}
              title="Practice & revise"
              body="Targeted practice for the topic that needs attention, then a clear revision action."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-ink-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Radar className="h-4 w-4" />
              </span>
              <span className="font-display font-bold text-ink-900">
                StudyGap<span className="text-brand-600">Radar</span>
              </span>
            </div>
            <p className="text-sm text-ink-400">
              Evidence-based study assistant for engineering students. Capstone prototype.
            </p>
          </div>
          <p className="mt-6 text-xs text-ink-400">
            © {new Date().getFullYear()} StudyGapRadar. A product management capstone prototype.
            Local data only — no external APIs.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ConceptRow({
  label,
  icon: Icon,
  tone,
}: {
  label: string;
  icon: typeof Radar;
  tone: 'brand' | 'warning' | 'success';
}) {
  const toneClasses =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-600'
      : tone === 'warning'
      ? 'bg-warning-50 text-warning-600'
      : 'bg-success-50 text-success-600';
  return (
    <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-ink-700">{label}</span>
    </div>
  );
}

function StepCard({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: typeof Radar;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-display text-3xl font-extrabold text-ink-200">{n}</span>
      </div>
      <h3 className="font-display font-bold text-ink-900 text-lg">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{body}</p>
    </div>
  );
}
