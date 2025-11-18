import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Start from './Start';
import QuestionStep from './QuestionStep';
import Review from './Review';
import Success from './Success';
import { getForm } from '../../services/formService';
import { submitResponse } from '../../services/responseService';
import { useThemeStore } from '../../store/themeStore';

const FillFormFlow = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [stage, setStage] = useState('start');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState('forward');
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;
      try {
        const doc = await getForm(formId);
        setForm(doc);
        if (doc?.theme) {
          setTheme(doc.theme);
        } else {
          setTheme('blue');
        }
      } catch (error) {
        console.error('Unable to load form', error);
      }
    };

    loadForm();
  }, [formId, setTheme]);

  if (!form) {
    return <p className="text-center py-20 text-gray-500">Loading form...</p>;
  }

  const sections = form.sections || [];
  const questions = form.questions || [];
  
  // If no sections, treat all questions as one section
  const hasSections = sections.length > 0;
  const currentSection = hasSections ? sections[currentSectionIndex] : null;
  const sectionQuestions = hasSections 
    ? questions.filter(q => q.sectionId === currentSection?.id)
    : questions;
  
  const currentQuestion = sectionQuestions[currentQuestionIndex];
  const totalSections = hasSections ? sections.length : 1;
  const currentSectionProgress = hasSections ? currentSectionIndex : 0;

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const goToReview = () => {
    setDirection('forward');
    setStage('review');
  };

  const handleNext = () => {
    setDirection('forward');
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      // Next question in current section
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (hasSections && currentSectionIndex < sections.length - 1) {
      // Next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // End of form
      goToReview();
    }
  };

  const handlePrevious = () => {
    setDirection('backward');
    if (currentQuestionIndex > 0) {
      // Previous question in current section
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (hasSections && currentSectionIndex > 0) {
      // Previous section
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = sections[currentSectionIndex - 1];
      const prevSectionQuestions = questions.filter(q => q.sectionId === prevSection.id);
      setCurrentQuestionIndex(prevSectionQuestions.length - 1);
    }
  };

  const goToQuestion = (questionId) => {
    setDirection('backward');
    if (!questionId) {
      setStage('question');
      return;
    }
    const index = questions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      // Find which section and question index this corresponds to
      let totalQuestions = 0;
      for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
        const section = sections[sectionIdx];
        const sectionQs = questions.filter(q => q.sectionId === section.id);
        if (index < totalQuestions + sectionQs.length) {
          setCurrentSectionIndex(sectionIdx);
          setCurrentQuestionIndex(index - totalQuestions);
          setStage('question');
          return;
        }
        totalQuestions += sectionQs.length;
      }
      // Fallback for questions not in sections
      const nonSectionQuestions = questions.filter(q => !q.sectionId);
      if (index >= totalQuestions && index < totalQuestions + nonSectionQuestions.length) {
        setCurrentSectionIndex(sections.length);
        setCurrentQuestionIndex(index - totalQuestions);
        setStage('question');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formId) return;
    try {
      setSubmitting(true);
      const payload = {
        answers: questions.map((question) => ({
          questionId: question.id,
          value: answers[question.id] ?? null,
        })),
      };
      await submitResponse(formId, payload);
      setStage('success');
    } catch (error) {
      console.error('Failed to submit response', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === 'start') {
    return (
      <Start
        title={form.title}
        description={form.description}
        logoUrl={form.logoUrl}
        onBegin={() => setStage('question')}
        form={form}
      />
    );
  }

  if (stage === 'question') {
    if (!currentQuestion) {
      return (
        <p className="text-center py-20 text-gray-500">
          This form does not have any questions yet.
        </p>
      );
    }
    return (
      <QuestionStep
        question={currentQuestion}
        section={currentSection}
        sectionIndex={currentSectionIndex}
        questionIndex={currentQuestionIndex}
        total={sectionQuestions.length}
        totalSections={totalSections}
        sectionProgress={currentSectionProgress}
        value={answers[currentQuestion.id]}
        onChange={handleAnswerChange}
        form={form}
        onNext={handleNext}
        onPrevious={handlePrevious}
        direction={direction}
      />
    );
  }

  if (stage === 'review') {
    return (
      <Review
        answers={answers}
        questions={questions}
        onEdit={goToQuestion}
        onSubmit={handleSubmit}
        submitting={submitting}
        form={form}
      />
    );
  }

  return (
    <Success
      title={form.title}
      description={form.description}
      logoUrl={form.logoUrl}
      onSubmitAnother={() => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setCurrentSectionIndex(0);
        setStage('start');
      }}
      form={form}
    />
  );
};

export default FillFormFlow;
