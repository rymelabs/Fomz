import React, { useEffect, useState, useRef } from 'react';
import { Download, Filter, Loader2, Trash2, CheckSquare, Square, X, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getFormResponses, exportToCSV, exportToExcel, deleteMultipleResponses } from '../../services/responseService';
import toast from 'react-hot-toast';

const ViewResponses = ({ formId, onSelectResponse, questions = [] }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!formId) return;
      try {
        setLoading(true);
        const data = await getFormResponses(formId);
        setResponses(data);
      } catch (error) {
        console.error('Failed to load responses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  const handleExportCSV = () => {
    const csv = exportToCSV(responses, questions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'responses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
    toast.success('Exported to CSV');
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(responses, questions, 'responses');
      toast.success('Exported to Excel');
    } catch (error) {
      console.error('Excel export failed', error);
      toast.error('Failed to export to Excel');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const toggleSelection = (responseId, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map(r => r.id)));
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirm = window.confirm(`Delete ${selectedIds.size} response${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`);
    if (!confirm) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteMultipleResponses(formId, Array.from(selectedIds));
      if (result.success) {
        toast.success(`Deleted ${result.deleted} response${result.deleted > 1 ? 's' : ''}`);
        setResponses(prev => prev.filter(r => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } else {
        toast.error(`Deleted ${result.deleted}, failed ${result.failed}`);
      }
    } catch (error) {
      console.error('Failed to delete responses', error);
      toast.error('Failed to delete responses');
    } finally {
      setIsDeleting(false);
    }
  };

  const getAnswerValue = (response, questionId) => {
    if (!response.answers) return '-';
    // Handle both array format and object format answers
    if (Array.isArray(response.answers)) {
      const answer = response.answers.find(a => a.questionId === questionId);
      if (!answer) return '-';
      if (Array.isArray(answer.value)) return answer.value.join(', ');
      return String(answer.value || '-');
    }
    // Fallback if answers is object map
    const val = response.answers[questionId];
    if (Array.isArray(val)) return val.join(', ');
    return String(val || '-');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Responses</h1>
          <p className="text-xs text-gray-500">{responses.length} submissions.</p>
        </div>
        
        {isSelectionMode ? (
          <div className="flex items-center gap-2 bg-primary-50 px-2 py-1 rounded border border-primary-100 min-h-[28px]">
            <span className="text-xs font-medium text-primary-900">
              {selectedIds.size} selected
            </span>
            <div className="h-3 w-px bg-primary-200 mx-1"></div>
            <button
              onClick={selectAll}
              className="text-xs text-primary-700 hover:text-primary-800 font-medium"
            >
              {selectedIds.size === responses.length ? 'None' : 'All'}
            </button>
            <div className="h-3 w-px bg-primary-200 mx-1"></div>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || isDeleting}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
            <div className="h-3 w-px bg-primary-200 mx-1"></div>
            <button
              onClick={cancelSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {responses.length > 0 && (
              <Button 
                variant="outline"
                size="xs"
                icon={CheckSquare}
                onClick={() => setIsSelectionMode(true)}
              >
                Select
              </Button>
            )}
            <Button variant="outline" size="xs" icon={Filter}>Filter</Button>
            
            {/* Export dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <Button 
                variant="outline"
                size="xs"
                icon={Download}
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
              >
                {isExporting ? '...' : 'Export'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl bg-white shadow-xl border border-gray-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block">Export to CSV</span>
                      <span className="text-xs text-gray-500">Spreadsheet format</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block">Export to Excel</span>
                      <span className="text-xs text-gray-500">.xlsx format</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : responses.length === 0 ? (
        <Card className="text-center py-16">
          <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No responses yet</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">Share your form link with your audience to start collecting data.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="relative px-2 py-2 w-8">
                    {isSelectionMode && (
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={selectAll}
                          className="text-gray-400 hover:text-primary-600 focus:outline-none"
                        >
                          {selectedIds.size === responses.length ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary-600" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    {!isSelectionMode && <span className="sr-only">Status</span>}
                  </th>
                  <th scope="col" className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  {questions.slice(0, 4).map((q) => (
                    <th key={q.id} scope="col" className="px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 max-w-[140px] truncate">
                      {q.label}
                    </th>
                  ))}
                  <th scope="col" className="relative py-2 pl-2 pr-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {responses.map((response) => (
                  <tr 
                    key={response.id}
                    onClick={() => isSelectionMode ? toggleSelection(response.id, { stopPropagation: () => {} }) : onSelectResponse?.(response)}
                    className={`group hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedIds.has(response.id) ? 'bg-primary-50 hover:bg-primary-50' : ''
                    }`}
                  >
                    <td className="relative w-8 px-2 py-1.5">
                      {selectedIds.has(response.id) && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary-600" />
                      )}
                      {isSelectionMode ? (
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={(e) => toggleSelection(response.id, e)}
                            className="text-primary-600 focus:outline-none"
                          >
                            {selectedIds.has(response.id) ? (
                              <CheckSquare className="h-3.5 w-3.5" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-500" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                           <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-xs text-gray-500">
                      {new Date(response.submittedAt).toLocaleDateString()}
                      <span className="block text-[10px] text-gray-400">
                        {new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    {questions.slice(0, 4).map((q) => (
                      <td key={q.id} className="px-2 py-1.5 text-xs text-gray-900 max-w-[140px] truncate">
                        {getAnswerValue(response, q.id)}
                      </td>
                    ))}
                    <td className="relative whitespace-nowrap py-1.5 pl-2 pr-3 text-right text-xs font-medium">
                      <Button 
                        variant="ghost" 
                        size="xs"
                        className="text-primary-600 hover:text-primary-900 group-hover:opacity-100 opacity-0 transition-opacity px-2 h-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectResponse?.(response);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewResponses;
