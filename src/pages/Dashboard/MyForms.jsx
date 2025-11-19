import React, { useEffect, useState } from 'react';
import { Plus, BarChart3, ExternalLink, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getUserForms, publishForm as publishFormService } from '../../services/formService';
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
  dark: 'from-[#0f172a] to-[#000000]'
};

const MyForms = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { signInGoogle } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

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
        const data = await getUserForms(user.uid);
        if (!unsubscribe) {
          setForms(data);
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
    <div className="space-y-12">
      <div className="flex flex-col gap-4">
        <p className="font-display text-xl font-bold text-gray-900">My Forms</p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.4em] text-gray-500">
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-900 px-4 py-2 font-semibold text-gray-900 transition-all active:scale-95" onClick={() => navigate('/dashboard/create')}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-900 text-base transition-colors group-hover:border-white">+</span>
            Create a form
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-gray-600 transition-all active:scale-95" onClick={() => navigate('/dashboard/analytics')}>
            <BarChart3 className="h-4 w-4" />
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
        <div className="text-center py-24">
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
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 xl:grid-cols-5">
          {forms.map((form, index) => {
            const previewGradient = themeTileBackgrounds[form.theme] || 'from-[#e0e7ff] via-white to-white text-gray-900';
            const isPublished = Boolean(form.settings?.published);
            const updatedLabel = form.updatedAt?.toDate?.().toLocaleDateString?.() || 'Recently';

            return (
              <div
                key={form.id}
                className="group rounded-[24px] md:rounded-[32px] border border-gray-200/80 bg-white/80 p-3 md:p-4 backdrop-blur transition-all duration-300 animate-card-enter opacity-0"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/60 bg-gradient-to-br ${previewGradient} h-20 md:h-24 p-3 md:p-4 flex flex-col justify-between transition-transform duration-500`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em]">
                    <span className="rounded-full bg-white/20 px-2 py-0.5 md:px-3 md:py-1 text-[0.45rem] md:text-[0.55rem] text-white">
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 md:px-3 md:py-1 text-[0.45rem] md:text-[0.55rem] text-white">
                      {form.responses || 0}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-lg md:text-2xl text-white truncate">{form.title || 'Untitled form'}</p>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm text-white/80 truncate">
                      {form.description || 'No description yet'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 md:mt-6 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                  <div>
                    <p className="text-[0.5rem] md:text-[0.6rem] uppercase tracking-[0.4em] text-gray-500">Updated</p>
                    <p className="text-xs md:text-sm text-gray-900">{updatedLabel}</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-gray-900 w-full md:w-auto transition-all active:scale-95"
                    onClick={() => navigate(`/builder?formId=${form.id}`)}
                  >
                    Open
                    <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
                <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
                  {isPublished ? (
                    <button
                      className="w-full md:w-auto rounded-full border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 text-gray-700 transition-all active:scale-95"
                      onClick={async () => {
                        const url = form.shareId ? `${window.location.origin}/f/${form.shareId}` : `${window.location.origin}/forms/${form.id}/fill`;
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success('Share link copied to clipboard');
                        } catch (err) {
                          toast.error('Failed to copy link');
                        }
                      }}
                    >
                      Share link
                    </button>
                  ) : (
                    <button
                      className="w-full md:w-auto rounded-full border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 text-gray-700 transition-all active:scale-95"
                      onClick={async () => {
                        try {
                          const result = await publishFormService(form.id, true);
                          const url = result.shareId ? `${window.location.origin}/f/${result.shareId}` : `${window.location.origin}/forms/${form.id}/fill`;
                          setForms((prev) => prev.map(f => f.id === form.id ? { ...f, settings: { ...(f.settings || {}), published: true }, shareId: result.shareId } : f));
                          await navigator.clipboard.writeText(url);
                          toast.success('Published and link copied');
                        } catch (err) {
                          console.error('Publish failed', err);
                          toast.error('Failed to publish form');
                        }
                      }}
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyForms;
