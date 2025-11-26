import React from 'react';
import FormShell from '../../components/fill/FormShell';
import { useTheme } from '../../hooks/useTheme';

const Review = ({ answers, questions, onEdit, onSubmit, submitting, form }) => {
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';

  return (
    <FormShell showProgress progressPercent={100} form={form}>
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/50 backdrop-blur-md px-8 py-10 shadow-[var(--fomz-card-shadow)] animate-slide-in-left">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-80"></div>
        <div className="relative space-y-6">
          <div className="animate-text-enter">
            <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Review</p>
            <p className="font-display text-2xl text-gray-900">Make sure everything looks right</p>
          </div>

          <div className="space-y-2 animate-text-enter" style={{ animationDelay: '0.1s' }}>
            {questions.map((question) => {
              const answer = answers[question.id];
              return (
                <div key={question.id} className="rounded-xl border border-gray-200/60 bg-white/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 truncate">{question.label || 'Untitled question'}</p>
                      <p className="text-sm text-gray-900 truncate">
                        {answer ? (Array.isArray(answer) ? answer.join(', ') : answer) : <span className="text-gray-400 italic">No answer</span>}
                      </p>
                    </div>
                    <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0" onClick={() => onEdit(question.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              className="w-full max-w-xs rounded-full px-6 py-2.5 font-sans text-base text-white transition-transform active:scale-95"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => onEdit(null)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default Review;
