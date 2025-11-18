import React from 'react';
import Card from '../../components/ui/Card';

const SingleResponse = ({ response }) => {
  if (!response) {
    return (
      <Card>
        <p className="text-gray-500">Select a response to inspect answers question by question.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between mb-6">
        <div>
          <p className="text-sm text-gray-400 uppercase">Response ID</p>
          <p className="text-lg font-semibold text-gray-900">{response.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 uppercase">Submitted</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(response.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {response.answers?.map((answer) => (
          <div key={answer.questionId} className="p-4 border border-gray-100 rounded-xl">
            <p className="text-sm font-semibold text-gray-900">{answer.questionLabel || answer.questionId}</p>
            <p className="text-gray-600 mt-2">
              {Array.isArray(answer.value) ? answer.value.join(', ') : answer.value || '—'}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SingleResponse;
