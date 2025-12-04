import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, ExternalLink, Loader2, FileEdit } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getUserDrafts, deleteDraft } from '../../services/draftService';
import { useUserStore } from '../../store/userStore';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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

const EmptyDraftsIllustration = () => (
  <svg viewBox="0 0 140 180" className="mx-auto h-32 w-32 text-gray-300" fill="none">
    <rect x="20" y="30" width="100" height="130" rx="16" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" />
    <rect x="45" y="12" width="50" height="28" rx="8" stroke="currentColor" strokeWidth="4" />
    <line x1="40" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <line x1="40" y1="95" x2="100" y2="95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <line x1="40" y1="120" x2="80" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const Drafts = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const initForm = useFormBuilderStore((state) => state.initForm);
  const setDraftId = useFormBuilderStore((state) => state.setDraftId);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let unsubscribe = false;

    const fetchDrafts = async () => {
      if (!user) {
        setDrafts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserDrafts(user.uid);
        if (!unsubscribe) {
          setDrafts(data);
        }
      } catch (error) {
        console.error('Unable to load drafts', error);
        setErrorMessage(error.message || 'Unable to load drafts');
      } finally {
        if (!unsubscribe) {
          setLoading(false);
        }
      }
    };

    fetchDrafts();
    return () => {
      unsubscribe = true;
    };
  }, [user]);

  const handleOpenDraft = (draft) => {
    // Load draft into form builder store
    initForm(draft);
    setDraftId(draft.id);
    navigate('/builder', { state: { fromDraft: true } });
  };

  const handleDeleteDraft = async (draftId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setDeletingId(draftId);
    try {
      await deleteDraft(draftId, user.uid);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success('Draft deleted');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast.error('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-xl text-gray-900">Sign in to view your drafts</p>
        <p className="mt-3 text-gray-600">You need to be signed in to access your saved drafts.</p>
        <button
          className="mt-8 inline-flex items-center rounded-full border border-gray-900 px-10 py-3 font-display text-lg text-gray-900 transition-all active:scale-95"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-all hover:bg-gray-100 active:scale-95"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="font-display text-xl font-bold text-gray-900">Drafts</p>
        </div>
        <p className="text-sm text-gray-500">
          Your unpublished forms are saved here. Continue editing or delete drafts you no longer need.
        </p>
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
            <button
              className="rounded-full border border-gray-900 px-6 py-2 text-sm font-semibold text-gray-900 transition-all active:scale-95"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </Card>
      ) : drafts.length === 0 ? (
        <div className="text-center py-24">
          <EmptyDraftsIllustration />
          <h3 className="mt-8 font-display text-2xl text-gray-900">No Drafts</h3>
          <p className="mt-4 text-gray-600">You don't have any saved drafts. Start creating a new form!</p>
          <button
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-900 px-8 py-3 font-display text-lg text-gray-900 transition-all active:scale-95"
            onClick={() => navigate('/dashboard/create')}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-900 text-2xl leading-none">+</span>
            Create a form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 xl:grid-cols-5">
          {drafts.map((draft, index) => {
            const previewGradient = themeTileBackgrounds[draft.theme] || 'from-[#e0e7ff] via-white to-white text-gray-900';
            const updatedLabel = draft.updatedAt?.toDate?.()?.toLocaleDateString?.() || 'Recently';
            const questionCount = draft.questions?.length || 0;

            return (
              <div
                key={draft.id}
                className="group rounded-[24px] md:rounded-[32px] border border-gray-200/80 bg-white/80 p-3 md:p-4 backdrop-blur transition-all duration-300 animate-card-enter opacity-0 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/60 bg-gradient-to-br ${previewGradient} h-20 md:h-24 p-3 md:p-4 flex flex-col justify-between transition-transform duration-500`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em]">
                    <span className="rounded-full bg-amber-400/30 px-2 py-0.5 md:px-3 md:py-1 text-[0.45rem] md:text-[0.55rem] text-white flex items-center gap-1">
                      <FileEdit className="h-2.5 w-2.5" />
                      Draft
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 md:px-3 md:py-1 text-[0.45rem] md:text-[0.55rem] text-white">
                      {questionCount} Q
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-lg md:text-2xl text-white truncate">{draft.title || 'Untitled form'}</p>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm text-white/80 truncate">
                      {draft.description || 'No description yet'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 md:mt-6 flex flex-col justify-between gap-2 md:gap-3">
                  <div>
                    <p className="text-[0.5rem] md:text-[0.6rem] uppercase tracking-[0.4em] text-gray-500">Last edited</p>
                    <p className="text-xs md:text-sm text-gray-900">{updatedLabel}</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-gray-900 w-full transition-all active:scale-95 hover:bg-gray-50"
                    onClick={() => handleOpenDraft(draft)}
                  >
                    Continue editing
                    <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
                <div className="mt-3 md:mt-4">
                  <button
                    className="w-full rounded-full border border-red-200 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-red-600 transition-all active:scale-95 hover:bg-red-50 flex items-center justify-center gap-2"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    disabled={deletingId === draft.id}
                  >
                    {deletingId === draft.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Drafts;
