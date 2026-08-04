import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ViewResponses from './ViewResponses';
import SingleResponse from './SingleResponse';
import Analytics from './Analytics';
import { getForm } from '../../services/formService';
import { getFormResponses } from '../../services/responseService';
import { trackResponseViewed, trackAnalyticsViewed } from '../../services/analyticsService';

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
        const questions = formDoc.questions || [];
        const questionMap = Object.fromEntries(questions.map((q) => [q.id, q.label]));
        
        // Helper to infer question type from answer value
        const inferTypeFromValue = (value) => {
          if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
          if (typeof value === 'number' || !isNaN(Number(value))) return 'number';
          if (Array.isArray(value)) return 'checkbox';
          return 'text';
        };
        
        const enrichedResponses = responseDocs.map((resp) => ({
          ...resp,
          answers: resp.answers?.map((answer, idx) => {
            // First try exact ID match
            if (questionMap[answer.questionId]) {
              return { ...answer, questionLabel: questionMap[answer.questionId] };
            }
            
            // Try type-based matching for unmatched answers
            const inferredType = inferTypeFromValue(answer.value);
            const matchingQuestion = questions.find((q, qIdx) => {
              // Check if this question ID is already matched elsewhere in this response
              const isAlreadyMatched = resp.answers.some(a => a.questionId === q.id);
              if (isAlreadyMatched) return false;
              
              // Match by type
              if (q.type === 'email' && inferredType === 'email') return true;
              if ((q.type === 'number' || q.type === 'rating') && inferredType === 'number') return true;
              if (q.type === 'checkbox' && inferredType === 'checkbox') return true;
              return false;
            });
            
            if (matchingQuestion) {
              return { ...answer, questionLabel: matchingQuestion.label };
            }
            
            // Fallback to index position
            return {
              ...answer,
              questionLabel: questions[idx]?.label || answer.questionId,
            };
          }) || [],
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

  // Handle response updates from SingleResponse
  const handleResponseUpdated = (responseId, updatedAnswers) => {
    setResponses(prev => prev.map(r => {
      if (r.id !== responseId) return r;
      
      // Re-enrich the updated answers with question labels
      const questions = form?.questions || [];
      const questionMap = Object.fromEntries(questions.map((q) => [q.id, q.label]));
      
      const enrichedAnswers = updatedAnswers.map((answer, idx) => ({
        ...answer,
        questionLabel: questionMap[answer.questionId] || questions[idx]?.label || answer.questionId,
      }));
      
      return { ...r, answers: enrichedAnswers, updatedAt: new Date().toISOString() };
    }));
    
    // Update selected response too
    setSelectedResponse(prev => {
      if (prev?.id !== responseId) return prev;
      const questions = form?.questions || [];
      const questionMap = Object.fromEntries(questions.map((q) => [q.id, q.label]));
      
      const enrichedAnswers = updatedAnswers.map((answer, idx) => ({
        ...answer,
        questionLabel: questionMap[answer.questionId] || questions[idx]?.label || answer.questionId,
      }));
      
      return { ...prev, answers: enrichedAnswers, updatedAt: new Date().toISOString() };
    });
  };

  const handleSelectResponse = (response) => {
    setSelectedResponse(response);
    if (response) {
      trackResponseViewed(formId);
    }
  };

  if (!formId) {
    return <p className="text-center text-gray-500">Select a form to view responses.</p>;
  }

  return (
    <div className="space-y-8">
      <ViewResponses
        formId={formId}
        onSelectResponse={handleSelectResponse}
        questions={form?.questions || []}
      />

      <div className="grid lg:grid-cols-[1fr,1fr] gap-6">
        <SingleResponse 
          response={selectedResponse} 
          formId={formId}
          questions={form?.questions || []}
          onResponseUpdated={handleResponseUpdated}
        />
        <Analytics responses={responses} questions={form?.questions || []} />
      </div>
    </div>
  );
};

export default ResponsesDashboard;
