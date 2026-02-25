export interface FleetVessel {
  id: string;
  name: string;
  imo: string;
  type: string;
  departurePort: string;
  destinationPort: string;
  speed: string;
  heading: string;
  draft: string;
  fuelRemaining: string;
  cargo: string;
  position: { lat: number; lng: number };
  eta: string;
  etaDate: string;
  voyageId: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  delayHours: number;
  delayFactors: DelayFactor[];
  financialExposure: number;
  demurrageCostPerDay: number;
}

export interface DelayFactor {
  name: string;
  hours: number;
  severity: 'low' | 'medium' | 'high';
}

export interface MitigationStrategy {
  id: string;
  label: string;
  description: string;
  tag: 'Optimal' | 'Neutral' | 'Risky';
  costLabel: string;
  costAmount: string;
  demurrageSave: string;
  netBenefit: string;
}

export const fleetVessels: FleetVessel[] = [
  {
    id: 'vessel-1',
    name: 'MV Atlantic Meridian',
    imo: '9345678',
    type: 'Container Ship',
    departurePort: 'Singapore',
    destinationPort: 'Rotterdam',
    speed: '14.2 kn',
    heading: '312° NW',
    draft: '13.2m',
    fuelRemaining: '62%',
    cargo: '3,800 TEU',
    position: { lat: 32.5, lng: 28.0 },
    eta: '2d 14h',
    etaDate: 'Oct 24, 14:00',
    voyageId: 'VYG-2025-1102',
    riskScore: 85,
    riskLevel: 'Critical',
    status: 'High Risk (+54h Delay)',
    delayHours: 54,
    delayFactors: [
      { name: 'Port Congestion (Rotterdam)', hours: 36, severity: 'high' },
      { name: 'Weather (Bay of Biscay)', hours: 12, severity: 'medium' },
      { name: 'Customs/Regulatory', hours: 6, severity: 'low' },
    ],
    financialExposure: 84200,
    demurrageCostPerDay: 85000,
  },
  {
    id: 'vessel-2',
    name: 'Arctic Pioneer',
    imo: '9123456',
    type: 'Bulk Carrier',
    departurePort: 'Oslo',
    destinationPort: 'Hamburg',
    speed: '12.5 kn',
    heading: '178° S',
    draft: '10.8m',
    fuelRemaining: '78%',
    cargo: 'Iron Ore 45,000 MT',
    position: { lat: 58.2, lng: 5.8 },
    eta: '18h',
    etaDate: 'Oct 22, 09:00',
    voyageId: 'VYG-2025-1089',
    riskScore: 12,
    riskLevel: 'Low',
    status: 'On Schedule',
    delayHours: 0,
    delayFactors: [],
    financialExposure: 0,
    demurrageCostPerDay: 42000,
  },
  {
    id: 'vessel-3',
    name: 'Pacific Star',
    imo: '9567812',
    type: 'Container Ship',
    departurePort: 'Shanghai',
    destinationPort: 'Long Beach',
    speed: '16.0 kn',
    heading: '068° ENE',
    draft: '14.1m',
    fuelRemaining: '45%',
    cargo: '5,200 TEU',
    position: { lat: 22.3, lng: 144.5 },
    eta: '8d 6h',
    etaDate: 'Nov 02, 18:30',
    voyageId: 'VYG-2025-1134',
    riskScore: 42,
    riskLevel: 'Medium',
    status: 'Minor Delay (+8h)',
    delayHours: 8,
    delayFactors: [
      { name: 'Typhoon Avoidance Route', hours: 6, severity: 'medium' },
      { name: 'Port Scheduling Conflict', hours: 2, severity: 'low' },
    ],
    financialExposure: 28400,
    demurrageCostPerDay: 92000,
  },
  {
    id: 'vessel-4',
    name: 'Ocean Grace',
    imo: '9781234',
    type: 'Oil Tanker (VLCC)',
    departurePort: 'Santos',
    destinationPort: 'Antwerp',
    speed: '13.8 kn',
    heading: '032° NE',
    draft: '20.4m',
    fuelRemaining: '51%',
    cargo: 'Crude Oil 280,000 DWT',
    position: { lat: -8.5, lng: -20.3 },
    eta: '9d 2h',
    etaDate: 'Oct 28, 06:15',
    voyageId: 'VYG-2025-1078',
    riskScore: 8,
    riskLevel: 'Low',
    status: 'On Schedule',
    delayHours: 0,
    delayFactors: [],
    financialExposure: 0,
    demurrageCostPerDay: 110000,
  },
];

export const getMitigationStrategies = (vessel: FleetVessel): MitigationStrategy[] => [
  {
    id: 'speed-adjust',
    label: 'Option A: Speed Adjustment',
    description: `Increase to 18.5 knots`,
    tag: 'Optimal',
    costLabel: 'COST (FUEL)',
    costAmount: '+$12,400',
    demurrageSave: '-$28,000',
    netBenefit: '+$15,600',
  },
  {
    id: 'alt-port',
    label: 'Option B: Alternate Port',
    description: `Reroute to nearby alternate`,
    tag: 'Neutral',
    costLabel: 'COST (ADMIN)',
    costAmount: '+$4,200',
    demurrageSave: '-$6,500',
    netBenefit: '+$2,300',
  },
  {
    id: 'wait-berth',
    label: 'Option C: Wait for Berth',
    description: `Hold position and wait`,
    tag: 'Risky',
    costLabel: 'COST (DELAY)',
    costAmount: '+$0',
    demurrageSave: '$0',
    netBenefit: `-$${(vessel.demurrageCostPerDay * (vessel.delayHours / 24)).toLocaleString()}`,
  },
];
