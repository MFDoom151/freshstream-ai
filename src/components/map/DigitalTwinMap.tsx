'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ShipmentItem } from '@/types/shipment';
import { 
  CORRIDOR_HUBS, 
  CORRIDOR_ROUTES, 
  CORRIDOR_EVENTS, 
  SHIPMENT_GEO_POSITIONS, 
  CorridorEvent,
  MapWaypointHub 
} from '@/lib/map-data';
import { 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Wind, 
  Thermometer, 
  Activity, 
  Ship, 
  Truck, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  X, 
  Check, 
  Radio, 
  Anchor, 
  Crosshair, 
  Compass,
  Zap,
  Sliders,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface DigitalTwinMapProps {
  shipments: ShipmentItem[];
  highlightShipmentId?: string;
  className?: string;
}

interface BasemapConfig {
  url: string;
  refUrl?: string;
  attribution: string;
  maxZoom: number;
}

type BasemapStyle = 'dark' | 'satellite' | 'positron';

const BASEMAP_TILES: Record<BasemapStyle, BasemapConfig> = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; DigitalGlobe, GeoEye, Earthstar Geographics',
    maxZoom: 18,
  },
  positron: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  shipments,
  highlightShipmentId,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<{
    routes: L.LayerGroup | null;
    hubs: L.LayerGroup | null;
    shipments: L.LayerGroup | null;
    events: L.LayerGroup | null;
  }>({ routes: null, hubs: null, shipments: null, events: null });

  // State
  const [basemap, setBasemap] = useState<BasemapStyle>('dark');
  const [showShipments, setShowShipments] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showEventsDrawer, setShowEventsDrawer] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({ lat: '42.20', lng: '53.00' });
  const [selectedEvent, setSelectedEvent] = useState<CorridorEvent | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
  const [selectedHub, setSelectedHub] = useState<MapWaypointHub | null>(null);
  const [acknowledgedEventIds, setAcknowledgedEventIds] = useState<string[]>([]);

  // Count active stats
  const activeEvents = useMemo(() => {
    return CORRIDOR_EVENTS.filter((e) => !acknowledgedEventIds.includes(e.id));
  }, [acknowledgedEventIds]);

  const criticalCount = activeEvents.filter((e) => e.severity === 'CRITICAL').length;
  const warningCount = activeEvents.filter((e) => e.severity === 'WARNING' || e.severity === 'BOTTLENECK').length;

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      if (isCancelled || !mapContainerRef.current) return;

      // Create map centered on Middle Corridor (Caspian Sea Basin)
      const map = L.map(mapContainerRef.current, {
        center: [42.4, 53.0],
        zoom: 5,
        minZoom: 3,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Add Zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add Base Tile Layer & optional Reference Labels Overlay
      const baseCfg = BASEMAP_TILES[basemap];
      tileLayerRef.current = L.tileLayer(baseCfg.url, {
        attribution: baseCfg.attribution,
        maxZoom: baseCfg.maxZoom,
      }).addTo(map);

      if (baseCfg.refUrl) {
        refTileLayerRef.current = L.tileLayer(baseCfg.refUrl, {
          maxZoom: baseCfg.maxZoom,
        }).addTo(map);
      }

      // Track mouse coordinates
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setCursorCoords({
          lat: e.latlng.lat.toFixed(4),
          lng: e.latlng.lng.toFixed(4),
        });
      });

      // Layer Groups
      const routesGroup = L.layerGroup().addTo(map);
      const hubsGroup = L.layerGroup().addTo(map);
      const shipmentsGroup = L.layerGroup().addTo(map);
      const eventsGroup = L.layerGroup().addTo(map);

      layersGroupRef.current = {
        routes: routesGroup,
        hubs: hubsGroup,
        shipments: shipmentsGroup,
        events: eventsGroup,
      };

      renderLayers(L);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (tileLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
      if (refTileLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(refTileLayerRef.current);
        refTileLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Base Tile on state change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }
    const baseCfg = BASEMAP_TILES[basemap];
    import('leaflet').then((LModule) => {
      const L = LModule.default;
      tileLayerRef.current = L.tileLayer(baseCfg.url, {
        attribution: baseCfg.attribution,
        maxZoom: baseCfg.maxZoom,
      }).addTo(mapInstanceRef.current!);

      if (baseCfg.refUrl) {
        refTileLayerRef.current = L.tileLayer(baseCfg.refUrl, {
          maxZoom: baseCfg.maxZoom,
        }).addTo(mapInstanceRef.current!);
      }
    });
  }, [basemap]);

  // Re-render markers and lines when props/filters change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((LModule) => {
      renderLayers(LModule.default);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShipments, showEvents, showHubs, showRoutes, shipments, acknowledgedEventIds]);

  // Handle highlighted shipment if passed from props
  useEffect(() => {
    if (!highlightShipmentId || !mapInstanceRef.current) return;
    const target = shipments.find((s) => s.id.toLowerCase() === highlightShipmentId.toLowerCase());
    if (target) {
      setSelectedShipment(target);
      const pos = SHIPMENT_GEO_POSITIONS[target.id];
      if (pos) {
        mapInstanceRef.current?.flyTo([pos.lat, pos.lng], 7, { duration: 1.2 });
      }
    }
  }, [highlightShipmentId, shipments]);

  // Core Render Method for Map Layers
  const renderLayers = (L: typeof import("leaflet")) => {
    const { routes, hubs, shipments: shipsGroup, events } = layersGroupRef.current;
    if (!routes || !hubs || !shipsGroup || !events) return;

    // Clear all
    routes.clearLayers();
    hubs.clearLayers();
    shipsGroup.clearLayers();
    events.clearLayers();

    // 1. Draw Corridor Routes
    if (showRoutes) {
      CORRIDOR_ROUTES.forEach((route) => {
        const polylineOptions: L.PolylineOptions = {
          color: route.color,
          weight: route.mode === 'SEA' ? 3.5 : 3,
          opacity: 0.85,
          lineJoin: 'round',
        };
        if (route.dashArray) {
          polylineOptions.dashArray = route.dashArray;
        }

        const line = L.polyline(route.coordinates, polylineOptions);
        line.bindTooltip(
          `<div class="text-[11px] font-mono font-semibold py-0.5 px-1">${route.name} (${route.mode})</div>`,
          { className: 'leaflet-dark-tooltip', sticky: true }
        );
        line.addTo(routes);
      });
    }

    // 2. Draw Corridor Hubs / Waypoints
    if (showHubs) {
      CORRIDOR_HUBS.forEach((hub) => {
        const isBottleneck = hub.isBottleneck;
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${isBottleneck ? '<div class="absolute -inset-1.5 rounded-full bg-amber-500/30 animate-ping"></div>' : ''}
            <div class="w-4 h-4 rounded-full ${isBottleneck ? 'bg-amber-500 border-2 border-white' : 'bg-slate-900 border-2 border-emerald-400'} shadow-md flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full ${isBottleneck ? 'bg-white' : 'bg-emerald-400'}"></div>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800 shadow pointer-events-none group-hover:text-white group-hover:border-slate-700">
              ${hub.shortName}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-hub-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([hub.lat, hub.lng], { icon });
        marker.on('click', () => {
          setSelectedHub(hub);
          setSelectedEvent(null);
          setSelectedShipment(null);
          mapInstanceRef.current?.flyTo([hub.lat, hub.lng], 7, { duration: 0.8 });
        });
        marker.addTo(hubs);
      });
    }

    // 3. Draw Active Shipments
    if (showShipments) {
      shipments.forEach((shipment) => {
        const geo = SHIPMENT_GEO_POSITIONS[shipment.id] || { lat: 43.18, lng: 51.65, mode: 'TRAIN' };
        const isOptimal = shipment.status === 'OPTIMAL';
        const isWarning = shipment.status === 'WARNING';
        const isCritical = shipment.status === 'CRITICAL';

        const colorBg = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
        const borderColor = isCritical ? 'border-red-400' : isWarning ? 'border-amber-400' : 'border-emerald-400';

        const iconHtml = `
          <div class="relative cursor-pointer flex flex-col items-center group">
            ${isCritical ? '<div class="absolute -inset-2 rounded-xl bg-red-500/40 animate-ping"></div>' : ''}
            <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/95 border ${borderColor} shadow-lg text-[10px] font-mono text-white transition-transform group-hover:scale-110">
              <span class="w-2 h-2 rounded-full ${colorBg} ${isCritical ? 'animate-pulse' : ''}"></span>
              <span class="font-bold tracking-tight">${shipment.id}</span>
              <span class="text-slate-400 text-[9px]">${shipment.cargoNameEn.split(' ')[0]}</span>
            </div>
            <div class="w-1.5 h-2 bg-slate-700/80 -mt-0.5"></div>
            <div class="w-2 h-2 rounded-full ${colorBg} border border-white"></div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-shipment-icon',
          iconSize: [80, 36],
          iconAnchor: [40, 36],
        });

        const marker = L.marker([geo.lat, geo.lng], { icon });
        marker.on('click', () => {
          setSelectedShipment(shipment);
          setSelectedEvent(null);
          setSelectedHub(null);
          mapInstanceRef.current?.flyTo([geo.lat, geo.lng], 8, { duration: 0.8 });
        });
        marker.addTo(shipsGroup);
      });
    }

    // 4. Draw Real-World Corridor Events Overlay
    if (showEvents) {
      activeEvents.forEach((evt) => {
        const isCritical = evt.severity === 'CRITICAL';
        const isWarning = evt.severity === 'WARNING';
        const isBottleneck = evt.severity === 'BOTTLENECK';

        let badgeBg = 'bg-emerald-500';
        let ringColor = 'border-emerald-500';
        let iconSymbol = '✓';

        if (isCritical) {
          badgeBg = 'bg-red-500 text-white';
          ringColor = 'border-red-500';
          iconSymbol = '🚨';
        } else if (isWarning) {
          badgeBg = 'bg-amber-500 text-slate-950 font-black';
          ringColor = 'border-amber-500';
          iconSymbol = '⚠️';
        } else if (isBottleneck) {
          badgeBg = 'bg-cyan-500 text-slate-950 font-black';
          ringColor = 'border-cyan-500';
          iconSymbol = '⚓';
        }

        const iconHtml = `
          <div class="relative cursor-pointer flex items-center justify-center group">
            ${isCritical || isWarning ? `<div class="absolute -inset-3 rounded-full ${isCritical ? 'bg-red-500/30' : 'bg-amber-500/25'} animate-ping"></div>` : ''}
            <div class="w-7 h-7 rounded-full ${badgeBg} border-2 border-white shadow-xl flex items-center justify-center text-xs transition-transform group-hover:scale-125">
              <span>${iconSymbol}</span>
            </div>
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-mono px-2 py-0.5 rounded border ${ringColor} shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              ${evt.title}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-event-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([evt.lat, evt.lng], { icon });
        marker.on('click', () => {
          setSelectedEvent(evt);
          setSelectedShipment(null);
          setSelectedHub(null);
          mapInstanceRef.current?.flyTo([evt.lat, evt.lng], 8, { duration: 0.8 });
        });
        marker.addTo(events);
      });
    }
  };

  // Center fit corridor bounds
  const handleFitCorridor = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current?.flyToBounds(
      [
        [38.5, 27.0], // SW (Turkey/South Caucasus)
        [46.5, 82.0], // NE (Almaty/Khorgos)
      ],
      { padding: [40, 40], duration: 1.2 }
    );
  };

  const handleSelectEventFromList = (evt: CorridorEvent) => {
    setSelectedEvent(evt);
    setSelectedShipment(null);
    setSelectedHub(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current?.flyTo([evt.lat, evt.lng], 8, { duration: 1.0 });
    }
  };

  const handleAcknowledgeEvent = (id: string) => {
    setAcknowledgedEventIds((prev) => [...prev, id]);
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[620px] sm:h-[680px] lg:h-[720px]'
      } ${className}`}
    >
      {/* 1. TOP MISSION-CONTROL COMMAND BAR */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Corridor Identity & GPS Coordinates */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-wider">TWIN-MAP V2</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">TITR CORRIDOR</span>
          </div>

          {/* Real-time Cursor Coordinates */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>LAT: {cursorCoords.lat}° N</span>
            <span>LNG: {cursorCoords.lng}° E</span>
          </div>
        </div>

        {/* Center: Live Alarms Counter */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/50 text-[11px] font-mono text-red-300">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span>{criticalCount} CRITICAL ANOMALY</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] font-mono text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{warningCount} WARNINGS</span>
            </div>
          )}
        </div>

        {/* Right: Layer Toggles & View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basemap Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setBasemap('dark')}
              className={`px-2 py-1 rounded transition-colors ${
                basemap === 'dark' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical
            </button>
            <button
              type="button"
              onClick={() => setBasemap('satellite')}
              className={`px-2 py-1 rounded transition-colors ${
                basemap === 'satellite' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBasemap('positron')}
              className={`px-2 py-1 rounded transition-colors ${
                basemap === 'positron' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Layer Filter Toggles */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setShowShipments(!showShipments)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showShipments ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40' : 'text-slate-500'
              }`}
            >
              <span>Fleet ({shipments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEvents(!showEvents)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showEvents ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/40' : 'text-slate-500'
              }`}
            >
              <span>Events ({activeEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2 py-1 rounded transition-colors ${
                showRoutes ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-slate-500'
              }`}
            >
              Routes
            </button>
          </div>

          {/* Reset Fit Bounds */}
          <button
            type="button"
            onClick={handleFitCorridor}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Reset Map to Full Corridor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Events Drawer */}
          <button
            type="button"
            onClick={() => setShowEventsDrawer(!showEventsDrawer)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
              showEventsDrawer ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Live Event Stream"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Events</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. LEAFLET MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0 select-none" />

      {/* 3. EVENT INSPECTOR MODAL OVERLAY (Bottom-Left) */}
      {selectedEvent && (
        <div className="absolute bottom-6 left-6 z-[1001] w-full max-w-lg p-5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                selectedEvent.severity === 'CRITICAL' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : selectedEvent.severity === 'WARNING' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              }`}>
                {selectedEvent.severity}
              </span>
              <span className="text-xs font-mono text-slate-400">{selectedEvent.timestamp}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 flex flex-col gap-2.5">
            <h4 className="text-base font-bold text-white tracking-tight leading-snug">
              {selectedEvent.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Anchor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{selectedEvent.locationName}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              {selectedEvent.description}
            </p>

            {/* Telemetry Sensor Snapshot */}
            {selectedEvent.telemetry && (
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500">TEMP</span>
                  <span className={`font-bold ${selectedEvent.telemetry.temperature > 5 ? 'text-red-400' : 'text-cyan-300'}`}>
                    +{selectedEvent.telemetry.temperature}°C
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500">ETHANOL</span>
                  <span className={`font-bold ${selectedEvent.telemetry.ethanol > 35 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedEvent.telemetry.ethanol} ppm
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500">HUMIDITY</span>
                  <span className="font-bold text-slate-300">{selectedEvent.telemetry.humidity}%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500">SHOCK</span>
                  <span className="font-bold text-slate-300">{selectedEvent.telemetry.vibration}g</span>
                </div>
              </div>
            )}

            {/* Prescribed AI Conductor Action */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider block mb-1">
                Prescribed AI Action:
              </span>
              <p className="text-purple-200 text-xs leading-relaxed">{selectedEvent.aiAction}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAcknowledgeEvent(selectedEvent.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledge</span>
              </button>

              {selectedEvent.shipmentId && (
                <Button
                  href={`/dashboard/shipment/${selectedEvent.shipmentId}`}
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Inspect Shipment {selectedEvent.shipmentId}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SHIPMENT TELEMETRY INSPECTOR (Bottom-Left) */}
      {selectedShipment && !selectedEvent && (
        <div className="absolute bottom-6 left-6 z-[1001] w-full max-w-md p-5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-white text-base">{selectedShipment.id}</span>
              <Badge
                variant={
                  selectedShipment.status === 'CRITICAL'
                    ? 'danger'
                    : selectedShipment.status === 'WARNING'
                    ? 'warning'
                    : 'mint'
                }
                size="sm"
                dot
              >
                {selectedShipment.status}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setSelectedShipment(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 flex flex-col gap-2.5">
            <div>
              <div className="text-sm font-bold text-white">{selectedShipment.cargoNameEn}</div>
              <div className="text-xs text-slate-400">{selectedShipment.exporter}</div>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1 font-mono">
              <Anchor className="w-3 h-3 text-emerald-400" />
              <span>{selectedShipment.origin.split(',')[0]} → {selectedShipment.destination.split(',')[0]}</span>
            </div>

            {/* Health & RUL metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400">BIOLOGICAL HEALTH</span>
                <span className="text-lg font-black text-emerald-400">{selectedShipment.bhi}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400">PREDICTED RUL</span>
                <span className="text-lg font-black text-cyan-300">{selectedShipment.predictedRulHours} Hours</span>
              </div>
            </div>

            {/* Live Sensor Metrics */}
            <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[9px] text-slate-500">TEMP</span>
                <span className="text-cyan-300 font-bold">+{selectedShipment.telemetry.temperature}°C</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[9px] text-slate-500">ETHANOL</span>
                <span className="text-emerald-400 font-bold">{selectedShipment.telemetry.ethanol} ppm</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[9px] text-slate-500">HUMID</span>
                <span className="text-slate-300 font-bold">{selectedShipment.telemetry.humidity}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[9px] text-slate-500">SHOCK</span>
                <span className="text-slate-300 font-bold">{selectedShipment.telemetry.vibration}g</span>
              </div>
            </div>

            {/* Drilldown CTA */}
            <div className="pt-2">
              <Button
                href={`/dashboard/shipment/${selectedShipment.id}`}
                variant="primary"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open Digital Twin Telematics
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. WAYPOINT HUB INSPECTOR (Bottom-Left) */}
      {selectedHub && !selectedEvent && !selectedShipment && (
        <div className="absolute bottom-6 left-6 z-[1001] w-full max-w-sm p-4 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                Corridor Hub Infrastructure
              </span>
              <h4 className="text-sm font-bold text-white">{selectedHub.name}</h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHub(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="pt-2 flex flex-col gap-1.5 text-xs font-mono text-slate-300">
            <div>Country: <span className="text-white font-bold">{selectedHub.country}</span></div>
            <div>Throughput: <span className="text-emerald-400 font-bold">{selectedHub.throughputTeuPerYear}</span></div>
            <div>Reefer Storage: <span className="text-cyan-300 font-bold">{selectedHub.coldStorageCapacityM3}</span></div>
            {selectedHub.isBottleneck && (
              <div className="mt-1 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px]">
                ⚠️ Identified Middle Corridor Chokepoint (Maritime-Rail Transfer)
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. CORRIDOR REAL-TIME EVENT STREAM (Right Drawer Overlay) */}
      {showEventsDrawer && (
        <div className="hidden lg:flex flex-col absolute top-20 right-4 bottom-6 z-[1000] w-84 bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Live Incident Telemetry
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
              {activeEvents.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
            {activeEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const isCritical = evt.severity === 'CRITICAL';
              const isWarning = evt.severity === 'WARNING';
              const isBottleneck = evt.severity === 'BOTTLENECK';

              return (
                <div
                  key={evt.id}
                  onClick={() => handleSelectEventFromList(evt)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                      : isCritical
                      ? 'bg-red-950/20 hover:bg-red-950/40 border-red-500/30'
                      : isWarning
                      ? 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-500/30'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {evt.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                  </div>
                  <div className="font-semibold text-slate-200 line-clamp-1">{evt.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{evt.locationName}</div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Click pin to track camera</span>
            <span className="text-emerald-400 font-bold">TITR SYNC ON</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwinMap;
