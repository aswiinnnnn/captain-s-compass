import { useNavigate } from 'react-router-dom';
import { canalsPorts } from '@/data/mockData';
import { Anchor, MapPin, CloudRain, ArrowRight } from 'lucide-react';

const CanalPortCards = () => {
  const navigate = useNavigate();

  const statusLabel = (cp: typeof canalsPorts[0]) => {
    if (cp.requiresBidding && cp.congestionStatus === 'High') return { text: 'BIDDING', color: 'bg-destructive text-destructive-foreground' };
    if (cp.requiresBooking) return { text: 'UPCOMING', color: 'bg-muted text-muted-foreground' };
    return { text: 'PLANNING', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-bold text-foreground">Voyage Milestones</h3>
        <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
          View Full Itinerary <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {canalsPorts.slice(0, 3).map(cp => {
          const status = statusLabel(cp);
          return (
            <div
              key={cp.id}
              className="glass-panel rounded-xl p-4 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {cp.type === 'canal' ? <Anchor className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
              </div>
              <h4 className="font-bold text-foreground text-sm mb-0.5">{cp.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">Distance: {cp.distance}</p>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {cp.weatherRisk !== 'Low' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CloudRain className="w-3 h-3" /> {cp.weatherRisk === 'High' ? 'High Swell' : 'Mod. Risk'}
                  </span>
                )}
                {cp.weatherRisk === 'Low' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    ☀️ Clear
                  </span>
                )}
                {cp.requiresBidding && cp.congestionStatus === 'High' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    🕐 14h Left
                  </span>
                )}
              </div>

              <div className="mt-auto">
                {cp.requiresBidding && cp.congestionStatus === 'High' ? (
                  <button
                    onClick={() => navigate(`/bidding/${cp.id}`)}
                    className="w-full py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Manage Bids
                  </button>
                ) : cp.requiresBooking ? (
                  <button className="w-full py-2 bg-muted text-muted-foreground text-xs font-medium rounded-lg border border-border">
                    Booking Opens Oct 21
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/bidding/${cp.id}`)}
                    className="w-full py-2 bg-muted text-muted-foreground text-xs font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    Review Risk Profile
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanalPortCards;
