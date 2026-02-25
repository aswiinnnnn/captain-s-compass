import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canalsPorts, previousBids, bidFactors, probabilityData } from '@/data/mockData';
import AIChatbot from '@/components/AIChatbot';
import { ArrowLeft, ArrowUp, ArrowDown, Minus, Anchor, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

const BiddingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canal = canalsPorts.find(c => c.id === id);
  const [bidAmount, setBidAmount] = useState(275000);

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) navigate('/');
  }, [navigate]);

  if (!canal) {
    navigate('/dashboard');
    return null;
  }

  const getBidFeedback = () => {
    if (bidAmount < 250000) return { text: 'Low chance', color: 'text-destructive', bg: 'bg-destructive/10 glow-danger' };
    if (bidAmount <= 290000) return { text: 'Optimal', color: 'text-success', bg: 'bg-success/10 glow-success' };
    return { text: 'High cost', color: 'text-warning', bg: 'bg-warning/10 glow-warning' };
  };

  const feedback = getBidFeedback();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Anchor className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">{canal.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{canal.type}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left content */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-4 space-y-4">
          {/* Overview */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-2">Overview</h2>
            <p className="text-sm text-muted-foreground mb-3">{canal.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rules</p>
                <ul className="space-y-1">
                  {canal.rules.map((r, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Historical Congestion</p>
                <p className="text-xs text-foreground">{canal.historicalCongestion}</p>
              </div>
            </div>
          </div>

          {/* Previous Bids */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-3">Previous Bids</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Time</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Bid Amount</th>
                    <th className="text-center py-2 text-xs text-muted-foreground font-medium">Result</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Clearing Price</th>
                  </tr>
                </thead>
                <tbody>
                  {previousBids.map((bid, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-xs text-foreground font-mono">{bid.time}</td>
                      <td className="py-2 text-xs text-right text-foreground font-mono">${bid.amount.toLocaleString()}</td>
                      <td className="py-2 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${bid.result === 'Won' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {bid.result}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-right text-muted-foreground font-mono">${bid.clearingPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bid Impact Factors */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-3">Bid Impact Factors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bidFactors.map(factor => (
                <div key={factor.name} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground">{factor.name}</p>
                    {factor.impact === 'up' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-destructive" />
                    ) : factor.impact === 'down' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-primary font-mono mb-1">{factor.value}</p>
                  <p className="text-[10px] text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-3">Bid Success Probability</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={probabilityData}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(190, 80%, 45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(190, 80%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 20%, 18%)" />
                  <XAxis
                    dataKey="bid"
                    tickFormatter={v => `$${(v / 1000)}k`}
                    stroke="hsl(215, 15%, 55%)"
                    fontSize={11}
                  />
                  <YAxis
                    tickFormatter={v => `${v}%`}
                    stroke="hsl(215, 15%, 55%)"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(216, 25%, 11%)', border: '1px solid hsl(216, 20%, 20%)', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={v => `Bid: $${Number(v).toLocaleString()}`}
                    formatter={(v: number) => [`${v}%`, 'Success Rate']}
                  />
                  <ReferenceArea x1={200000} x2={250000} fill="hsl(0, 72%, 51%)" fillOpacity={0.05} label={{ value: 'Risky', position: 'insideTop', fill: 'hsl(0, 72%, 51%)', fontSize: 10 }} />
                  <ReferenceArea x1={260000} x2={290000} fill="hsl(152, 69%, 41%)" fillOpacity={0.05} label={{ value: 'Best Range', position: 'insideTop', fill: 'hsl(152, 69%, 41%)', fontSize: 10 }} />
                  <ReferenceArea x1={300000} x2={340000} fill="hsl(38, 92%, 50%)" fillOpacity={0.05} label={{ value: 'Overpay', position: 'insideTop', fill: 'hsl(38, 92%, 50%)', fontSize: 10 }} />
                  <ReferenceLine x={275000} stroke="hsl(190, 80%, 45%)" strokeDasharray="4 4" label={{ value: 'AI Suggested', position: 'top', fill: 'hsl(190, 80%, 45%)', fontSize: 10 }} />
                  <ReferenceLine x={bidAmount} stroke="hsl(210, 40%, 93%)" strokeWidth={2} label={{ value: 'Your Bid', position: 'top', fill: 'hsl(210, 40%, 93%)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="probability" stroke="hsl(190, 80%, 45%)" fill="url(#probGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bid Slider */}
          <div className="glass-panel rounded-xl p-5 glow-primary">
            <h2 className="text-lg font-bold text-foreground mb-4">Place Your Bid</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">$200,000</span>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${feedback.bg} ${feedback.color}`}>
                  {feedback.text}
                </div>
                <span className="text-xs text-muted-foreground">$340,000</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={200000}
                  max={340000}
                  step={5000}
                  value={bidAmount}
                  onChange={e => setBidAmount(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                />
                {/* AI suggested marker */}
                <div
                  className="absolute top-0 h-2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${((275000 - 200000) / (340000 - 200000)) * 100}%` }}
                >
                  <div className="w-0.5 h-4 bg-primary opacity-60" />
                  <span className="text-[9px] text-primary mt-0.5 whitespace-nowrap">AI: $275k</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground font-mono">${bidAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Your bid amount</p>
              </div>
              <button
                onClick={() => {
                  // This sends intent to chatbot - scroll chat panel
                  const el = document.querySelector('[data-chatbot-input]') as HTMLInputElement;
                  if (el) {
                    el.value = `Place bid for $${bidAmount.toLocaleString()} on ${canal.name}`;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Send Bid to AI Assistant →
              </button>
              <p className="text-[10px] text-muted-foreground text-center">Bid will be reviewed by AI assistant before placement</p>
            </div>
          </div>
        </div>

        {/* Right panel - Chatbot */}
        <div className="hidden lg:block w-[30%] max-w-[400px] border-l border-border p-4">
          <AIChatbot canalName={canal.name} bidAmount={bidAmount} />
        </div>
      </div>
    </div>
  );
};

export default BiddingDetail;
