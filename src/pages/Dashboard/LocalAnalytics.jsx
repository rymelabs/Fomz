import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Users, Calendar, TrendingUp, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UpgradeBanner from '../../components/ui/UpgradeBanner';
import { 
  getLocalFormById,
  getLocalResponses,
  calculateLocalAnalytics
} from '../../services/localFormService';
import { useUserStore } from '../../store/userStore';
import { useAuth } from '../../hooks/useAuth';

const LocalAnalyticsPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { signInGoogle } = useAuth();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [formId, isAuthenticated, navigate]);
  
  const loadData = () => {
    setLoading(true);
    try {
      const formData = getLocalFormById(formId);
      if (!formData) {
        navigate('/local/forms');
        return;
      }
      
      const responsesData = getLocalResponses(formData.shareId);
      const analyticsData = calculateLocalAnalytics(formData.shareId, formData.questions || []);
      
      setForm(formData);
      setResponses(responsesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading local analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = () => {
    const dataStr = JSON.stringify({ form, responses, analytics }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title || 'form'}-export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const handleSignIn = () => {
    signInGoogle();
  };
  
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-gray-600">Form not found</p>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/local/forms')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to forms
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{form.title || 'Untitled Form'}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Local form analytics • {analytics?.totalResponses || 0} responses
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="ghost"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            
            <Button
              onClick={() => navigate(`/fill/${form.shareId}`)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Form
            </Button>
          </div>
        </div>
      </div>
      
      {/* Upgrade Banner */}
      <div className="mb-6">
        <UpgradeBanner 
          variant="compact"
          context="analytics"
          onSignIn={handleSignIn}
        />
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Responses</p>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {analytics?.totalResponses || 0}
          </p>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Questions</p>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {form.questions?.length || 0}
          </p>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Completion Rate</p>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {analytics?.totalResponses > 0 ? '100%' : '0%'}
          </p>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Published</p>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(form.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {/* Question Stats */}
      {analytics?.questionStats && Object.keys(analytics.questionStats).length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-transparent p-8 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-8 tracking-tight">Question Statistics</h2>
          
          <div className="space-y-10">
            {Object.values(analytics.questionStats).map((stat) => (
              <div key={stat.questionId} className="border-b border-gray-100 last:border-0 pb-10 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">{stat.questionLabel}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {stat.questionType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {stat.totalResponses} responses
                      </span>
                    </div>
                  </div>
                </div>
                
                {stat.distribution && (
                  <div className="mt-6 space-y-3">
                    {Object.entries(stat.distribution).map(([option, count]) => (
                      <div key={option} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{option}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round((count / stat.totalResponses) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(count / stat.totalResponses) * 100}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-400 text-right">
                          {count} votes
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {stat.average && (
                  <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Average</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.average}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Range</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {stat.min} - {stat.max}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Responses */}
      {responses.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-transparent p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">
            Recent Responses ({responses.length})
          </h2>
          
          <div className="space-y-2">
            {responses.slice(0, 5).map((response) => (
              <div key={response.id} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    #{response.id.slice(-6)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(response.submittedAt).toLocaleString()}
                  </p>
                </div>
                
                <button
                  onClick={() => navigate(`/local/forms/${formId}/responses/${response.id}`)}
                  className="text-sm font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View Details →
                </button>
              </div>
            ))}
            
            {responses.length > 5 && (
              <p className="text-center text-sm text-gray-500 pt-4">
                And {responses.length - 5} more...
              </p>
            )}
          </div>
        </div>
      )}
      
      {responses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-transparent p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900">No responses yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Share your form link to start collecting responses. They will appear here automatically.
          </p>
          <Button
            onClick={() => {
              const url = `${window.location.origin}/fill/${form.shareId}`;
              navigator.clipboard.writeText(url);
            }}
            className="mt-8 bg-gray-900 hover:bg-black text-white rounded-full px-8"
          >
            Copy Form Link
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocalAnalyticsPage;
