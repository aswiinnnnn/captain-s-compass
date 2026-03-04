export interface Port {
  id: string;
  name: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  variants: ('Inbound' | 'Outbound')[];
}

export interface Vessel {
  id: string;
  name: string;
  type: string;
  draft: number;
  imo: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface VoyageRouteOption {
  id: string;
  tag: 'LOWEST COST' | 'FASTEST' | 'WEATHER OPTIMISED';
  subtitle: string;
  color: string;
  from: string;
  to: string;
  departureUTC: string;
  arrivalUTC: string;
  distanceNM: number;
  avgSOG: number;
  sailingTime: string;
  fuelMT: number;
  fuelCostUSD: number;
  euaETS: number;
  co2Tons: number;
  waypoints: Waypoint[];
  weatherRisk: 'Low' | 'Moderate' | 'High';
  ecaTransitNM: number;
}

export const ports: Port[] = [
  { id: 'rotterdam', name: 'Rotterdam', country: 'NL', code: 'NLRTM', lat: 51.9, lng: 4.5, variants: ['Inbound', 'Outbound'] },
  { id: 'hamburg', name: 'Hamburg', country: 'DE', code: 'DEHAM', lat: 53.55, lng: 9.99, variants: ['Inbound', 'Outbound'] },
  { id: 'antwerp', name: 'Antwerp', country: 'BE', code: 'BEANR', lat: 51.23, lng: 4.4, variants: ['Inbound', 'Outbound'] },
  { id: 'singapore', name: 'Singapore', country: 'SG', code: 'SGSIN', lat: 1.26, lng: 103.84, variants: ['Inbound', 'Outbound'] },
  { id: 'shanghai', name: 'Shanghai', country: 'CN', code: 'CNSHA', lat: 31.23, lng: 121.47, variants: ['Inbound', 'Outbound'] },
  { id: 'felixstowe', name: 'Felixstowe', country: 'GB', code: 'GBFXT', lat: 51.96, lng: 1.35, variants: ['Inbound', 'Outbound'] },
  { id: 'newyork', name: 'New York / New Jersey', country: 'US', code: 'USNYC', lat: 40.68, lng: -74.04, variants: ['Inbound', 'Outbound'] },
  { id: 'longbeach', name: 'Long Beach', country: 'US', code: 'USLGB', lat: 33.77, lng: -118.19, variants: ['Inbound', 'Outbound'] },
  { id: 'yokohama', name: 'Yokohama', country: 'JP', code: 'JPYOK', lat: 35.44, lng: 139.64, variants: ['Inbound', 'Outbound'] },
  { id: 'mumbai', name: 'Mumbai (JNPT)', country: 'IN', code: 'INNSA', lat: 18.95, lng: 72.95, variants: ['Inbound', 'Outbound'] },
  { id: 'santos', name: 'Santos', country: 'BR', code: 'BRSSZ', lat: -23.96, lng: -46.3, variants: ['Inbound', 'Outbound'] },
  { id: 'busan', name: 'Busan', country: 'KR', code: 'KRPUS', lat: 35.1, lng: 129.04, variants: ['Inbound', 'Outbound'] },
];

export const vessels: Vessel[] = [
  { id: 'sally-brown', name: 'Sally Brown', type: 'Container Ship', draft: 10.4, imo: '9345100' },
  { id: 'nordic-star', name: 'Nordic Star', type: 'Bulk Carrier', draft: 12.8, imo: '9456200' },
  { id: 'pacific-titan', name: 'Pacific Titan', type: 'Oil Tanker (VLCC)', draft: 20.1, imo: '9567300' },
  { id: 'crest-mariner', name: 'Crest Mariner', type: 'Container Ship', draft: 11.6, imo: '9678400' },
  { id: 'iron-duke', name: 'Iron Duke', type: 'Capesize Bulk', draft: 17.5, imo: '9789500' },
];

// Generate waypoints for a route between two ports with variation
function generateWaypoints(from: Port, to: Port, variation: number): Waypoint[] {
  const pts: Waypoint[] = [{ lat: from.lat, lng: from.lng, name: from.name }];
  const steps = 8 + Math.floor(Math.random() * 4);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t + (Math.sin(t * Math.PI) * variation * (Math.random() - 0.3));
    const lng = from.lng + (to.lng - from.lng) * t + (Math.sin(t * Math.PI * 1.5) * variation * (Math.random() - 0.3));
    pts.push({ lat, lng });
  }
  pts.push({ lat: to.lat, lng: to.lng, name: to.name });
  return pts;
}

function calcDistance(wps: Waypoint[]): number {
  let d = 0;
  for (let i = 1; i < wps.length; i++) {
    const dlat = (wps[i].lat - wps[i - 1].lat) * 60;
    const dlng = (wps[i].lng - wps[i - 1].lng) * 60 * Math.cos((wps[i].lat * Math.PI) / 180);
    d += Math.sqrt(dlat * dlat + dlng * dlng);
  }
  return Math.round(d);
}

function formatSailingTime(hours: number): string {
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  const m = Math.round((hours % 1) * 60);
  return `${d}d ${h}h ${m}m`;
}

export function generateRouteOptions(fromPort: Port, toPort: Port, vesselName: string): VoyageRouteOption[] {
  const now = new Date();
  const departureUTC = new Date(now.getTime() + 2 * 3600000).toISOString();

  // Route 1: Lowest cost — slower, more fuel-efficient, longer path possible
  const wp1 = generateWaypoints(fromPort, toPort, 3);
  const dist1 = calcDistance(wp1);
  const speed1 = 10.5 + Math.random() * 1.5;
  const hours1 = dist1 / speed1;
  const arrival1 = new Date(now.getTime() + (2 + hours1) * 3600000).toISOString();
  const fuel1 = Math.round(hours1 * 1.8);
  const fuelCost1 = Math.round(fuel1 * 520);

  // Route 2: Fastest — highest speed, shortest path
  const wp2 = generateWaypoints(fromPort, toPort, 1);
  const dist2 = calcDistance(wp2);
  const speed2 = 15.5 + Math.random() * 2;
  const hours2 = dist2 / speed2;
  const arrival2 = new Date(now.getTime() + (2 + hours2) * 3600000).toISOString();
  const fuel2 = Math.round(hours2 * 3.2);
  const fuelCost2 = Math.round(fuel2 * 520);

  // Route 3: Weather optimised — balanced
  const wp3 = generateWaypoints(fromPort, toPort, 5);
  const dist3 = calcDistance(wp3);
  const speed3 = 13.0 + Math.random() * 1;
  const hours3 = dist3 / speed3;
  const arrival3 = new Date(now.getTime() + (2 + hours3) * 3600000).toISOString();
  const fuel3 = Math.round(hours3 * 2.4);
  const fuelCost3 = Math.round(fuel3 * 520);

  return [
    {
      id: 'route-lowest-cost',
      tag: 'LOWEST COST',
      subtitle: `Economical · ${vesselName}`,
      color: '#22C55E',
      from: `${fromPort.name} (${fromPort.country}) Outbound`,
      to: `${toPort.name} (${toPort.country}) Inbound`,
      departureUTC,
      arrivalUTC: arrival1,
      distanceNM: dist1,
      avgSOG: Math.round(speed1 * 10) / 10,
      sailingTime: formatSailingTime(hours1),
      fuelMT: fuel1,
      fuelCostUSD: fuelCost1,
      euaETS: Math.round(fuel1 * 0.12 * 10) / 10,
      co2Tons: Math.round(fuel1 * 3.114),
      waypoints: wp1,
      weatherRisk: 'Low',
      ecaTransitNM: Math.round(dist1 * 0.15),
    },
    {
      id: 'route-fastest',
      tag: 'FASTEST',
      subtitle: `Speed priority · ${vesselName}`,
      color: '#0066CC',
      from: `${fromPort.name} (${fromPort.country}) Outbound`,
      to: `${toPort.name} (${toPort.country}) Inbound`,
      departureUTC,
      arrivalUTC: arrival2,
      distanceNM: dist2,
      avgSOG: Math.round(speed2 * 10) / 10,
      sailingTime: formatSailingTime(hours2),
      fuelMT: fuel2,
      fuelCostUSD: fuelCost2,
      euaETS: Math.round(fuel2 * 0.12 * 10) / 10,
      co2Tons: Math.round(fuel2 * 3.114),
      waypoints: wp2,
      weatherRisk: 'High',
      ecaTransitNM: Math.round(dist2 * 0.08),
    },
    {
      id: 'route-weather',
      tag: 'WEATHER OPTIMISED',
      subtitle: `Weather optimised · ${vesselName}`,
      color: '#E87722',
      from: `${fromPort.name} (${fromPort.country}) Outbound`,
      to: `${toPort.name} (${toPort.country}) Inbound`,
      departureUTC,
      arrivalUTC: arrival3,
      distanceNM: dist3,
      avgSOG: Math.round(speed3 * 10) / 10,
      sailingTime: formatSailingTime(hours3),
      fuelMT: fuel3,
      fuelCostUSD: fuelCost3,
      euaETS: Math.round(fuel3 * 0.12 * 10) / 10,
      co2Tons: Math.round(fuel3 * 3.114),
      waypoints: wp3,
      weatherRisk: 'Moderate',
      ecaTransitNM: Math.round(dist3 * 0.2),
    },
  ];
}
