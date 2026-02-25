import { useNavigate } from 'react-router-dom';
import { canalsPorts } from '@/data/mockData';
import { Anchor, MapPin, CloudRain, ArrowRight, Shield, Ship } from 'lucide-react';

const CanalPortCards = () => {
  const navigate = useNavigate();

  const statusLabel = (cp: typeof canalsPorts[0]) => {
    if (cp.requiresBidding && cp.congestionStatus === 'High') return { text: 'BIDDING', color: 'bg-destructive text-destructive-foreground' };
    if (cp.requiresBidding) return { text: 'UPCOMING', color: 'bg-warning text-warning-foreground' };
    if (cp.securityLevel === 'High') return { text: 'SECURITY', color: 'bg-destructive text-destructive-foreground' };
    return { text: 'PLANNING', color: 'bg-muted text-muted-foreground' };
  };

  const typeIcon = (type: string) => {
    if (type === 'canal') return <Anchor className="w-4 h-4 text-primary" />;
    if (type === 'strait') return <Shield className="w-4 h-4 text-destructive" />;
    return <MapPin className="w-4 h-4 text-primary" />;
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
            <div key={cp.id} className="glass-panel rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {typeIcon(cp.type)}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
              </div>
              <h4 className="font-bold text-foreground text-sm mb-0.5">{cp.name}</h4>
              <p className="text-xs text-muted-foreground mb-1">Distance: {cp.distance}</p>

              {/* Extra detail row */}
              <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
                {cp.queueLength > 0 && (
                  <span className="flex items-center gap-1">
                    <Ship className="w-3 h-3" /> {cp.queueLength} in queue
                  </span>
                )}
                {cp.weatherRisk !== 'Low' && (
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3" /> {cp.weatherRisk === 'High' ? 'High Swell' : 'Mod. Risk'}
                  </span>
                )}
                {cp.weatherRisk === 'Low' && (
                  <span className="flex items-center gap-1">Clear</span>
                )}
              </div>

              {/* Bid range preview */}
              {cp.requiresBidding && cp.currentBidRange.max > 0 && (
                <div className="bg-muted rounded-lg px-3 py-2 mb-3">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Bid Range</span>
                    <span className="font-bold text-foreground">${(cp.currentBidRange.min / 1000).toFixed(0)}k – ${(cp.currentBidRange.max / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-muted-foreground">Avg. Clearing</span>
                    <span className="font-semibold text-success">${(cp.avgClearingPrice / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              )}

              <div className="mt-auto">
                {cp.requiresBidding && cp.congestionStatus === 'High' ? (
                  <button
                    onClick={() => navigate(`/bidding/${cp.id}`)}
                    className="w-full py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Manage Bids
                  </button>
                ) : cp.securityLevel === 'High' ? (
                  <button
                    onClick={() => navigate(`/bidding/${cp.id}`)}
                    className="w-full py-2 bg-muted text-foreground text-xs font-medium rounded-lg border border-border hover:border-destructive/30 transition-colors"
                  >
                    Review Risk Profile
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
                    View Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Active Bids', value: '3', change: '+1 today', color: 'text-primary' },
          { label: 'Win Rate (30d)', value: '58%', change: '↑ 12% vs. avg', color: 'text-success' },
          { label: 'Total Saved by AI', value: '$28.4k', change: 'Last 30 days', color: 'text-success' },
          { label: 'Next Bid Window', value: '6h 14m', change: 'Suez Canal', color: 'text-warning' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-panel rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanalPortCards;
