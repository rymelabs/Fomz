import React from 'react';
import GradientPanel from '../../components/ui/GradientPanel';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useTheme } from '../../hooks/useTheme';

const Preview = () => {
  const { title, description, questions } = useFormBuilder();
  const { themeData } = useTheme();

  return (
    <GradientPanel
      gradient={themeData ? null : 'soft'}
      className="min-h-screen py-16"
      style={themeData ? { background: themeData.gradient } : undefined}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center text-white mb-12">
          <p className="text-sm uppercase tracking-wide font-semibold">Live preview</p>
          <h1 className="text-4xl font-display mt-2">{title || 'Untitled form'}</h1>
          <p className="text-white/80 mt-4">{description || 'Form description will appear here.'}</p>
        </div>

        <Card className="bg-white/95">
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-100 pb-6 last:border-none last:pb-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">Question {index + 1}</p>
                <h3 className="text-lg font-semibold text-gray-900 mt-2">{question.label || 'Untitled question'}</h3>
                {question.helpText && <p className="text-sm text-gray-500 mt-1">{question.helpText}</p>}
                <div className="mt-3">
                  <div className="h-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                    Input placeholder
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="mt-8 w-full">Submit response</Button>
        </Card>
      </div>
    </GradientPanel>
  );
};

export default Preview;
