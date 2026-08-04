import React, { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import { updateResponse } from '../../services/responseService';
import toast from 'react-hot-toast';

const SingleResponse = ({ response, formId, questions = [], onResponseUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState([]);
  const [saving, setSaving] = useState(false);

  // Reset edited answers when response changes
  useEffect(() => {
    if (response?.answers) {
      setEditedAnswers(response.answers.map(a => ({ ...a })));
    }
    setIsEditing(false);
  }, [response?.id]);

  if (!response) {
    return (
      <Card>
        <p className="text-gray-500">Select a response to inspect answers question by question.</p>
      </Card>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel - reset to original
      setEditedAnswers(response.answers.map(a => ({ ...a })));
    }
    setIsEditing(!isEditing);
  };

  const handleAnswerChange = (index, newValue) => {
    setEditedAnswers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });
  };

  const handleArrayAnswerChange = (index, newValue) => {
    // For checkbox/multi-select, split by comma
    const arrayValue = newValue.split(',').map(v => v.trim()).filter(Boolean);
    handleAnswerChange(index, arrayValue);
  };

  const handleSave = async () => {
    if (!formId || !response.id) {
      toast.error('Unable to save - missing form or response ID');
      return;
    }

    setSaving(true);
    try {
      await updateResponse(formId, response.id, { answers: editedAnswers });
      toast.success('Response updated successfully');
      setIsEditing(false);
      
      // Notify parent to refresh responses
      if (onResponseUpdated) {
        onResponseUpdated(response.id, editedAnswers);
      }
    } catch (error) {
      console.error('Failed to update response:', error);
      toast.error('Failed to update response');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="!p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Response ID</p>
            <p className="text-xs font-mono font-medium text-gray-600 select-all">{response.id}</p>
          </div>
          <div className="h-6 w-px bg-gray-100"></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Submitted</p>
            <p className="text-xs font-medium text-gray-600">
              {new Date(response.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        {formId && (
          <button
            onClick={handleEditToggle}
            className={`p-1.5 rounded-lg transition-all ${
              isEditing 
                ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title={isEditing ? 'Cancel editing' : 'Edit response'}
          >
            {isEditing ? <X size={14} /> : <Pencil size={14} />}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {editedAnswers.map((answer, idx) => (
          <div key={answer.questionId || idx} className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">
              {answer.questionLabel || questions[idx]?.label || answer.questionId}
            </p>
            
            {isEditing ? (
              <div>
                {Array.isArray(answer.value) ? (
                  <input
                    type="text"
                    value={answer.value.join(', ')}
                    onChange={(e) => handleArrayAnswerChange(idx, e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-primary-500"
                    placeholder="Separate multiple values with commas"
                  />
                ) : (
                  <input
                    type="text"
                    value={answer.value || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-primary-500"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-900 break-words">
                {Array.isArray(answer.value) ? answer.value.join(', ') : answer.value || '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleEditToggle}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {response.updatedAt && (
        <p className="mt-4 text-xs text-gray-400">
          Last edited: {new Date(response.updatedAt).toLocaleString()}
        </p>
      )}
    </Card>
  );
};

export default SingleResponse;
