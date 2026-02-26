import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fleetVessels, vesselRoutes, type FleetVessel } from '@/data/fleetData';
import { canalsPorts } from '@/data/mockData';
import { Anchor, Bell, Settings, Search, Pin, PinOff, ArrowLeft, Ship, MapPin, Clock, Fuel, CloudRain, Shield, Navigation } from 'lucide-react';
import NavTab from '@/components/NavTab';

const SHIP_BLUE = 'hsl(224, 76%, 48%)';
const CHARTER_GOLD = 'hsl(45, 93%, 47%)';

const FleetOverview = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const fleetLayerRef = useRef<L.LayerGroup | null>(null);
  const vesselLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedVessel, setSelectedVessel] = useState<FleetVessel | null>(null);
  const [vesselPanelShow, setVesselPanelShow] = useState(false);
  const [vesselPanelPinned, setVesselPanelPinned] = useState(false);
  const [canalPanelShow, setCanalPanelShow] = useState(false);
  const [canalPanelPinned, setCanalPanelPinned] = useState(false);
  const [sortBy, setSortBy] = useState<'risk' | 'charter'>('risk');

  const vesselHideTimer = useRef<NodeJS.Timeout>();
  const canalHideTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) { navigate('/login'); return; }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/login');
  };

  // Hover handlers
  const showVesselPanel = useCallback(() => {
    clearTimeout(vesselHideTimer.current);
    setVesselPanelShow(true);
  }, []);
  const hideVesselPanel = useCallback(() => {
    if (vesselPanelPinned) return;
    vesselHideTimer.current = setTimeout(() => setVesselPanelShow(false), 400);
  }, [vesselPanelPinned]);

  const showCanalPanel = useCallback(() => {
    clearTimeout(canalHideTimer.current);
    setCanalPanelShow(true);
  }, []);
  const hideCanalPanel = useCallback(() => {
    if (canalPanelPinned) return;
    canalHideTimer.current = setTimeout(() => setCanalPanelShow(false), 400);
  }, [canalPanelPinned]);

  const selectVessel = useCallback((vessel: FleetVessel) => {
    const captainData = {
      id: vessel.id, name: 'Capt. Demo User', shipName: vessel.name, shipType: vessel.type,
      cargoType: vessel.cargo, imo: vessel.imo, currentSpeed: vessel.speed, heading: vessel.heading,
      draft: vessel.draft, fuelRemaining: vessel.fuelRemaining, position: vessel.position,
      eta: vessel.eta, voyageId: vessel.voyageId, departurePort: vessel.departurePort,
      destinationPort: vessel.destinationPort,
    };
    localStorage.setItem('voyageguard_captain', JSON.stringify(captainData));
    setSelectedVessel(vessel);
    setVesselPanelShow(false);
    setVesselPanelPinned(false);
  }, []);

  const backToFleet = useCallback(() => {
    setSelectedVessel(null);
    setCanalPanelShow(false);
    setCanalPanelPinned(false);
  }, []);

  const sortedVessels = [...fleetVessels].sort((a, b) => {
    if (sortBy === 'charter') {
      if (a.chartered && !b.chartered) return -1;
      if (!a.chartered && b.chartered) return 1;
    }
    return b.riskScore - a.riskScore;
  });

  // Map init
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 40],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const fleetLayer = L.layerGroup().addTo(map);
    fleetLayerRef.current = fleetLayer;

    fleetVessels.forEach(vessel => {
      const isChartered = vessel.chartered;
      const ringColor = isChartered ? CHARTER_GOLD : SHIP_BLUE;

      const icon = L.divIcon({
        className: 'fleet-ship-marker',
        html: `
          <div style="position:relative; width:${isChartered ? '42px' : '36px'}; height:${isChartered ? '42px' : '36px'}; cursor:pointer;">
            <div style="position:absolute; inset:0; background:${ringColor}20; border:${isChartered ? '2.5px' : '0px'} solid ${ringColor}; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
            <div style="position:absolute; inset:${isChartered ? '6px' : '4px'}; background:${SHIP_BLUE}; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
            </div>
            ${isChartered ? '<div style="position:absolute; top:-3px; right:-3px; width:16px; height:16px; background:hsl(45,93%,47%); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; color:white; font-weight:900; border:1.5px solid white; box-shadow:0 1px 4px rgba(0,0,0,0.2);">★</div>' : ''}
          </div>
        `,
        iconSize: [isChartered ? 42 : 36, isChartered ? 42 : 36],
        iconAnchor: [isChartered ? 21 : 18, isChartered ? 21 : 18],
      });

      const nameLabel = L.marker([vessel.position.lat, vessel.position.lng], {
        icon: L.divIcon({
          className: 'vessel-name-label',
          html: `<div style="background:${isChartered ? 'linear-gradient(135deg, white, hsl(45,93%,95%))' : 'white'}; border:1px solid ${isChartered ? 'hsl(45,80%,70%)' : 'hsl(220,13%,90%)'}; border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; color:hsl(220,20%,15%); white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.08);">${vessel.name.length > 16 ? vessel.name.substring(0, 14) + '…' : vessel.name}${isChartered ? ' <span style="color:hsl(45,93%,47%);">★</span>' : ''}</div>`,
          iconSize: [130, 16],
          iconAnchor: [65, -14],
        }),
        interactive: false,
      });
      fleetLayer.addLayer(nameLabel);

      const marker = L.marker([vessel.position.lat, vessel.position.lng], { icon })
        .bindTooltip(
          `<div style="min-width:210px;">
            <div style="font-weight:700; font-size:12px; margin-bottom:2px;">${vessel.name} ${isChartered ? '<span style="color:hsl(45,93%,47%); font-size:9px;">★ CHARTERED</span>' : ''}</div>
            <div style="font-size:10px; color:#64748b; margin-bottom:4px;">IMO: ${vessel.imo} · ${vessel.type}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; font-size:10px;">
              <div style="color:#64748b;">Speed</div><div style="font-weight:600;">${vessel.speed}</div>
              <div style="color:#64748b;">Heading</div><div style="font-weight:600;">${vessel.heading}</div>
              <div style="color:#64748b;">Draft</div><div style="font-weight:600;">${vessel.draft}</div>
              <div style="color:#64748b;">Fuel</div><div style="font-weight:600;">${vessel.fuelRemaining}</div>
              <div style="color:#64748b;">Cargo</div><div style="font-weight:600;">${vessel.cargo}</div>
            </div>
            <div style="margin-top:6px; padding-top:4px; border-top:1px solid #e2e8f0; font-size:9px; color:#64748b;">
              ${vessel.departurePort} → ${vessel.destinationPort} · ETA: ${vessel.eta}
            </div>
            <div style="margin-top:4px; font-size:9px; color:hsl(224,76%,48%); font-weight:700;">Click to view voyage details →</div>
          </div>`,
          { direction: 'top', offset: [0, -20], className: 'fleet-vessel-tooltip' }
        );

      marker.on('click', () => selectVessel(vessel));
      fleetLayer.addLayer(marker);

      // Draw faint route line for each vessel in fleet view
      const waypoints = vesselRoutes[vessel.id];
      if (waypoints && waypoints.length > 1) {
        const routeLine = L.polyline(waypoints, {
          color: isChartered ? 'hsl(45,93%,47%)' : SHIP_BLUE,
          weight: 1,
          dashArray: '4, 8',
          opacity: 0.25,
        });
        fleetLayer.addLayer(routeLine);
      }
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Handle vessel selection changes on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedVessel) {
      fleetLayerRef.current?.remove();

      const vesselLayer = L.layerGroup().addTo(map);
      vesselLayerRef.current = vesselLayer;

      const waypoints = vesselRoutes[selectedVessel.id] || [];
      if (waypoints.length > 1) {
        L.polyline(waypoints, { color: '#2563eb', weight: 2.5, dashArray: '8, 6', opacity: 0.7 }).addTo(vesselLayer as any);

        const vesselIdx = waypoints.findIndex(
          ([lat, lng]) => Math.abs(lat - selectedVessel.position.lat) < 2 && Math.abs(lng - selectedVessel.position.lng) < 3
        );
        if (vesselIdx >= 0) {
          L.polyline(waypoints.slice(0, vesselIdx + 1), { color: '#2563eb', weight: 3.5, opacity: 0.9 }).addTo(vesselLayer as any);
        }
      }

      // Ship marker
      const isChartered = selectedVessel.chartered;
      const shipIcon = L.divIcon({
        className: 'ship-marker',
        html: `
          <div style="position:relative; width:40px; height:40px;">
            <div style="position:absolute; inset:0; background:${SHIP_BLUE}15; border-radius:50%; animation: pulse-ring 2s ease-out infinite;"></div>
            <div style="position:absolute; inset:4px; background:${SHIP_BLUE}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; border:3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
            </div>
            ${isChartered ? '<div style="position:absolute; top:-2px; right:-2px; width:16px; height:16px; background:hsl(45,93%,47%); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; color:white; font-weight:900; border:1.5px solid white;">★</div>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([selectedVessel.position.lat, selectedVessel.position.lng], { icon: shipIcon })
        .addTo(vesselLayer as any)
        .bindTooltip(
          `<div style="min-width:200px;">
            <div style="font-weight:700; font-size:12px; margin-bottom:6px;">${selectedVessel.name}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-size:10px;">
              <div style="color:#64748b;">Speed</div><div style="font-weight:600;">${selectedVessel.speed}</div>
              <div style="color:#64748b;">Heading</div><div style="font-weight:600;">${selectedVessel.heading}</div>
              <div style="color:#64748b;">Draft</div><div style="font-weight:600;">${selectedVessel.draft}</div>
              <div style="color:#64748b;">Fuel</div><div style="font-weight:600;">${selectedVessel.fuelRemaining}</div>
              <div style="color:#64748b;">Cargo</div><div style="font-weight:600;">${selectedVessel.cargo}</div>
            </div>
          </div>`,
          { direction: 'top', offset: [0, -20], className: 'fleet-vessel-tooltip' }
        );

      // Ship name label
      L.marker([selectedVessel.position.lat, selectedVessel.position.lng], {
        icon: L.divIcon({
          className: 'ship-name-label',
          html: `<div style="background:white; border:1px solid #e2e8f0; border-radius:6px; padding:2px 8px; font-size:10px; font-weight:700; color:hsl(220,20%,15%); white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.1);">${selectedVessel.name}</div>`,
          iconSize: [140, 16],
          iconAnchor: [70, -16],
        }),
        interactive: false,
      }).addTo(vesselLayer as any);

      // Departure & destination labels
      if (waypoints.length >= 2) {
        const dep = waypoints[0];
        const dest = waypoints[waypoints.length - 1];
        L.marker(dep as [number, number], {
          icon: L.divIcon({
            className: 'port-label',
            html: `<div style="background:hsl(152,69%,41%); color:white; border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.15);">⚓ ${selectedVessel.departurePort.split(',')[0].split('(')[0].trim()}</div>`,
            iconSize: [120, 16],
            iconAnchor: [60, -10],
          }),
          interactive: false,
        }).addTo(vesselLayer as any);
        L.marker(dest as [number, number], {
          icon: L.divIcon({
            className: 'port-label',
            html: `<div style="background:hsl(224,76%,48%); color:white; border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.15);">📍 ${selectedVessel.destinationPort.split(',')[0].split('(')[0].trim()}</div>`,
            iconSize: [120, 16],
            iconAnchor: [60, -10],
          }),
          interactive: false,
        }).addTo(vesselLayer as any);
      }

      // Canal/port markers
      canalsPorts.forEach(cp => {
        const color = cp.congestionStatus === 'High' ? '#ef4444' : cp.congestionStatus === 'Medium' ? '#f59e0b' : '#22c55e';
        const markerIcon = L.divIcon({
          className: 'canal-marker',
          html: `
            <div style="position:relative; width:28px; height:28px;">
              <div style="position:absolute; inset:0; background:${color}20; border:2px solid ${color}; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
              <div style="position:absolute; inset:5px; background:${color}; border-radius:50%;"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const etaDate = getExpectedDate(cp.eta);

        const marker = L.marker([cp.position.lat, cp.position.lng], { icon: markerIcon })
          .addTo(vesselLayer as any)
          .bindTooltip(
            `<div style="min-width:180px;">
              <div style="font-weight:700; font-size:12px; margin-bottom:4px;">${cp.name}</div>
              <div style="display:flex; gap:6px; margin-bottom:4px;">
                <span style="background:${color}20; color:${color}; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:600;">${cp.type.toUpperCase()}</span>
                <span style="background:${color}20; color:${color}; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:600;">${cp.congestionStatus} Traffic</span>
              </div>
              <div style="font-size:10px; color:#475569; margin-bottom:2px;">Expected: <b>${etaDate}</b></div>
              <div style="font-size:10px; color:#475569; margin-bottom:2px;">ETA: <b>${cp.eta}</b> | Dist: <b>${cp.distance}</b></div>
              <div style="font-size:10px; color:#475569; margin-bottom:2px;">Queue: <b>${cp.queueLength} vessels</b></div>
              <div style="font-size:10px; color:#475569;">Security: <b>${cp.securityLevel}</b></div>
              ${cp.requiresBidding ? '<div style="font-size:9px; color:#2563eb; font-weight:600; margin-top:4px;">Bidding: $' + (cp.currentBidRange.min / 1000).toFixed(0) + 'k - $' + (cp.currentBidRange.max / 1000).toFixed(0) + 'k</div>' : ''}
            </div>`,
            { direction: 'top', offset: [0, -14], className: 'canal-tooltip-detailed' }
          );

        L.marker([cp.position.lat, cp.position.lng], {
          icon: L.divIcon({
            className: 'canal-eta-label',
            html: `<div style="background:white; border:1px solid #e2e8f0; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:600; color:#475569; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.1);">${cp.eta}</div>`,
            iconSize: [60, 16],
            iconAnchor: [30, -8],
          }),
          interactive: false,
        }).addTo(vesselLayer as any);

        marker.on('click', () => navigate(`/bidding/${cp.id}`));
      });

      map.flyTo([selectedVessel.position.lat, selectedVessel.position.lng], 5, { duration: 1.5, easeLinearity: 0.25 });
    } else {
      vesselLayerRef.current?.remove();
      vesselLayerRef.current = null;
      fleetLayerRef.current?.addTo(map);
      map.flyTo([20, 40], 3, { duration: 1.5 });
    }
  }, [selectedVessel, navigate]);

  const charteredCount = fleetVessels.filter(v => v.chartered).length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base">AquaMinds</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab active>Fleet Overview</NavTab>
            <NavTab onClick={() => navigate('/port-intelligence')}>Port Intelligence</NavTab>
            <NavTab onClick={() => navigate('/voyage-planner')}>Voyage Planner</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search vessels, ports..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">D</button>
        </div>
      </header>

      {/* Map + panels */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {/* Fleet stats overlay (fleet mode) */}
        {!selectedVessel && (
          <div className="absolute top-4 left-4 z-[1000] flex gap-2 animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
              <div className="text-[9px] font-bold text-muted-foreground tracking-wider">FLEET</div>
              <div className="text-lg font-bold text-foreground">{fleetVessels.length}</div>
            </div>
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md" style={{ borderColor: 'hsl(45,80%,70%)' }}>
              <div className="text-[9px] font-bold tracking-wider" style={{ color: CHARTER_GOLD }}>CHARTERED</div>
              <div className="text-lg font-bold" style={{ color: CHARTER_GOLD }}>{charteredCount}</div>
            </div>
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
              <div className="text-[9px] font-bold text-muted-foreground tracking-wider">IN TRANSIT</div>
              <div className="text-lg font-bold text-secondary">{fleetVessels.filter(v => v.delayHours === 0).length}</div>
            </div>
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
              <div className="text-[9px] font-bold text-muted-foreground tracking-wider">DELAYED</div>
              <div className="text-lg font-bold text-destructive">{fleetVessels.filter(v => v.delayHours > 0).length}</div>
            </div>
          </div>
        )}

        {/* Ship info panel (vessel detail mode) */}
        {selectedVessel && (
          <div className="absolute top-4 left-4 z-[1000] w-[280px] bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-lg animate-fade-in">
            <button onClick={backToFleet} className="flex items-center gap-1.5 text-[11px] text-primary font-medium mb-3 hover:underline">
              <ArrowLeft className="w-3 h-3" /> Back to Fleet
            </button>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-foreground text-sm">{selectedVessel.name}</h3>
              <div className="flex items-center gap-1.5">
                {selectedVessel.chartered && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(45,93%,92%)', color: CHARTER_GOLD }}>★ CHARTERED</span>
                )}
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success uppercase animate-pulse">On Route</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">{selectedVessel.type} • IMO {selectedVessel.imo}</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Speed</span><span className="font-semibold text-foreground">{selectedVessel.speed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heading</span><span className="font-medium text-foreground">{selectedVessel.heading}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Draft</span><span className="font-medium text-foreground">{selectedVessel.draft}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span className="font-bold text-foreground">{selectedVessel.destinationPort.split(',')[0].split('(')[0].trim()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ETA</span><span className="font-bold text-destructive">{selectedVessel.etaDate}</span></div>
            </div>
            <div className="mt-3">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: '55%' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground uppercase font-medium">{selectedVessel.departurePort.split(',')[0].split('(')[0].trim()}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-medium">{selectedVessel.destinationPort.split(',')[0].split('(')[0].trim()}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Fuel className="w-3 h-3" /> Fuel</div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: selectedVessel.fuelRemaining }} />
                </div>
                <span className="text-[10px] font-bold text-foreground">{selectedVessel.fuelRemaining}</span>
              </div>
            </div>
            {selectedVessel.chartered && selectedVessel.charterRate && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Charter Rate</span>
                <span className="text-[10px] font-bold" style={{ color: CHARTER_GOLD }}>${selectedVessel.charterRate.toLocaleString()}/day</span>
              </div>
            )}
          </div>
        )}

        {/* Right edge hover zone */}
        {!(selectedVessel ? (canalPanelShow || canalPanelPinned) : (vesselPanelShow || vesselPanelPinned)) && (
          <div
            className="absolute top-0 right-0 w-16 h-full z-[998]"
            onMouseEnter={selectedVessel ? showCanalPanel : showVesselPanel}
          />
        )}

        {/* Right edge tab (always visible when panel is hidden) */}
        {!(selectedVessel ? (canalPanelShow || canalPanelPinned) : (vesselPanelShow || vesselPanelPinned)) && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-[999] w-8 h-20 bg-card/90 backdrop-blur-sm border border-r-0 border-border rounded-l-xl flex flex-col items-center justify-center gap-1 shadow-md hover:bg-card transition-colors"
            onMouseEnter={selectedVessel ? showCanalPanel : showVesselPanel}
            onClick={() => selectedVessel ? setCanalPanelPinned(true) : setVesselPanelPinned(true)}
          >
            {selectedVessel ? <Anchor className="w-3.5 h-3.5 text-primary" /> : <Ship className="w-3.5 h-3.5 text-primary" />}
            <span className="text-[7px] font-bold text-muted-foreground writing-mode-vertical" style={{ writingMode: 'vertical-lr' }}>
              {selectedVessel ? 'PORTS' : 'SHIPS'}
            </span>
          </button>
        )}

        {/* Vessel list panel (fleet mode) */}
        {!selectedVessel && (
          <div
            className={`absolute top-0 right-0 h-full z-[1000] bg-card/95 backdrop-blur-md border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${vesselPanelShow || vesselPanelPinned ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '350px' }}
            onMouseEnter={showVesselPanel}
            onMouseLeave={hideVesselPanel}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">Vessels in Transit</h2>
                <p className="text-[10px] text-muted-foreground">{fleetVessels.length} active · {charteredCount} chartered</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortBy(sortBy === 'risk' ? 'charter' : 'risk')}
                  className="text-[10px] px-2.5 py-1 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {sortBy === 'risk' ? '↓ Risk' : '★ Charter'}
                </button>
                <button
                  onClick={() => { setVesselPanelPinned(!vesselPanelPinned); if (vesselPanelPinned) setVesselPanelShow(false); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={vesselPanelPinned ? 'Unpin panel' : 'Pin panel'}
                >
                  {vesselPanelPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {sortedVessels.map(v => (
                <div
                  key={v.id}
                  className="px-4 py-3 border-b border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => selectVessel(v)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.chartered ? CHARTER_GOLD : SHIP_BLUE }} />
                      <span className="text-xs font-bold text-foreground">{v.name}</span>
                      {v.chartered && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'hsl(45,93%,92%)', color: CHARTER_GOLD }}>★</span>
                      )}
                    </div>
                    {v.delayHours > 0 && (
                      <span className="text-[9px] font-bold text-destructive">+{v.delayHours}h</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1">IMO: {v.imo} · {v.type.split(' ')[0]}</div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-muted-foreground">{v.departurePort.split(' ')[0].split(',')[0]} → {v.destinationPort.split(' ')[0].split(',')[0]}</span>
                    <span className="text-foreground font-medium">{v.speed}</span>
                    <span className="text-muted-foreground">ETA: {v.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canal cards panel (vessel detail mode) */}
        {selectedVessel && (
          <div
            className={`absolute top-0 right-0 h-full z-[1000] bg-card/95 backdrop-blur-md border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${canalPanelShow || canalPanelPinned ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '360px' }}
            onMouseEnter={showCanalPanel}
            onMouseLeave={hideCanalPanel}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">Voyage Milestones</h2>
                <p className="text-[10px] text-muted-foreground">{canalsPorts.length} waypoints along route</p>
              </div>
              <button
                onClick={() => { setCanalPanelPinned(!canalPanelPinned); if (canalPanelPinned) setCanalPanelShow(false); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={canalPanelPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {canalPanelPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)] p-3 space-y-3">
              {canalsPorts.map(cp => {
                const congColor = cp.congestionStatus === 'High' ? 'text-destructive' : cp.congestionStatus === 'Medium' ? 'text-warning' : 'text-success';
                return (
                  <div
                    key={cp.id}
                    className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/bidding/${cp.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        {cp.type === 'canal' ? <Anchor className="w-4 h-4 text-primary" /> : cp.type === 'strait' ? <Shield className="w-4 h-4 text-destructive" /> : <MapPin className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase ${congColor}`}>{cp.congestionStatus} Traffic</span>
                        {cp.requiresBidding && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">BID</span>}
                      </div>
                    </div>
                    <h4 className="font-bold text-foreground text-sm mb-0.5">{cp.name}</h4>
                    <p className="text-[11px] text-muted-foreground mb-2">ETA: {cp.eta} · Distance: {cp.distance}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                      {cp.queueLength > 0 && (
                        <span className="flex items-center gap-1"><Ship className="w-3 h-3" /> {cp.queueLength} in queue</span>
                      )}
                      {cp.weatherRisk !== 'Low' && (
                        <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" /> {cp.weatherRisk} risk</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cp.eta}</span>
                    </div>
                    {cp.requiresBidding && cp.currentBidRange.max > 0 && (
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Bid Range</span>
                          <span className="font-bold text-foreground">${(cp.currentBidRange.min / 1000).toFixed(0)}k – ${(cp.currentBidRange.max / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between text-[10px] mt-0.5">
                          <span className="text-muted-foreground">Avg. Clearing</span>
                          <span className="font-semibold text-success">${(cp.avgClearingPrice / 1000).toFixed(1)}k</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom status bar on map */}
        <div className="absolute bottom-0 left-0 right-0 z-[999] bg-card/80 backdrop-blur-sm border-t border-border px-6 py-1.5 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-success font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              SAT LINK: ACTIVE
            </span>
            {selectedVessel && (
              <span className="text-muted-foreground">
                <MapPin className="w-3 h-3 inline mr-1" />
                LAT: {selectedVessel.position.lat.toFixed(2)}° {selectedVessel.position.lat >= 0 ? 'N' : 'S'} | LON: {selectedVessel.position.lng.toFixed(2)}° {selectedVessel.position.lng >= 0 ? 'E' : 'W'}
              </span>
            )}
            {selectedVessel && <span className="text-muted-foreground">Voyage: {selectedVessel.voyageId}</span>}
          </div>
          <span className="text-muted-foreground font-mono">
            {new Date().toUTCString().slice(0, 25)} UTC
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .fleet-vessel-tooltip {
          background: white !important;
          border: 1px solid hsl(220,13%,90%) !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 11px !important;
          color: hsl(220,10%,35%) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          max-width: 280px !important;
        }
        .fleet-vessel-tooltip::before { display: none !important; }
        .canal-tooltip-detailed {
          background: white !important;
          border: 1px solid hsl(220,13%,90%) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 11px !important;
          color: #475569 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
          max-width: 250px !important;
        }
        .canal-tooltip-detailed::before { display: none !important; }
        .leaflet-control-zoom {
          border: 1px solid hsl(220,13%,90%) !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: hsl(220,10%,40%) !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          border-bottom: 1px solid hsl(220,13%,90%) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(220,14%,97%) !important;
        }
      `}</style>
    </div>
  );
};

function getExpectedDate(eta: string): string {
  const now = new Date();
  let hoursToAdd = 0;
  const dayMatch = eta.match(/(\d+)d/);
  const hourMatch = eta.match(/(\d+)h/);
  if (dayMatch) hoursToAdd += parseInt(dayMatch[1]) * 24;
  if (hourMatch) hoursToAdd += parseInt(hourMatch[1]);
  const expected = new Date(now.getTime() + hoursToAdd * 3600000);
  return expected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + expected.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
}

export default FleetOverview;
