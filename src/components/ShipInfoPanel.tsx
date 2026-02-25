import type { Captain } from '@/data/mockData';
import { Ship, Gauge, Clock } from 'lucide-react';

const ShipInfoPanel = ({ captain }: { captain: Captain }) => {
  return (
    <div className="glass-panel rounded-xl p-4 absolute top-4 left-4 w-[240px] z-10">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-foreground text-sm">{captain.shipName}</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success uppercase">On Route</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{captain.shipType} • IMO 98327</p>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Captain</span>
          <span className="font-medium text-foreground">{captain.name.replace('Capt. ', '')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Speed</span>
          <span className="font-medium text-foreground">{captain.currentSpeed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ETA Port Suez</span>
          <span className="font-semibold text-destructive">Oct 24, 14:00 UTC</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground uppercase">Algeciras</span>
          <span className="text-[9px] text-muted-foreground uppercase">Suez Canal</span>
        </div>
      </div>
    </div>
  );
};

export default ShipInfoPanel;
