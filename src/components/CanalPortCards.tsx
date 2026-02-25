import { useNavigate } from 'react-router-dom';
import { canalsPorts, type CanalPort } from '@/data/mockData';
import { MapPin, Clock, AlertTriangle, CloudRain, ChevronRight } from 'lucide-react';

const CanalPortCards = () => {
  const navigate = useNavigate();

  const riskColor = (risk: string) => {
    if (risk === 'High') return 'text-destructive bg-destructive/10';
    if (risk === 'Medium') return 'text-warning bg-warning/10';
    return 'text-success bg-success/10';
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-foreground mb-3 px-1">Upcoming Waypoints</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {canalsPorts.map(cp => (
          <button
            key={cp.id}
            onClick={() => navigate(`/bidding/${cp.id}`)}
            className="flex-shrink-0 w-[240px] glass-panel rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{cp.type}</p>
                <h4 className="font-semibold text-foreground text-sm">{cp.name}</h4>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {cp.distance}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> ETA: {cp.eta}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {cp.requiresBidding && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">✅ Bidding</span>
              )}
              {cp.requiresBooking && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">📅 Booking</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${riskColor(cp.congestionStatus)}`}>
                <AlertTriangle className="w-2.5 h-2.5" /> {cp.congestionStatus}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${riskColor(cp.weatherRisk)}`}>
                <CloudRain className="w-2.5 h-2.5" /> {cp.weatherRisk}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CanalPortCards;
