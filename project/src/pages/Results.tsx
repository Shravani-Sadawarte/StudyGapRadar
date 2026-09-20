import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  CircleDashed,
  Target,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Award,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { storage } from '@/lib/storage';
import {
  statusLabel,
  statusClasses,
  answerStatusClasses,
  answerLabel,
  priorityScore,
} from '@/lib/scoring';
import { DIAGNOSTIC_QUESTIONS } from '@/lib/mockData';
import type { TopicResult, AnswerStatus, DiagnosticResult } from '@/lib/types';
import { api } from '@/lib/api';

export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState<DiagnosticResult | null>(() => storage.getResults());
  const [isLoading, setIsLoading] = useState(!storage.getResults());
  const [overallData, setOverallData] = useState<any>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await api.knowledge.results();
        if (res.success && res.data && res.data.topics?.length > 0) {
          const liveResult: DiagnosticResult = {
            subject: res.data.subject,
            examDate: res.data.exam_date,
            createdAt: res.data.created_at || new Date().toISOString(),
            topics: res.data.topics,
          };
          setResult(liveResult);
          setOverallData(res.data);
          storage.setResults(liveResult);
        }
      } catch {
        // Fallback to local storage if API is temporarily unavailable
        const cached = storage.getResults();
        if (cached) setResult(cached);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, []);

  const weakTopics = useMemo(() => {
    if (!result) return [];
    return result.topics.filter((t) => t.status === 'needs-attention');
  }, [result]);

  const otherTopics = useMemo(() => {
    if (!result) return [];
    return result.topics.filter((t) => t.status !== 'needs-attention');
  }, [result]);

  // Rank weak topics by priority score
  const rankedWeak = useMemo(() => {
    if (!result) return [];
    return weakTopics
      .map((t) => ({ topic: t, score: priorityScore(t, result.examDate) }))
      .sort((a, b) => b.score.score - a.score.score);
  }, [weakTopics, result?.examDate]);

  // Compute overall stats
  const stats = useMemo(() => {
    if (!result || !result.topics || result.topics.length === 0) {
      return { totalQuestions: 0, correct: 0, incorrect: 0, percentage: 0 };
    }
    const totalQuestions = result.topics.reduce((sum, t) => sum + (t.total || 0), 0);
    const correct = result.topics.reduce((sum, t) => sum + (t.correct || 0), 0);
    const incorrect = Math.max(0, totalQuestions - correct);
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { totalQuestions, correct, incorrect, percentage };
  }, [result]);

  // Generate user-facing summary
  const summaryText = useMemo(() => {
    if (!result || !result.topics || result.topics.length === 0) return '';
    const strongList = result.topics.filter((t) => t.status === 'solid').map((t) => t.topic);
    const weakList = result.topics.filter((t) => t.status === 'needs-attention').map((t) => t.topic);

    if (strongList.length > 0 && weakList.length > 0) {
      return `Your strongest area is ${strongList.join(' & ')}. In contrast, ${weakList.join(', ')} require targeted revision before your upcoming exam.`;
    }
    if (weakList.length > 0) {
      return `${weakList.join(', ')} require immediate focus to close knowledge gaps before your exam.`;
    }
    if (strongList.length > 0) {
      return `Excellent work! You demonstrated solid understanding across ${strongList.join(', ')}. Keep revising to maintain peak retention.`;
    }
    return `Diagnostic assessment recorded across ${result.topics.length} core topics.`;
  }, [result]);

  // Generate concrete recommendations
  const recommendations = useMemo(() => {
    if (!result) return [];
    const recs: { title: string; action: string; topic: string }[] = [];
    weakTopics.forEach((t) => {
      if (t.topic.toLowerCase().includes('tree')) {
        recs.push({
          title: 'Review Tree Traversals',
          action: 'Study In-order, Pre-order, and Post-order recursive operations and boundary conditions.',
          topic: t.topic,
        });
      } else if (t.topic.toLowerCase().includes('recursion')) {
        recs.push({
          title: 'Master Base Cases & Call Stacks',
          action: 'Work through 8 recursion trace exercises focusing on termination conditions.',
          topic: t.topic,
        });
      } else if (t.topic.toLowerCase().includes('array')) {
        recs.push({
          title: 'Strengthen Contiguous Memory Operations',
          action: 'Practice two-pointer array algorithms and shift operations.',
          topic: t.topic,
        });
      } else if (t.topic.toLowerCase().includes('list')) {
        recs.push({
          title: 'Linked List Pointer Manipulation',
          action: 'Review node reversal and cycle detection using fast & slow pointers.',
          topic: t.topic,
        });
      } else {
        recs.push({
          title: `Deepen ${t.topic} Foundations`,
          action: `Complete 5 targeted practice problems to build confidence in ${t.topic}.`,
          topic: t.topic,
        });
      }
    });

    if (recs.length === 0) {
      recs.push({
        title: 'Maintain Topic Mastery',
        action: 'Take a comprehensive mock exam to reinforce your solid foundations.',
        topic: result.subject || 'All Topics',
      });
    }

    return recs;
  }, [result, weakTopics]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-16 text-center animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 animate-spin">
            <CircleDashed className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900">Loading your diagnostic results...</h2>
          <p className="mt-1 text-sm text-ink-500">Retrieving topic evidence, gap analysis, and priority scores.</p>
        </div>
      </AppShell>
    );
  }

  if (!result || result.topics.length === 0) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-ink-100 text-ink-500 mb-4">
            <Target className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">No results recorded yet</h1>
          <p className="mt-2 text-sm text-ink-500">
            Take a diagnostic assessment to uncover your knowledge gaps, examine evidence, and generate an adaptive study schedule.
          </p>
          <button onClick={() => navigate('/diagnostic/setup')} className="btn-primary mt-6">
            Start a Diagnostic
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AppShell>
    );
  }

  const hasExamDate = !!result.examDate;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
        {/* Header */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Diagnostic & Knowledge Gap Analysis
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-1">
            Your Assessment Results
          </h1>
          <p className="mt-1 text-ink-500">
            {result.subject} · {result.topics.length} syllabus topics evaluated
            {result.examDate ? ` · Target Exam: ${formatDate(result.examDate)}` : ''}
          </p>
        </div>

        {/* Overall Result Metric Card */}
        <section className="card p-6 sm:p-7 bg-gradient-to-br from-brand-900 to-ink-900 text-white border-0 relative overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Overall Diagnostic Score</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold">
                    {stats.correct} / {stats.totalQuestions}
                  </span>
                  <span className="text-lg font-semibold text-brand-300">
                    ({stats.percentage}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-white/10 text-white border border-white/20 px-3 py-1.5 text-xs">
                  {overallData?.strengths?.length || otherTopics.length} Strong Topics
                </span>
                <span className="badge bg-warning-500/20 text-warning-300 border border-warning-500/30 px-3 py-1.5 text-xs">
                  {weakTopics.length} Need Focus
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-brand-200">Attempted</p>
                <p className="mt-1 font-display text-xl font-bold">{stats.totalQuestions}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-success-300">Correct</p>
                <p className="mt-1 font-display text-xl font-bold text-success-400">{stats.correct}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-danger-300">Incorrect</p>
                <p className="mt-1 font-display text-xl font-bold text-danger-400">{stats.incorrect}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-brand-200">Exam Readiness</p>
                <p className="mt-1 font-display text-sm font-bold text-brand-300">
                  {stats.percentage >= 75 ? 'Prepared' : stats.percentage >= 50 ? 'Moderate' : 'Action Required'}
                </p>
              </div>
            </div>

            {/* AI Summary Statement */}
            <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/10 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-brand-300 shrink-0 mt-0.5" />
              <p className="text-sm text-brand-100 leading-relaxed font-medium">
                {summaryText}
              </p>
            </div>
          </div>
        </section>

        {/* Visual Topic Mastery Meters */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-600" />
            Topic Mastery & Performance Breakdown
          </h2>
          <div className="space-y-4">
            {result.topics.map((t) => {
              const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
              const barColor =
                t.status === 'solid'
                  ? 'bg-success-500'
                  : t.status === 'needs-attention'
                  ? 'bg-warning-500'
                  : 'bg-ink-400';
              return (
                <div key={t.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800">{t.topic}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-ink-500 font-medium">
                        {t.correct}/{t.total} Correct
                      </span>
                      <span className={`badge text-[11px] ${statusClasses(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                      <span className="font-display font-bold text-xs text-ink-900 w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Concrete Recommendations */}
        <section className="card p-6 border-l-4 border-l-brand-600">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-brand-600" />
            <h2 className="font-display text-lg font-bold text-ink-900">
              Recommended Next Steps
            </h2>
          </div>
          <p className="text-xs text-ink-500 mb-4">
            Personalized action items generated by the Planning and Knowledge Agents.
          </p>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-ink-50/70 p-3.5 rounded-xl border border-ink-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-display font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-ink-900">{rec.title}</h3>
                    <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">{rec.topic}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-600 leading-relaxed">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topic Result Cards Grid */}
        <section className="grid sm:grid-cols-3 gap-4">
          {result.topics.map((t) => (
            <ResultCard key={t.topic} topic={t} examDate={result.examDate} />
          ))}
        </section>

        {/* Priority Section: What to Revise First */}
        {rankedWeak.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-warning-600" />
                <h2 className="font-display text-xl font-bold text-ink-900">
                  What to Revise First
                </h2>
              </div>
              <span className="text-xs font-semibold text-warning-700 bg-warning-50 border border-warning-200 px-2.5 py-1 rounded-full">
                70% Severity + 30% Urgency
              </span>
            </div>

            {!hasExamDate && (
              <p className="text-sm text-ink-500 italic bg-ink-50 border border-ink-200 rounded-lg px-4 py-2.5">
                Exam timeline unavailable — priority ranking based on topic performance severity.
              </p>
            )}

            <div className="space-y-3">
              {rankedWeak.map(({ topic, score }, idx) => (
                <PriorityCard
                  key={topic.topic}
                  topic={topic}
                  rank={idx + 1}
                  severity={score.severity}
                  urgency={score.urgency}
                  hasExamDate={score.hasExamDate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other Results */}
        {otherTopics.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-ink-900">Solid Knowledge Areas</h2>
            <div className="space-y-3">
              {otherTopics.map((t) => (
                <OtherResultRow key={t.topic} topic={t} />
              ))}
            </div>
          </section>
        )}

        {/* Evidence Section */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">Verification Evidence</h2>
            <p className="text-sm text-ink-500">
              Full audit trace behind every score. Expand any topic to inspect each question and explanation.
            </p>
          </div>
          <div className="space-y-4">
            {result.topics.map((t) => (
              <EvidenceCard key={t.topic} topic={t} />
            ))}
          </div>
        </section>

        {/* Next Actions CTA Card */}
        <section className="card p-6 sm:p-7 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 relative overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold">Ready to take action?</h2>
              <p className="mt-1 text-brand-100 text-sm">
                {rankedWeak.length > 0
                  ? `Jump into targeted practice for ${rankedWeak[0].topic.topic}, or view your updated study calendar.`
                  : 'Practice comprehensive revision questions or view your adaptive study plan.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => navigate('/prep')}
                className="btn bg-white/20 text-white hover:bg-white/30 border border-white/20 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                View Study Plan
              </button>
              <button
                onClick={() => navigate('/practice')}
                className="btn bg-white text-brand-700 hover:bg-brand-50 text-sm font-semibold"
              >
                <Dumbbell className="h-4 w-4" />
                {rankedWeak.length > 0 ? `Practice ${rankedWeak[0].topic.topic}` : 'Start Practice'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ResultCard({ topic, examDate }: { topic: TopicResult; examDate: string | null }) {
  const Icon =
    topic.status === 'solid'
      ? CheckCircle2
      : topic.status === 'needs-attention'
      ? AlertTriangle
      : CircleDashed;
  const iconColor =
    topic.status === 'solid'
      ? 'text-success-600 bg-success-50'
      : topic.status === 'needs-attention'
      ? 'text-warning-600 bg-warning-50'
      : 'text-ink-500 bg-ink-100';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className={`badge ${statusClasses(topic.status)}`}>{statusLabel(topic.status)}</span>
      </div>
      <h3 className="mt-3 font-display font-bold text-ink-900">{topic.topic}</h3>
      <p className="mt-1 text-2xl font-display font-extrabold text-ink-900">
        {topic.correct}/{topic.total}
      </p>
      <p className="mt-1 text-xs text-ink-400">
        {topic.attempted} attempted
        {examDate ? ` · Exam ${formatDate(examDate)}` : ''}
      </p>
    </div>
  );
}

function PriorityCard({
  topic,
  rank,
  severity,
  urgency,
  hasExamDate,
}: {
  topic: TopicResult;
  rank: number;
  severity: number;
  urgency: number;
  hasExamDate: boolean;
}) {
  const severityPct = Math.round(severity * 100);
  const urgencyPct = Math.round(urgency * 100);
  return (
    <div className="card p-5 border-l-4 border-l-warning-500">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-100 text-warning-700 font-display font-bold text-sm">
            {rank}
          </span>
          <div>
            <h3 className="font-display font-bold text-ink-900">{topic.topic}</h3>
            <p className="text-xs text-warning-600 font-semibold">Priority Gap Focus</p>
          </div>
        </div>
        <span className="badge bg-warning-100 text-warning-700 border border-warning-500/30">
          {topic.correct}/{topic.total} · Needs Attention
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <WeightBar label="Gap Severity" weight="70%" pct={severityPct} tone="warning" />
        <WeightBar
          label="Exam Urgency"
          weight="30%"
          pct={hasExamDate ? urgencyPct : 0}
          tone={hasExamDate ? 'brand' : 'neutral'}
          note={hasExamDate ? undefined : 'No exam date'}
        />
      </div>
    </div>
  );
}

function WeightBar({
  label,
  weight,
  pct,
  tone,
  note,
}: {
  label: string;
  weight: string;
  pct: number;
  tone: 'warning' | 'brand' | 'neutral';
  note?: string;
}) {
  const bar =
    tone === 'warning' ? 'bg-warning-500' : tone === 'brand' ? 'bg-brand-500' : 'bg-ink-300';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="text-xs font-semibold text-ink-400">{weight}</p>
      </div>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-500">{note ?? `${pct}%`}</p>
    </div>
  );
}

function OtherResultRow({ topic }: { topic: TopicResult }) {
  const Icon = topic.status === 'solid' ? CheckCircle2 : CircleDashed;
  const iconColor =
    topic.status === 'solid' ? 'text-success-600 bg-success-50' : 'text-ink-500 bg-ink-100';
  return (
    <div className="card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium text-ink-800">{topic.topic}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-ink-700">
          {topic.correct}/{topic.total}
        </span>
        <span className={`badge ${statusClasses(topic.status)}`}>{statusLabel(topic.status)}</span>
      </div>
    </div>
  );
}

function EvidenceCard({ topic }: { topic: TopicResult }) {
  const [open, setOpen] = useState(false);
  const answersList = topic.answers || [];

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`badge ${statusClasses(topic.status)}`}>{statusLabel(topic.status)}</span>
          <span className="font-display font-bold text-ink-900">{topic.topic}</span>
          <span className="text-sm text-ink-500">
            {topic.correct}/{topic.total} correct
          </span>
        </div>
        {open ? <ChevronUp className="h-4.5 w-4.5 text-ink-400" /> : <ChevronDown className="h-4.5 w-4.5 text-ink-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-2.5 animate-fade-in">
          {answersList.length === 0 ? (
            <p className="text-xs text-ink-400 italic py-2">No individual questions logged for this topic.</p>
          ) : (
            answersList.map((ans, i) => {
              const qId = (ans as any).questionId || (ans as any).question_id;
              const q = (ans as any).prompt
                ? (ans as any)
                : DIAGNOSTIC_QUESTIONS.find((dq) => dq.id === qId) || {
                    prompt: 'Diagnostic question',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctIndex: 0,
                  };
              return <EvidenceRow key={qId || i} index={i} question={q} answer={ans} />;
            })
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceRow({
  index,
  question,
  answer,
}: {
  index: number;
  question: { prompt: string; options: string[]; correctIndex?: number; correct_index?: number; explanation?: string };
  answer: { status: AnswerStatus; selectedIndex?: number | null; selected_index?: number | null };
}) {
  const isCorrect = answer.status === 'correct';
  const Icon = isCorrect ? CheckCircle2 : answer.status === 'incorrect' ? XCircle : MinusCircle;
  const iconColor = isCorrect ? 'text-success-600' : answer.status === 'incorrect' ? 'text-danger-600' : 'text-ink-400';
  const selectedIdx = answer.selectedIndex ?? answer.selected_index;
  const correctIdx = question.correctIndex ?? question.correct_index ?? 0;

  return (
    <div className="rounded-xl border border-ink-100 p-3.5">
      <div className="flex items-start gap-2.5">
        <Icon className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-800 line-clamp-2">
            <span className="text-ink-400 font-normal">Q{index + 1}.</span> {question.prompt}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${answerStatusClasses(answer.status)}`}>
              {answerLabel(answer.status)}
            </span>
            {answer.status === 'incorrect' && selectedIdx !== null && selectedIdx !== undefined && question.options?.[selectedIdx] && (
              <span className="text-xs text-ink-500">
                Your answer: <span className="font-medium text-danger-700">{question.options[selectedIdx]}</span>
              </span>
            )}
            {!isCorrect && question.options?.[correctIdx] && (
              <span className="text-xs text-ink-500">
                Correct answer: <span className="font-medium text-success-700">{question.options[correctIdx]}</span>
              </span>
            )}
          </div>
          {question.explanation && (
            <p className="mt-2 text-xs text-ink-500 italic bg-ink-50 p-2 rounded-lg border border-ink-100">
              {question.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const cleanIso = iso.includes('T') ? iso : `${iso}T00:00:00`;
    const d = new Date(cleanIso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
