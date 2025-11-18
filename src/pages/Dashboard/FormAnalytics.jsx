import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getUserForms } from '../../services/formService';
import { getFormResponses } from '../../services/responseService';
import ResponseAnalytics from '../../pages/Responses/Analytics';
import { useUserStore } from '../../store/userStore';

const FormAnalytics = () => {
  const { formId } = useParams();
  const { user } = useUserStore();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState('');
  const [stats, setStats] = useState({ totalResponses: 0 });
  const [selectedResponse, setSelectedResponse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadForm = async () => {
      if (!user || !formId) return;
      setLoading(true);
      try {
        const forms = await getUserForms(user.uid);
        const selectedForm = forms.find(f => f.id === formId);
        if (!selectedForm) {
          navigate('/dashboard/analytics');
          return;
        }
        setForm(selectedForm);
      } catch (error) {
        console.error('Failed to load form', error);
        navigate('/dashboard/analytics');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [user, formId, navigate]);

  useEffect(() => {
    if (!formId) return;

    let isMounted = true;
    setResponseLoading(true);
    setResponseError('');

    const loadResponses = async () => {
      try {
        const data = await getFormResponses(formId);
        if (!isMounted) return;
        setResponses(data);
        setStats({
          totalResponses: data.length,
          lastResponse: data[0]?.submittedAt || null,
          firstResponse: data[data.length - 1]?.submittedAt || null
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load responses for form', formId, error);
        setResponseError('Unable to load responses right now.');
      } finally {
        if (isMounted) setResponseLoading(false);
      }
    };

    loadResponses();
    return () => {
      isMounted = false;
    };
  }, [formId]);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  const downloadCSV = () => {
    if (!responses.length || !form) return;

    // Headers
    const headers = ['Submission Date', ...form.questions.map(q => q.label)];
    
    // Rows
    const rows = responses.map(response => {
      const date = new Date(response.submittedAt).toLocaleString();
      const answers = form.questions.map(q => {
        const answer = response.answers?.[q.id];
        let formattedAnswer = '';
        if (Array.isArray(answer)) {
          formattedAnswer = answer.join(', ');
        } else if (answer !== null && answer !== undefined) {
          formattedAnswer = answer.toString();
        }
        // Escape quotes and wrap in quotes
        return `"${formattedAnswer.replace(/"/g, '""')}"`;
      });
      return [`"${date}"`, ...answers].join(',');
    });

    const csvContent = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-24">
        <h3 className="font-display text-3xl text-gray-900 mb-4">Form not found</h3>
        <p className="text-gray-600 mb-8">The form you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/dashboard/analytics')}>Back to Analytics</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/analytics')}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-3xl text-gray-900 md:text-4xl">{form.title}</h1>
            <p className="text-gray-500">Analytics & Insights</p>
          </div>
        </div>
        <div className="flex gap-3">
           {/* Actions like Export could go here */}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Stats & Recent - Sticky on Desktop */}
        <div className="space-y-6 lg:col-span-1">
          {/* Key Stats Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Total Responses</p>
            <p className="mt-2 font-display text-5xl text-gray-900">{stats.totalResponses}</p>
            
            <div className="mt-6 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-400">Last Submission</p>
                <p className="font-medium text-gray-700">{formatDate(stats.lastResponse)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">First Submission</p>
                <p className="font-medium text-gray-700">{formatDate(stats.firstResponse)}</p>
              </div>
            </div>
          </div>

          {/* Recent Submissions Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-6 backdrop-blur max-h-[500px] overflow-y-auto custom-scrollbar">
            <h3 className="font-display text-xl text-gray-900 mb-4">Recent Activity</h3>
            {responseLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : responses.length === 0 ? (
              <p className="text-gray-500 text-sm">No responses yet.</p>
            ) : (
              <div className="space-y-4">
                {responses.slice(0, 10).map((response, idx) => (
                  <div key={response.id || idx} className="rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Submission #{responses.length - idx}</span>
                      <span className="text-xs text-gray-500">{new Date(response.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 mb-3">
                      {form.questions?.slice(0, 2).map((question) => {
                        const answer = response.answers?.[question.id];
                        return (
                          <div key={question.id} className="text-xs">
                            <span className="font-medium text-gray-700">{question.label}:</span>
                            <span className="text-gray-600 ml-1">
                              {Array.isArray(answer) ? answer.join(', ') : answer || 'No answer'}
                            </span>
                          </div>
                        );
                      })}
                      {form.questions?.length > 2 && (
                        <p className="text-xs text-gray-400">+{form.questions.length - 2} more questions</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedResponse(response)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Full Response →
                    </button>
                  </div>
                ))}
                {responses.length > 10 && (
                  <p className="text-center text-xs text-gray-400 pt-2">+{responses.length - 10} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {form.questions && (
            <div className="rounded-3xl border border-gray-200/80 bg-white/60 p-6 backdrop-blur">
              <h3 className="font-display text-2xl text-gray-900 mb-6">Question Analysis</h3>
              <ResponseAnalytics responses={responses} questions={form.questions} />
            </div>
          )}
        </div>
      </div>

      {/* All Responses Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-6 backdrop-blur overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl text-gray-900">All Responses</h3>
          <div className="text-sm text-gray-500">
            {responses.length} total
          </div>
        </div>
        
        {responses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No responses to display yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-xl">Date</th>
                  {form.questions?.map((q) => (
                    <th key={q.id} className="px-4 py-3 font-medium whitespace-nowrap min-w-[200px]">
                      {q.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responses.map((response) => (
                  <tr key={response.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {new Date(response.submittedAt).toLocaleString()}
                    </td>
                    {form.questions?.map((q) => {
                      const answer = response.answers?.[q.id];
                      return (
                        <td key={q.id} className="px-4 py-3 max-w-[200px] truncate text-gray-600">
                          {Array.isArray(answer) ? answer.join(', ') : answer?.toString() || '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedResponse(response)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors bg-white"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={downloadCSV}
          disabled={responses.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-display text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
        >
          <span className="text-xl">↓</span>
          Download Responses (CSV)
        </button>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200/80 bg-white/95 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-gray-900">Submission Details</h3>
              <button
                onClick={() => setSelectedResponse(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}</p>
              {form.questions?.map((question) => {
                const answer = selectedResponse.answers?.[question.id];
                return (
                  <div key={question.id} className="rounded-xl bg-gray-50 p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{question.label}</h4>
                    <p className="text-gray-700">
                      {Array.isArray(answer) ? answer.join(', ') : answer || 'No answer provided'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormAnalytics;