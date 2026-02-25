import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fleetVessels, getMitigationStrategies, type FleetVessel } from '@/data/fleetData';
import { Anchor, Bell, Settings, Search, ArrowLeft, Clock, AlertTriangle, TrendingUp, Calendar, MapPin, Zap, Shield } from 'lucide-react';
import NavTab from '@/components/NavTab';

const RiskAnalysis = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const vessel = fleetVessels.find(v => v.id === id);

  useEffect(() => {
    if (!vessel || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [vessel.position.lat, vessel.position.lng],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    // Zoom controls top-right of map area
    const zoomIn = L.DomUtil.create('div');
    zoomIn.innerHTML = `
      <div style="position:absolute; top:10px; right:10px; z-index:1000; display:flex; gap:4px;">
        <button onclick="this.closest('.leaflet-container')?.__map?.zoomIn()" style="width:28px; height:28px; background:white; border:1px solid hsl(220,13%,90%); border-radius:6px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; color:hsl(220,10%,40%);">+</button>
        <button onclick="this.closest('.leaflet-container')?.__map?.zoomOut()" style="width:28px; height:28px; background:white; border:1px solid hsl(220,13%,90%); border-radius:6px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; color:hsl(220,10%,40%);">−</button>
      </div>
    `;

    // Ship marker
    const color = vessel.riskLevel === 'Critical' ? 'hsl(0,72%,51%)' : vessel.riskLevel === 'High' ? 'hsl(25,90%,50%)' : vessel.riskLevel === 'Medium' ? 'hsl(38,92%,50%)' : 'hsl(152,69%,41%)';
    const icon = L.divIcon({
      className: 'risk-ship-marker',
      html: `
        <div style="position:relative; width:36px; height:36px;">
          <div style="position:absolute; inset:0; background:${color}20; border-radius:50%; animation: pulse-ring 2s ease-out infinite;"></div>
          <div style="position:absolute; inset:4px; background:hsl(224,76%,48%); border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([vessel.position.lat, vessel.position.lng], { icon }).addTo(map);

    // Position label
    L.marker([vessel.position.lat, vessel.position.lng], {
      icon: L.divIcon({
        className: 'position-label',
        html: `<div style="background:white; border:2px dashed hsl(224,76%,48%); border-radius:8px; padding:4px 10px; font-size:10px; font-weight:700; color:hsl(224,76%,48%); white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.1); text-align:center;">
          <div style="font-size:8px; letter-spacing:1px; color:hsl(220,10%,40%); margin-bottom:1px;">CURRENT POSITION</div>
          ${vessel.position.lat.toFixed(2)}° N, ${vessel.position.lng.toFixed(2)}° E
        </div>`,
        iconSize: [160, 40],
        iconAnchor: [80, -20],
      }),
      interactive: false,
    }).addTo(map);

    mapInstanceRef.current = map;
    (mapRef.current as any).__map = map;

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [vessel]);

  if (!vessel) return <div className="h-screen flex items-center justify-center text-muted-foreground">Vessel not found</div>;

  const strategies = getMitigationStrategies(vessel);
  const riskPercent = vessel.riskScore;
  const dynamicETA = (() => {
    const d = new Date();
    d.setHours(d.getHours() + vessel.delayHours + 48);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  })();
  const varianceText = vessel.delayHours > 0 ? `+${vessel.delayHours}h ${Math.floor(Math.random() * 50 + 10)}m` : 'On time';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base">Captain Voyage</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab onClick={() => navigate('/fleet')}>Fleet Overview</NavTab>
            <NavTab onClick={() => navigate('/dashboard')}>Dashboard</NavTab>
            <NavTab>Bidding Hub</NavTab>
            <NavTab>Fleet Analytics</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Bell className="w-4 h-4" /></button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Settings className="w-4 h-4" /></button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/fleet')} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-0.5 bg-primary rounded-full" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{vessel.name}</h1>
                <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">IMO: {vessel.imo}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {vessel.departurePort} → {vessel.destinationPort} · <span className="text-destructive font-semibold">Status: {vessel.status}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Risk Score Circle */}
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(220,13%,90%)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none"
                    stroke={riskPercent >= 70 ? 'hsl(0,72%,51%)' : riskPercent >= 40 ? 'hsl(38,92%,50%)' : 'hsl(152,69%,41%)'}
                    strokeWidth="3" strokeDasharray={`${riskPercent} ${100 - riskPercent}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{riskPercent}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground tracking-wider">RISK SCORE</div>
                <div className="text-lg font-bold text-destructive">{vessel.riskLevel}</div>
                <div className="text-[10px] text-muted-foreground">Tier 1 Severity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map + Side Panels */}
        <div className="p-6 grid grid-cols-3 gap-5">
          {/* Map */}
          <div className="col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-[10px] font-bold text-foreground tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> ACTIVE ROUTE TRACKING
                </span>
              </div>
              <div ref={mapRef} className="w-full h-[320px]" />
            </div>

            {/* ETA Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary rounded-xl p-4 text-primary-foreground">
                <div className="text-[10px] tracking-wider font-semibold mb-1 flex items-center gap-1 opacity-80">
                  <Calendar className="w-3 h-3" /> CONTRACTUAL ETA
                </div>
                <div className="text-xl font-bold">{vessel.etaDate}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-[10px] tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> DYNAMIC PREDICTION
                </div>
                <div className="text-xl font-bold text-destructive">{dynamicETA}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-[10px] tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> VARIANCE
                </div>
                <div className="text-xl font-bold text-foreground">{varianceText}</div>
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="space-y-5">
            {/* Delay Factors */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-foreground tracking-wider mb-3">DELAY FACTOR ATTRIBUTION</h3>
              <div className="space-y-3">
                {vessel.delayFactors.length === 0 && <p className="text-xs text-muted-foreground">No delays detected</p>}
                {vessel.delayFactors.map((f, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{f.name}</span>
                      <span className="font-bold text-foreground">+{f.hours}h</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (f.hours / (vessel.delayHours || 1)) * 100)}%`,
                          background: f.severity === 'high' ? 'hsl(224,76%,48%)' : f.severity === 'medium' ? 'hsl(224,76%,62%)' : 'hsl(224,76%,78%)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Exposure */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-foreground tracking-wider mb-3">FINANCIAL EXPOSURE (USD)</h3>
              {/* Mini bar chart placeholder */}
              <div className="flex items-end gap-3 h-16 mb-2">
                {['P50', 'P80', 'P95'].map((label, i) => {
                  const heights = [40, 65, 90];
                  return (
                    <div key={label} className="flex flex-col items-center flex-1">
                      <div className="w-full bg-muted rounded-t" style={{ height: `${heights[i]}%` }}>
                        <div className="w-full h-full bg-primary/20 rounded-t" />
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1">{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 mt-2">
                <div className="text-[10px] text-muted-foreground tracking-wider">PROJECTED DEMURRAGE</div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">${vessel.financialExposure.toLocaleString()}.00</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Strategies */}
        <div className="px-6 pb-6">
          <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest mb-4">RESPONSE STRATEGIES (MITIGATION ANALYSIS)</h3>
          <div className="grid grid-cols-3 gap-4">
            {strategies.map(s => {
              const isSelected = selectedStrategy === s.id;
              const tagColor = s.tag === 'Optimal' ? 'bg-success/10 text-success' : s.tag === 'Neutral' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive';
              return (
                <div key={s.id} className={`bg-card border rounded-xl p-5 transition-all cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                  onClick={() => setSelectedStrategy(s.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {s.tag === 'Optimal' ? <Zap className="w-4 h-4 text-success" /> : s.tag === 'Neutral' ? <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-[135deg]" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{s.label}</h4>
                        <p className="text-[11px] text-muted-foreground">{s.description}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tagColor}`}>{s.tag}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div>
                      <div className="text-[9px] text-muted-foreground tracking-wider">{s.costLabel}</div>
                      <div className="text-sm font-bold text-foreground">{s.costAmount}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground tracking-wider">DEMURRAGE SAVE</div>
                      <div className="text-sm font-bold text-success">{s.demurrageSave}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground tracking-wider">NET BENEFIT</div>
                      <div className={`text-sm font-bold ${s.netBenefit.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{s.netBenefit}</div>
                    </div>
                  </div>
                  <button
                    className={`w-full mt-4 py-2 rounded-lg text-xs font-semibold transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-muted'}`}
                  >
                    Select Strategy
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RiskAnalysis;
