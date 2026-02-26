import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canalsPorts, previousBids, bidFactors } from '@/data/mockData';
import AIChatbot from '@/components/AIChatbot';
import NavTab from '@/components/NavTab';
import { Download, Zap, ChevronRight, ArrowUp, ArrowDown, Minus, TrendingUp, AlertTriangle, Clock, Users, Anchor, Timer, TriangleAlert, DollarSign, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';



// Daily data with predictions
const generateDailyData = () => {
  const data: any[] = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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

  const lastHigh = data[data.length - 1].high;
  const lastLow = data[data.length - 1].low;
  for (let i = 0; i < 15; i++) {
    const drift = Math.sin(i * 0.4) * 3;
    data.push({
      label: `Nov ${i + 1}*`,
      day: 31 + i,
      // No high/low for predicted points — only prediction model lines
      statHigh: +(lastHigh + drift * 0.8 + i * 0.3).toFixed(1),
      statLow: +(lastLow + drift * 0.5 + i * 0.2).toFixed(1),
      aiHigh: +(lastHigh + drift * 1.1 + Math.random() * 1).toFixed(1),
      aiLow: +(lastLow + drift * 0.9 + Math.random() * 0.8).toFixed(1),
      predicted: true,
    });
  }
  return data;
};

type PredictionModel = 'ai' | 'stochastic' | 'moving_avg' | null;

const BiddingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canal = canalsPorts.find(c => c.id === id);
  const [predictionModel, setPredictionModel] = useState<PredictionModel>('ai');
  const [dailyData] = useState(generateDailyData);

  // Chart drag/zoom state
  const chartRef = useRef<HTMLDivElement>(null);
  const [viewStart, setViewStart] = useState(0);
  const [viewCount, setViewCount] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartViewStart = useRef(0);

  const visibleData = dailyData.slice(viewStart, viewStart + viewCount);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // zoom in
      setViewCount(v => Math.max(10, v - 3));
    } else {
      // zoom out
      setViewCount(v => Math.min(dailyData.length, v + 3));
    }
  }, [dailyData.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartViewStart.current = viewStart;
  }, [viewStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !chartRef.current) return;
    const dx = e.clientX - dragStartX.current;
    const chartWidth = chartRef.current.offsetWidth;
    const pointsPerPixel = viewCount / chartWidth;
    const shift = Math.round(-dx * pointsPerPixel);
    const newStart = Math.max(0, Math.min(dailyData.length - viewCount, dragStartViewStart.current + shift));
    setViewStart(newStart);
  }, [isDragging, viewCount, dailyData.length]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Auction deadline countdown
  const [deadline, setDeadline] = useState(6 * 3600 + 1423);
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
    if (!stored) navigate('/login');
  }, [navigate]);

  if (!canal) {
    navigate('/fleet');
    return null;
  }

  const togglePredictionModel = (m: PredictionModel) => {
    setPredictionModel(prev => prev === m ? null : m);
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!payload.predicted) return <circle cx={cx} cy={cy} r={2.5} fill="hsl(220, 10%, 55%)" />;
    const val = payload[dataKey];
    if (val === undefined) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="hsl(224, 76%, 48%)" stroke="white" strokeWidth={2} />
      </g>
    );
  };

  const futureStartIdx = visibleData.findIndex(d => d.predicted);
  const futureStartLabel = futureStartIdx >= 0 ? visibleData[futureStartIdx].label : '';
  const futureEndLabel = visibleData[visibleData.length - 1]?.label || '';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Nav Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base">AquaMinds</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab onClick={() => navigate('/fleet')}>Fleet Overview</NavTab>
            <NavTab active>Bidding Hub</NavTab>
            <NavTab onClick={() => navigate('/voyage-planner')}>Voyage Planner</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
      </header>

      {/* Sub-header breadcrumb */}
      <div className="border-b border-border px-6 py-2 bg-card shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => navigate('/fleet')} className="text-primary hover:underline font-medium">Fleet Overview</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{canal.name} - Transit SC-4402</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Vessel: MV Northern Star | ETA: Oct 24, 08:00 UTC</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT - Scrollable analytics */}
        <div className="overflow-y-auto p-5 space-y-4 min-h-0" style={{ width: '65%' }}>
          {/* Bidding Trends Chart */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Bidding Trends & Predictions</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {(['ai', 'stochastic', 'moving_avg'] as PredictionModel[]).map(m => (
                  <button
                    key={m!}
                    onClick={() => togglePredictionModel(m)}
                    className={`text-[9px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      predictionModel === m
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'ai' ? 'AI' : m === 'stochastic' ? 'Stochastic' : 'Moving Avg'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Low</span>
              {predictionModel && <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-primary" /> Predicted</span>}
              <span className="text-muted-foreground ml-auto">Scroll to zoom · Drag to pan · Click dots to bid</span>
            </div>
            <div
              ref={chartRef}
              className="h-[320px] select-none"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="futureShade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="label" stroke="hsl(220, 10%, 55%)" fontSize={9} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={v => `$${v}k`} domain={[15, 60]} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: number, name: string) => [`$${Number(v).toFixed(1)}k`, name]}
                    labelFormatter={(label: string) => label.includes('*') ? `${label} (Predicted)` : label}
                  />
                  {futureStartLabel && (
                    <ReferenceArea x1={futureStartLabel} x2={futureEndLabel} fill="url(#futureShade)" />
                  )}
                  {futureStartLabel && (
                    <ReferenceLine x={futureStartLabel} stroke="hsl(224, 76%, 48%)" strokeWidth={1.5} strokeDasharray="6 4" label={{ value: '← Past | Future →', position: 'top', fill: 'hsl(220, 10%, 55%)', fontSize: 9 }} />
                  )}
                  <Line type="monotone" dataKey="high" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={<CustomDot />} connectNulls />
                  <Line type="monotone" dataKey="low" stroke="hsl(152, 69%, 41%)" strokeWidth={2} dot={<CustomDot />} connectNulls />
                  
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
                  {predictionModel === 'moving_avg' && (
                    <>
                      <Line type="monotone" dataKey="high" stroke="hsl(180, 60%, 45%)" strokeWidth={2} strokeDasharray="6 3" dot={<CustomDot />} connectNulls />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 text-right px-1">Click dots on predicted line to set bid value</p>
          </div>

          {/* Harbor Logistics & Metrics */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Harbor Logistics & Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'QUEUE LENGTH', value: String(canal.queueLength), sub: 'vessels', icon: Users, accent: 'text-primary' },
                { label: 'AVG WAITING', value: '18h', sub: '+2h vs. normal', icon: Clock, accent: 'text-warning' },
                { label: 'WATER LEVEL', value: '+0.5m', sub: 'Optimal Draft', icon: TrendingUp, accent: 'text-success' },
                { label: 'DEMURRAGE', value: '$850', sub: '/hr Standard', icon: AlertTriangle, accent: 'text-muted-foreground' },
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

      {/* "If You Don't Bid Today" Card */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TriangleAlert className="w-4 h-4 text-warning" />
              If You Don't Bid Today
            </h2>

            {/* Timeline */}
            <div className="relative ml-4">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

              {/* Step 1 - Arrival */}
              <div className="relative flex gap-4 mb-6">
                <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 z-10">
                  <Anchor className="w-3 h-3 text-primary" />
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-foreground">Arrive at {canal.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Vessel joins the regular queue.</p>
                  <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    Queue Status: High congestion
                  </span>
                </div>
              </div>

              {/* Step 2 - Waiting */}
              <div className="relative flex gap-4 mb-6">
                <div className="w-6 h-6 rounded-full bg-warning/10 border-2 border-warning flex items-center justify-center shrink-0 z-10">
                  <Clock className="w-3 h-3 text-warning" />
                </div>
                <div className="pt-0.5 flex-1">
                  <p className="text-xs font-bold text-foreground">Expected waiting time: 3–4 days</p>
                  <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-warning" style={{ width: '75%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">0 days</span>
                    <span className="text-[9px] text-warning font-bold">~3.5 days</span>
                    <span className="text-[9px] text-muted-foreground">5 days</span>
                  </div>
                </div>
              </div>

              {/* Step 3 - Schedule Impact */}
              <div className="relative flex gap-4 mb-6">
                <div className="w-6 h-6 rounded-full bg-warning/10 border-2 border-warning flex items-center justify-center shrink-0 z-10">
                  <TriangleAlert className="w-3 h-3 text-warning" />
                </div>
                <div className="pt-0.5 flex-1">
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                    <p className="text-xs font-bold text-foreground">Risk of missing destination port window</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Voyage schedule may be disrupted. Downstream berth reservations at risk.</p>
                  </div>
                </div>
              </div>

              {/* Step 4 - Financial Impact */}
              <div className="relative flex gap-4">
                <div className="w-6 h-6 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center shrink-0 z-10">
                  <DollarSign className="w-3 h-3 text-destructive" />
                </div>
                <div className="pt-0.5 flex-1 text-center py-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Estimated Delay Cost</p>
                  <p className="text-3xl font-extrabold text-destructive">$300k+</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on $85k/day delay cost and current congestion.</p>
                </div>
              </div>
            </div>

            {/* Bottom insight banner */}
            <div className="mt-4 bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-success" />
              <p className="text-xs font-semibold text-success">Waiting may cost more than bidding today.</p>
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

        {/* RIGHT - AI Agent (35% width) */}
        <div className="hidden lg:flex border-l border-border flex-col h-full overflow-hidden shrink-0" style={{ width: '35%' }}>
          <AIChatbot canalName={canal.name} />
        </div>
      </div>
    </div>
  );
};

export default BiddingDetail;
