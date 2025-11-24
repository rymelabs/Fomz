import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const FormShell = ({ children, showProgress = false, progressPercent = 0, form, showHeader = true, showCreateButton = false }) => {
  const { themeData } = useTheme();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gradient = themeData?.gradient || 'linear-gradient(135deg, #7CA7FF 0%, #B6F3CF 100%)';
  const accent = themeData?.primaryColor || '#2563eb';

  // Style settings
  const fontFamily = form?.style?.fontFamily || 'sans';
  const fontSize = form?.style?.fontSize || 'md';
  const borderRadius = form?.style?.borderRadius || 'lg';

  const fontMap = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  };

  const sizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const radiusMap = {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px'
  };

  const containerStyle = {
    '--element-radius': radiusMap[borderRadius] || '1rem',
    '--form-font-size': fontSize === 'sm' ? '0.875rem' : fontSize === 'lg' ? '1.125rem' : '1rem'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let dots = [];
    let radius = 0;

    const initDots = (width, height) => {
      dots = [];
      const numDots = 600;
      // Use a larger radius to cover more screen or keep it contained as a globe
      // User asked for "globe rotating", so a contained sphere is better.
      // Let's make it responsive but large enough to be a nice background feature.
      radius = Math.min(width, height) * 0.6; 
      
      for (let i = 0; i < numDots; i++) {
        // Fibonacci sphere algorithm for even distribution
        const phi = Math.acos(-1 + (2 * i) / numDots);
        const theta = Math.sqrt(numDots * Math.PI) * phi;
        
        dots.push({
          x: radius * Math.cos(theta) * Math.sin(phi),
          y: radius * Math.sin(theta) * Math.sin(phi),
          z: radius * Math.cos(phi),
          baseAlpha: Math.random() * 0.5 + 0.5
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      angle += 0.0005; // Slow rotation

      dots.forEach(dot => {
        // Rotate around Y axis (and slightly X for tilt)
        const tilt = 0.2;
        // First rotate Y
        let x = dot.x * Math.cos(angle) - dot.z * Math.sin(angle);
        let z = dot.z * Math.cos(angle) + dot.x * Math.sin(angle);
        let y = dot.y;

        // Then rotate X (tilt)
        let yNew = y * Math.cos(tilt) - z * Math.sin(tilt);
        let zNew = z * Math.cos(tilt) + y * Math.sin(tilt);
        y = yNew;
        z = zNew;

        // Perspective projection
        const fov = 1000;
        const scale = fov / (fov - z);
        const px = cx + x * scale;
        const py = cy + y * scale;

        if (scale > 0) {
          // Depth-based opacity
          const alpha = Math.max(0.1, (z + radius) / (2 * radius)); 
          
          ctx.beginPath();
          ctx.arc(px, py, 1.2 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * dot.baseAlpha * 0.8})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className={`relative min-h-screen overflow-hidden bg-white ${fontMap[fontFamily] || 'font-sans'} ${sizeMap[fontSize] || 'text-base'}`}
      style={containerStyle}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60 blur-3xl animate-gradient-xy"
        style={{ background: gradient, backgroundSize: '400% 400%' }}
      ></div>
      
      {/* Globe of stars */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 opacity-60"
      />

      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/30 blur-3xl"></div>

      <div className="fixed top-0 left-0 right-0 z-30 border-b border-white/60 bg-white/40 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-5xl text-gray-900">fomz</p>
              <p className="text-xs tracking-[0.2em] text-gray-500">by RymeLabs</p>
            </div>
            {showCreateButton && (
              <button
                onClick={() => navigate('/')}
                className="rounded-full px-6 py-2 bg-black text-white text-sm font-medium transition-all duration-300 hover:scale-105 animate-fade-in"
              >
                Create fomz
              </button>
            )}
          </div>
          {showProgress && (
            <div className="mt-4 h-2 w-full rounded-full bg-gray-200/70">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, progressPercent)}%`, backgroundColor: accent }}
              ></div>
            </div>
          )}
        </div>
        {form && showHeader && (
          <div className="bg-white/0 animate-slide-down border-t border-gray-200">
            <div className="mx-auto w-full max-w-4xl px-6 py-3">
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-xs uppercase tracking-[0.4em] text-black">
                    {form.title?.[0] || 'F'}
                  </div>
                )}
                <div>
                  <p className="font-display text-xl text-gray-900">{form.title || 'Untitled form'}</p>
                  {form.description && <p className="text-sm text-gray-500">{form.description}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col pt-44">

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="px-6 pb-10 text-center text-[0.65rem] text-gray-500">
          <span className="font-brand font-bold">fomz</span> by RymeLabs
        </footer>
      </div>
    </div>
  );
};

export default FormShell;
