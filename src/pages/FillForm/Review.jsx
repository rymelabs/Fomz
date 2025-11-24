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

          <div className="space-y-4 animate-text-enter" style={{ animationDelay: '0.1s' }}>
            {questions.map((question) => {
              const answer = answers[question.id];
              return (
                <div key={question.id} className="rounded-2xl border border-gray-200/70 bg-white/90 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{question.label || 'Untitled question'}</p>
                      <p className="mt-2 text-sm text-gray-600">
                        {answer ? (Array.isArray(answer) ? answer.join(', ') : answer) : 'No answer'}
                      </p>
                    </div>
                    <button className="text-xs uppercase tracking-[0.4em] text-gray-500" onClick={() => onEdit(question.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              className="w-full max-w-sm rounded-full px-8 py-3 font-sans text-lg text-white"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit form'}
            </button>
            <button
              type="button"
              className="text-sm uppercase tracking-[0.4em] text-gray-700"
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
