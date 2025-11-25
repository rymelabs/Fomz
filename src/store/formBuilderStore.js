import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateFormFromPrompt } from '../services/aiService';

const defaultFormState = {
  id: null,
  title: 'Untitled Form',
  description: '',
  theme: 'blue',
  logoUrl: '',
  logoPath: '',
  sections: [],
  questions: [],
  settings: {
    allowMultipleSubmissions: false,
    requireLogin: false,
    sendEmailReceipt: false,
    redirectUrl: '',
    showProgressBar: true,
    published: false
  },
  style: {
    fontFamily: 'sans',
    fontSize: 'md',
    borderRadius: 'lg'
  }
};

export const useFormBuilderStore = create((set, get) => ({
  ...defaultFormState,
  
  currentQuestionIndex: null,
  isDirty: false,
  isSaving: false,
  isGenerating: false,

  // Initialize form (new or existing)
  initForm: (formData = null) => {
    if (formData) {
      // Ensure style object exists for older forms
      const mergedData = {
        ...defaultFormState,
        ...formData,
        style: { ...defaultFormState.style, ...(formData.style || {}) },
        settings: { ...defaultFormState.settings, ...(formData.settings || {}) }
      };
      set({ ...mergedData, isDirty: false });
    } else {
      set({ ...defaultFormState, isDirty: false });
    }
  },

  // Update basic info
  updateFormInfo: (updates) => set((state) => ({
    ...state,
    ...updates,
    isDirty: true
  })),

  // Update style
  updateStyle: (updates) => set((state) => ({
    style: { ...state.style, ...updates },
    isDirty: true
  })),

  // Add a new question (optionally to a section)
  addQuestion: (type = 'short-text', sectionId = null) => {
    const newQuestion = {
      id: uuidv4(),
      sectionId,
      type,
      label: '',
      required: false,
      placeholder: '',
      helpText: '',
      options: type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown' 
        ? ['Option 1'] 
        : [],
      validation: {
        min: null,
        max: null,
        pattern: null
      }
    };

    set((state) => ({
      questions: [...state.questions, newQuestion],
      currentQuestionIndex: state.questions.length,
      isDirty: true
    }));

    return newQuestion.id;
  },

  // Update a question
  updateQuestion: (questionId, updates) => set((state) => ({
    questions: state.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ),
    isDirty: true
  })),

  // Delete a question
  deleteQuestion: (questionId) => set((state) => ({
    questions: state.questions.filter(q => q.id !== questionId),
    isDirty: true
  })),

  // Reorder questions
  reorderQuestions: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.questions);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return { questions: result, isDirty: true };
  }),

  // Duplicate a question
  duplicateQuestion: (questionId) => set((state) => {
    const questionIndex = state.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return state;

    const originalQuestion = state.questions[questionIndex];
    const duplicatedQuestion = {
      ...originalQuestion,
      id: uuidv4(),
      label: `${originalQuestion.label} (Copy)`
    };

    const newQuestions = [...state.questions];
    newQuestions.splice(questionIndex + 1, 0, duplicatedQuestion);

    return { questions: newQuestions, isDirty: true };
  }),

  // Add option to a question (for MCQ, checkbox, dropdown)
  addOption: (questionId, optionText = '') => set((state) => ({
    questions: state.questions.map(q =>
      q.id === questionId
        ? { ...q, options: [...q.options, optionText || `Option ${q.options.length + 1}`] }
        : q
    ),
    isDirty: true
  })),

  // Update an option
  updateOption: (questionId, optionIndex, newText) => set((state) => ({
    questions: state.questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map((opt, idx) => idx === optionIndex ? newText : opt)
          }
        : q
    ),
    isDirty: true
  })),

  // Delete an option
  deleteOption: (questionId, optionIndex) => set((state) => ({
    questions: state.questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
        : q
    ),
    isDirty: true
  })),

  // Update settings
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates },
    isDirty: true
  })),

  // Set current question
  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  // Save state
  setSaving: (isSaving) => set({ isSaving }),
  
  markSaved: () => set({ isDirty: false }),

  // Reset form
  resetForm: () => set({ ...defaultFormState, currentQuestionIndex: null, isDirty: false }),

  // Section management
  addSection: (title = 'New Section') => {
    const newSection = {
      id: uuidv4(),
      title,
      description: '',
      questions: []
    };

    set((state) => ({
      sections: [...state.sections, newSection],
      isDirty: true
    }));

    return newSection.id;
  },

  updateSection: (sectionId, updates) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ),
    isDirty: true
  })),

  deleteSection: (sectionId) => set((state) => ({
    sections: state.sections.filter(s => s.id !== sectionId),
    questions: state.questions.filter(q => !q.sectionId || q.sectionId !== sectionId),
    isDirty: true
  })),

  reorderSections: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return { sections: result, isDirty: true };
  }),

  addQuestionToSection: (sectionId, type = 'short-text') => {
    const newQuestion = {
      id: uuidv4(),
      sectionId,
      type,
      label: '',
      required: false,
      placeholder: '',
      helpText: '',
      options: type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown' 
        ? ['Option 1'] 
        : [],
      validation: {
        min: null,
        max: null,
        pattern: null
      }
    };

    set((state) => ({
      questions: [...state.questions, newQuestion],
      isDirty: true
    }));

    return newQuestion.id;
  },

  // Get form data for saving
  getFormData: () => {
    const state = get();
    return {
      title: state.title,
      description: state.description,
      theme: state.theme,
      logoUrl: state.logoUrl,
      logoPath: state.logoPath,
      sections: state.sections,
      questions: state.questions,
      settings: state.settings,
      style: state.style
    };
  },

  // AI Generation
  generateForm: async (prompt) => {
    set({ isGenerating: true });
    try {
      const aiData = await generateFormFromPrompt(prompt);
      const theme = aiData.theme || 'blue';

      // Sections and nested questions
      const sections = (aiData.sections || []).map((s) => ({
        id: uuidv4(),
        title: s.title || 'New Section',
        description: s.description || '',
        questions: []
      }));

      const sectionQuestions = (aiData.sections || []).flatMap((s, idx) => {
        const sectionId = sections[idx]?.id || null;
        return (s.questions || []).map((q) => ({
          id: uuidv4(),
          sectionId,
          type: q.type || 'short-text',
          label: q.title || 'Untitled Question',
          required: q.required || false,
          placeholder: q.placeholder || '',
          helpText: '',
          options: q.options || [],
          validation: { min: null, max: null, pattern: null }
        }));
      });

      // Loose questions
      const looseQuestions = (aiData.questions || []).map(q => ({
        id: uuidv4(),
        sectionId: null,
        type: q.type || 'short-text',
        label: q.title || 'Untitled Question',
        required: q.required || false,
        placeholder: q.placeholder || '',
        helpText: '',
        options: q.options || [],
        validation: { min: null, max: null, pattern: null }
      }));

      const newQuestions = [...sectionQuestions, ...looseQuestions];

      set({
        title: aiData.title || 'AI Generated Form',
        description: aiData.description || '',
        questions: newQuestions,
        sections,
        theme,
        isDirty: true,
        isGenerating: false
      });
      
      return true;
    } catch (error) {
      console.error("Store: AI Generation failed", error);
      set({ isGenerating: false });
      return false;
    }
  }
}));
