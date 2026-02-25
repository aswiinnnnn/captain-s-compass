import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Captain } from '@/data/mockData';
import VoyageMap from '@/components/VoyageMap';
import ShipInfoPanel from '@/components/ShipInfoPanel';
import CanalPortCards from '@/components/CanalPortCards';
import AIChatbot from '@/components/AIChatbot';
import { Anchor, Bell, Settings, Search, MapPin } from 'lucide-react';
import NavTab from '@/components/NavTab';

const Dashboard = () => {
  const navigate = useNavigate();
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const stored = localStorage.getItem('voyageguard_captain');
    if (!stored) {
      navigate('/login');
      return;
    }
    setCaptain(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('voyageguard_captain');
    navigate('/login');
  };

  if (!captain) return null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
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
          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search ports, vessels..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" />
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full text-[7px] text-destructive-foreground flex items-center justify-center font-bold">3</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={logout} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
              {captain.name.charAt(captain.name.indexOf(' ') + 1)}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel - Map & Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="relative">
            <VoyageMap shipPosition={captain.position} onCanalClick={cp => navigate(`/bidding/${cp.id}`)} />
            <ShipInfoPanel captain={captain} />
          </div>
          <CanalPortCards />
        </div>

        {/* Right panel - Persistent Chatbot (fixed height) */}
        <div className="hidden lg:flex w-[30%] max-w-[380px] min-w-[320px] border-l border-border flex-col h-full overflow-hidden shrink-0">
          <AIChatbot />
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-border flex items-center justify-between px-6 bg-card text-[10px] shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-success font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            SAT CONNECTION: STABLE (84MS)
          </span>
          <span className="text-muted-foreground"><MapPin className="w-3 h-3 inline mr-1" />LAT: {(captain.position.lat ?? 0).toFixed(2)}° N | LON: {(captain.position.lng ?? 0).toFixed(2)}° E</span>
          <span className="text-muted-foreground">Voyage: {captain.voyageId}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-mono">SERVER TIME: {time.toUTCString().slice(17, 25)} UTC</span>
          <span className="text-success font-bold">SYSTEM STATUS: ALL GREEN</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
