import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Bell, Settings, Search, ChevronDown, ChevronUp, Edit3, Save, X, AlertTriangle, TrendingUp, MapPin, Calendar as CalIcon, Shield, Truck, Clock, DollarSign, BarChart3, Eye, Filter } from 'lucide-react';
import NavTab from '@/components/NavTab';
import {
  portEntries, calendarEvents, riskZones,
  EVENT_TYPE_CONFIG, CONGESTION_CONFIG, getPortRiskScore, getPortDailyCost,
  type PortEntry, type CalendarEvent, type CalendarEventType, type UserRole,
} from '@/data/portIntelligenceData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Tab = 'ports' | 'calendar' | 'analytics' | 'risks';

const ROLE_LABELS: Record<UserRole, string> = { port_employee: 'Port Employee', voyage_planner: 'Voyage Planner', client: 'Client (Read-Only)' };

const PortIntelligence = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('ports');
  const [role, setRole] = useState<UserRole>('voyage_planner');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPort, setExpandedPort] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<CalendarEventType | 'all'>('all');
  const [editingPort, setEditingPort] = useState<string | null>(null);

  const canEdit = role === 'port_employee';
  const canViewAll = role === 'voyage_planner' || role === 'client';

  const filteredPorts = useMemo(() => {
    if (!searchTerm) return portEntries;
    const s = searchTerm.toLowerCase();
    return portEntries.filter(p => `${p.name} ${p.country} ${p.region} ${p.code}`.toLowerCase().includes(s));
  }, [searchTerm]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return calendarEvents;
    return calendarEvents.filter(e => e.type === eventFilter);
  }, [eventFilter]);

  // Cost chart data
  const costChartData = useMemo(() => portEntries.map(p => ({
    name: p.code,
    anchorage: p.anchorageCostPerDay,
    berth: p.berthCostPerHour * 24,
    equipment: p.equipment.reduce((sum, eq) => sum + eq.hireRatePerHour * eq.availableUnits, 0),
  })), []);

  const congestionData = useMemo(() => portEntries.map(p => ({
    name: p.code, port: p.name, level: p.congestionLevel,
    score: p.congestionLevel === 'Critical' ? 100 : p.congestionLevel === 'High' ? 75 : p.congestionLevel === 'Moderate' ? 50 : 25,
  })), []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ── Header ── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/fleet')}>
            <Anchor className="w-5 h-5 text-secondary" />
            <span className="font-semibold text-sm">VoyageGuard</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab onClick={() => navigate('/fleet')}>Fleet Overview</NavTab>
            <NavTab active>Port Intelligence</NavTab>
            <NavTab onClick={() => navigate('/voyage-planner')}>Voyage Planner</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Role switcher */}
          <select
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
          >
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Bell className="w-4 h-4 text-muted-foreground cursor-pointer" />
          <Settings className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
      </header>

      {/* ── Sub-tabs ── */}
      <div className="flex items-center gap-1 px-4 pt-2 pb-1 border-b border-border bg-card shrink-0">
        {([
          ['ports', 'Port Data', MapPin],
          ['calendar', 'Risk Calendar', CalIcon],
          ['analytics', 'Analytics', BarChart3],
          ['risks', 'Risk Zones', Shield],
        ] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t transition-colors ${
              activeTab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'ports' && <PortsTab ports={filteredPorts} searchTerm={searchTerm} setSearchTerm={setSearchTerm} expandedPort={expandedPort} setExpandedPort={setExpandedPort} canEdit={canEdit} editingPort={editingPort} setEditingPort={setEditingPort} />}
        {activeTab === 'calendar' && <CalendarTab events={filteredEvents} eventFilter={eventFilter} setEventFilter={setEventFilter} expandedEvent={expandedEvent} setExpandedEvent={setExpandedEvent} />}
        {activeTab === 'analytics' && <AnalyticsTab costData={costChartData} congestionData={congestionData} />}
        {activeTab === 'risks' && <RisksTab />}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Ports Tab
// ═══════════════════════════════════════════════════════
const PortsTab = ({ ports, searchTerm, setSearchTerm, expandedPort, setExpandedPort, canEdit, editingPort, setEditingPort }: {
  ports: PortEntry[]; searchTerm: string; setSearchTerm: (s: string) => void;
  expandedPort: string | null; setExpandedPort: (s: string | null) => void;
  canEdit: boolean; editingPort: string | null; setEditingPort: (s: string | null) => void;
}) => (
  <div className="space-y-3">
    {/* Search bar */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search ports by name, country, or code..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <span className="text-xs text-muted-foreground">{ports.length} ports</span>
    </div>

    {/* Port cards */}
    {ports.map(port => {
      const riskScore = getPortRiskScore(port.id);
      const isExpanded = expandedPort === port.id;
      const isEditing = editingPort === port.id;
      const cong = CONGESTION_CONFIG[port.congestionLevel];

      return (
        <div key={port.id} className="glass-panel rounded-xl overflow-hidden transition-all">
          {/* Header row */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedPort(isExpanded ? null : port.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{port.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{port.code}</span>
                </div>
                <span className="text-xs text-muted-foreground">{port.country} · {port.region}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Congestion badge */}
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cong.color}18`, color: cong.color }}>
                {cong.label} Congestion
              </span>
              {/* Risk score */}
              <div className="flex items-center gap-1">
                <div className="w-8 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${riskScore}%`, background: riskScore > 60 ? 'hsl(0,72%,51%)' : riskScore > 30 ? 'hsl(38,92%,50%)' : 'hsl(152,69%,41%)' }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">{riskScore}</span>
              </div>
              {/* Cost */}
              <span className="text-xs font-mono text-foreground">${port.anchorageCostPerDay.toLocaleString()}/d</span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Expanded detail */}
          {isExpanded && (
            <div className="border-t border-border p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Cost breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat icon={DollarSign} label="Anchorage/Day" value={`$${port.anchorageCostPerDay.toLocaleString()}`} />
                <MiniStat icon={Clock} label="Berth/Hour" value={`$${port.berthCostPerHour}`} />
                <MiniStat icon={Clock} label="Handling Time" value={`${port.estimatedHandlingTimeHrs}h`} />
                <MiniStat icon={TrendingUp} label="Risk Score" value={`${riskScore}/100`} accent={riskScore > 60 ? 'destructive' : riskScore > 30 ? 'warning' : 'success'} />
              </div>

              {/* Equipment table */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equipment Availability</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Total</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Available</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Rate/hr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {port.equipment.map((eq, i) => {
                        const pct = eq.availableUnits / eq.totalUnits;
                        const low = pct < 0.3;
                        return (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 font-medium">{eq.type}</td>
                            <td className="text-center py-2">{eq.totalUnits}</td>
                            <td className="text-center py-2">
                              <span className={low ? 'text-destructive font-semibold' : ''}>{eq.availableUnits}</span>
                              {low && <AlertTriangle className="inline w-3 h-3 ml-1 text-destructive" />}
                            </td>
                            <td className="text-center py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${eq.status === 'Operational' ? 'bg-green-100 text-green-700' : eq.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {eq.status}
                              </span>
                            </td>
                            <td className="text-right py-2 font-mono">${eq.hireRatePerHour}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Last updated + edit button */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span>Last updated by <strong>{port.lastUpdatedBy}</strong> · {new Date(port.lastUpdatedAt).toLocaleString()}</span>
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingPort(isEditing ? null : port.id); }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  >
                    {isEditing ? <><Save className="w-3 h-3" /> Save</> : <><Edit3 className="w-3 h-3" /> Edit</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════
// Calendar Tab — Card-based risk calendar
// ═══════════════════════════════════════════════════════
const CalendarTab = ({ events, eventFilter, setEventFilter, expandedEvent, setExpandedEvent }: {
  events: CalendarEvent[]; eventFilter: CalendarEventType | 'all'; setEventFilter: (f: CalendarEventType | 'all') => void;
  expandedEvent: string | null; setExpandedEvent: (s: string | null) => void;
}) => {
  const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [events]);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setEventFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${eventFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All Events ({calendarEvents.length})
        </button>
        {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([key, cfg]) => {
          const count = calendarEvents.filter(e => e.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setEventFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${eventFilter === key ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              style={eventFilter === key ? { background: cfg.color } : {}}
            >
              <span>{cfg.icon}</span> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline cards */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-3">
          {sortedEvents.map(event => {
            const cfg = EVENT_TYPE_CONFIG[event.type];
            const isExpanded = expandedEvent === event.id;
            const port = portEntries.find(p => p.id === event.portId);
            const startD = new Date(event.startDate);
            const endD = new Date(event.endDate);
            const durationDays = Math.ceil((endD.getTime() - startD.getTime()) / 86400000);

            return (
              <div key={event.id} className="relative pl-14">
                {/* Timeline dot */}
                <div
                  className="absolute left-[18px] top-5 w-4 h-4 rounded-full border-2 border-card z-10"
                  style={{ background: cfg.color }}
                />

                {/* Card */}
                <div
                  className={`rounded-xl border-l-4 transition-all cursor-pointer hover:shadow-md ${cfg.bgClass}`}
                  style={{ borderLeftColor: cfg.color }}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            event.severity === 'Critical' ? 'bg-red-200 text-red-800' :
                            event.severity === 'High' ? 'bg-orange-200 text-orange-800' :
                            event.severity === 'Moderate' ? 'bg-amber-200 text-amber-800' :
                            'bg-green-200 text-green-700'
                          }`}>
                            {event.severity}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="text-xs font-mono text-foreground">{startD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                        <div className="text-[10px] text-muted-foreground">{durationDays}d duration</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {port ? port.name : event.region}
                      </span>
                      <span>·</span>
                      <span>{startD.toLocaleDateString()} — {endD.toLocaleDateString()}</span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs text-foreground leading-relaxed animate-in slide-in-from-top-2 duration-200">
                        {event.detail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Analytics Tab
// ═══════════════════════════════════════════════════════
const AnalyticsTab = ({ costData, congestionData }: {
  costData: { name: string; anchorage: number; berth: number; equipment: number }[];
  congestionData: { name: string; port: string; level: string; score: number }[];
}) => {
  const portRiskData = useMemo(() => portEntries.map(p => ({
    name: p.code, port: p.name, risk: getPortRiskScore(p.id),
  })).sort((a, b) => b.risk - a.risk), []);

  // Equipment bottleneck alerts
  const bottlenecks = useMemo(() => {
    const alerts: { port: string; equipment: string; available: number; total: number }[] = [];
    portEntries.forEach(p => {
      p.equipment.forEach(eq => {
        if (eq.availableUnits / eq.totalUnits < 0.3) {
          alerts.push({ port: p.name, equipment: eq.type, available: eq.availableUnits, total: eq.totalUnits });
        }
      });
    });
    return alerts;
  }, []);

  // Recommended vs avoided
  const recommended = useMemo(() => portEntries.filter(p => getPortRiskScore(p.id) < 35 && p.congestionLevel !== 'Critical' && p.congestionLevel !== 'High'), []);
  const avoided = useMemo(() => portEntries.filter(p => getPortRiskScore(p.id) >= 50 || p.congestionLevel === 'Critical'), []);

  return (
    <div className="space-y-6">
      {/* ── Equipment Bottleneck Alerts ── */}
      {bottlenecks.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border-l-4 border-destructive">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Equipment Bottleneck Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
                <Truck className="w-4 h-4 text-destructive shrink-0" />
                <div>
                  <span className="font-semibold">{b.port}</span> — {b.equipment}: <span className="text-destructive font-bold">{b.available}/{b.total}</span> available
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended vs Avoided ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'hsl(152,69%,41%)' }}>
            ✅ Recommended Ports
          </h3>
          <div className="space-y-1.5">
            {recommended.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded bg-green-50">
                <span className="font-medium">{p.name} <span className="text-muted-foreground">({p.code})</span></span>
                <span className="font-mono text-green-700">Risk {getPortRiskScore(p.id)}</span>
              </div>
            ))}
            {recommended.length === 0 && <span className="text-xs text-muted-foreground">No ports meet all criteria currently</span>}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 border-l-4 border-red-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive mb-3">
            🚫 Avoid / High Risk
          </h3>
          <div className="space-y-1.5">
            {avoided.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded bg-red-50">
                <span className="font-medium">{p.name} <span className="text-muted-foreground">({p.code})</span></span>
                <span className="font-mono text-destructive">Risk {getPortRiskScore(p.id)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cost Comparison Chart ── */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-secondary" /> Port Cost Comparison (USD/Day)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(220,13%,90%)' }} />
              <Bar dataKey="anchorage" name="Anchorage" stackId="a" fill="hsl(224,76%,48%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="berth" name="Berth (24h)" stackId="a" fill="hsl(224,76%,68%)" />
              <Bar dataKey="equipment" name="Equipment" stackId="a" fill="hsl(200,70%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Congestion Heatmap ── */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-secondary" /> Port Congestion Levels
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {congestionData.map(cd => {
            const cfg = CONGESTION_CONFIG[cd.level];
            return (
              <div key={cd.name} className="glass-panel rounded-lg p-3 text-center">
                <div className="text-xs font-mono text-muted-foreground mb-1">{cd.name}</div>
                <div className="text-sm font-semibold mb-2">{cd.port}</div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${cd.score}%`, background: cfg.color }} />
                </div>
                <div className="text-[10px] font-medium mt-1" style={{ color: cfg.color }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Risk Scores Chart ── */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary" /> Port Risk Scores
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={portRiskData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(220,13%,90%)' }} />
              <Bar dataKey="risk" name="Risk Score" radius={[0, 6, 6, 0]}>
                {portRiskData.map((entry, i) => (
                  <Cell key={i} fill={entry.risk > 60 ? 'hsl(0,72%,51%)' : entry.risk > 30 ? 'hsl(38,92%,50%)' : 'hsl(152,69%,41%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Risk Zones Tab
// ═══════════════════════════════════════════════════════
const RisksTab = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold flex items-center gap-2">
      <Shield className="w-4 h-4 text-destructive" /> Active Maritime Risk Zones
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {riskZones.filter(z => z.active).map(zone => (
        <div key={zone.id} className={`glass-panel rounded-xl p-4 border-l-4 ${zone.severity === 'Critical' ? 'border-destructive' : 'border-orange-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">{zone.name}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${zone.severity === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
              {zone.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{zone.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {zone.region}
            <span className="ml-auto px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{zone.type.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Calendar events with war_risk type */}
    <h3 className="text-sm font-semibold flex items-center gap-2 mt-6">
      <AlertTriangle className="w-4 h-4 text-destructive" /> Active Risk Advisories
    </h3>
    <div className="space-y-2">
      {calendarEvents.filter(e => e.type === 'war_risk' || e.severity === 'Critical').map(event => {
        const cfg = EVENT_TYPE_CONFIG[event.type];
        return (
          <div key={event.id} className={`${cfg.bgClass} rounded-lg p-3 border-l-4`} style={{ borderLeftColor: cfg.color }}>
            <div className="flex items-center gap-2 text-xs">
              <span>{cfg.icon}</span>
              <span className="font-semibold">{event.title}</span>
              <span className="text-muted-foreground">— {event.region}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
          </div>
        );
      })}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// Mini Stat Card
// ═══════════════════════════════════════════════════════
const MiniStat = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
    <Icon className={`w-4 h-4 shrink-0 ${accent === 'destructive' ? 'text-destructive' : accent === 'warning' ? 'text-amber-500' : accent === 'success' ? 'text-green-600' : 'text-secondary'}`} />
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  </div>
);

export default PortIntelligence;
