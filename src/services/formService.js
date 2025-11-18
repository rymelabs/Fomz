import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Project ID for debugging/diagnostics. Avoid logging secrets.
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const FORMS_COLLECTION = 'forms';

const generateShareId = () => {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
};

/**
 * Create a new form
 */
export const createForm = async (formData, userId) => {
  try {
    const formDoc = {
      ...formData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      shareId: formData.shareId || generateShareId(),
    };
    
    const docRef = await addDoc(collection(db, FORMS_COLLECTION), formDoc);
    return { id: docRef.id, ...formDoc };
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
};

/**
 * Get a form by its shareId
 */
export const getFormByShareId = async (shareId) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.debug('getFormByShareId: projectId=', PROJECT_ID, 'shareId=', shareId);
    }
    // Prefer published forms (store uses settings.published) to avoid exposing drafts
    let q = query(
      collection(db, FORMS_COLLECTION),
      where('shareId', '==', shareId),
      where('settings.published', '==', true),
      orderBy('createdAt', 'desc')
    );
    if (process.env.NODE_ENV === 'development') {
      console.debug('getFormByShareId: queryFilters= shareId,+settings.published');
    }
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Fallback to legacy root `published` flag to support older docs
      const fallbackQuery = query(
        collection(db, FORMS_COLLECTION),
        where('shareId', '==', shareId),
        where('published', '==', true),
        orderBy('createdAt', 'desc')
      );
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFormByShareId: using fallback query (root published)');
      }
      const fbSnapshot = await getDocs(fallbackQuery);
      if (fbSnapshot.empty) return null;
      const fbDoc = fbSnapshot.docs[0];
      return { id: fbDoc.id, ...fbDoc.data() };
    }
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error getting form by shareId:', error);
    // Wrap permission errors with a clearer message for debugging and UX
    if (error?.code === 'permission-denied' || (error?.message || '').toLowerCase().includes('permission')) {
      const friendly = new Error('Insufficient Firestore permissions to resolve share link. Please ensure public reads are allowed for published forms.');
      friendly.code = 'permission-denied';
      throw friendly;
    }
    throw error;
  }
};

/**
 * Publish a form: set published=true and ensure shareId set.
 */
export const publishForm = async (formId, publish = true) => {
  try {
    const formDocRef = doc(db, FORMS_COLLECTION, formId);
    const docSnap = await getDoc(formDocRef);
    if (!docSnap.exists()) throw new Error('Form not found');

    const data = docSnap.data();
    const updates = {};
    const newShareId = data.shareId || generateShareId();
    updates['shareId'] = newShareId;
    updates['settings'] = { ...(data.settings || {}), published: publish };
    updates['updatedAt'] = serverTimestamp();

    await updateDoc(formDocRef, updates);
    return { id: formId, ...updates };
  } catch (error) {
    console.error('Error publishing form:', error);
    throw error;
  }
};

/**
 * Get a single form by ID
 */
export const getForm = async (formId) => {
  try {
    const docRef = doc(db, FORMS_COLLECTION, formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Form not found');
    }
  } catch (error) {
    console.error('Error getting form:', error);
    throw error;
  }
};

/**
 * Get all forms for a user
 */
export const getUserForms = async (userId) => {
  try {
    const q = query(
      collection(db, FORMS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const forms = [];
    
    querySnapshot.forEach((doc) => {
      forms.push({ id: doc.id, ...doc.data() });
    });
    
    return forms;
  } catch (error) {
    console.error('Error getting user forms:', error);
    // Improve the error message for permission issues to aid debugging in dev
    if (error?.code === 'permission-denied' || (error?.message || '').toLowerCase().includes('permission')) {
      const friendly = new Error('Insufficient Firestore permissions to retrieve forms. Please update your Firestore rules to allow reads for this user (see README or Firebase console).');
      friendly.code = 'permission-denied';
      throw friendly;
    }
    throw error;
  }
};

/**
 * Update a form
 */
export const updateForm = async (formId, updates) => {
  try {
    const docRef = doc(db, FORMS_COLLECTION, formId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { id: formId, ...updates };
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;
  }
};

/**
 * Delete a form
 */
export const deleteForm = async (formId) => {
  try {
    const docRef = doc(db, FORMS_COLLECTION, formId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting form:', error);
    throw error;
  }
};

/**
 * Duplicate a form
 */
export const duplicateForm = async (formId, userId) => {
  try {
    const originalForm = await getForm(formId);
    const { id, createdAt, updatedAt, ...formData } = originalForm;
    
    const newForm = {
      ...formData,
      title: `${formData.title} (Copy)`,
      createdBy: userId,
    };
    
    return await createForm(newForm, userId);
  } catch (error) {
    console.error('Error duplicating form:', error);
    throw error;
  }
};
