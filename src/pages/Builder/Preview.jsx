import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useTheme } from '../../hooks/useTheme';
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

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

const radiusMap = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px'
};

const Preview = () => {
  const navigate = useNavigate();
  const { title, description, questions, sections, logoUrl, style } = useFormBuilder();
  const { themeData } = useTheme();
  const canvasRef = useRef(null);
  const [disableBackgroundAnimation, setDisableBackgroundAnimation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const gradient = themeData?.gradient || 'linear-gradient(135deg, #7CA7FF 0%, #B6F3CF 100%)';
  const accent = themeData?.primaryColor || '#2563eb';

  const fontFamily = style?.fontFamily || 'sans';
  const fontSize = style?.fontSize || 'md';
  const borderRadius = style?.borderRadius || 'lg';

  const containerStyle = {
    '--element-radius': radiusMap[borderRadius] || '1rem',
    '--form-font-size': fontSize === 'sm' ? '0.875rem' : fontSize === 'lg' ? '1.125rem' : '1rem'
  };

  // Get all questions (from sections and loose)
  const allQuestions = React.useMemo(() => {
    const sectionQuestions = sections.flatMap(section => 
      questions.filter(q => q.sectionId === section.id)
    );
    const looseQuestions = questions.filter(q => !q.sectionId);
    return [...sectionQuestions, ...looseQuestions];
  }, [sections, questions]);

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentSection = currentQuestion?.sectionId 
    ? sections.find(s => s.id === currentQuestion.sectionId) 
    : null;

  const progressPercent = allQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / allQuestions.length) * 100 
    : 0;

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isTouchMac = navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || isTouchMac;
    const isMobileWidth = window.innerWidth < 768;
    if (isIOS || isMobileWidth) {
      setDisableBackgroundAnimation(true);
    }
  }, []);

  // Globe animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let dots = [];
    let radius = 0;

    const initDots = (width, height) => {
      dots = [];
      const numDots = 600;
      radius = Math.min(width, height) * 0.6;
      
      for (let i = 0; i < numDots; i++) {
        const phi = Math.acos(-1 + (2 * i) / numDots);
        const theta = Math.sqrt(numDots * Math.PI) * phi;
        
        dots.push({
          x: radius * Math.cos(theta) * Math.sin(phi),
          y: radius * Math.sin(theta) * Math.sin(phi),
          z: radius * Math.cos(phi),
          baseAlpha: Math.random() * 0.5 + 0.5
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      angle += 0.0005;

      dots.forEach(dot => {
        const tilt = 0.2;
        let x = dot.x * Math.cos(angle) - dot.z * Math.sin(angle);
        let z = dot.z * Math.cos(angle) + dot.x * Math.sin(angle);
        let y = dot.y;

        let yNew = y * Math.cos(tilt) - z * Math.sin(tilt);
        let zNew = z * Math.cos(tilt) + y * Math.sin(tilt);
        y = yNew;
        z = zNew;

        const fov = 1000;
        const scale = fov / (fov - z);
        const px = cx + x * scale;
        const py = cy + y * scale;

        if (scale > 0) {
          const alpha = Math.max(0.1, (z + radius) / (2 * radius));
          
          ctx.beginPath();
          ctx.arc(px, py, 1.2 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * dot.baseAlpha * 0.8})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const Component = currentQuestion ? (componentMap[currentQuestion.type] || ShortText) : null;

  return (
    <div 
      className={`relative min-h-screen overflow-hidden bg-white ${fontMap[fontFamily] || 'font-sans'} ${sizeMap[fontSize] || 'text-base'}`}
      style={containerStyle}
    >
      {/* Gradient Background */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 blur-3xl ${disableBackgroundAnimation ? '' : 'md:animate-gradient-xy'}`}
        style={{ background: gradient, backgroundSize: '400% 400%' }}
      />
      
      {/* Globe Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 opacity-60"
      />

      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/30 blur-3xl" />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b border-white/60 bg-white/40 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-5xl text-gray-900">fomz</p>
              <p className="text-xs tracking-[0.2em] text-gray-500">by RymeLabs</p>
            </div>
            <button
              onClick={() => navigate('/builder')}
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-black/10 text-gray-800 text-sm font-medium transition-all duration-300 hover:bg-black/20 active:scale-95"
            >
              <X className="h-4 w-4" />
              Exit Preview
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-gray-200/70">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, progressPercent)}%`, backgroundColor: accent }}
            />
          </div>
        </div>
        {/* Form Header */}
        <div className="bg-white/0 animate-slide-down border-t border-gray-200">
          <div className="mx-auto w-full max-w-4xl px-6 py-3">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-xs uppercase tracking-[0.4em] text-black">
                  {title?.[0] || 'F'}
                </div>
              )}
              <div>
                <p className="font-display text-xl text-gray-900">{title || 'Untitled form'}</p>
                {description && <p className="text-sm text-gray-500">{description}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col pt-44">
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {allQuestions.length === 0 ? (
              <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/10 backdrop-blur-sm p-8 shadow-[var(--fomz-card-shadow)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-70" />
                <div className="relative text-center">
                  <p className="text-gray-500">No questions added yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Add questions in the builder to see them here.</p>
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/10 backdrop-blur-sm p-8 shadow-[var(--fomz-card-shadow)] animate-fade-in">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-70" />
                <div className="relative space-y-12">
                  {currentSection && (
                    <div className="pt-2 pb-8">
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-600 font-medium">
                        Section {sections.findIndex(s => s.id === currentSection.id) + 1} of {sections.length}
                      </p>
                      <p className="font-display text-xl text-gray-800 mt-1">{currentSection.title}</p>
                      {currentSection.description && (
                        <p className="text-sm text-gray-600 mt-1">{currentSection.description}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <p className="text-4xl font-semibold text-gray-500 mb-6">
                          {String(currentQuestionIndex + 1).padStart(2, '0')}
                        </p>
                        <p className="text-xl text-gray-900">{currentQuestion.label || 'Untitled question'}</p>
                        {currentQuestion.helpText && (
                          <p className="text-gray-500">{currentQuestion.helpText}</p>
                        )}
                      </div>

                      <div>
                        <Component
                          question={currentQuestion}
                          value={answers[currentQuestion.id]}
                          onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-16 flex flex-col items-center gap-3">
                    <button
                      className="w-full max-w-sm rounded-full px-8 py-3 font-sans text-lg text-white font-light transition-transform active:scale-95"
                      style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
                      onClick={handleNext}
                    >
                      {currentQuestionIndex === allQuestions.length - 1 ? 'Review' : 'Next'}
                    </button>
                    <button
                      type="button"
                      className={`text-sm ${currentQuestionIndex === 0 ? 'text-gray-300' : 'text-gray-700'}`}
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="px-6 pb-10 text-center text-[0.65rem] text-gray-500">
          <span className="font-brand font-bold">fomz</span> by RymeLabs
        </footer>
      </div>

      {/* Preview Mode Indicator */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="rounded-full bg-yellow-100 border border-yellow-300 px-4 py-2 text-xs font-medium text-yellow-800 shadow-lg">
          Preview Mode • {currentQuestionIndex + 1} of {allQuestions.length}
        </div>
      </div>
    </div>
  );
};

export default Preview;
