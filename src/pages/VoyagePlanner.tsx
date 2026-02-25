import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ports, vessels, generateRouteOptions,
  type Port, type Vessel, type VoyageRouteOption,
} from '@/data/voyagePlannerData';
import { fleetVessels } from '@/data/fleetData';
import NavTab from '@/components/NavTab';
import {
  Anchor, Bell, Settings, Search, ChevronDown, ChevronUp, ArrowUpDown,
  Ship, MapPin, Calendar, Clock, Fuel, Navigation, Route, Play, Pause,
  Layers, Plus, Table2, Trash2, Upload, Check, X, Info, Wind, Compass,
} from 'lucide-react';

type OptimizeMode = 'fixed-eta' | 'lowest-cost' | 'fixed-instruction';
type ECAMode = 'ignore' | 'cost-based' | 'minimize';
type Step = 'form' | 'results' | 'confirm';

const VoyagePlanner = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);

  // Form state
  const [selectedVessel, setSelectedVessel] = useState<Vessel>(vessels[0]);
  const [draft, setDraft] = useState('10.4');
  const [fromPort, setFromPort] = useState<Port>(ports[0]); // Rotterdam
  const [fromVariant, setFromVariant] = useState<'Inbound' | 'Outbound'>('Outbound');
  const [toPort, setToPort] = useState<Port>(ports[1]); // Hamburg
  const [toVariant, setToVariant] = useState<'Inbound' | 'Outbound'>('Inbound');
  const [optimizeBy, setOptimizeBy] = useState<OptimizeMode>('lowest-cost');
  const [ecaBehavior, setECABehavior] = useState<ECAMode>('ignore');
  const [euaPrice, setEuaPrice] = useState('82');
  const [hirePrice, setHirePrice] = useState('20000');
  const [fuelPriceNonECA, setFuelPriceNonECA] = useState('520');
  const [fuelPriceECA, setFuelPriceECA] = useState('680');
  const [speedOptimize, setSpeedOptimize] = useState(true);
  const [useAutorouting, setUseAutorouting] = useState(true);
  const [useRoutesDB, setUseRoutesDB] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [highRiskBehavior, setHighRiskBehavior] = useState<'ignore' | 'minimize'>('minimize');
  const [jwcBehavior, setJwcBehavior] = useState<'ignore' | 'minimize'>('minimize');
  const [pssaBehavior, setPssaBehavior] = useState<'ignore' | 'slow-down'>('slow-down');

  // Results state
  const [step, setStep] = useState<Step>('form');
  const [routeOptions, setRouteOptions] = useState<VoyageRouteOption[]>([]);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<VoyageRouteOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Timeline
  const [timelineDay, setTimelineDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Layers
  const [showWeather, setShowWeather] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Port search
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);

  const filteredFromPorts = useMemo(() => {
    if (!fromSearch) return ports;
    return ports.filter(p => `${p.name} ${p.country} ${p.code}`.toLowerCase().includes(fromSearch.toLowerCase()));
  }, [fromSearch]);

  const filteredToPorts = useMemo(() => {
    if (!toSearch) return ports;
    return ports.filter(p => `${p.name} ${p.country} ${p.code}`.toLowerCase().includes(toSearch.toLowerCase()));
  }, [toSearch]);

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) { navigate('/'); return; }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/');
  };

  // Map setup
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [48, 5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    routeLayersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Draw routes on map
  useEffect(() => {
    if (!routeLayersRef.current || !mapInstanceRef.current) return;
    routeLayersRef.current.clearLayers();

    if (routeOptions.length === 0) return;

    const map = mapInstanceRef.current;

    routeOptions.forEach(route => {
      const isHovered = hoveredRoute === route.id;
      const isSelected = selectedRoute?.id === route.id;
      const opacity = hoveredRoute ? (isHovered ? 1 : 0.2) : (isSelected ? 1 : 0.6);
      const weight = isHovered || isSelected ? 4 : 2;

      const latlngs = route.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
      const polyline = L.polyline(latlngs, {
        color: route.color,
        weight,
        opacity,
        dashArray: isSelected ? undefined : '8 6',
        className: `route-path-${route.id}`,
      });

      polyline.on('mouseover', () => setHoveredRoute(route.id));
      polyline.on('mouseout', () => setHoveredRoute(null));
      polyline.on('click', () => {
        setSelectedRoute(route);
        setStep('confirm');
      });

      polyline.addTo(routeLayersRef.current!);

      // Start/end markers
      if (isHovered || isSelected || !hoveredRoute) {
        const startWp = route.waypoints[0];
        const endWp = route.waypoints[route.waypoints.length - 1];
        
        L.circleMarker([startWp.lat, startWp.lng], {
          radius: 6, color: route.color, fillColor: '#fff', fillOpacity: 1, weight: 2, opacity,
        }).bindTooltip(`<b>${route.from}</b><br/>Departure`, { direction: 'top' }).addTo(routeLayersRef.current!);

        L.circleMarker([endWp.lat, endWp.lng], {
          radius: 6, color: route.color, fillColor: route.color, fillOpacity: 1, weight: 2, opacity,
        }).bindTooltip(`<b>${route.to}</b><br/>Arrival`, { direction: 'top' }).addTo(routeLayersRef.current!);
      }
    });

    // Fit bounds to show all routes
    const allPoints = routeOptions.flatMap(r => r.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]));
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] });
    }
  }, [routeOptions, hoveredRoute, selectedRoute]);

  // Timeline playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimelineDay(prev => {
        if (prev >= 7) { setIsPlaying(false); return 7; }
        return prev + 0.1;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCreateVoyage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const options = generateRouteOptions(fromPort, toPort, selectedVessel.name);
      setRouteOptions(options);
      setStep('results');
      setIsGenerating(false);
    }, 1200);
  };

  const handleConfirmVoyage = () => {
    if (!selectedRoute) return;
    setConfirmed(true);
    // Add to fleet as a green severity vessel
    setTimeout(() => {
      navigate('/fleet');
    }, 2000);
  };

  const handleSwapPorts = () => {
    const tempPort = fromPort;
    const tempVariant = fromVariant;
    setFromPort(toPort);
    setFromVariant(toVariant === 'Inbound' ? 'Outbound' : 'Inbound');
    setToPort(tempPort);
    setToVariant(tempVariant === 'Outbound' ? 'Inbound' : 'Outbound');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
  };

  const weatherRiskColor = (r: string) => r === 'Low' ? 'text-success' : r === 'Moderate' ? 'text-warning' : 'text-destructive';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Nav - Deep navy */}
      <header className="h-12 flex items-center justify-between px-5 shrink-0" style={{ background: '#0D133B' }}>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-white/80" />
            <span className="font-bold text-white text-sm tracking-wide">VoyageOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { label: 'Fleet Overview', path: '/fleet', active: false },
              { label: 'Dashboard', path: '/dashboard', active: false },
              { label: 'Voyage Planner', path: '/voyage-planner', active: true },
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  tab.active
                    ? 'text-white border-b-2 border-[#0066CC]'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded text-white/50 hover:text-white transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
          </button>
          <button onClick={logout} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">MZ</button>
          <span className="text-[10px] text-white/60 hidden lg:block">Marko Zelger – Fleet Demo</span>
        </div>
      </header>

      {/* Context strip */}
      <div className="h-10 border-b border-border flex items-center justify-between px-5 bg-card shrink-0">
        <button onClick={() => navigate('/fleet')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          ← BACK TO FLEET
        </button>
        <button
          onClick={() => { setStep('form'); setRouteOptions([]); setSelectedRoute(null); setConfirmed(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0066CC] text-white text-xs font-semibold rounded hover:opacity-90 transition-opacity"
        >
          <Route className="w-3.5 h-3.5" /> NEW VOYAGE
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Map area ~75% */}
        <div className="flex-1 relative min-h-0">
          <div ref={mapRef} className="w-full h-full" />

          {/* Current legend bar */}
          {showWeather && (
            <div className="absolute top-3 left-14 z-[1000] bg-card border border-border rounded px-3 py-2 shadow-sm">
              <div className="text-[8px] font-bold text-muted-foreground tracking-widest mb-1">TOTAL CURRENT – KNOTS</div>
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-muted-foreground">-4.0</span>
                <div className="h-2.5 rounded-sm" style={{ width: 180, background: 'linear-gradient(to right, #0066CC, #22C55E, #EAB308, #E87722, #EF4444)' }} />
                <span className="text-[8px] text-muted-foreground">+4.5</span>
              </div>
            </div>
          )}

          {/* Layer controls */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
            <button onClick={() => setShowLayerMenu(!showLayerMenu)} className="w-8 h-8 bg-card border border-border rounded shadow-sm flex items-center justify-center hover:bg-muted transition-colors">
              <Layers className="w-4 h-4 text-foreground" />
            </button>
            {showLayerMenu && (
              <div className="bg-card border border-border rounded shadow-lg p-2 w-40">
                <div className="text-[9px] font-bold text-muted-foreground tracking-wider mb-1.5">LAYERS</div>
                {[
                  { label: 'Weather', active: showWeather, toggle: () => setShowWeather(!showWeather) },
                  { label: 'ECA Zones', active: false, toggle: () => {} },
                  { label: 'War Risk Zones', active: false, toggle: () => {} },
                  { label: 'AIS Tracks', active: false, toggle: () => {} },
                ].map(l => (
                  <button key={l.label} onClick={l.toggle} className={`w-full text-left px-2 py-1 text-[10px] rounded transition-colors ${l.active ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                    {l.active ? '☑' : '☐'} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Floating results overlay */}
          {step === 'results' && routeOptions.length > 0 && (
            <div className="absolute top-3 right-14 z-[1000] w-80 max-h-[calc(100%-100px)] overflow-y-auto bg-card border border-border rounded-lg shadow-lg scrollbar-thin">
              <div className="sticky top-0 bg-card border-b border-border px-3 py-2 flex items-center justify-between">
                <div className="flex gap-1">
                  <button className="text-[10px] font-bold text-primary border-b border-primary px-2 py-1">Results</button>
                  <button className="text-[10px] text-muted-foreground px-2 py-1 hover:text-foreground">Layers</button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setStep('form'); setRouteOptions([]); }} className="text-[9px] px-2 py-1 border border-border rounded text-muted-foreground hover:text-foreground">CLEAR ALL</button>
                </div>
              </div>

              {routeOptions.map(route => (
                <div
                  key={route.id}
                  onMouseEnter={() => setHoveredRoute(route.id)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  onClick={() => { setSelectedRoute(route); setStep('confirm'); }}
                  className={`p-3 border-b border-border cursor-pointer transition-all ${
                    hoveredRoute === route.id ? 'bg-muted/50' : ''
                  } ${selectedRoute?.id === route.id ? 'ring-1 ring-primary/40 bg-primary/[0.03]' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: route.color + '18', color: route.color, border: `1px solid ${route.color}30` }}>
                      {route.tag}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{route.subtitle}</span>
                  </div>
                  <div className="text-[10px] text-foreground font-medium mb-1">
                    {route.from} – {route.to}
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2">
                    {formatDate(route.departureUTC)} – {formatDate(route.arrivalUTC)}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">DISTANCE</div>
                      <div className="text-sm font-bold text-foreground">{route.distanceNM} <span className="text-[9px] font-normal text-muted-foreground">NM</span></div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">AVG. SOG</div>
                      <div className="text-sm font-bold text-foreground">{route.avgSOG} <span className="text-[9px] font-normal text-muted-foreground">kn</span></div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">SAILING</div>
                      <div className="text-sm font-bold text-foreground">{route.sailingTime}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 pt-1.5 border-t border-border/50">
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">FUEL</div>
                      <div className="text-[11px] font-semibold text-foreground">{route.fuelMT} MT</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">COST</div>
                      <div className="text-[11px] font-semibold text-foreground">${route.fuelCostUSD.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">WEATHER</div>
                      <div className={`text-[11px] font-semibold ${weatherRiskColor(route.weatherRisk)}`}>{route.weatherRisk}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirmation overlay */}
          {step === 'confirm' && selectedRoute && (
            <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/30">
              <div className="bg-card border border-border rounded-lg shadow-2xl w-[440px] max-h-[80vh] overflow-y-auto">
                {confirmed ? (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-7 h-7 text-success" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Voyage Plan Confirmed</h3>
                    <p className="text-xs text-muted-foreground mb-4">Added to Fleet Overview with active monitoring</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-success font-bold">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE TRACKING ACTIVE
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Confirm Voyage Plan</h3>
                        <p className="text-[10px] text-muted-foreground">Review details before adding to fleet</p>
                      </div>
                      <button onClick={() => { setStep('results'); setSelectedRoute(null); }} className="p-1 rounded hover:bg-muted">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: selectedRoute.color + '18', color: selectedRoute.color, border: `1px solid ${selectedRoute.color}30` }}>
                          {selectedRoute.tag}
                        </span>
                        <span className="text-xs text-muted-foreground">{selectedRoute.subtitle}</span>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Vessel</span>
                          <span className="font-semibold text-foreground">{selectedVessel.name}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Route</span>
                          <span className="font-semibold text-foreground">{fromPort.name} → {toPort.name}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Departure</span>
                          <span className="font-semibold text-foreground">{formatDate(selectedRoute.departureUTC)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Arrival</span>
                          <span className="font-semibold text-foreground">{formatDate(selectedRoute.arrivalUTC)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Distance', value: `${selectedRoute.distanceNM} NM` },
                          { label: 'Speed', value: `${selectedRoute.avgSOG} kn` },
                          { label: 'Fuel', value: `${selectedRoute.fuelMT} MT` },
                          { label: 'Cost', value: `$${selectedRoute.fuelCostUSD.toLocaleString()}` },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">{s.label.toUpperCase()}</div>
                            <div className="text-sm font-bold text-foreground">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                        {[
                          { label: 'CO₂', value: `${selectedRoute.co2Tons} t` },
                          { label: 'EUA / ETS', value: `${selectedRoute.euaETS} EUA` },
                          { label: 'Weather', value: selectedRoute.weatherRisk, cls: weatherRiskColor(selectedRoute.weatherRisk) },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className="text-[8px] text-muted-foreground font-semibold tracking-wider">{s.label.toUpperCase()}</div>
                            <div className={`text-[11px] font-bold ${'cls' in s ? s.cls : 'text-foreground'}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => { setStep('results'); setSelectedRoute(null); }} className="flex-1 py-2.5 text-xs font-semibold border border-border rounded hover:bg-muted transition-colors text-foreground">
                          Cancel
                        </button>
                        <button onClick={handleConfirmVoyage} className="flex-1 py-2.5 text-xs font-bold rounded text-white transition-opacity hover:opacity-90" style={{ background: '#0D133B' }}>
                          Confirm & Add to Fleet
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel ~25% */}
        <div className="w-[340px] border-l border-border flex flex-col bg-card shrink-0 overflow-hidden">
          {step === 'form' && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Create new Voyage plan option</h2>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setOptimizeBy('lowest-cost')}
                    className={`text-[10px] px-3 py-1.5 rounded font-semibold transition-colors ${optimizeBy === 'lowest-cost' ? 'bg-[#0066CC] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    Weather optimised
                  </button>
                  <button
                    onClick={() => setOptimizeBy('fixed-instruction')}
                    className={`text-[10px] px-3 py-1.5 rounded font-semibold transition-colors ${optimizeBy === 'fixed-instruction' ? 'bg-[#0066CC] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    Not weather optimised
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Vessel */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">VESSEL</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowVesselDropdown(!showVesselDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-xs text-foreground bg-card hover:border-primary/30 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Ship className="w-3.5 h-3.5 text-muted-foreground" />
                        {selectedVessel.name}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {showVesselDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                        {vessels.map(v => (
                          <button key={v.id} onClick={() => { setSelectedVessel(v); setDraft(v.draft.toString()); setShowVesselDropdown(false); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex justify-between">
                            <span className="font-medium text-foreground">{v.name}</span>
                            <span className="text-muted-foreground">{v.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <a className="text-[10px] text-primary hover:underline cursor-pointer">Detailed particulars ↗</a>
                  </div>
                </div>

                {/* Draft */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">DRAFT</label>
                  <div className="flex items-center gap-2">
                    <input value={draft} onChange={e => setDraft(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded text-xs text-foreground bg-card focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20" />
                    <span className="text-[10px] text-muted-foreground font-medium">m</span>
                  </div>
                </div>

                {/* From */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">FROM</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-card">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        value={showFromDropdown ? fromSearch : `${fromPort.name} (${fromPort.country}) ${fromVariant}`}
                        onChange={e => { setFromSearch(e.target.value); setShowFromDropdown(true); }}
                        onFocus={() => { setShowFromDropdown(true); setFromSearch(''); }}
                        onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                        className="flex-1 text-xs text-foreground bg-transparent focus:outline-none"
                        placeholder="Find port..."
                      />
                    </div>
                    {showFromDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredFromPorts.map(p => (
                          <div key={p.id}>
                            {p.variants.map(v => (
                              <button key={`${p.id}-${v}`} onClick={() => { setFromPort(p); setFromVariant(v); setShowFromDropdown(false); }}
                                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted transition-colors flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-foreground">{p.name} ({p.country})</span>
                                <span className="text-muted-foreground ml-auto">{v}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Swap */}
                <div className="flex justify-center">
                  <button onClick={handleSwapPorts} className="p-1.5 border border-border rounded hover:bg-muted transition-colors">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* To */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">TO</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-card">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <input
                        value={showToDropdown ? toSearch : `${toPort.name} (${toPort.country}) ${toVariant}`}
                        onChange={e => { setToSearch(e.target.value); setShowToDropdown(true); }}
                        onFocus={() => { setShowToDropdown(true); setToSearch(''); }}
                        onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                        className="flex-1 text-xs text-foreground bg-transparent focus:outline-none"
                        placeholder="Find port..."
                      />
                    </div>
                    {showToDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredToPorts.map(p => (
                          <div key={p.id}>
                            {p.variants.map(v => (
                              <button key={`${p.id}-${v}`} onClick={() => { setToPort(p); setToVariant(v); setShowToDropdown(false); }}
                                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted transition-colors flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-foreground">{p.name} ({p.country})</span>
                                <span className="text-muted-foreground ml-auto">{v}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimize By */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">OPTIMIZE BY</label>
                  <div className="space-y-1.5">
                    {([
                      { value: 'fixed-eta', label: 'Fixed ETA' },
                      { value: 'fixed-instruction', label: 'Fixed Instruction' },
                      { value: 'lowest-cost', label: 'Lowest Cost' },
                    ] as const).map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${optimizeBy === opt.value ? 'border-primary' : 'border-border'}`}>
                          {optimizeBy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Conditional pricing fields */}
                {optimizeBy === 'lowest-cost' && (
                  <div className="space-y-3 pl-5 border-l-2 border-primary/20">
                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">HIRE PRICE</label>
                      <div className="flex items-center gap-2">
                        <input value={hirePrice} onChange={e => setHirePrice(e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded text-xs text-foreground bg-card focus:outline-none focus:border-primary/50" />
                        <span className="text-[9px] text-muted-foreground">USD / day</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">FUEL PRICE NON-ECA</label>
                      <div className="flex items-center gap-2">
                        <input value={fuelPriceNonECA} onChange={e => setFuelPriceNonECA(e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded text-xs text-foreground bg-card focus:outline-none focus:border-primary/50" />
                        <span className="text-[9px] text-muted-foreground">USD / t</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">FUEL PRICE ECA</label>
                      <div className="flex items-center gap-2">
                        <input value={fuelPriceECA} onChange={e => setFuelPriceECA(e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded text-xs text-foreground bg-card focus:outline-none focus:border-primary/50" />
                        <span className="text-[9px] text-muted-foreground">USD / t</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ECA Behavior */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">BEHAVIOR IN ECA</label>
                  <div className="space-y-1.5">
                    {([
                      { value: 'ignore', label: 'Ignore' },
                      { value: 'cost-based', label: 'Cost-based' },
                      { value: 'minimize', label: 'Minimize' },
                    ] as const).map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${ecaBehavior === opt.value ? 'border-primary' : 'border-border'}`}>
                          {ecaBehavior === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* EUA Price */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">EUA PRICE</label>
                  <div className="flex items-center gap-2">
                    <input value={euaPrice} onChange={e => setEuaPrice(e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded text-xs text-foreground bg-card focus:outline-none focus:border-primary/50" />
                    <span className="text-[9px] text-muted-foreground">EUR / t</span>
                  </div>
                </div>

                {/* Speed Profile */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${speedOptimize ? 'bg-primary' : 'bg-border'}`}
                    onClick={() => setSpeedOptimize(!speedOptimize)}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${speedOptimize ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-foreground">Speed Profile Optimization</span>
                </label>

                {/* Advanced Parameters */}
                <div className="border-t border-border pt-3">
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-xs font-semibold text-foreground">
                    Advanced Parameters
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-[9px] font-bold text-muted-foreground tracking-widest mb-1.5">ROUTE DATA</div>
                        <label className="flex items-center gap-2 mb-1 cursor-pointer">
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${useAutorouting ? 'bg-primary border-primary' : 'border-border'}`}>
                            {useAutorouting && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[11px] text-foreground" onClick={() => setUseAutorouting(!useAutorouting)}>Use Preliminary Autorouting</span>
                        </label>
                        <label className="flex items-center gap-2 mb-1 cursor-pointer">
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${useRoutesDB ? 'bg-primary border-primary' : 'border-border'}`}>
                            {useRoutesDB && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[11px] text-foreground" onClick={() => setUseRoutesDB(!useRoutesDB)}>Use Routes Database</span>
                        </label>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-muted-foreground tracking-widest mb-1.5">BEHAVIOR OPTIONS</div>
                        <div className="space-y-2">
                          {[
                            { label: 'HIGH RISK AREAS', value: highRiskBehavior, set: setHighRiskBehavior as any, options: ['ignore', 'minimize'] },
                            { label: 'JOINT WAR COMMITTEE', value: jwcBehavior, set: setJwcBehavior as any, options: ['ignore', 'minimize'] },
                            { label: 'SPEED IN PSSA', value: pssaBehavior, set: setPssaBehavior as any, options: ['ignore', 'slow-down'] },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-[10px] text-foreground">{item.label}</span>
                              <div className="flex gap-1">
                                {item.options.map(opt => (
                                  <button key={opt} onClick={() => item.set(opt)}
                                    className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${item.value === opt ? 'bg-primary/10 text-primary border-primary/30 font-semibold' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                                    {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* When in results/confirm mode, show a summary panel */}
          {step !== 'form' && (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Voyage Plan Results</h3>
                <p className="text-[10px] text-muted-foreground">{selectedVessel.name} · {fromPort.name} → {toPort.name}</p>
              </div>
              <div className="space-y-2">
                {routeOptions.map(route => (
                  <button
                    key={route.id}
                    onMouseEnter={() => setHoveredRoute(route.id)}
                    onMouseLeave={() => setHoveredRoute(null)}
                    onClick={() => { setSelectedRoute(route); setStep('confirm'); }}
                    className={`w-full text-left p-3 border rounded-lg transition-all ${
                      selectedRoute?.id === route.id ? 'border-primary bg-primary/[0.04]' : hoveredRoute === route.id ? 'border-primary/30 bg-muted/30' : 'border-border hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: route.color + '18', color: route.color }}>
                        {route.tag}
                      </span>
                      <span className="text-[10px] font-bold text-foreground">${route.fuelCostUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{route.distanceNM} NM · {route.sailingTime}</span>
                      <span className={`font-semibold ${weatherRiskColor(route.weatherRisk)}`}>{route.weatherRisk}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => { setStep('form'); setRouteOptions([]); setSelectedRoute(null); }} className="w-full py-2 text-xs font-medium border border-border rounded hover:bg-muted transition-colors text-foreground">
                ← Modify Parameters
              </button>
            </div>
          )}

          {/* CTA */}
          {step === 'form' && (
            <div className="p-4 border-t border-border">
              <button
                onClick={handleCreateVoyage}
                disabled={isGenerating}
                className="w-full py-3 text-xs font-bold rounded text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#0D133B' }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Routes...
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4" />
                    CREATE VOYAGE PLAN
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline Scrubber */}
      <div className="h-12 shrink-0 flex items-center px-5 gap-4" style={{ background: 'linear-gradient(to right, #0D133B, #121B4A)' }}>
        <span className="text-[10px] text-white/70 font-mono whitespace-nowrap">
          {new Date().toISOString().slice(0, 10)} {new Date().toISOString().slice(11, 16)} UTC
        </span>
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
        </button>
        <div className="flex-1 relative">
          <div className="h-0.5 bg-white/10 rounded-full w-full" />
          <input
            type="range" min={0} max={7} step={0.01} value={timelineDay}
            onChange={e => setTimelineDay(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ height: '20px', top: '-8px' }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-[#0066CC] transition-all" style={{ left: `${(timelineDay / 7) * 100}%` }} />
          <div className="flex justify-between absolute w-full top-2 text-[8px] text-white/40 font-mono">
            {Array.from({ length: 8 }, (_, i) => <span key={i}>+{i}d</span>)}
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-control-zoom {
          border: 1px solid hsl(220,13%,90%) !important;
          border-radius: 4px !important;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: hsl(220,10%,40%) !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          font-size: 14px !important;
          border-bottom: 1px solid hsl(220,13%,90%) !important;
        }
        .leaflet-control-zoom a:hover { background: hsl(220,14%,97%) !important; }
      `}</style>
    </div>
  );
};

export default VoyagePlanner;
