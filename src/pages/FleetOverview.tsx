import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fleetVessels, getSmartOptions, type FleetVessel } from '@/data/fleetData';
import { Anchor, Bell, Settings, Search, Filter, Download, Ship, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import NavTab from '@/components/NavTab';

const riskColor = (level: FleetVessel['riskLevel']) => {
  switch (level) {
    case 'Critical': return 'hsl(0, 72%, 51%)';
    case 'High': return 'hsl(25, 90%, 50%)';
    case 'Medium': return 'hsl(38, 92%, 50%)';
    case 'Low': return 'hsl(152, 69%, 41%)';
  }
};

const riskBg = (level: FleetVessel['riskLevel']) => {
  switch (level) {
    case 'Critical': return 'bg-destructive/10 text-destructive';
    case 'High': return 'bg-warning/20 text-warning';
    case 'Medium': return 'bg-warning/10 text-warning';
    case 'Low': return 'bg-success/10 text-success';
  }
};

const FleetOverview = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [sortBy, setSortBy] = useState<'risk' | 'charter'>('risk');
  const [panelOpen, setPanelOpen] = useState(false);

  const charteredAtRisk = fleetVessels.filter(v => v.chartered && v.riskScore >= 50).length;

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) { navigate('/login'); return; }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/login');
  };

  const sortedVessels = [...fleetVessels].sort((a, b) => {
    if (sortBy === 'charter') {
      if (a.chartered && !b.chartered) return -1;
      if (!a.chartered && b.chartered) return 1;
      return b.riskScore - a.riskScore;
    }
    return b.riskScore - a.riskScore;
  });

  // Map setup
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

    fleetVessels.forEach(vessel => {
      const color = riskColor(vessel.riskLevel);
      const hasRisk = vessel.riskScore >= 40;
      const icon = L.divIcon({
        className: 'fleet-ship-marker',
        html: `
          <div style="position:relative; width:36px; height:36px; cursor:pointer;">
            <div style="position:absolute; inset:0; background:${color}20; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
            <div style="position:absolute; inset:4px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
            </div>
            ${hasRisk ? `<div data-warning="${vessel.id}" style="position:absolute; top:-6px; right:-6px; width:18px; height:18px; background:hsl(0,72%,51%); border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3); z-index:10;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/><rect x="11" y="10" width="2" height="4"/><rect x="11" y="16" width="2" height="2"/></svg>
            </div>` : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([vessel.position.lat, vessel.position.lng], {
        icon: L.divIcon({
          className: 'vessel-name-label',
          html: `<div style="background:white; border:1px solid hsl(220,13%,90%); border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; color:hsl(220,20%,15%); white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.08);">${vessel.name.length > 16 ? vessel.name.substring(0, 14) + '…' : vessel.name}${vessel.chartered ? ' ★' : ''}</div>`,
          iconSize: [120, 16],
          iconAnchor: [60, -14],
        }),
        interactive: false,
      }).addTo(map);

      L.marker([vessel.position.lat, vessel.position.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="min-width:200px;">
            <div style="font-weight:700; font-size:12px; margin-bottom:2px;">${vessel.name} ${vessel.chartered ? '<span style="color:hsl(224,76%,48%); font-size:9px;">★ CHARTERED</span>' : ''}</div>
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
          </div>`,
          { direction: 'top', offset: [0, -18], className: 'fleet-vessel-tooltip' }
        );
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base">AquaMinds</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab active onClick={() => navigate('/fleet')}>Fleet Overview</NavTab>
            <NavTab onClick={() => navigate('/dashboard')}>Bidding Hub</NavTab>
            <NavTab onClick={() => navigate('/voyage-planner')}>Voyage Planner</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search vessels, ports..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">D</button>
        </div>
      </header>

      {/* Full-screen map */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {/* Risk Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold text-foreground tracking-wider mb-2">RISK LEGEND</div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Med</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(25, 90%, 50%)' }} /> High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Critical</span>
          </div>
        </div>

        {/* Fleet stats overlay */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
            <div className="text-[9px] font-bold text-muted-foreground tracking-wider">FLEET</div>
            <div className="text-lg font-bold text-foreground">{fleetVessels.length}</div>
          </div>
          <div className="bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-sm">
            <div className="text-[9px] font-bold text-primary tracking-wider">CHARTERED</div>
            <div className="text-lg font-bold text-primary">{fleetVessels.filter(v => v.chartered).length}</div>
          </div>
        </div>

        {/* Toggle button for vessel panel */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-4 right-4 z-[1000] bg-card border border-border rounded-lg px-3 py-2 shadow-sm flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <Ship className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{fleetVessels.length} Vessels</span>
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}

        {/* Sliding vessel panel from right */}
        <div
          className={`absolute top-0 right-0 h-full z-[1001] bg-card border-l border-border shadow-xl transition-transform duration-300 ease-in-out flex flex-col ${
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: '380px' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-bold text-foreground">Vessels in Transit</h2>
              <p className="text-[10px] text-muted-foreground">{fleetVessels.length} active · {charteredAtRisk} chartered at risk</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy(sortBy === 'risk' ? 'charter' : 'risk')}
                className="flex items-center gap-1 px-2.5 py-1 border border-border rounded-lg text-[10px] font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {sortBy === 'risk' ? '↓ Risk' : '★ Charter'}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vessel list */}
          <div className="flex-1 overflow-y-auto">
            {sortedVessels.map(v => (
              <div
                key={v.id}
                className={`px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer ${v.chartered && v.riskScore >= 50 ? 'bg-destructive/[0.03]' : ''}`}
                onClick={() => {
                  const captainData = {
                    id: v.id, name: 'Capt. Demo User', shipName: v.name, shipType: v.type,
                    cargoType: v.cargo, imo: v.imo, currentSpeed: v.speed, heading: v.heading,
                    draft: v.draft, fuelRemaining: v.fuelRemaining, position: v.position,
                    eta: v.eta, voyageId: v.voyageId, departurePort: v.departurePort, destinationPort: v.destinationPort,
                  };
                  localStorage.setItem('voyageguard_captain', JSON.stringify(captainData));
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">{v.name}</span>
                    {v.chartered && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">★ CHARTER</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${riskBg(v.riskLevel)}`}>{v.riskScore}</span>
                </div>
                <div className="text-[10px] text-muted-foreground ml-5.5">
                  <span>{v.departurePort.split(' ')[0]} → {v.destinationPort.split(' ')[0]}</span>
                  <span className="mx-2">·</span>
                  <span>{v.speed}</span>
                  <span className="mx-2">·</span>
                  <span>ETA: {v.eta}</span>
                </div>
                {v.delayHours > 0 && (
                  <div className="flex items-center gap-3 mt-1.5 ml-5.5 text-[10px]">
                    <span className="text-destructive font-bold">+{v.delayHours}h delay</span>
                    {v.financialExposure > 0 && <span className="text-foreground font-semibold">${(v.financialExposure / 1000).toFixed(0)}k exposure</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Panel footer */}
          <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 shrink-0">
            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
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

export default FleetOverview;
