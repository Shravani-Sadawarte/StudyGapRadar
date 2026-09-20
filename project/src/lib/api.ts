const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthToken(): string | null {
  return localStorage.getItem('sgr.token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('sgr.token', token);
  } else {
    localStorage.removeItem('sgr.token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // --- Auth ---
  auth: {
    signup: (name: string, email: string, password: string) =>
      request<{ access_token: string; token_type: string; user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      }),
    me: () => request<any>('/auth/me'),
    upgrade: () => request<any>('/auth/upgrade', { method: 'POST' }),
  },

  // --- Profile ---
  profile: {
    get: () => request<any>('/profile'),
    update: (patch: Record<string, any>) =>
      request<any>('/profile', {
        method: 'PUT',
        body: JSON.stringify(patch),
      }),
  },

  // --- Materials ---
  materials: {
    list: () => request<any[]>('/materials'),
    get: (id: string) => request<any>(`/materials/${id}`),
    uploadPdf: (file: File, subject: string = 'Data Structures') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject_name', subject);
      return request<{ success: boolean; message: string; data: any }>('/materials/upload', {
        method: 'POST',
        body: formData,
      });
    },
    uploadText: (filename: string, text: string) =>
      request<{ success: boolean; message: string; data: any }>('/materials/text', {
        method: 'POST',
        body: JSON.stringify({ filename, text }),
      }),
  },

  // --- Diagnostic ---
  diagnostic: {
    generate: (subject: string, topics: string[], examDate?: string | null) =>
      request<{ success: boolean; message: string; data: { attempt_id: string; questions: any[] } }>(
        '/diagnostic/generate',
        {
          method: 'POST',
          body: JSON.stringify({ subject_name: subject, topics, exam_date: examDate }),
        }
      ),
    current: () => request<{ success: boolean; message: string; data: any }>('/diagnostic/current'),
    submit: (attemptId: string, answers: { question_id: string; selected_index: number | null }[]) =>
      request<{ success: boolean; message: string; data: any }>('/diagnostic/submit', {
        method: 'POST',
        body: JSON.stringify({ attempt_id: attemptId, answers }),
      }),
    results: () => request<{ success: boolean; message: string; data: any }>('/diagnostic/results'),
  },

  // --- Knowledge ---
  knowledge: {
    results: () => request<{ success: boolean; message: string; data: any }>('/knowledge/results'),
  },

  // --- Planning ---
  plan: {
    get: () => request<{ success: boolean; message: string; data: any }>('/plan'),
    generate: (subject: string = 'Data Structures', examDate?: string, dailyStudyHours: number = 2.0) =>
      request<{ success: boolean; message: string; data: any }>('/plan/generate', {
        method: 'POST',
        body: JSON.stringify({ subject, exam_date: examDate, daily_study_hours: dailyStudyHours }),
      }),
    replan: (reason: string, topic?: string, quizScore?: number) =>
      request<{ success: boolean; message: string; data: { plan: any; explanation: string } }>('/plan/replan', {
        method: 'POST',
        body: JSON.stringify({ reason, topic, quiz_score: quizScore }),
      }),
  },

  // --- Quiz ---
  quiz: {
    generate: (topic: string, difficulty: string = 'medium') =>
      request<{ success: boolean; message: string; data: { topic: string; questions: any[] } }>('/quiz/generate', {
        method: 'POST',
        body: JSON.stringify({ topic, difficulty }),
      }),
    submit: (topic: string, answers: { question_id: string; selected_index: number | null }[]) =>
      request<{
        success: boolean;
        message: string;
        data: { topic: string; score: number; total_questions: number; percentage: number; replan_triggered: boolean; explanation?: string };
      }>('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ topic, answers }),
      }),
    history: () => request<{ success: boolean; message: string; data: any[] }>('/quiz/results'),
  },

  // --- AI Tutor ---
  tutor: {
    ask: (question: string, topic?: string, mode: string = 'explain_simply') =>
      request<{
        success: boolean;
        message: string;
        data: {
          answer: string;
          topic: string;
          cites_notes: boolean;
          notes_excerpt?: string;
          related_topics: string[];
          suggested_practice?: string;
        };
      }>('/tutor/ask', {
        method: 'POST',
        body: JSON.stringify({ question, topic, mode }),
      }),
    usage: () => request<any>('/tutor/usage'),
  },

  // --- Progress ---
  progress: {
    sessionComplete: (sessionId: string, durationMinutes?: number, reflection?: string) =>
      request<{ success: boolean; message: string; data: any }>('/progress/session', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, duration_minutes: durationMinutes, reflection }),
      }),
    getSummary: () => request<{ success: boolean; message: string; data: any }>('/progress'),
  },

  // --- Analytics ---
  analytics: {
    dashboard: () => request<{ success: boolean; message: string; data: any }>('/analytics/dashboard'),
  },

  // --- Agents ---
  agents: {
    events: () => request<{ success: boolean; message: string; data: any[] }>('/agents/events'),
  },

  // --- Reports ---
  reports: {
    submit: (questionId: string, topic: string, reason: string, note?: string) =>
      request<{ success: boolean; message: string; data: any }>('/reports/questions', {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, topic, reason, note }),
      }),
    myReports: () => request<{ success: boolean; message: string; data: any[] }>('/reports/my-reports'),
  },
};
