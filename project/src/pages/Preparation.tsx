import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Check,
  Dumbbell,
  Clock,
  FileText,
  Target,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { api } from '@/lib/api';

export default function Preparation() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [planRes, knowRes, matRes] = await Promise.allSettled([
        api.plan.get(),
        api.knowledge.results(),
        api.materials.list(),
      ]);

      if (planRes.status === 'fulfilled' && planRes.value?.success && planRes.value?.data) {
        setPlan(planRes.value.data);
      }
      if (knowRes.status === 'fulfilled' && knowRes.value?.success && knowRes.value?.data) {
        setKnowledge(knowRes.value.data);
      }
      if (matRes.status === 'fulfilled' && matRes.value) {
        const val = matRes.value;
        const mList = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
        setMaterials(mList);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePlan = async () => {
    try {
      setActionLoading('generate');
      const res = await api.plan.generate('Data Structures', '2026-10-25', 2.0);
      if (res.success && res.data) {
        setPlan(res.data);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      setActionLoading(sessionId);
      await api.progress.sessionComplete(sessionId, 45, 'Completed preparation study session');
      await loadData();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 text-center animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 animate-spin">
            <CircleDashed className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900">Loading your preparation plan...</h2>
          <p className="mt-1 text-sm text-ink-500">Retrieving today's sessions, weak topics, and study milestones.</p>
        </div>
      </AppShell>
    );
  }

  // Empty State: If no plan exists yet
  if (!plan || !plan.sessions || plan.sessions.length === 0) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
            <CalendarClock className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Your personalized plan is being prepared</h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed">
            The Planning Agent customizes daily sessions around your exam timeline, available hours, and knowledge gap priorities.
          </p>
          <button
            onClick={handleGeneratePlan}
            disabled={actionLoading === 'generate'}
            className="btn-primary mt-6 mx-auto flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading === 'generate' ? 'animate-spin' : ''}`} />
            {actionLoading === 'generate' ? 'Generating Plan...' : 'Generate Study Plan Now'}
          </button>
        </div>
      </AppShell>
    );
  }

  const sessions = plan.sessions || [];
  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  const pendingSessions = sessions.filter((s: any) => s.status !== 'completed');
  const nextSession = pendingSessions[0] || sessions[0];
  const progressPct = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

  // Find weakest topic from knowledge or plan
  const weakestTopic =
    knowledge?.weaknesses?.[0] ||
    knowledge?.priority_topics?.[0]?.topic ||
    sessions.find((s: any) => s.priority === 'high')?.topic ||
    'Trees';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Exam Preparation & Study Plan
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-1">
              Active Study Plan
            </h1>
            <p className="mt-1 text-ink-500">
              {plan.subject} · {plan.days_remaining} days remaining until exam
              {plan.exam_date ? ` (${formatDate(plan.exam_date)})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/practice')}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Dumbbell className="h-4 w-4" />
              Take Practice Quiz
            </button>
            <button
              onClick={() => navigate('/ai-tools')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Tutor
            </button>
          </div>
        </div>

        {/* Top Highlight Banner: Next Recommended Session */}
        {nextSession && (
          <section className="card p-6 sm:p-7 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 relative overflow-hidden">
            <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="badge bg-white/20 text-white border border-white/20 text-xs px-3 py-1">
                  Next Priority Session
                </span>
                <span className="text-xs font-semibold text-brand-100 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {nextSession.duration_minutes} minutes
                </span>
              </div>

              <h2 className="mt-3 font-display text-2xl font-bold">
                {nextSession.topic} — {nextSession.activity}
              </h2>
              <p className="mt-1 text-brand-100 text-sm max-w-xl leading-relaxed">
                {nextSession.objective || `Focus on closing knowledge gaps in ${nextSession.topic}. Review core concepts and trace example problems.`}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {nextSession.status !== 'completed' ? (
                  <button
                    onClick={() => handleCompleteSession(nextSession.id)}
                    disabled={actionLoading === nextSession.id}
                    className="btn bg-white text-brand-700 hover:bg-brand-50 font-semibold text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    {actionLoading === nextSession.id ? 'Marking Done...' : 'Complete This Session'}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-success-500/20 text-white px-3.5 py-2 rounded-xl text-sm font-semibold border border-success-400/30">
                    <CheckCircle2 className="h-4 w-4 text-success-300" />
                    Session Completed
                  </span>
                )}
                <button
                  onClick={() => navigate('/ai-tools')}
                  className="btn bg-white/10 text-white hover:bg-white/20 border border-white/20 text-sm flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4 text-brand-200" />
                  Explain {nextSession.topic} in AI Tutor
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Preparation Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Plan Progress</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink-900">
              {completedSessions.length} / {sessions.length}
            </p>
            <div className="mt-2 h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-ink-500">{progressPct}% completed</p>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Weakest Area</p>
            <div className="mt-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0" />
              <p className="font-display text-lg font-bold text-ink-900 truncate">{weakestTopic}</p>
            </div>
            <p className="mt-1.5 text-xs text-warning-700 font-medium">Needs Attention</p>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Daily Study Target</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink-900">
              {plan.daily_study_hours || 2.0} hrs
            </p>
            <p className="mt-1.5 text-xs text-ink-500">~2 sessions per day</p>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Course Materials</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink-900">
              {materials.length} Ingested
            </p>
            <button
              onClick={() => navigate('/ai-tools')}
              className="mt-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Upload Notes <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>

        {/* Today's Scheduled Tasks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-brand-600" />
              <h2 className="font-display text-xl font-bold text-ink-900">Today's Focus Tasks</h2>
            </div>
            <span className="text-xs text-ink-500">
              {sessions.slice(0, 3).filter((s: any) => s.status === 'completed').length} of {Math.min(sessions.length, 3)} finished
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.slice(0, 3).map((s: any, idx: number) => {
              const isDone = s.status === 'completed';
              return (
                <div
                  key={s.id || idx}
                  className={`card p-5 border-l-4 ${
                    isDone ? 'border-l-success-500 bg-success-50/20' : 'border-l-brand-600'
                  } flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                        {s.activity || 'Study Session'}
                      </span>
                      <span className={`badge text-[11px] ${isDone ? 'bg-success-100 text-success-700' : 'bg-ink-100 text-ink-600'}`}>
                        {isDone ? 'Completed' : `${s.duration_minutes || 45}m`}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display font-bold text-base text-ink-900">{s.topic}</h3>
                    <p className="mt-1 text-xs text-ink-600 line-clamp-2 leading-relaxed">
                      {s.objective || `Study key algorithms and principles for ${s.topic}.`}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
                    {isDone ? (
                      <span className="text-xs font-semibold text-success-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCompleteSession(s.id)}
                        disabled={actionLoading === s.id}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 w-full justify-center"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {actionLoading === s.id ? 'Saving...' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Study Plan Roadmap (Next 10 sessions) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <h2 className="font-display text-xl font-bold text-ink-900">Upcoming Study Calendar</h2>
            </div>
            <span className="text-xs text-ink-500">{sessions.length} total sessions allocated</span>
          </div>

          <div className="card divide-y divide-ink-100 overflow-hidden">
            {sessions.slice(0, 8).map((s: any, idx: number) => {
              const isDone = s.status === 'completed';
              return (
                <div key={s.id || idx} className="p-4 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                        isDone ? 'bg-success-100 text-success-700' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {s.day_number || idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ink-900 truncate">{s.topic}</h4>
                        <span className="text-[11px] font-medium text-ink-400">· {s.activity}</span>
                      </div>
                      <p className="text-xs text-ink-500 truncate mt-0.5">{s.objective}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-ink-400 hidden sm:inline">{s.duration_minutes} min</span>
                    {isDone ? (
                      <span className="badge bg-success-100 text-success-700 text-xs">Completed</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteSession(s.id)}
                        disabled={actionLoading === s.id}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        {actionLoading === s.id ? '...' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Uploaded Study Notes Context */}
        {materials.length > 0 && (
          <section className="card p-5">
            <h3 className="font-display text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-brand-600" />
              Ingested Lecture Notes & Documents
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {materials.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">{m.filename || m.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {m.total_chunks || 1} chunks · {m.total_pages ? `${m.total_pages} pages` : 'Text format'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/ai-tools')}
                    className="btn-secondary text-xs py-1 px-2 shrink-0 ml-2"
                  >
                    Query in Tutor
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const cleanIso = iso.includes('T') ? iso : `${iso}T00:00:00`;
    const d = new Date(cleanIso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
