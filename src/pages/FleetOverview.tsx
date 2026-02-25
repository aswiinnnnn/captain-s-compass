import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fleetVessels, type FleetVessel } from '@/data/fleetData';
import { Anchor, Bell, Settings, Search, Filter, Download, Ship } from 'lucide-react';
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
  const [selectedVessel, setSelectedVessel] = useState<FleetVessel | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) { navigate('/'); return; }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/');
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [25, 30],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Ship markers
    fleetVessels.forEach(vessel => {
      const color = riskColor(vessel.riskLevel);
      const icon = L.divIcon({
        className: 'fleet-ship-marker',
        html: `
          <div style="position:relative; width:32px; height:32px; cursor:pointer;">
            <div style="position:absolute; inset:0; background:${color}20; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
            <div style="position:absolute; inset:4px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Vessel name label
      L.marker([vessel.position.lat, vessel.position.lng], {
        icon: L.divIcon({
          className: 'vessel-name-label',
          html: `<div style="background:white; border:1px solid hsl(220,13%,90%); border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; color:hsl(220,20%,15%); white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.08);">${vessel.name.split(' ').slice(0, 2).join(' ')}</div>`,
          iconSize: [100, 16],
          iconAnchor: [50, -14],
        }),
        interactive: false,
      }).addTo(map);

      const marker = L.marker([vessel.position.lat, vessel.position.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="min-width:180px;">
            <div style="font-weight:700; font-size:12px; margin-bottom:4px;">${vessel.name}</div>
            <div style="font-size:10px; color:#64748b; margin-bottom:2px;">IMO: ${vessel.imo} · ${vessel.type}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; font-size:10px; margin-top:4px;">
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
          { direction: 'top', offset: [0, -16], className: 'fleet-vessel-tooltip' }
        );

      marker.on('click', (e) => {
        const point = map.latLngToContainerPoint(e.latlng);
        setPopupPos({ x: point.x, y: point.y });
        setSelectedVessel(vessel);
      });
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  const handleExploreVoyage = (vessel: FleetVessel) => {
    // Store vessel as captain format for dashboard
    const captainData = {
      id: vessel.id,
      name: 'Capt. Demo User',
      shipName: vessel.name,
      shipType: vessel.type,
      cargoType: vessel.cargo,
      imo: vessel.imo,
      currentSpeed: vessel.speed,
      heading: vessel.heading,
      draft: vessel.draft,
      fuelRemaining: vessel.fuelRemaining,
      position: vessel.position,
      eta: vessel.eta,
      voyageId: vessel.voyageId,
      departurePort: vessel.departurePort,
      destinationPort: vessel.destinationPort,
    };
    localStorage.setItem('voyageguard_captain', JSON.stringify(captainData));
    setSelectedVessel(null);
    navigate('/dashboard');
  };

  const handleRiskAnalysis = (vessel: FleetVessel) => {
    setSelectedVessel(null);
    navigate(`/risk/${vessel.id}`);
  };

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
            <NavTab active onClick={() => navigate('/fleet')}>Fleet Overview</NavTab>
            <NavTab onClick={() => navigate('/dashboard')}>Dashboard</NavTab>
            <NavTab>Bidding Hub</NavTab>
            <NavTab>Fleet Analytics</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search vessels, ports..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full text-[7px] text-destructive-foreground flex items-center justify-center font-bold">3</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
            D
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {/* Risk Legend */}
        <div className="absolute bottom-20 left-4 z-[1000] bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold text-foreground tracking-wider mb-2">RISK LEGEND</div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Med</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(25, 90%, 50%)' }} /> Elevated</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Critical</span>
          </div>
        </div>

        {/* Vessel action popup */}
        {selectedVessel && popupPos && (
          <>
            <div className="absolute inset-0 z-[1001]" onClick={() => setSelectedVessel(null)} />
            <div
              className="absolute z-[1002] bg-card border border-border rounded-xl shadow-lg p-4 w-[260px]"
              style={{
                left: Math.min(popupPos.x - 130, window.innerWidth - 280),
                top: Math.max(popupPos.y - 200, 10),
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{selectedVessel.name}</h3>
                  <p className="text-[10px] text-muted-foreground">IMO: {selectedVessel.imo}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${riskBg(selectedVessel.riskLevel)}`}>
                  {selectedVessel.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Destination</span>
                  <span className="font-semibold text-foreground">{selectedVessel.destinationPort}</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Score</span>
                  <span className="font-semibold" style={{ color: riskColor(selectedVessel.riskLevel) }}>{selectedVessel.riskScore} / 100</span>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleExploreVoyage(selectedVessel)}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Ship className="w-3.5 h-3.5" /> Explore Voyage
                </button>
                <button
                  onClick={() => handleRiskAnalysis(selectedVessel)}
                  className="w-full py-2 rounded-lg border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                >
                  🛡️ Risk Analysis
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Vessels Table */}
      <div className="border-t border-border bg-card px-6 py-4" style={{ maxHeight: '40vh', overflow: 'auto' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Vessels in Transit</h2>
            <p className="text-xs text-muted-foreground">Showing {fleetVessels.length} vessels currently active in route</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[10px] tracking-wider uppercase">
                <th className="text-left py-2 pr-4 font-semibold">Vessel Name</th>
                <th className="text-left py-2 pr-4 font-semibold">IMO Number</th>
                <th className="text-left py-2 pr-4 font-semibold">Departure Port</th>
                <th className="text-left py-2 pr-4 font-semibold">Destination Port</th>
                <th className="text-center py-2 pr-4 font-semibold">Speed</th>
                <th className="text-center py-2 pr-4 font-semibold">ETA</th>
                <th className="text-center py-2 pr-4 font-semibold">Risk Shield</th>
                <th className="text-center py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fleetVessels.map(v => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-foreground">{v.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{v.imo}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{v.departurePort}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{v.destinationPort}</td>
                  <td className="py-3 pr-4 text-center text-foreground font-medium">{v.speed}</td>
                  <td className="py-3 pr-4 text-center text-muted-foreground">{v.etaDate}</td>
                  <td className="py-3 pr-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskBg(v.riskLevel)}`}>
                      {v.riskLevel} Risk ({v.riskScore.toString().padStart(2, '0')})
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => { setSelectedVessel(v); setPopupPos(null); }}
                      className="text-primary font-bold text-[10px] tracking-wider hover:underline"
                    >
                      VIEW DETAILS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
