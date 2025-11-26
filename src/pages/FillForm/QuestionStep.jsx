import React, { useEffect, useState, useRef } from 'react';
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
import ImageBlock from '../../components/forms/ImageBlock';
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
  'email': EmailInput,
  'image': ImageBlock
};

const fontMap = {
  sans: 'font-sans',
  poppins: 'font-poppins',
  inter: 'font-inter',
  roboto: 'font-roboto',
  lato: 'font-lato',
  opensans: 'font-opensans',
  montserrat: 'font-montserrat',
  raleway: 'font-raleway',
  sourcesans: 'font-sourcesans',
  playfair: 'font-playfair',
  serif: 'font-serif',
  mono: 'font-mono',
  dancing: 'font-dancing',
  pacifico: 'font-pacifico'
};

const QuestionStep = ({
  questions = [],
  section,
  sectionIndex,
  totalSections,
  form,
  answers,
  onChange,
  onNext,
  onPrevious,
  direction = 'forward',
  isFirstCard,
  isLastCard,
  progressPercent = 0,
  isEditMode = false,
  onBackToReview
}) => {
  const visibleQuestions = questions.filter(Boolean);
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';
  const [errors, setErrors] = useState({});
  const [height, setHeight] = useState('auto');
  const cardRef = useRef(null);
  const cardKey = visibleQuestions.map((q) => q.id).join('-');
  const fontFamily = form?.style?.fontFamily || 'poppins';
  const fontClass = fontMap[fontFamily] || 'font-poppins';

  useEffect(() => {
    setErrors({});
  }, [cardKey]);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.borderBoxSize) {
          setHeight(entry.borderBoxSize[0].blockSize);
        } else {
          setHeight(entry.target.offsetHeight);
        }
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [cardKey]);

  if (visibleQuestions.length === 0) {
    return (
      <FormShell
        showProgress={form?.settings?.showProgressBar !== false}
        progressPercent={progressPercent}
        form={form}
      >
        <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/20 backdrop-blur-md p-8 text-center shadow-[var(--fomz-card-shadow)]">
          <p className="text-gray-500">No questions available in this section.</p>
        </div>
      </FormShell>
    );
  }

  const animationClass = direction === 'forward' ? 'animate-slide-in-left' : 'animate-slide-in-right';

  const validateCard = () => {
    const newErrors = {};
    visibleQuestions.forEach((question) => {
      if (!question.required) return;
      const val = answers[question.id];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        newErrors[question.id] = 'This question is required';
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please answer required questions');
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateCard()) return;
    if (isEditMode && onBackToReview) {
      onBackToReview();
    } else {
      onNext();
    }
  };

  const handleInputChange = (questionId, value) => {
    onChange(questionId, value);
    if (errors[questionId]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  return (
    <FormShell
      showProgress={form?.settings?.showProgressBar !== false}
      progressPercent={progressPercent}
      form={form}
    >
      <div style={{ height }} className="transition-[height] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
        <div
          ref={cardRef}
          key={cardKey}
          className={`relative overflow-hidden rounded-[32px] border border-white bg-white/10 backdrop-blur-sm p-8 shadow-[var(--fomz-card-shadow)] ${animationClass}`}
        >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from white via-white/70 to-transparent opacity-70"></div>
        <div className="relative space-y-12">
          {section && (
            <div className="pt-2 pb-8">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-600 font-medium">
                Section {sectionIndex + 1} of {totalSections}
              </p>
              <p className={`text-xl text-gray-800 mt-1 ${fontClass}`}>{section.title}</p>
              {section.description && <p className="text-sm text-gray-600 mt-1">{section.description}</p>}
            </div>
          )}

          <div className="space-y-10">
            {visibleQuestions.map((question) => {
              const Component = componentMap[question.type] || ShortText;
              const error = errors[question.id];
              const value = answers[question.id];
              const globalIndex = form.questions?.findIndex((q) => q.id === question.id);
              const questionNumber =
                globalIndex !== undefined && globalIndex !== -1
                  ? globalIndex + 1
                  : visibleQuestions.findIndex((q) => q.id === question.id) + 1;

              return (
                <div key={question.id} className="space-y-4">
                  <div className="space-y-3">
                    <p className={`text-4xl font-semibold text-gray-500 mb-6 ${fontClass}`}>
                      {String(questionNumber).padStart(2, '0')}
                    </p>
                    <p className={`text-xl text-gray-900 ${fontClass}`}>{question.label || 'Untitled question'}</p>
                    {question.helpText && <p className="text-gray-500">{question.helpText}</p>}
                  </div>

                  <div>
                    <Component
                      question={question}
                      value={value}
                      onChange={(val) => handleInputChange(question.id, val)}
                      fontClass={fontClass}
                    />
                    {error && <p className="mt-2 text-sm text-red-500 animate-shake">{error}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center gap-2">
            <button
              className="w-full max-w-xs rounded-full px-6 py-2.5 font-sans text-base text-white font-light transition-transform active:scale-95"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={handleNext}
            >
              {isEditMode ? 'Review' : (isLastCard ? 'Review' : 'Next')}
            </button>
            <button
              type="button"
              className={`text-xs ${isFirstCard && !isEditMode ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={isEditMode ? onBackToReview : (isFirstCard ? undefined : onPrevious)}
              disabled={isFirstCard && !isEditMode}
            >
              {isEditMode ? 'Cancel' : 'Back'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </FormShell>
  );
};

export default QuestionStep;
