/**
 * Local Form Service
 * Handles form storage in localStorage for anonymous users
 * Provides full CRUD operations and analytics for offline/local forms
 */

const LOCAL_FORMS_KEY = 'fomz_published_forms';
const LOCAL_RESPONSES_PREFIX = 'fomz_responses_';
const LOCAL_ANALYTICS_PREFIX = 'fomz_analytics_';
const LOCAL_STORAGE_QUOTA_WARNING = 0.8; // Warn at 80% capacity

/**
 * Generate a unique share ID for forms
 */
const generateShareId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

/**
 * Check localStorage usage and capacity
 * @returns {Object} { used, total, percentage, isNearLimit }
 */
export const checkStorageQuota = () => {
  try {
    // Estimate localStorage size (approximate)
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    const usedKB = (totalSize / 1024).toFixed(2);
    const totalKB = 5120; // Most browsers have ~5MB limit
    const percentage = (usedKB / totalKB) * 100;
    
    return {
      used: usedKB,
      total: totalKB,
      percentage: percentage.toFixed(2),
      isNearLimit: percentage >= (LOCAL_STORAGE_QUOTA_WARNING * 100)
    };
  } catch (error) {
    console.error('Error checking storage quota:', error);
    return { used: 0, total: 5120, percentage: 0, isNearLimit: false };
  }
};

/**
 * Publish a form locally (save to localStorage)
 * @param {Object} formData - The form data to publish
 * @returns {Object} Published form with local ID and metadata
 */
export const publishFormLocally = (formData) => {
  try {
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shareId = formData.shareId || generateShareId();
    
    const publishedForm = {
      ...formData,
      id: localId,
      shareId: shareId,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocal: true, // Flag to identify local-only forms
      responseCount: 0
    };
    
    const existingForms = getLocalPublishedForms();
    existingForms.push(publishedForm);
    
    localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(existingForms));
    
    return publishedForm;
  } catch (error) {
    console.error('Error publishing form locally:', error);
    throw new Error('Failed to publish form locally. Storage may be full.');
  }
};

/**
 * Get all locally published forms
 * @returns {Array} Array of published forms
 */
export const getLocalPublishedForms = () => {
  try {
    const forms = localStorage.getItem(LOCAL_FORMS_KEY);
    return forms ? JSON.parse(forms) : [];
  } catch (error) {
    console.error('Error getting local forms:', error);
    return [];
  }
};

/**
 * Get a single local form by ID
 * @param {string} formId - The local form ID
 * @returns {Object|null} Form data or null if not found
 */
export const getLocalFormById = (formId) => {
  try {
    const forms = getLocalPublishedForms();
    return forms.find(f => f.id === formId) || null;
  } catch (error) {
    console.error('Error getting local form:', error);
    return null;
  }
};

/**
 * Get a local form by share ID
 * @param {string} shareId - The share ID
 * @returns {Object|null} Form data or null if not found
 */
export const getLocalFormByShareId = (shareId) => {
  try {
    const forms = getLocalPublishedForms();
    return forms.find(f => f.shareId === shareId) || null;
  } catch (error) {
    console.error('Error getting local form by shareId:', error);
    return null;
  }
};

/**
 * Update a locally published form
 * @param {string} formId - The local form ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated form or null if not found
 */
export const updateLocalForm = (formId, updates) => {
  try {
    const forms = getLocalPublishedForms();
    const index = forms.findIndex(f => f.id === formId);
    
    if (index === -1) return null;
    
    forms[index] = {
      ...forms[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(forms));
    return forms[index];
  } catch (error) {
    console.error('Error updating local form:', error);
    return null;
  }
};

/**
 * Delete a locally published form and its responses
 * @param {string} formId - The local form ID
 * @returns {boolean} Success status
 */
export const deleteLocalForm = (formId) => {
  try {
    const forms = getLocalPublishedForms();
    const form = forms.find(f => f.id === formId);
    
    if (!form) return false;
    
    // Remove the form
    const updatedForms = forms.filter(f => f.id !== formId);
    localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(updatedForms));
    
    // Remove associated responses and analytics
    localStorage.removeItem(`${LOCAL_RESPONSES_PREFIX}${form.shareId}`);
    localStorage.removeItem(`${LOCAL_ANALYTICS_PREFIX}${form.shareId}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting local form:', error);
    return false;
  }
};

/**
 * Save a response locally
 * @param {string} shareId - The form's share ID
 * @param {Object} responseData - The response data
 * @returns {Object} Saved response with ID
 */
export const saveLocalResponse = (shareId, responseData) => {
  try {
    const key = `${LOCAL_RESPONSES_PREFIX}${shareId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    const response = {
      id: `resp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...responseData,
      submittedAt: new Date().toISOString()
    };
    
    existing.push(response);
    localStorage.setItem(key, JSON.stringify(existing));
    
    // Update response count on form
    const forms = getLocalPublishedForms();
    const formIndex = forms.findIndex(f => f.shareId === shareId);
    if (formIndex !== -1) {
      forms[formIndex].responseCount = existing.length;
      forms[formIndex].lastResponseAt = response.submittedAt;
      localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(forms));
    }
    
    // Invalidate analytics cache
    localStorage.removeItem(`${LOCAL_ANALYTICS_PREFIX}${shareId}`);
    
    return response;
  } catch (error) {
    console.error('Error saving local response:', error);
    throw new Error('Failed to save response locally. Storage may be full.');
  }
};

/**
 * Get all local responses for a form
 * @param {string} shareId - The form's share ID
 * @returns {Array} Array of responses
 */
export const getLocalResponses = (shareId) => {
  try {
    const key = `${LOCAL_RESPONSES_PREFIX}${shareId}`;
    const responses = localStorage.getItem(key);
    return responses ? JSON.parse(responses) : [];
  } catch (error) {
    console.error('Error getting local responses:', error);
    return [];
  }
};

/**
 * Get a single local response
 * @param {string} shareId - The form's share ID
 * @param {string} responseId - The response ID
 * @returns {Object|null} Response or null if not found
 */
export const getLocalResponseById = (shareId, responseId) => {
  try {
    const responses = getLocalResponses(shareId);
    return responses.find(r => r.id === responseId) || null;
  } catch (error) {
    console.error('Error getting local response:', error);
    return null;
  }
};

/**
 * Delete a local response
 * @param {string} shareId - The form's share ID
 * @param {string} responseId - The response ID
 * @returns {boolean} Success status
 */
export const deleteLocalResponse = (shareId, responseId) => {
  try {
    const responses = getLocalResponses(shareId);
    const updated = responses.filter(r => r.id !== responseId);
    
    const key = `${LOCAL_RESPONSES_PREFIX}${shareId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    
    // Update response count on form
    const forms = getLocalPublishedForms();
    const formIndex = forms.findIndex(f => f.shareId === shareId);
    if (formIndex !== -1) {
      forms[formIndex].responseCount = updated.length;
      localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(forms));
    }
    
    // Invalidate analytics cache
    localStorage.removeItem(`${LOCAL_ANALYTICS_PREFIX}${shareId}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting local response:', error);
    return false;
  }
};

/**
 * Group responses by date
 * @param {Array} responses - Array of responses
 * @returns {Object} Responses grouped by date
 */
const groupByDate = (responses) => {
  const grouped = {};
  
  responses.forEach(response => {
    const date = new Date(response.submittedAt).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(response);
  });
  
  return grouped;
};

/**
 * Calculate statistics for each question
 * @param {Array} responses - Array of responses
 * @param {Array} questions - Form questions
 * @returns {Object} Question statistics
 */
const calculateQuestionStats = (responses, questions) => {
  const stats = {};
  
  questions.forEach(question => {
    const questionId = question.id;
    const answers = responses.map(r => r.answers?.[questionId]).filter(a => a !== undefined && a !== null && a !== '');
    
    stats[questionId] = {
      questionId,
      questionLabel: question.label,
      questionType: question.type,
      totalResponses: answers.length,
      responseRate: responses.length > 0 ? ((answers.length / responses.length) * 100).toFixed(1) : 0,
      answers: answers
    };
    
    // Type-specific calculations
    if (['multiple-choice', 'dropdown', 'checkbox'].includes(question.type)) {
      // Count occurrences
      const counts = {};
      answers.forEach(answer => {
        if (Array.isArray(answer)) {
          answer.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
          });
        } else {
          counts[answer] = (counts[answer] || 0) + 1;
        }
      });
      stats[questionId].distribution = counts;
    } else if (question.type === 'rating') {
      // Calculate average rating
      const numericAnswers = answers.filter(a => !isNaN(a)).map(Number);
      const avg = numericAnswers.length > 0
        ? (numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length).toFixed(2)
        : 0;
      stats[questionId].average = avg;
      stats[questionId].distribution = {};
      numericAnswers.forEach(val => {
        stats[questionId].distribution[val] = (stats[questionId].distribution[val] || 0) + 1;
      });
    } else if (question.type === 'number') {
      // Calculate numeric statistics
      const numericAnswers = answers.filter(a => !isNaN(a)).map(Number);
      if (numericAnswers.length > 0) {
        stats[questionId].average = (numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length).toFixed(2);
        stats[questionId].min = Math.min(...numericAnswers);
        stats[questionId].max = Math.max(...numericAnswers);
      }
    }
  });
  
  return stats;
};

/**
 * Calculate analytics from local responses (with caching)
 * @param {string} shareId - The form's share ID
 * @param {Array} questions - Form questions for detailed stats
 * @returns {Object} Analytics data
 */
export const calculateLocalAnalytics = (shareId, questions = []) => {
  try {
    // Check cache first
    const cacheKey = `${LOCAL_ANALYTICS_PREFIX}${shareId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, lastCalculated, responseCount } = JSON.parse(cached);
      const age = Date.now() - new Date(lastCalculated).getTime();
      const currentResponseCount = getLocalResponses(shareId).length;
      
      // Cache valid for 5 minutes and same response count
      if (age < 5 * 60 * 1000 && currentResponseCount === responseCount) {
        return data;
      }
    }
    
    // Calculate fresh analytics
    const responses = getLocalResponses(shareId);
    const responsesByDate = groupByDate(responses);
    
    const analytics = {
      totalResponses: responses.length,
      responsesByDate: Object.entries(responsesByDate).map(([date, resps]) => ({
        date,
        count: resps.length
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      questionStats: questions.length > 0 ? calculateQuestionStats(responses, questions) : {},
      lastCalculated: new Date().toISOString()
    };
    
    // Cache results (don't cache if storage is near limit)
    const quota = checkStorageQuota();
    if (!quota.isNearLimit) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: analytics,
          lastCalculated: analytics.lastCalculated,
          responseCount: responses.length
        }));
      } catch (e) {
        console.warn('Could not cache analytics, storage may be full');
      }
    }
    
    return analytics;
  } catch (error) {
    console.error('Error calculating local analytics:', error);
    return {
      totalResponses: 0,
      responsesByDate: [],
      questionStats: {},
      lastCalculated: new Date().toISOString()
    };
  }
};

/**
 * Export local form data (for backup or migration)
 * @param {string} formId - The local form ID
 * @returns {Object} Complete form data including responses
 */
export const exportLocalFormData = (formId) => {
  try {
    const form = getLocalFormById(formId);
    if (!form) return null;
    
    const responses = getLocalResponses(form.shareId);
    const analytics = calculateLocalAnalytics(form.shareId, form.questions || []);
    
    return {
      form,
      responses,
      analytics,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting local form data:', error);
    return null;
  }
};

/**
 * Clear all local form data (use with caution!)
 * @returns {boolean} Success status
 */
export const clearAllLocalForms = () => {
  try {
    const forms = getLocalPublishedForms();
    
    // Remove all responses and analytics
    forms.forEach(form => {
      localStorage.removeItem(`${LOCAL_RESPONSES_PREFIX}${form.shareId}`);
      localStorage.removeItem(`${LOCAL_ANALYTICS_PREFIX}${form.shareId}`);
    });
    
    // Remove forms
    localStorage.removeItem(LOCAL_FORMS_KEY);
    
    return true;
  } catch (error) {
    console.error('Error clearing local forms:', error);
    return false;
  }
};

/**
 * Get summary statistics for all local forms
 * @returns {Object} Summary statistics
 */
export const getLocalFormsSummary = () => {
  try {
    const forms = getLocalPublishedForms();
    const totalResponses = forms.reduce((sum, form) => sum + (form.responseCount || 0), 0);
    const quota = checkStorageQuota();
    
    return {
      totalForms: forms.length,
      totalResponses,
      storageUsed: quota.used,
      storageTotal: quota.total,
      storagePercentage: quota.percentage,
      isNearLimit: quota.isNearLimit
    };
  } catch (error) {
    console.error('Error getting local forms summary:', error);
    return {
      totalForms: 0,
      totalResponses: 0,
      storageUsed: 0,
      storageTotal: 5120,
      storagePercentage: 0,
      isNearLimit: false
    };
  }
};
