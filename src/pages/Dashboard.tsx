import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Captain } from '@/data/mockData';
import VoyageMap from '@/components/VoyageMap';
import ShipInfoPanel from '@/components/ShipInfoPanel';
import CanalPortCards from '@/components/CanalPortCards';
import AIChatbot from '@/components/AIChatbot';
import { LogOut, Anchor, Bell, Settings, Search } from 'lucide-react';
import NavTab from '@/components/NavTab';

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
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-base">Captain Voyage</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavTab active>Dashboard</NavTab>
            <NavTab>Voyages</NavTab>
            <NavTab>Bidding Hub</NavTab>
            <NavTab>Fleet Analytics</NavTab>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search ports, vessels..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-36" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {captain.name.charAt(captain.name.indexOf(' ') + 1)}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-5 space-y-5">
          {/* Map with overlay */}
          <div className="relative">
            <VoyageMap shipPosition={captain.position} onCanalClick={cp => navigate(`/bidding/${cp.id}`)} />
            <ShipInfoPanel captain={captain} />
          </div>
          <CanalPortCards />
        </div>

        {/* Right panel - Chatbot */}
        <div className="hidden lg:block w-[30%] max-w-[380px] border-l border-border p-4">
          <AIChatbot />
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-border flex items-center justify-between px-6 bg-card text-[10px] shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            SAT CONNECTION: STABLE (84MS)
          </span>
          <span className="text-muted-foreground">📍 LAT: 29.93° N | LON: 32.55° E</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">SERVER TIME: 08:22:45 UTC</span>
          <span className="text-success font-medium">SYSTEM STATUS: ALL GREEN</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
