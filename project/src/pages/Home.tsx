import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radar,
  ArrowRight,
  Stethoscope,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  CalendarClock,
  BookOpen,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/lib/storage';
import { statusLabel, statusClasses } from '@/lib/scoring';
import type { DiagnosticResult } from '@/lib/types';
import { api } from '@/lib/api';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localResults, setLocalResults] = useState<DiagnosticResult | null>(() => storage.getResults());
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load live dashboard
        const dashRes = await api.analytics.dashboard();
        if (dashRes.success && dashRes.data) {
          setDashboard(dashRes.data);
        }

        // Load knowledge results
        const knowRes = await api.knowledge.results();
        if (knowRes.success && knowRes.data && knowRes.data.topics?.length > 0) {
          const liveResult: DiagnosticResult = {
            subject: knowRes.data.subject,
            examDate: knowRes.data.exam_date,
            createdAt: knowRes.data.created_at || new Date().toISOString(),
            topics: knowRes.data.topics,
          };
          setLocalResults(liveResult);
          storage.setResults(liveResult);
        }
      } catch {
        // Use local storage fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await api.progress.sessionComplete(sessionId, 45, 'Completed scheduled study session');
      const dashRes = await api.analytics.dashboard();
      if (dashRes.success) setDashboard(dashRes.data);
    } catch {
      // ignore
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? dashboard?.user_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const hasResults = !!localResults && localResults.topics.length > 0;
  const summary = buildSummary(localResults);
  const needsAttentionTopic = localResults?.topics.find((t) => t.status === 'needs-attention');

  const branchLabel = user?.branch || dashboard?.branch || 'Computer Science & Engineering';
  const semesterLabel = user?.semester || dashboard?.semester || 'Semester 5';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <section>
        <p className="text-sm font-medium text-brand-600">{greeting},</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-1">
          {firstName}
        </h1>
        <p className="mt-2 text-ink-500 text-lg">Let's find what needs your attention today.</p>
      </section>

      {/* Primary CTA */}
      <section className="card p-6 sm:p-8 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 relative overflow-hidden">
        <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl font-bold">
              {hasResults ? 'Ready to diagnose another topic?' : 'Ready to find your gaps?'}
            </h2>
            <p className="mt-1.5 text-brand-100 text-sm max-w-md">
              A short, application-oriented assessment that shows exactly what you know — and what
              you don't.
            </p>
          </div>
          <Link
            to="/diagnostic/setup"
            className="btn bg-white text-brand-700 hover:bg-brand-50 shrink-0"
          >
            <Stethoscope className="h-4.5 w-4.5" />
            Start a Diagnostic
          </Link>
        </div>
      </section>

      {/* Secondary CTA for returning users */}
      {hasResults && (
        <div className="flex justify-center">
          <Link to="/prep" className="btn-secondary">
            <ArrowRight className="h-4 w-4" />
            Continue Preparation
          </Link>
        </div>
      )}

      {/* Current preparation */}
      <section>
        <h2 className="font-display text-lg font-bold text-ink-900 mb-3">
          Current preparation
        </h2>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {semesterLabel} — {branchLabel}
          </p>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            <PrepCard
              title="Data Structures"
              subtitle="Recursion · Arrays · Trees · Linked Lists"
              progress={hasResults ? 'Diagnostic complete' : 'Not yet assessed'}
              tone="brand"
            />
            <PrepCard
              title="Thermodynamics"
              subtitle="Coming soon to your branch"
              progress="Not started"
              tone="muted"
            />
          </div>
        </div>
      </section>

      {/* Today's Adaptive Study Sessions */}
      {dashboard?.today_sessions && dashboard.today_sessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-brand-600" />
              <h2 className="font-display text-lg font-bold text-ink-900">Today's Study Schedule</h2>
            </div>
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200">
              {dashboard.days_remaining} Days to Exam
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {dashboard.today_sessions.slice(0, 2).map((s: any) => (
              <div key={s.id} className="card p-5 border-l-4 border-l-brand-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">{s.activity}</span>
                    <span className={`badge ${s.status === 'completed' ? 'bg-success-100 text-success-700' : 'bg-ink-100 text-ink-600'}`}>
                      {s.status === 'completed' ? 'Completed' : `${s.duration_minutes} min`}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-ink-900">{s.topic}</h3>
                  <p className="mt-1 text-xs text-ink-500 line-clamp-2">{s.objective}</p>
                </div>
                {s.status !== 'completed' ? (
                  <button
                    onClick={() => handleCompleteSession(s.id)}
                    className="mt-4 btn-secondary text-xs py-2 w-full flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark Session Complete
                  </button>
                ) : (
                  <p className="mt-4 text-xs font-semibold text-success-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Session Finished
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Session summary OR first diagnostic prompt */}
      {hasResults ? (
        <section>
          <h2 className="font-display text-lg font-bold text-ink-900 mb-3">
            Current session summary
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStat icon={Radar} label="Topics Assessed" value={summary.total} tone="brand" />
            <SummaryStat icon={AlertTriangle} label="Needs Attention" value={summary.needs} tone="warning" />
            <SummaryStat icon={CheckCircle2} label="Solid" value={summary.solid} tone="success" />
            <SummaryStat icon={CircleDashed} label="Insufficient Evidence" value={summary.insufficient} tone="neutral" />
          </div>
        </section>
      ) : (
        <section className="card p-6 sm:p-8 border-l-4 border-l-brand-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Your First Diagnostic
                </p>
                <h3 className="font-display text-lg font-bold text-ink-900 mt-0.5">
                  Take a short assessment to discover which topics need your attention.
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  You'll see evidence for every answer and a clear priority list — no black-box scoring.
                </p>
              </div>
            </div>
            <Link to="/diagnostic/setup" className="btn-primary shrink-0">
              <Stethoscope className="h-4.5 w-4.5" />
              Start Diagnostic
            </Link>
          </div>
        </section>
      )}

      {/* Next action */}
      {hasResults && needsAttentionTopic ? (
        <section className="card p-6 sm:p-7 border-l-4 border-l-brand-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Recommended Next Action
                </p>
                <h3 className="font-display text-lg font-bold text-ink-900 mt-0.5">
                  Practice {needsAttentionTopic.topic}
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  Your highest-priority topic is waiting for you.
                </p>
              </div>
            </div>
            <Link to="/practice" className="btn-primary shrink-0">
              <Sparkles className="h-4 w-4" />
              Practice Now
            </Link>
          </div>
        </section>
      ) : !hasResults ? (
        <section className="card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 shrink-0">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Next action
                </p>
                <h3 className="font-display text-lg font-bold text-ink-900 mt-0.5">
                  Start Your First Diagnostic
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  Once you complete a diagnostic, we'll recommend what to practice next.
                </p>
              </div>
            </div>
            <Link to="/diagnostic/setup" className="btn-secondary shrink-0">
              <ArrowRight className="h-4 w-4" />
              Start Diagnostic
            </Link>
          </div>
        </section>
      ) : null}

      {/* Results preview if available */}
      {hasResults && localResults && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink-900">Latest diagnostic</h2>
            <button
              onClick={() => navigate('/results')}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View results
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {localResults.topics.map((t) => (
              <div key={t.topic} className="card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink-800">{t.topic}</h3>
                  <span className={`badge ${statusClasses(t.status)}`}>{statusLabel(t.status)}</span>
                </div>
                <p className="mt-2 text-2xl font-display font-bold text-ink-900">
                  {t.correct}/{t.total}
                </p>
                {localResults.examDate && (
                  <p className="mt-2 text-xs text-ink-400 flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Exam {formatDate(localResults.examDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function buildSummary(results: DiagnosticResult | null) {
  if (!results) {
    return { total: 0, needs: 0, solid: 0, insufficient: 0 };
  }
  const topics = results.topics;
  return {
    total: topics.length,
    needs: topics.filter((t) => t.status === 'needs-attention').length,
    solid: topics.filter((t) => t.status === 'solid').length,
    insufficient: topics.filter((t) => t.status === 'insufficient-evidence').length,
  };
}

function PrepCard({
  title,
  subtitle,
  progress,
  tone,
}: {
  title: string;
  subtitle: string;
  progress: string;
  tone: 'brand' | 'muted';
}) {
  const content = (
    <div className={`rounded-xl bg-ink-50 p-4 ${tone === 'brand' ? 'hover:bg-brand-50/40 transition-colors border border-transparent hover:border-brand-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-bold text-ink-900">{title}</h3>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
            tone === 'brand' ? 'bg-brand-500' : 'bg-ink-300'
          }`}
        />
      </div>
      <p className="mt-3 text-xs font-medium text-ink-400 uppercase tracking-wider">{progress}</p>
    </div>
  );

  if (tone === 'brand') {
    return <Link to="/prep">{content}</Link>;
  }
  return content;
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Radar;
  label: string;
  value: number;
  tone: 'brand' | 'warning' | 'success' | 'neutral';
}) {
  const toneClasses =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-600'
      : tone === 'warning'
      ? 'bg-warning-50 text-warning-600'
      : tone === 'success'
      ? 'bg-success-50 text-success-600'
      : 'bg-ink-100 text-ink-500';
  return (
    <div className="card p-4 sm:p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
