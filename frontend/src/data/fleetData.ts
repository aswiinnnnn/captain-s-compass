export interface DelayFactor {
  name: string;
  hours: number;
  severity: 'low' | 'medium' | 'high';
  category: 'weather' | 'port' | 'customs' | 'political' | 'client' | 'mechanical' | 'congestion';
  detail: string;
}

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
  chartered: boolean;
  charterRate?: number; // $/day
}

export interface SmartOption {
  id: string;
  label: string;
  description: string;
  tag: 'Optimal' | 'Neutral' | 'Risky';
  costLabel: string;
  costAmount: string;
  demurrageSave: string;
  netBenefit: string;
  reasoning: string;
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
      { name: 'Port Congestion (Rotterdam)', hours: 36, severity: 'high', category: 'congestion', detail: 'Rotterdam Europoort experiencing unprecedented congestion. 42 vessels in queue, average wait 3.2 days. Labor strikes at terminal 3 have reduced throughput by 40%.' },
      { name: 'Storm System Bay of Biscay', hours: 12, severity: 'medium', category: 'weather', detail: 'Deep low-pressure system (978 hPa) generating 6-8m swells across the Bay of Biscay. Winds 45-55 kn from WSW. Safe passage requires speed reduction to 8 kn or 180nm diversion south.' },
      { name: 'EU Customs Hold — New Regulation', hours: 6, severity: 'low', category: 'customs', detail: 'New EU carbon border adjustment mechanism (CBAM) requires additional documentation for 12% of cargo. Pre-clearance processing delayed by 6 hours.' },
    ],
    financialExposure: 84200,
    demurrageCostPerDay: 85000,
    chartered: true,
    charterRate: 42000,
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
    chartered: false,
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
      { name: 'Typhoon Avoidance Route', hours: 6, severity: 'medium', category: 'weather', detail: 'Typhoon Krathon (Category 2) tracking NW across Philippine Sea. Vessel diverted 220nm south to avoid 50kn+ winds. Expected to add 6 hours to transit.' },
      { name: 'Port Scheduling Conflict', hours: 2, severity: 'low', category: 'port', detail: 'Long Beach Terminal Island berth 206 occupied by MSC vessel until 16:00 UTC. Next available window at 18:30 UTC. No alternate berths available for vessel draft.' },
    ],
    financialExposure: 28400,
    demurrageCostPerDay: 92000,
    chartered: true,
    charterRate: 55000,
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
    chartered: false,
  },
  {
    id: 'vessel-5',
    name: 'Coral Voyager',
    imo: '9456123',
    type: 'LNG Carrier',
    departurePort: 'Doha',
    destinationPort: 'Yokohama',
    speed: '18.5 kn',
    heading: '085° E',
    draft: '11.4m',
    fuelRemaining: '72%',
    cargo: 'LNG 145,000 m³',
    position: { lat: 12.8, lng: 65.2 },
    eta: '6d 8h',
    etaDate: 'Oct 30, 22:00',
    voyageId: 'VYG-2025-1156',
    riskScore: 78,
    riskLevel: 'High',
    status: 'Elevated Risk (+28h)',
    delayHours: 28,
    delayFactors: [
      { name: 'Piracy Alert — Gulf of Aden', hours: 8, severity: 'high', category: 'political', detail: 'UKMTO reports 3 suspicious approaches in BAM strait in past 72 hours. Naval escort convoy scheduled every 12h. Next convoy departs at 06:00 UTC. Armed security team embarked.' },
      { name: 'Malacca Strait Congestion', hours: 14, severity: 'high', category: 'congestion', detail: '87 vessels in Malacca Strait transit queue. VTS Singapore reports 4-hour spacing requirement for LNG carriers. Night transit restrictions apply for vessels >11m draft.' },
      { name: 'Client Delivery Window', hours: 6, severity: 'medium', category: 'client', detail: 'JERA Trading requires delivery by Nov 1 for winter gas storage. Late delivery triggers penalty clause: $180k/day. Alternate buyer available in Incheon at 8% discount.' },
    ],
    financialExposure: 156000,
    demurrageCostPerDay: 125000,
    chartered: true,
    charterRate: 78000,
  },
  {
    id: 'vessel-6',
    name: 'Nordic Empress',
    imo: '9234567',
    type: 'Container Ship',
    departurePort: 'Felixstowe',
    destinationPort: 'New York',
    speed: '15.8 kn',
    heading: '265° W',
    draft: '12.6m',
    fuelRemaining: '55%',
    cargo: '2,800 TEU',
    position: { lat: 48.5, lng: -22.0 },
    eta: '4d 12h',
    etaDate: 'Oct 26, 08:00',
    voyageId: 'VYG-2025-1178',
    riskScore: 91,
    riskLevel: 'Critical',
    status: 'Critical (+72h Delay)',
    delayHours: 72,
    delayFactors: [
      { name: 'Hurricane Maria Remnants', hours: 24, severity: 'high', category: 'weather', detail: 'Post-tropical cyclone Maria generating 8-12m seas along the North Atlantic shipping lane. NOAA advisory in effect. All eastbound traffic diverted to southern route adding 380nm.' },
      { name: 'NY/NJ Port Strike Warning', hours: 36, severity: 'high', category: 'political', detail: 'ILA union has issued 72-hour strike notice for Port Newark. Negotiations ongoing but terminal operators preparing for full shutdown. Alternate discharge at Norfolk or Baltimore adds 2 days.' },
      { name: 'Customs — Sanctioned Cargo Audit', hours: 12, severity: 'medium', category: 'customs', detail: 'CBP flagged 3 containers for enhanced inspection under new sanctions compliance protocol. Origin documentation discrepancies require shipper verification from UK.' },
    ],
    financialExposure: 198000,
    demurrageCostPerDay: 88000,
    chartered: true,
    charterRate: 48000,
  },
  {
    id: 'vessel-7',
    name: 'Horizon Trader',
    imo: '9678901',
    type: 'Bulk Carrier',
    departurePort: 'Newcastle (AU)',
    destinationPort: 'Qingdao',
    speed: '11.2 kn',
    heading: '345° N',
    draft: '15.3m',
    fuelRemaining: '68%',
    cargo: 'Coal 82,000 MT',
    position: { lat: -5.2, lng: 128.5 },
    eta: '5d 16h',
    etaDate: 'Oct 29, 04:00',
    voyageId: 'VYG-2025-1145',
    riskScore: 55,
    riskLevel: 'Medium',
    status: 'Moderate Risk (+18h)',
    delayHours: 18,
    delayFactors: [
      { name: 'Indonesian Strait Closure', hours: 10, severity: 'medium', category: 'political', detail: 'Indonesian Navy conducting exercises in Lombok Strait. Temporary closure from 22:00-06:00 UTC daily for 3 days. Alternate transit via Makassar Strait adds 14 hours.' },
      { name: 'Qingdao Berth Shortage', hours: 8, severity: 'medium', category: 'port', detail: 'Qingdao port berths 12-18 at full capacity. Coal terminal operating at 110% utilization. Priority given to vessels with pre-arranged discharge windows.' },
    ],
    financialExposure: 42000,
    demurrageCostPerDay: 56000,
    chartered: false,
  },
  {
    id: 'vessel-8',
    name: 'Cape Fortuna',
    imo: '9890123',
    type: 'Oil Tanker (Suezmax)',
    departurePort: 'Ras Tanura',
    destinationPort: 'Mumbai (JNPT)',
    speed: '14.0 kn',
    heading: '142° SE',
    draft: '16.8m',
    fuelRemaining: '82%',
    cargo: 'Crude Oil 160,000 DWT',
    position: { lat: 22.1, lng: 62.5 },
    eta: '1d 8h',
    etaDate: 'Oct 23, 20:00',
    voyageId: 'VYG-2025-1098',
    riskScore: 68,
    riskLevel: 'High',
    status: 'Elevated (+14h Delay)',
    delayHours: 14,
    delayFactors: [
      { name: 'Cyclone Tej — Arabian Sea', hours: 8, severity: 'high', category: 'weather', detail: 'Cyclone Tej (Category 1) tracking NE across Arabian Sea. Eye projected to pass 120nm north of vessel track. Swell height 4-6m, winds 35-45 kn. Speed reduction required.' },
      { name: 'JNPT Pilot Shortage', hours: 6, severity: 'medium', category: 'port', detail: 'Only 3 of 8 licensed deep-draft pilots available at JNPT. Pilot boarding delayed by 6 hours. Night berthing suspended for vessels >15m draft due to channel dredging.' },
    ],
    financialExposure: 64000,
    demurrageCostPerDay: 95000,
    chartered: true,
    charterRate: 52000,
  },
  {
    id: 'vessel-9',
    name: 'Emerald Spirit',
    imo: '9012345',
    type: 'Chemical Tanker',
    departurePort: 'Houston',
    destinationPort: 'Algeciras',
    speed: '13.5 kn',
    heading: '078° E',
    draft: '9.8m',
    fuelRemaining: '60%',
    cargo: 'Methanol 35,000 MT',
    position: { lat: 28.5, lng: -55.0 },
    eta: '7d 4h',
    etaDate: 'Oct 31, 12:00',
    voyageId: 'VYG-2025-1167',
    riskScore: 22,
    riskLevel: 'Low',
    status: 'On Schedule',
    delayHours: 0,
    delayFactors: [],
    financialExposure: 0,
    demurrageCostPerDay: 38000,
    chartered: false,
  },
  {
    id: 'vessel-10',
    name: 'Iron Monarch',
    imo: '9543210',
    type: 'Capesize Bulk',
    departurePort: 'Port Hedland',
    destinationPort: 'Gwangyang',
    speed: '12.0 kn',
    heading: '005° N',
    draft: '18.2m',
    fuelRemaining: '58%',
    cargo: 'Iron Ore 170,000 MT',
    position: { lat: 0.5, lng: 118.0 },
    eta: '4d 20h',
    etaDate: 'Oct 27, 06:00',
    voyageId: 'VYG-2025-1123',
    riskScore: 88,
    riskLevel: 'Critical',
    status: 'Critical (+48h Delay)',
    delayHours: 48,
    delayFactors: [
      { name: 'Mechanical — Main Engine Issue', hours: 18, severity: 'high', category: 'mechanical', detail: 'Turbocharger bearing failure on main engine cylinder bank B. Speed limited to 9.5 kn. Spare parts requested from Singapore anchorage. Dive inspection required at next port.' },
      { name: 'POSCO Contract Penalty Window', hours: 12, severity: 'high', category: 'client', detail: 'POSCO contract specifies delivery by Oct 26 00:00 UTC. Penalty: $220k for first 24h delay, escalating to $340k for 48h+. Force majeure clause may apply if mechanical failure documented.' },
      { name: 'Gwangyang Tidal Restrictions', hours: 18, severity: 'medium', category: 'port', detail: 'Vessels >17m draft restricted to high-tide windows (±2h of HW). Next suitable window: Oct 27 04:00 UTC. Missing this window delays berthing by 12.5 hours to next cycle.' },
    ],
    financialExposure: 312000,
    demurrageCostPerDay: 72000,
    chartered: true,
    charterRate: 38000,
  },
  {
    id: 'vessel-11',
    name: 'Stellar Phoenix',
    imo: '9876543',
    type: 'Car Carrier (PCTC)',
    departurePort: 'Nagoya',
    destinationPort: 'Bremerhaven',
    speed: '17.5 kn',
    heading: '248° WSW',
    draft: '10.2m',
    fuelRemaining: '41%',
    cargo: '4,800 vehicles',
    position: { lat: 14.0, lng: 52.0 },
    eta: '6d 2h',
    etaDate: 'Oct 30, 14:00',
    voyageId: 'VYG-2025-1189',
    riskScore: 74,
    riskLevel: 'High',
    status: 'Elevated (+32h Delay)',
    delayHours: 32,
    delayFactors: [
      { name: 'Suez Canal Queue Backlog', hours: 18, severity: 'high', category: 'congestion', detail: 'Suez Canal Authority reports 68-vessel backlog. Northbound convoy wait time 36-48 hours. Priority transit available via auction at $180k-$250k. Current vessel position: 14th in queue.' },
      { name: 'Houthi Threat — Red Sea', hours: 8, severity: 'high', category: 'political', detail: 'UKMTO advisory: 2 commercial vessels attacked near Bab el-Mandeb in past 48h. Insurance war risk premium increased to 0.75%. Armed escort recommended but adds 8h coordination time.' },
      { name: 'VW Delivery Deadline', hours: 6, severity: 'medium', category: 'client', detail: 'Volkswagen AG requires 2,200 units for Q4 European dealer allocation. Late arrival pushes model launch by 2 weeks. Contractual penalty: €85/vehicle/day after Nov 1.' },
    ],
    financialExposure: 245000,
    demurrageCostPerDay: 68000,
    chartered: true,
    charterRate: 45000,
  },
  {
    id: 'vessel-12',
    name: 'Blue Horizon',
    imo: '9321654',
    type: 'Reefer Vessel',
    departurePort: 'Guayaquil',
    destinationPort: 'Savannah',
    speed: '19.0 kn',
    heading: '010° N',
    draft: '8.4m',
    fuelRemaining: '38%',
    cargo: 'Bananas 8,500 pallets',
    position: { lat: 15.5, lng: -82.0 },
    eta: '2d 6h',
    etaDate: 'Oct 24, 18:00',
    voyageId: 'VYG-2025-1201',
    riskScore: 35,
    riskLevel: 'Medium',
    status: 'Minor Delay (+4h)',
    delayHours: 4,
    delayFactors: [
      { name: 'Refrigeration Unit Inspection', hours: 2, severity: 'low', category: 'mechanical', detail: 'USDA requires pre-arrival cold chain verification for perishable cargo. Reefer unit #3 showing temp variance of +1.2°C. Recalibration in progress, documentation needed.' },
      { name: 'Savannah Channel Draft Limit', hours: 2, severity: 'low', category: 'port', detail: 'Savannah River channel depth restricted to 14.2m due to spring tide schedule. Vessel draft 8.4m clears easily but waiting for outbound traffic window to enter.' },
    ],
    financialExposure: 12000,
    demurrageCostPerDay: 35000,
    chartered: false,
  },
];

export const getSmartOptions = (vessel: FleetVessel): SmartOption[] => {
  const opts: SmartOption[] = [];

  if (vessel.delayFactors.some(f => f.category === 'weather' || f.category === 'congestion')) {
    opts.push({
      id: 'slow-down',
      label: 'Reduce Speed & Save Fuel',
      description: 'Slow to economical speed since arrival is delayed anyway',
      tag: 'Optimal',
      costLabel: 'FUEL SAVED',
      costAmount: '-$18,200',
      demurrageSave: '$0',
      netBenefit: '+$18,200',
      reasoning: `The port ahead is experiencing significant delays${vessel.delayFactors.find(f => f.category === 'congestion')?.detail ? ' — ' + vessel.delayFactors.find(f => f.category === 'congestion')?.name.toLowerCase() : ''}. There is no point burning extra fuel to arrive early and wait at anchor. Reducing speed from ${vessel.speed} to economical speed (10-11 kn) saves approximately 12 MT/day of fuel. Over the remaining transit, this translates to ~$18,200 in bunker savings with zero impact on actual berth availability. The vessel can time arrival to coincide with the next available berth window.`,
    });
  }

  if (vessel.delayFactors.some(f => f.category === 'port' || f.category === 'congestion')) {
    opts.push({
      id: 'alt-port',
      label: 'Divert to Alternate Port',
      description: 'Reroute to nearby less congested port',
      tag: 'Neutral',
      costLabel: 'COST (ADMIN + TRUCKING)',
      costAmount: '+$22,400',
      demurrageSave: `-$${(vessel.demurrageCostPerDay * 2).toLocaleString()}`,
      netBenefit: `+$${((vessel.demurrageCostPerDay * 2) - 22400).toLocaleString()}`,
      reasoning: `The destination port has limited berth availability. Diverting to the nearest alternate port with available capacity saves approximately 2 days of waiting. While this incurs additional trucking/rail costs of ~$22,400 to move cargo to final destination, the demurrage savings of $${(vessel.demurrageCostPerDay * 2).toLocaleString()} significantly outweigh the logistics cost. Port authority at the alternate has confirmed berth availability within 6 hours of arrival.`,
    });
  }

  if (vessel.delayFactors.some(f => f.category === 'political')) {
    opts.push({
      id: 'alt-route',
      label: 'Take Alternative Route',
      description: 'Avoid risk zone via longer but safer passage',
      tag: 'Neutral',
      costLabel: 'COST (FUEL + TIME)',
      costAmount: '+$35,000',
      demurrageSave: '-$0',
      netBenefit: 'Safety Priority',
      reasoning: `Current route passes through an area with elevated security risk: ${vessel.delayFactors.find(f => f.category === 'political')?.name}. While the alternative route adds approximately 380nm and 1.5 days, it avoids the risk zone entirely. Insurance war risk premium alone on the current route is 0.75% of hull value (~$45,000). The diversion cost of $35,000 in additional fuel is lower than the insurance surcharge, making this economically rational even before considering crew safety.`,
    });
  }

  if (vessel.delayFactors.some(f => f.category === 'client')) {
    opts.push({
      id: 'negotiate-client',
      label: 'Negotiate Client Window Extension',
      description: 'Contact client to extend delivery window and avoid penalties',
      tag: 'Optimal',
      costLabel: 'COST (GOODWILL)',
      costAmount: '$0',
      demurrageSave: `-$${Math.round(vessel.financialExposure * 0.7).toLocaleString()}`,
      netBenefit: `+$${Math.round(vessel.financialExposure * 0.7).toLocaleString()}`,
      reasoning: `The client penalty clause is the largest financial risk factor. Historical data shows that 73% of clients accept a 24-48h window extension when notified proactively with a revised ETA. Early communication with documented weather/port delay evidence typically results in waived or reduced penalties. Recommend immediate outreach with: (1) updated ETA with confidence interval, (2) photographic weather evidence, (3) port authority delay confirmation letter.`,
    });
  }

  if (vessel.delayFactors.some(f => f.category === 'mechanical')) {
    opts.push({
      id: 'emergency-repair',
      label: 'Emergency Repair at Nearest Port',
      description: 'Divert for urgent mechanical repair to prevent worse failure',
      tag: 'Risky',
      costLabel: 'COST (REPAIR + DIVERSION)',
      costAmount: '+$85,000',
      demurrageSave: 'Prevents $400k+ breakdown',
      netBenefit: '+$315,000 (risk-adjusted)',
      reasoning: `The mechanical issue, if left unaddressed, has a 35% probability of escalating to a full engine failure based on similar turbocharger bearing patterns. A full failure mid-ocean would require emergency towing ($200k+), extended drydock ($150k+), and 3-4 weeks out of service. Diverting to the nearest port for a controlled repair takes 3-4 days but eliminates catastrophic failure risk. The expected value calculation strongly favors proactive repair.`,
    });
  }

  if (vessel.delayFactors.some(f => f.category === 'customs')) {
    opts.push({
      id: 'pre-clear',
      label: 'Pre-Clear Customs Remotely',
      description: 'Submit documentation ahead for faster processing',
      tag: 'Optimal',
      costLabel: 'COST (AGENT FEE)',
      costAmount: '+$2,800',
      demurrageSave: `-$${Math.round(vessel.demurrageCostPerDay * 0.25).toLocaleString()}`,
      netBenefit: `+$${Math.round(vessel.demurrageCostPerDay * 0.25 - 2800).toLocaleString()}`,
      reasoning: `Customs delays can be largely mitigated by engaging a local clearing agent to pre-submit documentation. The agent fee of $2,800 saves approximately 6 hours of port-side processing, equivalent to $${Math.round(vessel.demurrageCostPerDay * 0.25).toLocaleString()} in demurrage. Additionally, pre-clearance moves the vessel from "inspection queue" to "cleared for berth" status, improving berth allocation priority.`,
    });
  }

  // Always add a "wait" option
  opts.push({
    id: 'wait',
    label: 'Hold Position & Wait',
    description: 'Maintain current course and wait for conditions to clear',
    tag: 'Risky',
    costLabel: 'COST (DELAY)',
    costAmount: '+$0',
    demurrageSave: '$0',
    netBenefit: `-$${(vessel.demurrageCostPerDay * Math.max(1, vessel.delayHours / 24)).toLocaleString()}`,
    reasoning: `Waiting incurs demurrage costs of $${vessel.demurrageCostPerDay.toLocaleString()}/day with no active mitigation. While conditions may improve, the expected cost of waiting is $${(vessel.demurrageCostPerDay * Math.max(1, vessel.delayHours / 24)).toLocaleString()} based on current delay projections. This is the default "do nothing" option and is generally the most expensive path unless all delay factors resolve naturally within 12 hours.`,
  });

  return opts;
};

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

export const vesselRoutes: Record<string, [number, number][]> = {
  'vessel-1': [[1.26, 103.84], [6.0, 80.0], [12.8, 55.0], [20.0, 42.0], [28.0, 33.0], [32.5, 28.0], [35.0, 15.0], [38.0, 5.0], [45.0, 0.0], [51.9, 4.5]],
  'vessel-2': [[59.9, 10.7], [58.2, 5.8], [57.0, 8.0], [53.5, 10.0]],
  'vessel-3': [[31.2, 121.5], [28.0, 130.0], [22.3, 144.5], [25.0, 160.0], [30.0, -175.0], [33.0, -145.0], [33.8, -118.2]],
  'vessel-4': [[-23.9, -46.3], [-15.0, -35.0], [-8.5, -20.3], [0.0, -10.0], [15.0, -15.0], [35.0, -10.0], [45.0, -5.0], [51.2, 4.4]],
  'vessel-5': [[25.3, 51.5], [24.5, 58.0], [18.0, 62.0], [12.8, 65.2], [8.0, 78.0], [2.0, 100.0], [10.0, 115.0], [22.0, 125.0], [35.4, 139.6]],
  'vessel-6': [[51.9, 1.35], [50.5, -5.0], [48.5, -22.0], [42.0, -45.0], [40.5, -65.0], [40.7, -74.0]],
  'vessel-7': [[-32.9, 151.8], [-20.0, 148.0], [-10.0, 142.0], [-5.2, 128.5], [0.0, 120.0], [10.0, 118.0], [20.0, 119.0], [36.1, 120.3]],
  'vessel-8': [[26.7, 50.0], [26.0, 56.5], [22.1, 62.5], [19.0, 72.8]],
  'vessel-9': [[29.8, -95.3], [25.0, -90.0], [25.0, -80.0], [28.5, -55.0], [32.0, -35.0], [35.0, -15.0], [36.1, -5.4]],
  'vessel-10': [[-20.3, 118.6], [-10.0, 118.0], [0.5, 118.0], [10.0, 118.0], [22.0, 120.0], [34.9, 127.7]],
  'vessel-11': [[35.1, 136.9], [20.0, 115.0], [5.0, 100.0], [8.0, 75.0], [14.0, 52.0], [12.0, 45.0], [20.0, 38.0], [30.5, 32.3], [35.0, 15.0], [40.0, 5.0], [53.5, 8.6]],
  'vessel-12': [[-2.2, -79.9], [5.0, -79.0], [10.0, -81.0], [15.5, -82.0], [22.0, -82.0], [28.0, -80.0], [32.1, -81.1]],
};
