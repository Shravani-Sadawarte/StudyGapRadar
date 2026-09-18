export type TopicStatus = 'solid' | 'needs-attention' | 'insufficient-evidence';

export type AnswerStatus = 'correct' | 'incorrect' | 'unattempted';

export interface Question {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicAnswer {
  questionId: string;
  selectedIndex: number | null; // null = skipped/unattempted
  status: AnswerStatus;
}

export interface TopicResult {
  topic: string;
  correct: number;
  attempted: number;
  total: number;
  status: TopicStatus;
  answers: TopicAnswer[];
}

export interface DiagnosticResult {
  subject: string;
  topics: TopicResult[];
  examDate: string | null;
  createdAt: string;
}

export type Plan = 'free' | 'premium';

export interface UserProfile {
  name: string;
  email: string;
  branch: string;
  semester: string;
  examGoal: string;
  plan: Plan;
  aiQuestionsUsed?: number;
  aiQuestionLimit?: number | null;
}

export interface ReportEntry {
  id: string;
  questionId: string;
  topic: string;
  reason: string;
  note: string;
  createdAt: string;
}

export interface PracticeAnswer {
  questionId: string;
  selectedIndex: number | null;
  status: AnswerStatus;
}
