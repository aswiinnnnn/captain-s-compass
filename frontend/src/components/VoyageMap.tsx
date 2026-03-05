import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { canalsPorts, routeWaypoints, type CanalPort } from '@/data/mockData';

interface VoyageMapProps {
  shipPosition: { lat?: number; lng?: number; x?: number; y?: number };
  onCanalClick?: (canal: CanalPort) => void;
}

const VoyageMap = ({ shipPosition, onCanalClick }: VoyageMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const lat = shipPosition.lat ?? 35.5;
  const lng = shipPosition.lng ?? 12.5;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

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
      ([wLat, wLng]) => Math.abs(wLat - lat) < 2 && Math.abs(wLng - lng) < 5
    );
    if (shipIdx >= 0) {
      const traveledPath = routeWaypoints.slice(0, shipIdx + 1);
      L.polyline(traveledPath, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.9,
      }).addTo(map);
    }

    // Ship marker
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

    // Permanent name label
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'ship-name-label',
        html: `<div style="background:white; border:1px solid #e2e8f0; border-radius:6px; padding:2px 8px; font-size:10px; font-weight:700; color:#1e293b; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.1);">MV Atlantic Star</div>`,
        iconSize: [100, 16],
        iconAnchor: [50, -16],
      }),
    }).addTo(map);

    // Ship marker with detailed hover tooltip
    L.marker([lat, lng], { icon: shipIcon })
      .addTo(map)
      .bindTooltip(
        `<div style="min-width:200px;">
          <div style="font-weight:700; font-size:12px; margin-bottom:6px; color:#1e293b;">MV Atlantic Star</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-size:10px;">
            <div style="color:#64748b;">Speed</div><div style="font-weight:600; color:#1e293b;">18.4 knots</div>
            <div style="color:#64748b;">Heading</div><div style="font-weight:600; color:#1e293b;">092° ESE</div>
            <div style="color:#64748b;">Draft</div><div style="font-weight:600; color:#1e293b;">12.8m</div>
            <div style="color:#64748b;">Fuel</div><div style="font-weight:600; color:#22c55e;">68%</div>
            <div style="color:#64748b;">Cargo</div><div style="font-weight:600; color:#1e293b;">4,200 TEU</div>
            <div style="color:#64748b;">IMO</div><div style="font-weight:600; color:#1e293b;">9832741</div>
          </div>
          <div style="margin-top:6px; padding-top:4px; border-top:1px solid #e2e8f0; font-size:9px; color:#64748b;">
            ${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E · Voyage VYG-2025-0847
          </div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -18],
          className: 'ship-detail-tooltip',
          sticky: false,
        }
      );

    // Canal/Port markers with ETA details
    canalsPorts.forEach(cp => {
      const color = cp.congestionStatus === 'High' ? '#ef4444' : cp.congestionStatus === 'Medium' ? '#f59e0b' : '#22c55e';
      const markerIcon = L.divIcon({
        className: 'canal-marker',
        html: `
          <div style="position:relative; width:28px; height:28px;">
            <div style="position:absolute; inset:0; background:${color}20; border:2px solid ${color}; border-radius:50%; animation: pulse-ring 2.5s ease-out infinite;"></div>
            <div style="position:absolute; inset:5px; background:${color}; border-radius:50%;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Calculate a fake expected date based on ETA string
      const etaDate = getExpectedDate(cp.eta);

      const marker = L.marker([cp.position.lat, cp.position.lng], { icon: markerIcon })
        .addTo(map)
        .bindTooltip(
          `<div style="min-width:180px;">
            <div style="font-weight:700; font-size:12px; margin-bottom:4px;">${cp.name}</div>
            <div style="display:flex; gap:6px; margin-bottom:4px;">
              <span style="background:${color}20; color:${color}; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:600;">${cp.type.toUpperCase()}</span>
              <span style="background:${color}20; color:${color}; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:600;">${cp.congestionStatus} Traffic</span>
            </div>
            <div style="font-size:10px; color:#475569; margin-bottom:2px;">Expected: <b>${etaDate}</b></div>
            <div style="font-size:10px; color:#475569; margin-bottom:2px;">ETA: <b>${cp.eta}</b> | Dist: <b>${cp.distance}</b></div>
            <div style="font-size:10px; color:#475569; margin-bottom:2px;">Queue: <b>${cp.queueLength} vessels</b></div>
            <div style="font-size:10px; color:#475569;">Security: <b>${cp.securityLevel}</b></div>
            ${cp.requiresBidding ? '<div style="font-size:9px; color:#2563eb; font-weight:600; margin-top:4px;">Bidding: $' + (cp.currentBidRange.min / 1000).toFixed(0) + 'k - $' + (cp.currentBidRange.max / 1000).toFixed(0) + 'k</div>' : ''}
          </div>`,
          {
            direction: 'top',
            offset: [0, -14],
            className: 'canal-tooltip-detailed',
          }
        );

      // Permanent small label with ETA
      L.marker([cp.position.lat, cp.position.lng], {
        icon: L.divIcon({
          className: 'canal-eta-label',
          html: `<div style="background:white; border:1px solid #e2e8f0; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:600; color:#475569; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.1);">${cp.eta}</div>`,
          iconSize: [60, 16],
          iconAnchor: [30, -8],
        }),
      }).addTo(map);

      if (onCanalClick) {
        marker.on('click', () => onCanalClick(cp));
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng]);

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
        .ship-detail-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 11px !important;
          color: #475569 !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
          max-width: 280px !important;
        }
        .ship-detail-tooltip::before { display: none !important; }
        .canal-tooltip-detailed {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 11px !important;
          color: #475569 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
          max-width: 250px !important;
        }
        .canal-tooltip-detailed::before { display: none !important; }
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

function getExpectedDate(eta: string): string {
  const now = new Date();
  let hoursToAdd = 0;
  const dayMatch = eta.match(/(\d+)d/);
  const hourMatch = eta.match(/(\d+)h/);
  if (dayMatch) hoursToAdd += parseInt(dayMatch[1]) * 24;
  if (hourMatch) hoursToAdd += parseInt(hourMatch[1]);
  const expected = new Date(now.getTime() + hoursToAdd * 3600000);
  return expected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + expected.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
}

export default VoyageMap;
