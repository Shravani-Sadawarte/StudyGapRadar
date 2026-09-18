import type { TopicResult, TopicStatus, AnswerStatus, TopicAnswer } from './types';

export function computeStatus(correct: number, attempted: number, total: number): TopicStatus {
  if (attempted < total || attempted < 4) {
    return 'insufficient-evidence';
  }
  const pct = (correct / attempted) * 100;
  return pct >= 75 ? 'solid' : 'needs-attention';
}

export function statusLabel(status: TopicStatus): string {
  switch (status) {
    case 'solid':
      return 'Solid';
    case 'needs-attention':
      return 'Needs Attention';
    case 'insufficient-evidence':
      return 'Insufficient Evidence';
  }
}

export function statusClasses(status: TopicStatus): string {
  switch (status) {
    case 'solid':
      return 'bg-success-100 text-success-700 border-success-500/30';
    case 'needs-attention':
      return 'bg-warning-100 text-warning-700 border-warning-500/30';
    case 'insufficient-evidence':
      return 'bg-ink-100 text-ink-500 border-ink-300';
  }
}

export function answerStatusClasses(status: AnswerStatus): string {
  switch (status) {
    case 'correct':
      return 'bg-success-100 text-success-700';
    case 'incorrect':
      return 'bg-danger-100 text-danger-700';
    case 'unattempted':
      return 'bg-ink-100 text-ink-500';
  }
}

export function answerLabel(status: AnswerStatus): string {
  switch (status) {
    case 'correct':
      return 'Correct';
    case 'incorrect':
      return 'Incorrect';
    case 'unattempted':
      return 'Unattempted';
  }
}

export function buildTopicResult(
  topic: string,
  answers: TopicAnswer[],
  total: number
): TopicResult {
  const attempted = answers.filter((a) => a.status !== 'unattempted').length;
  const correct = answers.filter((a) => a.status === 'correct').length;
  return {
    topic,
    correct,
    attempted,
    total,
    status: computeStatus(correct, attempted, total),
    answers,
  };
}

// Deterministic demo results used when the user picks "Try Demo" path.
export function demoResults(): TopicResult[] {
  const rec: TopicResult = {
    topic: 'Recursion',
    correct: 2,
    attempted: 4,
    total: 4,
    status: 'needs-attention',
    answers: [
      { questionId: 'rec-d1', selectedIndex: 2, status: 'correct' },
      { questionId: 'rec-d2', selectedIndex: 1, status: 'correct' },
      { questionId: 'rec-d3', selectedIndex: 0, status: 'incorrect' },
      { questionId: 'rec-d4', selectedIndex: 2, status: 'incorrect' },
    ],
  };
  const arr: TopicResult = {
    topic: 'Arrays',
    correct: 4,
    attempted: 4,
    total: 4,
    status: 'solid',
    answers: [
      { questionId: 'arr-d1', selectedIndex: 1, status: 'correct' },
      { questionId: 'arr-d2', selectedIndex: 2, status: 'correct' },
      { questionId: 'arr-d3', selectedIndex: 1, status: 'correct' },
      { questionId: 'arr-d4', selectedIndex: 2, status: 'correct' },
    ],
  };
  const tre: TopicResult = {
    topic: 'Trees',
    correct: 1,
    attempted: 1,
    total: 4,
    status: 'insufficient-evidence',
    answers: [
      { questionId: 'tre-d1', selectedIndex: 1, status: 'correct' },
      { questionId: 'tre-d2', selectedIndex: null, status: 'unattempted' },
      { questionId: 'tre-d3', selectedIndex: null, status: 'unattempted' },
      { questionId: 'tre-d4', selectedIndex: null, status: 'unattempted' },
    ],
  };
  return [rec, arr, tre];
}

// Priority weight: 70% severity + 30% exam urgency.
// Severity = 1 - (correct/attempted) for needs-attention topics.
// Exam urgency = days until exam normalized; no exam date => urgency 0.
export function priorityScore(
  result: TopicResult,
  examDate: string | null
): { score: number; severity: number; urgency: number; hasExamDate: boolean } {
  const severity = result.attempted > 0 ? 1 - result.correct / result.attempted : 1;
  let urgency = 0;
  let hasExamDate = false;
  if (examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate + 'T00:00:00');
    const days = Math.max(0, Math.round((exam.getTime() - today.getTime()) / 86400000));
    // Closer exam => higher urgency. Normalize: 0 days = 1.0, 60+ days = ~0.
    urgency = Math.max(0, 1 - days / 60);
    hasExamDate = true;
  }
  const score = 0.7 * severity + 0.3 * urgency;
  return { score, severity, urgency, hasExamDate };
}
