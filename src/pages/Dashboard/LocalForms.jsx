import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Trash2, Share2, BarChart3, AlertCircle, Plus, Pencil } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UpgradeBanner from '../../components/ui/UpgradeBanner';
import { 
  getLocalPublishedForms, 
  deleteLocalForm, 
  getLocalFormsSummary,
  checkStorageQuota 
} from '../../services/localFormService';
import { useUserStore } from '../../store/userStore';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const LocalFormsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { signInGoogle } = useAuth();
  const [localForms, setLocalForms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [storageQuota, setStorageQuota] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // If user is authenticated, redirect to main forms page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    loadLocalForms();
  }, [isAuthenticated, navigate]);
  
  const loadLocalForms = () => {
    const forms = getLocalPublishedForms();
    const summaryData = getLocalFormsSummary();
    const quota = checkStorageQuota();
    
    setLocalForms(forms.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    ));
    setSummary(summaryData);
    setStorageQuota(quota);
  };
  
  const handleDelete = async (formId) => {
    try {
      const success = deleteLocalForm(formId);
      if (success) {
        toast.success('Form deleted');
        loadLocalForms();
        setDeleteConfirm(null);
      } else {
        toast.error('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Error deleting form');
    }
  };
  
  const handleShare = (shareId) => {
    const url = `${window.location.origin}/fill/${shareId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const handleSignIn = () => {
    signInGoogle();
  };
  
  if (localForms.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Local Forms</h1>
          <p className="text-sm text-gray-600 mt-1">Forms saved in your browser</p>
        </div>
        
        <UpgradeBanner 
          variant="default"
          context="forms"
          onSignIn={handleSignIn}
        />
        
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-transparent p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900">No local forms yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Create and publish your first form to see it here. Your forms will be saved directly in your browser.
          </p>
          <Button
            onClick={() => navigate('/builder')}
            className="mt-8 bg-gray-900 hover:bg-black text-white rounded-full px-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Local Forms</h1>
        <p className="text-sm text-gray-600 mt-1">
          {summary?.totalForms || 0} forms • {summary?.totalResponses || 0} responses
        </p>
      </div>
      
      {/* Storage Warning */}
      {storageQuota?.isNearLimit && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900">Storage almost full</p>
            <p className="text-xs text-orange-700 mt-1">
              You're using {storageQuota.percentage}% of available browser storage. 
              Sign in to move your forms to the cloud.
            </p>
          </div>
          <Button
            onClick={handleSignIn}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white border-none whitespace-nowrap"
          >
            Sign In
          </Button>
        </div>
      )}
      
      {/* Upgrade Banner */}
      <div className="mb-6">
        <UpgradeBanner 
          variant="compact"
          context="forms"
          onSignIn={handleSignIn}
          dismissible={true}
          onDismiss={() => {
            // Could save dismissal to localStorage
            sessionStorage.setItem('upgrade_banner_dismissed', 'true');
            document.querySelector('[data-upgrade-banner]')?.remove();
          }}
        />
      </div>
      
      {/* Forms Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {localForms.map((form) => (
          <div 
            key={form.id} 
            className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-transparent p-4 transition-all hover:border-gray-400"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate tracking-tight">
                    {form.title || 'Untitled Form'}
                  </h3>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">
                    {formatDate(form.publishedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500 mt-3 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                  {form.questions?.length || 0} Q
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-green-400"></div>
                  {form.responseCount || 0} R
                </span>
              </div>
            </div>
              
            <div className="flex items-center justify-between gap-1 pt-3 mt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/builder?formId=${form.id}`)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                  title="Edit form"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                
                <button
                  onClick={() => handleShare(form.shareId)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                  title="Copy share link"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                
                <button
                  onClick={() => navigate(`/fill/${form.shareId}`)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                  title="Preview form"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <button
                onClick={() => setDeleteConfirm(form.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"
                title="Delete form"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sign in to see Analytics Banner */}
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center">
        <BarChart3 className="h-6 w-6 text-gray-400 mx-auto" />
        <p className="mt-2 text-sm font-medium text-gray-700">Want to see analytics?</p>
        <p className="mt-1 text-xs text-gray-500">Sign in and migrate your forms to unlock detailed analytics and insights.</p>
        <Button
          onClick={handleSignIn}
          size="sm"
          className="mt-3 bg-gray-900 hover:bg-black text-white text-xs"
        >
          Sign In to Unlock
        </Button>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete form?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete the form and all its responses from your browser. 
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalFormsPage;
