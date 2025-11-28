import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
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
  getLocalFormByShareId
} from './localFormService';

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
    
    // Otherwise, save to Firestore
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

    return { id: docRef.id, ...responseDoc };
  } catch (error) {
    console.error('Error submitting response:', error);
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
 * Analyze form responses
 */
export const analyzeResponses = (responses, questions) => {
  const analysis = {
    totalResponses: responses.length,
    questionAnalysis: {}
  };

  questions.forEach(question => {
    const questionResponses = responses.map(r => 
      r.answers.find(a => a.questionId === question.id)
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
    
    questions.forEach(question => {
      const answer = response.answers.find(a => a.questionId === question.id);
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
