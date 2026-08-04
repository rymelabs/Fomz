import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  getCountFromServer,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  saveLocalResponse,
  getLocalResponses,
  getLocalResponseById,
  getLocalFormByShareId,
  updateLocalResponse
} from './localFormService';
import { createResponseNotification } from './notificationService';

/**
 * Submit a form response (handles both local and cloud forms)
 */
export const submitResponse = async (formIdOrShareId, responseData, userId = null) => {
  try {
    // Check if it's a local form by shareId first
    const localForm = getLocalFormByShareId(formIdOrShareId);
    if (localForm) {
      // Save response locally
      return saveLocalResponse(localForm.shareId, {
        answers: responseData.answers,
        submitterId: userId,
        metadata: {
          userAgent: navigator.userAgent,
          ...responseData.metadata
        }
      });
    }
    
    // Get the form to find the owner and title
    const formRef = doc(db, 'forms', formIdOrShareId);
    const formSnap = await getDoc(formRef);
    const formData = formSnap.exists() ? formSnap.data() : null;
    
    // Save response to Firestore
    const responseDoc = {
      formId: formIdOrShareId,
      answers: responseData.answers,
      submittedAt: serverTimestamp(),
      submitterId: userId,
      metadata: {
        userAgent: navigator.userAgent,
        ...responseData.metadata
      }
    };

    const docRef = await addDoc(
      collection(db, 'forms', formIdOrShareId, 'responses'),
      responseDoc
    );

    // Create notification for form owner (fire and forget - don't block response)
    if (formData?.createdBy) {
      createResponseNotification(formData.createdBy, formIdOrShareId, formData.title)
        .catch(err => console.error('Failed to create response notification:', err));
    }

    return { id: docRef.id, ...responseDoc };
  } catch (error) {
    console.error('Error submitting response:', error);
    throw error;
  }
};

/**
 * Update a response (for form creators to edit/normalize responses)
 */
export const updateResponse = async (formId, responseId, updates) => {
  try {
    // Check if it's a local form
    if (formId.startsWith('local_')) {
      return updateLocalResponse(formId, responseId, updates);
    }
    
    // Update in Firestore
    const responseRef = doc(db, 'forms', formId, 'responses', responseId);
    await updateDoc(responseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { id: responseId, ...updates };
  } catch (error) {
    console.error('Error updating response:', error);
    throw error;
  }
};

/**
 * Delete a single response
 */
export const deleteResponse = async (formId, responseId) => {
  try {
    // Check if it's a local form
    if (formId.startsWith('local_')) {
      // Get local responses and filter out the deleted one
      const localResponses = getLocalResponses(formId);
      const updatedResponses = localResponses.filter(r => r.id !== responseId);
      localStorage.setItem(`fomz_responses_${formId}`, JSON.stringify(updatedResponses));
      return { success: true };
    }
    
    // Delete from Firestore
    const responseRef = doc(db, 'forms', formId, 'responses', responseId);
    await deleteDoc(responseRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting response:', error);
    throw error;
  }
};

/**
 * Delete multiple responses at once
 */
export const deleteMultipleResponses = async (formId, responseIds) => {
  try {
    const results = await Promise.allSettled(
      responseIds.map(id => deleteResponse(formId, id))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return { 
      success: failed === 0,
      deleted: successful,
      failed: failed
    };
  } catch (error) {
    console.error('Error deleting multiple responses:', error);
    throw error;
  }
};

/**
 * Get all responses for a form (handles both local and cloud forms)
 */
export const getFormResponses = async (formIdOrShareId) => {
  try {
    // Check if it's a local form
    const localForm = getLocalFormByShareId(formIdOrShareId);
    if (localForm) {
      return getLocalResponses(localForm.shareId);
    }
    
    // Otherwise, query Firestore
    const q = query(
      collection(db, 'forms', formIdOrShareId, 'responses'),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const responses = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      responses.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt instanceof Timestamp 
          ? data.submittedAt.toDate() 
          : data.submittedAt
      });
    });

    return responses;
  } catch (error) {
    console.error('Error getting form responses:', error);
    throw error;
  }
};

/**
 * Get a single response
 */
export const getResponse = async (formId, responseId) => {
  try {
    const docRef = doc(db, 'forms', formId, 'responses', responseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt instanceof Timestamp 
          ? data.submittedAt.toDate() 
          : data.submittedAt
      };
    } else {
      throw new Error('Response not found');
    }
  } catch (error) {
    console.error('Error getting response:', error);
    throw error;
  }
};

/**
 * Get the count of responses for a form
 */
export const getResponseCount = async (formId) => {
  try {
    const coll = collection(db, 'forms', formId, 'responses');
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting response count:', error);
    return 0;
  }
};

/**
 * Smart answer matching with type inference fallback
 * Priority: 1) exact questionId, 2) type-based matching, 3) positional fallback
 */
const findAnswerForQuestion = (response, question, questionIndex, questions) => {
  if (!response?.answers || !Array.isArray(response.answers)) return null;
  
  // First try exact questionId match
  const exactMatch = response.answers.find(a => a.questionId === question.id);
  if (exactMatch) return exactMatch;
  
  // Build set of indices already matched by ID
  const usedIndices = new Set();
  questions.forEach(q => {
    const idx = response.answers.findIndex(a => a.questionId === q.id);
    if (idx !== -1) usedIndices.add(idx);
  });
  
  // Get unmatched answers
  const unmatchedAnswers = response.answers
    .map((a, idx) => ({ ...a, originalIndex: idx }))
    .filter((_, idx) => !usedIndices.has(idx));
  
  if (unmatchedAnswers.length === 0) return null;
  
  // Type-based matching using value inference
  const sameTypeAnswers = unmatchedAnswers.filter(a => {
    if (question.type === 'email') {
      return typeof a.value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.value);
    }
    if (question.type === 'number' || question.type === 'rating') {
      return typeof a.value === 'number' || !isNaN(Number(a.value));
    }
    if (question.type === 'checkbox') {
      return Array.isArray(a.value);
    }
    return true;
  });
  
  if (sameTypeAnswers.length === 1) {
    return sameTypeAnswers[0];
  }
  
  // For specific types with multiple matches, use index among same-type questions
  if (sameTypeAnswers.length > 1) {
    const sameTypeQuestionIndices = questions
      .map((q, i) => q.type === question.type ? i : -1)
      .filter(i => i !== -1);
    const thisTypeIndex = sameTypeQuestionIndices.indexOf(questionIndex);
    if (thisTypeIndex !== -1 && sameTypeAnswers[thisTypeIndex]) {
      return sameTypeAnswers[thisTypeIndex];
    }
  }
  
  // Last resort: positional fallback
  const positionInUnmatched = questionIndex - usedIndices.size;
  if (positionInUnmatched >= 0 && unmatchedAnswers[positionInUnmatched]) {
    return unmatchedAnswers[positionInUnmatched];
  }
  
  return null;
};

/**
 * Analyze form responses
 */
export const analyzeResponses = (responses, questions) => {
  const analysis = {
    totalResponses: responses.length,
    questionAnalysis: {}
  };

  questions.forEach((question, qIdx) => {
    const questionResponses = responses.map(r => 
      findAnswerForQuestion(r, question, qIdx, questions)
    ).filter(Boolean);

    analysis.questionAnalysis[question.id] = {
      question: question.label,
      type: question.type,
      totalAnswers: questionResponses.length,
      data: analyzeQuestionType(question, questionResponses)
    };
  });

  return analysis;
};

/**
 * Helper to analyze different question types
 */
const analyzeQuestionType = (question, responses) => {
  switch (question.type) {
    case 'multiple-choice':
    case 'dropdown':
      return analyzeMultipleChoice(question.options, responses);
    
    case 'checkbox':
      return analyzeCheckbox(question.options, responses);
    
    case 'rating':
      return analyzeRating(responses);
    
    case 'number':
      return analyzeNumber(responses);
    
    default:
      return analyzeText(responses);
  }
};

const analyzeMultipleChoice = (options, responses) => {
  const counts = {};
  options.forEach(opt => counts[opt] = 0);
  
  responses.forEach(r => {
    if (r.value && counts.hasOwnProperty(r.value)) {
      counts[r.value]++;
    }
  });
  
  return {
    type: 'distribution',
    counts,
    percentage: Object.entries(counts).reduce((acc, [key, value]) => {
      acc[key] = responses.length ? ((value / responses.length) * 100).toFixed(1) : 0;
      return acc;
    }, {})
  };
};

const analyzeCheckbox = (options, responses) => {
  const counts = {};
  options.forEach(opt => counts[opt] = 0);
  
  responses.forEach(r => {
    if (Array.isArray(r.value)) {
      r.value.forEach(val => {
        if (counts.hasOwnProperty(val)) {
          counts[val]++;
        }
      });
    }
  });
  
  return {
    type: 'distribution',
    counts
  };
};

const analyzeRating = (responses) => {
  const ratings = responses.map(r => r.value).filter(Boolean);
  const sum = ratings.reduce((a, b) => a + b, 0);
  const avg = ratings.length ? (sum / ratings.length).toFixed(2) : 0;
  
  return {
    type: 'rating',
    average: avg,
    distribution: ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {})
  };
};

const analyzeNumber = (responses) => {
  const numbers = responses.map(r => parseFloat(r.value)).filter(n => !isNaN(n));
  
  if (numbers.length === 0) {
    return { type: 'number', min: 0, max: 0, average: 0 };
  }
  
  return {
    type: 'number',
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    average: (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2)
  };
};

const analyzeText = (responses) => {
  return {
    type: 'text',
    responses: responses.map(r => r.value).filter(Boolean)
  };
};

/**
 * Export responses to CSV
 */
export const exportToCSV = (responses, questions) => {
  const headers = ['Timestamp', ...questions.map(q => q.label)];
  const rows = responses.map(response => {
    const row = [new Date(response.submittedAt).toLocaleString()];
    
    questions.forEach((question, qIdx) => {
      // Use smart matching with type inference
      const answer = findAnswerForQuestion(response, question, qIdx, questions);
      const value = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '';
      row.push(value);
    });
    
    return row;
  });
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csv;
};

/**
 * Export responses to Excel (XLSX)
 */
export const exportToExcel = async (responses, questions, filename = 'responses') => {
  // Dynamically import xlsx to avoid loading it until needed
  const XLSX = await import('xlsx');
  
  const headers = ['Timestamp', 'Response ID', ...questions.map(q => q.label || 'Untitled Question')];
  const data = responses.map(response => {
    const row = [
      new Date(response.submittedAt).toLocaleString(),
      response.id
    ];
    
    questions.forEach((question, qIdx) => {
      // Use smart matching with type inference
      const answer = findAnswerForQuestion(response, question, qIdx, questions);
      const value = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '';
      row.push(value);
    });
    
    return row;
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_array ? 
    XLSX.utils.aoa_to_sheet([headers, ...data]) : 
    XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Auto-size columns
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...data.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Responses');
  
  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`);
  
  return { success: true, count: responses.length };
};
