import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getUserForms } from '../../services/formService';
import { getResponseCount } from '../../services/responseService';
import { useUserStore } from '../../store/userStore';

const DashboardAnalytics = () => {
  const { user } = useUserStore();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setForms([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getUserForms(user.uid);
        
        // Fetch response counts for all forms
        const formsWithCounts = await Promise.all(
          data.map(async (form) => {
            const count = await getResponseCount(form.id);
            return { ...form, responses: count };
          })
        );
        
        setForms(formsWithCounts);
      } catch (error) {
        console.error('Failed to load forms for analytics', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <p className="font-display text-4xl text-gray-900">Analytics</p>
        <p className="text-gray-600">Track performance and insights for your forms.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading analytics...</p>
          </div>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-24 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="mx-auto h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-display text-3xl text-gray-900 mb-4">No forms yet</h3>
          <p className="text-gray-600 mb-8">Create a form to start tracking analytics and responses.</p>
          <button
            className="inline-flex items-center gap-3 rounded-full border border-gray-900 px-8 py-3 font-display text-lg text-gray-900 transition-all hover:bg-gray-900 hover:text-white hover:scale-105 active:scale-95"
            onClick={() => navigate('/dashboard/create')}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-900 text-2xl leading-none transition-colors group-hover:border-white">+</span>
            Create form
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="font-display text-2xl text-gray-900">Your forms</p>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {forms.map((form, index) => (
              <div
                key={form.id}
                className="aspect-square rounded-xl border border-gray-200/90 p-3 transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary-500 flex flex-col justify-center hover:-translate-y-1 bg-white/10 backdrop-blur animate-card-enter opacity-0"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                onClick={() => navigate(`/dashboard/analytics/${form.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-medium text-gray-900 truncate">{form.title}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{form.description || 'No description'}</p>
                <div className="flex flex-col gap-1 text-[10px] text-gray-400">
                  <span>{form.responses || 0} responses</span>
                  {form.settings?.published ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-gray-400">Draft</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;
