import { canalsPorts, type CanalPort } from '@/data/mockData';
import { Ship, Plus, Minus, Layers } from 'lucide-react';

interface VoyageMapProps {
  shipPosition: { x: number; y: number };
  onCanalClick?: (canal: CanalPort) => void;
}

const VoyageMap = ({ shipPosition, onCanalClick }: VoyageMapProps) => {
  return (
    <div className="relative w-full h-[380px] rounded-xl overflow-hidden bg-card border border-border">
      <svg viewBox="0 0 100 70" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(210, 30%, 95%)" />
            <stop offset="100%" stopColor="hsl(210, 25%, 90%)" />
          </linearGradient>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220, 14%, 85%)" />
            <stop offset="100%" stopColor="hsl(220, 14%, 80%)" />
          </linearGradient>
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <rect width="100" height="70" fill="url(#ocean)" />

        {/* Simplified continents */}
        <path d="M42,15 L52,14 L54,18 L56,20 L52,24 L48,26 L44,28 L40,26 L38,22 L40,18 Z" fill="url(#land)" opacity="0.7" />
        <path d="M40,30 L48,28 L54,30 L58,34 L60,40 L58,48 L54,54 L48,56 L42,52 L38,46 L36,40 L38,34 Z" fill="url(#land)" opacity="0.7" />
        <path d="M56,16 L70,14 L80,18 L84,24 L82,30 L78,34 L74,38 L68,40 L64,36 L60,32 L56,28 L54,22 Z" fill="url(#land)" opacity="0.7" />
        <path d="M72,42 L78,40 L82,44 L80,50 L76,52 L72,48 Z" fill="url(#land)" opacity="0.6" />
        <path d="M10,14 L18,12 L22,16 L24,22 L26,28 L28,34 L26,42 L24,48 L20,54 L16,50 L14,44 L12,38 L10,30 L8,22 Z" fill="url(#land)" opacity="0.7" />

        {/* Grid lines */}
        {[20, 30, 40, 50].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="hsl(220, 13%, 85%)" strokeWidth="0.15" strokeDasharray="1,1" />
        ))}
        {[20, 40, 60, 80].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="70" stroke="hsl(220, 13%, 85%)" strokeWidth="0.15" strokeDasharray="1,1" />
        ))}

        {/* Route line */}
        <path
          d={`M${shipPosition.x},${shipPosition.y} Q50,38 55,42 T72,52`}
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="0.5"
          strokeDasharray="1.5,0.8"
        />

        {/* Canal/Port markers */}
        {canalsPorts.map(cp => (
          <g key={cp.id} className="cursor-pointer" onClick={() => onCanalClick?.(cp)}>
            <circle cx={cp.position.x} cy={cp.position.y} r="1.5" fill="none" stroke={cp.congestionStatus === 'High' ? 'hsl(0, 72%, 51%)' : cp.congestionStatus === 'Medium' ? 'hsl(38, 92%, 50%)' : 'hsl(152, 69%, 41%)'} strokeWidth="0.3" opacity="0.6">
              <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={cp.position.x} cy={cp.position.y} r="0.8" fill={cp.congestionStatus === 'High' ? 'hsl(0, 72%, 51%)' : cp.congestionStatus === 'Medium' ? 'hsl(38, 92%, 50%)' : 'hsl(152, 69%, 41%)'} />
            <text x={cp.position.x} y={cp.position.y - 2.5} textAnchor="middle" fill="hsl(220, 20%, 30%)" fontSize="1.8" fontWeight="600" className="pointer-events-none">
              {cp.name}
            </text>
          </g>
        ))}

        {/* Ship icon */}
        <g className="animate-ship-move">
          <circle cx={shipPosition.x} cy={shipPosition.y} r="2" fill="hsl(224, 76%, 48%)" opacity="0.15">
            <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={shipPosition.x} cy={shipPosition.y} r="1.2" fill="hsl(224, 76%, 48%)" />
          <text x={shipPosition.x} y={shipPosition.y + 0.5} textAnchor="middle" fill="white" fontSize="1.2" fontWeight="bold" className="pointer-events-none">A</text>
        </g>
      </svg>

      {/* Ship label */}
      <div className="absolute" style={{ left: `${(shipPosition.x / 100) * 100}%`, top: `${((shipPosition.y / 70) * 100) + 5}%` }}>
        <div className="bg-card border border-border rounded px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm whitespace-nowrap -translate-x-1/2">
          MV ATLANTIC STAR
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button className="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm">
          <Plus className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm">
          <Minus className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm">
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VoyageMap;
