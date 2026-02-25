import { useState, useRef, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Bot, Send, User, Sparkles, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIChatbotProps {
  canalName?: string;
  bidAmount?: number;
}

const AIChatbot = ({ canalName, bidAmount }: AIChatbotProps) => {
  const { messages, isTyping, sendMessage } = useChatContext();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, { canalName, bidAmount });
    setInput('');
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const quickActions = [
    'Should I bid now?',
    'What happens if I wait?',
    'Set maximum bid',
    'Explain recommendation',
    'Show market conditions',
  ];

  return (
    <div className="flex flex-col h-full bg-chat-bg rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Voyage Assistant</p>
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

      {/* Quick Actions + Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2 mb-2 flex-wrap">
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => { sendMessage(action, { canalName, bidAmount }); }}
              className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors bg-card font-medium"
            >
              {action}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about bidding strategy..."
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
