/**
 * AI Usage Limit Service
 * Tracks and enforces Fomzy AI generation limits for anonymous users
 * - Anonymous users: 5 generations per day
 * - Logged-in users: Unlimited
 */

const STORAGE_KEY = 'fomz_ai_usage';
const DAILY_LIMIT_ANONYMOUS = 5;

/**
 * Get usage data structure from localStorage
 * @returns {Object} { date: string, count: number }
 */
const getUsageData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading AI usage data:', error);
    return null;
  }
};

/**
 * Save usage data to localStorage
 * @param {Object} data - { date: string, count: number }
 */
const saveUsageData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving AI usage data:', error);
    return false;
  }
};

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string}
 */
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Check if user has reached their daily AI generation limit
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {Object} { allowed: boolean, remaining: number, limit: number, resetsAt: Date|null }
 */
export const checkAIUsageLimit = (isAuthenticated) => {
  // Logged-in users have unlimited usage
  if (isAuthenticated) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetsAt: null,
      isUnlimited: true
    };
  }

  // Anonymous users: check daily limit
  const today = getTodayString();
  const usageData = getUsageData();

  // If no data or data from previous day, reset count
  if (!usageData || usageData.date !== today) {
    return {
      allowed: true,
      remaining: DAILY_LIMIT_ANONYMOUS,
      limit: DAILY_LIMIT_ANONYMOUS,
      resetsAt: getEndOfDay(),
      isUnlimited: false
    };
  }

  // Check if limit reached
  const remaining = DAILY_LIMIT_ANONYMOUS - usageData.count;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: DAILY_LIMIT_ANONYMOUS,
    resetsAt: getEndOfDay(),
    isUnlimited: false
  };
};

/**
 * Record an AI generation usage for anonymous user
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {boolean} Success status
 */
export const recordAIUsage = (isAuthenticated) => {
  // Don't track for logged-in users
  if (isAuthenticated) {
    return true;
  }

  const today = getTodayString();
  const usageData = getUsageData();

  // If no data or data from previous day, start fresh
  if (!usageData || usageData.date !== today) {
    return saveUsageData({
      date: today,
      count: 1
    });
  }

  // Increment count
  return saveUsageData({
    date: today,
    count: usageData.count + 1
  });
};

/**
 * Get the end of the current day
 * @returns {Date}
 */
const getEndOfDay = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Format time until reset
 * @param {Date} resetsAt
 * @returns {string}
 */
export const formatTimeUntilReset = (resetsAt) => {
  if (!resetsAt) return '';
  
  const now = new Date();
  const diff = resetsAt - now;
  
  if (diff <= 0) return 'soon';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get current usage stats for display
 * @param {boolean} isAuthenticated
 * @returns {Object}
 */
export const getUsageStats = (isAuthenticated) => {
  if (isAuthenticated) {
    return {
      used: 0,
      remaining: Infinity,
      limit: Infinity,
      percentage: 0,
      isUnlimited: true
    };
  }

  const today = getTodayString();
  const usageData = getUsageData();

  if (!usageData || usageData.date !== today) {
    return {
      used: 0,
      remaining: DAILY_LIMIT_ANONYMOUS,
      limit: DAILY_LIMIT_ANONYMOUS,
      percentage: 0,
      isUnlimited: false
    };
  }

  const used = usageData.count;
  const remaining = Math.max(0, DAILY_LIMIT_ANONYMOUS - used);
  const percentage = (used / DAILY_LIMIT_ANONYMOUS) * 100;

  return {
    used,
    remaining,
    limit: DAILY_LIMIT_ANONYMOUS,
    percentage: Math.min(100, percentage),
    isUnlimited: false
  };
};

/**
 * Reset usage data (for testing purposes)
 */
export const resetUsageData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting AI usage data:', error);
    return false;
  }
};
