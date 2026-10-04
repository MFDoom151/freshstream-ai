'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ShipmentItem } from '@/types/shipment';
import { Activity, Radio } from 'lucide-react';

interface DigitalTwinMapProps {
  shipments: ShipmentItem[];
  highlightShipmentId?: string;
  className?: string;
}

const DynamicMap = dynamic(() => import('./DigitalTwinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[620px] sm:h-[680px] lg:h-[720px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80">
        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-white font-bold tracking-wider">INITIALIZING DIGITAL TWIN CANVASES</span>
      </div>
      <p className="text-slate-500 text-[11px]">
        Loading CartoDB Dark Matter GIS tiles, Corridor Waypoints & IoT Mesh...
      </p>
    </div>
  ),
});

export const DigitalTwinMapDynamic: React.FC<DigitalTwinMapProps> = (props) => {
  return <DynamicMap {...props} />;
};

export default DigitalTwinMapDynamic;
