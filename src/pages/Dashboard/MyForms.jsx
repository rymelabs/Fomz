import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, BarChart3, ExternalLink, Loader2, Sparkles, FileEdit, MoreVertical, Trash2, Share2, Pencil, Eye, Copy, Search, ArrowUpDown, Check, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AIGeneratorModal from '../../components/dashboard/AIGeneratorModal';
import { getUserForms, publishForm as publishFormService, deleteForm, duplicateForm } from '../../services/formService';
import { getDraftCount } from '../../services/draftService';
import { useUserStore } from '../../store/userStore';
import { useThemeStore } from '../../store/themeStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { trackFormDeleted } from '../../services/analyticsService';

const ClipboardIllustration = () => (
  <svg viewBox="0 0 140 180" className="mx-auto h-32 w-32 text-gray-300" fill="none">
    <rect x="20" y="30" width="100" height="130" rx="16" stroke="currentColor" strokeWidth="4" />
    <rect x="45" y="12" width="50" height="28" rx="8" stroke="currentColor" strokeWidth="4" />
    <line x1="40" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="95" x2="100" y2="95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="120" x2="80" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const MyForms = () => {
  const { user } = useUserStore();
  const { themes } = useThemeStore();
  const navigate = useNavigate();
  const { signInGoogle } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'title', 'responses'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [duplicating, setDuplicating] = useState(null);
  const menuRef = useRef(null);
  const sortMenuRef = useRef(null);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...forms];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(form => 
        form.title?.toLowerCase().includes(query) || 
        form.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'responses') {
        comparison = (a.responses || 0) - (b.responses || 0);
      } else if (sortBy === 'updatedAt') {
        const dateA = a.updatedAt?.toDate?.() || new Date(0);
        const dateB = b.updatedAt?.toDate?.() || new Date(0);
        comparison = dateA - dateB;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [forms, searchQuery, sortBy, sortOrder]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle form duplication
  const handleDuplicateForm = async (formId, e) => {
    e.stopPropagation();
    if (!user) return;
    
    setDuplicating(formId);
    try {
      const newForm = await duplicateForm(formId, user.uid);
      setForms(prev => [newForm, ...prev]);
      toast.success('Form duplicated successfully');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Duplicate failed', error);
      toast.error('Failed to duplicate form');
    } finally {
      setDuplicating(null);
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      await deleteForm(formId);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      // Track form deletion
      trackFormDeleted(formId);
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
            className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-all active:scale-95 px-2 py-1 rounded-md hover:bg-gray-50 ${
              draftCount > 0 
                ? 'text-amber-600' 
                : 'text-gray-400'
            }`}
            onClick={() => navigate('/dashboard/drafts')}
          >
            <FileEdit className="h-3 w-3" />
            Drafts
            {draftCount > 0 && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">
                {draftCount}
              </span>
            )}
          </button>
        </div>
        {/* Search and Sort Controls */}
        {forms.length > 0 && (
          <div className="flex flex-row gap-2 items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative inline-block" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide border border-gray-200 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="h-3 w-3 text-gray-500" />
                <span className="text-gray-700 hidden sm:inline">
                  {sortBy === 'updatedAt' ? 'Updated' : sortBy === 'title' ? 'Name' : 'Resp'}
                </span>
              </button>
              
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] rounded-lg bg-white shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={() => { setSortBy('updatedAt'); setSortOrder('desc'); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Last updated
                    {sortBy === 'updatedAt' && <Check className="h-3 w-3 text-primary-600" />}
                  </button>
                  <button
                    onClick={() => { setSortBy('title'); setSortOrder('asc'); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Name (A-Z)
                    {sortBy === 'title' && sortOrder === 'asc' && <Check className="h-3 w-3 text-primary-600" />}
                  </button>
                  <button
                    onClick={() => { setSortBy('title'); setSortOrder('desc'); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Name (Z-A)
                    {sortBy === 'title' && sortOrder === 'desc' && <Check className="h-3 w-3 text-primary-600" />}
                  </button>
                  <button
                    onClick={() => { setSortBy('responses'); setSortOrder('desc'); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Most responses
                    {sortBy === 'responses' && sortOrder === 'desc' && <Check className="h-3 w-3 text-primary-600" />}
                  </button>
                  <button
                    onClick={() => { setSortBy('responses'); setSortOrder('asc'); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Least responses
                    {sortBy === 'responses' && sortOrder === 'asc' && <Check className="h-3 w-3 text-primary-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-normal text-gray-500">
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-900 px-2 py-1.5 text-sm font-semibold text-gray-900 transition-all active:scale-95" onClick={() => navigate('/dashboard/create')}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-900 text-sm transition-colors group-hover:border-white">+</span>
            Create a form
          </button>
          <button 
            title="Let Fomzy draft sections, questions, and theme"
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-100 active:scale-95" 
            onClick={() => {
              if (window?.navigator?.vibrate) {
                window.navigator.vibrate(10);
              }
              setIsAIModalOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 text-primary-600" />
            Create with Fomzy
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
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 font-display text-xl text-gray-900">No forms found</h3>
          <p className="mt-2 text-gray-600">Try adjusting your search query.</p>
          <button
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {filteredForms.map((form, index) => {
            const themeConfig = themes[form.theme] || themes.blue;
            const isPublished = Boolean(form.settings?.published);
            const updatedLabel = form.updatedAt?.toDate?.().toLocaleDateString?.() || 'Recently';

            return (
              <div
                key={form.id}
                onClick={() => navigate(`/builder?formId=${form.id}`)}
                className={`group relative flex flex-col justify-between rounded-xl p-3 sm:p-5 transition-all cursor-pointer animate-card-enter opacity-0 border border-gray-400 border-l-4 hover:shadow-sm ${openMenuId === form.id ? 'z-50' : 'z-0'}`}
                style={{ 
                  animationDelay: `${index * 50}ms`, 
                  animationFillMode: 'forwards',
                  borderLeftColor: themeConfig.primaryColor
                }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2 sm:pr-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <div 
                          className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full"
                          style={{ background: themeConfig.gradient }}
                        ></div>
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
                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg bg-white shadow-lg border border-gray-200 py-1">
                          <button
                            onClick={(e) => handleDuplicateForm(form.id, e)}
                            disabled={duplicating === form.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {duplicating === form.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            {duplicating === form.id ? 'Duplicating...' : 'Duplicate'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/forms/${form.id}/responses`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" />
                            View Responses
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/analytics/${form.id}`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </button>
                          <hr className="my-1 border-gray-100" />
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
