'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { ShipmentItem } from '@/types/shipment';
import { 
  TransportMode, 
  CargoConditionTelemetry, 
  calculateBiologicalHealth 
} from '@/types/telemetry';
import { 
  CORRIDOR_HUBS, 
  CORRIDOR_ROUTES, 
  CORRIDOR_EVENTS, 
  SHIPMENT_GEO_POSITIONS, 
  TRANSPORT_MODES_CONFIG,
  CorridorEvent,
  MapWaypointHub,
  interpolateTrackPosition,
  getTrackCoordinatesForMode,
  getModeConfig
} from '@/lib/map-data';
import { 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Thermometer, 
  Activity, 
  Ship, 
  Truck, 
  Train,
  Box,
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  X, 
  Check, 
  Radio, 
  Anchor, 
  Crosshair, 
  Play,
  Pause,
  Sliders,
  Bell,
  Compass,
  Zap,
  Gauge
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface DigitalTwinMapProps {
  shipments?: ShipmentItem[];
  highlightShipmentId?: string;
  activeMode?: TransportMode;
  onSelectMode?: (mode: TransportMode) => void;
  conditionTelemetry?: CargoConditionTelemetry;
  animationProgress?: number; // 0 to 1
  isPlayingAnimation?: boolean;
  onTogglePlay?: () => void;
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
  shipments = [],
  highlightShipmentId,
  activeMode: externalMode,
  onSelectMode: externalOnSelectMode,
  conditionTelemetry,
  animationProgress: externalProgress,
  isPlayingAnimation: externalPlaying,
  onTogglePlay: externalTogglePlay,
  className = '',
}) => {
  const { t, locale } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const refTileLayerRef = useRef<any>(null);
  const animatedVehicleMarkerRef = useRef<any>(null);
  const layersGroupRef = useRef<{
    routes: any;
    hubs: any;
    shipments: any;
    events: any;
    vehicles: any;
  }>({ routes: null, hubs: null, shipments: null, events: null, vehicles: null });

  // Mode & Animation State
  const [internalMode, setInternalMode] = useState<TransportMode>('MULTIMODAL_COMBO');
  const currentMode = externalMode || internalMode;
  const modeConfig = useMemo(() => getModeConfig(currentMode), [currentMode]);

  const [internalProgress, setInternalProgress] = useState<number>(0.28);
  const [internalPlaying, setInternalPlaying] = useState<boolean>(true);
  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;
  const isPlaying = externalPlaying !== undefined ? externalPlaying : internalPlaying;

  // Layer filter state
  const [basemap, setBasemap] = useState<BasemapStyle>('dark');
  const [showShipments, setShowShipments] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showGaugeBreaksOnly, setShowGaugeBreaksOnly] = useState(false);
  const [showEventsDrawer, setShowEventsDrawer] = useState(false);
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

  // Active track coordinates for current mode
  const activeTrackCoords = useMemo(() => {
    return getTrackCoordinatesForMode(currentMode);
  }, [currentMode]);

  // Current vehicle position along active track
  const interpolatedVehicle = useMemo(() => {
    return interpolateTrackPosition(activeTrackCoords, currentProgress);
  }, [activeTrackCoords, currentProgress]);

  // Handle internal animation playback timer if external controls not supplied
  useEffect(() => {
    if (externalProgress !== undefined) return; // Parent is driving animation
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        const next = prev + 0.004;
        return next > 1.0 ? 0.0 : next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, externalProgress]);

  // Select Mode Handler (updates camera and emits callback)
  const handleSelectMode = (mode: TransportMode) => {
    if (externalOnSelectMode) {
      externalOnSelectMode(mode);
    } else {
      setInternalMode(mode);
    }

    const targetConfig = getModeConfig(mode);
    if (mapInstanceRef.current && targetConfig) {
      mapInstanceRef.current.flyToBounds(targetConfig.bounds, {
        padding: [60, 60],
        duration: 1.2,
      });
    }
  };

  const handleTogglePlay = () => {
    if (externalTogglePlay) {
      externalTogglePlay();
    } else {
      setInternalPlaying((prev) => !prev);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (isCancelled || !mapContainerRef.current) return;

      // Center on Trans-Caspian basin
      const map = L.map(mapContainerRef.current, {
        center: [42.4, 53.0],
        zoom: 5,
        minZoom: 3,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Base Tile Layer & optional Reference Overlay
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

      // Mouse tracker
      map.on('mousemove', (e: any) => {
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
      const vehiclesGroup = L.layerGroup().addTo(map);

      layersGroupRef.current = {
        routes: routesGroup,
        hubs: hubsGroup,
        shipments: shipmentsGroup,
        events: eventsGroup,
        vehicles: vehiclesGroup,
      };

      renderStaticLayers(L);
      renderVehicleMarker(L);
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

  // Update Base Tile
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
      }).addTo(mapInstanceRef.current);

      if (baseCfg.refUrl) {
        refTileLayerRef.current = L.tileLayer(baseCfg.refUrl, {
          maxZoom: baseCfg.maxZoom,
        }).addTo(mapInstanceRef.current);
      }
    });
  }, [basemap]);

  // Re-render Static Layers on filter/mode change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((LModule) => {
      renderStaticLayers(LModule.default);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShipments, showEvents, showHubs, showRoutes, showGaugeBreaksOnly, shipments, acknowledgedEventIds, currentMode]);

  // Update animated vehicle marker position
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((LModule) => {
      renderVehicleMarker(LModule.default);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interpolatedVehicle, currentMode]);

  // Handle highlighted shipment prop
  useEffect(() => {
    if (!highlightShipmentId || !mapInstanceRef.current) return;
    const target = shipments.find((s) => s.id.toLowerCase() === highlightShipmentId.toLowerCase());
    if (target) {
      setSelectedShipment(target);
      const pos = SHIPMENT_GEO_POSITIONS[target.id];
      if (pos) {
        mapInstanceRef.current.flyTo([pos.lat, pos.lng], 8, { duration: 1.2 });
      }
    }
  }, [highlightShipmentId, shipments]);

  // Render Static Polylines, Hubs, Events, Shipments
  const renderStaticLayers = (L: any) => {
    const { routes, hubs, shipments: shipsGroup, events } = layersGroupRef.current;
    if (!routes || !hubs || !shipsGroup || !events) return;

    routes.clearLayers();
    hubs.clearLayers();
    shipsGroup.clearLayers();
    events.clearLayers();

    // 1. Draw Routes (Active mode is highlighted)
    if (showRoutes) {
      CORRIDOR_ROUTES.forEach((route) => {
        const isActiveRoute = modeConfig.routeIds.includes(route.id);
        const isMultimodal = currentMode === 'MULTIMODAL_COMBO';

        const strokeColor = isActiveRoute ? modeConfig.strokeColor : route.color;
        const strokeWidth = isActiveRoute ? (isMultimodal ? 4.5 : 5.5) : 2.5;
        const strokeOpacity = isActiveRoute ? 0.95 : 0.35;

        const polylineOptions: any = {
          color: strokeColor,
          weight: strokeWidth,
          opacity: strokeOpacity,
          lineJoin: 'round',
        };
        if (route.dashArray || (isActiveRoute && currentMode === 'RO_PAX_FERRY')) {
          polylineOptions.dashArray = route.dashArray || '8 6';
        }

        const line = L.polyline(route.coordinates, polylineOptions);
        line.bindTooltip(
          `<div class="text-[11px] font-mono font-semibold py-0.5 px-1.5 bg-slate-950 text-white rounded border border-slate-700">
            ${route.name} (${route.mode})${isActiveRoute ? ' • [ACTIVE MODE TRACK]' : ''}
          </div>`,
          { className: 'leaflet-dark-tooltip', sticky: true }
        );

        line.on('click', () => {
          if (route.mode === 'SEA') {
            handleSelectMode('RO_PAX_FERRY');
          } else if (route.mode === 'HIGHWAY') {
            handleSelectMode('TIR_TRUCK');
          } else {
            handleSelectMode('RAIL_REEFER');
          }
        });

        line.addTo(routes);
      });
    }

    // 2. Draw Corridor Hubs & Gauge-Break Points
    if (showHubs) {
      CORRIDOR_HUBS.forEach((hub) => {
        if (showGaugeBreaksOnly && !hub.isGaugeBreak && !hub.isBottleneck) {
          return;
        }

        const isGaugeBreak = hub.isGaugeBreak;
        const isBottleneck = hub.isBottleneck;

        let iconBadgeClass = 'bg-slate-900 border-2 border-emerald-400';
        let innerDotClass = 'bg-emerald-400';
        let symbolText = '';

        if (isGaugeBreak) {
          iconBadgeClass = 'bg-indigo-900 border-2 border-cyan-400 shadow-cyan-500/50 shadow-md';
          innerDotClass = 'bg-cyan-300';
          symbolText = '⇄';
        } else if (isBottleneck) {
          iconBadgeClass = 'bg-amber-950 border-2 border-amber-400 shadow-amber-500/50 shadow-md';
          innerDotClass = 'bg-amber-400';
          symbolText = '⚓';
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${(isGaugeBreak || isBottleneck) ? '<div class="absolute -inset-2 rounded-full bg-cyan-400/20 animate-ping"></div>' : ''}
            <div class="w-5 h-5 rounded-full ${iconBadgeClass} shadow-md flex items-center justify-center text-[10px] text-white font-bold transition-transform group-hover:scale-125">
              ${symbolText || `<div class="w-1.5 h-1.5 rounded-full ${innerDotClass}"></div>`}
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-800 shadow-lg pointer-events-none group-hover:border-slate-600 group-hover:text-white">
              ${hub.shortName}${isGaugeBreak ? ' [1435⇄1520]' : ''}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-hub-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([hub.lat, hub.lng], { icon });
        marker.on('click', () => {
          setSelectedHub(hub);
          setSelectedEvent(null);
          setSelectedShipment(null);
          mapInstanceRef.current.flyTo([hub.lat, hub.lng], 8, { duration: 0.9 });
        });
        marker.addTo(hubs);
      });
    }

    // 3. Draw Active Shipments Fleet
    if (showShipments && shipments.length > 0) {
      shipments.forEach((shipment) => {
        const geo = SHIPMENT_GEO_POSITIONS[shipment.id] || { lat: 43.18, lng: 51.65, mode: 'TRAIN' };
        const isCritical = shipment.status === 'CRITICAL';
        const isWarning = shipment.status === 'WARNING';

        const colorBg = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
        const borderColor = isCritical ? 'border-red-400' : isWarning ? 'border-amber-400' : 'border-emerald-400';

        const iconHtml = `
          <div class="relative cursor-pointer flex flex-col items-center group">
            ${isCritical ? '<div class="absolute -inset-2 rounded-xl bg-red-500/40 animate-ping"></div>' : ''}
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border ${borderColor} shadow-xl text-[10px] font-mono text-white transition-transform group-hover:scale-110">
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
          iconSize: [88, 38],
          iconAnchor: [44, 38],
        });

        const marker = L.marker([geo.lat, geo.lng], { icon });
        marker.on('click', () => {
          setSelectedShipment(shipment);
          setSelectedEvent(null);
          setSelectedHub(null);
          mapInstanceRef.current.flyTo([geo.lat, geo.lng], 8, { duration: 0.8 });
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
          mapInstanceRef.current.flyTo([evt.lat, evt.lng], 8, { duration: 0.8 });
        });
        marker.addTo(events);
      });
    }
  };

  // Render & Update Reactive Moving Vehicle Marker
  const renderVehicleMarker = (L: any) => {
    const { vehicles } = layersGroupRef.current;
    if (!vehicles) return;

    const { lat, lng, bearingDegrees } = interpolatedVehicle;

    let vehicleIconTag = '🚂';
    let vehicleLabel = 'KTZ-REEFER CONSIST';
    let strokeBadge = 'border-emerald-400 text-emerald-300';

    if (modeConfig.vehicleType === 'SHIP') {
      vehicleIconTag = '🚢';
      vehicleLabel = 'RO-PAX "BARYS-1"';
      strokeBadge = 'border-sky-400 text-sky-300';
    } else if (modeConfig.vehicleType === 'TRUCK') {
      vehicleIconTag = '🚛';
      vehicleLabel = 'WE-WC REEFER TRAILER';
      strokeBadge = 'border-amber-400 text-amber-300';
    } else if (modeConfig.vehicleType === 'CONTAINER') {
      vehicleIconTag = '📦';
      vehicleLabel = 'SMART 40FT CA REEFER';
      strokeBadge = 'border-purple-400 text-purple-300';
    } else if (modeConfig.vehicleType === 'MULTIMODAL') {
      vehicleIconTag = '⚡';
      vehicleLabel = 'TITR INTERMODAL CHAIN';
      strokeBadge = 'border-cyan-400 text-cyan-300';
    }

    const calculatedBhi = conditionTelemetry 
      ? calculateBiologicalHealth(conditionTelemetry).bhi 
      : 96.5;

    const vehicleHtml = `
      <div class="relative cursor-pointer flex flex-col items-center group select-none">
        <!-- Beacon pulse -->
        <div class="absolute -inset-3 rounded-full bg-cyan-400/30 animate-ping pointer-events-none"></div>
        
        <!-- Vehicle Badge -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border ${strokeBadge} shadow-2xl text-[10px] font-mono font-bold tracking-tight text-white transition-transform group-hover:scale-110">
          <span class="text-sm">${vehicleIconTag}</span>
          <span>${vehicleLabel}</span>
          <span class="text-emerald-400 ml-1">BHI: ${calculatedBhi}%</span>
        </div>

        <div class="w-1.5 h-2 bg-cyan-400/80 -mt-0.5"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
          <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>

        <!-- Coordinates Tooltip -->
        <div class="absolute -bottom-6 whitespace-nowrap bg-slate-900/90 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          GPS: ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E • BRG: ${bearingDegrees}°
        </div>
      </div>
    `;

    const customVehicleIcon = L.divIcon({
      html: vehicleHtml,
      className: 'custom-active-vehicle-icon',
      iconSize: [160, 42],
      iconAnchor: [80, 42],
    });

    if (animatedVehicleMarkerRef.current) {
      animatedVehicleMarkerRef.current.setLatLng([lat, lng]);
      animatedVehicleMarkerRef.current.setIcon(customVehicleIcon);
    } else {
      vehicles.clearLayers();
      const marker = L.marker([lat, lng], { icon: customVehicleIcon });
      marker.on('click', () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 8, { duration: 0.8 });
        }
      });
      marker.addTo(vehicles);
      animatedVehicleMarkerRef.current = marker;
    }
  };

  // Center fit corridor bounds
  const handleFitCorridor = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyToBounds(
      [
        [38.0, 27.0], // SW (Turkey/South Caucasus)
        [47.5, 82.0], // NE (Almaty/Khorgos)
      ],
      { padding: [50, 50], duration: 1.2 }
    );
  };

  const handleSelectEventFromList = (evt: CorridorEvent) => {
    setSelectedEvent(evt);
    setSelectedShipment(null);
    setSelectedHub(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([evt.lat, evt.lng], 8, { duration: 1.0 });
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
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Corridor Identity & GPS Readout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-wider">DIGITAL TWIN MAP</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 uppercase font-semibold">{modeConfig.shortName}</span>
          </div>

          {/* Real-time Cursor Coordinates */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>LAT: {cursorCoords.lat}° N</span>
            <span>LNG: {cursorCoords.lng}° E</span>
          </div>
        </div>

        {/* Center: Live Anomaly Count */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/50 text-[11px] font-mono text-red-300">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span>{criticalCount} CRITICAL</span>
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
              OSM
            </button>
          </div>

          {/* Gauge Breaks Filter */}
          <button
            type="button"
            onClick={() => setShowGaugeBreaksOnly(!showGaugeBreaksOnly)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors ${
              showGaugeBreaksOnly 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Highlight Break-of-Gauge facilities (Khorgos & Akhalkalaki)"
          >
            <span>⇄ Gauge-Breaks</span>
          </button>

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
            <span className="hidden sm:inline">Events ({activeEvents.length})</span>
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

      {/* 3. BOTTOM FLOATING ANIMATION & TRANSPORT MODE TOOLBAR */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* 5-Mode Transport Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
            Mode:
          </span>

          {(['RAIL_REEFER', 'RO_PAX_FERRY', 'TIR_TRUCK', 'SMART_REEFER_CONTAINER', 'MULTIMODAL_COMBO'] as TransportMode[]).map((modeKey) => {
            const isSelected = currentMode === modeKey;
            const cfg = getModeConfig(modeKey);

            let IconComp = Train;
            if (cfg.vehicleType === 'SHIP') IconComp = Ship;
            if (cfg.vehicleType === 'TRUCK') IconComp = Truck;
            if (cfg.vehicleType === 'CONTAINER') IconComp = Box;
            if (cfg.vehicleType === 'MULTIMODAL') IconComp = Layers;

            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => handleSelectMode(modeKey)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white font-bold border border-cyan-400/80 shadow-sm ring-1 ring-cyan-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{cfg.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Animation Scrubber & Play/Pause */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`p-2 rounded-lg border text-white font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
            title={isPlaying ? 'Pause Animation' : 'Play Animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 flex-1 sm:w-48 font-mono text-[11px] text-slate-300">
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={currentProgress}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setInternalProgress(val);
              }}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              aria-label="Route animation progress"
            />
            <span className="w-10 text-right font-bold text-cyan-400">
              {Math.round(currentProgress * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. EVENT INSPECTOR MODAL OVERLAY (Bottom-Left) */}
      {selectedEvent && (
        <div className="absolute bottom-20 left-4 z-[1001] w-full max-w-lg p-5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl animate-in fade-in duration-200">
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

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
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

            {/* Prescribed AI Action */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider block mb-1">
                Prescribed AI Action:
              </span>
              <p className="text-purple-200 text-xs leading-relaxed">{selectedEvent.aiAction}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAcknowledgeEvent(selectedEvent.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. SHIPMENT INSPECTOR (When clicking shipment marker on map) */}
      {selectedShipment && !selectedEvent && (
        <div className="absolute bottom-20 left-4 z-[1001] w-full max-w-sm p-4 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedShipment.status === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : selectedShipment.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {selectedShipment.status}
                </span>
                <span className="text-xs font-mono font-bold text-white">{selectedShipment.id}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{selectedShipment.cargoNameEn}</h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedShipment(null)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 flex flex-col gap-2.5">
            <div className="text-xs text-slate-300 font-mono">
              <div className="text-slate-400">{locale === 'ru' ? 'Маршрут' : locale === 'kz' ? 'Бағыт' : 'Route'}: <span className="text-white font-semibold">{selectedShipment.origin} → {selectedShipment.destination}</span></div>
              <div className="text-slate-400 mt-0.5">{locale === 'ru' ? 'Хаб / Пункт' : locale === 'kz' ? 'Хаб / Торап' : 'Waypoint'}: <span className="text-cyan-400 font-semibold">{selectedShipment.waypointName}</span></div>
              <div className="text-slate-400 mt-0.5">{locale === 'ru' ? 'Перевозчик' : locale === 'kz' ? 'Тасымалдаушы' : 'Carrier'}: <span className="text-slate-300">{selectedShipment.carrier}</span></div>
            </div>

            {/* Telemetry Snapshot */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">{locale === 'ru' ? 'ТЕМП' : locale === 'kz' ? 'ТЕМП' : 'TEMP'}</span>
                <span className={`font-bold ${selectedShipment.telemetry.temperature > 5 ? 'text-red-400' : 'text-cyan-300'}`}>
                  {selectedShipment.telemetry.temperature > 0 ? `+${selectedShipment.telemetry.temperature}` : selectedShipment.telemetry.temperature}°C
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">{locale === 'ru' ? 'ИНДЕКС BHI' : locale === 'kz' ? 'BHI ИНДЕКСІ' : 'BHI HEALTH'}</span>
                <span className={`font-bold ${selectedShipment.bhi < 50 ? 'text-red-400' : selectedShipment.bhi < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedShipment.bhi}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">{locale === 'ru' ? 'ПРИБЫТИЕ' : locale === 'kz' ? 'КЕЛУІ' : 'ETA'}</span>
                <span className="font-bold text-slate-300">{selectedShipment.eta}</span>
              </div>
            </div>

            {/* Direct Link to Shipment Detailed IoT Monitor */}
            <div className="pt-1">
              <Link
                href={`/dashboard/shipment/${selectedShipment.id}`}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{locale === 'ru' ? 'Осмотреть цифровой двойник контейнера' : locale === 'kz' ? 'Контейнердің сандық егізін тексеру' : 'Inspect Container IoT Twin'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. WAYPOINT HUB INSPECTOR */}
      {selectedHub && !selectedEvent && !selectedShipment && (
        <div className="absolute bottom-20 left-4 z-[1001] w-full max-w-sm p-4 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                {locale === 'ru' ? 'Инфраструктура хаба коридора' : locale === 'kz' ? 'Дәліз хабының инфрақұрылымы' : 'Corridor Hub Infrastructure'}
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
            <div>{locale === 'ru' ? 'Страна' : locale === 'kz' ? 'Ел' : 'Country'}: <span className="text-white font-bold">{selectedHub.country}</span></div>
            <div>{locale === 'ru' ? 'Колея' : locale === 'kz' ? 'Табан' : 'Track Gauge'}: <span className="text-cyan-400 font-bold">{selectedHub.gaugeMm || 'Standard'}</span></div>
            <div>{locale === 'ru' ? 'Пропускная способность' : locale === 'kz' ? 'Өткізу қабілеті' : 'Throughput'}: <span className="text-emerald-400 font-bold">{selectedHub.throughputTeuPerYear}</span></div>
            <div>{locale === 'ru' ? 'Рефрижераторные склады' : locale === 'kz' ? 'Рефрижераторлық қоймалар' : 'Reefer Storage'}: <span className="text-cyan-300 font-bold">{selectedHub.coldStorageCapacityM3}</span></div>
            {selectedHub.isGaugeBreak && (
              <div className="mt-1 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 text-[11px]">
                ⇄ Major Break-of-Gauge Facility ({selectedHub.gaugeMm})
              </div>
            )}
            {selectedHub.isBottleneck && (
              <div className="mt-1 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 text-[11px]">
                ⚓ Identified Middle Corridor Maritime-Rail Chokepoint
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. CORRIDOR REAL-TIME EVENT STREAM DRAWER */}
      {showEventsDrawer && (
        <div className="flex flex-col absolute top-20 right-4 bottom-20 z-[1000] w-84 bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3 shadow-2xl overflow-hidden">
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

              return (
                <div
                  key={evt.id}
                  onClick={() => handleSelectEventFromList(evt)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
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
        </div>
      )}
    </div>
  );
};

export default DigitalTwinMap;
