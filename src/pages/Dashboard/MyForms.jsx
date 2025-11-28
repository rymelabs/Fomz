import React, { useEffect, useState, useRef } from 'react';
import { Plus, BarChart3, ExternalLink, Loader2, Sparkles, FileEdit, MoreVertical, Trash2, Share2, Pencil, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AIGeneratorModal from '../../components/dashboard/AIGeneratorModal';
import { getUserForms, publishForm as publishFormService, deleteForm } from '../../services/formService';
import { getDraftCount } from '../../services/draftService';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ClipboardIllustration = () => (
  <svg viewBox="0 0 140 180" className="mx-auto h-32 w-32 text-gray-300" fill="none">
    <rect x="20" y="30" width="100" height="130" rx="16" stroke="currentColor" strokeWidth="4" />
    <rect x="45" y="12" width="50" height="28" rx="8" stroke="currentColor" strokeWidth="4" />
    <line x1="40" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="95" x2="100" y2="95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="120" x2="80" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const themeTileBackgrounds = {
  blue: 'from-[#7CA7FF] to-[#4f46e5]',
  green: 'from-[#B6F3CF] to-[#16a34a]',
  mixed: 'from-[#a78bfa] to-[#7c3aed]',
  soft: 'from-[#fecdd3] to-[#dc2626]',
  minimal: 'from-[#f1f5f9] to-[#64748b]',
  dark: 'from-[#0f172a] to-[#000000]',
  coral: 'from-[#ff9a8b] via-[#ffb347] to-[#ffd166]',
  forest: 'from-[#0f9b0f] via-[#10b981] to-[#38b2ac]',
  aurora: 'from-[#312e81] via-[#22d3ee] to-[#0ea5e9]',
  sandstone: 'from-[#f2e8cf] via-[#e8d0a9] to-[#d9a05b]',
  neon: 'from-[#0ea5e9] via-[#6366f1] to-[#22d3ee]',
  berry: 'from-[#4c1d95] via-[#7c3aed] to-[#ec4899]',
  slate: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
  sunrise: 'from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4]',
  teal: 'from-[#14b8a6] via-[#0ea5e9] to-[#6366f1]',
  violet: 'from-[#a855f7] via-[#6366f1] to-[#22d3ee]',
  citrus: 'from-[#fbbf24] via-[#f97316] to-[#ef4444]',
  cobalt: 'from-[#0f172a] via-[#1e3a8a] to-[#2563eb]',
  blush: 'from-[#fda4af] via-[#f9a8d4] to-[#fdf2f8]',
  lagoon: 'from-[#0ea5e9] via-[#22c55e] to-[#bef264]',
  latte: 'from-[#f7ead7] via-[#e0c9a6] to-[#c59b6c]'
};

const MyForms = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { signInGoogle } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteForm = async (formId) => {
    try {
      await deleteForm(formId);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      toast.success('Form deleted successfully');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Failed to delete form');
    } finally {
      setDeleteConfirm(null);
      setOpenMenuId(null);
    }
  };

  useEffect(() => {
    let unsubscribe = false;

    const fetchForms = async () => {
      if (!user) {
        setForms([]);
        setLoading(false);
        return;
      }

      // Debugging: log the current signed-in UID to help investigate permission issues
      try {
        console.log('Signed in user uid in MyForms:', user.uid);
      } catch (err) {
        // ignore
      }

      try {
        setLoading(true);
        const [data, drafts] = await Promise.all([
          getUserForms(user.uid),
          getDraftCount(user.uid)
        ]);
        if (!unsubscribe) {
          setForms(data);
          setDraftCount(drafts);
        }
      } catch (error) {
        console.error('Unable to load forms', error);
        setErrorMessage(error.message || 'Unable to load forms');
      } finally {
        if (!unsubscribe) {
          setLoading(false);
        }
      }
    };

    fetchForms();
    return () => {
      unsubscribe = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-xl text-gray-900">Welcome to fomz</p>
        <p className="mt-3 text-gray-600">Sign in to create and manage your forms.</p>
        <button
          className="mt-8 inline-flex items-center rounded-full border border-gray-900 px-10 py-3 font-display text-lg text-gray-900 transition-all active:scale-95"
          onClick={signInGoogle}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <AIGeneratorModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      
      <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-bold text-gray-900">My Forms</p>
          <button
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-all active:scale-95 ${
              draftCount > 0 
                ? 'text-amber-600 hover:text-amber-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => navigate('/dashboard/drafts')}
          >
            <FileEdit className="h-4 w-4" />
            Drafts
            {draftCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {draftCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-normal text-gray-500">
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-900 px-2 py-1.5 text-sm font-semibold text-gray-900 transition-all active:scale-95" onClick={() => navigate('/dashboard/create')}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-900 text-sm transition-colors group-hover:border-white">+</span>
            Create a form
          </button>
          <button 
            title="Let Fomzy draft sections, questions, and theme"
            className="inline-flex items-center gap-2 rounded-full border border-sky-500 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 active:scale-95" 
            onClick={() => {
              if (window?.navigator?.vibrate) {
                window.navigator.vibrate(10);
              }
              setIsAIModalOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 text-sky-600" />
            Create with Fomzy
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-2 py-1.5 text-sm text-gray-600 transition-all active:scale-95" onClick={() => navigate('/dashboard/analytics')}>
            <BarChart3 className="h-3 w-3" />
            View analytics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : errorMessage ? (
        <Card className="text-center p-4">
          <h3 className="text-xl font-semibold text-gray-900">Error</h3>
          <p className="text-gray-500 mt-2">{errorMessage}</p>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      ) : forms.length === 0 ? (
        <div className="text-center py-24 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ClipboardIllustration />
          <h3 className="mt-8 font-display text-2xl text-gray-900">You Have No Forms Yet</h3>
          <p className="mt-4 text-gray-600">Create your first form to start collecting responses.</p>
          <button
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-900 px-8 py-3 font-display text-lg text-gray-900 transition-all active:scale-95"
            onClick={() => navigate('/dashboard/create')}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-900 text-2xl leading-none transition-colors group-hover:border-white">+</span>
            Create a form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {forms.map((form, index) => {
            const previewGradient = themeTileBackgrounds[form.theme] || 'from-gray-100 to-gray-200';
            const isPublished = Boolean(form.settings?.published);
            const updatedLabel = form.updatedAt?.toDate?.().toLocaleDateString?.() || 'Recently';

            return (
              <div
                key={form.id}
                onClick={() => navigate(`/builder?formId=${form.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 sm:p-5 transition-all hover:border-gray-400 cursor-pointer animate-card-enter opacity-0"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2 sm:pr-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-br ${previewGradient}`}></div>
                        <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wider ${isPublished ? 'text-green-600' : 'text-gray-400'}`}>
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate" title={form.title}>{form.title || 'Untitled form'}</h3>
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 truncate">{form.description || 'No description'}</p>
                    </div>
                    
                    <div className="relative" ref={openMenuId === form.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === form.id ? null : form.id);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === form.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg bg-white shadow-lg border border-gray-200 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(form.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-6 flex items-center justify-between border-t border-gray-100 pt-3 sm:pt-4">
                  <div className="flex items-center gap-1 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                    <span>{form.responses || 0} <span className="hidden sm:inline">responses</span><span className="sm:hidden">res</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{updatedLabel}</span>
                  </div>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {isPublished ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = form.shareId ? `${window.location.origin}/f/${form.shareId}` : `${window.location.origin}/forms/${form.id}/fill`;
                          try {
                            await navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                          } catch (err) {
                            toast.error('Failed to copy');
                          }
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50"
                        title="Copy Link"
                      >
                        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const result = await publishFormService(form.id, true);
                            const url = result.shareId ? `${window.location.origin}/f/${result.shareId}` : `${window.location.origin}/forms/${form.id}/fill`;
                            setForms((prev) => prev.map(f => f.id === form.id ? { ...f, settings: { ...(f.settings || {}), published: true }, shareId: result.shareId } : f));
                            await navigator.clipboard.writeText(url);
                            toast.success('Published & Copied');
                          } catch (err) {
                            console.error('Publish failed', err);
                            toast.error('Failed to publish');
                          }
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50"
                        title="Publish"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Form?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. All responses for this form will also be deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteForm(deleteConfirm)}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyForms;
