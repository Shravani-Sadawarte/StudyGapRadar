import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, Check, ArrowRight, ArrowLeft, GraduationCap, CalendarDays, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BRANCHES, SEMESTERS, EXAM_GOALS } from '@/lib/mockData';

const STEPS = [
  { key: 'branch', title: 'Engineering branch', icon: GraduationCap, hint: 'So we tailor subjects to your curriculum.' },
  { key: 'semester', title: 'Current semester', icon: CalendarDays, hint: 'We focus on what your exam covers now.' },
  { key: 'examGoal', title: 'Exam preparation goal', icon: Target, hint: 'This shapes how we prioritize your revision.' },
] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester 5');
  const [examGoal, setExamGoal] = useState('Semester Exams');

  const values: Record<string, string> = { branch, semester, examGoal };
  const current = STEPS[step];
  const options =
    current.key === 'branch' ? BRANCHES : current.key === 'semester' ? SEMESTERS : EXAM_GOALS;

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding({ branch, semester, examGoal });
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-ink-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Radar className="h-5 w-5" />
          </span>
          <span className="font-display font-bold text-ink-900">
            StudyGap<span className="text-brand-600">Radar</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i <= step ? 'bg-brand-600' : 'bg-ink-200'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="card p-6 sm:p-8 animate-fade-in" key={step}>
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <current.icon className="h-5.5 w-5.5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h1 className="font-display text-xl font-bold text-ink-900">{current.title}</h1>
              </div>
            </div>

            <p className="text-sm text-ink-500 mb-5">{current.hint}</p>

            <div className="space-y-2.5">
              {options.map((opt) => {
                const selected = values[current.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (current.key === 'branch') setBranch(opt);
                      else if (current.key === 'semester') setSemester(opt);
                      else setExamGoal(opt);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                        : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${selected ? 'text-brand-800' : 'text-ink-700'}`}>
                      {opt}
                    </span>
                    {selected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="btn-ghost"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button onClick={handleNext} className="btn-primary">
                {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink-400">
            You can change these anytime from your profile.
          </p>
        </div>
      </main>
    </div>
  );
}
