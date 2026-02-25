import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Captain } from '@/data/mockData';
import VoyageMap from '@/components/VoyageMap';
import ShipInfoPanel from '@/components/ShipInfoPanel';
import CanalPortCards from '@/components/CanalPortCards';
import AIChatbot from '@/components/AIChatbot';
import { LogOut, Anchor } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [captain, setCaptain] = useState<Captain | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) {
      navigate('/');
      return;
    }
    setCaptain(JSON.parse(stored));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/');
  };

  if (!captain) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">VoyageGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">{captain.name} • {captain.shipName}</span>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - 70% */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <VoyageMap shipPosition={captain.position} onCanalClick={cp => navigate(`/bidding/${cp.id}`)} />
            </div>
            <div>
              <ShipInfoPanel captain={captain} />
            </div>
          </div>
          <CanalPortCards />
        </div>

        {/* Right panel - Chatbot 30% */}
        <div className="hidden lg:block w-[30%] max-w-[400px] border-l border-border p-4">
          <AIChatbot />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
