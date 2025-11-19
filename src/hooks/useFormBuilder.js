import { useMemo, useCallback, useEffect } from 'react';
import { useFormBuilderStore } from '../store/formBuilderStore';
import { createForm, updateForm, publishForm as publishFormService } from '../services/formService';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';

export const useFormBuilder = () => {
  const store = useFormBuilderStore();
  const { user } = useUserStore();
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    if (store.theme && store.theme !== currentTheme) {
      setTheme(store.theme);
    }
  }, [store.theme, currentTheme, setTheme]);

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
    return result;
  }, [store, saveForm, user]);

  const addQuestionOfType = useCallback((type) => store.addQuestion(type), [store]);

  return useMemo(() => ({
    ...store,
    saveForm,
    addQuestionOfType,
    publishForm
  }), [store, saveForm, addQuestionOfType, publishForm]);
};

export default useFormBuilder;
