import React, { useState, useEffect } from 'react';

export function SmartImage({ 
  src, 
  alt = '', 
  className = '', 
  cardBg = 'bg-white',
  onReady
}) {
  const isDataSvg = typeof src === 'string' && src.startsWith('data:image/svg+xml');
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(isDataSvg);

  useEffect(() => {
    setError(false);
    const svgNow = typeof src === 'string' && src.startsWith('data:image/svg+xml');
    setLoaded(svgNow);
    if (onReady) onReady(svgNow);
  }, [src, onReady]);

  const effectiveBg = isDataSvg ? 'bg-[#0a1128]' : cardBg;

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center rounded-3xl select-none ${effectiveBg} ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-800 font-black text-2xl">
          ?
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center rounded-3xl overflow-hidden select-none ${effectiveBg} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ładowanie...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="eager"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoaded(true);
          if (onReady) onReady(true);
        }}
        onError={() => {
          setError(true);
          if (onReady) onReady(true);
        }}
        className={`w-full h-full object-contain ${isDataSvg ? 'p-0' : 'p-3'} transition-all duration-200 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
}
