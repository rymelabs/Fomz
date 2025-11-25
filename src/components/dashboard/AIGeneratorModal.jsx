import React, { useEffect, useState } from 'react';
import { Sparkles, X, Loader2, Feather } from 'lucide-react';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const AIGeneratorModal = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const { generateForm, isGenerating } = useFormBuilderStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);

    try {
      const success = await generateForm(prompt);
      if (success) {
        navigate('/builder', { state: { fromAI: true } });
        onClose();
      } else {
        setError('Unable to generate form right now. Please try again.');
      }
    } catch (err) {
      console.error('AI generation failed', err);
      setError('Something went wrong while talking to the AI. Try again in a moment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-scale-in relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-100 blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-100 blur-3xl opacity-50"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Feather className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Create with Fomzy</h2>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-semibold">AI quill companion</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              disabled={isGenerating}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-4 text-sm">
            Describe the form you want to create, and Fomzy will draft sections, questions, and a theme for you.
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A customer satisfaction survey for a coffee shop with rating questions and a comment box..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-sm mb-4 outline-none"
            disabled={isGenerating}
          />

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="mb-4 flex items-center gap-2 text-sm text-purple-700">
              <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-purple-500"></span>
              <span className="font-medium">Thinking up fields, questions, and options...</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Form
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;
