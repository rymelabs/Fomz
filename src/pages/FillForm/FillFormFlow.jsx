import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Start from './Start';
import QuestionStep from './QuestionStep';
import Review from './Review';
import Success from './Success';
import { getForm, getFormByShareId } from '../../services/formService';
import { submitResponse } from '../../services/responseService';
import { useThemeStore } from '../../store/themeStore';
import { useUserStore } from '../../store/userStore';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { sendConfirmationEmail } from '../../services/emailService';

const DEFAULT_SECTION_KEY = '__default';
const PAIRED_TYPES = new Set(['short-text', 'email']);

const canPair = (question) => PAIRED_TYPES.has(question?.type);

const buildCards = (questionList = []) => {
  const cards = [];
  let index = 0;
  while (index < questionList.length) {
    const current = questionList[index];
    const next = questionList[index + 1];
    if (current && next && canPair(current) && canPair(next)) {
      cards.push([current, next]);
      index += 2;
    } else {
      cards.push([current]);
      index += 1;
    }
  }
  return cards.filter((card) => card.length);
};

const FillFormFlow = () => {
  const { formId, shareId } = useParams();
  const [form, setForm] = useState(null);
  const [stage, setStage] = useState('start');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState('forward');
  const [isEditMode, setIsEditMode] = useState(false);
  const isSubmittingRef = useRef(false);
  const setTheme = useThemeStore((state) => state.setTheme);
  const { user } = useUserStore();
  const { signInGoogle } = useAuth();

  useEffect(() => {
    const loadForm = async () => {
      // Support both /forms/:formId/fill and /fill/:shareId routes
      if (!formId && !shareId) return;
      try {
        let doc;
        if (shareId) {
          // Load by shareId (for /fill/:shareId route)
          doc = await getFormByShareId(shareId);
        } else {
          // Load by formId (for /forms/:formId/fill route)
          doc = await getForm(formId);
        }
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
  }, [formId, shareId, setTheme]);

  const sections = form?.sections || [];
  const questions = form?.questions || [];

  const hasSections = sections.length > 0;
  const questionsBySection = useMemo(() => {
    if (!hasSections) return {};
    return sections.reduce((acc, section) => {
      acc[section.id] = questions.filter((q) => q.sectionId === section.id);
      return acc;
    }, {});
  }, [hasSections, sections, questions]);

  const cardsBySection = useMemo(() => {
    if (hasSections) {
      return sections.reduce((acc, section) => {
        acc[section.id] = buildCards(questionsBySection[section.id] || []);
        return acc;
      }, {});
    }
    return { [DEFAULT_SECTION_KEY]: buildCards(questions) };
  }, [hasSections, sections, questions, questionsBySection]);

  const questionLocationMap = useMemo(() => {
    const map = {};
    if (hasSections) {
      sections.forEach((section, sectionIdx) => {
        const cards = cardsBySection[section.id] || [];
        cards.forEach((card, cardIdx) => {
          card.forEach((question) => {
            if (question?.id) {
              map[question.id] = { sectionIdx, cardIdx };
            }
          });
        });
      });
    } else {
      const cards = cardsBySection[DEFAULT_SECTION_KEY] || [];
      cards.forEach((card, cardIdx) => {
        card.forEach((question) => {
          if (question?.id) {
            map[question.id] = { sectionIdx: 0, cardIdx };
          }
        });
      });
    }
    return map;
  }, [cardsBySection, hasSections, sections]);

  const currentSection = hasSections ? sections[currentSectionIndex] : null;
  const sectionQuestions = hasSections
    ? questionsBySection[currentSection?.id] || []
    : questions;
  const currentSectionCards = hasSections
    ? cardsBySection[currentSection?.id] || []
    : cardsBySection[DEFAULT_SECTION_KEY] || [];
  const currentCardQuestions = currentSectionCards[currentCardIndex] || [];
  const totalSections = hasSections ? sections.length : 1;
  const isFirstCard = currentSectionIndex === 0 && currentCardIndex === 0;
  const hasMoreCardsInSection = currentCardIndex < currentSectionCards.length - 1;
  const hasMoreSectionsAhead = hasSections
    ? sections.slice(currentSectionIndex + 1).some((section) => {
        const cards = cardsBySection[section.id] || [];
        return cards.length > 0;
      })
    : false;
  const isLastCard = !hasMoreCardsInSection && !hasMoreSectionsAhead;
  const questionsBeforeCurrentSection = hasSections
    ? sections.slice(0, currentSectionIndex).reduce((sum, section) => {
        const sectionQs = questionsBySection[section.id] || [];
        return sum + sectionQs.length;
      }, 0)
    : 0;
  const answeredInCurrentSection = currentSectionCards
    .slice(0, currentCardIndex)
    .reduce((sum, card) => sum + card.length, 0);
  const completedQuestionsInSection = Math.min(
    answeredInCurrentSection + currentCardQuestions.length,
    sectionQuestions.length
  );
  const totalQuestionsCount = questions.length || 1;
  const progressPercent =
    totalQuestionsCount > 0
      ? ((questionsBeforeCurrentSection + completedQuestionsInSection) / totalQuestionsCount) * 100
      : 0;

  useEffect(() => {
    if (currentSectionCards.length === 0) {
      if (hasSections) {
        for (let idx = currentSectionIndex + 1; idx < sections.length; idx++) {
          const cards = cardsBySection[sections[idx].id] || [];
          if (cards.length > 0) {
            setCurrentSectionIndex(idx);
            setCurrentCardIndex(0);
            return;
          }
        }
      }

      if (currentCardIndex !== 0) {
        setCurrentCardIndex(0);
      }
      return;
    }

    if (currentCardIndex > currentSectionCards.length - 1) {
      setCurrentCardIndex(currentSectionCards.length - 1);
    }
  }, [
    cardsBySection,
    currentCardIndex,
    currentSectionCards,
    currentSectionIndex,
    hasSections,
    sections
  ]);

  if (!form) {
    return <p className="text-center py-20 text-gray-500">Loading form...</p>;
  }

  if (form.settings?.requireLogin && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md mx-4">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-6">This form requires you to be signed in to respond.</p>
          <Button onClick={signInGoogle}>Sign in with Google</Button>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    setDirection('forward');
    const nextCardIndex = currentCardIndex + 1;
    if (nextCardIndex < currentSectionCards.length) {
      setCurrentCardIndex(nextCardIndex);
      return;
    }

    if (hasSections) {
      for (let idx = currentSectionIndex + 1; idx < sections.length; idx++) {
        const cards = cardsBySection[sections[idx].id] || [];
        if (cards.length > 0) {
          setCurrentSectionIndex(idx);
          setCurrentCardIndex(0);
          return;
        }
      }
    }

    setStage('review');
  };

  const handlePrevious = () => {
    if (isFirstCard) return;
    setDirection('backward');
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      return;
    }

    if (hasSections && currentSectionIndex > 0) {
      for (let idx = currentSectionIndex - 1; idx >= 0; idx--) {
        const cards = cardsBySection[sections[idx].id] || [];
        if (cards.length > 0) {
          setCurrentSectionIndex(idx);
          setCurrentCardIndex(cards.length - 1);
          return;
        }
      }
    }
  };

  const goToQuestion = (questionId) => {
    setDirection('backward');
    setIsEditMode(true); // Mark that we're editing from review
    if (!questionId) {
      setStage('question');
      return;
    }

    const location = questionLocationMap[questionId];
    if (!location) return;

    if (hasSections) {
      setCurrentSectionIndex(location.sectionIdx);
    }

    setCurrentCardIndex(location.cardIdx);
    setStage('question');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formId || submitting || isSubmittingRef.current) return;

    const firstMissing = questions.find((q) => {
      if (!q.required) return false;
      const val = answers[q.id];
      return val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
    });

    if (firstMissing) {
      toast.error('Please answer all required questions');
      goToQuestion(firstMissing.id);
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      const payload = {
        answers: questions.map((question) => ({
          questionId: question.id,
          value: answers[question.id] ?? null,
        })),
      };
      await submitResponse(formId, payload, user?.uid);

      if (form.settings?.redirectUrl) {
        window.location.href = form.settings.redirectUrl;
        return;
      }

      // Fire-and-forget confirmation email if enabled and an email answer exists
      if (form.settings?.sendEmailReceipt) {
        const emailQuestion = questions.find((q) => q.type === 'email');
        const rawEmailAnswer = emailQuestion ? answers[emailQuestion.id] : null;
        const toEmail = typeof rawEmailAnswer === 'string' ? rawEmailAnswer.trim() : '';

        const nameQuestion = questions.find(
          (q) =>
            q.type === 'short-text' &&
            /name/i.test(q.label || q.title || '')
        );
        const respondentNameRaw = nameQuestion ? answers[nameQuestion.id] : null;
        const respondentName =
          typeof respondentNameRaw === 'string' && respondentNameRaw.trim()
            ? respondentNameRaw.trim()
            : '';

        if (toEmail) {
          const answersText = questions
            .map((q) => {
              const val = answers[q.id];
              if (val === undefined || val === null || val === '') return null;
              const display =
                Array.isArray(val) ? val.join(', ') : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
              return `${q.label || q.title || 'Question'}: ${display}`;
            })
            .filter(Boolean)
            .join('\n');

          sendConfirmationEmail({
            toEmail,
            formTitle: form.title || 'Your submission',
            answersText,
            respondentName,
          }).catch((err) => {
            console.warn('Confirmation email failed', err);
          });
        } else {
          console.warn('Confirmation email enabled but no recipient email was provided in the form.');
        }
      }

      setStage('success');
    } catch (error) {
      console.error('Failed to submit response', error);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (stage === 'start') {
    return (
      <Start
        title={form.title}
        description={form.description}
        logoUrl={form.logoUrl}
        onBegin={() => {
          setCurrentSectionIndex(0);
          setCurrentCardIndex(0);
          setStage('question');
        }}
        form={form}
      />
    );
  }

  if (stage === 'question') {
    if (!currentCardQuestions.length) {
      return (
        <p className="text-center py-20 text-gray-500">
          This form does not have any questions yet.
        </p>
      );
    }
    return (
      <QuestionStep
        questions={currentCardQuestions}
        section={currentSection}
        sectionIndex={currentSectionIndex}
        totalSections={totalSections}
        form={form}
        answers={answers}
        onChange={handleAnswerChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        direction={direction}
        isFirstCard={isFirstCard}
        isLastCard={isLastCard}
        progressPercent={progressPercent}
        isEditMode={isEditMode}
        onBackToReview={() => {
          setIsEditMode(false);
          setStage('review');
        }}
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
        setCurrentCardIndex(0);
        setCurrentSectionIndex(0);
        setStage('start');
      }}
      form={form}
      allowResubmit={form.settings?.allowMultipleSubmissions !== false}
    />
  );
};

export default FillFormFlow;
