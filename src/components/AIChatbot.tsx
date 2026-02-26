import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, User, Sparkles, MoreVertical, Loader2, CheckCircle2, Zap, DollarSign, Clock, Shield, AlertTriangle, Search, BarChart3, TrendingUp, Database, Globe, ArrowRight, XCircle, CalendarClock, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIChatbotProps {
  canalName?: string;
  bidAmount?: number;
}

type ToolStatus = 'running' | 'done';

interface ToolUsage {
  name: string;
  icon: React.ReactNode;
  status: ToolStatus;
  detail?: string;
}

interface ActionButton {
  label: string;
  variant: 'primary' | 'outline' | 'success' | 'destructive';
  action: string;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  tools?: ToolUsage[];
  actions?: ActionButton[];
  isStreaming?: boolean;
  badge?: string;
  savedBid?: { amount: string; canal: string; status: string; ref: string; time: string };
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  'Market Analysis': <BarChart3 className="w-3 h-3" />,
  'Queue Scanner': <Search className="w-3 h-3" />,
  'Price Predictor': <TrendingUp className="w-3 h-3" />,
  'Risk Engine': <Shield className="w-3 h-3" />,
  'Bid Optimizer': <DollarSign className="w-3 h-3" />,
  'Bid Submission': <Zap className="w-3 h-3" />,
  'API Response': <Globe className="w-3 h-3" />,
  'Database Query': <Database className="w-3 h-3" />,
  'Congestion API': <Zap className="w-3 h-3" />,
};

// Bidding flow state
type BidPhase = 'analysis' | 'ready' | 'submitted' | 'failed_1' | 'failed_2' | 'failed_3' | 'stop' | 'next_day' | 'success';

const BID_AMOUNTS = ['$38,500', '$42,200', '$46,800'];
const BID_AMOUNTS_NUM = [38500, 42200, 46800];

const AIChatbot = ({ canalName = 'Suez Canal' }: AIChatbotProps) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bidPhase, setBidPhase] = useState<BidPhase>('analysis');
  const [bidAttempt, setBidAttempt] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  const addAgentMessage = useCallback((
    scenario: { tools: { name: string; detail: string }[]; content: string; badge?: string; actions?: ActionButton[]; savedBid?: AgentMessage['savedBid'] }
  ) => {
    setIsProcessing(true);
    const msgId = Date.now().toString();
    const initialTools: ToolUsage[] = scenario.tools.map(t => ({
      name: t.name,
      icon: TOOL_ICONS[t.name] || <Zap className="w-3 h-3" />,
      status: 'running' as ToolStatus,
      detail: t.detail,
    }));

    setMessages(prev => [...prev, {
      id: msgId, role: 'agent', content: '', timestamp: new Date(),
      tools: initialTools, isStreaming: true, badge: scenario.badge,
    }]);
    scrollToBottom();

    scenario.tools.forEach((_, idx) => {
      setTimeout(() => {
        setMessages(prev => prev.map(m => {
          if (m.id !== msgId) return m;
          const updatedTools = [...(m.tools || [])];
          updatedTools[idx] = { ...updatedTools[idx], status: 'done' };
          return { ...m, tools: updatedTools };
        }));
        scrollToBottom();
      }, 600 + idx * 700);
    });

    const totalToolTime = 600 + scenario.tools.length * 700 + 300;
    const words = scenario.content.split(' ');
    let wordIdx = 0;

    setTimeout(() => {
      const streamInterval = setInterval(() => {
        wordIdx += 2;
        const partial = words.slice(0, Math.min(wordIdx, words.length)).join(' ');
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: partial } : m
        ));
        scrollToBottom();

        if (wordIdx >= words.length) {
          clearInterval(streamInterval);
          setTimeout(() => {
            setMessages(prev => prev.map(m =>
              m.id === msgId ? { ...m, isStreaming: false, actions: scenario.actions, savedBid: scenario.savedBid } : m
            ));
            setIsProcessing(false);
            scrollToBottom();
          }, 200);
        }
      }, 40);
    }, totalToolTime);
  }, [scrollToBottom]);

  // Initial analysis message
  useEffect(() => {
    const t = setTimeout(() => {
      addAgentMessage({
        tools: [
          { name: 'Market Analysis', detail: 'Scanning 847 recent bids...' },
          { name: 'Queue Scanner', detail: 'Checking current queue depth...' },
          { name: 'Price Predictor', detail: 'Calculating safe bid range...' },
        ],
        badge: 'MARKET ANALYSIS',
        content: `**${canalName} — Transit Bid Analysis**\n\nI've analyzed current market conditions for your transit:\n\n- **Queue depth:** 23 vessels waiting\n- **Current clearing price:** ~$38,500\n- **Bid window closes:** 5h 42m\n- **Recommended safe bid:** **${BID_AMOUNTS[0]}**\n\nThis amount gives you the highest probability of acceptance at the lowest cost. Shall I submit this bid?`,
        actions: [
          { label: `Place Safe Bid — ${BID_AMOUNTS[0]}`, variant: 'primary', action: 'place_bid' },
          { label: 'Explain the analysis', variant: 'outline', action: 'explain' },
        ],
      });
      setBidPhase('ready');
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = (action: string) => {
    if (isProcessing) return;

    if (action === 'explain') {
      addAgentMessage({
        tools: [{ name: 'Risk Engine', detail: 'Running cost-benefit analysis...' }],
        content: `**How I calculated the safe bid:**\n\n1. **Historical clearing prices** — Last 30 days median: $36,200\n2. **Current demand surge** — 23 vessels in queue (+35% above normal)\n3. **Time pressure** — Auction closes in <6 hours\n4. **Your vessel profile** — MV Northern Star, standard priority\n\nAt **${BID_AMOUNTS[0]}**, you have ~78% acceptance probability. This balances cost-efficiency with a reasonable chance of success.\n\nReady to submit?`,
        actions: [
          { label: `Submit Bid — ${BID_AMOUNTS[0]}`, variant: 'primary', action: 'place_bid' },
        ],
      });
      return;
    }

    if (action === 'place_bid') {
      const attempt = bidAttempt;
      const amount = BID_AMOUNTS[attempt] || BID_AMOUNTS[2];

      // User message
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'user',
        content: `Place my bid at ${amount}`, timestamp: new Date(),
      }]);
      scrollToBottom();

      setTimeout(() => {
        // Submitting
        addAgentMessage({
          tools: [
            { name: 'Bid Submission', detail: `Submitting bid $${amount}...` },
            { name: 'API Response', detail: 'Waiting for exchange confirmation...' },
          ],
          badge: 'BID SUBMITTED',
          content: `**Bid submitted:** ${amount}\n\n- Canal: ${canalName} Northbound\n- Priority tier: Standard\n- Vessel: MV Northern Star\n\n⏳ Awaiting exchange response... This typically takes 2-5 minutes.`,
        });

        // After "waiting", show result
        setTimeout(() => {
          if (attempt < 2) {
            // FAIL
            const nextAmount = BID_AMOUNTS[attempt + 1];
            const failReasons = [
              `Your bid of ${amount} was **outbid** by 4 competing vessels. The clearing price settled at **$40,100** — your bid was $1,600 below the cutoff.\n\nThe market is more competitive than expected. I recommend increasing to **${nextAmount}** for the next round.`,
              `Second attempt at ${amount} — **rejected again.** The clearing price climbed to **$44,500** due to 3 new VLCC entries.\n\nI can try one more time at **${nextAmount}**, but I want to flag that we're approaching overpayment territory.`,
            ];
            setBidAttempt(attempt + 1);
            setBidPhase(attempt === 0 ? 'failed_1' : 'failed_2');
            addAgentMessage({
              tools: [
                { name: 'API Response', detail: 'Bid result received...' },
                { name: 'Market Analysis', detail: 'Recalculating optimal range...' },
              ],
              badge: 'BID REJECTED',
              content: `❌ **Bid Failed**\n\n${failReasons[attempt]}`,
              actions: [
                { label: `Retry at ${nextAmount}`, variant: 'primary', action: 'place_bid' },
                { label: 'Stop bidding today', variant: 'destructive', action: 'stop_bidding' },
              ],
            });
          } else if (attempt === 2) {
            // Third fail → agent recommends stopping
            setBidAttempt(3);
            setBidPhase('failed_3');
            addAgentMessage({
              tools: [
                { name: 'API Response', detail: 'Third bid rejected...' },
                { name: 'Risk Engine', detail: 'Evaluating continued bidding risk...' },
                { name: 'Price Predictor', detail: 'Forecasting tomorrow\'s prices...' },
              ],
              badge: '⚠️ RECOMMENDATION',
              content: `❌ **Third bid rejected.** Clearing price: **$49,200**\n\n**I strongly recommend stopping for today.** Here's why:\n\n- Prices are **artificially inflated** — a large fleet is bulk-booking slots\n- Continuing would push you past **$50k**, which is 30% above fair value\n- Tomorrow's forecast shows prices dropping to **$36k–$40k** range as the bulk booking clears\n- Your vessel can safely wait — no demurrage penalty until 36h from now\n\n**Estimated savings by waiting: $10,000–$14,000**\n\nI'll monitor overnight and alert you when the window reopens.`,
              actions: [
                { label: 'Agree — wait until tomorrow', variant: 'success', action: 'wait_tomorrow' },
                { label: 'Force bid anyway', variant: 'destructive', action: 'force_bid' },
              ],
            });
          }
        }, 4000);
      }, 300);
      return;
    }

    if (action === 'stop_bidding' || action === 'wait_tomorrow') {
      setBidPhase('next_day');
      addAgentMessage({
        tools: [
          { name: 'Congestion API', detail: 'Setting overnight monitoring...' },
        ],
        content: `**Monitoring mode activated.** I'll watch the market overnight and alert you when conditions improve.\n\n📊 Current overnight forecast:\n- Expected clearing price drop: **-18%**\n- Optimal bid window: **06:00–08:00 UTC tomorrow**\n- Confidence: **High (89%)**\n\n_You can come back anytime — I'll have a fresh analysis ready._`,
        actions: [
          { label: '⏭ Simulate next day', variant: 'primary', action: 'next_day' },
        ],
      });
      return;
    }

    if (action === 'force_bid') {
      addAgentMessage({
        tools: [{ name: 'Bid Submission', detail: 'Submitting forced bid at $52,000...' }],
        content: `⚠️ **Proceeding against recommendation.** Bid submitted at **$52,000**.\n\nThis is 35% above the 30-day median. I've logged a risk flag for your records.`,
      });
      return;
    }

    if (action === 'next_day') {
      setBidPhase('next_day');
      addAgentMessage({
        tools: [
          { name: 'Market Analysis', detail: 'Fresh morning scan...' },
          { name: 'Queue Scanner', detail: 'Queue dropped overnight...' },
          { name: 'Price Predictor', detail: 'New price model ready...' },
        ],
        badge: '🌅 NEW DAY',
        content: `**Good morning, Captain.** As predicted, conditions improved significantly overnight.\n\n- **Queue:** Dropped from 23 → 14 vessels\n- **Clearing price:** Down to **$35,800** (−27% from yesterday's peak)\n- **Competition:** The bulk-booking fleet completed their transits\n\nMy recommended bid: **$37,500** — this gives you **94% acceptance probability** and saves you ~$14,700 compared to yesterday's prices.\n\nShall I submit?`,
        actions: [
          { label: 'Place Bid — $37,500', variant: 'primary', action: 'final_bid' },
        ],
      });
      return;
    }

    if (action === 'final_bid') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'user',
        content: 'Place my bid at $37,500', timestamp: new Date(),
      }]);
      scrollToBottom();

      setTimeout(() => {
        addAgentMessage({
          tools: [
            { name: 'Bid Submission', detail: 'Submitting bid $37,500...' },
            { name: 'API Response', detail: 'Waiting for confirmation...' },
          ],
          badge: 'BID SUBMITTED',
          content: `**Bid submitted:** $37,500\n\n⏳ Awaiting exchange response...`,
        });

        setTimeout(() => {
          setBidPhase('success');
          const ref = `SC-${Math.floor(10000 + Math.random() * 90000)}`;
          const now = new Date();
          addAgentMessage({
            tools: [
              { name: 'API Response', detail: 'Bid ACCEPTED!' },
              { name: 'Database Query', detail: 'Saving bid confirmation...' },
            ],
            badge: '🎉 BID ACCEPTED',
            content: `## ✅ Congratulations, Captain!\n\nYour bid has been **accepted** by the ${canalName} Transit Authority.\n\n**Transit Confirmation:**\n- **Amount:** $37,500\n- **Canal:** ${canalName} Northbound\n- **Transit slot:** Oct 25, 14:00 UTC\n- **Priority:** Standard\n- **Reference:** ${ref}\n\n**Savings report:**\n- vs. yesterday's market: **−$14,700** saved\n- vs. premium rush: **−$22,500** saved\n\nYour confirmation has been saved below. You can access it anytime from this chat.`,
            savedBid: {
              amount: '$37,500',
              canal: `${canalName} Northbound`,
              status: 'CONFIRMED',
              ref,
              time: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            },
          });
        }, 4500);
      }, 300);
      return;
    }

    if (action === 'view_receipt') {
      // Scroll to the saved bid message
      const savedMsg = messages.find(m => m.savedBid);
      if (savedMsg) {
        const el = document.getElementById(`msg-${savedMsg.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
  };

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: AgentMessage = {
      id: Date.now().toString(), role: 'user',
      content: input, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToBottom();

    setTimeout(() => {
      addAgentMessage({
        tools: [{ name: 'Market Analysis', detail: 'Processing your request...' }],
        content: `I understand your question. Based on current ${canalName} market conditions with **23 vessels** in queue, the optimal strategy depends on timing.\n\nWould you like me to proceed with the recommended safe bid?`,
        actions: bidPhase === 'ready' || bidPhase === 'analysis'
          ? [{ label: `Place Safe Bid — ${BID_AMOUNTS[0]}`, variant: 'primary' as const, action: 'place_bid' }]
          : undefined,
      });
    }, 300);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'border border-border text-foreground hover:bg-muted',
    success: 'bg-success text-white hover:opacity-90',
    destructive: 'bg-destructive text-white hover:opacity-90',
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center relative">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">AquaMinds Agent</p>
            <p className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Actively Monitoring
            </p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} id={`msg-${msg.id}`}>
            {msg.role === 'user' ? (
              <div className="flex gap-2 justify-end">
                <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground">
                  {msg.content}
                </div>
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="max-w-[90%] space-y-2">
                  {msg.badge && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse ${
                      msg.badge.includes('ACCEPTED') || msg.badge.includes('🎉')
                        ? 'bg-success/15 text-success border border-success/20'
                        : msg.badge.includes('REJECTED') || msg.badge.includes('⚠')
                        ? 'bg-destructive/15 text-destructive border border-destructive/20'
                        : 'bg-warning/15 text-warning border border-warning/20'
                    }`}>
                      {msg.badge.includes('REJECTED') ? <XCircle className="w-2.5 h-2.5" /> :
                       msg.badge.includes('ACCEPTED') || msg.badge.includes('🎉') ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                       <AlertTriangle className="w-2.5 h-2.5" />}
                      {msg.badge}
                    </span>
                  )}

                  {msg.tools && msg.tools.length > 0 && (
                    <div className="space-y-1">
                      {msg.tools.map((tool, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50">
                          <span className="text-primary">{tool.icon}</span>
                          <span className="font-semibold text-foreground">{tool.name}</span>
                          <span className="text-muted-foreground truncate flex-1">{tool.detail}</span>
                          {tool.status === 'running' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.content && (
                    <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm">
                      <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p]:last:mb-0 [&_ul]:mb-1 [&_table]:text-[11px] [&_th]:text-left [&_th]:pr-3 [&_td]:pr-3 [&_th]:pb-1 [&_td]:py-0.5 [&_strong]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
                      )}
                    </div>
                  )}

                  {/* Saved bid receipt card */}
                  {msg.savedBid && (
                    <div className="bg-success/5 border-2 border-success/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4 text-success" />
                        <span className="text-xs font-bold text-success uppercase tracking-wider">Bid Confirmation Saved</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-bold text-foreground">{msg.savedBid.amount}</div>
                        <div className="text-muted-foreground">Canal</div>
                        <div className="font-semibold text-foreground">{msg.savedBid.canal}</div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-bold text-success">{msg.savedBid.status}</div>
                        <div className="text-muted-foreground">Reference</div>
                        <div className="font-mono text-foreground">{msg.savedBid.ref}</div>
                        <div className="text-muted-foreground">Confirmed</div>
                        <div className="text-foreground">{msg.savedBid.time}</div>
                      </div>
                    </div>
                  )}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(action.action)}
                          disabled={isProcessing}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 ${variantClasses[action.variant]}`}
                        >
                          {action.variant === 'primary' && <Zap className="w-3 h-3" />}
                          {action.variant === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {action.variant === 'destructive' && <AlertTriangle className="w-3 h-3" />}
                          {action.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground">Agent is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask the agent anything..."
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
