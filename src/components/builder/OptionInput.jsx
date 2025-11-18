import React from 'react';
import { Plus, GripVertical, X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useFormBuilder } from '../../hooks/useFormBuilder';

const OptionInput = ({ question, disabled = false }) => {
  const { addOption, updateOption, deleteOption } = useFormBuilder();

  if (!Array.isArray(question.options)) {
    return null;
  }

  const handleAddOption = () => addOption(question.id);
  const handleUpdateOption = (index, value) => updateOption(question.id, index, value);
  const handleDeleteOption = (index) => deleteOption(question.id, index);

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <div key={index} className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-gray-400" />
          <Input
            value={option}
            onChange={(e) => handleUpdateOption(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1"
            disabled={disabled}
          />
          {question.options.length > 1 && (
            <button
              type="button"
              onClick={() => handleDeleteOption(index)}
              className="text-gray-400 hover:text-red-500"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        disabled={disabled}
        className="mt-2"
        icon={Plus}
      >
        Add option
      </Button>
    </div>
  );
};

export default OptionInput;
