import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canalsPorts, previousBids, bidFactors, probabilityData } from '@/data/mockData';
import AIChatbot from '@/components/AIChatbot';
import { Download, Zap, ChevronRight, Send, ArrowUp, ArrowDown, Minus, TrendingUp, Shield, AlertTriangle, Clock, Users, Fuel, Anchor } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';

const biddingTrends = [
  { month: 'JAN', high: 48, low: 32 },
  { month: 'FEB', high: 42, low: 35 },
  { month: 'MAR', high: 38, low: 28 },
  { month: 'APR', high: 35, low: 30 },
  { month: 'MAY', high: 30, low: 25 },
  { month: 'JUN', high: 28, low: 22 },
  { month: 'JUL', high: 32, low: 26 },
  { month: 'AUG', high: 36, low: 30 },
  { month: 'SEP', high: 40, low: 32 },
  { month: 'OCT', high: 44, low: 35 },
  { month: 'NOV', high: 50, low: 38 },
  { month: 'DEC', high: 46, low: 34 },
];

const BiddingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canal = canalsPorts.find(c => c.id === id);
  const [bidAmount, setBidAmount] = useState(45500);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 bg-card shrink-0">
        <div className="flex items-center gap-2 text-xs text-primary mb-2">
          <button onClick={() => navigate('/dashboard')} className="hover:underline font-medium">Canal Bids</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{canal.name} - Transit SC-4402</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{canal.name} Transit Bidding</h1>
            <p className="text-sm text-muted-foreground">Vessel: MV Northern Star | ETA: Oct 24, 08:00 UTC</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4" /> Auto-Bid
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - AI Chatbot (persistent) */}
        <div className="hidden lg:flex w-[30%] max-w-[380px] min-w-[320px] border-r border-border flex-col">
          <AIChatbot canalName={canal.name} bidAmount={bidAmount} />
        </div>

        {/* Center content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Harbor Logistics & Metrics - 3x2 grid */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Harbor Logistics & Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'QUEUE LENGTH', value: String(canal.queueLength), sub: 'vessels', icon: Users, accent: 'text-primary' },
                { label: 'AVG WAITING', value: '18h', sub: '+2h vs. normal', icon: Clock, accent: 'text-warning' },
                { label: 'WATER LEVEL', value: '+0.5m', sub: 'Optimal Draft', icon: TrendingUp, accent: 'text-success' },
                { label: 'DEMURRAGE', value: '$850', sub: '/hr Standard', icon: AlertTriangle, accent: 'text-muted-foreground' },
                { label: 'BID CEILING', value: `$${(canal.currentBidRange.max / 1000).toFixed(0)}k`, sub: 'Hard Limit', icon: Shield, accent: 'text-destructive' },
                { label: 'FUEL COST', value: '$12.4k', sub: 'Est. Transit Fuel', icon: Fuel, accent: 'text-primary' },
              ].map(m => (
                <div key={m.label} className="glass-panel rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                    <m.icon className={`w-3.5 h-3.5 ${m.accent}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className={`text-[10px] ${m.accent}`}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bidding Trends Chart */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">📊</span>
                <h2 className="text-base font-bold text-foreground">Bidding Trends (Last 12 Months)</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High Bids</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Low Bids</span>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biddingTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={v => `$${v}k`} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v}k`]} />
                  <Line type="monotone" dataKey="high" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="low" stroke="hsl(152, 69%, 41%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bid Impact Factors */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-base font-bold text-foreground mb-3">AI Bid Impact Factors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bidFactors.map(factor => (
                <div key={factor.name} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${factor.impact === 'up' ? 'bg-destructive/10' : factor.impact === 'down' ? 'bg-success/10' : 'bg-muted'}`}>
                    {factor.impact === 'up' ? <ArrowUp className="w-3.5 h-3.5 text-destructive" /> : factor.impact === 'down' ? <ArrowDown className="w-3.5 h-3.5 text-success" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{factor.name}</p>
                      <span className="text-[10px] text-muted-foreground">{Math.round(factor.weight * 100)}% weight</span>
                    </div>
                    <p className="text-xs text-primary font-mono mt-0.5">{factor.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Probability Chart */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-base font-bold text-foreground mb-3">Bid Success Probability</h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={probabilityData}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="bid" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis tickFormatter={v => `${v}%`} stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', fontSize: '12px' }} labelFormatter={v => `Bid: $${Number(v).toLocaleString()}`} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
                  <ReferenceLine x={bidAmount} stroke="hsl(224, 76%, 48%)" strokeWidth={2} strokeDasharray="4 4" label={{ value: `Your Bid`, position: 'top', fill: 'hsl(224, 76%, 48%)', fontSize: 10 }} />
                  <ReferenceLine x={44800} stroke="hsl(152, 69%, 41%)" strokeDasharray="4 4" label={{ value: 'AI Suggested', position: 'top', fill: 'hsl(152, 69%, 41%)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="probability" stroke="hsl(224, 76%, 48%)" fill="url(#probGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Bid History */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">Recent Bid History</h2>
              <button className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs text-muted-foreground font-semibold">Timestamp</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-semibold">Bid Amount</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-semibold">Priority</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {previousBids.map((bid, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 text-xs text-foreground">{bid.time}</td>
                    <td className="py-3 text-sm font-bold text-foreground">${bid.amount.toLocaleString()}</td>
                    <td className="py-3 text-xs text-muted-foreground">{bid.priority}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bid.result === 'Won' ? 'text-success bg-success/10' : bid.result === 'Lost' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted'}`}>
                        {bid.result === 'Lost' ? 'OUTBID' : bid.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel - Place Bid */}
        <div className="hidden lg:flex w-[280px] border-l border-border flex-col bg-card">
          <div className="p-5 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground text-center mb-4">Place Live Bid</h2>

            {/* Urgency gauge */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-28 h-14 overflow-hidden">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="hsl(220, 13%, 90%)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke={urgencyPercent > 70 ? 'hsl(0, 72%, 51%)' : urgencyPercent > 40 ? 'hsl(38, 92%, 50%)' : 'hsl(152, 69%, 41%)'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${urgencyPercent * 1.26} 126`} />
                </svg>
                <div className="absolute inset-x-0 -bottom-1 text-center">
                  <span className={`text-[9px] font-bold uppercase ${urgencyPercent > 70 ? 'text-destructive' : urgencyPercent > 40 ? 'text-warning' : 'text-success'}`}>
                    {urgencyPercent > 70 ? 'HIGH' : urgencyPercent > 40 ? 'MEDIUM' : 'LOW'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-destructive font-bold uppercase mt-1">Urgency</span>
            </div>

            <div className="text-center mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bid Amount</p>
              <p className="text-4xl font-bold text-foreground tracking-tight">${bidAmount.toLocaleString()}</p>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min={canal.currentBidRange.min}
                max={canal.currentBidRange.max}
                step={500}
                value={bidAmount}
                onChange={e => setBidAmount(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">${(canal.currentBidRange.min / 1000).toFixed(0)}k</span>
                <span className="text-[10px] text-muted-foreground">${(canal.currentBidRange.max / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-2 mb-4">
              <div className="glass-panel rounded-lg p-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Winning Trend</span>
                <span className="text-sm font-bold text-foreground flex items-center gap-1">Upward <TrendingUp className="w-3.5 h-3.5 text-destructive" /></span>
              </div>
              <div className={`rounded-lg p-3 flex items-center gap-2 border-2 ${feedback.color === 'text-success' ? 'border-success/20 bg-success/5' : feedback.color === 'text-destructive' ? 'border-destructive/20 bg-destructive/5' : 'border-warning/20 bg-warning/5'}`}>
                <span>
                  {feedback.color === 'text-success' ? '✅' : feedback.color === 'text-destructive' ? '⚠️' : '💰'}
                </span>
                <div>
                  <p className={`text-sm font-bold ${feedback.color}`}>{feedback.text}</p>
                  <p className="text-[10px] text-muted-foreground">{feedback.percent}% chance of winning this slot.</p>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
              Submit Bid <Send className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Reviewed by AI before final placement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingDetail;
