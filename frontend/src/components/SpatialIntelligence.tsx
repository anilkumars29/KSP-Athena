import React from 'react';
import { MapPinned } from 'lucide-react';
import { HotspotMap } from './HotspotMap';

export const SpatialIntelligence: React.FC = () => (
    <section aria-labelledby="spatial-title">
        <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPinned size={28} />
            <div>
                <h2 id="spatial-title">SPATIAL INTELLIGENCE & EARLY WARNINGS</h2>
                <p style={{ margin: 0, fontWeight: 700 }}>
                    Live recorded incident distribution with explainable concentration rules and transparent coordinate coverage.
                </p>
            </div>
        </div>
        <HotspotMap detailed />
    </section>
);
