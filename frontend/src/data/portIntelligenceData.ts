// =====================================================
// Port Intelligence & Voyage Parameters — Data Layer
// =====================================================

export type UserRole = 'port_employee' | 'voyage_planner' | 'client';

export interface EquipmentItem {
  type: 'Crane' | 'Forklift' | 'Truck' | 'Reach Stacker' | 'Straddle Carrier';
  totalUnits: number;
  availableUnits: number;
  status: 'Operational' | 'Partial' | 'Under Maintenance';
  hireRatePerHour: number;
}

export interface PortEntry {
  id: string;
  name: string;
  country: string;
  region: string;
  code: string;
  lat: number;
  lng: number;
  anchorageCostPerDay: number;
  berthCostPerHour: number;
  equipment: EquipmentItem[];
  estimatedHandlingTimeHrs: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export type CalendarEventType = 'holiday' | 'weather' | 'strike' | 'war_risk' | 'customs_delay' | 'risk' | 'disruption';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description: string;
  detail: string;
  portId: string | null; // null = global / multi-port
  region: string;
  startDate: string;
  endDate: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface RiskZone {
  id: string;
  name: string;
  type: 'war_risk' | 'piracy' | 'restricted';
  region: string;
  severity: 'High' | 'Critical';
  description: string;
  active: boolean;
}

// ── Mock Port Data ────────────────────────────────────
export const portEntries: PortEntry[] = [
  {
    id: 'rotterdam', name: 'Rotterdam', country: 'Netherlands', region: 'Europe - North', code: 'NLRTM',
    lat: 51.9, lng: 4.5, anchorageCostPerDay: 1200, berthCostPerHour: 85,
    equipment: [
      { type: 'Crane', totalUnits: 12, availableUnits: 9, status: 'Operational', hireRatePerHour: 350 },
      { type: 'Forklift', totalUnits: 30, availableUnits: 24, status: 'Operational', hireRatePerHour: 45 },
      { type: 'Truck', totalUnits: 20, availableUnits: 18, status: 'Operational', hireRatePerHour: 60 },
      { type: 'Straddle Carrier', totalUnits: 8, availableUnits: 6, status: 'Operational', hireRatePerHour: 180 },
    ],
    estimatedHandlingTimeHrs: 18, congestionLevel: 'Moderate',
    lastUpdatedBy: 'P. van Dijk', lastUpdatedAt: '2026-02-25T14:30:00Z',
  },
  {
    id: 'hamburg', name: 'Hamburg', country: 'Germany', region: 'Europe - North', code: 'DEHAM',
    lat: 53.55, lng: 9.99, anchorageCostPerDay: 1050, berthCostPerHour: 78,
    equipment: [
      { type: 'Crane', totalUnits: 10, availableUnits: 7, status: 'Operational', hireRatePerHour: 320 },
      { type: 'Forklift', totalUnits: 25, availableUnits: 20, status: 'Operational', hireRatePerHour: 42 },
      { type: 'Truck', totalUnits: 15, availableUnits: 12, status: 'Operational', hireRatePerHour: 55 },
    ],
    estimatedHandlingTimeHrs: 16, congestionLevel: 'Low',
    lastUpdatedBy: 'K. Müller', lastUpdatedAt: '2026-02-24T09:15:00Z',
  },
  {
    id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia - Southeast', code: 'SGSIN',
    lat: 1.26, lng: 103.84, anchorageCostPerDay: 1800, berthCostPerHour: 120,
    equipment: [
      { type: 'Crane', totalUnits: 20, availableUnits: 14, status: 'Operational', hireRatePerHour: 400 },
      { type: 'Forklift', totalUnits: 50, availableUnits: 35, status: 'Partial', hireRatePerHour: 50 },
      { type: 'Truck', totalUnits: 40, availableUnits: 30, status: 'Operational', hireRatePerHour: 65 },
      { type: 'Reach Stacker', totalUnits: 10, availableUnits: 3, status: 'Partial', hireRatePerHour: 220 },
      { type: 'Straddle Carrier', totalUnits: 15, availableUnits: 10, status: 'Operational', hireRatePerHour: 200 },
    ],
    estimatedHandlingTimeHrs: 12, congestionLevel: 'High',
    lastUpdatedBy: 'L. Tan', lastUpdatedAt: '2026-02-26T06:00:00Z',
  },
  {
    id: 'shanghai', name: 'Shanghai', country: 'China', region: 'Asia - East', code: 'CNSHA',
    lat: 31.23, lng: 121.47, anchorageCostPerDay: 1400, berthCostPerHour: 95,
    equipment: [
      { type: 'Crane', totalUnits: 25, availableUnits: 18, status: 'Operational', hireRatePerHour: 280 },
      { type: 'Forklift', totalUnits: 60, availableUnits: 45, status: 'Operational', hireRatePerHour: 35 },
      { type: 'Truck', totalUnits: 35, availableUnits: 28, status: 'Operational', hireRatePerHour: 48 },
      { type: 'Reach Stacker', totalUnits: 12, availableUnits: 8, status: 'Operational', hireRatePerHour: 190 },
    ],
    estimatedHandlingTimeHrs: 14, congestionLevel: 'Moderate',
    lastUpdatedBy: 'W. Chen', lastUpdatedAt: '2026-02-25T22:45:00Z',
  },
  {
    id: 'mumbai', name: 'Mumbai (JNPT)', country: 'India', region: 'Asia - South', code: 'INNSA',
    lat: 18.95, lng: 72.95, anchorageCostPerDay: 650, berthCostPerHour: 42,
    equipment: [
      { type: 'Crane', totalUnits: 8, availableUnits: 3, status: 'Partial', hireRatePerHour: 210 },
      { type: 'Forklift', totalUnits: 18, availableUnits: 10, status: 'Partial', hireRatePerHour: 28 },
      { type: 'Truck', totalUnits: 12, availableUnits: 8, status: 'Operational', hireRatePerHour: 32 },
    ],
    estimatedHandlingTimeHrs: 28, congestionLevel: 'Critical',
    lastUpdatedBy: 'R. Sharma', lastUpdatedAt: '2026-02-24T18:00:00Z',
  },
  {
    id: 'newyork', name: 'New York / New Jersey', country: 'United States', region: 'Americas - North', code: 'USNYC',
    lat: 40.68, lng: -74.04, anchorageCostPerDay: 2200, berthCostPerHour: 145,
    equipment: [
      { type: 'Crane', totalUnits: 14, availableUnits: 11, status: 'Operational', hireRatePerHour: 420 },
      { type: 'Forklift', totalUnits: 35, availableUnits: 28, status: 'Operational', hireRatePerHour: 55 },
      { type: 'Truck', totalUnits: 25, availableUnits: 20, status: 'Operational', hireRatePerHour: 72 },
      { type: 'Straddle Carrier', totalUnits: 10, availableUnits: 8, status: 'Operational', hireRatePerHour: 240 },
    ],
    estimatedHandlingTimeHrs: 20, congestionLevel: 'Moderate',
    lastUpdatedBy: 'J. Martinez', lastUpdatedAt: '2026-02-25T16:00:00Z',
  },
  {
    id: 'santos', name: 'Santos', country: 'Brazil', region: 'Americas - South', code: 'BRSSZ',
    lat: -23.96, lng: -46.3, anchorageCostPerDay: 750, berthCostPerHour: 55,
    equipment: [
      { type: 'Crane', totalUnits: 6, availableUnits: 4, status: 'Operational', hireRatePerHour: 250 },
      { type: 'Forklift', totalUnits: 15, availableUnits: 9, status: 'Partial', hireRatePerHour: 30 },
      { type: 'Truck', totalUnits: 10, availableUnits: 7, status: 'Operational', hireRatePerHour: 38 },
    ],
    estimatedHandlingTimeHrs: 24, congestionLevel: 'High',
    lastUpdatedBy: 'M. Silva', lastUpdatedAt: '2026-02-23T12:00:00Z',
  },
  {
    id: 'busan', name: 'Busan', country: 'South Korea', region: 'Asia - East', code: 'KRPUS',
    lat: 35.1, lng: 129.04, anchorageCostPerDay: 980, berthCostPerHour: 72,
    equipment: [
      { type: 'Crane', totalUnits: 16, availableUnits: 14, status: 'Operational', hireRatePerHour: 300 },
      { type: 'Forklift', totalUnits: 40, availableUnits: 36, status: 'Operational', hireRatePerHour: 38 },
      { type: 'Truck', totalUnits: 22, availableUnits: 20, status: 'Operational', hireRatePerHour: 50 },
      { type: 'Reach Stacker', totalUnits: 8, availableUnits: 7, status: 'Operational', hireRatePerHour: 175 },
    ],
    estimatedHandlingTimeHrs: 10, congestionLevel: 'Low',
    lastUpdatedBy: 'S. Park', lastUpdatedAt: '2026-02-26T02:00:00Z',
  },
];

// ── Calendar Events ─────────────────────────────────────────────────────────
// Events are now fetched live from the backend (/api/calendar/) via
// useCalendarEvents() in src/hooks/useCalendarEvents.ts.
// This file retains only the static helpers and type definitions.

// ── Placeholder so imports don't break during migration ─────────────────────
// (nothing to export here — the hook owns the data)

// ── Risk Zones (kept static — not managed by the calendar API) ─────────────

export const riskZones: RiskZone[] = [
  { id: 'rz-1', name: 'Red Sea / Gulf of Aden', type: 'war_risk', region: 'Middle East', severity: 'Critical', description: 'Active Houthi attacks on commercial vessels', active: true },
  { id: 'rz-2', name: 'Gulf of Guinea', type: 'piracy', region: 'West Africa', severity: 'High', description: 'Piracy and armed robbery incidents', active: true },
  { id: 'rz-3', name: 'Black Sea — Western', type: 'war_risk', region: 'Eastern Europe', severity: 'Critical', description: 'Active conflict zone, mine risk', active: true },
  { id: 'rz-4', name: 'Strait of Hormuz', type: 'restricted', region: 'Middle East', severity: 'High', description: 'Geopolitical tensions, vessel seizure risk', active: true },
];

// ── Helpers ────────────────────────────────────
export const EVENT_TYPE_CONFIG: Record<CalendarEventType, { label: string; color: string; bgClass: string; borderClass: string; icon: string }> = {
  holiday:       { label: 'Public Holiday',   color: 'hsl(262, 83%, 58%)', bgClass: 'bg-purple-50',  borderClass: 'border-purple-300', icon: '🏛️' },
  weather:       { label: 'Weather Warning',  color: 'hsl(38, 92%, 50%)',  bgClass: 'bg-amber-50',   borderClass: 'border-amber-300',  icon: '🌊' },
  strike:        { label: 'Strike / Protest', color: 'hsl(0, 72%, 51%)',   bgClass: 'bg-red-50',     borderClass: 'border-red-300',    icon: '✊' },
  war_risk:      { label: 'War Risk Zone',    color: 'hsl(0, 0%, 20%)',    bgClass: 'bg-gray-100',   borderClass: 'border-gray-500',   icon: '⚠️' },
  customs_delay: { label: 'Customs Delay',    color: 'hsl(200, 70%, 50%)', bgClass: 'bg-sky-50',     borderClass: 'border-sky-300',    icon: '📋' },
  risk:          { label: 'War / Security',   color: 'hsl(0, 0%, 18%)',    bgClass: 'bg-gray-100',   borderClass: 'border-gray-500',   icon: '⚠️' },
  disruption:    { label: 'Port Disruption',  color: 'hsl(25, 90%, 45%)',  bgClass: 'bg-orange-50',  borderClass: 'border-orange-400', icon: '🚧' },
};

export const CONGESTION_CONFIG: Record<string, { color: string; label: string }> = {
  Low:      { color: 'hsl(152, 69%, 41%)', label: 'Low' },
  Moderate: { color: 'hsl(38, 92%, 50%)',  label: 'Moderate' },
  High:     { color: 'hsl(15, 80%, 50%)',  label: 'High' },
  Critical: { color: 'hsl(0, 72%, 51%)',   label: 'Critical' },
};

export function getPortRiskScore(portId: string, allEvents: CalendarEvent[] = []): number {
  const events = allEvents.filter(e => e.portId === portId || e.portId === null);
  let score = 0;
  events.forEach(e => {
    if (e.severity === 'Critical') score += 30;
    else if (e.severity === 'High') score += 20;
    else if (e.severity === 'Moderate') score += 10;
    else score += 5;
  });
  const port = portEntries.find(p => p.id === portId);
  if (port) {
    if (port.congestionLevel === 'Critical') score += 25;
    else if (port.congestionLevel === 'High') score += 15;
    else if (port.congestionLevel === 'Moderate') score += 8;
  }
  return Math.min(score, 100);
}

export function getPortDailyCost(port: PortEntry, berthHours: number = 24): number {
  return port.anchorageCostPerDay + (port.berthCostPerHour * berthHours);
}
