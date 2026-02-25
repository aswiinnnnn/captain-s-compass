import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canalsPorts, previousBids, bidFactors, probabilityData } from '@/data/mockData';
import AIChatbot from '@/components/AIChatbot';
import { useChatContext } from '@/contexts/ChatContext';
import { Download, Zap, ChevronRight, Send, ArrowUp, ArrowDown, Minus, TrendingUp, Shield, AlertTriangle, Clock, Users, Fuel, Anchor, Bot, Plus, MinusIcon, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, ReferenceArea, Brush } from 'recharts';

const AI_SUGGESTED_BID = 44800;

// Daily data with predictions
const generateDailyData = () => {
  const data: any[] = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Past data - daily
  const baseHigh = [48,46,44,42,40,38,36,35,34,32,30,28,28,30,32,34,36,38,36,38,40,42,44,46,48,50,48,46,44,42];
  const baseLow = [32,30,29,28,27,26,25,24,23,22,21,20,22,24,26,28,30,32,30,28,30,32,34,36,38,40,38,36,34,32];
  
  for (let i = 0; i < 30; i++) {
    const month = months[Math.floor(i / 2.5) % 12];
    const day = (i % 28) + 1;
    data.push({
      label: `${month} ${day}`,
      day: i + 1,
      high: baseHigh[i] + (Math.random() * 3 - 1.5),
      low: baseLow[i] + (Math.random() * 2 - 1),
      predicted: false,
    });
  }

  // Future predictions - statistical
  const lastHigh = data[data.length - 1].high;
  const lastLow = data[data.length - 1].low;
  for (let i = 0; i < 15; i++) {
    const drift = Math.sin(i * 0.4) * 3;
    data.push({
      label: `Nov ${i + 1}*`,
      day: 31 + i,
      high: +(lastHigh + drift + Math.random() * 2).toFixed(1),
      low: +(lastLow + drift * 0.7 + Math.random() * 1.5).toFixed(1),
      statHigh: +(lastHigh + drift * 0.8 + i * 0.3).toFixed(1),
      statLow: +(lastLow + drift * 0.5 + i * 0.2).toFixed(1),
      aiHigh: +(lastHigh + drift * 1.1 + Math.random() * 1).toFixed(1),
      aiLow: +(lastLow + drift * 0.9 + Math.random() * 0.8).toFixed(1),
      predicted: true,
    });
  }
  return data;
};

type PredictionModel = 'ai' | 'stochastic' | 'moving_avg';

const BiddingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canal = canalsPorts.find(c => c.id === id);
  const [bidAmount, setBidAmount] = useState(45500);
  const { sendMessage } = useChatContext();
  const [bidPlaced, setBidPlaced] = useState(false);
  const [placedAmount, setPlacedAmount] = useState(0);
  const [predictionModel, setPredictionModel] = useState<PredictionModel>('ai');
  const [dailyData] = useState(generateDailyData);

  // Auction deadline countdown
  const [deadline, setDeadline] = useState(6 * 3600 + 1423); // 6h 23m 43s
  useEffect(() => {
    const t = setInterval(() => setDeadline(d => Math.max(0, d - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtDeadline = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m.toString().padStart(2,'0')}m ${sec.toString().padStart(2,'0')}s`;
  };

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) navigate('/');
  }, [navigate]);

  if (!canal) {
    navigate('/dashboard');
    return null;
  }

  const getBidFeedback = () => {
    if (bidAmount < 40000) return { text: 'Low Chance', color: 'text-destructive', percent: Math.round((bidAmount / 60000) * 65) };
    if (bidAmount <= 50000) return { text: 'Optimal Range', color: 'text-success', percent: Math.round(68 + ((bidAmount - 40000) / 10000) * 24) };
    return { text: 'High Cost', color: 'text-warning', percent: Math.min(99, Math.round(92 + ((bidAmount - 50000) / 10000) * 7)) };
  };

  const feedback = getBidFeedback();
  const urgencyPercent = Math.min(100, Math.round((bidAmount / 60000) * 100));
  const aiSuggestedPercent = ((AI_SUGGESTED_BID - canal.currentBidRange.min) / (canal.currentBidRange.max - canal.currentBidRange.min)) * 100;

  const handleAskAI = () => {
    sendMessage(`Should I bid $${bidAmount.toLocaleString()} for ${canal.name} transit? Analyze this amount and tell me if it's a good strategy.`, { canalName: canal.name, bidAmount });
  };

  const handleSubmitBid = () => {
    setBidPlaced(true);
    setPlacedAmount(bidAmount);
    sendMessage(`I just placed a bid of $${bidAmount.toLocaleString()} for ${canal.name}. Waiting for auction result.`, { canalName: canal.name, bidAmount });
  };

  const handleModifyBid = () => {
    setBidPlaced(false);
  };

  const handleBidFromChart = (value: number) => {
    setBidAmount(Math.round(value * 1000));
    setBidPlaced(false);
  };

  // Get prediction lines based on model
  const getHighKey = () => predictionModel === 'stochastic' ? 'statHigh' : predictionModel === 'ai' ? 'aiHigh' : 'high';
  const getLowKey = () => predictionModel === 'stochastic' ? 'statLow' : predictionModel === 'ai' ? 'aiLow' : 'low';

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!payload.predicted) return <circle cx={cx} cy={cy} r={2.5} fill="hsl(220, 10%, 55%)" />;
    const val = payload[dataKey];
    return (
      <g className="cursor-pointer" onClick={() => handleBidFromChart(val)}>
        <circle cx={cx} cy={cy} r={5} fill="hsl(224, 76%, 48%)" stroke="white" strokeWidth={2} />
      </g>
    );
  };

  // Future area starts at first predicted point
  const futureStartIdx = dailyData.findIndex(d => d.predicted);
  const futureStartLabel = futureStartIdx >= 0 ? dailyData[futureStartIdx].label : '';
  const futureEndLabel = dailyData[dailyData.length - 1].label;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 bg-card shrink-0">
        <div className="flex items-center gap-2 text-xs text-primary mb-1">
          <button onClick={() => navigate('/dashboard')} className="hover:underline font-medium">Canal Bids</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{canal.name} - Transit SC-4402</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{canal.name} Transit Bidding</h1>
            <p className="text-xs text-muted-foreground">Vessel: MV Northern Star | ETA: Oct 24, 08:00 UTC</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auction Deadline */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Timer className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-bold text-destructive font-mono">{fmtDeadline(deadline)}</span>
              <span className="text-[9px] text-destructive/70 uppercase">Auction Closes</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" /> Report
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
              <Zap className="w-3.5 h-3.5" /> Auto-Bid
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* LEFT - Scrollable analytics */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {/* Bidding Trends Chart */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">📊</span>
                <h2 className="text-sm font-bold text-foreground">Bidding Trends & Predictions</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Model selector */}
                {(['ai', 'stochastic', 'moving_avg'] as PredictionModel[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setPredictionModel(m)}
                    className={`text-[9px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      predictionModel === m
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'ai' ? '🤖 AI Model' : m === 'stochastic' ? '📈 Stochastic' : '📉 Moving Avg'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High Bids</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Low Bids</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary opacity-50" style={{borderTop:'2px dashed hsl(224, 76%, 48%)'}}/> Predicted</span>
              {predictionModel === 'ai' && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/40" /> AI Forecast</span>}
              <span className="text-muted-foreground ml-auto">🖱 Scroll to zoom • Drag to pan • Click predicted dots to bid</span>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="futureShade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="label" stroke="hsl(220, 10%, 55%)" fontSize={9} interval="preserveStartEnd" tickCount={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={v => `$${v}k`} domain={[15, 60]} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: number, name: string) => [`$${Number(v).toFixed(1)}k`, name === 'high' ? 'High' : name === 'low' ? 'Low' : name]}
                    labelFormatter={(label: string) => label.includes('*') ? `${label} (Predicted)` : label}
                  />
                  {/* Future shaded area */}
                  {futureStartLabel && (
                    <ReferenceArea x1={futureStartLabel} x2={futureEndLabel} fill="url(#futureShade)" />
                  )}
                  <ReferenceLine x={futureStartLabel} stroke="hsl(224, 76%, 48%)" strokeWidth={1.5} strokeDasharray="6 4" label={{ value: '← Historical | Predicted →', position: 'top', fill: 'hsl(220, 10%, 55%)', fontSize: 9 }} />
                  
                  {/* Past lines - solid */}
                  <Line type="monotone" dataKey="high" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={<CustomDot />} connectNulls />
                  <Line type="monotone" dataKey="low" stroke="hsl(152, 69%, 41%)" strokeWidth={2} dot={<CustomDot />} connectNulls />
                  
                  {/* AI prediction lines - dashed, different color */}
                  {predictionModel === 'ai' && (
                    <>
                      <Line type="monotone" dataKey="aiHigh" stroke="hsl(262, 83%, 58%)" strokeWidth={2} strokeDasharray="6 3" dot={<CustomDot />} connectNulls />
                      <Line type="monotone" dataKey="aiLow" stroke="hsl(262, 60%, 65%)" strokeWidth={2} strokeDasharray="6 3" dot={<CustomDot />} connectNulls />
                    </>
                  )}
                  {predictionModel === 'stochastic' && (
                    <>
                      <Line type="monotone" dataKey="statHigh" stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="6 3" dot={<CustomDot />} connectNulls />
                      <Line type="monotone" dataKey="statLow" stroke="hsl(38, 70%, 60%)" strokeWidth={2} strokeDasharray="6 3" dot={<CustomDot />} connectNulls />
                    </>
                  )}
                  
                  <Brush dataKey="label" height={20} stroke="hsl(224, 76%, 48%)" fill="hsl(220, 14%, 96%)" travellerWidth={8} startIndex={20} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-2">
                <button onClick={() => handleBidFromChart(Math.max(canal.currentBidRange.min / 1000, bidAmount / 1000 - 1))} className="px-2 py-1 rounded-md bg-success/10 border border-success/30 text-success text-[10px] font-bold hover:bg-success/20 transition-colors">
                  🟢 BUY (Lower)
                </button>
                <span className="text-xs font-bold text-foreground font-mono">${(bidAmount / 1000).toFixed(1)}k</span>
                <button onClick={() => handleBidFromChart(Math.min(canal.currentBidRange.max / 1000, bidAmount / 1000 + 1))} className="px-2 py-1 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-bold hover:bg-destructive/20 transition-colors">
                  🔴 SELL (Higher)
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground">Click dots on predicted line to set bid value</p>
            </div>
          </div>

          {/* Bid Success Probability */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-foreground mb-2">Bid Success Probability</h2>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={probabilityData}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="bid" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} stroke="hsl(220, 10%, 55%)" fontSize={10} />
                  <YAxis tickFormatter={v => `${v}%`} stroke="hsl(220, 10%, 55%)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', fontSize: '11px' }} labelFormatter={v => `Bid: $${Number(v).toLocaleString()}`} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
                  <ReferenceLine x={bidAmount} stroke="hsl(224, 76%, 48%)" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Your Bid', position: 'top', fill: 'hsl(224, 76%, 48%)', fontSize: 9 }} />
                  <ReferenceLine x={AI_SUGGESTED_BID} stroke="hsl(152, 69%, 41%)" strokeDasharray="4 4" label={{ value: 'AI Suggested', position: 'top', fill: 'hsl(152, 69%, 41%)', fontSize: 9 }} />
                  <Area type="monotone" dataKey="probability" stroke="hsl(224, 76%, 48%)" fill="url(#probGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Harbor Logistics & Metrics */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Harbor Logistics & Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'QUEUE LENGTH', value: String(canal.queueLength), sub: 'vessels', icon: Users, accent: 'text-primary' },
                { label: 'AVG WAITING', value: '18h', sub: '+2h vs. normal', icon: Clock, accent: 'text-warning' },
                { label: 'WATER LEVEL', value: '+0.5m', sub: 'Optimal Draft', icon: TrendingUp, accent: 'text-success' },
                { label: 'DEMURRAGE', value: '$850', sub: '/hr Standard', icon: AlertTriangle, accent: 'text-muted-foreground' },
                { label: 'BID CEILING', value: `$${(canal.currentBidRange.max / 1000).toFixed(0)}k`, sub: 'Hard Limit', icon: Shield, accent: 'text-destructive' },
                { label: 'FUEL COST', value: '$12.4k', sub: 'Est. Transit Fuel', icon: Fuel, accent: 'text-primary' },
              ].map(m => (
                <div key={m.label} className="glass-panel rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                    <m.icon className={`w-3 h-3 ${m.accent}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className={`text-[9px] ${m.accent}`}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bid Impact Factors */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-foreground mb-2">AI Bid Impact Factors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bidFactors.map(factor => (
                <div key={factor.name} className="flex items-start gap-2.5 p-2.5 bg-muted rounded-lg">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${factor.impact === 'up' ? 'bg-destructive/10' : factor.impact === 'down' ? 'bg-success/10' : 'bg-muted'}`}>
                    {factor.impact === 'up' ? <ArrowUp className="w-3 h-3 text-destructive" /> : factor.impact === 'down' ? <ArrowDown className="w-3 h-3 text-success" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-foreground">{factor.name}</p>
                      <span className="text-[9px] text-muted-foreground">{Math.round(factor.weight * 100)}%</span>
                    </div>
                    <p className="text-[11px] text-primary font-mono mt-0.5">{factor.value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bid History */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground">Recent Bid History</h2>
              <button className="text-[10px] text-primary font-medium hover:underline">View All</button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-semibold">Timestamp</th>
                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-semibold">Bid Amount</th>
                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-semibold">Priority</th>
                  <th className="text-right py-1.5 text-[10px] text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {previousBids.map((bid, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-2 text-[11px] text-foreground">{bid.time}</td>
                    <td className="py-2 text-xs font-bold text-foreground">${bid.amount.toLocaleString()}</td>
                    <td className="py-2 text-[11px] text-muted-foreground">{bid.priority}</td>
                    <td className="py-2 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${bid.result === 'Won' ? 'text-success bg-success/10' : bid.result === 'Lost' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted'}`}>
                        {bid.result === 'Lost' ? 'OUTBID' : bid.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT panel - Fixed: AI + Bid Placement */}
        <div className="hidden lg:flex w-[340px] border-l border-border flex-col h-full overflow-hidden shrink-0 bg-card">
          {/* Place Bid section - top */}
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground">Place Live Bid</h2>
              <div className="flex items-center gap-1 text-[9px] text-destructive font-bold">
                <Timer className="w-3 h-3" />
                {fmtDeadline(deadline)}
              </div>
            </div>

            {bidPlaced ? (
              /* Bid placed confirmation */
              <div className="space-y-3">
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Bid Submitted</p>
                  <p className="text-2xl font-bold text-foreground">${placedAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">⏳ Waiting for auction result...</p>
                  <p className="text-[9px] text-muted-foreground">Queue Position: #7 of 24</p>
                </div>
                <button onClick={handleModifyBid} className="w-full py-2 border-2 border-warning/30 text-warning font-semibold rounded-lg hover:bg-warning/5 transition-colors text-xs">
                  Modify Bid & Resubmit
                </button>
              </div>
            ) : (
              /* Bid slider + submit */
              <div className="space-y-3">
                {/* Urgency gauge mini */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-8 overflow-hidden shrink-0">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke={urgencyPercent > 70 ? 'hsl(var(--destructive))' : urgencyPercent > 40 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--success))'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${urgencyPercent * 1.26} 126`} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">${bidAmount.toLocaleString()}</p>
                    <p className={`text-[9px] font-bold uppercase ${feedback.color}`}>{feedback.text} — {feedback.percent}% win</p>
                  </div>
                </div>

                {/* Gradient slider */}
                <div className="relative">
                  {/* AI marker on track */}
                  <div className="relative h-5 mb-0.5">
                    <div className="absolute -translate-x-1/2 flex flex-col items-center z-10" style={{ left: `${aiSuggestedPercent}%` }}>
                      <div className="bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-md">
                        AI: ${(AI_SUGGESTED_BID / 1000).toFixed(1)}k
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-primary" />
                    </div>
                  </div>
                  {/* Gradient track */}
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, hsl(152, 69%, 41%), hsl(60, 70%, 50%), hsl(38, 92%, 50%), hsl(0, 72%, 51%))' }}>
                    {/* AI suggested marker on bar */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground/80 z-10" style={{ left: `${aiSuggestedPercent}%` }}>
                      <div className="absolute -top-0.5 -bottom-0.5 -left-1 w-2.5 border-2 border-primary-foreground rounded-sm opacity-80" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={canal.currentBidRange.min}
                    max={canal.currentBidRange.max}
                    step={500}
                    value={bidAmount}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer z-20"
                    style={{ top: '24px' }}
                  />
                  {/* Thumb indicator */}
                  <div className="absolute h-5 w-5 rounded-full bg-foreground border-2 border-background shadow-lg z-10 -translate-x-1/2 pointer-events-none" style={{ left: `${((bidAmount - canal.currentBidRange.min) / (canal.currentBidRange.max - canal.currentBidRange.min)) * 100}%`, top: '20px' }} />
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-success font-bold">${(canal.currentBidRange.min / 1000).toFixed(0)}k</span>
                    <span className="text-[10px] text-destructive font-bold">${(canal.currentBidRange.max / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                {/* Submit + Ask AI */}
                <button onClick={handleSubmitBid} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                  Submit Bid <Send className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleAskAI} className="w-full py-2 border-2 border-primary/30 text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors text-xs flex items-center justify-center gap-2">
                  <Bot className="w-3.5 h-3.5" /> Ask AI About ${(bidAmount/1000).toFixed(1)}k
                </button>
              </div>
            )}
          </div>

          {/* AI Chatbot - fills remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AIChatbot canalName={canal.name} bidAmount={bidAmount} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingDetail;
