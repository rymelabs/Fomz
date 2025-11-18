import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFormByShareId } from '../services/formService';
import Button from '../components/ui/Button';

const ShortLinkRedirect = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('ShortLinkRedirect: resolving shareId', shareId);
        const form = await getFormByShareId(shareId);
        console.log('ShortLinkRedirect: form from shareId', form);
        if (!form) {
          setError('Form not found.');
          setLoading(false);
          return;
        }
        // Navigate to the fill path
        navigate(`/forms/${form.id}/fill`, { replace: true });
      } catch (err) {
        console.error('Failed to redirect short link', err);
        // Show a short friendly error to users; include low-risk debug info in dev
        const message = (process.env.NODE_ENV === 'development' && err?.message) ? `${err.message}` : 'Unable to load the form. Please try again later.';
        setError(message);
        setLoading(false);
      }
    };

    load();
  }, [shareId, navigate]);

  if (loading) return <p className="text-center py-20">Redirecting to form…</p>;

  return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <h2 className="text-xl font-semibold">Unable to open form</h2>
      <p className="text-gray-500 mt-4">{error}</p>
      <div className="mt-4">
        <Button onClick={() => navigate('/', { replace: true })}>Back to home</Button>
      </div>
    </div>
  );
};

export default ShortLinkRedirect;
