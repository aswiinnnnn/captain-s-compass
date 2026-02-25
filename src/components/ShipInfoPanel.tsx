import type { Captain } from '@/data/mockData';
import { Ship, Navigation, Gauge, Clock, Package } from 'lucide-react';

const ShipInfoPanel = ({ captain }: { captain: Captain }) => {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Ship className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">{captain.name}</h3>
          <p className="text-xs text-muted-foreground">{captain.shipName}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Ship, label: 'Ship Type', value: captain.shipType },
          { icon: Package, label: 'Cargo', value: captain.cargoType.split('(')[0].trim() },
          { icon: Gauge, label: 'Speed', value: captain.currentSpeed },
          { icon: Clock, label: 'ETA Next', value: captain.eta },
        ].map(item => (
          <div key={item.label} className="flex items-start gap-2">
            <item.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-medium text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipInfoPanel;
