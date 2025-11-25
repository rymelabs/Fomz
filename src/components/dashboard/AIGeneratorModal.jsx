import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, X, Loader2, Feather, Mic, MicOff } from 'lucide-react';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const AIGeneratorModal = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const { generateForm, isGenerating } = useFormBuilderStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setError(null);
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [isOpen]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setIsListening(true);
    rec.onerror = () => {
      setIsListening(false);
      setError('Voice input encountered an issue. Please type your prompt.');
      setInterimTranscript('');
    };
    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        } else {
          interimText += res[0].transcript;
        }
      }

      if (finalText.trim()) {
        setPrompt((prev) => {
          const base = prev ? `${prev.trim()} ` : '';
          return `${base}${finalText.trim()}`;
        });
      }
      setInterimTranscript(interimText.trim());
    };

    recognitionRef.current = rec;
    return () => {
      rec.abort();
    };
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      recognitionRef.current.start();
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/10 shadow-2xl animate-scale-in backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 opacity-70" />
        <div className="relative grid gap-0 md:grid-cols-[1.2fr,0.8fr]">
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Feather className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-semibold text-gray-900">Create with Fomzy</h2>
                  <p className="text-xs uppercase text-gray-500 font-semibold">AI quill companion</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                disabled={isGenerating}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/10 px-4 py-3">
              <p className="text-sm text-gray-700">
                Describe the form you want. Fomzy will suggest sections, questions, and a fitting theme.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 border border-blue-100">
                  <Sparkles className="h-3 w-3" />
                  Sections & questions
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 border border-blue-100">
                  Theme match
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A customer satisfaction survey for a coffee shop with ratings, a comment box, and contact details."
                className="w-full h-32 md:h-40 pr-12 p-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-sm outline-none"
                disabled={isGenerating}
              />
              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={isGenerating}
                  className={`absolute right-3 top-3 p-2 rounded-full transition ${
                    isListening
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              ) : (
                <div className="absolute right-3 top-3 text-xs text-gray-400">
                  Voice not supported
                </div>
              )}
            </div>

            {interimTranscript && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Listening: {interimTranscript}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {isGenerating ? (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-blue-500" />
                  <span className="font-medium">Fomzy is drafting your form...</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Tip: Include tone, audience, or required fields (e.g., “use a playful tone, collect email and rating”).
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
                  className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-md hover:shadow-xl transition"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 border-l border-gray-200 bg-white/60 p-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
              <p className="text-xs font-semibold">What Fomzy can do</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Draft sections & sensible question types
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Propose themes that match the brief
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Ensure required fields where appropriate
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
              <p className="text-xs font-semibold">Suggestions</p>
              <p className="text-xs mt-2">Include audience, tone, required fields, and any branching logic you want.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;
