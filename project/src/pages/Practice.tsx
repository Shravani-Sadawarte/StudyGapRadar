import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  SkipForward,
  Flag,
  Lightbulb,
  Dumbbell,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { PRACTICE_QUESTIONS } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import type { PracticeAnswer, ReportEntry, TopicResult } from '@/lib/types';
import { ReportQuestionModal } from '@/components/ReportQuestionModal';
import { api } from '@/lib/api';

const REPORT_REASONS = [
  'Incorrect answer',
  'Ambiguous',
  'Wrong topic',
  'Difficulty seems wrong',
  'Other',
];

export default function Practice() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<PracticeAnswer[]>(() => storage.getPractice() ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>(PRACTICE_QUESTIONS);

  // Determine the practice topic: first needs-attention topic from results, else Recursion.
  const results = storage.getResults();
  const needsTopic: TopicResult | undefined = results?.topics.find(
    (t) => t.status === 'needs-attention'
  );
  const practiceTopic = needsTopic?.topic ?? 'Recursion';

  // Fetch topic-specific practice questions from backend
  useEffect(() => {
    async function loadQuizQuestions() {
      try {
        const res = await api.quiz.generate(practiceTopic);
        if (res.success && res.data.questions?.length > 0) {
          const qs = res.data.questions.map((q: any) => ({
            id: q.id,
            topic: q.topic,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correct_index ?? 1,
            explanation: q.explanation ?? 'Review your answer after submission.',
          }));
          setQuizQuestions(qs);
        }
      } catch {
        // Fallback to static practice set
      }
    }
    loadQuizQuestions();
  }, [practiceTopic]);

  const questions = quizQuestions;
  const currentIndex = answers.length;
  const isComplete = answers.length >= questions.length;

  useEffect(() => {
    if (isComplete && questions.length > 0) {
      navigate('/practice/complete', { replace: true });
    }
  }, [isComplete, questions.length, navigate]);

  if (isComplete) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-16 text-center animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 animate-spin">
            <CircleDashed className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900">Submitting practice answers...</h2>
        </div>
      </AppShell>
    );
  }

  if (questions.length === 0) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-16 text-center animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 animate-spin">
            <CircleDashed className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900">Loading practice questions...</h2>
          <p className="mt-1 text-sm text-ink-500">Retrieving targeted problems for {practiceTopic}.</p>
        </div>
      </AppShell>
    );
  }

  const question = questions[currentIndex] || questions[0];

  const finalizeQuiz = async (finalAnswers: PracticeAnswer[]) => {
    try {
      const payload = finalAnswers.map((a) => ({
        question_id: a.questionId,
        selected_index: a.selectedIndex,
      }));
      const res = await api.quiz.submit(practiceTopic, payload);
      if (res.success && res.data) {
        localStorage.setItem('sgr.lastQuizResult', JSON.stringify(res.data));
      }
    } catch {
      // ignore
    }
    navigate('/practice/complete');
  };

  const handleSubmit = async () => {
    if (selected === null) return;
    const isCorrect = selected === question.correctIndex;
    const answer: PracticeAnswer = {
      questionId: question.id,
      selectedIndex: selected,
      status: isCorrect ? 'correct' : 'incorrect',
    };
    const next = [...answers, answer];
    setAnswers(next);
    storage.setPractice(next);
    setLocked(true);
  };

  const handleSkip = () => {
    const answer: PracticeAnswer = {
      questionId: question.id,
      selectedIndex: null,
      status: 'unattempted',
    };
    const next = [...answers, answer];
    setAnswers(next);
    storage.setPractice(next);
    if (next.length >= questions.length) {
      finalizeQuiz(next);
    }
  };

  const handleNext = () => {
    if (answers.length >= questions.length) {
      finalizeQuiz(answers);
    } else {
      setSelected(null);
      setLocked(false);
    }
  };

  const isCorrect = locked && selected === question.correctIndex;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Dumbbell className="h-4.5 w-4.5" />
            </span>
            <span className="font-display font-bold text-ink-900">{practiceTopic} Practice</span>
          </div>
          <p className="text-sm font-semibold text-brand-600">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <div className="mt-2 h-1.5 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-snug">
            {question.prompt}
          </h1>

          <div className="mt-6 space-y-3">
            {question.options.map((opt: string, i: number) => {
              const isSelected = selected === i;
              const showCorrect = locked && i === question.correctIndex;
              const showIncorrect = locked && isSelected && i !== question.correctIndex;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setSelected(i)}
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
                isCorrect ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'
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
                  <p className="mt-1 text-sm text-ink-600 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            {!locked ? (
              <>
                <button onClick={handleSkip} className="btn-secondary flex-1">
                  <SkipForward className="h-4 w-4" />
                  Skip
                </button>
                <button onClick={handleSubmit} disabled={selected === null} className="btn-primary flex-1">
                  Submit
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setReportOpen(true)} className="btn-ghost flex-1">
                  <Flag className="h-4 w-4" />
                  Report a Question
                </button>
                <button onClick={handleNext} className="btn-primary flex-1">
                  {currentIndex + 1 >= questions.length ? 'Finish Practice' : 'Next'}
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>

          {locked && (
            <p className="mt-3 text-center text-xs text-ink-400 flex items-center justify-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Review the explanation, then continue.
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {questions.map((q, i) => {
            const ans = answers[i];
            return (
              <span
                key={q.id || i}
                className={`h-2 w-2 rounded-full ${
                  i < answers.length
                    ? ans.status === 'correct'
                      ? 'bg-success-500'
                      : ans.status === 'incorrect'
                      ? 'bg-danger-500'
                      : 'bg-ink-300'
                    : i === currentIndex
                    ? 'bg-brand-600'
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
          topic={practiceTopic}
          reasons={REPORT_REASONS}
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, note) => {
            const entry: ReportEntry = {
              id: `rpt-${Date.now()}`,
              questionId: question.id,
              topic: practiceTopic,
              reason,
              note,
              createdAt: new Date().toISOString(),
            };
            storage.addReport(entry);
            api.reports.submit(question.id, practiceTopic, reason, note).catch(() => {});
            setReportOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
