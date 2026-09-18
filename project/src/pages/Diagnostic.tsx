import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowRight,
  SkipForward,
  Flag,
  X,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { DIAGNOSTIC_QUESTIONS, PRACTICE_QUESTIONS } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { buildTopicResult } from '@/lib/scoring';
import type { TopicAnswer, DiagnosticResult, ReportEntry } from '@/lib/types';
import { ReportQuestionModal } from '@/components/ReportQuestionModal';
import { api } from '@/lib/api';

interface DiagnosticState {
  subject: string;
  topics: string[];
  examDate: string | null;
  queue: { questionId: string; topic: string }[];
  answers: Record<string, TopicAnswer>;
  currentIndex: number;
}

const REPORT_REASONS = [
  'Incorrect answer',
  'Ambiguous',
  'Wrong topic',
  'Difficulty seems wrong',
  'Other',
];

export default function Diagnostic() {
  const navigate = useNavigate();
  const [state, setState] = useState<DiagnosticState | null>(() =>
    storage.getDiagnosticState<DiagnosticState>()
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Sync local selection with existing answer when navigating.
  useEffect(() => {
    if (!state) return;
    const current = state.queue[state.currentIndex];
    const existing = current ? state.answers[current.questionId] : undefined;
    if (existing && existing.selectedIndex !== null) {
      setSelected(existing.selectedIndex);
      setLocked(true);
    } else {
      setSelected(null);
      setLocked(false);
    }
  }, [state?.currentIndex, state?.queue]);

  const current = state?.queue?.[state?.currentIndex ?? 0];
  const topicQuestions = useMemo(
    () => (state?.queue && current ? state.queue.filter((q) => q.topic === current.topic) : []),
    [current?.topic, state?.queue]
  );

  if (!state || state.queue.length === 0 || !current) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-16">
          <AlertCircle className="h-10 w-10 text-ink-400 mx-auto" />
          <h1 className="mt-4 font-display text-xl font-bold text-ink-900">
            No diagnostic in progress
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Set up a diagnostic to begin assessing your topics.
          </p>
          <button onClick={() => navigate('/diagnostic/setup')} className="btn-primary mt-6">
            Set up diagnostic
          </button>
        </div>
      </AppShell>
    );
  }

  const backendQ = (state as any).questions?.find((q: any) => q.id === current.questionId);
  const staticQ = DIAGNOSTIC_QUESTIONS.find((q) => q.id === current.questionId);
  const question = backendQ
    ? {
        id: backendQ.id,
        topic: backendQ.topic,
        prompt: backendQ.prompt,
        options: backendQ.options,
        correctIndex: backendQ.correct_index ?? 1,
        explanation: backendQ.explanation ?? 'Review your answer after submission.',
      }
    : (staticQ || {
        id: current.questionId,
        topic: current.topic,
        prompt: (current as any).prompt || 'Assessment question',
        options: (current as any).options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 1,
        explanation: 'Review answer and core topic concepts.',
      });

  const topicQuestionNumber =
    topicQuestions.findIndex((q) => q.questionId === current.questionId) + 1;

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = selected === question.correctIndex;
    const answer: TopicAnswer = {
      questionId: question.id,
      selectedIndex: selected,
      status: isCorrect ? 'correct' : 'incorrect',
    };
    const next = {
      ...state,
      answers: { ...state.answers, [question.id]: answer },
    };
    setLocked(true);
    setState(next);
    storage.setDiagnosticState(next);
  };

  const handleSkip = () => {
    const answer: TopicAnswer = {
      questionId: question.id,
      selectedIndex: null,
      status: 'unattempted',
    };
    const next = {
      ...state,
      answers: { ...state.answers, [question.id]: answer },
    };
    setState(next);
    storage.setDiagnosticState(next);
    goNext(next);
  };

  const goNext = (s: DiagnosticState = state) => {
    if (!s) return;
    if (s.currentIndex + 1 >= s.queue.length) {
      finishDiagnostic(s);
    } else {
      const next = { ...s, currentIndex: s.currentIndex + 1 };
      setState(next);
      storage.setDiagnosticState(next);
    }
  };

  const finishDiagnostic = async (s: DiagnosticState) => {
    if ((s as any).attemptId) {
      try {
        const answersPayload = Object.entries(s.answers).map(([qId, ans]: [string, any]) => ({
          question_id: qId,
          selected_index: ans.selectedIndex,
        }));
        const res = await api.diagnostic.submit((s as any).attemptId, answersPayload);
        if (res.success && res.data) {
          const backendResults: DiagnosticResult = {
            subject: res.data.subject,
            examDate: res.data.exam_date,
            createdAt: res.data.created_at,
            topics: res.data.topics,
          };
          storage.setResults(backendResults);
          storage.clearDiagnosticState();
          storage.clearPractice();
          localStorage.removeItem('sgr.lastQuizResult');
          navigate('/results');
          return;
        }
      } catch {
        // Fallback to local scoring if backend fails
      }
    }

    const results: DiagnosticResult = {
      subject: s.subject,
      examDate: s.examDate,
      createdAt: new Date().toISOString(),
      topics: s.topics.map((topic) => {
        const topicQs = DIAGNOSTIC_QUESTIONS.filter((q) => q.topic === topic);
        const answers = topicQs.map((q) => s.answers[q.id] ?? {
          questionId: q.id,
          selectedIndex: null,
          status: 'unattempted' as const,
        });
        return buildTopicResult(topic, answers, topicQs.length);
      }),
    };
    storage.setResults(results);
    storage.clearDiagnosticState();
    const needsTopic = results.topics.find((t) => t.status === 'needs-attention');
    if (needsTopic) {
      storage.setPractice([]);
    }
    navigate('/results');
  };

  const isCorrect = locked && selected === question.correctIndex;
  const isIncorrect = locked && selected !== null && selected !== question.correctIndex;
  const userAnswered = !!state.answers[question.id];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-brand-600">
              {current.topic} — Question {topicQuestionNumber} of {topicQuestions.length}
            </p>
            <p className="text-xs text-ink-400">
              {state.currentIndex + 1} of {state.queue.length} overall
            </p>
          </div>
          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{
                width: `${((state.currentIndex + (locked || userAnswered ? 1 : 0)) / state.queue.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-snug">
            {question.prompt}
          </h1>

          <div className="mt-6 space-y-3">
            {question.options.map((opt, i) => {
              const isSelected = selected === i;
              const showCorrect = locked && i === question.correctIndex;
              const showIncorrect = locked && isSelected && i !== question.correctIndex;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setSelected(i);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                    showCorrect
                      ? 'border-success-500 bg-success-50'
                      : showIncorrect
                      ? 'border-danger-500 bg-danger-50'
                      : isSelected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                  } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                        showCorrect
                          ? 'bg-success-500 border-success-500 text-white'
                          : showIncorrect
                          ? 'bg-danger-500 border-danger-500 text-white'
                          : isSelected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-ink-300 text-ink-500'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium text-ink-800">{opt}</span>
                  </span>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-success-600" />}
                  {showIncorrect && <XCircle className="h-5 w-5 text-danger-600" />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {locked && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3.5 animate-fade-in ${
                isCorrect
                  ? 'bg-success-50 border-success-200'
                  : 'bg-danger-50 border-danger-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-success-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${isCorrect ? 'text-success-700' : 'text-danger-700'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            {!locked ? (
              <>
                <button
                  onClick={handleSkip}
                  className="btn-secondary flex-1"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className="btn-primary flex-1"
                >
                  Submit Answer
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setReportOpen(true)}
                  className="btn-ghost flex-1"
                >
                  <Flag className="h-4 w-4" />
                  Report a Question
                </button>
                <button onClick={() => goNext()} className="btn-primary flex-1">
                  {state.currentIndex + 1 >= state.queue.length ? 'See Results' : 'Next'}
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>

          {locked && (
            <p className="mt-3 text-center text-xs text-ink-400 flex items-center justify-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Your answer is locked. Review the explanation, then continue.
            </p>
          )}
        </div>

        {/* Topic progress dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {state.queue.map((item, i) => {
            const ans = state.answers[item.questionId];
            const done = !!ans;
            const isCurrent = i === state.currentIndex;
            return (
              <span
                key={item.questionId}
                className={`h-2 w-2 rounded-full transition-colors ${
                  isCurrent
                    ? 'bg-brand-600'
                    : done
                    ? ans.status === 'correct'
                      ? 'bg-success-500'
                      : ans.status === 'incorrect'
                      ? 'bg-danger-500'
                      : 'bg-ink-300'
                    : 'bg-ink-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {reportOpen && (
        <ReportQuestionModal
          questionId={question.id}
          topic={current.topic}
          reasons={REPORT_REASONS}
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, note) => {
            const entry: ReportEntry = {
              id: `rpt-${Date.now()}`,
              questionId: question.id,
              topic: current.topic,
              reason,
              note,
              createdAt: new Date().toISOString(),
            };
            storage.addReport(entry);
            setReportOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}

// keep imports referenced
void PRACTICE_QUESTIONS;
void MinusCircle;
void X;
