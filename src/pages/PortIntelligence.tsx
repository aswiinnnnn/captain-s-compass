import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Bell, Settings, Search, ChevronDown, ChevronUp, Edit3, Save, X, AlertTriangle, TrendingUp, MapPin, Calendar as CalIcon, Shield, Truck, Clock, DollarSign, BarChart3, Eye, Filter, Plus, Trash2, Info } from 'lucide-react';
import NavTab from '@/components/NavTab';
import {
  portEntries, calendarEvents, riskZones,
  EVENT_TYPE_CONFIG, CONGESTION_CONFIG, getPortRiskScore, getPortDailyCost,
  type PortEntry, type EquipmentItem, type CalendarEvent, type CalendarEventType, type UserRole,
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

  // Mutable local data
  const [localPorts, setLocalPorts] = useState<PortEntry[]>([...portEntries]);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([...calendarEvents]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddPort, setShowAddPort] = useState(false);

  // Editing state for port fields
  const [editValues, setEditValues] = useState<Record<string, Partial<PortEntry>>>({});

  const canEdit = role === 'port_employee';
  const canViewAll = role === 'voyage_planner' || role === 'client';

  const filteredPorts = useMemo(() => {
    if (!searchTerm) return localPorts;
    const s = searchTerm.toLowerCase();
    return localPorts.filter(p => `${p.name} ${p.country} ${p.region} ${p.code}`.toLowerCase().includes(s));
  }, [searchTerm, localPorts]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return localEvents;
    return localEvents.filter(e => e.type === eventFilter);
  }, [eventFilter, localEvents]);

  const costChartData = useMemo(() => localPorts.map(p => ({
    name: p.code,
    anchorage: p.anchorageCostPerDay,
    berth: p.berthCostPerHour * 24,
    equipment: p.equipment.reduce((sum, eq) => sum + eq.hireRatePerHour * eq.availableUnits, 0),
  })), [localPorts]);

  const congestionData = useMemo(() => localPorts.map(p => ({
    name: p.code, port: p.name, level: p.congestionLevel,
    score: p.congestionLevel === 'Critical' ? 100 : p.congestionLevel === 'High' ? 75 : p.congestionLevel === 'Moderate' ? 50 : 25,
  })), [localPorts]);

  const startEditPort = (portId: string) => {
    const port = localPorts.find(p => p.id === portId);
    if (port) setEditValues(prev => ({ ...prev, [portId]: { ...port } }));
    setEditingPort(portId);
  };

  const savePortEdit = (portId: string) => {
    const vals = editValues[portId];
    if (!vals) return;
    setLocalPorts(prev => prev.map(p => p.id === portId ? { ...p, ...vals, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: 'You (Port Employee)' } : p));
    setEditingPort(null);
  };

  const updateEditField = (portId: string, field: string, value: any) => {
    setEditValues(prev => ({ ...prev, [portId]: { ...prev[portId], [field]: value } }));
  };

  const addNewEvent = (event: CalendarEvent) => {
    setLocalEvents(prev => [...prev, event]);
    setShowAddEvent(false);
  };

  const deleteEvent = (eventId: string) => {
    setLocalEvents(prev => prev.filter(e => e.id !== eventId));
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
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
          <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground">
            {Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
          <Bell className="w-4 h-4 text-muted-foreground cursor-pointer" />
          <Settings className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-4 pt-2 pb-1 border-b border-border bg-card shrink-0">
        {([['ports', 'Port Data', MapPin], ['calendar', 'Risk Calendar', CalIcon], ['analytics', 'Analytics', BarChart3], ['risks', 'Risk Zones', Shield]] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t transition-colors ${activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'ports' && (
          <PortsTab ports={filteredPorts} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            expandedPort={expandedPort} setExpandedPort={setExpandedPort}
            canEdit={canEdit} editingPort={editingPort} startEditPort={startEditPort} savePortEdit={savePortEdit} cancelEdit={() => setEditingPort(null)}
            editValues={editValues} updateEditField={updateEditField} localPorts={localPorts} setLocalPorts={setLocalPorts}
            showAddPort={showAddPort} setShowAddPort={setShowAddPort} />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab events={filteredEvents} allEvents={localEvents} eventFilter={eventFilter} setEventFilter={setEventFilter}
            expandedEvent={expandedEvent} setExpandedEvent={setExpandedEvent}
            canEdit={canEdit} showAddEvent={showAddEvent} setShowAddEvent={setShowAddEvent}
            addNewEvent={addNewEvent} deleteEvent={deleteEvent} localPorts={localPorts} />
        )}
        {activeTab === 'analytics' && <AnalyticsTab costData={costChartData} congestionData={congestionData} localPorts={localPorts} />}
        {activeTab === 'risks' && <RisksTab localEvents={localEvents} />}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Ports Tab
// ═══════════════════════════════════════════════════════
const PortsTab = ({ ports, searchTerm, setSearchTerm, expandedPort, setExpandedPort, canEdit, editingPort, startEditPort, savePortEdit, cancelEdit, editValues, updateEditField, localPorts, setLocalPorts, showAddPort, setShowAddPort }: {
  ports: PortEntry[]; searchTerm: string; setSearchTerm: (s: string) => void;
  expandedPort: string | null; setExpandedPort: (s: string | null) => void;
  canEdit: boolean; editingPort: string | null; startEditPort: (id: string) => void; savePortEdit: (id: string) => void; cancelEdit: () => void;
  editValues: Record<string, Partial<PortEntry>>; updateEditField: (id: string, field: string, value: any) => void;
  localPorts: PortEntry[]; setLocalPorts: (fn: (prev: PortEntry[]) => PortEntry[]) => void;
  showAddPort: boolean; setShowAddPort: (b: boolean) => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search ports by name, country, or code..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <span className="text-xs text-muted-foreground">{ports.length} ports</span>
      {canEdit && (
        <button onClick={() => setShowAddPort(!showAddPort)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Port
        </button>
      )}
    </div>

    {/* Add port form */}
    {showAddPort && canEdit && <AddPortForm onAdd={(port) => { setLocalPorts(prev => [...prev, port]); setShowAddPort(false); }} onCancel={() => setShowAddPort(false)} />}

    {ports.map(port => {
      const riskScore = getPortRiskScore(port.id);
      const isExpanded = expandedPort === port.id;
      const isEditing = editingPort === port.id;
      const cong = CONGESTION_CONFIG[port.congestionLevel];
      const ev = isEditing ? editValues[port.id] : undefined;

      return (
        <div key={port.id} className="glass-panel rounded-xl overflow-hidden transition-all">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedPort(isExpanded ? null : port.id)}>
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
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cong.color}18`, color: cong.color }}>{cong.label} Congestion</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${riskScore}%`, background: riskScore > 60 ? 'hsl(0,72%,51%)' : riskScore > 30 ? 'hsl(38,92%,50%)' : 'hsl(152,69%,41%)' }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">{riskScore}</span>
              </div>
              <span className="text-xs font-mono text-foreground">${port.anchorageCostPerDay.toLocaleString()}/d</span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-border p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Editable cost breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isEditing ? (
                  <>
                    <EditableStat label="Anchorage/Day ($)" value={ev?.anchorageCostPerDay ?? port.anchorageCostPerDay}
                      onChange={v => updateEditField(port.id, 'anchorageCostPerDay', Number(v))} />
                    <EditableStat label="Berth/Hour ($)" value={ev?.berthCostPerHour ?? port.berthCostPerHour}
                      onChange={v => updateEditField(port.id, 'berthCostPerHour', Number(v))} />
                    <EditableStat label="Handling Time (hrs)" value={ev?.estimatedHandlingTimeHrs ?? port.estimatedHandlingTimeHrs}
                      onChange={v => updateEditField(port.id, 'estimatedHandlingTimeHrs', Number(v))} />
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Congestion Level</div>
                      <select value={ev?.congestionLevel ?? port.congestionLevel}
                        onChange={e => updateEditField(port.id, 'congestionLevel', e.target.value)}
                        className="w-full text-xs bg-card border border-border rounded px-2 py-1 text-foreground">
                        {['Low', 'Moderate', 'High', 'Critical'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <MiniStat icon={DollarSign} label="Anchorage/Day" value={`$${port.anchorageCostPerDay.toLocaleString()}`} />
                    <MiniStat icon={Clock} label="Berth/Hour" value={`$${port.berthCostPerHour}`} />
                    <MiniStat icon={Clock} label="Handling Time" value={`${port.estimatedHandlingTimeHrs}h`} />
                    <MiniStat icon={TrendingUp} label="Risk Score" value={`${riskScore}/100`} accent={riskScore > 60 ? 'destructive' : riskScore > 30 ? 'warning' : 'success'} />
                  </>
                )}
              </div>

              {/* Equipment table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipment Availability</h4>
                  {isEditing && (
                    <button onClick={() => {
                      const newEq: EquipmentItem = { type: 'Crane', totalUnits: 1, availableUnits: 1, status: 'Operational', hireRatePerHour: 100 };
                      const currentEq = ev?.equipment ?? port.equipment;
                      updateEditField(port.id, 'equipment', [...currentEq, newEq]);
                    }} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                      <Plus className="w-3 h-3" /> Add Equipment
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Total</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Available</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Rate/hr</th>
                        {isEditing && <th className="text-right py-2 font-medium text-muted-foreground w-8"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? (ev?.equipment ?? port.equipment) : port.equipment).map((eq, i) => {
                        const pct = eq.availableUnits / eq.totalUnits;
                        const low = pct < 0.3;
                        return (
                          <tr key={i} className="border-b border-border/50">
                            {isEditing ? (
                              <>
                                <td className="py-2">
                                  <select value={eq.type} onChange={e => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs[i] = { ...eqs[i], type: e.target.value as EquipmentItem['type'] };
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="bg-card border border-border rounded px-1 py-0.5 text-xs w-full">
                                    {['Crane', 'Forklift', 'Truck', 'Reach Stacker', 'Straddle Carrier'].map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </td>
                                <td className="text-center py-2">
                                  <input type="number" value={eq.totalUnits} onChange={e => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs[i] = { ...eqs[i], totalUnits: Number(e.target.value) };
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="w-14 text-center bg-card border border-border rounded px-1 py-0.5 text-xs" />
                                </td>
                                <td className="text-center py-2">
                                  <input type="number" value={eq.availableUnits} onChange={e => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs[i] = { ...eqs[i], availableUnits: Number(e.target.value) };
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="w-14 text-center bg-card border border-border rounded px-1 py-0.5 text-xs" />
                                </td>
                                <td className="text-center py-2">
                                  <select value={eq.status} onChange={e => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs[i] = { ...eqs[i], status: e.target.value as EquipmentItem['status'] };
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="bg-card border border-border rounded px-1 py-0.5 text-xs">
                                    {['Operational', 'Partial', 'Under Maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td className="text-right py-2">
                                  <input type="number" value={eq.hireRatePerHour} onChange={e => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs[i] = { ...eqs[i], hireRatePerHour: Number(e.target.value) };
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="w-16 text-right bg-card border border-border rounded px-1 py-0.5 text-xs" />
                                </td>
                                <td className="text-right py-2">
                                  <button onClick={() => {
                                    const eqs = [...(ev?.equipment ?? port.equipment)];
                                    eqs.splice(i, 1);
                                    updateEditField(port.id, 'equipment', eqs);
                                  }} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3 h-3" /></button>
                                </td>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Last updated + edit/save */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span>Last updated by <strong>{port.lastUpdatedBy}</strong> · {new Date(port.lastUpdatedAt).toLocaleString()}</span>
                {canEdit && (
                  isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); savePortEdit(port.id); }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs">
                        <Save className="w-3 h-3" /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); startEditPort(port.id); }}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )
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
// Add Port Form
// ═══════════════════════════════════════════════════════
const AddPortForm = ({ onAdd, onCancel }: { onAdd: (p: PortEntry) => void; onCancel: () => void }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [code, setCode] = useState('');
  const [anchorage, setAnchorage] = useState('500');
  const [berth, setBerth] = useState('50');

  return (
    <div className="glass-panel rounded-xl p-4 border-l-4 border-primary space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add New Port</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-[10px] text-muted-foreground">Port Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="e.g. Durban" /></div>
        <div><label className="text-[10px] text-muted-foreground">Country</label><input value={country} onChange={e => setCountry(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="e.g. South Africa" /></div>
        <div><label className="text-[10px] text-muted-foreground">Region</label><input value={region} onChange={e => setRegion(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="e.g. Africa - South" /></div>
        <div><label className="text-[10px] text-muted-foreground">Code</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground font-mono" placeholder="e.g. ZADUR" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-muted-foreground">Anchorage Cost/Day ($)</label><input type="number" value={anchorage} onChange={e => setAnchorage(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" /></div>
        <div><label className="text-[10px] text-muted-foreground">Berth Cost/Hour ($)</label><input type="number" value={berth} onChange={e => setBerth(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" /></div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-foreground">Cancel</button>
        <button onClick={() => {
          if (!name || !code) return;
          onAdd({
            id: code.toLowerCase(), name, country, region, code, lat: 0, lng: 0,
            anchorageCostPerDay: Number(anchorage), berthCostPerHour: Number(berth),
            equipment: [], estimatedHandlingTimeHrs: 24, congestionLevel: 'Low',
            lastUpdatedBy: 'You (Port Employee)', lastUpdatedAt: new Date().toISOString(),
          });
        }} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-semibold">Add Port</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Calendar Tab
// ═══════════════════════════════════════════════════════
const CalendarTab = ({ events, allEvents, eventFilter, setEventFilter, expandedEvent, setExpandedEvent, canEdit, showAddEvent, setShowAddEvent, addNewEvent, deleteEvent, localPorts }: {
  events: CalendarEvent[]; allEvents: CalendarEvent[]; eventFilter: CalendarEventType | 'all'; setEventFilter: (f: CalendarEventType | 'all') => void;
  expandedEvent: string | null; setExpandedEvent: (s: string | null) => void;
  canEdit: boolean; showAddEvent: boolean; setShowAddEvent: (b: boolean) => void;
  addNewEvent: (e: CalendarEvent) => void; deleteEvent: (id: string) => void; localPorts: PortEntry[];
}) => {
  const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [events]);

  return (
    <div className="space-y-4">
      {/* Filter chips + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button onClick={() => setEventFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${eventFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
          All ({allEvents.length})
        </button>
        {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([key, cfg]) => {
          const count = allEvents.filter(e => e.type === key).length;
          return (
            <button key={key} onClick={() => setEventFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${eventFilter === key ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              style={eventFilter === key ? { background: cfg.color } : {}}>
              <span>{cfg.icon}</span> {cfg.label} ({count})
            </button>
          );
        })}
        {canEdit && (
          <button onClick={() => setShowAddEvent(!showAddEvent)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Event
          </button>
        )}
      </div>

      {/* Add event form */}
      {showAddEvent && canEdit && <AddEventForm localPorts={localPorts} onAdd={addNewEvent} onCancel={() => setShowAddEvent(false)} />}

      {/* Timeline cards */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-3">
          {sortedEvents.map(event => {
            const cfg = EVENT_TYPE_CONFIG[event.type];
            const isExpanded = expandedEvent === event.id;
            const port = localPorts.find(p => p.id === event.portId);
            const startD = new Date(event.startDate);
            const endD = new Date(event.endDate);
            const durationDays = Math.ceil((endD.getTime() - startD.getTime()) / 86400000);

            return (
              <div key={event.id} className="relative pl-14">
                <div className="absolute left-[18px] top-5 w-4 h-4 rounded-full border-2 border-card z-10" style={{ background: cfg.color }} />
                <div className={`rounded-xl border-l-4 transition-all cursor-pointer hover:shadow-md ${cfg.bgClass}`} style={{ borderLeftColor: cfg.color }}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${event.severity === 'Critical' ? 'bg-red-200 text-red-800' : event.severity === 'High' ? 'bg-orange-200 text-orange-800' : event.severity === 'Moderate' ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-700'}`}>
                            {event.severity}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0 flex items-start gap-2">
                        <div>
                          <div className="text-xs font-mono text-foreground">{startD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-[10px] text-muted-foreground">{durationDays}d duration</div>
                        </div>
                        {canEdit && (
                          <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{port ? port.name : event.region}</span>
                      <span>·</span>
                      <span>{startD.toLocaleDateString()} — {endD.toLocaleDateString()}</span>
                    </div>
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
// Add Event Form
// ═══════════════════════════════════════════════════════
const AddEventForm = ({ localPorts, onAdd, onCancel }: { localPorts: PortEntry[]; onAdd: (e: CalendarEvent) => void; onCancel: () => void }) => {
  const [type, setType] = useState<CalendarEventType>('holiday');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [detail, setDetail] = useState('');
  const [portId, setPortId] = useState<string>('');
  const [region, setRegion] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Moderate' | 'High' | 'Critical'>('Moderate');

  return (
    <div className="glass-panel rounded-xl p-4 border-l-4 border-primary space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Calendar Event</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground">Event Type</label>
          <select value={type} onChange={e => setType(e.target.value as CalendarEventType)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground">
            {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground">
            {['Low', 'Moderate', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Affected Port</label>
          <select value={portId} onChange={e => { setPortId(e.target.value); if (e.target.value) { const p = localPorts.find(pp => pp.id === e.target.value); if (p) setRegion(p.region); } }}
            className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground">
            <option value="">Global / Multi-port</option>
            {localPorts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Region</label>
          <input value={region} onChange={e => setRegion(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="e.g. Asia - East" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className="text-[10px] text-muted-foreground">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="e.g. Eid Holiday" /></div>
        <div><label className="text-[10px] text-muted-foreground">Short Description</label><input value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" placeholder="Brief impact summary" /></div>
      </div>
      <div><label className="text-[10px] text-muted-foreground">Detailed Info</label><textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground resize-none" placeholder="Full details about the event impact..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-muted-foreground">Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" /></div>
        <div><label className="text-[10px] text-muted-foreground">End Date</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground" /></div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-foreground">Cancel</button>
        <button onClick={() => {
          if (!title || !start || !end) return;
          onAdd({ id: `ev-${Date.now()}`, type, title, description: desc, detail, portId: portId || null, region, startDate: start, endDate: end, severity });
        }} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-semibold">Add Event</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Editable Stat
// ═══════════════════════════════════════════════════════
const EditableStat = ({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) => (
  <div className="p-2 rounded-lg bg-muted/50">
    <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      className="w-full text-xs font-semibold bg-card border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
  </div>
);

// ═══════════════════════════════════════════════════════
// Analytics Tab
// ═══════════════════════════════════════════════════════
const AnalyticsTab = ({ costData, congestionData, localPorts }: {
  costData: { name: string; anchorage: number; berth: number; equipment: number }[];
  congestionData: { name: string; port: string; level: string; score: number }[];
  localPorts: PortEntry[];
}) => {
  const portRiskData = useMemo(() => localPorts.map(p => ({
    name: p.code, port: p.name, risk: getPortRiskScore(p.id),
  })).sort((a, b) => b.risk - a.risk), [localPorts]);

  const bottlenecks = useMemo(() => {
    const alerts: { port: string; equipment: string; available: number; total: number }[] = [];
    localPorts.forEach(p => {
      p.equipment.forEach(eq => {
        if (eq.availableUnits / eq.totalUnits < 0.3) {
          alerts.push({ port: p.name, equipment: eq.type, available: eq.availableUnits, total: eq.totalUnits });
        }
      });
    });
    return alerts;
  }, [localPorts]);

  const recommended = useMemo(() => localPorts.filter(p => getPortRiskScore(p.id) < 35 && p.congestionLevel !== 'Critical' && p.congestionLevel !== 'High'), [localPorts]);
  const avoided = useMemo(() => localPorts.filter(p => getPortRiskScore(p.id) >= 50 || p.congestionLevel === 'Critical'), [localPorts]);

  return (
    <div className="space-y-6">
      {bottlenecks.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border-l-4 border-destructive">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-destructive" /> Equipment Bottleneck Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
                <Truck className="w-4 h-4 text-destructive shrink-0" />
                <div><span className="font-semibold">{b.port}</span> — {b.equipment}: <span className="text-destructive font-bold">{b.available}/{b.total}</span> available</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'hsl(152,69%,41%)' }}>✅ Recommended Ports</h3>
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
          <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive mb-3">🚫 Avoid / High Risk</h3>
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

      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-secondary" /> Port Cost Comparison (USD/Day)</h3>
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

      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-secondary" /> Port Congestion Levels</h3>
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

      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-secondary" /> Port Risk Scores</h3>
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
const RisksTab = ({ localEvents }: { localEvents: CalendarEvent[] }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-destructive" /> Active Maritime Risk Zones</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {riskZones.filter(z => z.active).map(zone => (
        <div key={zone.id} className={`glass-panel rounded-xl p-4 border-l-4 ${zone.severity === 'Critical' ? 'border-destructive' : 'border-orange-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">{zone.name}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${zone.severity === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>{zone.severity}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{zone.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {zone.region}
            <span className="ml-auto px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{zone.type.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      ))}
    </div>

    <h3 className="text-sm font-semibold flex items-center gap-2 mt-6"><AlertTriangle className="w-4 h-4 text-destructive" /> Active Risk Advisories</h3>
    <div className="space-y-2">
      {localEvents.filter(e => e.type === 'war_risk' || e.severity === 'Critical').map(event => {
        const cfg = EVENT_TYPE_CONFIG[event.type];
        return (
          <div key={event.id} className={`${cfg.bgClass} rounded-lg p-3 border-l-4`} style={{ borderLeftColor: cfg.color }}>
            <div className="flex items-center gap-2 text-xs">
              <span>{cfg.icon}</span><span className="font-semibold">{event.title}</span>
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
