import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useFormBuilderStore } from '../store/formBuilderStore';
import { createForm, updateForm, publishForm as publishFormService } from '../services/formService';
import { 
  saveDraft, 
  saveLocalDraft, 
  getLocalDraft, 
  clearLocalDraft, 
  deleteDraft,
  migrateLocalDraftToFirebase,
  saveDraftId,
  getSavedDraftId
} from '../services/draftService';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';

// Debounce delay for auto-save (in milliseconds)
const AUTO_SAVE_DELAY = 1500;

export const useFormBuilder = () => {
  const store = useFormBuilderStore();
  const { user } = useUserStore();
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const autoSaveTimerRef = useRef(null);
  const lastUserRef = useRef(user);
  const draftIdRestoredRef = useRef(false);

  useEffect(() => {
    if (store.theme && store.theme !== currentTheme) {
      setTheme(store.theme);
    }
  }, [store.theme, currentTheme, setTheme]);

  // Restore draftId from localStorage on mount (for logged-in users)
  useEffect(() => {
    if (user && !draftIdRestoredRef.current && !store.draftId && !store.id) {
      const savedDraftId = getSavedDraftId();
      if (savedDraftId) {
        store.setDraftId(savedDraftId);
      }
      draftIdRestoredRef.current = true;
    }
  }, [user, store]);

  // Persist draftId to localStorage when it changes
  useEffect(() => {
    if (user && store.draftId) {
      saveDraftId(store.draftId);
    }
  }, [user, store.draftId]);

  // Handle user login - migrate local draft to Firebase
  useEffect(() => {
    const migrateOnLogin = async () => {
      if (user && !lastUserRef.current) {
        // User just logged in - check for local draft to migrate
        try {
          const migrated = await migrateLocalDraftToFirebase(user.uid);
          if (migrated) {
            store.setDraftId(migrated.id);
            saveDraftId(migrated.id);
            console.log('Local draft migrated to Firebase:', migrated.id);
          }
        } catch (error) {
          console.error('Error migrating local draft:', error);
        }
      }
      lastUserRef.current = user;
    };
    
    migrateOnLogin();
  }, [user, store]);

  // Auto-save to drafts when form changes (for new forms)
  const saveToDraft = useCallback(async () => {
    const payload = store.getFormData();
    
    // Skip if this is an existing form (will be handled by autoSaveForm)
    if (store.id) {
      return;
    }

    // Don't save empty forms
    if (!payload.title?.trim() && !payload.description?.trim() && payload.questions.length === 0) {
      return;
    }

    if (user) {
      // Logged in - save to Firebase
      try {
        const saved = await saveDraft(payload, user.uid, store.draftId);
        store.setDraftId(saved.id);
        saveDraftId(saved.id); // Persist to localStorage
        store.markSaved();
      } catch (error) {
        console.error('Error auto-saving draft to Firebase:', error);
      }
    } else {
      // Not logged in - save to localStorage
      saveLocalDraft(payload);
      store.markSaved();
    }
  }, [store, user]);

  // Auto-save existing forms when they change
  const autoSaveForm = useCallback(async () => {
    if (!user || !store.id) return;
    
    const payload = store.getFormData();
    try {
      await updateForm(store.id, payload);
      store.markSaved();
    } catch (error) {
      console.error('Error auto-saving form:', error);
    }
  }, [store, user]);

  // Debounced auto-save when form changes
  useEffect(() => {
    if (store.isDirty) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timer - save to drafts or forms depending on whether it's a new or existing form
      autoSaveTimerRef.current = setTimeout(() => {
        if (store.id) {
          autoSaveForm(); // Existing form - save to forms collection
        } else {
          saveToDraft(); // New form - save to drafts collection
        }
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [store.isDirty, store.id, saveToDraft, autoSaveForm]);

  // Load local draft on mount (for non-logged-in users)
  const loadLocalDraft = useCallback(() => {
    const localDraft = getLocalDraft();
    if (localDraft) {
      store.initForm(localDraft);
      return true;
    }
    return false;
  }, [store]);

  const saveForm = useCallback(async () => {
    if (!user) {
      throw new Error('Must be signed in to save form');
    }

    const payload = store.getFormData();
    store.setSaving(true);

    try {
      let formId = store.id;
      if (store.id) {
        const updated = await updateForm(store.id, payload);
        if (updated.shareId) store.updateFormInfo({ shareId: updated.shareId });
      } else {
        const doc = await createForm(payload, user.uid);
        formId = doc.id;
        store.updateFormInfo({ id: doc.id });
        if (doc.shareId) store.updateFormInfo({ shareId: doc.shareId });
        
        // Delete the draft now that form is saved
        if (store.draftId) {
          try {
            await deleteDraft(store.draftId);
            store.setDraftId(null);
            saveDraftId(null); // Clear persisted draftId
          } catch (e) {
            console.error('Error deleting draft after save:', e);
          }
        }
        
        // Clear local draft as well
        clearLocalDraft();
      }
      store.markSaved();
      return formId;
    } finally {
      store.setSaving(false);
    }
  }, [store, user]);

  const publishForm = useCallback(async () => {
    if (!user) {
      throw new Error('Must be signed in to publish form');
    }
    
    let formId = store.id;
    if (!formId) {
      formId = await saveForm();
    }

    const result = await publishFormService(formId, true);
    if (result.shareId) store.updateFormInfo({ shareId: result.shareId });
    store.updateSettings({ published: true });
    
    // Delete draft after publishing
    if (store.draftId) {
      try {
        await deleteDraft(store.draftId);
        store.setDraftId(null);
        saveDraftId(null); // Clear persisted draftId
      } catch (e) {
        console.error('Error deleting draft after publish:', e);
      }
    }
    
    // Clear local draft
    clearLocalDraft();
    
    return result;
  }, [store, saveForm, user]);

  const addQuestionOfType = useCallback((type) => store.addQuestion(type), [store]);

  return useMemo(() => ({
    ...store,
    saveForm,
    addQuestionOfType,
    publishForm,
    saveToDraft,
    loadLocalDraft
  }), [store, saveForm, addQuestionOfType, publishForm, saveToDraft, loadLocalDraft]);
};

export default useFormBuilder;
