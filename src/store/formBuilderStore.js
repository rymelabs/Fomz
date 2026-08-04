import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { editFormFromPrompt, generateFormFromPrompt } from '../services/aiService';
import { checkAIUsageLimit, recordAIUsage } from '../services/aiUsageLimitService';
import { 
  trackQuestionAdded, 
  trackQuestionDeleted, 
  trackSectionAdded,
  trackAIFormGenerated,
  trackAILimitReached
} from '../services/analyticsService';

const MAX_HISTORY_SIZE = 50;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

export const serializeFormForAI = (state) => ({
  title: state.title,
  description: state.description,
  theme: state.theme,
  fontFamily: state.style?.fontFamily,
  style: state.style,
  settings: state.settings,
  sections: (state.sections || []).map(section => ({
    id: section.id,
    title: section.title,
    description: section.description,
    questions: (state.questions || [])
      .filter(question => question.sectionId === section.id)
      .map(question => ({
        id: question.id,
        type: question.type,
        title: question.label,
        required: question.required,
        placeholder: question.placeholder,
        helpText: question.helpText,
        options: question.options
      }))
  })),
  questions: (state.questions || [])
    .filter(question => !question.sectionId)
    .map(question => ({
      id: question.id,
      type: question.type,
      title: question.label,
      required: question.required,
      placeholder: question.placeholder,
      helpText: question.helpText,
      options: question.options
    })),
  logicRules: state.logicRules || []
});

export const normalizeEditedForm = (aiData, state) => {
  const existingSections = state.sections || [];
  const existingQuestions = state.questions || [];
  const existingRules = state.logicRules || [];
  const usedSectionIds = new Set();
  const usedQuestionIds = new Set();
  const questionIdAliases = new Map();

  const resolveSection = (section) => {
    const byId = existingSections.find(item => item.id === section.id && !usedSectionIds.has(item.id));
    const byTitle = existingSections.find(item =>
      normalizeText(item.title) === normalizeText(section.title) && !usedSectionIds.has(item.id)
    );
    const existing = byId || byTitle;
    const id = existing?.id || uuidv4();
    usedSectionIds.add(id);
    return {
      id,
      title: section.title ?? existing?.title ?? 'New Section',
      description: section.description ?? existing?.description ?? '',
      questions: []
    };
  };

  const sectionPayload = Array.isArray(aiData.sections)
    ? aiData.sections
    : existingSections.map(section => ({
        ...section,
        questions: existingQuestions
          .filter(question => question.sectionId === section.id)
          .map(question => ({ ...question, title: question.label }))
      }));
  const sections = sectionPayload.map(resolveSection);

  const resolveQuestion = (question, sectionId = null) => {
    const label = question.title ?? question.label;
    const byId = existingQuestions.find(item => item.id === question.id && !usedQuestionIds.has(item.id));
    const byLabel = existingQuestions.find(item =>
      normalizeText(item.label) === normalizeText(label) &&
      (!question.type || item.type === question.type) &&
      !usedQuestionIds.has(item.id)
    );
    const existing = byId || byLabel;
    const id = existing?.id || uuidv4();
    usedQuestionIds.add(id);
    if (question.id) questionIdAliases.set(question.id, id);

    return {
      ...existing,
      id,
      sectionId,
      type: question.type || existing?.type || 'short-text',
      label: label ?? existing?.label ?? 'Untitled Question',
      required: question.required ?? existing?.required ?? false,
      placeholder: question.placeholder ?? existing?.placeholder ?? '',
      helpText: question.helpText ?? existing?.helpText ?? '',
      options: Array.isArray(question.options)
        ? question.options
        : (existing?.options || []),
      validation: {
        min: null,
        max: null,
        pattern: null,
        ...(existing?.validation || {}),
        ...(question.validation || {})
      }
    };
  };

  let questions;
  if (Array.isArray(aiData.sections) || Array.isArray(aiData.questions)) {
    const sectionQuestions = sectionPayload.flatMap((section, index) =>
      (section.questions || []).map(question => resolveQuestion(question, sections[index].id))
    );
    const loosePayload = Array.isArray(aiData.questions)
      ? aiData.questions
      : existingQuestions
          .filter(question => !question.sectionId)
          .map(question => ({ ...question, title: question.label }));
    const looseQuestions = loosePayload.map(question => resolveQuestion(question, null));
    questions = [...sectionQuestions, ...looseQuestions];
  } else {
    questions = existingQuestions;
  }

  const questionIds = new Set(questions.map(question => question.id));
  const questionsByTitle = new Map();
  questions.forEach(question => {
    const key = normalizeText(question.label);
    if (!questionsByTitle.has(key)) questionsByTitle.set(key, question.id);
  });
  const resolveQuestionId = (id, title) =>
    (questionIds.has(id) && id) ||
    questionIdAliases.get(id) ||
    questionsByTitle.get(normalizeText(title)) ||
    null;

  const rulePayload = Array.isArray(aiData.logicRules) ? aiData.logicRules : existingRules;
  const logicRules = rulePayload.map(rule => {
    const existingRule = existingRules.find(item => item.id === rule.id) ||
      existingRules.find(item => normalizeText(item.name) === normalizeText(rule.name));
    const conditions = (rule.conditions || []).map(condition => {
      const questionId = resolveQuestionId(condition.questionId, condition.questionTitle);
      return questionId ? {
        ...condition,
        id: condition.id || uuidv4(),
        questionId,
        operator: condition.operator || 'equals',
        value: condition.value ?? ''
      } : null;
    }).filter(Boolean);

    const actions = (rule.actions || []).map(action => {
      if (action.type === 'skip_to') {
        const targetQuestionId = resolveQuestionId(action.targetQuestionId, action.targetQuestionTitle);
        if (!targetQuestionId || !conditions[0]?.questionId) return null;
        return {
          id: action.id || uuidv4(),
          type: action.type,
          targetQuestionId,
          fromQuestionId: conditions[0].questionId
        };
      }

      const idReferences = action.targetQuestionIds || [];
      const titleReferences = action.targetQuestionTitles || [];
      const targetQuestionIds = [
        ...idReferences.map(id => resolveQuestionId(id, null)),
        ...titleReferences.map(title => resolveQuestionId(null, title))
      ].filter((id, index, all) => id && all.indexOf(id) === index);
      if (!targetQuestionIds.length) return null;
      return { id: action.id || uuidv4(), type: action.type, targetQuestionIds };
    }).filter(Boolean);

    if (!conditions.length || !actions.length) return null;
    return {
      id: existingRule?.id || uuidv4(),
      name: rule.name || existingRule?.name || 'Fomzy Rule',
      logicType: rule.logicType || existingRule?.logicType || 'AND',
      conditions,
      actions,
      active: rule.active ?? existingRule?.active ?? true
    };
  }).filter(Boolean);

  return {
    title: aiData.title ?? state.title,
    description: aiData.description ?? state.description,
    theme: aiData.theme || state.theme,
    sections,
    questions,
    logicRules,
    settings: {
      ...state.settings,
      ...(aiData.settings || {})
    },
    style: {
      ...state.style,
      ...(aiData.style || {}),
      fontFamily: aiData.fontFamily || aiData.style?.fontFamily || state.style?.fontFamily || 'poppins'
    }
  };
};

const defaultFormState = {
  id: null,
  draftId: null, // Track the draft ID separately from form ID
  title: 'Untitled Form',
  description: '',
  theme: 'blue',
  logoUrl: '',
  logoPath: '',
  sections: [],
  questions: [],
  logicRules: [], // Conditional logic rules
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

// Helper to get form state snapshot for history
const getFormSnapshot = (state) => ({
  title: state.title,
  description: state.description,
  theme: state.theme,
  sections: JSON.parse(JSON.stringify(state.sections)),
  questions: JSON.parse(JSON.stringify(state.questions)),
  logicRules: JSON.parse(JSON.stringify(state.logicRules || [])),
  settings: { ...state.settings },
  style: { ...state.style }
});

export const useFormBuilderStore = create((set, get) => ({
  ...defaultFormState,
  
  currentQuestionIndex: null,
  isDirty: false,
  isSaving: false,
  isGenerating: false,
  lastSavedAt: null, // Track when the form was last saved
  
  // Undo/Redo history
  history: [],
  historyIndex: -1,
  
  // Save current state to history (call before making changes)
  saveToHistory: () => {
    const state = get();
    const snapshot = getFormSnapshot(state);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }
    
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },
  
  // Undo action
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return false;
    
    const newIndex = state.historyIndex - 1;
    const snapshot = state.history[newIndex];
    
    set({
      ...snapshot,
      historyIndex: newIndex,
      isDirty: true
    });
    return true;
  },
  
  // Redo action
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return false;
    
    const newIndex = state.historyIndex + 1;
    const snapshot = state.history[newIndex];
    
    set({
      ...snapshot,
      historyIndex: newIndex,
      isDirty: true
    });
    return true;
  },
  
  // Check if can undo/redo
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  
  // Clear history (on form init/reset)
  clearHistory: () => set({ history: [], historyIndex: -1 }),

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
      set({ ...mergedData, isDirty: false, lastSavedAt: new Date(), history: [], historyIndex: -1 });
      // Save initial state to history
      const initialSnapshot = getFormSnapshot(mergedData);
      set({ history: [initialSnapshot], historyIndex: 0 });
    } else {
      set({ ...defaultFormState, isDirty: false, draftId: null, lastSavedAt: null, history: [], historyIndex: -1 });
      // Save initial state to history
      const initialSnapshot = getFormSnapshot(defaultFormState);
      set({ history: [initialSnapshot], historyIndex: 0 });
    }
  },

  // Set draft ID
  setDraftId: (draftId) => set({ draftId }),

  // Mark as saved with timestamp
  markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

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
    // Save to history before change
    get().saveToHistory();
    
    // Track question added
    trackQuestionAdded(type);
    
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
  deleteQuestion: (questionId) => {
    // Save to history before change
    get().saveToHistory();
    
    set((state) => {
      const question = state.questions.find(q => q.id === questionId);
      if (question) trackQuestionDeleted(question.type);
      
      return {
        questions: state.questions.filter(q => q.id !== questionId),
        logicRules: (state.logicRules || []).map((rule) => {
          const conditions = (rule.conditions || []).filter(
            (condition) => condition.questionId !== questionId
          );
          const actions = (rule.actions || []).map((action) => ({
            ...action,
            targetQuestionId:
              action.targetQuestionId === questionId ? '' : action.targetQuestionId,
            fromQuestionId:
              action.fromQuestionId === questionId ? '' : action.fromQuestionId,
            targetQuestionIds: (action.targetQuestionIds || []).filter(
              (targetId) => targetId !== questionId
            )
          })).filter((action) =>
            action.targetQuestionId || action.targetQuestionIds?.length
          );

          return { ...rule, conditions, actions };
        }).filter((rule) =>
          rule.conditions.length > 0 && rule.actions.some((action) =>
            action.targetQuestionId || action.targetQuestionIds?.length
          )
        ),
        isDirty: true
      };
    });
  },

  // Set all questions (e.g., from a template)
  setQuestions: (questions) => {
    get().saveToHistory();
    set({ questions, isDirty: true });
  },

  // Reorder questions
  reorderQuestions: (startIndex, endIndex) => {
    // Save to history before change
    get().saveToHistory();
    
    set((state) => {
      const result = Array.from(state.questions);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      return { questions: result, isDirty: true };
    });
  },

  // Duplicate a question
  duplicateQuestion: (questionId) => {
    // Save to history before change
    get().saveToHistory();
    
    set((state) => {
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
    });
  },

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
  updateOption: (questionId, optionIndex, newText) => set((state) => {
    const question = state.questions.find(q => q.id === questionId);
    const previousText = question?.options?.[optionIndex];

    return {
      questions: state.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) => idx === optionIndex ? newText : opt)
            }
          : q
      ),
      logicRules: (state.logicRules || []).map(rule => ({
        ...rule,
        conditions: (rule.conditions || []).map(condition =>
          condition.questionId === questionId && condition.value === previousText
            ? { ...condition, value: newText }
            : condition
        )
      })),
      isDirty: true
    };
  }),

  // Delete an option
  deleteOption: (questionId, optionIndex) => set((state) => {
    const question = state.questions.find(q => q.id === questionId);
    const deletedText = question?.options?.[optionIndex];

    return {
      questions: state.questions.map(q =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q
      ),
      logicRules: (state.logicRules || []).map(rule => ({
        ...rule,
        conditions: (rule.conditions || []).map(condition =>
          condition.questionId === questionId && condition.value === deletedText
            ? { ...condition, value: '' }
            : condition
        )
      })),
      isDirty: true
    };
  }),

  // Update settings
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates },
    isDirty: true
  })),

  // Logic rules management
  updateLogicRules: (logicRules) => {
    get().saveToHistory();
    set({ logicRules, isDirty: true });
  },

  // Set current question
  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  // Save state
  setSaving: (isSaving) => set({ isSaving }),

  // Reset form
  resetForm: () => set({ ...defaultFormState, currentQuestionIndex: null, isDirty: false, draftId: null, lastSavedAt: null }),

  // Section management
  addSection: (title = 'New Section') => {
    // Track section added
    trackSectionAdded();
    
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
      logicRules: state.logicRules || [],
      settings: state.settings,
      style: state.style
    };
  },

  // Check AI usage limit before generation
  checkAILimit: (isAuthenticated) => {
    return checkAIUsageLimit(isAuthenticated);
  },

  // AI Generation
  generateForm: async (prompt, isAuthenticated = false) => {
    // Check usage limit first
    const limitCheck = checkAIUsageLimit(isAuthenticated);
    if (!limitCheck.allowed) {
      set({ isGenerating: false });
      trackAILimitReached(isAuthenticated);
      return {
        success: false,
        error: 'LIMIT_REACHED',
        limitInfo: limitCheck
      };
    }

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

      // Handle font family from AI
      const fontFamily = aiData.fontFamily || 'poppins';

      // Function to generate unique IDs and map logic
      const generatedRules = [];
      if (aiData.logicRules && Array.isArray(aiData.logicRules)) {
        // Create label -> ID map
        const labelToIdMap = {};
        newQuestions.forEach(q => {
          if (q.label) {
            labelToIdMap[q.label.trim().toLowerCase()] = q.id;
          }
        });

        aiData.logicRules.forEach(rule => {
          const newConditions = (rule.conditions || []).map(cond => {
            const qId = labelToIdMap[cond.questionTitle?.trim().toLowerCase()];
            if (!qId) return null;
            return {
              id: uuidv4(),
              questionId: qId,
              operator: cond.operator,
              value: cond.value
            };
          }).filter(Boolean);

          const newActions = (rule.actions || []).map(act => {
            const targetIds = (act.targetQuestionTitles || []).map(t => labelToIdMap[t?.trim().toLowerCase()]).filter(Boolean);
            const singleTargetId = act.targetQuestionTitle ? labelToIdMap[act.targetQuestionTitle.trim().toLowerCase()] : null;

            if (act.type === 'skip_to') {
              if (!singleTargetId) return null;
              // For skip logic, we need to know which question we are skipping FROM.
              // We assume it's the question in the first condition.
              const fromQId = newConditions[0]?.questionId;
              if (!fromQId) return null;

              return {
                id: uuidv4(),
                type: act.type,
                targetQuestionId: singleTargetId,
                fromQuestionId: fromQId
              };
            }

            if (targetIds.length === 0) return null;

            return {
              id: uuidv4(),
              type: act.type,
              targetQuestionIds: targetIds
            };
          }).filter(Boolean);

          if (newConditions.length > 0 && newActions.length > 0) {
            generatedRules.push({
              id: uuidv4(),
              name: rule.name || 'AI Rule',
              logicType: rule.logicType || 'AND',
              conditions: newConditions,
              actions: newActions,
              active: true
            });
          }
        });
      }

      set({
        title: aiData.title || 'AI Generated Form',
        description: aiData.description || '',
        questions: newQuestions,
        sections,
        logicRules: generatedRules,
        theme,
        style: {
          ...get().style,
          fontFamily
        },
        isDirty: true,
        isGenerating: false
      });
      
      // Record usage for anonymous users
      recordAIUsage(isAuthenticated);
      
      // Track successful AI generation
      trackAIFormGenerated(true, newQuestions.length, isAuthenticated);
      
      return {
        success: true,
        limitInfo: checkAIUsageLimit(isAuthenticated)
      };
    } catch (error) {
      console.error("Store: AI Generation failed", error);
      set({ isGenerating: false });
      
      // Track failed AI generation
      trackAIFormGenerated(false, 0, isAuthenticated);
      
      return {
        success: false,
        error: 'GENERATION_FAILED',
        message: error.message
      };
    }
  },

  // Edit the current form with Fomzy while preserving stable IDs and settings.
  editForm: async (instruction, isAuthenticated = false) => {
    const limitCheck = checkAIUsageLimit(isAuthenticated);
    if (!limitCheck.allowed) {
      set({ isGenerating: false });
      trackAILimitReached(isAuthenticated);
      return {
        success: false,
        error: 'LIMIT_REACHED',
        limitInfo: limitCheck
      };
    }

    set({ isGenerating: true });
    try {
      const currentState = get();
      const aiData = await editFormFromPrompt(
        serializeFormForAI(currentState),
        instruction
      );
      const editedForm = normalizeEditedForm(aiData, currentState);

      get().saveToHistory();
      set({
        ...editedForm,
        currentQuestionIndex: null,
        isDirty: true,
        isGenerating: false
      });
      get().saveToHistory();

      recordAIUsage(isAuthenticated);
      trackAIFormGenerated(true, editedForm.questions.length, isAuthenticated);

      return {
        success: true,
        limitInfo: checkAIUsageLimit(isAuthenticated)
      };
    } catch (error) {
      console.error('Store: AI form edit failed', error);
      set({ isGenerating: false });
      trackAIFormGenerated(false, 0, isAuthenticated);
      return {
        success: false,
        error: 'EDIT_FAILED',
        message: error.message
      };
    }
  }
}));
