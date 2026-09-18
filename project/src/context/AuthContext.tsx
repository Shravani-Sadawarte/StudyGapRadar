import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserProfile, DiagnosticResult } from '@/lib/types';
import { storage } from '@/lib/storage';
import { demoResults } from '@/lib/scoring';
import { api, setAuthToken } from '@/lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInDemo: () => Promise<void>;
  completeOnboarding: (profile: Pick<UserProfile, 'branch' | 'semester' | 'examGoal'>) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAiQuestionsUsed: (count: number) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: UserProfile = {
  name: 'Aarav Sharma',
  email: 'demo@studygapradar.app',
  branch: 'Computer Science & Engineering',
  semester: 'Semester 5',
  examGoal: 'Semester Exams',
  plan: 'free',
  aiQuestionsUsed: 0,
  aiQuestionLimit: 3,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  // Validate session against backend on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.auth.me();
        const profileUser: UserProfile = {
          name: res.name,
          email: res.email,
          branch: res.branch || '',
          semester: res.semester || '',
          examGoal: res.exam_goal || '',
          plan: (res.plan as any) || 'free',
          aiQuestionsUsed: res.ai_questions_used || 0,
          aiQuestionLimit: res.ai_question_limit,
        };
        setUser(profileUser);
        storage.setUser(profileUser);
      } catch {
        // Token invalid or backend offline, fallback to cached storage
        const cached = storage.getUser();
        if (cached) setUser(cached);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) storage.setUser(user);
    else storage.clearUser();
  }, [user]);

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      const profileUser: UserProfile = {
        name: res.name,
        email: res.email,
        branch: res.branch || '',
        semester: res.semester || '',
        examGoal: res.exam_goal || '',
        plan: (res.plan as any) || 'free',
        aiQuestionsUsed: res.ai_questions_used || 0,
        aiQuestionLimit: res.ai_question_limit,
      };
      setUser(profileUser);
      storage.setUser(profileUser);
    } catch {
      // ignore
    }
  };

  const setAiQuestionsUsed = (count: number) => {
    setUser((prev) => (prev ? { ...prev, aiQuestionsUsed: count } : prev));
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const res = await api.auth.signup(name, email, password);
      setAuthToken(res.access_token);
      const newUser: UserProfile = {
        name: res.user.name,
        email: res.user.email,
        branch: res.user.branch || '',
        semester: res.user.semester || '',
        examGoal: res.user.exam_goal || '',
        plan: (res.user.plan as any) || 'free',
        aiQuestionsUsed: res.user.ai_questions_used || 0,
        aiQuestionLimit: res.user.ai_question_limit,
      };
      setUser(newUser);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Could not create account.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      setAuthToken(res.access_token);
      const loggedUser: UserProfile = {
        name: res.user.name,
        email: res.user.email,
        branch: res.user.branch || '',
        semester: res.user.semester || '',
        examGoal: res.user.exam_goal || '',
        plan: (res.user.plan as any) || 'free',
        aiQuestionsUsed: res.user.ai_questions_used || 0,
        aiQuestionLimit: res.user.ai_question_limit,
      };
      setUser(loggedUser);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const signInDemo = async () => {
    try {
      const res = await api.auth.login('demo@studygapradar.app', 'demo12345');
      setAuthToken(res.access_token);
      const demoProfile: UserProfile = {
        name: res.user.name,
        email: res.user.email,
        branch: res.user.branch || DEMO_USER.branch,
        semester: res.user.semester || DEMO_USER.semester,
        examGoal: res.user.exam_goal || DEMO_USER.examGoal,
        plan: (res.user.plan as any) || 'free',
        aiQuestionsUsed: res.user.ai_questions_used || 0,
        aiQuestionLimit: res.user.ai_question_limit,
      };
      setUser(demoProfile);
    } catch {
      // Fallback local demo seed
      setUser(DEMO_USER);
    }

    if (!storage.getResults()) {
      const demo: DiagnosticResult = {
        subject: 'Data Structures',
        examDate: '2026-10-15',
        createdAt: new Date().toISOString(),
        topics: demoResults(),
      };
      storage.setResults(demo);
    }
  };

  const completeOnboarding = async (profile: Pick<UserProfile, 'branch' | 'semester' | 'examGoal'>) => {
    try {
      await api.profile.update({
        branch: profile.branch,
        semester: profile.semester,
        exam_name: profile.examGoal,
      });
    } catch {
      // ignore
    }
    setUser((prev) =>
      prev
        ? { ...prev, branch: profile.branch, semester: profile.semester, examGoal: profile.examGoal }
        : { ...DEMO_USER, ...profile }
    );
  };

  const updateProfile = async (patch: Partial<UserProfile>) => {
    try {
      await api.profile.update({
        name: patch.name,
        branch: patch.branch,
        semester: patch.semester,
        exam_name: patch.examGoal,
      });
    } catch {
      // ignore
    }
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const upgradeToPremium = async () => {
    try {
      await api.auth.upgrade();
    } catch {
      // ignore
    }
    setUser((prev) => (prev ? { ...prev, plan: 'premium', aiQuestionLimit: null } : prev));
  };

  const signOut = () => {
    try {
      api.auth.logout().catch(() => {});
    } finally {
      setAuthToken(null);
      setUser(null);
      storage.clearAll();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signInDemo,
        completeOnboarding,
        updateProfile,
        upgradeToPremium,
        refreshUser,
        setAiQuestionsUsed,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
