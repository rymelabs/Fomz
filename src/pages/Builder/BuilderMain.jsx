import React, { useEffect, useRef } from 'react';
import { Plus, Layout, Eye, Edit } from 'lucide-react';
import Button from '../../components/ui/Button';
import QuestionCard from '../../components/builder/QuestionCard';
import ThemeSelector from '../../components/builder/ThemeSelector';
import LogoUploader from '../../components/builder/LogoUploader';
import FormSettings from '../../components/builder/FormSettings';
import StyleSettings from '../../components/builder/StyleSettings';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useSearchParams, useLocation } from 'react-router-dom';
import { getForm } from '../../services/formService';
import { useNavigate } from 'react-router-dom';

const BuilderMain = () => {
  const {
    title,
    description,
    sections,
    questions,
    addQuestion,
    addSection,
    currentQuestionIndex,
    setCurrentQuestion,
    updateFormInfo,
    updateSection,
    initForm,
    saveForm,
    isSaving
  } = useFormBuilder();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initializedRef = useRef(false);
  const themeSectionRef = useRef(null);

  useEffect(() => {
    if (!initializedRef.current) {
      // If coming from AI generator, don't reset the form
      if (location.state?.fromAI) {
        initializedRef.current = true;
        return;
      }

      // Initialize with new empty form
      initForm();
      initializedRef.current = true;
    }
  }, [initForm, location.state]);

  useEffect(() => {
    const fid = searchParams.get('formId');
    if (fid) {
      // Load existing form from service and initialize builder store
      (async () => {
        try {
          const formDoc = await getForm(fid);
          if (formDoc) {
            initForm(formDoc);
          }
        } catch (error) {
          console.error('Failed to load form into builder', error);
        }
      })();
    }
  }, [searchParams, initForm]);

  const handlePreview = () => {
    navigate('/builder/preview');
  };

  const handleAddSection = () => {
    const sectionName = prompt('Enter section name:', 'New Section');
    if (sectionName && sectionName.trim()) {
      addSection(sectionName.trim());
    }
  };

  const handleChangeLayout = () => {
    themeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEditSection = (sectionId, currentTitle) => {
    const newTitle = prompt('Edit section name:', currentTitle);
    if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
      updateSection(sectionId, { title: newTitle.trim() });
    }
  };

  return (
    <div className="grid lg:grid-cols-[2fr,1fr] gap-4 animate-fade-in">
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <header className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 transition-all relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-normal text-gray-500 font-semibold">Form Builder</p>
            <button
              onClick={saveForm}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
          
          <input
            className="w-full font-display text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent border-b-2 border-transparent focus:border-gray-300 transition-colors pb-1"
            value={title}
            onChange={(e) => updateFormInfo({ title: e.target.value })}
            placeholder="Untitled form"
          />
          
          <textarea
            className="mt-2 w-full text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none bg-transparent resize-none rounded-xl border border-transparent focus:border-gray-300 focus:bg-white transition-all p-2"
            value={description}
            onChange={(e) => updateFormInfo({ description: e.target.value })}
            placeholder="Add a description to your form..."
            rows={2}
          />
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              onClick={handleAddSection}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
            <button
              onClick={handleChangeLayout}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
            >
              <Layout className="h-4 w-4" />
              Change Layout
            </button>
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={() => addQuestion()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white transition-all hover:bg-gray-800 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>
        </header>

        <div className="space-y-6">
          {sections.length === 0 && questions.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-semibold text-gray-900">No sections or questions yet</h3>
              <p className="text-gray-500 mt-2">Add your first section or question to start building.</p>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white transition-all hover:bg-gray-800 hover:scale-105 active:scale-95"
                  onClick={handleAddSection}
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                  onClick={() => addQuestion()}
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Render sections */}
              {sections.map((section, sectionIndex) => {
                const sectionQuestions = questions.filter(q => q.sectionId === section.id);
                return (
                  <div key={section.id} className="rounded-3xl border border-gray-200/80 bg-white/80 backdrop-blur p-6 animate-slide-up transition-all hover:shadow-md" style={{ animationDelay: `${(sectionIndex + 1) * 100}ms` }}>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl text-gray-900">{section.title}</h3>
                        {section.description && <p className="text-sm text-gray-600 mt-1">{section.description}</p>}
                      </div>
                      <button
                        onClick={() => handleEditSection(section.id, section.title)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                        title="Edit section name"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {sectionQuestions.length === 0 ? (
                        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                          <p className="text-gray-500 text-sm">No questions in this section yet.</p>
                          <button
                            className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                            onClick={() => addQuestion('short-text', section.id)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Question
                          </button>
                        </div>
                      ) : (
                        sectionQuestions.map((question, questionIndex) => (
                          <QuestionCard 
                            key={question.id} 
                            question={question} 
                            index={questions.findIndex(q => q.id === question.id)} 
                            total={questions.length} 
                          />
                        ))
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{sectionQuestions.length} questions</span>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                        onClick={() => addQuestion('short-text', section.id)}
                      >
                        <Plus className="h-3 w-3" />
                        Add Question
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Render questions not in sections */}
              {questions.filter(q => !q.sectionId).length > 0 && (
                <div className="rounded-3xl border border-gray-200/80 bg-white/80 backdrop-blur p-6 animate-slide-up" style={{ animationDelay: `${(sections.length + 1) * 100}ms` }}>
                  <div className="mb-4">
                    <h3 className="font-display text-xl text-gray-900">General Questions</h3>
                    <p className="text-sm text-gray-600 mt-1">Questions not assigned to any section</p>
                  </div>
                  
                  <div className="space-y-3">
                    {questions.filter(q => !q.sectionId).map((question) => (
                      <QuestionCard 
                        key={question.id} 
                        question={question} 
                        index={questions.findIndex(q => q.id === question.id)} 
                        total={questions.length} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <aside className="space-y-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <section ref={themeSectionRef} className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Theme</h2>
            <span className="text-xs text-gray-400">Instant preview</span>
          </div>
          <ThemeSelector />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 transition-all">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Typography & Style</h2>
          <StyleSettings />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 transition-all">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Branding</h2>
          <LogoUploader />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 transition-all">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Form settings</h2>
          <FormSettings />
        </section>
      </aside>
    </div>
  );
};

export default BuilderMain;
