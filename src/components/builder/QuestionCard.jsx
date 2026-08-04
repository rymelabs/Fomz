import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Image as ImageIcon, Loader2, Upload, ChevronDown, GitBranch } from 'lucide-react';
import Input from '../ui/Input';
import Toggle from '../ui/Toggle';
import OptionInput from './OptionInput';
import QuestionToolbar from './QuestionToolbar';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserStore } from '../../store/userStore';

const QUESTION_TYPES = [
  { value: 'short-text', label: 'Short Answer' },
  { value: 'long-text', label: 'Long Answer' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'rating', label: 'Rating' },
  { value: 'slider', label: 'Slider' },
  { value: 'address', label: 'Address' },
  { value: 'image', label: 'Image' },
  { value: 'section', label: 'Section Break' }
];

const SettingsGroup = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="p-3 bg-white border-t border-gray-200 space-y-3">
            {children}
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ question, index, total }) => {
  const {
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    setCurrentQuestion,
    currentQuestionIndex
  } = useFormBuilder();
  
  const { user } = useUserStore();
  const logicRules = useFormBuilderStore((state) => state.logicRules || []);
  const [uploading, setUploading] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');
  const contentRef = useRef(null);

  const isActive = currentQuestionIndex === index;
  const isOptionsQuestion = ['multiple-choice', 'checkbox', 'dropdown'].includes(question.type);
  const isTextQuestion = ['short-text', 'long-text'].includes(question.type);
  const isNumberQuestion = question.type === 'number';
  const isSliderQuestion = question.type === 'slider';
  // Check if this question has any logic rules
  const hasLogicRules = logicRules.some(rule => 
    rule.conditions.some(c => c.questionId === question.id) ||
    rule.actions.some(a => 
      (a.type === 'skip_to' && a.targetQuestionId === question.id) ||
      (a.targetQuestionIds && a.targetQuestionIds.includes(question.id))
    )
  );

  // Animate height changes
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // Add extra padding/margin compensation if needed
          setContentHeight(entry.target.scrollHeight);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, [question.type, isOptionsQuestion, isTextQuestion, isNumberQuestion]);

  const handleQuestionChange = (field, value) => {
    updateQuestion(question.id, { [field]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const path = `form-images/${user.uid}/${question.id}-${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      handleQuestionChange('imageUrl', url);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleTypeChange = (type) => {
    const baseUpdates = { type };

    if (['multiple-choice', 'checkbox', 'dropdown'].includes(type) && !question.options?.length) {
      baseUpdates.options = ['Option 1'];
    }
    
    if (type === 'image') {
      baseUpdates.required = false;
    }

    if (type === 'section') {
      baseUpdates.placeholder = '';
      baseUpdates.required = false;
    }

    updateQuestion(question.id, baseUpdates);
  };

  const handleMoveUp = () => {
    if (index > 0) {
      reorderQuestions(index, index - 1);
      setCurrentQuestion(index - 1);
    }
  };

  const handleMoveDown = () => {
    if (index < total - 1) {
      reorderQuestions(index, index + 1);
      setCurrentQuestion(index + 1);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-300 ease-out ${
        isActive ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3 p-4 rounded-t-xl transition-colors">
        <div className="flex flex-col items-center gap-2">
          <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-grab active:cursor-grabbing" />
        </div>

        <div className="flex-1">
          {/* Question number badge - Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div 
              className={`flex items-center gap-3 flex-1 min-w-0 ${!isActive ? 'cursor-pointer' : ''}`}
              onClick={() => !isActive && setCurrentQuestion(index)}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 shrink-0">
                Q{index + 1}
              </span>

              {/* Collapsed State: Question Text + Badges */}
              {!isActive && (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {question.label || <span className="text-gray-400 italic">Untitled Question</span>}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {question.required && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <span className="text-red-500">*</span> Required
                      </span>
                    )}
                    {hasLogicRules && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700" title="Has conditional logic">
                        <GitBranch className="h-3 w-3" /> Logic
                      </span>
                    )}
                    {question.type === 'section' && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Section Break
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded State: Badges Only */}
              {isActive && (
                <div className="flex items-center gap-2 shrink-0">
                  {question.required && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <span className="text-red-500">*</span> Required
                    </span>
                  )}
                  {hasLogicRules && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700" title="Has conditional logic">
                      <GitBranch className="h-3 w-3" /> Logic
                    </span>
                  )}
                  {question.type === 'section' && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      Section Break
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentQuestion(isActive ? -1 : index);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-300 flex-shrink-0 ${isActive ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          
          {/* Question header - Visible only when active */}
          <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex-1">
              <Input
                label="Question"
                value={question.label}
                onChange={(e) => handleQuestionChange('label', e.target.value)}
                placeholder="Enter your question"
                required
                className="px-3 py-1.5 text-sm"
              />
            </div>
            <div className="md:w-56">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Question type
              </label>
              <select
                value={question.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Animated content container */}
          <div 
            className="overflow-hidden transition-[height] duration-300 ease-out"
            style={{ height: (isActive && question.type !== 'section') ? contentHeight : 0 }}
          >
            <div ref={contentRef} className="space-y-4 pt-4">
              
              {isOptionsQuestion && (
                <OptionInput question={question} />
              )}

              {question.type === 'image' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  {question.imageUrl ? (
                    <div className="relative rounded-lg border border-gray-200 overflow-hidden group">
                      <img 
                        src={question.imageUrl} 
                        alt="Question" 
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                          <Upload className="h-4 w-4 text-gray-700" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-500">
                          {uploading ? 'Uploading...' : 'Click to upload image'}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              )}

              <SettingsGroup title="General Settings" defaultOpen={true}>
                <Input
                  label="Help text"
                  value={question.helpText}
                  onChange={(e) => handleQuestionChange('helpText', e.target.value)}
                  placeholder="Optional description"
                  className="px-3 py-1.5 text-sm"
                />

                {isTextQuestion && (
                  <Input
                    label="Placeholder"
                    value={question.placeholder}
                    onChange={(e) => handleQuestionChange('placeholder', e.target.value)}
                    placeholder="Your answer"
                    className="px-3 py-1.5 text-sm"
                  />
                )}

                <Toggle
                  label="Required question"
                  checked={question.required}
                  onChange={(checked) => handleQuestionChange('required', checked)}
                  description="Respondents must answer before continuing"
                />
              </SettingsGroup>

              {/* Text Validation */}
              {isTextQuestion && (
                <SettingsGroup title="Text Validation">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Min Length"
                      type="number"
                      min="0"
                      placeholder="No minimum"
                      value={question.validation?.minLength ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        minLength: e.target.value ? parseInt(e.target.value) : ''
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                    <Input
                      label="Max Length"
                      type="number"
                      min="0"
                      placeholder="No maximum"
                      value={question.validation?.maxLength ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        maxLength: e.target.value ? parseInt(e.target.value) : ''
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                    <select
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={question.validation?.pattern ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        pattern: e.target.value,
                        patternName: e.target.options[e.target.selectedIndex].text
                      })}
                    >
                      <option value="">No pattern validation</option>
                      <option value="^[a-zA-Z\s]+$">Letters only</option>
                      <option value="^[0-9]+$">Numbers only</option>
                      <option value="^[a-zA-Z0-9]+$">Alphanumeric</option>
                      <option value="^[A-Z][a-zA-Z]*$">Capitalize first letter</option>
                      <option value="^https?:\/\/.+$">URL</option>
                      <option value="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$">Hex Color</option>
                    </select>
                  </div>
                  <Input
                    label="Custom Error Message"
                    type="text"
                    placeholder="Enter a custom error message"
                    value={question.validation?.errorMessage ?? ''}
                    onChange={(e) => handleQuestionChange('validation', {
                      ...question.validation,
                      errorMessage: e.target.value
                    })}
                    className="px-3 py-1.5 text-sm"
                  />
                </SettingsGroup>
              )}

              {/* Number Validation */}
              {isNumberQuestion && (
                <SettingsGroup title="Number Validation">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Minimum"
                      type="number"
                      placeholder="No min"
                      value={question.validation?.min ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        min: e.target.value
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                    <Input
                      label="Maximum"
                      type="number"
                      placeholder="No max"
                      value={question.validation?.max ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        max: e.target.value
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                    <Input
                      label="Step"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="1"
                      value={question.validation?.step ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        step: e.target.value
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Toggle
                    label="Allow decimals"
                    checked={question.validation?.allowDecimals ?? true}
                    onChange={(checked) => handleQuestionChange('validation', {
                      ...question.validation,
                      allowDecimals: checked
                    })}
                  />
                  <Input
                    label="Custom Error Message"
                    type="text"
                    placeholder="Enter a custom error message"
                    value={question.validation?.errorMessage ?? ''}
                    onChange={(e) => handleQuestionChange('validation', {
                      ...question.validation,
                      errorMessage: e.target.value
                    })}
                    className="px-3 py-1.5 text-sm"
                  />
                </SettingsGroup>
              )}

              {/* Slider Configuration */}
              {isSliderQuestion && (
                <SettingsGroup title="Slider Settings">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Min Value"
                      type="number"
                      placeholder="0"
                      value={question.validation?.min ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        min: e.target.value ? parseInt(e.target.value) : ''
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                    <Input
                      label="Max Value"
                      type="number"
                      placeholder="100"
                      value={question.validation?.max ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        max: e.target.value ? parseInt(e.target.value) : ''
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                    <Input
                      label="Step"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={question.validation?.step ?? ''}
                      onChange={(e) => handleQuestionChange('validation', {
                        ...question.validation,
                        step: e.target.value ? parseInt(e.target.value) : ''
                      })}
                      className="px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Toggle
                    label="Show tick marks"
                    checked={question.validation?.showTicks ?? true}
                    onChange={(checked) => handleQuestionChange('validation', {
                      ...question.validation,
                      showTicks: checked
                    })}
                  />
                  <Input
                    label="Unit Label (optional)"
                    type="text"
                    placeholder="e.g., %, points, years"
                    value={question.validation?.unit ?? ''}
                    onChange={(e) => handleQuestionChange('validation', {
                      ...question.validation,
                      unit: e.target.value
                    })}
                    className="px-3 py-1.5 text-sm"
                  />
                </SettingsGroup>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t border-gray-200 px-4 py-3 flex items-center justify-between transition-all duration-300 ${isActive ? 'opacity-100' : 'hidden opacity-0'}`}>
        <p className="text-xs text-gray-400">
          {index + 1} of {total} • {QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}
        </p>
        <QuestionToolbar
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDuplicate={() => duplicateQuestion(question.id)}
          onDelete={() => deleteQuestion(question.id)}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
    </div>
  );
};

export default QuestionCard;
