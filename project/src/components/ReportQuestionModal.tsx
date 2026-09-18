import { useState, type FormEvent } from 'react';
import { X, Flag, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  questionId: string;
  topic: string;
  reasons: string[];
  onClose: () => void;
  onSubmit: (reason: string, note: string) => void;
}

export function ReportQuestionModal({ questionId, topic, reasons, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason.');
      return;
    }
    onSubmit(reason, note.trim());
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div
        className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-4">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink-900">
              Report submitted
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Thanks for flagging this question. Our team will review it.
            </p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                  <Flag className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 id="report-title" className="font-display text-lg font-bold text-ink-900">
                    Report a question
                  </h2>
                  <p className="text-xs text-ink-400">Topic: {topic}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-600 rounded-lg p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="label">Reason</legend>
                <div className="space-y-2">
                  {reasons.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                        reason === r
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                          : 'border-ink-200 bg-white hover:bg-ink-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => {
                          setReason(r);
                          setError(null);
                        }}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-ink-300"
                      />
                      <span className="text-sm font-medium text-ink-700">{r}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4">
                <label htmlFor="note" className="label">
                  Additional details <span className="text-ink-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="note"
                  className="input min-h-[88px] resize-y"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything else we should know…"
                />
              </div>

              {error && (
                <p className="mt-3 text-xs text-danger-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Submit report
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
