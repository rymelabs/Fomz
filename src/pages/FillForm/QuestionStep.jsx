import React, { useState } from 'react';
import FormShell from '../../components/fill/FormShell';
import ShortText from '../../components/forms/ShortText';
import LongText from '../../components/forms/LongText';
import MultipleChoice from '../../components/forms/MultipleChoice';
import CheckboxGroup from '../../components/forms/CheckboxGroup';
import Dropdown from '../../components/forms/Dropdown';
import Rating from '../../components/forms/Rating';
import DateInput from '../../components/forms/DateInput';
import NumberInput from '../../components/forms/NumberInput';
import EmailInput from '../../components/forms/EmailInput';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';

const componentMap = {
  'short-text': ShortText,
  'long-text': LongText,
  'multiple-choice': MultipleChoice,
  'checkbox': CheckboxGroup,
  'dropdown': Dropdown,
  'rating': Rating,
  'date': DateInput,
  'number': NumberInput,
  'email': EmailInput
};

const QuestionStep = ({ 
  question, 
  section,
  sectionIndex,
  questionIndex,
  total,
  totalSections,
  sectionProgress,
  value, 
  onChange, 
  onNext, 
  onPrevious, 
  form,
  direction = 'forward'
}) => {
  if (!question) return null;

  const Component = componentMap[question.type] || ShortText;
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';
  const [error, setError] = useState(null);
  
  const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  
  const handleNext = () => {
    if (question.required) {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        setError('This question is required');
        toast.error('Please answer this question');
        return;
      }
    }
    setError(null);
    onNext();
  };

  // Calculate progress based on sections
  let progressPercent = 0;
  if (totalSections > 1) {
    // Section-based progress
    const sectionQuestions = form.questions?.filter(q => q.sectionId === section?.id) || [];
    const sectionQuestionProgress = sectionQuestions.length > 0 ? (questionIndex + 1) / sectionQuestions.length : 0;
    progressPercent = ((sectionProgress + sectionQuestionProgress) / totalSections) * 100;
  } else {
    // Fallback to question-based progress
    const totalQuestions = form.questions?.length || 0;
    const currentQuestionGlobalIndex = form.questions?.findIndex(q => q.id === question.id) || 0;
    progressPercent = totalQuestions > 0 ? ((currentQuestionGlobalIndex + 1) / totalQuestions) * 100 : 0;
  }

  return (
    <FormShell showProgress={form?.settings?.showProgressBar !== false} progressPercent={progressPercent} form={form}>
      <div 
        key={question.id}
        className={`relative overflow-hidden rounded-[32px] border border-white bg-white/20 backdrop-blur-md p-10 shadow-[var(--fomz-card-shadow)] ${animationClass}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from white via-white/70 to-transparent opacity-70"></div>
        <div className="relative space-y-12">
          {section && (
            <div className="pt-2 pb-8 animate-text-enter">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-600 font-medium">
                Section {sectionIndex + 1} of {totalSections}
              </p>
              <p className="font-display text-xl text-gray-800 mt-1">{section.title}</p>
              {section.description && <p className="text-sm text-gray-600 mt-1">{section.description}</p>}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-3 animate-text-enter" style={{ animationDelay: '0.1s' }}>
              <p className="text-5xl font-semibold text-gray-500 mb-6">{String(questionIndex + 1).padStart(2, '0')}</p>
              <p className="font-sans text-2xl text-gray-900">{question.label || 'Untitled question'}</p>
              {question.helpText && <p className="text-gray-500">{question.helpText}</p>}
            </div>

            <div className="animate-text-enter" style={{ animationDelay: '0.2s' }}>
              <Component
                question={question}
                value={value}
                onChange={(val) => {
                  onChange(val);
                  if (error) setError(null);
                }}
              />
              {error && <p className="mt-2 text-sm text-red-500 animate-shake">{error}</p>}
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center gap-3 animate-text-enter" style={{ animationDelay: '0.3s' }}>
            <button
              className="w-full max-w-sm rounded-full px-8 py-3 font-sans text-lg text-white font-light transition-transform active:scale-95"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={handleNext}
            >
              {questionIndex === total - 1 ? 'Review' : 'Next'}
            </button>
            <button
              type="button"
              className={`text-sm ${questionIndex === 0 ? 'text-gray-300' : 'text-gray-700'}`}
              onClick={questionIndex === 0 ? undefined : onPrevious}
              disabled={questionIndex === 0}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default QuestionStep;
