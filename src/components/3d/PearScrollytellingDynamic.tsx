'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PearScrollytellingLazy = dynamic(
  () => import('./PearScrollytelling').then((mod) => mod.PearScrollytelling),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] sm:h-[750px] md:h-[850px] rounded-3xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider">
          INITIALIZING 3D BIOLOGICAL SCENARIO...
        </span>
      </div>
    ),
  }
);

interface PearScrollytellingDynamicProps {
  scrollProgress: number;
  onProgressChange?: (progress: number) => void;
}

export const PearScrollytellingDynamic: React.FC<PearScrollytellingDynamicProps> = (props) => {
  return <PearScrollytellingLazy {...props} />;
};
