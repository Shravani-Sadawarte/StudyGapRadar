import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/AppNav';
import { useAuth } from '@/context/AuthContext';

const PREMIUM_FEATURES = [
  'Unlimited AI Tutor questions (unlimited doubts & grounded explanations)',
  'AI-assisted question generation',
  'Additional question variations',
  'AI-supported difficulty tagging',
  'Notes / PDF intelligence',
  'Expanded study support',
];

export default function Premium() {
  const navigate = useNavigate();
  const { user, upgradeToPremium } = useAuth();
  const isPremium = user?.plan === 'premium';

  const handleUpgrade = async () => {
    await upgradeToPremium();
    navigate('/ai-tools');
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate('/ai-tools')} className="btn-ghost mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to AI Study Tools
        </button>

        {/* Header */}
        <div className="text-center">
          <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Sparkles className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl font-extrabold text-ink-900">
            Upgrade to StudyGapRadar Premium
          </h1>
          <p className="mt-3 text-ink-500 max-w-md mx-auto">
            Unlock AI-assisted content tools that go beyond the core diagnostic — task-specific and
            evidence-oriented, not a chatbot.
          </p>
        </div>

        {/* Why upgrade */}
        <section className="mt-8 card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-ink-900">Why upgrade?</h2>
            {isPremium && (
              <span className="badge bg-brand-100 text-brand-700 border border-brand-200 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Current Plan: Premium
              </span>
            )}
          </div>
          <ul className="space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-100 text-success-600 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-ink-700 font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section className="mt-6 card p-6 sm:p-8 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 relative overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="badge bg-white/15 text-white border border-white/20">
                <Clock className="h-3.5 w-3.5" />
                Pricing to be validated
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">StudyGapRadar Premium</h2>
            <p className="mt-2 text-brand-100 text-sm">
              This is a prototype representation of the future paid tier. No payment is processed —
              upgrading here unlocks unlimited AI tutoring and premium study features.
            </p>

            {isPremium ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white/15 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-white" />
                  <span className="text-sm font-semibold">
                    Current Plan: Premium (Unlimited AI Study Access)
                  </span>
                </div>
                <button
                  onClick={() => navigate('/ai-tools')}
                  className="btn bg-white text-brand-700 hover:bg-brand-50 text-xs py-2 px-3 shrink-0"
                >
                  Return to AI Tools
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                className="btn bg-white text-brand-700 hover:bg-brand-50 mt-6 w-full text-base py-3.5"
              >
                <Sparkles className="h-4.5 w-4.5" />
                Upgrade to Premium
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </section>

        {/* Boundary note */}
        <section className="mt-6 card p-5 bg-ink-50/60">
          <p className="text-sm text-ink-600 leading-relaxed">
            <span className="font-semibold text-ink-800">Note:</span> AI in StudyGapRadar supports
            content generation and classification. Deterministic product logic — scoring, thresholds,
            insufficient evidence, severity, exam urgency, and priority ranking — is never handled
            by AI. No chatbot, no black-box mastery detection.
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-ink-400">
          Coming Soon features are shown for product direction only and may change.
        </p>
      </div>
    </AppShell>
  );
}
