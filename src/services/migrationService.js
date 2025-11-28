/**
 * Migration Service
 * Handles migrating local forms and responses to cloud storage when user signs in
 */

import { createForm } from './formService';
import { submitResponse } from './responseService';
import { 
  getLocalPublishedForms, 
  getLocalResponses, 
  deleteLocalForm,
  exportLocalFormData 
} from './localFormService';

/**
 * Migrate all local forms to cloud for a user
 * @param {string} userId - The authenticated user's ID
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Object} Migration results
 */
export const migrateAllLocalFormsToCloud = async (userId, onProgress = null) => {
  const localForms = getLocalPublishedForms();
  
  if (localForms.length === 0) {
    return {
      success: true,
      migratedForms: 0,
      migratedResponses: 0,
      errors: []
    };
  }
  
  const results = {
    success: true,
    migratedForms: 0,
    migratedResponses: 0,
    errors: [],
    formMapping: {} // oldId -> newId
  };
  
  for (let i = 0; i < localForms.length; i++) {
    const localForm = localForms[i];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: localForms.length,
        formTitle: localForm.title,
        status: 'migrating'
      });
    }
    
    try {
      const result = await migrateLocalFormToCloud(localForm.id, userId);
      results.migratedForms += 1;
      results.migratedResponses += result.migratedResponses;
      results.formMapping[localForm.id] = result.cloudFormId;
    } catch (error) {
      console.error(`Failed to migrate form ${localForm.id}:`, error);
      results.errors.push({
        formId: localForm.id,
        formTitle: localForm.title,
        error: error.message
      });
      results.success = false;
    }
  }
  
  return results;
};

/**
 * Migrate a single local form to cloud
 * @param {string} localFormId - The local form ID
 * @param {string} userId - The authenticated user's ID
 * @param {boolean} deleteAfterMigration - Whether to delete local data after successful migration
 * @returns {Object} Migration result
 */
export const migrateLocalFormToCloud = async (localFormId, userId, deleteAfterMigration = true) => {
  try {
    // Export local form data
    const exportData = exportLocalFormData(localFormId);
    if (!exportData) {
      throw new Error('Local form not found');
    }
    
    const { form, responses } = exportData;
    
    // Prepare form data for cloud (remove local-specific fields)
    const cloudFormData = {
      title: form.title,
      description: form.description,
      theme: form.theme,
      logoUrl: form.logoUrl,
      logoPath: form.logoPath,
      sections: form.sections,
      questions: form.questions,
      settings: {
        ...form.settings,
        published: true // Keep published state
      },
      style: form.style
    };
    
    // Create form in cloud
    const cloudForm = await createForm(cloudFormData, userId);
    
    // Migrate responses
    let migratedResponses = 0;
    const responseErrors = [];
    
    for (const response of responses) {
      try {
        await submitResponse(cloudForm.id, {
          answers: response.answers,
          metadata: {
            ...response.metadata,
            migratedFrom: 'localStorage',
            originalSubmittedAt: response.submittedAt
          }
        }, response.submitterId || null);
        migratedResponses++;
      } catch (error) {
        console.error(`Failed to migrate response ${response.id}:`, error);
        responseErrors.push({
          responseId: response.id,
          error: error.message
        });
      }
    }
    
    // Delete local data if successful and requested
    if (deleteAfterMigration && responseErrors.length === 0) {
      deleteLocalForm(localFormId);
    }
    
    return {
      success: true,
      cloudFormId: cloudForm.id,
      cloudFormShareId: cloudForm.shareId,
      migratedResponses,
      totalResponses: responses.length,
      responseErrors
    };
    
  } catch (error) {
    console.error('Error migrating local form to cloud:', error);
    throw error;
  }
};

/**
 * Check if user has local forms that need migration
 * @returns {boolean}
 */
export const hasLocalFormsToMigrate = () => {
  const localForms = getLocalPublishedForms();
  return localForms.length > 0;
};

/**
 * Get summary of local forms for migration preview
 * @returns {Object}
 */
export const getMigrationSummary = () => {
  const localForms = getLocalPublishedForms();
  
  let totalResponses = 0;
  const formsData = localForms.map(form => {
    const responses = getLocalResponses(form.shareId);
    totalResponses += responses.length;
    
    return {
      id: form.id,
      title: form.title,
      questionCount: form.questions?.length || 0,
      responseCount: responses.length,
      publishedAt: form.publishedAt
    };
  });
  
  return {
    totalForms: localForms.length,
    totalResponses,
    forms: formsData
  };
};

/**
 * Backup all local forms to JSON file
 * @returns {Blob}
 */
export const backupLocalForms = () => {
  const localForms = getLocalPublishedForms();
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    forms: localForms.map(form => exportLocalFormData(form.id))
  };
  
  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
};
