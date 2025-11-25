import React, { useMemo } from 'react';
import Card from '../../components/ui/Card';
import { analyzeResponses } from '../../services/responseService';

const Analytics = ({ responses = [], questions = [] }) => {
  const analysis = useMemo(() => analyzeResponses(responses, questions), [responses, questions]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {questions.map((question) => {
        const data = analysis.questionAnalysis[question.id];
        return (
          <Card key={question.id} className="!rounded-3xl border border-gray-200/80 bg-white/80 backdrop-blur p-5 transition-all !shadow-none">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{question.type}</h4>
            <h3 className="text-base font-display text-gray-900 mb-3">{question.label}</h3>
            {data?.type === 'distribution' && (
              <div className="mt-4 space-y-3">
                {Object.entries(data.counts).map(([option, count]) => (
                  <div key={option}>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{option}</span>
                      <span>{count} ({data.percentage?.[option] || 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-1">
                      <div
                        className="h-2 bg-primary-500 rounded-full"
                        style={{ width: `${data.percentage?.[option] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data?.type === 'rating' && (
              <div className="mt-4">
                <p className="text-4xl font-bold text-primary-600">{data.average}</p>
                <p className="text-sm text-gray-500">Average rating</p>
              </div>
            )}

            {data?.type === 'number' && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{data.min}</p>
                  <p className="text-xs text-gray-500">Min</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{data.average}</p>
                  <p className="text-xs text-gray-500">Avg</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{data.max}</p>
                  <p className="text-xs text-gray-500">Max</p>
                </div>
              </div>
            )}

            {data?.type === 'text' && (
              <div className="mt-4 space-y-3">
                {data.responses.slice(0, 3).map((resp, idx) => (
                  <p key={idx} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{resp}</p>
                ))}
                {data.responses.length > 3 && (
                  <p className="text-xs text-gray-400">+{data.responses.length - 3} more responses</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default Analytics;
