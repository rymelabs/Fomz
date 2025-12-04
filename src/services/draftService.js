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
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

const DRAFTS_COLLECTION = 'drafts';
const LOCAL_STORAGE_KEY = 'fomz_draft';
const DRAFT_ID_KEY = 'fomz_draft_id';

/**
 * Save draft to localStorage (for non-logged-in users)
 */
export const saveLocalDraft = (formData) => {
  try {
    const draft = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error('Error saving local draft:', error);
    return false;
  }
};

/**
 * Get draft from localStorage
 */
export const getLocalDraft = () => {
  try {
    const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Error getting local draft:', error);
    return null;
  }
};

/**
 * Clear draft from localStorage
 */
export const clearLocalDraft = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(DRAFT_ID_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing local draft:', error);
    return false;
  }
};

/**
 * Save draft ID to localStorage (for persistence across page reloads)
 */
export const saveDraftId = (draftId) => {
  try {
    if (draftId) {
      localStorage.setItem(DRAFT_ID_KEY, draftId);
    } else {
      localStorage.removeItem(DRAFT_ID_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error saving draft ID:', error);
    return false;
  }
};

/**
 * Get saved draft ID from localStorage
 */
export const getSavedDraftId = () => {
  try {
    return localStorage.getItem(DRAFT_ID_KEY);
  } catch (error) {
    console.error('Error getting draft ID:', error);
    return null;
  }
};

/**
 * Check if there's a local draft
 */
export const hasLocalDraft = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Save draft to Firebase (for logged-in users)
 */
export const saveDraft = async (formData, userId, draftId = null) => {
  try {
    if (draftId) {
      // Check if the draft exists and belongs to this user
      const docRef = doc(db, DRAFTS_COLLECTION, draftId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().createdBy === userId) {
        // Update existing draft - don't include createdBy in update
        const updateData = {
          ...formData,
          updatedAt: serverTimestamp()
        };
        await updateDoc(docRef, updateData);
        return { id: draftId, ...updateData, createdBy: userId };
      } else {
        // Draft doesn't exist or belongs to different user - create new
        const draftData = {
          ...formData,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const newDocRef = await addDoc(collection(db, DRAFTS_COLLECTION), draftData);
        return { id: newDocRef.id, ...draftData };
      }
    } else {
      // Create new draft - include createdBy
      const draftData = {
        ...formData,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, DRAFTS_COLLECTION), draftData);
      return { id: docRef.id, ...draftData };
    }
  } catch (error) {
    console.error('Error saving draft to Firebase:', error);
    throw error;
  }
};

/**
 * Get a single draft by ID
 */
export const getDraft = async (draftId) => {
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, draftId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting draft:', error);
    throw error;
  }
};

/**
 * Get all drafts for a user
 */
export const getUserDrafts = async (userId) => {
  try {
    const q = query(
      collection(db, DRAFTS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const drafts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return drafts;
  } catch (error) {
    console.error('Error getting user drafts:', error);
    // Handle permission errors gracefully
    if (error?.code === 'permission-denied') {
      const friendly = new Error('Insufficient permissions to retrieve drafts.');
      friendly.code = 'permission-denied';
      throw friendly;
    }
    throw error;
  }
};

/**
 * Get count of drafts for a user
 */
export const getDraftCount = async (userId) => {
  try {
    const drafts = await getUserDrafts(userId);
    return drafts.length;
  } catch (error) {
    console.error('Error getting draft count:', error);
    return 0;
  }
};

/**
 * Delete a draft (checks ownership first)
 */
export const deleteDraft = async (draftId, userId = null) => {
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, draftId);
    
    // If userId provided, verify ownership first
    if (userId) {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // Draft already deleted, consider it a success
          return true;
        }
        if (docSnap.data().createdBy !== userId) {
          // Draft belongs to different user, just return success
          // (don't try to delete, don't throw error)
          console.warn('Draft belongs to different user, skipping delete');
          return true;
        }
      } catch (readError) {
        // Permission denied on read means we can't access this draft
        // Treat as success (draft doesn't belong to us or doesn't exist)
        if (readError?.code === 'permission-denied') {
          console.warn('Cannot read draft, may not exist or belong to user');
          return true;
        }
        throw readError;
      }
    }
    
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    // If permission denied, the draft might not belong to this user
    // or already be deleted - treat as success
    if (error?.code === 'permission-denied') {
      console.warn('Permission denied deleting draft, may not exist or belong to user');
      return true;
    }
    console.error('Error deleting draft:', error);
    throw error;
  }
};

/**
 * Migrate local draft to Firebase when user logs in
 */
export const migrateLocalDraftToFirebase = async (userId) => {
  try {
    const localDraft = getLocalDraft();
    if (!localDraft) return null;

    // Save to Firebase
    const savedDraft = await saveDraft(localDraft, userId);
    
    // Clear local storage
    clearLocalDraft();
    
    return savedDraft;
  } catch (error) {
    console.error('Error migrating local draft to Firebase:', error);
    throw error;
  }
};

/**
 * Convert draft to a published form (used when publishing)
 * This deletes the draft after the form is created
 */
export const convertDraftToForm = async (draftId, userId = null) => {
  try {
    // Get the draft data
    const draft = await getDraft(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Delete the draft
    await deleteDraft(draftId, userId);
    
    return draft;
  } catch (error) {
    console.error('Error converting draft to form:', error);
    throw error;
  }
};
