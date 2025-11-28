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
  serverTimestamp,
  getCountFromServer,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  publishFormLocally, 
  getLocalFormByShareId, 
  getLocalFormById,
  updateLocalForm,
  deleteLocalForm
} from './localFormService';

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
 * Get a form by its shareId (handles both cloud and local forms)
 */
export const getFormByShareId = async (shareId) => {
  try {
    // First, check if it's a local form
    const localForm = getLocalFormByShareId(shareId);
    if (localForm) {
      return localForm;
    }
    
    // Otherwise, query Firestore
    const q = query(
      collection(db, FORMS_COLLECTION),
      where('shareId', '==', shareId),
      where('settings.published', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting form by shareId:', error);
    
    // Check for index error
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      console.error('Missing Firestore index. Please create an index for forms: shareId ASC, settings.published ASC');
    }

    // Wrap permission errors with a clearer message for debugging and UX
    if (error?.code === 'permission-denied' || (error?.message || '').toLowerCase().includes('permission')) {
      const friendly = new Error('Insufficient Firestore permissions. The form might not be published.');
      friendly.code = 'permission-denied';
      throw friendly;
    }
    throw error;
  }
};

/**
 * Publish a form: set published=true and ensure shareId set.
 * For local forms (anonymous users), publish to localStorage
 * For cloud forms (authenticated users), publish to Firestore
 */
export const publishForm = async (formId, publish = true, isLocal = false) => {
  try {
    // Handle local form publishing
    if (isLocal || formId.startsWith('local_')) {
      const localForm = getLocalFormById(formId);
      if (!localForm) throw new Error('Local form not found');
      
      const updates = {
        settings: { ...localForm.settings, published: publish },
        shareId: localForm.shareId || generateShareId(),
        publishedAt: publish ? new Date().toISOString() : localForm.publishedAt
      };
      
      return updateLocalForm(formId, updates);
    }
    
    // Handle Firestore form publishing
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
 * Get a single form by ID (handles both local and cloud)
 */
export const getForm = async (formId) => {
  try {
    // Check if it's a local form
    if (formId.startsWith('local_')) {
      const localForm = getLocalFormById(formId);
      if (localForm) return localForm;
      throw new Error('Local form not found');
    }
    
    // Otherwise query Firestore
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
    
    const forms = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const formData = { id: docSnapshot.id, ...docSnapshot.data() };
      
      try {
        const coll = collection(db, FORMS_COLLECTION, docSnapshot.id, 'responses');
        const snapshot = await getCountFromServer(coll);
        formData.responses = snapshot.data().count;
      } catch (err) {
        // console.warn(`Failed to get response count for form ${docSnapshot.id}`, err);
        formData.responses = 0;
      }
      
      return formData;
    }));
    
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
