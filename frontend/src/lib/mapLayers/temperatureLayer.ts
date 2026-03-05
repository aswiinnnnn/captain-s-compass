/**
 * Temperature Canvas Overlay for Leaflet
 *
 * Renders a smooth, continuous thermal raster using bilinear interpolation
 * across the global weather grid (~500 points).
 *
 * Palette: deep indigo → blue → cyan → yellow → orange → red
 * Opacity: 25–30% (light enough to see coastlines and labels)
 * Optional isotherm contour lines every 2°C
 */
import L from 'leaflet';
import type { WeatherPoint } from '@/hooks/useMapWeather';

// Perceptually uniform, colorblind-safe thermal palette
const THERMAL_STOPS: [number, number, number, number][] = [
    [0.00, 49, 46, 129],  // deep indigo  (-40°C)
    [0.15, 30, 64, 175],  // blue         (-25°C)
    [0.30, 6, 182, 212],  // cyan         (-10°C)
    [0.45, 34, 197, 94],  // green        ( 5°C)
    [0.55, 250, 204, 21],  // yellow       (15°C)
    [0.70, 249, 115, 22],  // orange       (25°C)
    [0.85, 220, 38, 38],  // red          (35°C)
    [1.00, 153, 27, 27],  // dark red     (45°C)
];

const T_MIN = -40;
const T_MAX = 45;

function lerpColor(t: number): [number, number, number] {
    const clamped = Math.max(0, Math.min(1, t));
    for (let i = 0; i < THERMAL_STOPS.length - 1; i++) {
        const [s0, r0, g0, b0] = THERMAL_STOPS[i];
        const [s1, r1, g1, b1] = THERMAL_STOPS[i + 1];
        if (clamped >= s0 && clamped <= s1) {
            const f = (clamped - s0) / (s1 - s0);
            return [
                Math.round(r0 + (r1 - r0) * f),
                Math.round(g0 + (g1 - g0) * f),
                Math.round(b0 + (b1 - b0) * f),
            ];
        }
    }
    const last = THERMAL_STOPS[THERMAL_STOPS.length - 1];
    return [last[1], last[2], last[3]];
}

function tempToColor(tempC: number): [number, number, number] {
    const normalized = (tempC - T_MIN) / (T_MAX - T_MIN);
    return lerpColor(normalized);
}

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

/**
 * Normalize longitude into the grid's lng range, handling map wrapping.
 * When the user zooms out, Leaflet can produce lng values like 200°, -250°, etc.
 */
function normalizeLng(lng: number, lngs: number[]): number {
    const lo = lngs[0];
    const hi = lngs[lngs.length - 1];
    // Wrap into -180..180 first
    let n = ((lng + 180) % 360 + 360) % 360 - 180;
    // If still outside our grid, clamp
    if (n < lo) n = lo;
    if (n > hi) n = hi;
    return n;
}

function bilinearInterpolate(grid: GridIndex, lat: number, lng: number): number | null {
    const { lats, lngs, values } = grid;

    // Clamp latitude to grid bounds
    const clampedLat = Math.max(lats[0], Math.min(lats[lats.length - 1], lat));
    // Wrap longitude into grid range
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

    return (
        v00 * (1 - tx) * (1 - ty) +
        v01 * tx * (1 - ty) +
        v10 * (1 - tx) * ty +
        v11 * tx * ty
    );
}

export interface TemperatureLayerOptions {
    showContours?: boolean;
    opacity?: number;
}

export function createTemperatureLayer(
    points: WeatherPoint[],
    options: TemperatureLayerOptions = {}
): L.GridLayer {
    const { showContours = true, opacity = 0.28 } = options;
    const grid = buildGridIndex(points);

    const TempGridLayer = L.GridLayer.extend({
        createTile(coords: L.Coords) {
            const tile = document.createElement('canvas') as HTMLCanvasElement;
            const size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;
            const ctx = tile.getContext('2d')!;

            const step = 4; // render every 4th pixel for performance
            const w = Math.ceil(size.x / step);
            const h = Math.ceil(size.y / step);
            const imgData = ctx.createImageData(w, h);
            const valGrid: (number | null)[] = new Array(w * h).fill(null);

            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const point = (this as any)._map.unproject(
                        L.point(
                            coords.x * size.x + px * step,
                            coords.y * size.y + py * step
                        ),
                        coords.z
                    );

                    const val = bilinearInterpolate(grid, point.lat, point.lng);
                    const idx = py * w + px;
                    valGrid[idx] = val;

                    if (val != null) {
                        const [r, g, b] = tempToColor(val);
                        const i = idx * 4;
                        imgData.data[i] = r;
                        imgData.data[i + 1] = g;
                        imgData.data[i + 2] = b;
                        imgData.data[i + 3] = Math.round(opacity * 255);
                    }
                }
            }

            // Draw scaled color field with smooth upscaling
            const offCanvas = document.createElement('canvas');
            offCanvas.width = w;
            offCanvas.height = h;
            offCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(offCanvas, 0, 0, size.x, size.y);

            // Draw contour lines every 2°C
            if (showContours) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 0.6;
                const contourInterval = 2;
                for (let py = 0; py < h - 1; py++) {
                    for (let px = 0; px < w - 1; px++) {
                        const v = valGrid[py * w + px];
                        const vr = valGrid[py * w + px + 1];
                        const vb = valGrid[(py + 1) * w + px];
                        if (v == null) continue;

                        const cx = (px + 0.5) * (size.x / w);
                        const cy = (py + 0.5) * (size.y / h);

                        if (vr != null && Math.floor(v / contourInterval) !== Math.floor(vr / contourInterval)) {
                            ctx.beginPath();
                            ctx.moveTo(cx, cy - 2);
                            ctx.lineTo(cx, cy + 2);
                            ctx.stroke();
                        }
                        if (vb != null && Math.floor(v / contourInterval) !== Math.floor(vb / contourInterval)) {
                            ctx.beginPath();
                            ctx.moveTo(cx - 2, cy);
                            ctx.lineTo(cx + 2, cy);
                            ctx.stroke();
                        }
                    }
                }
            }

            return tile;
        },
    });

    return new (TempGridLayer as any)({
        tileSize: 256,
        opacity: 1,
        className: 'temperature-overlay-tile',
    });
}

/** Returns a gradient CSS string for the temperature legend */
export function getTemperatureLegendGradient(): string {
    const colors = THERMAL_STOPS.map(
        ([, r, g, b]) => `rgb(${r},${g},${b})`
    );
    return `linear-gradient(to top, ${colors.join(', ')})`;
}

export const TEMP_LEGEND_LABELS = [
    { pos: '0%', label: `${T_MIN}°` },
    { pos: '25%', label: `${T_MIN + (T_MAX - T_MIN) * 0.25}°` },
    { pos: '50%', label: `${T_MIN + (T_MAX - T_MIN) * 0.5}°` },
    { pos: '75%', label: `${T_MIN + (T_MAX - T_MIN) * 0.75}°` },
    { pos: '100%', label: `${T_MAX}°` },
];
