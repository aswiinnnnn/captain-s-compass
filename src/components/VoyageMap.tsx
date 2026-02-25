import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { canalsPorts, routeWaypoints, type CanalPort } from '@/data/mockData';

interface VoyageMapProps {
  shipPosition: { lat: number; lng: number };
  onCanalClick?: (canal: CanalPort) => void;
}

const VoyageMap = ({ shipPosition, onCanalClick }: VoyageMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [shipPosition.lat, shipPosition.lng],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean CartoDB Voyager (light theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control on right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Route line (dashed)
    L.polyline(routeWaypoints, {
      color: '#2563eb',
      weight: 2.5,
      dashArray: '8, 6',
      opacity: 0.7,
    }).addTo(map);

    // Traveled portion (solid)
    const shipIdx = routeWaypoints.findIndex(
      ([lat, lng]) => Math.abs(lat - shipPosition.lat) < 2 && Math.abs(lng - shipPosition.lng) < 5
    );
    if (shipIdx >= 0) {
      const traveledPath = routeWaypoints.slice(0, shipIdx + 1);
      L.polyline(traveledPath, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.9,
      }).addTo(map);
    }

    // Ship marker with pulsing effect
    const shipIcon = L.divIcon({
      className: 'ship-marker',
      html: `
        <div style="position:relative; width:36px; height:36px;">
          <div style="position:absolute; inset:0; background:rgba(37,99,235,0.15); border-radius:50%; animation: pulse-ring 2s ease-out infinite;"></div>
          <div style="position:absolute; inset:4px; background:#2563eb; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; border:3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">A</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([shipPosition.lat, shipPosition.lng], { icon: shipIcon })
      .addTo(map)
      .bindTooltip('MV Atlantic Star', {
        permanent: true,
        direction: 'bottom',
        offset: [0, 16],
        className: 'ship-tooltip',
      });

    // Canal/Port markers
    canalsPorts.forEach(cp => {
      const color = cp.congestionStatus === 'High' ? '#ef4444' : cp.congestionStatus === 'Medium' ? '#f59e0b' : '#22c55e';
      const markerIcon = L.divIcon({
        className: 'canal-marker',
        html: `
          <div style="position:relative; width:28px; height:28px;">
            <div style="position:absolute; inset:0; background:${color}20; border:2px solid ${color}; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
            <div style="position:absolute; inset:5px; background:${color}; border-radius:50; border-radius:50%;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cp.position.lat, cp.position.lng], { icon: markerIcon })
        .addTo(map)
        .bindTooltip(`<strong>${cp.name}</strong><br/>${cp.type.toUpperCase()} • ${cp.congestionStatus} Traffic`, {
          direction: 'top',
          offset: [0, -14],
          className: 'canal-tooltip',
        });

      if (onCanalClick) {
        marker.on('click', () => onCanalClick(cp));
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [shipPosition, onCanalClick]);

  return (
    <div className="relative w-full h-[420px] rounded-xl overflow-hidden border border-border shadow-sm">
      <div ref={mapRef} className="w-full h-full z-0" />
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .ship-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .ship-tooltip::before { display: none !important; }
        .canal-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
          color: #475569 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .canal-tooltip::before { display: none !important; }
        .leaflet-control-zoom {
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #64748b !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f8fafc !important;
          color: #1e293b !important;
        }
      `}</style>
    </div>
  );
};

export default VoyageMap;
