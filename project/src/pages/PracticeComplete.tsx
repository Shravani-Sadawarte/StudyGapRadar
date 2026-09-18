import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { storage } from '@/lib/storage';

export default function PracticeComplete() {
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('sgr.lastQuizResult');
    if (raw) {
      try {
        setQuizResult(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  const answers = storage.getPractice() ?? [];
  const correct = quizResult?.score ?? answers.filter((a) => a.status === 'correct').length;
  const total = quizResult?.total_questions ?? answers.length;

  const results = storage.getResults();
  const needsTopic = results?.topics.find((t) => t.status === 'needs-attention');
  const topic = quizResult?.topic ?? needsTopic?.topic ?? 'Recursion';

  const handleContinueRevision = () => {
    storage.clearPractice();
    localStorage.removeItem('sgr.lastQuizResult');
    navigate('/home');
  };

  const handleBackToResults = () => {
    storage.clearPractice();
    localStorage.removeItem('sgr.lastQuizResult');
    navigate('/results');
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="card p-8 sm:p-10 text-center">
          <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-success-100 text-success-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold text-ink-900">
            Practice Complete
          </h1>
          <p className="mt-2 text-ink-500">
            You've completed your targeted practice for {topic}.
          </p>

          {/* Score */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-50 border border-ink-200 px-4 py-2">
            <span className="text-sm font-semibold text-ink-700">
              {correct} of {total} correct ({Math.round((correct / max(1, total)) * 100)}%)
            </span>
          </div>
        </div>

        {/* Adaptive Replanning Notice if triggered */}
        {quizResult?.replan_triggered && (
          <div className="mt-6 card p-6 border-l-4 border-l-warning-500 bg-warning-50/50">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-100 text-warning-700 shrink-0">
                <RefreshCw className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-warning-700">
                  Adaptive Replanning Triggered
                </p>
                <h3 className="font-display font-bold text-ink-900 mt-1">
                  Study Plan Dynamically Adjusted
                </h3>
                <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                  {quizResult.explanation ||
                    `${topic} was allocated additional practice time because your latest assessment showed low mastery.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next revision action */}
        <div className="mt-6 card p-6 sm:p-7 border-l-4 border-l-brand-500">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Next Revision Action
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink-900">
                Review the concepts associated with {topic} that were identified as needing attention.
              </h2>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                Revisit the explanations for each question you missed, then return to your schedule to
                continue your prioritized study blocks.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={handleBackToResults} className="btn-secondary flex-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </button>
            <button onClick={handleContinueRevision} className="btn-primary flex-1">
              <Sparkles className="h-4 w-4" />
              View Today's Schedule
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function max(a: number, b: number) {
  return a > b ? a : b;
}
