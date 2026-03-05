declare module 'leaflet-velocity' {
    import * as L from 'leaflet';

    interface VelocityLayerOptions extends L.LayerOptions {
        displayValues?: boolean;
        displayOptions?: {
            velocityType?: string;
            position?: string;
            emptyString?: string;
            speedUnit?: string;
            angleConvention?: string;
        };
        data?: any[];
        maxVelocity?: number;
        minVelocity?: number;
        velocityScale?: number;
        colorScale?: string[];
        lineWidth?: number;
        particleAge?: number;
        particleMultiplier?: number;
        frameRate?: number;
        opacity?: number;
    }

    export class velocityLayer extends L.Layer {
        constructor(options?: VelocityLayerOptions);
        setData(data: any[]): void;
    }

    export function velocityLayer(options?: VelocityLayerOptions): velocityLayer;
}
