import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AIGeneratorModal from '../../components/dashboard/AIGeneratorModal';
import { useFormBuilder } from '../../hooks/useFormBuilder';

const CreateForm = () => {
  const navigate = useNavigate();
  const { title, description, updateFormInfo, addQuestion, generateForm, isGenerating } = useFormBuilder();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const handleCreate = () => {
    addQuestion('short-text');
    navigate('/builder', { state: { title, description } });
  };

  const handleCreateWithAI = async () => {
    if (!title.trim() && !description.trim()) {
      setIsAIModalOpen(true);
      return;
    }

    const prompt = `Create a form${title.trim() ? ` with title: "${title.trim()}"` : ''}${description.trim() ? ` and description: "${description.trim()}"` : ''}. Include relevant sections and questions.`;

    const success = await generateForm(prompt);
    if (success) {
      navigate('/builder', { state: { fromAI: true } });
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-2 text-sm text-gray-500 transition-all mb-4"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition">
            <ArrowLeft className="h-4 w-4" />
          </span>
          Back to dashboard
        </button>
        <h1 className="font-display text-2xl text-gray-900 font-bold">Create a new form</h1>
        <p className="mt-2 text-gray-600 text-xs">Start by giving your form a name and description.</p>
      </div>

      <div className="rounded-3xl border border-black/20 bg-white/10 p-6 backdrop-blur animate-slide-up transition-all" style={{ animationDelay: '200ms' }}>
        <div className="space-y-4">
          <Input
            label="Form Title"
            value={title}
            onChange={(e) => updateFormInfo({ title: e.target.value })}
            placeholder="e.g., Customer Feedback Survey"
            className="bg-transparent border rounded-full focus:border-gray-300 focus:bg-white text-sm"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => updateFormInfo({ description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border border-gray-300 rounded-xl bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white resize-none text-sm"
              placeholder="Describe what this form is about..."
            />
          </div>

          <div className="pt-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm" className="w-full md:w-auto transition-transform active:scale-95 text-sm">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWithAI} 
              disabled={isGenerating}
              className="w-full md:w-auto inline-flex justify-center items-center gap-2 rounded-full border border-sky-500 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 active:scale-95"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-sky-600" />}
              Create with Fomzy
            </Button>
            <Button onClick={handleCreate} variant="outline" size="sm" className="w-full md:w-auto border-black text-black transition-all active:scale-95 text-sm">
              Start Building
            </Button>
          </div>
        </div>
      </div>

      <AIGeneratorModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </div>
  );
};

export default CreateForm;






