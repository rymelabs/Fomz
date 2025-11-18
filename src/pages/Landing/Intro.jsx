import React from 'react';
import { useNavigate } from 'react-router-dom';

const Intro = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard/create');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 animate-blob rounded-full bg-gradient-to-br from-[#7CA7FF] via-[#7CA7FF]/60 to-transparent opacity-70 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-0 -left-24 h-[28rem] w-[28rem] animate-blob rounded-full bg-gradient-to-tl from-[#B6F3CF] via-[#B6F3CF]/60 to-transparent opacity-80 blur-3xl" style={{ animationDelay: '2s' }}></div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-display text-6xl text-gray-900 tracking-tight">fomz</p>
            <p className="font-poppins text-xs uppercase tracking-[0.5em] text-gray-500 mb-6">by RymeLabs</p>
          </div>
          <div className="space-y-2 text-gray-800">
            <p className="font-display text-[12px]">Create engaging forms and track its performance.</p>
            <p className="font-display text-[12px]">Keep track of your leads and never lose sight of them for free.</p>
          </div>
          <button
            type="button"
            onClick={handleGetStarted}
            className="mt-8 inline-flex items-center rounded-full border border-gray-900 px-10 py-3 font-display text-lg text-gray-900 transition hover:bg-gray-900 hover:text-white"
          >
            Get Started
          </button>
        </div>

        <p className="absolute bottom-8 text-sm text-gray-500">fomz by RymeLabs</p>
      </div>
    </div>
  );
};

export default Intro;
