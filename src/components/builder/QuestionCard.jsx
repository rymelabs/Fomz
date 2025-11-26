import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import Input from '../ui/Input';
import Toggle from '../ui/Toggle';
import OptionInput from './OptionInput';
import QuestionToolbar from './QuestionToolbar';
import { useFormBuilder } from '../../hooks/useFormBuilder';
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
  { value: 'date', label: 'Date' },
  { value: 'rating', label: 'Rating' },
  { value: 'image', label: 'Image' },
  { value: 'section', label: 'Section Break' }
];

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
  const [uploading, setUploading] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');
  const contentRef = useRef(null);

  const isActive = currentQuestionIndex === index;
  const isOptionsQuestion = ['multiple-choice', 'checkbox', 'dropdown'].includes(question.type);
  const isTextQuestion = ['short-text', 'long-text'].includes(question.type);
  const isNumberQuestion = question.type === 'number';

  // Animate height changes
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContentHeight(entry.contentRect.height);
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
      onClick={() => setCurrentQuestion(index)}
    >
      <div className="flex items-start gap-3 p-4">
        <GripVertical className="h-5 w-5 text-gray-400 mt-2" />

        <div className="flex-1">
          {/* Question header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            style={{ height: question.type === 'section' ? 0 : contentHeight }}
          >
            <div ref={contentRef} className="space-y-4 pt-4">
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

              {isNumberQuestion && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Minimum"
                    type="number"
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
                    value={question.validation?.max ?? ''}
                    onChange={(e) => handleQuestionChange('validation', {
                      ...question.validation,
                      max: e.target.value
                    })}
                    className="px-3 py-1.5 text-sm"
                  />
                </div>
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

              {isOptionsQuestion && (
                <OptionInput question={question} />
              )}

              <Toggle
                label="Required question"
                checked={question.required}
                onChange={(checked) => handleQuestionChange('required', checked)}
                description="Respondents must answer before continuing"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">Question {index + 1}</p>
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
