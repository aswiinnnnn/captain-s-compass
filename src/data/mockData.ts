export interface Captain {
  id: string;
  name: string;
  email: string;
  password: string;
  shipName: string;
  shipType: string;
  cargoType: string;
  currentSpeed: string;
  position: { x: number; y: number };
  eta: string;
}

export interface CanalPort {
  id: string;
  name: string;
  type: 'canal' | 'port';
  description: string;
  distance: string;
  eta: string;
  requiresBidding: boolean;
  requiresBooking: boolean;
  congestionStatus: 'Low' | 'Medium' | 'High';
  weatherRisk: 'Low' | 'Medium' | 'High';
  rules: string[];
  historicalCongestion: string;
  position: { x: number; y: number };
}

export interface PreviousBid {
  time: string;
  amount: number;
  result: 'Won' | 'Lost';
  clearingPrice: number;
}

export interface BidFactor {
  name: string;
  value: string;
  impact: 'up' | 'down' | 'neutral';
  description: string;
}

export const captains: Captain[] = [
  {
    id: 'captain-a',
    name: 'Capt. James Harlow',
    email: 'captain.a@voyageguard.com',
    password: 'demo123',
    shipName: 'MV Pacific Horizon',
    shipType: 'Container Ship',
    cargoType: 'Mixed Containers (TEU: 4,200)',
    currentSpeed: '18.5 knots',
    position: { x: 38, y: 42 },
    eta: '14h 32m',
  },
  {
    id: 'captain-b',
    name: 'Capt. Elena Vasquez',
    email: 'captain.b@voyageguard.com',
    password: 'demo123',
    shipName: 'MT Crimson Tide',
    shipType: 'Oil Tanker',
    cargoType: 'Crude Oil (DWT: 120,000)',
    currentSpeed: '14.2 knots',
    position: { x: 55, y: 35 },
    eta: '22h 15m',
  },
];

export const canalsPorts: CanalPort[] = [
  {
    id: 'suez',
    name: 'Suez Canal',
    type: 'canal',
    description: 'The Suez Canal is a sea-level waterway connecting the Mediterranean Sea to the Red Sea through the Isthmus of Suez. It is one of the world\'s most heavily used shipping lanes.',
    distance: '342 nm',
    eta: '14h 32m',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'High',
    weatherRisk: 'Low',
    rules: ['Bidding window: 6h before arrival', 'Priority: Tankers > Container > Bulk', 'Min transit gap: 15 min'],
    historicalCongestion: 'Average wait time increased 40% in Q4 due to seasonal surge. Peak hours: 0600-1200 UTC.',
    position: { x: 55, y: 42 },
  },
  {
    id: 'singapore',
    name: 'Port of Singapore',
    type: 'port',
    description: 'One of the busiest ports in the world by shipping tonnage. Major transshipment hub in Southeast Asia.',
    distance: '1,240 nm',
    eta: '3d 8h',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'Medium',
    weatherRisk: 'Medium',
    rules: ['Bidding window: 12h before arrival', 'Berth allocation based on bid rank', 'Priority surcharge for hazmat'],
    historicalCongestion: 'Steady throughput. Minor delays during monsoon season (Jun-Sep).',
    position: { x: 72, y: 52 },
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    type: 'canal',
    description: 'The Panama Canal is an artificial waterway connecting the Atlantic and Pacific oceans, cutting through the Isthmus of Panama.',
    distance: '4,800 nm',
    eta: '11d 4h',
    requiresBidding: true,
    requiresBooking: true,
    congestionStatus: 'Low',
    weatherRisk: 'Low',
    rules: ['Auction-based slot allocation', 'Max beam: 51.25m (Neopanamax)', 'Booking 96h in advance'],
    historicalCongestion: 'Water level restrictions eased. Current throughput at 85% capacity.',
    position: { x: 22, y: 50 },
  },
  {
    id: 'rotterdam',
    name: 'Port of Rotterdam',
    type: 'port',
    description: 'Europe\'s largest port and a major logistics hub. Automated terminal operations with AI-driven berth scheduling.',
    distance: '2,100 nm',
    eta: '5d 16h',
    requiresBidding: false,
    requiresBooking: true,
    congestionStatus: 'Low',
    weatherRisk: 'Medium',
    rules: ['Pre-booking required 48h before arrival', 'Automated berth assignment', 'Green corridor discount available'],
    historicalCongestion: 'Efficient operations. Storm-related delays in winter months.',
    position: { x: 48, y: 28 },
  },
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    type: 'canal',
    description: 'A strait between the Persian Gulf and the Gulf of Oman. Critical chokepoint for global oil trade.',
    distance: '890 nm',
    eta: '2d 2h',
    requiresBidding: true,
    requiresBooking: false,
    congestionStatus: 'High',
    weatherRisk: 'High',
    rules: ['Traffic Separation Scheme in effect', 'Convoy system for large vessels', 'Security clearance required'],
    historicalCongestion: 'Geopolitical tensions cause periodic delays. Average transit time increased 25%.',
    position: { x: 62, y: 43 },
  },
];

export const previousBids: PreviousBid[] = [
  { time: '2025-02-24 14:30 UTC', amount: 285000, result: 'Won', clearingPrice: 272000 },
  { time: '2025-02-23 08:15 UTC', amount: 245000, result: 'Lost', clearingPrice: 268000 },
  { time: '2025-02-22 16:45 UTC', amount: 310000, result: 'Won', clearingPrice: 295000 },
  { time: '2025-02-21 11:00 UTC', amount: 220000, result: 'Lost', clearingPrice: 255000 },
  { time: '2025-02-20 09:30 UTC', amount: 275000, result: 'Won', clearingPrice: 260000 },
];

export const bidFactors: BidFactor[] = [
  { name: 'Weather Conditions', value: 'Moderate winds, 1.2m swell', impact: 'up', description: 'Slight weather deterioration increases transit demand' },
  { name: 'Sea Level', value: '+0.3m above mean', impact: 'down', description: 'Higher water levels improve canal capacity' },
  { name: 'Traffic Density', value: '87% capacity', impact: 'up', description: 'High traffic increases competition for slots' },
  { name: 'Seasonal Demand', value: 'Peak season (Q1)', impact: 'up', description: 'Q1 demand surge from post-holiday restocking' },
  { name: 'Ship Priority Score', value: '72 / 100', impact: 'down', description: 'Good compliance history lowers required bid' },
  { name: 'Fuel Cost Index', value: '$612/mt', impact: 'neutral', description: 'Stable fuel costs — no significant impact' },
];

export const probabilityData = [
  { bid: 200000, probability: 5 },
  { bid: 220000, probability: 12 },
  { bid: 240000, probability: 28 },
  { bid: 250000, probability: 42 },
  { bid: 260000, probability: 58 },
  { bid: 270000, probability: 72 },
  { bid: 280000, probability: 85 },
  { bid: 290000, probability: 92 },
  { bid: 300000, probability: 96 },
  { bid: 320000, probability: 98 },
  { bid: 340000, probability: 99 },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const getAIResponse = (userMessage: string, context?: { canalName?: string; bidAmount?: number }): string => {
  const msg = userMessage.toLowerCase();

  if (msg.includes('bid now') || msg.includes('place bid') || msg.includes('submit bid')) {
    if (context?.bidAmount) {
      const amount = context.bidAmount;
      if (amount < 260000) {
        return `⚠️ **Risk Assessment: High**\n\nYour bid of **$${amount.toLocaleString()}** for ${context?.canalName || 'this transit'} is below the recommended range.\n\n**Key Factors:**\n- Current traffic density: 87% capacity\n- Historical clearing price: ~$268,000\n- Your bid is ${Math.round((1 - amount / 268000) * 100)}% below average\n\n🔴 **Probability of success: ~${Math.round((amount / 340000) * 100)}%**\n\nI recommend increasing to at least **$270,000** for a reasonable chance. Shall I adjust?`;
      } else if (amount <= 290000) {
        return `✅ **Bid Analysis Complete**\n\nYour bid of **$${amount.toLocaleString()}** for ${context?.canalName || 'this transit'} looks optimal.\n\n**Assessment:**\n- Within competitive range ✓\n- Above historical clearing average ✓\n- Weather factor accounted for ✓\n- Ship priority score applied (72/100) ✓\n\n🟢 **Probability of success: ~${Math.min(95, Math.round((amount / 290000) * 85))}%**\n\nShall I proceed with placing this bid?`;
      } else {
        return `💰 **Overpay Warning**\n\nYour bid of **$${amount.toLocaleString()}** exceeds the optimal range.\n\n**Analysis:**\n- You're bidding ${Math.round((amount / 270000 - 1) * 100)}% above the suggested price\n- Success probability is already >95% at $290,000\n- Potential savings: **$${(amount - 275000).toLocaleString()}**\n\n🟡 I'd recommend **$275,000** — same success rate, better value.\n\nWould you like me to adjust, or proceed with $${amount.toLocaleString()}?`;
      }
    }
    return `I'll prepare your bid. Please set your bid amount using the slider, then confirm with me. I'll analyze the optimal price based on current conditions.`;
  }

  if (msg.includes('proceed') || msg.includes('confirm') || msg.includes('yes') || msg.includes('go ahead')) {
    return `🎯 **Bid Placed Successfully**\n\n- **Transit:** ${context?.canalName || 'Suez Canal'}\n- **Amount:** $${(context?.bidAmount || 275000).toLocaleString()}\n- **Status:** Submitted\n- **Estimated Result:** Within 45 minutes\n\nI'll notify you when the auction results are announced. Your confirmation ID is **VG-2025-${Math.floor(Math.random() * 9000 + 1000)}**.`;
  }

  if (msg.includes('adjust') || msg.includes('change') || msg.includes('lower') || msg.includes('higher')) {
    return `I can help adjust your bid. Based on current market conditions:\n\n- **Conservative:** $255,000 (60% success)\n- **Optimal:** $275,000 (88% success)\n- **Aggressive:** $295,000 (96% success)\n\nUse the bid slider to set your preferred amount, and I'll re-analyze.`;
  }

  if (msg.includes('wait') || msg.includes('next window')) {
    return `📊 **Next Bidding Window Analysis**\n\nThe next window opens in **4h 22m**.\n\n**Projected conditions:**\n- Traffic may decrease by ~8% (off-peak hours)\n- Weather improving (winds calming)\n- Estimated clearing price: **$258,000** (-4%)\n\nWaiting could save approximately **$12,000-18,000**. However, your ETA window is tight.\n\n⏱️ Risk: Delay could push your arrival into the next convoy cycle (+6h wait).\n\nShall I set a reminder for the next window?`;
  }

  if (msg.includes('analyze') || msg.includes('factors') || msg.includes('why')) {
    return `📈 **Current Bid Factor Analysis**\n\n| Factor | Impact | Detail |\n|--------|--------|--------|\n| Weather | ↑ +3% | Moderate winds increase demand |\n| Traffic | ↑ +8% | 87% capacity — competitive |\n| Season | ↑ +5% | Q1 peak restocking |\n| Sea Level | ↓ -2% | Good water levels |\n| Priority | ↓ -4% | Your compliance score helps |\n\n**Net impact: +10% above baseline**\n\nSuggested bid: **$275,000** (baseline $250,000 + adjustments)`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Welcome aboard, Captain! 🚢\n\nI'm your VoyageGuard AI assistant. I can help you with:\n\n- **Bid analysis** — optimal pricing for canal/port transit\n- **Risk assessment** — weather, traffic, and market factors\n- **Bid execution** — place, adjust, or schedule bids\n- **Market insights** — historical trends and predictions\n\nWhat would you like to do?`;
  }

  return `I understand you're asking about "${userMessage}". Let me help with that.\n\nBased on current conditions for your upcoming transit:\n- **Suggested bid range:** $260,000 - $290,000\n- **Market sentiment:** Competitive\n- **Risk level:** Moderate\n\nWould you like me to analyze specific factors, or shall we proceed with bidding?`;
};
