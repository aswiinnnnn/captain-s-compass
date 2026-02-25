import { createContext, useContext, useState, type ReactNode } from 'react';
import { getAIResponse, type ChatMessage } from '@/data/mockData';

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (input: string, context?: { canalName?: string; bidAmount?: number }) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be inside ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: `Good morning, Captain. I've analyzed the Suez Canal bidding trends. Current median bids for Northbound transit on Oct 24 are up 12% due to increased traffic.\n\nI see your vessel will reach the Panama Canal in 48 hours. Would you like help deciding whether to bid for a priority slot?`,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (input: string, context?: { canalName?: string; bidAmount?: number }) => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(input, context);
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

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
