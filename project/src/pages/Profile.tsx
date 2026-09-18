import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  CalendarDays,
  Target,
  LogOut,
  Pencil,
  Check,
  X,
  Flag,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/lib/storage';
import { BRANCHES, SEMESTERS, EXAM_GOALS } from '@/lib/mockData';

import { api } from '@/lib/api';

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [reports, setReports] = useState<any[]>(() => storage.getReports());

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await api.reports.myReports();
        if (res.success && res.data) {
          setReports(res.data);
        }
      } catch {
        // fallback to storage
      }
    }
    loadReports();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const isPremium = user?.plan === 'premium';

  if (!user) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-ink-500">You're not signed in.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">Profile</h1>
        <p className="mt-2 text-ink-500">Your account and preparation details.</p>

        {/* Profile card */}
        <section className="mt-7 card overflow-hidden">
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white relative">
            <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-white text-xl font-display font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">{user.name}</h2>
                <p className="text-brand-100 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {editing ? (
              <EditForm
                user={user}
                onSave={(patch) => {
                  updateProfile(patch);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Detail icon={UserIcon} label="Name" value={user.name} />
                  <Detail icon={Mail} label="Email" value={user.email} />
                  <Detail icon={GraduationCap} label="Branch" value={user.branch || 'Not set'} />
                  <Detail icon={CalendarDays} label="Semester" value={user.semester || 'Not set'} />
                  <Detail icon={Target} label="Preparation goal" value={user.examGoal || 'Not set'} />
                  <Detail
                    icon={Sparkles}
                    label="Current plan"
                    value={
                      isPremium
                        ? 'StudyGapRadar Premium (Unlimited AI Tutor Access)'
                        : `Free Plan (${user.aiQuestionsUsed ?? 0}/3 AI Tutor questions used)`
                    }
                  />
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setEditing(true)} className="btn-secondary">
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </button>
                  {!isPremium && (
                    <button onClick={() => navigate('/premium')} className="btn-primary">
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Reports */}
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <Flag className="h-4 w-4" />
            </span>
            <h2 className="font-display font-bold text-ink-900">Reported questions</h2>
            <span className="badge bg-ink-100 text-ink-600">{reports.length}</span>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-ink-400">
              You haven't reported any questions yet. Use "Report a Question" during a diagnostic or
              practice to flag issues.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-ink-100 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink-800">{r.reason}</span>
                    <span className="text-xs text-ink-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {r.topic} · {r.questionId}
                  </p>
                  {r.note && <p className="mt-1.5 text-sm text-ink-600">{r.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sign out */}
        <section className="mt-6">
          <button onClick={handleSignOut} className="btn-danger w-full sm:w-auto">
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </button>
        </section>

        <p className="mt-8 text-xs text-ink-400 text-center">
          StudyGapRadar stores your data locally in this browser. No analytics dashboard, no
          external sync.
        </p>
      </div>
    </AppShell>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <div className="flex items-center gap-2 text-ink-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}

function EditForm({
  user,
  onSave,
  onCancel,
}: {
  user: { name: string; email: string; branch: string; semester: string; examGoal: string };
  onSave: (patch: { name: string; branch: string; semester: string; examGoal: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [branch, setBranch] = useState(user.branch || BRANCHES[0]);
  const [semester, setSemester] = useState(user.semester || SEMESTERS[4]);
  const [examGoal, setExamGoal] = useState(user.examGoal || EXAM_GOALS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    onSave({ name: name.trim(), branch, semester, examGoal });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">Branch</label>
        <SelectInput value={branch} onChange={setBranch} options={BRANCHES} />
      </div>
      <div>
        <label className="label">Semester</label>
        <SelectInput value={semester} onChange={setSemester} options={SEMESTERS} />
      </div>
      <div>
        <label className="label">Exam goal</label>
        <SelectInput value={examGoal} onChange={setExamGoal} options={EXAM_GOALS} />
      </div>

      {error && (
        <p className="text-xs text-danger-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          <Check className="h-4 w-4" />
          Save
        </button>
      </div>
    </form>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
