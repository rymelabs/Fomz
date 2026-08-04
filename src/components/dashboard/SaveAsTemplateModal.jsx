import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { saveAsTemplate } from '../../services/templateService';
import { useUserStore } from '../../store/userStore';

const SaveAsTemplateModal = ({ isOpen, onClose, form, onSaved }) => {
  const { user } = useUserStore();
  const [name, setName] = useState(form?.title || '');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }

    if (!user?.uid) {
      setError('You must be logged in to save templates');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const savedTemplate = await saveAsTemplate(user.uid, name.trim(), description.trim(), form);
      onSaved?.(savedTemplate);
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Save as Template"
    >
      <div className="space-y-4">
        {/* Form Preview */}
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-500 mb-1">Current form:</p>
          <p className="font-medium text-gray-900">{form?.title || 'Untitled Form'}</p>
          <p className="text-xs text-gray-500 mt-1">
            {form?.questions?.length || 0} questions
          </p>
        </div>

        {/* Template Details */}
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveAsTemplateModal;
