import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, User, Sparkles, MoreVertical, Search, Database, BarChart3, Globe, Zap, CheckCircle2, Loader2, ArrowRight, DollarSign, Clock, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
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
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  'Market Analysis': <BarChart3 className="w-3 h-3" />,
  'Queue Scanner': <Search className="w-3 h-3" />,
  'Price Predictor': <TrendingUp className="w-3 h-3" />,
  'Risk Engine': <Shield className="w-3 h-3" />,
  'Bid Optimizer': <DollarSign className="w-3 h-3" />,
  'Web Search': <Globe className="w-3 h-3" />,
  'Database Query': <Database className="w-3 h-3" />,
  'Congestion API': <Zap className="w-3 h-3" />,
};

// Proactive agent scenarios
const agentScenarios: { tools: { name: string; detail: string }[]; content: string; badge?: string; actions?: ActionButton[] }[] = [
  {
    tools: [
      { name: 'Market Analysis', detail: 'Scanning 847 recent bids...' },
      { name: 'Price Predictor', detail: 'Running Monte Carlo simulation...' },
      { name: 'Congestion API', detail: 'Fetching live queue data...' },
    ],
    badge: 'LIVE ALERT',
    content: `**Bid window closing in 5h 42m.** I've analyzed 847 recent transit bids and current queue conditions.\n\n**Key findings:**\n- Current clearing price trending **$42,800** (↑8% from yesterday)\n- Queue depth: **23 vessels** waiting — highest this week\n- Optimal bid window: **next 2 hours** before Asian fleet submits\n\nMy model suggests **$44,200** gives you a 91% success probability while saving $3,800 vs. the safe ceiling.`,
    actions: [
      { label: 'Place Bid at $44,200', variant: 'primary', action: 'place_bid_44200' },
      { label: 'Show me alternatives', variant: 'outline', action: 'show_alternatives' },
      { label: 'Wait & monitor', variant: 'outline', action: 'wait_monitor' },
    ],
  },
  {
    tools: [
      { name: 'Risk Engine', detail: 'Calculating delay costs...' },
      { name: 'Database Query', detail: 'Pulling historical patterns...' },
    ],
    badge: 'RISK UPDATE',
    content: `**Delay cost alert.** If you skip this auction round:\n\n- Est. wait time increases to **4.2 days** (from 2.8)\n- Demurrage exposure: **$340,000**\n- Next auction window: **18 hours away**\n\nHistorical data shows vessels that bid in the first window save an average of **$12,400** compared to second-round bids.`,
    actions: [
      { label: 'Bid now — minimize risk', variant: 'success', action: 'bid_now' },
      { label: 'Calculate break-even', variant: 'outline', action: 'calc_breakeven' },
    ],
  },
  {
    tools: [
      { name: 'Web Search', detail: 'Checking maritime news feeds...' },
      { name: 'Congestion API', detail: 'Monitoring vessel movements...' },
      { name: 'Bid Optimizer', detail: 'Recalculating optimal range...' },
    ],
    badge: 'MARKET SHIFT',
    content: `**Breaking:** 3 VLCCs just cancelled northbound transits — queue dropped from 23 to 20 vessels.\n\nThis changes the dynamics significantly:\n- Clearing price prediction **dropped 6%** to ~$40,100\n- My confidence for a $41,500 bid just jumped to **94%**\n- Window of opportunity: **~45 minutes** before market adjusts`,
    actions: [
      { label: 'Quick bid $41,500', variant: 'primary', action: 'quick_bid' },
      { label: 'Set auto-bid ceiling', variant: 'outline', action: 'set_ceiling' },
      { label: 'Ignore — too risky', variant: 'destructive', action: 'ignore' },
    ],
  },
];

const userResponses: Record<string, { tools: { name: string; detail: string }[]; content: string; actions?: ActionButton[] }> = {
  'place_bid_44200': {
    tools: [
      { name: 'Bid Optimizer', detail: 'Submitting bid $44,200...' },
      { name: 'Database Query', detail: 'Recording transaction...' },
    ],
    content: `**Bid submitted successfully.** \n\n- Amount: **$44,200**\n- Transit: Suez Canal Northbound\n- Priority tier: **Premium**\n- Estimated confirmation: **12-18 minutes**\n\nI'll monitor the auction and alert you the moment results come in. Meanwhile, I'm tracking 3 competing bids in your price range.`,
    actions: [
      { label: 'Modify bid amount', variant: 'outline', action: 'modify_bid' },
      { label: 'View competitors', variant: 'outline', action: 'view_competitors' },
    ],
  },
  'show_alternatives': {
    tools: [
      { name: 'Price Predictor', detail: 'Generating bid scenarios...' },
      { name: 'Risk Engine', detail: 'Scoring each option...' },
    ],
    content: `**Alternative bid strategies:**\n\n| Strategy | Amount | Success % | Risk |\n|----------|--------|-----------|------|\n| Aggressive | $41,000 | 67% | High |\n| **Balanced** | **$44,200** | **91%** | **Low** |\n| Safe | $47,500 | 98% | None |\n| Premium Rush | $52,000 | 99.5% | None |\n\nMy recommendation remains the **balanced** approach — best value-to-probability ratio.`,
    actions: [
      { label: 'Go aggressive $41k', variant: 'destructive', action: 'bid_aggressive' },
      { label: 'Balanced $44.2k', variant: 'primary', action: 'place_bid_44200' },
      { label: 'Play it safe $47.5k', variant: 'success', action: 'bid_safe' },
    ],
  },
  'wait_monitor': {
    tools: [
      { name: 'Congestion API', detail: 'Setting up live monitoring...' },
    ],
    content: `**Monitoring mode activated.** I'll track:\n- Bid clearing price changes (alert if >5% swing)\n- Queue depth changes\n- Competing vessel movements\n\nI'll proactively alert you if conditions shift in your favor or if risk increases.`,
    actions: [
      { label: 'Set price alert threshold', variant: 'outline', action: 'set_alert' },
    ],
  },
  'default': {
    tools: [
      { name: 'Market Analysis', detail: 'Processing your request...' },
    ],
    content: `I've analyzed your query against current market conditions. The Suez Canal northbound transit market is currently active with **23 vessels** in queue.\n\nWould you like me to run a detailed analysis or adjust your bidding strategy?`,
    actions: [
      { label: 'Run full analysis', variant: 'primary', action: 'show_alternatives' },
      { label: 'Check current prices', variant: 'outline', action: 'wait_monitor' },
    ],
  },
};

const AIChatbot = ({ canalName, bidAmount }: AIChatbotProps) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scenarioIdx = useRef(0);
  const proactiveTimer = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  // Simulate tool execution with staggered completion
  const simulateAgentResponse = useCallback((scenario: typeof agentScenarios[0], isProactive = false) => {
    setIsProcessing(true);

    // Create initial message with tools in "running" state
    const msgId = Date.now().toString();
    const initialTools: ToolUsage[] = scenario.tools.map(t => ({
      name: t.name,
      icon: TOOL_ICONS[t.name] || <Zap className="w-3 h-3" />,
      status: 'running' as ToolStatus,
      detail: t.detail,
    }));

    const agentMsg: AgentMessage = {
      id: msgId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      tools: initialTools,
      isStreaming: true,
      badge: isProactive ? scenario.badge : undefined,
    };
    setMessages(prev => [...prev, agentMsg]);
    scrollToBottom();

    // Stagger tool completions
    scenario.tools.forEach((_, idx) => {
      setTimeout(() => {
        setMessages(prev => prev.map(m => {
          if (m.id !== msgId) return m;
          const updatedTools = [...(m.tools || [])];
          updatedTools[idx] = { ...updatedTools[idx], status: 'done' };
          return { ...m, tools: updatedTools };
        }));
        scrollToBottom();
      }, 600 + idx * 800);
    });

    // Stream content after tools complete
    const totalToolTime = 600 + scenario.tools.length * 800 + 300;
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
          // Add action buttons
          setTimeout(() => {
            setMessages(prev => prev.map(m =>
              m.id === msgId ? { ...m, isStreaming: false, actions: scenario.actions } : m
            ));
            setIsProcessing(false);
            scrollToBottom();
          }, 200);
        }
      }, 40);
    }, totalToolTime);
  }, [scrollToBottom]);

  // Initial proactive message
  useEffect(() => {
    const t = setTimeout(() => {
      simulateAgentResponse(agentScenarios[0], true);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proactive messages every 45s
  useEffect(() => {
    proactiveTimer.current = setInterval(() => {
      if (isProcessing) return;
      scenarioIdx.current = (scenarioIdx.current + 1) % agentScenarios.length;
      simulateAgentResponse(agentScenarios[scenarioIdx.current], true);
    }, 45000);
    return () => { if (proactiveTimer.current) clearInterval(proactiveTimer.current); };
  }, [isProcessing, simulateAgentResponse]);

  const handleAction = (action: string) => {
    if (isProcessing) return;
    const response = userResponses[action] || userResponses['default'];
    simulateAgentResponse({ ...response, badge: undefined });
  };

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToBottom();

    const response = userResponses['default'];
    setTimeout(() => {
      simulateAgentResponse({ ...response, badge: undefined });
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
          <div key={msg.id}>
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
                  {/* Badge */}
                  {msg.badge && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {msg.badge}
                    </span>
                  )}

                  {/* Tool usage indicators */}
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

                  {/* Content */}
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

                  {/* Action buttons */}
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
