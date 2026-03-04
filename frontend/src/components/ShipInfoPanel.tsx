import type { Captain } from '@/data/mockData';
import { Ship, Navigation, Gauge, Clock, Fuel, Compass, Anchor } from 'lucide-react';

const ShipInfoPanel = ({ captain }: { captain: Captain }) => {
  return (
    <div className="glass-panel rounded-xl p-4 absolute top-4 left-4 w-[260px] z-[1000] shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-foreground text-sm">{captain.shipName}</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success text-success-foreground uppercase animate-pulse">On Route</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{captain.shipType} • {captain.imo}</p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Captain</span>
          <span className="font-semibold text-foreground">{captain.name.replace('Capt. ', '')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Speed</span>
          <span className="font-semibold text-foreground">{captain.currentSpeed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Heading</span>
          <span className="font-medium text-foreground">{captain.heading}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Draft</span>
          <span className="font-medium text-foreground">{captain.draft}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ETA Port Suez</span>
          <span className="font-bold text-destructive">Oct 24, 14:00 UTC</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: '65%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground uppercase font-medium">{captain.departurePort?.split(',')[0]}</span>
          <span className="text-[9px] text-muted-foreground uppercase font-medium">Suez Canal</span>
        </div>
      </div>

      {/* Fuel gauge */}
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Fuel className="w-3 h-3" /> Fuel
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: captain.fuelRemaining }} />
          </div>
          <span className="text-[10px] font-bold text-foreground">{captain.fuelRemaining}</span>
        </div>
      </div>
    </div>
  );
};

export default ShipInfoPanel;
