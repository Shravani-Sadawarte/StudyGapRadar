import type {
  DiagnosticResult,
  PracticeAnswer,
  ReportEntry,
  UserProfile,
} from './types';

const KEYS = {
  user: 'sgr.user',
  diagnostic: 'sgr.diagnostic',
  diagnosticState: 'sgr.diagnosticState',
  results: 'sgr.results',
  practice: 'sgr.practice',
  reports: 'sgr.reports',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in prototype
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storage = {
  // User
  getUser: (): UserProfile | null => read<UserProfile>(KEYS.user),
  setUser: (u: UserProfile) => write(KEYS.user, u),
  clearUser: () => remove(KEYS.user),

  // Diagnostic in-progress state
  getDiagnosticState: <T>(): T | null => read<T>(KEYS.diagnosticState),
  setDiagnosticState: <T>(s: T) => write(KEYS.diagnosticState, s),
  clearDiagnosticState: () => remove(KEYS.diagnosticState),

  // Results
  getResults: (): DiagnosticResult | null => read<DiagnosticResult>(KEYS.results),
  setResults: (r: DiagnosticResult) => write(KEYS.results, r),
  clearResults: () => remove(KEYS.results),

  // Practice
  getPractice: (): PracticeAnswer[] | null => read<PracticeAnswer[]>(KEYS.practice),
  setPractice: (p: PracticeAnswer[]) => write(KEYS.practice, p),
  clearPractice: () => remove(KEYS.practice),

  // Reports
  getReports: (): ReportEntry[] => read<ReportEntry[]>(KEYS.reports) ?? [],
  addReport: (r: ReportEntry) => {
    const all = storage.getReports();
    all.push(r);
    write(KEYS.reports, all);
  },

  clearAll: () => {
    Object.values(KEYS).forEach(remove);
  },
};
