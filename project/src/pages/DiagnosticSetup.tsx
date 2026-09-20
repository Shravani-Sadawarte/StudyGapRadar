import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, ArrowRight, AlertCircle, CalendarClock, Check } from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { SUBJECTS, DIAGNOSTIC_QUESTIONS } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api';

export default function DiagnosticSetup() {
  const navigate = useNavigate();
  const subject = SUBJECTS[0];
  const [selected, setSelected] = useState<string[]>(subject.defaultSelected);
  const [examDate, setExamDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (topic: string) => {
    setError(null);
    setSelected((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const [loading, setLoading] = useState(false);

  const handleBegin = async () => {
    if (selected.length === 0) {
      setError('Please select at least one topic to assess.');
      return;
    }
    if (examDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(examDate + 'T00:00:00');
      if (picked < today) {
        setError('Exam date cannot be in the past.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.diagnostic.generate(subject.name, selected, examDate || null);
      if (res.success && res.data) {
        const attemptId = res.data.attempt_id;
        const questions = res.data.questions;
        const queue = questions.map((q: any) => ({ questionId: q.id, topic: q.topic, prompt: q.prompt, options: q.options }));
        const state: any = {
          attemptId,
          subject: subject.name,
          topics: selected,
          examDate: examDate || null,
          queue,
          questions,
          answers: {},
          currentIndex: 0,
        };
        storage.setDiagnosticState(state);
        navigate('/diagnostic');
        return;
      }
    } catch {
      // fallback to local queue if backend unavailable
    } finally {
      setLoading(false);
    }

    // Build queue from diagnostic questions for selected topics (in order).
    const queue: { questionId: string; topic: string }[] = [];
    for (const topic of selected) {
      for (const q of DIAGNOSTIC_QUESTIONS.filter((q) => q.topic === topic)) {
        queue.push({ questionId: q.id, topic });
      }
    }
    const state: any = {
      subject: subject.name,
      topics: selected,
      examDate: examDate || null,
      queue,
      answers: {},
      currentIndex: 0,
    };
    storage.setDiagnosticState(state);
    navigate('/diagnostic');
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/home')}
          className="btn-ghost mb-4 -ml-2"
        >
          <Radar className="h-4 w-4" />
          Back to Home
        </button>

        <h1 className="font-display text-3xl font-extrabold text-ink-900">Diagnostic setup</h1>
        <p className="mt-2 text-ink-500">
          Choose the topics to assess. We'll ask 4 application-oriented questions per topic.
        </p>

        {/* Subject */}
        <section className="mt-8 card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Subject</p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Radar className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-lg font-bold text-ink-900">{subject.name}</span>
          </div>
        </section>

        {/* Topics */}
        <section className="mt-5">
          <h2 className="label mb-3">Topics</h2>
          <div className="space-y-2.5">
            {subject.topics.map((topic) => {
              const isSelected = selected.includes(topic);
              const questionCount = 4; // all diagnostic topics have 4
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-ink-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-brand-800' : 'text-ink-700'
                      }`}
                    >
                      {topic}
                    </span>
                  </div>
                  <span className="text-xs text-ink-400">{questionCount} questions</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Exam date */}
        <section className="mt-6">
          <label className="label" htmlFor="examDate">
            Exam date <span className="text-ink-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-ink-400 pointer-events-none" />
            <input
              id="examDate"
              type="date"
              className="input pl-11"
              value={examDate}
              onChange={(e) => {
                setExamDate(e.target.value);
                setError(null);
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            Used to weight priority by exam urgency. Leave blank to prioritize by performance only.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-7 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500">
            {selected.length} topic{selected.length === 1 ? '' : 's'} selected
          </p>
          <button onClick={handleBegin} disabled={loading} className="btn-primary text-base px-6 py-3.5 disabled:opacity-50">
            {loading ? 'Starting Diagnostic...' : 'Begin Diagnostic'}
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
