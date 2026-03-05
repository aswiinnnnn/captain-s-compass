/**
 * Precipitation Canvas Overlay for Leaflet
 *
 * Renders a radar-like intensity field with adaptive opacity.
 * Palette: transparent → light blue → blue → dark blue → purple → magenta
 * Nonlinear scaling so even light rain is clearly visible.
 * Optional storm cell edges (bright outlines around moderate+ regions).
 */
import L from 'leaflet';
import type { WeatherPoint } from '@/hooks/useMapWeather';

// Precipitation color stops: [threshold_mm, r, g, b, opacity]
// More aggressive coloring — dark blue starts at just 0.5mm
const PRECIP_STOPS: [number, number, number, number, number][] = [
    [0.00, 0, 0, 0, 0.00],   // transparent
    [0.05, 186, 230, 253, 0.30],    // very pale blue (trace)
    [0.20, 125, 211, 252, 0.38],    // light blue (drizzle)
    [0.50, 59, 130, 246, 0.48],    // blue (light rain)
    [1.00, 37, 99, 235, 0.55],    // darker blue (rain)
    [2.00, 29, 78, 216, 0.60],    // dark blue (moderate)
    [5.00, 109, 40, 217, 0.65],    // purple (heavy)
    [10.0, 168, 38, 211, 0.68],    // magenta (very heavy)
    [25.0, 220, 38, 127, 0.72],    // hot pink (extreme)
];

interface GridIndex {
    lats: number[];
    lngs: number[];
    values: Map<string, number>;
}

function buildGridIndex(points: WeatherPoint[]): GridIndex {
    const lats = [...new Set(points.map(p => p.lat))].sort((a, b) => a - b);
    const lngs = [...new Set(points.map(p => p.lng))].sort((a, b) => a - b);
    const values = new Map<string, number>();
    points.forEach(p => values.set(`${p.lat},${p.lng}`, p.value));
    return { lats, lngs, values };
}

/** Normalize longitude into the grid's range, handling map wrapping */
function normalizeLng(lng: number, lngs: number[]): number {
    const lo = lngs[0];
    const hi = lngs[lngs.length - 1];
    let n = ((lng + 180) % 360 + 360) % 360 - 180;
    if (n < lo) n = lo;
    if (n > hi) n = hi;
    return n;
}

function bilinearInterpolate(grid: GridIndex, lat: number, lng: number): number | null {
    const { lats, lngs, values } = grid;
    const clampedLat = Math.max(lats[0], Math.min(lats[lats.length - 1], lat));
    const clampedLng = normalizeLng(lng, lngs);

    let li = -1;
    for (let i = 0; i < lats.length - 1; i++) {
        if (clampedLat >= lats[i] && clampedLat <= lats[i + 1]) { li = i; break; }
    }
    let lj = -1;
    for (let j = 0; j < lngs.length - 1; j++) {
        if (clampedLng >= lngs[j] && clampedLng <= lngs[j + 1]) { lj = j; break; }
    }
    if (li < 0 || lj < 0) return null;

    const lat0 = lats[li], lat1 = lats[li + 1];
    const lng0 = lngs[lj], lng1 = lngs[lj + 1];
    const v00 = values.get(`${lat0},${lng0}`);
    const v10 = values.get(`${lat1},${lng0}`);
    const v01 = values.get(`${lat0},${lng1}`);
    const v11 = values.get(`${lat1},${lng1}`);
    if (v00 == null || v10 == null || v01 == null || v11 == null) return null;

    const ty = (clampedLat - lat0) / (lat1 - lat0);
    const tx = (clampedLng - lng0) / (lng1 - lng0);
    return v00 * (1 - tx) * (1 - ty) + v01 * tx * (1 - ty) + v10 * (1 - tx) * ty + v11 * tx * ty;
}

function precipToColor(mm: number): [number, number, number, number] {
    if (mm <= 0) return [0, 0, 0, 0];
    for (let i = PRECIP_STOPS.length - 1; i >= 0; i--) {
        if (mm >= PRECIP_STOPS[i][0]) {
            if (i === PRECIP_STOPS.length - 1) {
                const [, r, g, b, a] = PRECIP_STOPS[i];
                return [r, g, b, a];
            }
            const [t0, r0, g0, b0, a0] = PRECIP_STOPS[i];
            const [t1, r1, g1, b1, a1] = PRECIP_STOPS[i + 1];
            // Sqrt for nonlinear interpolation — makes light rain more visible
            const f = Math.sqrt((mm - t0) / (t1 - t0));
            return [
                Math.round(r0 + (r1 - r0) * f),
                Math.round(g0 + (g1 - g0) * f),
                Math.round(b0 + (b1 - b0) * f),
                a0 + (a1 - a0) * f,
            ];
        }
    }
    return [0, 0, 0, 0];
}

export interface PrecipLayerOptions {
    showStormEdges?: boolean;
}

export function createPrecipitationLayer(
    points: WeatherPoint[],
    allTempPoints: WeatherPoint[],
    options: PrecipLayerOptions = {}
): L.GridLayer {
    const { showStormEdges = true } = options;

    // Build full coverage grid — use all temp grid positions, fill precip=0
    const precipMap = new Map<string, number>();
    points.forEach(p => precipMap.set(`${p.lat},${p.lng}`, p.value));

    const fullPoints: WeatherPoint[] = allTempPoints.map(tp => ({
        lat: tp.lat,
        lng: tp.lng,
        value: precipMap.get(`${tp.lat},${tp.lng}`) ?? 0,
    }));

    const grid = buildGridIndex(fullPoints);

    const PrecipGridLayer = L.GridLayer.extend({
        createTile(coords: L.Coords) {
            const tile = document.createElement('canvas') as HTMLCanvasElement;
            const size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;
            const ctx = tile.getContext('2d')!;

            const step = 4;
            const w = Math.ceil(size.x / step);
            const h = Math.ceil(size.y / step);
            const imgData = ctx.createImageData(w, h);
            const valGrid: (number | null)[] = new Array(w * h).fill(null);

            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const point = (this as any)._map.unproject(
                        L.point(coords.x * size.x + px * step, coords.y * size.y + py * step),
                        coords.z
                    );

                    const val = bilinearInterpolate(grid, point.lat, point.lng);
                    const idx = py * w + px;
                    valGrid[idx] = val;

                    if (val != null && val > 0.02) {
                        const [r, g, b, a] = precipToColor(val);
                        const i = idx * 4;
                        imgData.data[i] = r;
                        imgData.data[i + 1] = g;
                        imgData.data[i + 2] = b;
                        imgData.data[i + 3] = Math.round(a * 255);
                    }
                }
            }

            // Draw scaled
            const offCanvas = document.createElement('canvas');
            offCanvas.width = w;
            offCanvas.height = h;
            offCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(offCanvas, 0, 0, size.x, size.y);

            // Storm cell edges: bright outlines around moderate+ (>=1mm) regions
            if (showStormEdges) {
                ctx.strokeStyle = 'rgba(147, 130, 250, 0.6)';
                ctx.lineWidth = 1.4;
                const threshold = 1.0;  // lowered from 2.0 so edges show more often
                for (let py = 1; py < h - 1; py++) {
                    for (let px = 1; px < w - 1; px++) {
                        const v = valGrid[py * w + px];
                        if (v == null || v < threshold) continue;
                        const neighbors = [
                            valGrid[(py - 1) * w + px],
                            valGrid[(py + 1) * w + px],
                            valGrid[py * w + px - 1],
                            valGrid[py * w + px + 1],
                        ];
                        const isEdge = neighbors.some(n => n == null || n < threshold);
                        if (isEdge) {
                            const cx = (px + 0.5) * (size.x / w);
                            const cy = (py + 0.5) * (size.y / h);
                            ctx.beginPath();
                            ctx.arc(cx, cy, size.x / w / 2, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }
            }

            return tile;
        },
    });

    return new (PrecipGridLayer as any)({
        tileSize: 256,
        opacity: 1,
        className: 'precipitation-overlay-tile',
    });
}

/** Legend bin data for the precipitation legend */
export const PRECIP_LEGEND_BINS = [
    { label: '0', color: 'rgba(200,200,200,0.15)' },
    { label: '0.2', color: 'rgba(125,211,252,0.5)' },
    { label: '0.5', color: 'rgba(59,130,246,0.6)' },
    { label: '1', color: 'rgba(37,99,235,0.7)' },
    { label: '2', color: 'rgba(29,78,216,0.75)' },
    { label: '5+', color: 'rgba(109,40,217,0.8)' },
    { label: '10+', color: 'rgba(168,38,211,0.85)' },
];
