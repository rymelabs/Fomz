import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import app from './firebase';

// Initialize Google Analytics
let analytics = null;

try {
  analytics = getAnalytics(app);
  console.log('Google Analytics initialized');
} catch (error) {
  console.warn('Google Analytics initialization failed:', error);
}

/**
 * ====================================
 * LOCATION TRACKING
 * ====================================
 */

// Cached location data to avoid repeated API calls
let cachedLocation = null;

// Get user's approximate location via IP geolocation (no permission needed)
const getIPLocation = async () => {
  if (cachedLocation) return cachedLocation;
  
  try {
    // Using a free IP geolocation API
    const response = await fetch('https://ipapi.co/json/', { 
      method: 'GET',
      cache: 'force-cache' 
    });
    
    if (response.ok) {
      const data = await response.json();
      cachedLocation = {
        country: data.country_name || 'Unknown',
        country_code: data.country_code || 'XX',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      return cachedLocation;
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error);
  }
  
  // Fallback to timezone-based info
  return {
    country: 'Unknown',
    country_code: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

// Set location-based user properties
export const trackUserLocation = async () => {
  if (!analytics) return;
  
  try {
    const location = await getIPLocation();
    
    setUserProperties(analytics, {
      user_country: location.country,
      user_country_code: location.country_code,
      user_region: location.region,
      user_city: location.city,
      user_timezone: location.timezone,
    });
    
    // Log location event for analytics
    safeLogEvent('user_location_captured', {
      country: location.country,
      country_code: location.country_code,
      region: location.region,
      city: location.city,
      timezone: location.timezone,
    });
    
    return location;
  } catch (error) {
    console.warn('Failed to track user location:', error);
    return null;
  }
};

/**
 * ====================================
 * CUSTOM EVENT TRACKING
 * ====================================
 */

// Helper to safely log events
const safeLogEvent = (eventName, params = {}) => {
  if (!analytics) return;
  try {
    // Add timestamp and session info to all events
    const enrichedParams = {
      ...params,
      timestamp: new Date().toISOString(),
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    };
    logEvent(analytics, eventName, enrichedParams);
  } catch (error) {
    console.warn(`Analytics event failed: ${eventName}`, error);
  }
};

/**
 * ====================================
 * PAGE VIEW TRACKING
 * ====================================
 */

export const trackPageView = (pageName, pageUrl) => {
  safeLogEvent('page_view', {
    page_title: pageName,
    page_location: pageUrl || window.location.href,
    page_path: window.location.pathname,
  });
};

/**
 * ====================================
 * USER TRACKING
 * ====================================
 */

// Set user ID when authenticated
export const setAnalyticsUserId = (userId) => {
  if (!analytics || !userId) return;
  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.warn('Failed to set analytics user ID:', error);
  }
};

// Set user properties (demographics, preferences)
export const setAnalyticsUserProperties = (properties) => {
  if (!analytics) return;
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.warn('Failed to set user properties:', error);
  }
};

// Track user sign up
export const trackSignUp = (method = 'email') => {
  safeLogEvent('sign_up', { method });
};

// Track user login
export const trackLogin = (method = 'email') => {
  safeLogEvent('login', { method });
};

// Track user logout
export const trackLogout = () => {
  safeLogEvent('logout');
};

/**
 * ====================================
 * FORM BUILDER TRACKING
 * ====================================
 */

// Track form creation started
export const trackFormCreationStarted = (hasTitle = false, hasDescription = false) => {
  safeLogEvent('form_creation_started', {
    has_title: hasTitle,
    has_description: hasDescription,
  });
};

// Track form created/saved
export const trackFormCreated = (formId, questionCount, sectionCount) => {
  safeLogEvent('form_created', {
    form_id: formId,
    question_count: questionCount,
    section_count: sectionCount,
  });
};

// Track form published
export const trackFormPublished = (formId, questionCount) => {
  safeLogEvent('form_published', {
    form_id: formId,
    question_count: questionCount,
  });
};

// Track form unpublished
export const trackFormUnpublished = (formId) => {
  safeLogEvent('form_unpublished', {
    form_id: formId,
  });
};

// Track form deleted
export const trackFormDeleted = (formId) => {
  safeLogEvent('form_deleted', {
    form_id: formId,
  });
};

// Track form duplicated
export const trackFormDuplicated = (originalFormId, newFormId) => {
  safeLogEvent('form_duplicated', {
    original_form_id: originalFormId,
    new_form_id: newFormId,
  });
};

// Track question added
export const trackQuestionAdded = (questionType) => {
  safeLogEvent('question_added', {
    question_type: questionType,
  });
};

// Track question deleted
export const trackQuestionDeleted = (questionType) => {
  safeLogEvent('question_deleted', {
    question_type: questionType,
  });
};

// Track section added
export const trackSectionAdded = () => {
  safeLogEvent('section_added');
};

// Track theme changed
export const trackThemeChanged = (themeName) => {
  safeLogEvent('theme_changed', {
    theme_name: themeName,
  });
};

// Track font changed
export const trackFontChanged = (fontFamily) => {
  safeLogEvent('font_changed', {
    font_family: fontFamily,
  });
};

// Track logo uploaded
export const trackLogoUploaded = () => {
  safeLogEvent('logo_uploaded');
};

/**
 * ====================================
 * AI / FOMZY TRACKING
 * ====================================
 */

// Track AI form generation
export const trackAIFormGenerated = (success, questionCount = 0, isAuthenticated = false) => {
  safeLogEvent('ai_form_generated', {
    success,
    question_count: questionCount,
    is_authenticated: isAuthenticated,
  });
};

// Track AI limit reached
export const trackAILimitReached = (isAuthenticated) => {
  safeLogEvent('ai_limit_reached', {
    is_authenticated: isAuthenticated,
  });
};

/**
 * ====================================
 * FORM FILL TRACKING
 * ====================================
 */

// Track form fill started
export const trackFormFillStarted = (formId, questionCount) => {
  safeLogEvent('form_fill_started', {
    form_id: formId,
    question_count: questionCount,
  });
};

// Track form fill completed (submitted)
export const trackFormFillCompleted = (formId, questionCount, timeSpentSeconds) => {
  safeLogEvent('form_fill_completed', {
    form_id: formId,
    question_count: questionCount,
    time_spent_seconds: timeSpentSeconds,
  });
};

// Track form fill abandoned
export const trackFormFillAbandoned = (formId, questionsAnswered, totalQuestions) => {
  safeLogEvent('form_fill_abandoned', {
    form_id: formId,
    questions_answered: questionsAnswered,
    total_questions: totalQuestions,
    completion_percentage: Math.round((questionsAnswered / totalQuestions) * 100),
  });
};

// Track question answered
export const trackQuestionAnswered = (questionType, questionIndex) => {
  safeLogEvent('question_answered', {
    question_type: questionType,
    question_index: questionIndex,
  });
};

/**
 * ====================================
 * RESPONSE & ANALYTICS TRACKING
 * ====================================
 */

// Track response viewed
export const trackResponseViewed = (formId) => {
  safeLogEvent('response_viewed', {
    form_id: formId,
  });
};

// Track response edited
export const trackResponseEdited = (formId, responseId) => {
  safeLogEvent('response_edited', {
    form_id: formId,
    response_id: responseId,
  });
};

// Track CSV export
export const trackCSVExported = (formId, responseCount) => {
  safeLogEvent('csv_exported', {
    form_id: formId,
    response_count: responseCount,
  });
};

// Track analytics viewed
export const trackAnalyticsViewed = (formId, responseCount) => {
  safeLogEvent('analytics_viewed', {
    form_id: formId,
    response_count: responseCount,
  });
};

/**
 * ====================================
 * SHARING TRACKING
 * ====================================
 */

// Track form shared
export const trackFormShared = (formId, method) => {
  safeLogEvent('share', {
    content_type: 'form',
    item_id: formId,
    method, // 'copy_link', 'native_share', 'qr_code'
  });
};

// Track short link copied
export const trackShortLinkCopied = (formId) => {
  safeLogEvent('short_link_copied', {
    form_id: formId,
  });
};

/**
 * ====================================
 * DRAFT TRACKING
 * ====================================
 */

// Track draft saved
export const trackDraftSaved = (draftId, isAutoSave = false) => {
  safeLogEvent('draft_saved', {
    draft_id: draftId,
    is_auto_save: isAutoSave,
  });
};

// Track draft loaded
export const trackDraftLoaded = (draftId) => {
  safeLogEvent('draft_loaded', {
    draft_id: draftId,
  });
};

// Track draft deleted
export const trackDraftDeleted = (draftId) => {
  safeLogEvent('draft_deleted', {
    draft_id: draftId,
  });
};

/**
 * ====================================
 * NOTIFICATION TRACKING
 * ====================================
 */

// Track notification viewed
export const trackNotificationViewed = (notificationType) => {
  safeLogEvent('notification_viewed', {
    notification_type: notificationType,
  });
};

// Track notification clicked
export const trackNotificationClicked = (notificationType, action) => {
  safeLogEvent('notification_clicked', {
    notification_type: notificationType,
    action,
  });
};

/**
 * ====================================
 * ERROR TRACKING
 * ====================================
 */

// Track error occurred
export const trackError = (errorType, errorMessage, context = {}) => {
  safeLogEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Limit length
    ...context,
  });
};

/**
 * ====================================
 * ENGAGEMENT TRACKING
 * ====================================
 */

// Track feature used
export const trackFeatureUsed = (featureName, details = {}) => {
  safeLogEvent('feature_used', {
    feature_name: featureName,
    ...details,
  });
};

// Track button clicked
export const trackButtonClicked = (buttonName, context = {}) => {
  safeLogEvent('button_clicked', {
    button_name: buttonName,
    ...context,
  });
};

// Track modal opened
export const trackModalOpened = (modalName) => {
  safeLogEvent('modal_opened', {
    modal_name: modalName,
  });
};

// Track modal closed
export const trackModalClosed = (modalName, action = 'dismissed') => {
  safeLogEvent('modal_closed', {
    modal_name: modalName,
    action, // 'dismissed', 'confirmed', 'cancelled'
  });
};

/**
 * ====================================
 * SESSION TRACKING
 * ====================================
 */

// Track session start
export const trackSessionStart = () => {
  safeLogEvent('session_start', {
    referrer: document.referrer,
    landing_page: window.location.pathname,
  });
};

// Track session end (before unload)
export const trackSessionEnd = (sessionDurationSeconds) => {
  safeLogEvent('session_end', {
    session_duration_seconds: sessionDurationSeconds,
  });
};

/**
 * ====================================
 * MIGRATION TRACKING
 * ====================================
 */

// Track local forms migration
export const trackMigrationStarted = (formCount) => {
  safeLogEvent('migration_started', {
    form_count: formCount,
  });
};

export const trackMigrationCompleted = (successCount, failCount) => {
  safeLogEvent('migration_completed', {
    success_count: successCount,
    fail_count: failCount,
  });
};

/**
 * ====================================
 * PERFORMANCE TRACKING
 * ====================================
 */

// Track page load time
export const trackPageLoadTime = (pageName, loadTimeMs) => {
  safeLogEvent('page_load_time', {
    page_name: pageName,
    load_time_ms: loadTimeMs,
  });
};

// Track API call performance
export const trackAPIPerformance = (endpoint, durationMs, success) => {
  safeLogEvent('api_performance', {
    endpoint,
    duration_ms: durationMs,
    success,
  });
};

/**
 * ====================================
 * PROFILE & ACCOUNT TRACKING
 * ====================================
 */

// Track profile updated
export const trackProfileUpdated = (field) => {
  safeLogEvent('profile_updated', {
    field_updated: field,
  });
};

// Track account deleted
export const trackAccountDeleted = () => {
  safeLogEvent('account_deleted');
};

// Track app background changed
export const trackAppBackgroundChanged = (backgroundId) => {
  safeLogEvent('app_background_changed', {
    background_id: backgroundId,
  });
};

/**
 * ====================================
 * EXPORT TRACKING
 * ====================================
 */

// Track data export
export const trackExportData = (format, dataType, recordCount) => {
  safeLogEvent('data_exported', {
    export_format: format,
    data_type: dataType,
    record_count: recordCount,
  });
};

export default analytics;
