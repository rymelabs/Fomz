import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, ChevronDown, AlertCircle, Eye, EyeOff, SkipForward, Star, Circle } from 'lucide-react';
import Button from '../ui/Button';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { CONDITION_TYPES, ACTION_TYPES, validateLogicRules } from '../../services/logicService';

const OPERATOR_OPTIONS = [
  { value: CONDITION_TYPES.EQUALS, label: 'Equals', types: ['short-text', 'long-text', 'multiple-choice', 'dropdown', 'email', 'number'] },
  { value: CONDITION_TYPES.NOT_EQUALS, label: 'Does not equal', types: ['short-text', 'long-text', 'multiple-choice', 'dropdown', 'email', 'number'] },
  { value: CONDITION_TYPES.CONTAINS, label: 'Contains', types: ['short-text', 'long-text', 'checkbox'] },
  { value: CONDITION_TYPES.NOT_CONTAINS, label: 'Does not contain', types: ['short-text', 'long-text', 'checkbox'] },
  { value: CONDITION_TYPES.GREATER_THAN, label: 'Greater than', types: ['number', 'slider', 'rating'] },
  { value: CONDITION_TYPES.LESS_THAN, label: 'Less than', types: ['number', 'slider', 'rating'] },
  { value: CONDITION_TYPES.IS_EMPTY, label: 'Is empty', types: ['all'] },
  { value: CONDITION_TYPES.IS_NOT_EMPTY, label: 'Is not empty', types: ['all'] }
];

const ACTION_OPTIONS = [
  { value: ACTION_TYPES.SHOW, label: 'Show question(s)', icon: Eye },
  { value: ACTION_TYPES.HIDE, label: 'Hide question(s)', icon: EyeOff },
  { value: ACTION_TYPES.SKIP_TO, label: 'Skip to question', icon: SkipForward },
  { value: ACTION_TYPES.REQUIRE, label: 'Make required', icon: Star },
  { value: ACTION_TYPES.UNREQUIRE, label: 'Make optional', icon: Circle }
];

const OPTION_QUESTION_TYPES = new Set(['multiple-choice', 'checkbox', 'dropdown']);

const ConditionValueInput = ({ question, operator, value, onChange }) => {
  if ([CONDITION_TYPES.IS_EMPTY, CONDITION_TYPES.IS_NOT_EMPTY].includes(operator)) {
    return null;
  }

  if (OPTION_QUESTION_TYPES.has(question?.type)) {
    return (
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">Select answer...</option>
        {(question.options || []).map((option, index) => (
          <option key={`${option}-${index}`} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  const inputType = question?.type === 'number' || question?.type === 'rating' || question?.type === 'slider'
    ? 'number'
    : question?.type === 'date'
      ? 'date'
      : question?.type === 'time'
        ? 'time'
        : 'text';

  return (
    <input
      type={inputType}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Answer value..."
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    />
  );
};

const CustomSelect = ({ value, onChange, options, placeholder, className = '', icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="h-4 w-4 text-gray-600 flex-shrink-0" />}
              <span className="text-gray-900 truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    value === option.value 
                      ? 'bg-primary-50 text-primary-900' 
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {option.icon && <option.icon className={`h-4 w-4 flex-shrink-0 ${value === option.value ? 'text-primary-600' : 'text-gray-500'}`} />}
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CustomQuestionSelect = ({ value, onChange, questions, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedQuestion = questions.find(q => q.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${className}`}
      >
        <span className={`truncate flex-1 text-left ${selectedQuestion ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedQuestion ? selectedQuestion.label || 'Untitled' : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto py-1">
              {questions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No questions available</div>
              ) : (
                questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => {
                      onChange(question.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      value === question.id 
                        ? 'bg-primary-50 text-primary-900' 
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                      Q{index + 1}
                    </span>
                    <span className="truncate flex-1">{question.label || 'Untitled'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LogicBuilder = () => {
  const { questions, logicRules = [], updateLogicRules } = useFormBuilderStore();
  const [expandedRule, setExpandedRule] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const addRule = () => {
    const newRule = {
      id: `rule_${Date.now()}`,
      name: `Rule ${logicRules.length + 1}`,
      logicType: 'AND',
      conditions: [
        { questionId: '', operator: CONDITION_TYPES.EQUALS, value: '' }
      ],
      actions: [
        { type: ACTION_TYPES.SHOW, targetQuestionIds: [] }
      ]
    };
    const updatedRules = [...logicRules, newRule];
    updateLogicRules(updatedRules);
    setExpandedRule(newRule.id);
    validateRules(updatedRules);
  };

  const deleteRule = (ruleId) => {
    const updatedRules = logicRules.filter(r => r.id !== ruleId);
    updateLogicRules(updatedRules);
    validateRules(updatedRules);
  };

  const updateRule = (ruleId, updates) => {
    const updatedRules = logicRules.map(r => 
      r.id === ruleId ? { ...r, ...updates } : r
    );
    updateLogicRules(updatedRules);
    validateRules(updatedRules);
  };

  const validateRules = (rules) => {
    const validation = validateLogicRules(rules, questions);
    setValidationErrors(validation.errors);
  };

  const addCondition = (ruleId) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, {
        conditions: [
          ...rule.conditions,
          { questionId: '', operator: CONDITION_TYPES.EQUALS, value: '' }
        ]
      });
    }
  };

  const updateCondition = (ruleId, conditionIndex, updates) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      const conditions = [...rule.conditions];
      conditions[conditionIndex] = { ...conditions[conditionIndex], ...updates };
      const ruleUpdates = { conditions };
      if (conditionIndex === 0 && updates.questionId !== undefined) {
        ruleUpdates.actions = rule.actions.map(action =>
          action.type === ACTION_TYPES.SKIP_TO
            ? { ...action, fromQuestionId: updates.questionId }
            : action
        );
      }
      updateRule(ruleId, ruleUpdates);
    }
  };

  const deleteCondition = (ruleId, conditionIndex) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule && rule.conditions.length > 1) {
      const conditions = rule.conditions.filter((_, i) => i !== conditionIndex);
      updateRule(ruleId, { conditions });
    }
  };

  const addAction = (ruleId) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, {
        actions: [
          ...rule.actions,
          { type: ACTION_TYPES.SHOW, targetQuestionIds: [] }
        ]
      });
    }
  };

  const updateAction = (ruleId, actionIndex, updates) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      const actions = [...rule.actions];
      actions[actionIndex] = { ...actions[actionIndex], ...updates };
      updateRule(ruleId, { actions });
    }
  };

  const deleteAction = (ruleId, actionIndex) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule && rule.actions.length > 1) {
      const actions = rule.actions.filter((_, i) => i !== actionIndex);
      updateRule(ruleId, { actions });
    }
  };

  const getAvailableOperators = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return OPERATOR_OPTIONS;
    
    return OPERATOR_OPTIONS.filter(op => 
      op.types.includes('all') || op.types.includes(question.type)
    );
  };

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Logic Validation Errors</p>
              <ul className="mt-2 space-y-1 text-xs text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {logicRules.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No Logic Rules</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add conditional logic to show/hide questions based on answers
          </p>
          <Button onClick={addRule} size="sm" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Logic Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {logicRules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="w-full flex items-center justify-between p-3 bg-gray-50">
                <button
                  onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  className="flex-1 flex items-center gap-3 hover:bg-gray-100 -m-3 p-3 rounded-lg transition-colors text-left"
                >
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{rule.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} • {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ml-auto ${expandedRule === rule.id ? 'rotate-180' : ''}`}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRule(rule.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {expandedRule === rule.id && (
                <div className="p-4 space-y-4 border-t border-gray-200">
                  {/* Rule Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rule Name</label>
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                        IF Conditions
                      </label>
                      <select
                        value={rule.logicType}
                        onChange={(e) => updateRule(rule.id, { logicType: e.target.value })}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="AND">All match (AND)</option>
                        <option value="OR">Any match (OR)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      {rule.conditions.map((condition, condIndex) => (
                        <div key={condIndex} className="flex gap-2 items-start p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <CustomQuestionSelect
                              value={condition.questionId}
                              onChange={(value) => {
                                const selected = questions.find(question => question.id === value);
                                updateCondition(rule.id, condIndex, {
                                  questionId: value,
                                  operator: selected?.type === 'checkbox' ? CONDITION_TYPES.CONTAINS : CONDITION_TYPES.EQUALS,
                                  value: ''
                                });
                              }}
                              questions={questions.filter(q => q.type !== 'section' && q.type !== 'image')}
                              placeholder="Select question..."
                            />

                            <select
                              value={condition.operator}
                              onChange={(e) => updateCondition(rule.id, condIndex, { operator: e.target.value })}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              disabled={!condition.questionId}
                            >
                              {getAvailableOperators(condition.questionId).map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>

                            <ConditionValueInput
                              question={questions.find(question => question.id === condition.questionId)}
                              operator={condition.operator}
                              value={condition.value}
                              onChange={(value) => updateCondition(rule.id, condIndex, { value })}
                            />
                          </div>
                          
                          {rule.conditions.length > 1 && (
                            <button
                              onClick={() => deleteCondition(rule.id, condIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addCondition(rule.id)}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Condition
                    </button>
                  </div>

                  {/* Actions */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                      THEN Actions
                    </label>
                    <p className="mb-2 text-xs text-gray-500">
                      Questions selected in “Show” stay hidden until the conditions match.
                    </p>
                    
                    <div className="space-y-2">
                      {rule.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex gap-2 items-start p-2 bg-purple-50 rounded-lg">
                          <div className="flex-1 space-y-2">
                            <CustomSelect
                              value={action.type}
                              onChange={(value) => updateAction(rule.id, actionIndex, { type: value })}
                              options={ACTION_OPTIONS}
                              placeholder="Select action..."
                            />

                            {action.type === ACTION_TYPES.SKIP_TO ? (
                              <CustomQuestionSelect
                                value={action.targetQuestionId || ''}
                                onChange={(value) => updateAction(rule.id, actionIndex, { targetQuestionId: value, fromQuestionId: rule.conditions[0]?.questionId })}
                                questions={questions.filter(q => q.type !== 'section')}
                                placeholder="Select question..."
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {questions.filter(q => {
                                  if (q.type === 'section' || q.type === 'image') return false;
                                  const isVisibilityAction = [ACTION_TYPES.SHOW, ACTION_TYPES.HIDE].includes(action.type);
                                  return !isVisibilityAction || !rule.conditions.some(condition => condition.questionId === q.id);
                                }).map(q => (
                                  <label key={q.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs cursor-pointer hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={(action.targetQuestionIds || []).includes(q.id)}
                                      onChange={(e) => {
                                        const ids = action.targetQuestionIds || [];
                                        const newIds = e.target.checked 
                                          ? [...ids, q.id]
                                          : ids.filter(id => id !== q.id);
                                        updateAction(rule.id, actionIndex, { targetQuestionIds: newIds });
                                      }}
                                      className="rounded"
                                    />
                                    <span className="truncate">{q.label || 'Untitled'}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {rule.actions.length > 1 && (
                            <button
                              onClick={() => deleteAction(rule.id, actionIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addAction(rule.id)}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Action
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button onClick={addRule} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Rule
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogicBuilder;
