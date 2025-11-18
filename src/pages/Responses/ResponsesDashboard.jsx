import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ViewResponses from './ViewResponses';
import SingleResponse from './SingleResponse';
import Analytics from './Analytics';
import { getForm } from '../../services/formService';
import { getFormResponses } from '../../services/responseService';

const ResponsesDashboard = () => {
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formId } = useParams();

  useEffect(() => {
    const load = async () => {
      if (!formId) return;
      try {
        setLoading(true);
        const [formDoc, responseDocs] = await Promise.all([
          getForm(formId),
          getFormResponses(formId)
        ]);
        const questionMap = Object.fromEntries((formDoc.questions || []).map((q) => [q.id, q.label]));
        const enrichedResponses = responseDocs.map((resp) => ({
          ...resp,
          answers: resp.answers?.map((answer) => ({
            ...answer,
            questionLabel: questionMap[answer.questionId] || answer.questionId,
          })) || [],
        }));

        setForm(formDoc);
        setResponses(enrichedResponses);
        setSelectedResponse(enrichedResponses[0] || null);
      } catch (error) {
        console.error('Failed to load responses dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [formId]);

  if (!formId) {
    return <p className="text-center text-gray-500">Select a form to view responses.</p>;
  }

  return (
    <div className="space-y-8">
      <ViewResponses
        formId={formId}
        onSelectResponse={setSelectedResponse}
      />

      <div className="grid lg:grid-cols-[1fr,1fr] gap-6">
        <SingleResponse response={selectedResponse} />
        <Analytics responses={responses} questions={form?.questions || []} />
      </div>
    </div>
  );
};

export default ResponsesDashboard;
