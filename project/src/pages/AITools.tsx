import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  Lock,
  Wand2,
  Tag,
  FileText,
  ShieldCheck,
  Info,
  Upload,
  Bot,
  Send,
  Loader2,
  BookOpen,
  Activity,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api';

export default function AITools() {
  const navigate = useNavigate();
  const { user, upgradeToPremium, setAiQuestionsUsed } = useAuth();
  const isPremium = user?.plan === 'premium';
  const aiQuestionsUsed = user?.aiQuestionsUsed ?? 0;
  const isLimitReached = !isPremium && aiQuestionsUsed >= 3;

  const results = storage.getResults();
  const needsTopic = results?.topics.find((t) => t.status === 'needs-attention');
  const practiceTopic = needsTopic?.topic ?? 'Recursion';

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // State for Material Upload
  const [materials, setMaterials] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  // State for AI Tutor
  const [tutorQuery, setTutorQuery] = useState('Explain binary tree traversal like I\'m a beginner.');
  const [tutorMode, setTutorMode] = useState('explain_simply');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<any>(null);

  // State for Agent Events
  const [agentEvents, setAgentEvents] = useState<any[]>([]);

  // State for Premium AI Feature Demos
  const [generatedQuestion, setGeneratedQuestion] = useState<string | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<string[] | null>(null);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
    loadAgentEvents();
    // Synchronize latest AI Tutor usage quota
    api.tutor.usage().then((res) => {
      if (res.success && res.data && typeof res.data.ai_questions_used === 'number') {
        setAiQuestionsUsed(res.data.ai_questions_used);
      }
    }).catch(() => {});
  }, []);

  const loadMaterials = async () => {
    try {
      const list = await api.materials.list();
      setMaterials(Array.isArray(list) ? list : (list?.data || []));
    } catch {
      // ignore
    }
  };

  const loadAgentEvents = async () => {
    try {
      const res = await api.agents.events();
      if (res.success && res.data) {
        setAgentEvents(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadMessage('Extracting text via PyMuPDF & analyzing topics...');
    try {
      const res = await api.materials.uploadPdf(file);
      if (res.success) {
        setUploadMessage(`Successfully analyzed '${file.name}'. Topics indexed.`);
        await loadMaterials();
        await loadAgentEvents();
      }
    } catch (err: any) {
      setUploadMessage(err.message || 'Failed to analyze material.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setUploadLoading(true);
    setUploadMessage('Ingesting and analyzing notes with Material Analyzer Agent...');
    try {
      const res = await api.materials.uploadText('Study Notes', pasteText);
      if (res.success) {
        setUploadMessage('Notes indexed successfully! Available for AI Tutor context.');
        setPasteText('');
        setShowPaste(false);
        await loadMaterials();
        await loadAgentEvents();
      }
    } catch (err: any) {
      setUploadMessage(err.message || 'Failed to ingest notes.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAskTutor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tutorQuery.trim()) return;

    // Client-side guard for 3-question limit
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return;
    }

    setTutorLoading(true);
    try {
      const res = await api.tutor.ask(tutorQuery.trim(), practiceTopic, tutorMode);
      if (res.success && res.data) {
        setTutorResponse(res.data);
        if (typeof res.data.ai_questions_used === 'number') {
          setAiQuestionsUsed(res.data.ai_questions_used);
        }
        await loadAgentEvents();
      } else if (res.code === 'AI_LIMIT_REACHED' || res.data?.code === 'AI_LIMIT_REACHED') {
        setShowUpgradeModal(true);
        setAiQuestionsUsed(3);
      } else {
        setTutorResponse({
          answer: res.message || 'Could not process question.',
          cites_notes: false,
        });
      }
    } catch (err: any) {
      if (err.code === 'AI_LIMIT_REACHED' || err.message?.includes('free AI Tutor questions')) {
        setShowUpgradeModal(true);
        setAiQuestionsUsed(3);
      } else {
        setTutorResponse({
          answer: 'Could not connect to AI Tutor. Please verify the backend is running.',
          cites_notes: false,
        });
      }
    } finally {
      setTutorLoading(false);
    }
  };

  const handleUpgradeConfirm = async () => {
    setUpgrading(true);
    try {
      await upgradeToPremium();
      setShowUpgradeModal(false);
    } catch {
      // ignore
    } finally {
      setUpgrading(false);
    }
  };

  // Handlers for Premium Features
  const handleGenerateQuestion = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setGeneratedQuestion(
      `[AI Question Generator • ${practiceTopic}] Suppose a recursive Fibonacci function is called with N=5 without memoization. Calculate the total number of stack activation frames and demonstrate how tail-call recursion eliminates stack overflow in depth-first search.`
    );
  };

  const handleGenerateVariants = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setGeneratedVariants([
      `Variant A (Array Traversal): Convert the recursive tree traversal into an iterative traversal using an explicit stack.`,
      `Variant B (State Space Reduction): Analyze how memoization changes the time complexity from O(2^n) to O(n).`,
    ]);
  };

  const handleTagDifficulty = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setDifficultyAnalysis(
      `Cognitive Level: Analyze & Apply (Bloom's Taxonomy L4) • University Exam Weight: High (Appears in 85% of Semester 5 end-term papers) • Recommended Study Allocation: 45 minutes.`
    );
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Sparkles className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-extrabold text-ink-900">AI Study Tools</h1>
            </div>
          </div>
          <p className="text-ink-500 mt-1">
            Unlock deeper AI-assisted study support grounded in your curriculum and uploaded materials.
          </p>
        </div>

        {/* Current plan banner */}
        <section className="card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isPremium ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-500'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Your current plan
              </p>
              <p className="font-display font-bold text-ink-900 flex items-center gap-2">
                {isPremium ? 'StudyGapRadar Premium' : 'Free Plan'}
                {isPremium ? (
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Premium Active
                  </span>
                ) : (
                  <span className="badge bg-ink-100 text-ink-500 text-xs">
                    {Math.min(aiQuestionsUsed, 3)}/3 AI questions used
                  </span>
                )}
              </p>
            </div>
          </div>
          {!isPremium && (
            <button onClick={() => navigate('/premium')} className="btn-primary shrink-0">
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </button>
          )}
        </section>

        {/* ACTIVE: Study Material Ingestion Section (Free Feature) */}
        <section className="card p-6 border-l-4 border-l-brand-600">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-ink-900">Study Material Ingestion</h2>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    Free Feature
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  Upload PDF course materials or paste lecture notes. PyMuPDF extracts and chunks your material for notes-aware AI assistance.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaste(!showPaste)}
              className="btn-ghost text-xs py-1.5 px-3 shrink-0"
            >
              {showPaste ? 'Upload File' : 'Paste Notes'}
            </button>
          </div>

          <div className="mt-5">
            {!showPaste ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-ink-200 rounded-2xl p-6 cursor-pointer hover:border-brand-500 hover:bg-brand-50/20 transition-all">
                <Upload className="h-8 w-8 text-brand-600 mb-2" />
                <span className="text-sm font-semibold text-ink-800">
                  Click to upload PDF or TXT course material
                </span>
                <span className="text-xs text-ink-400 mt-1">PyMuPDF extracts and segments content up to 25MB</span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="input min-h-[120px] text-sm"
                  placeholder="Paste syllabus, textbook chapters, or lecture notes here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={uploadLoading || !pasteText.trim()}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Index Pasted Notes
                </button>
              </div>
            )}

            {uploadLoading && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-600 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {!uploadLoading && uploadMessage && (
              <p className="mt-3 text-xs font-medium text-success-700 bg-success-50 p-2.5 rounded-lg border border-success-200">
                {uploadMessage}
              </p>
            )}

            {/* List of Ingested Materials */}
            {materials.length > 0 && (
              <div className="mt-5 pt-4 border-t border-ink-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                  Ingested Course Documents ({materials.length})
                </p>
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div key={m.id} className="rounded-xl bg-ink-50 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-600" />
                        <span className="font-semibold text-ink-800">{m.filename}</span>
                        <span className="text-ink-400">({m.file_type.toUpperCase()})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.topics.slice(0, 3).map((t: string) => (
                          <span key={t} className="badge bg-white text-ink-600 border border-ink-200 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ACTIVE: Notes-Aware AI Tutor Section (Gated Quota) */}
        <section className={`card p-6 border-l-4 ${isPremium ? 'border-l-amber-500' : 'border-l-brand-500'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isPremium ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-600'
                }`}
              >
                {isPremium ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-ink-900">Notes-Aware AI Tutor</h2>
                  {isPremium ? (
                    <span className="badge bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Premium AI Tutor
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-500">
                  {isPremium
                    ? 'Unlimited grounded explanations using your uploaded notes.'
                    : 'Answers doubts using your uploaded study material.'}
                </p>
              </div>
            </div>

            {/* Quota / Status Badge */}
            <div>
              {isPremium ? (
                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Unlimited AI Questions
                </span>
              ) : (
                <span
                  className={`badge font-semibold ${
                    aiQuestionsUsed >= 3
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  AI Tutor: {Math.min(aiQuestionsUsed, 3)} / 3 free questions used
                </span>
              )}
            </div>
          </div>

          {/* Learning Mode Selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: 'explain_simply', label: 'Explain Simply' },
              { id: 'exam_mode', label: 'Exam Mode' },
              { id: 'socratic', label: 'Socratic Mode' },
              { id: 'deep_dive', label: 'Deep Dive' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTutorMode(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tutorMode === m.id
                    ? isPremium
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-brand-600 text-white shadow-sm'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Free limit reached card OR Ask Form */}
          {isLimitReached ? (
            <div className="mt-4 rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50/80 to-amber-50/80 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-ink-900 text-sm">
                    Free AI Tutor Limit Reached (3/3 questions used)
                  </h3>
                  <p className="text-xs text-ink-600 mt-1 leading-relaxed">
                    You've reached your free AI Tutor limit (3/3 questions used). Upgrade to Premium for unlimited AI tutoring, notes intelligence, and advanced question generation.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleUpgradeConfirm}
                  disabled={upgrading}
                  className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
                >
                  {upgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => navigate('/practice')}
                  className="btn-ghost text-xs py-2 px-3 text-ink-600"
                >
                  Continue with Free Plan
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAskTutor} className="mt-4 flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                placeholder="Ask any conceptual question (e.g. tree traversals, recursion base-case)..."
              />
              <button
                type="submit"
                disabled={tutorLoading || !tutorQuery.trim()}
                className="btn-primary shrink-0 px-4"
              >
                {tutorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          )}

          {/* AI Response Display */}
          {tutorResponse && (
            <div className="mt-5 rounded-xl border border-ink-100 bg-ink-50/50 p-5 space-y-3 animate-fade-in">
              {tutorResponse.cites_notes && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full w-fit">
                  <BookOpen className="h-3.5 w-3.5" />
                  Referenced from your uploaded study notes
                </div>
              )}
              <div className="text-sm text-ink-800 leading-relaxed whitespace-pre-line">
                {tutorResponse.answer}
              </div>
              {tutorResponse.suggested_practice && (
                <div className="pt-3 border-t border-ink-200 flex items-center justify-between text-xs text-ink-500">
                  <span>Suggested next: {tutorResponse.suggested_practice}</span>
                  <button onClick={() => navigate('/practice')} className="font-semibold text-brand-600 hover:underline">
                    Start Practice →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* GATED: Premium AI Features Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2">
                <span>Premium AI Capabilities</span>
                {isPremium ? (
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                    All Features Unlocked
                  </span>
                ) : (
                  <span className="badge bg-ink-100 text-ink-500 text-xs">
                    Locked on Free Tier
                  </span>
                )}
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Targeted AI-powered study generators beyond the core diagnostic assessment.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Feature 1: AI Question Generation */}
            <div className={`card p-5 transition-all ${isPremium ? 'border-amber-200' : 'bg-ink-50/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isPremium ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <Wand2 className="h-4.5 w-4.5" />
                </span>
                <span
                  className={`badge text-[10px] font-semibold ${
                    isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {isPremium ? 'Unlocked' : 'Premium'}
                </span>
              </div>
              <h3 className="font-display font-bold text-ink-900 mt-3 text-sm">
                AI Question Generation
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Generates syllabus-tailored application questions for weak topics like {practiceTopic}.
              </p>
              {generatedQuestion && isPremium && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-ink-800 leading-relaxed animate-fade-in">
                  {generatedQuestion}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-ink-100">
                <button
                  onClick={handleGenerateQuestion}
                  className={isPremium ? 'btn-secondary text-xs w-full py-1.5' : 'btn-primary text-xs w-full py-1.5 flex items-center justify-center gap-1.5'}
                >
                  {!isPremium && <Lock className="h-3.5 w-3.5" />}
                  {isPremium ? 'Generate Question' : 'Unlock with Premium'}
                </button>
              </div>
            </div>

            {/* Feature 2: Question Variations */}
            <div className={`card p-5 transition-all ${isPremium ? 'border-amber-200' : 'bg-ink-50/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isPremium ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <Layers className="h-4.5 w-4.5" />
                </span>
                <span
                  className={`badge text-[10px] font-semibold ${
                    isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {isPremium ? 'Unlocked' : 'Premium'}
                </span>
              </div>
              <h3 className="font-display font-bold text-ink-900 mt-3 text-sm">
                Question Variations
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Synthesizes edge cases and alternative scenarios to prevent test memorization.
              </p>
              {generatedVariants && isPremium && (
                <div className="mt-3 space-y-2 text-xs text-ink-800 animate-fade-in">
                  {generatedVariants.map((v, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                      {v}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-ink-100">
                <button
                  onClick={handleGenerateVariants}
                  className={isPremium ? 'btn-secondary text-xs w-full py-1.5' : 'btn-primary text-xs w-full py-1.5 flex items-center justify-center gap-1.5'}
                >
                  {!isPremium && <Lock className="h-3.5 w-3.5" />}
                  {isPremium ? 'Create Variations' : 'Unlock with Premium'}
                </button>
              </div>
            </div>

            {/* Feature 3: AI Difficulty Tagging */}
            <div className={`card p-5 transition-all ${isPremium ? 'border-amber-200' : 'bg-ink-50/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isPremium ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <Tag className="h-4.5 w-4.5" />
                </span>
                <span
                  className={`badge text-[10px] font-semibold ${
                    isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {isPremium ? 'Unlocked' : 'Premium'}
                </span>
              </div>
              <h3 className="font-display font-bold text-ink-900 mt-3 text-sm">
                AI Difficulty Tagging
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Analyzes cognitive depth, Bloom's level, and semester exam historical weight.
              </p>
              {difficultyAnalysis && isPremium && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-ink-800 leading-relaxed animate-fade-in">
                  {difficultyAnalysis}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-ink-100">
                <button
                  onClick={handleTagDifficulty}
                  className={isPremium ? 'btn-secondary text-xs w-full py-1.5' : 'btn-primary text-xs w-full py-1.5 flex items-center justify-center gap-1.5'}
                >
                  {!isPremium && <Lock className="h-3.5 w-3.5" />}
                  {isPremium ? 'Tag Difficulty' : 'Unlock with Premium'}
                </button>
              </div>
            </div>

            {/* Feature 4: Expanded Notes & PDF Intelligence */}
            <div className={`card p-5 transition-all ${isPremium ? 'border-amber-200' : 'bg-ink-50/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isPremium ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <BookOpen className="h-4.5 w-4.5" />
                </span>
                <span
                  className={`badge text-[10px] font-semibold ${
                    isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {isPremium ? 'Unlocked' : 'Premium'}
                </span>
              </div>
              <h3 className="font-display font-bold text-ink-900 mt-3 text-sm">
                Notes & PDF Intelligence
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Automatic syllabus cross-referencing and contextual note synthesis.
              </p>
              <div className="mt-4 pt-3 border-t border-ink-100">
                <button
                  onClick={() => (!isPremium ? setShowUpgradeModal(true) : navigate('/diagnostic/setup'))}
                  className={isPremium ? 'btn-secondary text-xs w-full py-1.5' : 'btn-primary text-xs w-full py-1.5 flex items-center justify-center gap-1.5'}
                >
                  {!isPremium && <Lock className="h-3.5 w-3.5" />}
                  {isPremium ? 'Explore Intelligence' : 'Unlock with Premium'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE: Autonomous Agent Activity Log */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Activity className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">Agent Activity Stream</h2>
                <p className="text-xs text-ink-500">Live event stream from the 8 coordinating autonomous agents.</p>
              </div>
            </div>
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200">
              {agentEvents.length} Events Logged
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {agentEvents.length === 0 ? (
              <p className="text-xs text-ink-400 py-4 text-center">
                No agent events logged yet. Take a diagnostic or upload notes to trigger agent actions.
              </p>
            ) : (
              agentEvents.slice(0, 8).map((evt) => (
                <div key={evt.id} className="rounded-xl border border-ink-100 p-3 text-xs bg-white flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-brand-700 mr-2">[{evt.agent_name}]</span>
                    <span className="font-semibold text-ink-800">{evt.action}</span>
                    <p className="mt-1 text-ink-500 leading-normal">{evt.detail}</p>
                  </div>
                  <span className="text-[10px] text-ink-400 shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Free plan features */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink-900 mb-3">
            Included 100% Free on StudyGapRadar
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FreeFeature title="Diagnostic Assessment" body="Unlimited application-oriented diagnostic tests." />
            <FreeFeature title="Evidence-Backed Scoring" body="Every question marked Correct, Incorrect, or Unattempted." />
            <FreeFeature title="Weak-Topic Prioritization" body="Deterministic 70% severity + 30% exam urgency formula." />
            <FreeFeature title="Adaptive Study Plan" body="Automated daily sessions and replanning on quiz feedback." />
          </div>
        </section>

        {/* AI boundary clarification */}
        <section className="card p-5 bg-ink-50/60">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
              <Info className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-ink-900">How AI fits in</h3>
              <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                AI assists with content — question generation, variation, notes ingestion, and conceptual tutoring.
                Deterministic product logic handles scoring, thresholds, insufficient evidence,
                severity, exam urgency, and priority ranking. AI never determines your mastery or
                your priority list.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Friendly Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-2xl bg-white space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 shrink-0">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display font-bold text-ink-900 text-lg">
                  Upgrade to StudyGapRadar Premium
                </h3>
                <p className="text-xs text-ink-500">Unlimited AI Tutor & Advanced Study Tools</p>
              </div>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              You've reached your free AI Tutor limit (3/3 questions used). Upgrade to Premium for unlimited AI tutoring, notes intelligence, and advanced question generation.
            </p>

            <div className="rounded-xl bg-ink-50 p-3.5 space-y-2.5 border border-ink-100 text-xs">
              <div className="flex items-center gap-2 text-ink-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Unlimited AI Tutor questions</span>
              </div>
              <div className="flex items-center gap-2 text-ink-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>AI-assisted question generation & variations</span>
              </div>
              <div className="flex items-center gap-2 text-ink-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>AI-supported difficulty tagging</span>
              </div>
              <div className="flex items-center gap-2 text-ink-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Deep notes & PDF intelligence</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="btn-ghost text-xs py-2 px-4"
              >
                Continue with Free Plan
              </button>
              <button
                type="button"
                onClick={handleUpgradeConfirm}
                disabled={upgrading}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FreeFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 text-success-600 mb-3">
        <Check className="h-4 w-4" />
      </span>
      <h3 className="font-display font-bold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </div>
  );
}
