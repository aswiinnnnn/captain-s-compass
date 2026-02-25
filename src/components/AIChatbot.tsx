import { useState, useRef, useEffect } from 'react';
import { getAIResponse, type ChatMessage } from '@/data/mockData';
import { Bot, Send, User, Sparkles, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIChatbotProps {
  canalName?: string;
  bidAmount?: number;
  compact?: boolean;
}

const AIChatbot = ({ canalName, bidAmount, compact }: AIChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: compact
        ? `Based on your vessel's ETA and current queue, a bid of **$44,800** is recommended.`
        : `Good morning, Captain. I've analyzed the Suez Canal bidding trends. Current median bids for Northbound transit on Oct 24 are up 12% due to increased traffic.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-send a follow-up message for demo richness
  useEffect(() => {
    if (!compact && messages.length === 1) {
      const timer = setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: '2',
            role: 'user',
            content: 'Should we increase our bid to ensure priority slot?',
            timestamp: new Date(),
          },
        ]);
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: '3',
              role: 'ai',
              content: `I recommend increasing the bid by **$4,500**. This places you in the 85th percentile of current bids and ensures transit before the predicted weather deterioration in the Red Sea.`,
              timestamp: new Date(),
              card: {
                type: 'recommendation',
                confidence: 94,
                amount: 142500,
              },
            },
          ]);
          setIsTyping(false);
        }, 1500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [compact]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(input, { canalName, bidAmount });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const quickActions = compact
    ? ['Adjust for weather?', 'Show factors']
    : ['Fuel Efficiency', 'Weather Alert', 'Bid History', 'Analyze Factors'];

  return (
    <div className="flex flex-col h-full bg-chat-bg rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{compact ? 'AI Bidding Assistant' : 'Voyage Assistant'}</p>
            <p className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              AI Agent Online
            </p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:last:mb-0 [&_ul]:mb-1 [&_table]:text-xs [&_th]:text-left [&_th]:pr-3 [&_td]:pr-3">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* AI Recommendation Card */}
            {msg.card?.type === 'recommendation' && (
              <div className="ml-8 mt-2 bg-card border-2 border-primary/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase">AI Recommendation</span>
                  <span className="text-[10px] font-bold text-success">{msg.card.confidence}% Confidence</span>
                </div>
                <p className="text-sm font-bold text-foreground mb-2">New Proposed Bid: ${msg.card.amount.toLocaleString()}.00</p>
                <button className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
                  Apply New Bid
                </button>
              </div>
            )}
            <p className={`text-[9px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'text-right mr-8' : 'ml-8'}`}>
              {formatTime(msg.timestamp)}
            </p>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={compact ? 'Ask AI Assistant...' : 'Ask about routes, bids, or weather...'}
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => { setInput(action); }}
              className="text-[11px] px-3 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors bg-card"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
