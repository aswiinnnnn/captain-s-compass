export interface Captain {
  id: string;
  name: string;
  email: string;
  password: string;
  shipName: string;
  shipType: string;
  cargoType: string;
  imo: string;
  currentSpeed: string;
  heading: string;
  draft: string;
  fuelRemaining: string;
  position: { lat: number; lng: number };
  eta: string;
  voyageId: string;
  departurePort: string;
  destinationPort: string;
}

export interface CanalPort {
  id: string;
  name: string;
  type: 'canal' | 'port' | 'strait';
  description: string;
  distance: string;
  eta: string;
  requiresBidding: boolean;
  requiresBooking: boolean;
  congestionStatus: 'Low' | 'Medium' | 'High';
  weatherRisk: 'Low' | 'Medium' | 'High';
  rules: string[];
  historicalCongestion: string;
  position: { lat: number; lng: number };
  currentBidRange: { min: number; max: number };
  avgClearingPrice: number;
  queueLength: number;
  securityLevel: 'Normal' | 'Elevated' | 'High';
}

export interface PreviousBid {
  time: string;
  amount: number;
  result: 'Won' | 'Lost' | 'Expired';
  clearingPrice: number;
  priority: string;
}

export interface BidFactor {
  name: string;
  value: string;
  impact: 'up' | 'down' | 'neutral';
  description: string;
  weight: number;
}

export const captains: Captain[] = [
  {
    id: 'captain-a',
    name: 'Capt. Jameson Miller',
    email: 'captain.a@voyageguard.com',
    password: 'demo123',
    shipName: 'MV Atlantic Star',
    shipType: 'Container Ship',
    cargoType: 'Mixed Containers (TEU: 4,200)',
    imo: 'IMO 9832741',
    currentSpeed: '18.4 knots',
    heading: '092° ESE',
    draft: '12.8m',
    fuelRemaining: '68%',
    position: { lat: 35.5, lng: 12.5 },
    eta: '14h 32m',
    voyageId: 'VYG-2025-0847',
    departurePort: 'Algeciras, Spain',
    destinationPort: 'Port Said, Egypt',
  },
  {
    id: 'captain-b',
    name: 'Capt. Elena Vasquez',
    email: 'captain.b@voyageguard.com',
    password: 'demo123',
    shipName: 'MT Crimson Tide',
    shipType: 'Oil Tanker (VLCC)',
    cargoType: 'Crude Oil (DWT: 320,000)',
    imo: 'IMO 9741582',
    currentSpeed: '14.2 knots',
    heading: '145° SE',
    draft: '21.5m',
    fuelRemaining: '54%',
    position: { lat: 24.5, lng: 58.0 },
    eta: '22h 15m',
    voyageId: 'VYG-2025-0912',
    departurePort: 'Fujairah, UAE',
    destinationPort: 'Rotterdam, Netherlands',
  },
];

// Route waypoints for the ship path (Mediterranean → Suez)
export const routeWaypoints: [number, number][] = [
  [36.1, -5.4],   // Algeciras
  [36.7, -2.0],
  [37.0, 2.0],
  [36.5, 6.0],
  [35.5, 12.5],   // Current position
  [34.0, 18.0],
  [33.5, 24.0],
  [32.5, 28.0],
  [31.5, 32.0],   // Port Said
  [30.0, 32.6],   // Suez Canal
];

export const canalsPorts: CanalPort[] = [
  {
    id: 'suez',
    name: 'Suez Canal',
    type: 'canal',
    description: 'The Suez Canal is a 193.3 km sea-level waterway connecting the Mediterranean Sea to the Red Sea. It handles ~12% of global trade with 50+ vessels daily. The New Suez Canal expansion (2015) added a 35km parallel channel enabling two-way traffic.',
    distance: '420 nm',
    eta: '14h 32m',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'High',
    weatherRisk: 'Low',
    rules: ['Bidding window: 6h before arrival', 'Priority: Tankers > Container > Bulk', 'Min transit gap: 15 min', 'Convoy system: 3 convoys/day'],
    historicalCongestion: 'Average wait time increased 40% in Q4 due to seasonal surge. Peak hours: 0600-1200 UTC. Red Sea diversions impacting queue.',
    position: { lat: 30.58, lng: 32.27 },
    currentBidRange: { min: 35000, max: 62000 },
    avgClearingPrice: 44200,
    queueLength: 24,
    securityLevel: 'Elevated',
  },
  {
    id: 'jeddah',
    name: 'Port of Jeddah',
    type: 'port',
    description: 'Saudi Arabia\'s largest commercial seaport and major Red Sea transshipment hub. Handles 65% of Saudi imports. King Abdullah Port expansion ongoing.',
    distance: '1,240 nm',
    eta: '3d 8h',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'Medium',
    weatherRisk: 'Medium',
    rules: ['Bidding window: 12h before arrival', 'Berth allocation based on bid rank', 'Priority surcharge for hazmat cargo'],
    historicalCongestion: 'Steady throughput. Minor delays during Hajj season. Average berth utilization: 78%.',
    position: { lat: 21.49, lng: 39.17 },
    currentBidRange: { min: 28000, max: 52000 },
    avgClearingPrice: 38500,
    queueLength: 12,
    securityLevel: 'Normal',
  },
  {
    id: 'aden',
    name: 'Gulf of Aden Passage',
    type: 'strait',
    description: 'Critical maritime corridor connecting the Red Sea to the Arabian Sea. Security escort required for transit. International naval coalition patrols active.',
    distance: '1,800 nm',
    eta: '4d 12h',
    requiresBidding: false,
    requiresBooking: true,
    congestionStatus: 'High',
    weatherRisk: 'High',
    rules: ['Security escort mandatory', 'AIS must be active at all times', 'Convoy transit recommended', 'Armed guards permitted'],
    historicalCongestion: 'Geopolitical tensions causing significant rerouting. Insurance premiums up 300%. Some carriers avoiding entirely.',
    position: { lat: 12.78, lng: 45.02 },
    currentBidRange: { min: 0, max: 0 },
    avgClearingPrice: 0,
    queueLength: 8,
    securityLevel: 'High',
  },
  {
    id: 'singapore',
    name: 'Port of Singapore',
    type: 'port',
    description: 'World\'s busiest transshipment port by container throughput. Handles 37.2M TEUs annually. Tuas Mega Port Phase 1 operational.',
    distance: '5,400 nm',
    eta: '12d 6h',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'Medium',
    weatherRisk: 'Low',
    rules: ['Bidding window: 24h before arrival', 'Berth allocation via VesselConnect system', 'Priority for alliance members', 'Green vessel discount: 5%'],
    historicalCongestion: 'Record throughput in 2024. Minor delays during monsoon season (Jun-Sep). Average turnaround: 1.2 days.',
    position: { lat: 1.26, lng: 103.84 },
    currentBidRange: { min: 22000, max: 48000 },
    avgClearingPrice: 34000,
    queueLength: 18,
    securityLevel: 'Normal',
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    type: 'canal',
    description: 'The 82km Panama Canal connects Atlantic and Pacific oceans. Expanded Neopanamax locks (2016) handle vessels up to 14,000 TEU. Drought restrictions eased.',
    distance: '8,200 nm',
    eta: '18d 4h',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'Low',
    weatherRisk: 'Low',
    rules: ['Auction-based slot allocation', 'Max beam: 51.25m (Neopanamax)', 'Booking 96h in advance', 'Premium slot surcharge: +40%'],
    historicalCongestion: 'Water level restrictions eased after 2024 drought. Current throughput at 88% capacity. Average 36 transits/day.',
    position: { lat: 9.08, lng: -79.68 },
    currentBidRange: { min: 18000, max: 45000 },
    avgClearingPrice: 28000,
    queueLength: 6,
    securityLevel: 'Normal',
  },
];

export const previousBids: PreviousBid[] = [
  { time: 'Oct 22, 14:30', amount: 41500, result: 'Lost', clearingPrice: 43200, priority: 'Standard' },
  { time: 'Oct 21, 09:15', amount: 44200, result: 'Won', clearingPrice: 42800, priority: 'High' },
  { time: 'Oct 19, 18:45', amount: 39800, result: 'Expired', clearingPrice: 41000, priority: 'Eco' },
  { time: 'Oct 18, 06:00', amount: 46100, result: 'Won', clearingPrice: 43500, priority: 'Standard' },
  { time: 'Oct 16, 11:30', amount: 38200, result: 'Lost', clearingPrice: 42100, priority: 'Eco' },
  { time: 'Oct 14, 15:00', amount: 45800, result: 'Won', clearingPrice: 44200, priority: 'High' },
];

export const bidFactors: BidFactor[] = [
  { name: 'Weather Conditions', value: 'Moderate winds, 1.2m swell', impact: 'up', description: 'Slight weather deterioration increases transit demand', weight: 0.15 },
  { name: 'Sea Level', value: '+0.5m above mean', impact: 'down', description: 'Higher water levels improve canal capacity and draft clearance', weight: 0.10 },
  { name: 'Traffic Density', value: '87% capacity', impact: 'up', description: 'High traffic increases competition for transit slots significantly', weight: 0.25 },
  { name: 'Seasonal Demand', value: 'Peak season (Q1)', impact: 'up', description: 'Q1 demand surge from post-holiday restocking and Chinese New Year', weight: 0.20 },
  { name: 'Ship Priority Score', value: '72 / 100', impact: 'down', description: 'Good compliance history and vessel age lowers required bid premium', weight: 0.15 },
  { name: 'Fuel Cost Index', value: '$612/mt (VLSFO)', impact: 'neutral', description: 'Stable fuel costs — no significant impact on bidding dynamics', weight: 0.05 },
  { name: 'Geopolitical Risk', value: 'Elevated (Red Sea)', impact: 'up', description: 'Houthi disruptions diverting traffic, increasing Suez demand', weight: 0.10 },
];

export const probabilityData = [
  { bid: 30000, probability: 3 },
  { bid: 33000, probability: 8 },
  { bid: 36000, probability: 18 },
  { bid: 39000, probability: 32 },
  { bid: 42000, probability: 52 },
  { bid: 44000, probability: 68 },
  { bid: 45500, probability: 78 },
  { bid: 48000, probability: 88 },
  { bid: 50000, probability: 93 },
  { bid: 54000, probability: 97 },
  { bid: 58000, probability: 99 },
  { bid: 60000, probability: 99.5 },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  card?: {
    type: 'recommendation';
    confidence: number;
    amount: number;
  };
}

export const getAIResponse = (userMessage: string, context?: { canalName?: string; bidAmount?: number }): string => {
  const msg = userMessage.toLowerCase();

  if (msg.includes('bid now') || msg.includes('place bid') || msg.includes('submit bid')) {
    if (context?.bidAmount) {
      const amount = context.bidAmount;
      if (amount < 40000) {
        return `⚠️ **Risk Assessment: HIGH**\n\nYour bid of **$${amount.toLocaleString()}** for ${context?.canalName || 'this transit'} is below the competitive threshold.\n\n**Critical Factors:**\n- Current queue: 24 vessels waiting\n- 85th percentile clearing price: $44,200\n- Your bid ranks in bottom 15% of current pool\n- Weather window closing in 18h\n\n🔴 **Win probability: ~${Math.round((amount / 60000) * 85)}%**\n\nI strongly recommend increasing to **$44,800** (+$${(44800 - amount).toLocaleString()}) to secure priority transit before predicted weather deterioration.\n\nShall I adjust the bid?`;
      } else if (amount <= 50000) {
        return `✅ **Bid Analysis Complete — OPTIMAL**\n\nYour bid of **$${amount.toLocaleString()}** for ${context?.canalName || 'this transit'} is well-positioned.\n\n**Assessment:**\n- ✓ Above 85th percentile of current bids\n- ✓ Within AI-recommended range ($42k-$48k)\n- ✓ Weather factor accounted for\n- ✓ Ship priority score applied (72/100)\n- ✓ Secures transit before Red Sea weather window\n\n🟢 **Win probability: ~${Math.min(96, Math.round((amount / 50000) * 92))}%**\n\n**Estimated savings vs. ceiling:** $${(62000 - amount).toLocaleString()}\n\nShall I proceed with placing this bid?`;
      } else {
        return `💰 **Overpay Warning — Consider Reducing**\n\nYour bid of **$${amount.toLocaleString()}** exceeds optimal range by ${Math.round((amount / 44800 - 1) * 100)}%.\n\n**Analysis:**\n- Win probability is already 96%+ at $50,000\n- You're paying **$${(amount - 44800).toLocaleString()}** above recommended\n- No additional priority gained above $50k\n- Better to save margin for Port of Jeddah bidding\n\n🟡 **AI Recommendation: $44,800** — same outcome, saves **$${(amount - 44800).toLocaleString()}**\n\nReduce or proceed at current amount?`;
      }
    }
    return `I'll prepare your bid. Set your amount using the slider, then I'll analyze optimal pricing based on:\n\n- Real-time queue position (24 vessels)\n- Historical clearing prices\n- Weather & traffic forecasts\n- Your vessel's priority score`;
  }

  if (msg.includes('proceed') || msg.includes('confirm') || msg.includes('yes') || msg.includes('go ahead')) {
    return `🎯 **Bid Placed Successfully**\n\n| Detail | Value |\n|--------|-------|\n| Transit | ${context?.canalName || 'Suez Canal'} |\n| Amount | $${(context?.bidAmount || 44800).toLocaleString()} |\n| Priority | Standard |\n| Status | ⏳ Submitted |\n| Queue Position | #7 of 24 |\n| Est. Result | ~45 minutes |\n\n**Confirmation ID:** VG-2025-${Math.floor(Math.random() * 9000 + 1000)}\n\nI'm monitoring the auction. I'll alert you immediately when results are announced and recommend next steps for Port of Jeddah bidding.`;
  }

  if (msg.includes('weather') || msg.includes('adjust for weather')) {
    return `🌊 **Weather Impact Analysis — Red Sea Corridor**\n\n**Current Conditions (next 48h):**\n- Wind: 25-35 kt NNW (increasing)\n- Swell: 1.8m → 3.2m predicted\n- Visibility: Good, deteriorating Sat PM\n\n**Impact on Bidding:**\n- ↑ Weather window premium: +$2,800\n- ↑ Transit urgency: +$1,200 (delay risk)\n- ↓ Traffic reduction from diversions: -$800\n\n**Adjusted Recommendation:** Increase bid by **$3,200** to **$${((context?.bidAmount || 44800) + 3200).toLocaleString()}**\n\nThis ensures transit before the weather window closes Saturday. Delay could add 36-48h wait.\n\nApply weather adjustment?`;
  }

  if (msg.includes('adjust') || msg.includes('change') || msg.includes('lower') || msg.includes('higher')) {
    return `**Bid Optimization Tiers:**\n\n| Strategy | Amount | Win % | Risk |\n|----------|--------|-------|------|\n| Conservative | $38,500 | 42% | High — may miss window |\n| Balanced | $44,800 | 88% | Low — recommended |\n| Aggressive | $48,200 | 95% | Very Low |\n| Maximum | $55,000 | 99% | Overpaying |\n\n**AI Pick: $44,800** (Balanced)\n- Optimal cost-to-probability ratio\n- Accounts for weather & traffic factors\n- Leaves margin for Jeddah port bidding\n\nAdjust the slider and I'll re-analyze in real-time.`;
  }

  if (msg.includes('wait') || msg.includes('next window')) {
    return `📊 **Next Bidding Window Analysis**\n\nNext window: **4h 22m** from now\n\n**Projected Conditions:**\n| Factor | Current | Next Window |\n|--------|---------|-------------|\n| Traffic | 87% | ~79% (-8%) |\n| Weather | Moderate | Worsening |\n| Queue | 24 vessels | ~18 vessels |\n| Est. Clearing | $44,200 | $41,800 |\n\n**Potential savings:** $2,400\n**Risk:** Weather deterioration may force diversion (+$18k rerouting cost)\n\n⚠️ **Recommendation: Bid NOW** — weather risk outweighs savings potential. A 36h delay costs ~$52,000 in demurrage + fuel.\n\nShall I proceed with current bid?`;
  }

  if (msg.includes('analyze') || msg.includes('factors') || msg.includes('why') || msg.includes('fuel')) {
    return `📈 **Comprehensive Bid Factor Analysis**\n\n| Factor | Weight | Impact | Δ Price |\n|--------|--------|--------|--------|\n| Traffic Density | 25% | ↑ +8% | +$3,600 |\n| Seasonal Demand | 20% | ↑ +5% | +$2,200 |\n| Weather | 15% | ↑ +3% | +$1,400 |\n| Geopolitical | 10% | ↑ +4% | +$1,800 |\n| Sea Level | 10% | ↓ -2% | -$900 |\n| Priority Score | 15% | ↓ -4% | -$1,800 |\n| Fuel Index | 5% | → 0% | $0 |\n\n**Net adjustment: +14% above baseline ($39,300)**\n**AI Suggested Bid: $44,800**\n\nYour priority score (72/100) is saving you ~$1,800 vs. average vessels. Maintain compliance for continued savings.`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Welcome aboard, Captain! 🚢\n\nI'm your VoyageGuard AI assistant with real-time market intelligence. Here's your current situation:\n\n**Active Voyage:** VYG-2025-0847\n**Next Waypoint:** Suez Canal (420nm, ETA 14h 32m)\n**Bidding Status:** Window OPEN — 24 vessels queued\n\nI can help you with:\n- 🎯 **Optimal bid calculation** — AI-powered pricing\n- 🌊 **Weather impact analysis** — real-time adjustments\n- 📊 **Market intelligence** — trends & predictions\n- ⚡ **Quick execution** — one-click bid placement\n\nWhat would you like to do?`;
  }

  if (msg.includes('bid history') || msg.includes('history')) {
    return `📜 **Your Bidding Performance (Last 30 Days)**\n\n| Metric | Value |\n|--------|-------|\n| Total Bids | 12 |\n| Win Rate | 58% (7/12) |\n| Avg. Winning Bid | $44,850 |\n| Avg. Savings vs. Ceiling | $16,200 |\n| Best Win | $38,900 (Oct 8) |\n| Total Saved by AI | ~$28,400 |\n\n**Trend:** Your win rate improved 12% since enabling AI-assisted bidding.\n\n💡 **Insight:** Your Eco-priority bids have 0% win rate. Consider upgrading to Standard priority for critical transits.`;
  }

  return `I understand you're asking about "${userMessage}". Based on current intelligence:\n\n**Suez Canal Status:**\n- Queue: 24 vessels (↑3 from yesterday)\n- Avg. clearing: $44,200\n- Window closes: 6h\n- Weather: Deteriorating\n\n**Recommended Action:** Bid $44,800 now — 88% win probability.\n\nWould you like me to:\n1. Analyze specific bid factors?\n2. Calculate optimal bid amount?\n3. Review historical performance?\n4. Check weather forecast?`;
};
