import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Check, X, Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getUserForms } from '../../services/formService';
import { getFormResponses, updateResponse, exportToExcel } from '../../services/responseService';
import ResponseAnalytics from '../../pages/Responses/Analytics';
import { TimelineChart, DeviceStats, ResponsePatterns, CompletionRate, DateRangePicker, QuestionStats } from '../../components/analytics/AnalyticsCharts';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';
import { trackExportData, trackResponseViewed } from '../../services/analyticsService';

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
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState([]);
  const [savingResponse, setSavingResponse] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const exportMenuRef = useRef(null);
  const navigate = useNavigate();

  // Filter responses by date range
  const filteredResponses = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return responses;
    
    return responses.filter(r => {
      const date = new Date(r.submittedAt);
      if (dateRange.start && date < dateRange.start) return false;
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (date > endOfDay) return false;
      }
      return true;
    });
  }, [responses, dateRange]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const cleanResponses = (data || []).filter((r) => {
          if (!r || !r.submittedAt) return false;
          if (!Array.isArray(r.answers)) return false;
          return r.answers.some((a) => {
            const val = a?.value;
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== null && val !== '';
          });
        });

        setResponses(cleanResponses);
        setStats({
          totalResponses: cleanResponses.length,
          lastResponse: cleanResponses[0]?.submittedAt || null,
          firstResponse: cleanResponses[cleanResponses.length - 1]?.submittedAt || null
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

  // Get answer value with smart fallback matching
  // Priority: 1) exact questionId match, 2) same type + similar label, 3) same type at same index
  const getAnswerValue = (response, question, questionIndex) => {
    if (!response?.answers || !Array.isArray(response.answers)) {
      return response?.answers?.[question.id] ?? null;
    }
    
    // First try to match by exact questionId
    const exactMatch = response.answers.find(a => a.questionId === question.id);
    if (exactMatch) return exactMatch.value;
    
    // Build a map of which answer indices are already matched to current questions
    const usedIndices = new Set();
    form.questions?.forEach(q => {
      const idx = response.answers.findIndex(a => a.questionId === q.id);
      if (idx !== -1) usedIndices.add(idx);
    });
    
    // Get unmatched answers (old responses with different question IDs)
    const unmatchedAnswers = response.answers
      .map((a, idx) => ({ ...a, originalIndex: idx }))
      .filter((_, idx) => !usedIndices.has(idx));
    
    if (unmatchedAnswers.length === 0) return null;
    
    // Try to find by question type - for unique types like email, this is reliable
    const sameTypeAnswers = unmatchedAnswers.filter(a => {
      // Infer type from the answer's original question if possible
      // For email, check if the value looks like an email
      if (question.type === 'email') {
        const val = a.value;
        return typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      // For number/rating, check if value is numeric
      if (question.type === 'number' || question.type === 'rating') {
        return typeof a.value === 'number' || !isNaN(Number(a.value));
      }
      // For arrays (checkbox), match arrays
      if (question.type === 'checkbox') {
        return Array.isArray(a.value);
      }
      return true; // For text types, can't distinguish easily
    });
    
    // If we found exactly one match by type inference, use it
    if (sameTypeAnswers.length === 1) {
      return sameTypeAnswers[0].value;
    }
    
    // For email specifically, if multiple emails exist, try matching by index among unmatched
    if (question.type === 'email' && sameTypeAnswers.length > 0) {
      // Find which email field index this is among all email fields
      const emailQuestionIndices = form.questions
        ?.map((q, i) => q.type === 'email' ? i : -1)
        .filter(i => i !== -1) || [];
      const thisEmailIndex = emailQuestionIndices.indexOf(questionIndex);
      if (thisEmailIndex !== -1 && sameTypeAnswers[thisEmailIndex]) {
        return sameTypeAnswers[thisEmailIndex].value;
      }
    }
    
    // Last resort: use positional matching among unmatched answers
    const positionInUnmatched = questionIndex - usedIndices.size;
    if (positionInUnmatched >= 0 && unmatchedAnswers[positionInUnmatched]) {
      return unmatchedAnswers[positionInUnmatched].value;
    }
    
    return null;
  };

  // Response editing functions
  const startEditingResponse = () => {
    if (!selectedResponse?.answers) return;
    // Build editable answers array with values matched to current questions
    const editableAnswers = form.questions.map((q, idx) => ({
      questionId: q.id,
      questionLabel: q.label,
      value: getAnswerValue(selectedResponse, q, idx) ?? ''
    }));
    setEditedAnswers(editableAnswers);
    setIsEditingResponse(true);
  };

  const cancelEditingResponse = () => {
    setIsEditingResponse(false);
    setEditedAnswers([]);
  };

  const handleEditAnswerChange = (index, newValue) => {
    setEditedAnswers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });
  };

  const handleEditArrayAnswerChange = (index, newValue) => {
    const arrayValue = newValue.split(',').map(v => v.trim()).filter(Boolean);
    handleEditAnswerChange(index, arrayValue);
  };

  const saveEditedResponse = async () => {
    if (!formId || !selectedResponse?.id) return;
    
    setSavingResponse(true);
    try {
      await updateResponse(formId, selectedResponse.id, { answers: editedAnswers });
      
      // Update local state
      const updatedResponse = { 
        ...selectedResponse, 
        answers: editedAnswers,
        updatedAt: new Date().toISOString()
      };
      
      setResponses(prev => prev.map(r => 
        r.id === selectedResponse.id ? updatedResponse : r
      ));
      setSelectedResponse(updatedResponse);
      setIsEditingResponse(false);
      setEditedAnswers([]);
      
      toast.success('Response updated successfully');
    } catch (error) {
      console.error('Failed to update response:', error);
      toast.error('Failed to update response');
    } finally {
      setSavingResponse(false);
    }
  };

  const handleExportExcel = async () => {
    if (!responses.length || !form) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      trackExportData('excel', 'form_responses', responses.length);
      const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses`;
      await exportToExcel(responses, form.questions, filename);
      toast.success('Excel file downloaded!');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = () => {
    if (!responses.length || !form) return;
    setShowExportMenu(false);

    // Track the export
    trackExportData('csv', 'form_responses', responses.length);

    // Headers
    const headers = ['Submission Date', ...form.questions.map(q => q.label)];
    
    // Rows
    const rows = responses.map(response => {
      const date = new Date(response.submittedAt).toLocaleString();
      const answers = form.questions.map((q, qIdx) => {
        const answer = getAnswerValue(response, q, qIdx);
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/analytics')}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-900 hover:text-gray-900 hover:scale-110 active:scale-95"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-2xl text-gray-900 md:text-3xl">{form.title}</h1>
            <p className="text-sm text-gray-500">Analytics & Insights</p>
          </div>
        </div>
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onDateChange={(start, end) => setDateRange({ start, end })}
        />
      </div>

      {/* Completion Rate and Timeline in a row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CompletionRate responses={filteredResponses} />
        <div className="lg:col-span-2">
          <TimelineChart responses={filteredResponses} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {/* Left Column: Stats & Recent - Sticky on Desktop */}
        <div className="space-y-6 lg:col-span-1">
          {/* Key Stats Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur transition-all">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Total Responses</p>
            <p className="mt-2 font-display text-4xl text-gray-900">{filteredResponses.length}</p>
            {dateRange.start || dateRange.end ? (
              <p className="text-xs text-gray-400 mt-1">
                ({responses.length} all time)
              </p>
            ) : null}
            
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-[10px] text-gray-400">Last Submission</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(filteredResponses[0]?.submittedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">First Submission</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(filteredResponses[filteredResponses.length - 1]?.submittedAt)}</p>
              </div>
            </div>
          </div>

          <DeviceStats responses={filteredResponses} />
          <ResponsePatterns responses={filteredResponses} />

          {/* Recent Submissions Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur max-h-[500px] overflow-y-auto custom-scrollbar transition-all">
            <h3 className="font-display text-lg text-gray-900 mb-4">Recent Activity</h3>
            {responseLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredResponses.length === 0 ? (
              <p className="text-gray-500 text-sm">No responses yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredResponses.slice(0, 10).map((response, idx) => (
                  <div key={response.id || idx} className="rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:scale-[1.02] cursor-pointer" onClick={() => setSelectedResponse(response)}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Submission #{filteredResponses.length - idx}</span>
                      <span className="text-xs text-gray-500">{new Date(response.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 mb-3">
                      {form.questions?.slice(0, 2).map((question, qIdx) => {
                        const answer = getAnswerValue(response, question, qIdx);
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
                      onClick={(e) => { e.stopPropagation(); setSelectedResponse(response); }}
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
            <>
              <QuestionStats responses={filteredResponses} questions={form.questions} />
              <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur transition-all">
                <h3 className="font-display text-xl text-gray-900 mb-4">Answer Distribution</h3>
                <ResponseAnalytics responses={filteredResponses} questions={form.questions} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Responses Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur overflow-hidden animate-slide-up transition-all" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-gray-900">All Responses</h3>
          <div className="text-xs text-gray-500">
            {filteredResponses.length} total {dateRange.start || dateRange.end ? '(filtered)' : ''}
          </div>
        </div>
        
        {filteredResponses.length === 0 ? (
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
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedResponse(response)}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {new Date(response.submittedAt).toLocaleString()}
                    </td>
                    {form.questions?.map((q, qIdx) => {
                      const answer = getAnswerValue(response, q, qIdx);
                      return (
                        <td key={q.id} className="px-4 py-3 max-w-[200px] truncate text-gray-600">
                          {Array.isArray(answer) ? answer.join(', ') : answer?.toString() || '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedResponse(response); }}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-all hover:scale-105 active:scale-95 bg-white"
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

      {/* Export Button with Dropdown */}
      <div className="flex justify-center pb-12 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={responses.length === 0 || isExporting}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gray-900 px-8 py-4 font-display text-lg text-white transition-all hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex items-center gap-3">
              <Download className="h-6 w-6" />
              {isExporting ? 'Exporting...' : 'Export Responses'}
              <ChevronDown className="h-5 w-5" />
            </span>
          </button>
          
          {showExportMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[200px] rounded-xl bg-white shadow-xl border border-gray-200 py-2 overflow-hidden">
              <button
                onClick={downloadCSV}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="text-left">
                  <p className="font-medium">Export to CSV</p>
                  <p className="text-xs text-gray-400">Spreadsheet format</p>
                </div>
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Export to Excel</p>
                  <p className="text-xs text-gray-400">.xlsx format</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200/80 bg-white/95 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-gray-900">Submission Details</h3>
              <div className="flex items-center gap-2">
                {!isEditingResponse && (
                  <button
                    onClick={startEditingResponse}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    title="Edit response"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedResponse(null);
                    cancelEditingResponse();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}</p>
                {selectedResponse.updatedAt && (
                  <p className="text-xs text-gray-400">Edited: {new Date(selectedResponse.updatedAt).toLocaleString()}</p>
                )}
              </div>
              
              {isEditingResponse ? (
                // Edit mode
                <>
                  {editedAnswers.map((answer, idx) => (
                    <div key={answer.questionId} className="rounded-xl bg-gray-50 p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{answer.questionLabel}</h4>
                      {Array.isArray(answer.value) ? (
                        <input
                          type="text"
                          value={answer.value.join(', ')}
                          onChange={(e) => handleEditArrayAnswerChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          placeholder="Separate multiple values with commas"
                        />
                      ) : (
                        <input
                          type="text"
                          value={answer.value || ''}
                          onChange={(e) => handleEditAnswerChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={cancelEditingResponse}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                      disabled={savingResponse}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedResponse}
                      disabled={savingResponse}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingResponse ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // View mode
                form.questions?.map((question, qIdx) => {
                  const answer = getAnswerValue(selectedResponse, question, qIdx);
                  return (
                    <div key={question.id} className="rounded-xl bg-gray-50 p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{question.label}</h4>
                      <p className="text-gray-700">
                        {Array.isArray(answer) ? answer.join(', ') : answer || 'No answer provided'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormAnalytics;
