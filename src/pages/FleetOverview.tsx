import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fleetVessels, getSmartOptions, type FleetVessel, type SmartOption } from '@/data/fleetData';
import { Anchor, Bell, Settings, Search, Filter, Download, Ship, AlertTriangle, Bot, Send, Sparkles, ChevronDown, ChevronUp, Shield, Clock, DollarSign, Navigation, User, MoreVertical, X } from 'lucide-react';
import NavTab from '@/components/NavTab';
import ReactMarkdown from 'react-markdown';

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

interface ChatMsg {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  smartOptions?: SmartOption[];
  vesselContext?: FleetVessel;
}

const tagColor = (tag: SmartOption['tag']) => {
  switch (tag) {
    case 'Optimal': return 'bg-success/10 text-success border-success/20';
    case 'Neutral': return 'bg-primary/10 text-primary border-primary/20';
    case 'Risky': return 'bg-destructive/10 text-destructive border-destructive/20';
  }
};

const FleetOverview = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'risk' | 'charter'>('risk');

  const criticalCount = fleetVessels.filter(v => v.riskLevel === 'Critical').length;
  const highCount = fleetVessels.filter(v => v.riskLevel === 'High').length;
  const severeCount = criticalCount + highCount;
  const charteredAtRisk = fleetVessels.filter(v => v.chartered && v.riskScore >= 50).length;

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '1',
      role: 'ai',
      content: `🚨 **Fleet Alert** — You have **${severeCount} high-severity cases** requiring immediate attention.\n\n` +
        `- **${criticalCount} Critical** vessels with 48h+ delays\n` +
        `- **${highCount} High risk** vessels on elevated alert\n` +
        `- **${charteredAtRisk} chartered vessels** at risk (costing you charter fees while delayed)\n\n` +
        `The red markers on your map indicate the most urgent cases. Click the ⚠️ warning icon on any vessel to get my risk analysis and recommended actions.\n\n` +
        `**Priority:** I recommend starting with chartered vessels — they're burning money while idle.`,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) { navigate('/'); return; }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/');
  };

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const addAIMessage = (content: string, smartOptions?: SmartOption[], vesselContext?: FleetVessel) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content,
        timestamp: new Date(),
        smartOptions,
        vesselContext,
      }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleWarningClick = (vessel: FleetVessel) => {
    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: `Analyze risk for ${vessel.name}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const factors = vessel.delayFactors;
    let analysis = `## ⚠️ ${vessel.name} — Risk Analysis\n\n`;
    analysis += `**Risk Score:** ${vessel.riskScore}/100 (${vessel.riskLevel})\n`;
    analysis += `**Delay:** +${vessel.delayHours}h | **Exposure:** $${vessel.financialExposure.toLocaleString()}\n`;
    if (vessel.chartered) {
      analysis += `**⚡ CHARTERED** — Charter rate: $${vessel.charterRate?.toLocaleString()}/day (bleeding money while delayed)\n`;
    }
    analysis += `\n### Risk Factors Detected:\n\n`;

    factors.forEach((f, i) => {
      const icon = f.category === 'weather' ? '🌊' : f.category === 'political' ? '🔴' : f.category === 'port' ? '🏗️' : f.category === 'customs' ? '📋' : f.category === 'client' ? '👤' : f.category === 'mechanical' ? '🔧' : '⏳';
      analysis += `${i + 1}. ${icon} **${f.name}** — ${f.hours}h delay\n   ${f.detail}\n\n`;
    });

    analysis += `\nHere are my **recommended actions** — click any option to understand the reasoning:`;

    const options = getSmartOptions(vessel);
    addAIMessage(analysis, options, vessel);
  };

  const handleSmartOptionClick = (option: SmartOption) => {
    setExpandedOption(expandedOption === option.id ? null : option.id);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simple mock response
    const lowerInput = chatInput.toLowerCase();
    let response = '';
    if (lowerInput.includes('chartered') || lowerInput.includes('charter')) {
      const chartered = fleetVessels.filter(v => v.chartered);
      const totalCharter = chartered.reduce((s, v) => s + (v.charterRate || 0), 0);
      response = `You have **${chartered.length} chartered vessels** in your fleet, costing **$${totalCharter.toLocaleString()}/day** in charter fees.\n\n` +
        chartered.filter(v => v.riskScore >= 50).map(v => `- **${v.name}** — $${v.charterRate?.toLocaleString()}/day, ${v.riskLevel} risk, +${v.delayHours}h delay`).join('\n') +
        `\n\nI recommend prioritizing these — every delay day costs you the charter rate on top of demurrage.`;
    } else if (lowerInput.includes('worst') || lowerInput.includes('critical')) {
      const critical = fleetVessels.filter(v => v.riskLevel === 'Critical');
      response = `**${critical.length} vessels** are in critical status:\n\n` +
        critical.map(v => `- **${v.name}** — Risk ${v.riskScore}/100, +${v.delayHours}h, $${v.financialExposure.toLocaleString()} exposure`).join('\n') +
        `\n\nClick the ⚠️ icon on their map markers for detailed analysis.`;
    } else {
      response = `I'm monitoring **${fleetVessels.length} vessels** across global routes. ${severeCount} need immediate attention.\n\nYou can:\n- Click ⚠️ on any vessel marker for risk analysis\n- Ask me about specific vessels or risk categories\n- Say "show chartered vessels" for cost prioritization`;
    }
    addAIMessage(response);
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

      // Name label
      L.marker([vessel.position.lat, vessel.position.lng], {
        icon: L.divIcon({
          className: 'vessel-name-label',
          html: `<div style="background:white; border:1px solid hsl(220,13%,90%); border-radius:6px; padding:2px 8px; font-size:9px; font-weight:700; color:hsl(220,20%,15%); white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.08);">${vessel.name.length > 16 ? vessel.name.substring(0, 14) + '…' : vessel.name}${vessel.chartered ? ' ★' : ''}</div>`,
          iconSize: [120, 16],
          iconAnchor: [60, -14],
        }),
        interactive: false,
      }).addTo(map);

      const marker = L.marker([vessel.position.lat, vessel.position.lng], { icon })
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
            ${vessel.riskScore >= 40 ? `<div style="margin-top:4px; font-size:9px; color:${color}; font-weight:700;">⚠ Click warning icon for AI risk analysis</div>` : ''}
          </div>`,
          { direction: 'top', offset: [0, -18], className: 'fleet-vessel-tooltip' }
        );

      marker.on('click', () => {
        if (vessel.riskScore >= 40) {
          handleWarningClick(vessel);
        }
      });
    });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

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
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full text-[7px] text-destructive-foreground flex items-center justify-center font-bold">{severeCount}</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">D</button>
        </div>
      </header>

      {/* Main content: Map + Table on left, Chatbot on right */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Map + Table */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Map */}
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
              <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-destructive" /> Click ⚠️ on vessels for AI risk analysis
              </div>
            </div>

            {/* Fleet stats overlay */}
            <div className="absolute top-4 left-4 z-[1000] flex gap-2">
              <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                <div className="text-[9px] font-bold text-muted-foreground tracking-wider">FLEET</div>
                <div className="text-lg font-bold text-foreground">{fleetVessels.length}</div>
              </div>
              <div className="bg-card border border-destructive/30 rounded-lg px-3 py-2 shadow-sm">
                <div className="text-[9px] font-bold text-destructive tracking-wider">ALERTS</div>
                <div className="text-lg font-bold text-destructive">{severeCount}</div>
              </div>
              <div className="bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-sm">
                <div className="text-[9px] font-bold text-primary tracking-wider">CHARTERED</div>
                <div className="text-lg font-bold text-primary">{fleetVessels.filter(v => v.chartered).length}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border-t border-border bg-card px-4 py-3 overflow-auto" style={{ maxHeight: '35vh' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-foreground">Vessels in Transit</h2>
                <p className="text-[10px] text-muted-foreground">{fleetVessels.length} active · {charteredAtRisk} chartered at risk</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortBy(sortBy === 'risk' ? 'charter' : 'risk')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {sortBy === 'risk' ? '↓ Risk' : '★ Charter First'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
                  <Filter className="w-3 h-3" /> Filter
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[9px] tracking-wider uppercase">
                  <th className="text-left py-2 pr-3 font-semibold">Vessel</th>
                  <th className="text-left py-2 pr-3 font-semibold">Type</th>
                  <th className="text-left py-2 pr-3 font-semibold">Route</th>
                  <th className="text-center py-2 pr-3 font-semibold">Charter</th>
                  <th className="text-center py-2 pr-3 font-semibold">Speed</th>
                  <th className="text-center py-2 pr-3 font-semibold">ETA</th>
                  <th className="text-center py-2 pr-3 font-semibold">Delay</th>
                  <th className="text-center py-2 pr-3 font-semibold">Exposure</th>
                  <th className="text-center py-2 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {sortedVessels.map(v => (
                  <tr key={v.id} className={`border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer ${v.chartered && v.riskScore >= 50 ? 'bg-destructive/[0.03]' : ''}`}
                    onClick={() => v.riskScore >= 40 ? handleWarningClick(v) : null}
                  >
                    <td className="py-2 pr-3">
                      <div className="font-semibold text-foreground">{v.name}</div>
                      <div className="text-[9px] text-muted-foreground">IMO: {v.imo}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{v.type.split(' ')[0]}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{v.departurePort.split(' ')[0]} → {v.destinationPort.split(' ')[0]}</td>
                    <td className="py-2 pr-3 text-center">
                      {v.chartered ? (
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">★ ${(v.charterRate! / 1000).toFixed(0)}k/d</span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">Owned</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-center font-medium text-foreground">{v.speed}</td>
                    <td className="py-2 pr-3 text-center text-muted-foreground">{v.eta}</td>
                    <td className="py-2 pr-3 text-center">
                      {v.delayHours > 0 ? (
                        <span className="text-destructive font-bold">+{v.delayHours}h</span>
                      ) : (
                        <span className="text-success font-medium">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      {v.financialExposure > 0 ? (
                        <span className="font-bold text-foreground">${(v.financialExposure / 1000).toFixed(0)}k</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${riskBg(v.riskLevel)}`}>
                        {v.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: AI Chatbot */}
        <div className="w-[380px] border-l border-border flex flex-col bg-chat-bg shrink-0">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fleet Intelligence Agent</p>
                <p className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Monitoring {fleetVessels.length} Vessels
                </p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.map(msg => (
              <div key={msg.id}>
                <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-[12px] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                    <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:last:mb-0 [&_ul]:mb-1 [&_h2]:text-sm [&_h2]:mt-1 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:mt-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Smart Options */}
                {msg.smartOptions && msg.smartOptions.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2">
                    {msg.smartOptions.map(opt => (
                      <div key={opt.id} className={`border rounded-lg overflow-hidden transition-all ${tagColor(opt.tag)}`}>
                        <button
                          onClick={() => handleSmartOptionClick(opt)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${tagColor(opt.tag)}`}>{opt.tag}</span>
                              <span className="text-[11px] font-semibold">{opt.label}</span>
                            </div>
                            <p className="text-[10px] opacity-80 mt-0.5">{opt.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-[10px] font-bold">{opt.netBenefit}</span>
                            {expandedOption === opt.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </button>
                        {expandedOption === opt.id && (
                          <div className="px-3 pb-3 border-t border-current/10">
                            <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                              <div className="text-center">
                                <div className="text-[8px] font-bold tracking-wider opacity-60">{opt.costLabel}</div>
                                <div className="text-[11px] font-bold">{opt.costAmount}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[8px] font-bold tracking-wider opacity-60">DEMURRAGE</div>
                                <div className="text-[11px] font-bold">{opt.demurrageSave}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[8px] font-bold tracking-wider opacity-60">NET</div>
                                <div className="text-[11px] font-bold">{opt.netBenefit}</div>
                              </div>
                            </div>
                            <div className="bg-background/50 rounded-lg p-2 text-[10px] leading-relaxed opacity-90">
                              <div className="flex items-center gap-1 mb-1 font-bold text-[9px] tracking-wider">
                                <Sparkles className="w-3 h-3" /> WHY THIS IS SMART
                              </div>
                              {opt.reasoning}
                            </div>
                            {msg.vesselContext && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => navigate(`/risk/${msg.vesselContext!.id}`)}
                                  className="flex-1 py-1.5 text-[10px] font-bold rounded-md bg-background/50 hover:bg-background/80 transition-colors text-center"
                                >
                                  🛡️ Full Risk Analysis
                                </button>
                                <button
                                  onClick={() => handleExploreVoyage(msg.vesselContext!)}
                                  className="flex-1 py-1.5 text-[10px] font-bold rounded-md bg-background/50 hover:bg-background/80 transition-colors text-center"
                                >
                                  <Ship className="w-3 h-3 inline mr-1" /> Explore Voyage
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className={`text-[9px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'text-right mr-8' : 'ml-8'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.6s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions + Input */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {['Show chartered at risk', 'Worst cases?', 'Fleet cost summary'].map(action => (
                <button
                  key={action}
                  onClick={() => { setChatInput(action); }}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors bg-card font-medium"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about fleet risks..."
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={handleSendChat}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
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

// Helper to navigate to dashboard with vessel context
function handleExploreVoyage(vessel: FleetVessel) {
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
}

export default FleetOverview;
