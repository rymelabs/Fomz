// Logic Service - Evaluates conditional logic for forms

/**
 * Condition types supported
 */
export const CONDITION_TYPES = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  IS_ONE_OF: 'is_one_of',
  IS_NOT_ONE_OF: 'is_not_one_of'
};

/**
 * Action types
 */
export const ACTION_TYPES = {
  SHOW: 'show',
  HIDE: 'hide',
  SKIP_TO: 'skip_to',
  REQUIRE: 'require',
  UNREQUIRE: 'unrequire'
};

/**
 * Evaluate a single condition
 * @param {Object} condition - The condition to evaluate
 * @param {Object} answers - Current form answers
 * @returns {boolean} - Whether the condition is met
 */
export const evaluateCondition = (condition, answers) => {
  const { questionId, operator, value } = condition;
  const answer = answers[questionId];
  const hasAnswer = answer !== undefined && answer !== null && answer !== '';

  // Negative comparisons should not become true before the respondent has
  // reached and answered the source question.
  if (!hasAnswer && ![CONDITION_TYPES.IS_EMPTY, CONDITION_TYPES.IS_NOT_EMPTY].includes(operator)) {
    return false;
  }

  switch (operator) {
    case CONDITION_TYPES.EQUALS:
      return Array.isArray(answer)
        ? answer.some(item => String(item) === String(value))
        : String(answer) === String(value);

    case CONDITION_TYPES.NOT_EQUALS:
      return Array.isArray(answer)
        ? !answer.some(item => String(item) === String(value))
        : String(answer) !== String(value);

    case CONDITION_TYPES.CONTAINS:
      if (typeof answer === 'string') {
        return answer.toLowerCase().includes(String(value).toLowerCase());
      }
      if (Array.isArray(answer)) {
        return answer.includes(value);
      }
      return false;

    case CONDITION_TYPES.NOT_CONTAINS:
      if (typeof answer === 'string') {
        return !answer.toLowerCase().includes(String(value).toLowerCase());
      }
      if (Array.isArray(answer)) {
        return !answer.includes(value);
      }
      return true;

    case CONDITION_TYPES.GREATER_THAN:
      return Number(answer) > Number(value);

    case CONDITION_TYPES.LESS_THAN:
      return Number(answer) < Number(value);

    case CONDITION_TYPES.IS_EMPTY:
      return !answer || answer === '' || (Array.isArray(answer) && answer.length === 0);

    case CONDITION_TYPES.IS_NOT_EMPTY:
      return answer && answer !== '' && (!Array.isArray(answer) || answer.length > 0);

    case CONDITION_TYPES.IS_ONE_OF:
      if (Array.isArray(value)) {
        return value.includes(answer);
      }
      return false;

    case CONDITION_TYPES.IS_NOT_ONE_OF:
      if (Array.isArray(value)) {
        return !value.includes(answer);
      }
      return true;

    default:
      return false;
  }
};

/**
 * Evaluate a logic rule (AND/OR conditions)
 * @param {Object} rule - The rule containing conditions and logic type
 * @param {Object} answers - Current form answers
 * @returns {boolean} - Whether the rule passes
 */
export const evaluateRule = (rule, answers) => {
  const { conditions, logicType = 'AND' } = rule;

  if (!conditions || conditions.length === 0) {
    return false;
  }

  if (logicType === 'AND') {
    return conditions.every(condition => evaluateCondition(condition, answers));
  } else if (logicType === 'OR') {
    return conditions.some(condition => evaluateCondition(condition, answers));
  }

  return false;
};

/**
 * Get all actions that should be applied based on current answers
 * @param {Array} logicRules - Array of logic rules from form
 * @param {Object} answers - Current form answers
 * @returns {Array} - Array of actions to apply
 */
export const getActiveActions = (logicRules, answers) => {
  if (!logicRules || logicRules.length === 0) {
    return [];
  }

  const activeActions = [];

  logicRules.filter(rule => rule.active !== false).forEach(rule => {
    if (evaluateRule(rule, answers)) {
      activeActions.push(...(rule.actions || []));
    }
  });

  return activeActions;
};

/**
 * Determine which questions should be visible
 * @param {Array} questions - All form questions
 * @param {Array} logicRules - Logic rules
 * @param {Object} answers - Current answers
 * @returns {Set} - Set of question IDs that should be visible
 */
export const getVisibleQuestionIds = (questions, logicRules, answers) => {
  const visibleIds = new Set(questions.map(q => q.id));
  const enabledRules = (logicRules || []).filter(rule => rule.active !== false);

  // A question targeted by a SHOW action is conditional: keep it hidden until
  // at least one of its rules matches. Other questions remain visible normally.
  enabledRules.forEach(rule => {
    rule.actions?.forEach(action => {
      if (action.type === ACTION_TYPES.SHOW) {
        action.targetQuestionIds?.forEach(id => visibleIds.delete(id));
      }
    });
  });

  const activeActions = getActiveActions(logicRules, answers);

  activeActions.forEach(action => {
    if (action.type === ACTION_TYPES.SHOW) {
      action.targetQuestionIds?.forEach(id => visibleIds.add(id));
    }
  });

  // Explicit HIDE actions win if rules conflict.
  activeActions.forEach(action => {
    if (action.type === ACTION_TYPES.HIDE) {
      action.targetQuestionIds?.forEach(id => visibleIds.delete(id));
    }
  });

  // Rebuild the Set in authored question order; SHOW can otherwise append a
  // revealed ID to the end of the Set even when it appears earlier in the form.
  return new Set(questions.filter(question => visibleIds.has(question.id)).map(question => question.id));
};

/**
 * Get the next question ID based on skip logic
 * @param {string} currentQuestionId - Current question ID
 * @param {Array} questions - All questions
 * @param {Array} logicRules - Logic rules
 * @param {Object} answers - Current answers
 * @returns {string|null} - Next question ID or null if end
 */
export const getNextQuestionId = (currentQuestionId, questions, logicRules, answers) => {
  const activeActions = getActiveActions(logicRules, answers);
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId);

  // Check for skip_to action
  const skipAction = activeActions.find(
    action => action.type === ACTION_TYPES.SKIP_TO && action.fromQuestionId === currentQuestionId
  );

  if (skipAction && skipAction.targetQuestionId) {
    return skipAction.targetQuestionId;
  }

  // Get visible questions
  const visibleIds = getVisibleQuestionIds(questions, logicRules, answers);

  // Find next visible question
  for (let i = currentIndex + 1; i < questions.length; i++) {
    if (visibleIds.has(questions[i].id)) {
      return questions[i].id;
    }
  }

  return null;
};

/**
 * Get conditionally required question IDs
 * @param {Array} logicRules - Logic rules
 * @param {Object} answers - Current answers
 * @returns {Set} - Set of question IDs that are conditionally required
 */
export const getConditionallyRequiredIds = (logicRules, answers) => {
  const requiredIds = new Set();
  const activeActions = getActiveActions(logicRules, answers);

  activeActions.forEach(action => {
    if (action.type === ACTION_TYPES.REQUIRE) {
      action.targetQuestionIds?.forEach(id => requiredIds.add(id));
    } else if (action.type === ACTION_TYPES.UNREQUIRE) {
      action.targetQuestionIds?.forEach(id => requiredIds.delete(id));
    }
  });

  return requiredIds;
};

/**
 * Determine the final required state after conditional REQUIRE/UNREQUIRE actions.
 */
export const getRequiredQuestionIds = (questions, logicRules, answers) => {
  const requiredIds = new Set(
    (questions || []).filter(question => question.required).map(question => question.id)
  );
  const activeActions = getActiveActions(logicRules, answers);

  activeActions.forEach(action => {
    if (action.type === ACTION_TYPES.REQUIRE) {
      action.targetQuestionIds?.forEach(id => requiredIds.add(id));
    } else if (action.type === ACTION_TYPES.UNREQUIRE) {
      action.targetQuestionIds?.forEach(id => requiredIds.delete(id));
    }
  });

  return requiredIds;
};

/**
 * Validate logic rules for circular dependencies
 * @param {Array} logicRules - Logic rules to validate
 * @param {Array} questions - All questions
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateLogicRules = (logicRules, questions) => {
  const errors = [];

  if (!logicRules || logicRules.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check for circular skip logic
  const skipGraph = new Map();
  logicRules.forEach(rule => {
    rule.actions?.forEach(action => {
      if (action.type === ACTION_TYPES.SKIP_TO) {
        if (!skipGraph.has(action.fromQuestionId)) {
          skipGraph.set(action.fromQuestionId, []);
        }
        skipGraph.get(action.fromQuestionId).push(action.targetQuestionId);
      }
    });
  });

  // Detect cycles using DFS
  const visited = new Set();
  const recStack = new Set();

  const hasCycle = (nodeId) => {
    if (recStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = skipGraph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  };

  for (const nodeId of skipGraph.keys()) {
    if (hasCycle(nodeId)) {
      errors.push(`Circular skip logic detected involving question ${nodeId}`);
      break;
    }
  }

  // Check for invalid question references
  const questionIds = new Set(questions.map(q => q.id));
  logicRules.forEach((rule, ruleIndex) => {
    if (!rule.conditions?.length) {
      errors.push(`Rule ${ruleIndex + 1}: Add at least one condition`);
    }
    if (!rule.actions?.length) {
      errors.push(`Rule ${ruleIndex + 1}: Add at least one action`);
    }

    rule.conditions?.forEach((condition, condIndex) => {
      if (!condition.questionId) {
        errors.push(`Rule ${ruleIndex + 1}, Condition ${condIndex + 1}: Select a question`);
        return;
      }
      if (!questionIds.has(condition.questionId)) {
        errors.push(`Rule ${ruleIndex + 1}, Condition ${condIndex + 1}: References non-existent question ${condition.questionId}`);
      }

      const doesNotNeedValue = [CONDITION_TYPES.IS_EMPTY, CONDITION_TYPES.IS_NOT_EMPTY].includes(condition.operator);
      if (!doesNotNeedValue && (condition.value === undefined || condition.value === null || condition.value === '')) {
        errors.push(`Rule ${ruleIndex + 1}, Condition ${condIndex + 1}: Enter an answer value`);
      }
    });

    rule.actions?.forEach((action, actionIndex) => {
      if (action.type === ACTION_TYPES.SKIP_TO && !action.targetQuestionId) {
        errors.push(`Rule ${ruleIndex + 1}, Action ${actionIndex + 1}: Select a destination question`);
      } else if (action.type !== ACTION_TYPES.SKIP_TO && !action.targetQuestionIds?.length) {
        errors.push(`Rule ${ruleIndex + 1}, Action ${actionIndex + 1}: Select at least one question`);
      }

      action.targetQuestionIds?.forEach(targetId => {
        if (!questionIds.has(targetId)) {
          errors.push(`Rule ${ruleIndex + 1}, Action ${actionIndex + 1}: References non-existent question ${targetId}`);
        }
      });

      rule.conditions?.forEach(condition => {
        if ([ACTION_TYPES.SHOW, ACTION_TYPES.HIDE].includes(action.type) && action.targetQuestionIds?.includes(condition.questionId)) {
          errors.push(`Rule ${ruleIndex + 1}: A condition question cannot show or hide itself`);
        }
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate adjusted progress considering hidden questions
 * @param {number} currentIndex - Current question index
 * @param {Array} questions - All questions
 * @param {Set} visibleIds - Set of visible question IDs
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateAdjustedProgress = (currentIndex, questions, visibleIds) => {
  const visibleQuestions = questions.filter(q => visibleIds.has(q.id));
  const currentVisibleIndex = visibleQuestions.findIndex((q) => {
    return questions[currentIndex]?.id === q.id;
  });

  if (visibleQuestions.length === 0) {
    return 100;
  }

  return Math.round(((currentVisibleIndex + 1) / visibleQuestions.length) * 100);
};
