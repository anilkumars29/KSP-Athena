import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertTriangle, CheckCircle2, Database, MapPin, Radar } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { authFetch } from '../api';

interface Hotspot {
    pincode: string;
    lat: number;
    lng: number;
    area: string;
    totalCases: number;
    recent30Count: number;
    breakdown: Record<string, number>;
    crimeNos: string[];
    mappingSources: string[];
    lastIncidentAt: string | null;
}

interface SpatialAlert {
    id: string;
    rule: 'RECENT_SURGE' | 'REPEAT_CONCENTRATION';
    severity: 'HIGH' | 'MEDIUM';
    title: string;
    summary: string;
    pincode: string | null;
    division: string;
    crimeType: string;
    current30Count: number;
    previous30Count: number;
    evidence: Array<{ crimeNo: string; registeredAt: string }>;
    explanation: string;
}

interface Coverage {
    totalRecords: number;
    mappedRecords: number;
    unmappedRecords: number;
    directCoordinateRecords: number;
    samePincodeCentroidRecords: number;
    fallbackPincodeRecords: number;
    mappedAreas: number;
    recordCapReached: boolean;
    analysisAsOf: string;
    alertWindow: string;
}

export const HotspotMap: React.FC<{ detailed?: boolean }> = ({ detailed = false }) => {
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [alerts, setAlerts] = useState<SpatialAlert[]>([]);
    const [coverage, setCoverage] = useState<Coverage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHotspots = async () => {
            try {
                const response = await authFetch('/spatial-hotspots');
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to retrieve spatial case data.');
                }
                setHotspots(result.data || []);
                setAlerts(result.alerts || []);
                setCoverage(result.coverage || null);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to retrieve spatial case data.');
            } finally {
                setLoading(false);
            }
        };
        fetchHotspots();
    }, []);

    if (loading) {
        return <div className="nb-card processing-state"><span className="loading-spinner" /> CALIBRATING SPATIAL DATA...</div>;
    }
    if (error) {
        return <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>LIVE MAP ERROR: {error}</div>;
    }

    const center: [number, number] = hotspots.length
        ? [
            hotspots.reduce((sum, spot) => sum + spot.lat, 0) / hotspots.length,
            hotspots.reduce((sum, spot) => sum + spot.lng, 0) / hotspots.length
        ]
        : [12.9716, 77.5946];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {detailed && coverage && (
                <>
                    {coverage.recordCapReached && (
                        <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>
                            Coverage limit reached: this operational view uses the 300 most recent records.
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        {[
                            { label: 'Records retrieved', value: coverage.totalRecords, icon: <Database size={20} /> },
                            { label: 'Records mapped', value: coverage.mappedRecords, icon: <MapPin size={20} /> },
                            { label: 'Mapped areas', value: coverage.mappedAreas, icon: <Radar size={20} /> },
                            { label: 'Rule alerts', value: alerts.length, icon: <AlertTriangle size={20} /> }
                        ].map(card => (
                            <div className="nb-card" key={card.label} style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>{card.label.toUpperCase()}{card.icon}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 950 }}>{card.value}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="nb-card" style={{ padding: 0, overflow: 'hidden', border: '4px solid #000', marginTop: detailed ? 0 : '1rem', backgroundColor: '#fff' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Observed Incident Distribution</span>
                    <span style={{ color: '#FFE600' }}>REGISTERED CASES · NOT A FORECAST</span>
                </div>
                <MapContainer center={center} zoom={hotspots.length > 6 ? 7 : 11} style={{ height: detailed ? '500px' : '350px', width: '100%', zIndex: 0 }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                    {hotspots.map(spot => (
                        <CircleMarker
                            key={`${spot.pincode}-${spot.lat}-${spot.lng}`}
                            center={[spot.lat, spot.lng]}
                            radius={Math.min(40, Math.max(9, 7 + Math.sqrt(spot.totalCases) * 5))}
                            pathOptions={{ color: '#000', fillColor: '#FFE600', fillOpacity: 0.9, weight: 3 }}
                        >
                            <Popup>
                                <div style={{ color: '#000' }}>
                                    <strong style={{ fontSize: '1rem', display: 'block', borderBottom: '2px solid #000', paddingBottom: 4, marginBottom: 4, textTransform: 'uppercase' }}>
                                        {spot.area} ({spot.pincode})
                                    </strong>
                                    <div style={{ fontWeight: 800 }}>Total incidents: {spot.totalCases}</div>
                                    <div style={{ fontWeight: 800 }}>Latest 30 days: {spot.recent30Count}</div>
                                    <div style={{ fontSize: '0.75rem' }}>Mapping: {spot.mappingSources.join(', ')}</div>
                                    <ul style={{ paddingLeft: '1.2rem', margin: '4px 0 0', fontSize: '0.85rem' }}>
                                        {Object.entries(spot.breakdown).map(([crime, count]) => <li key={crime}>{crime}: {count}</li>)}
                                    </ul>
                                    <div style={{ fontSize: '0.72rem', marginTop: 4 }}>Crime Nos: {spot.crimeNos.join(', ')}</div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
                {hotspots.length === 0 && (
                    <div style={{ padding: '0.75rem', fontWeight: 800 }}>
                        No retrieved incidents contain usable coordinates or supported fallback pincodes.
                    </div>
                )}
                {coverage && (
                    <div style={{ padding: '0.5rem 0.75rem', borderTop: '2px solid #000', fontSize: '0.75rem', fontWeight: 700 }}>
                        Coverage: {coverage.mappedRecords}/{coverage.totalRecords} records mapped —
                        {' '}{coverage.directCoordinateRecords} direct coordinates,
                        {' '}{coverage.samePincodeCentroidRecords} same-pincode centroid,
                        {' '}{coverage.fallbackPincodeRecords} known-pincode fallback,
                        {' '}{coverage.unmappedRecords} excluded.
                    </div>
                )}
            </div>

            {detailed && (
                <div className="nb-card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} /> RULE-BASED EARLY WARNINGS
                    </h3>
                    <p style={{ fontWeight: 700 }}>
                        {coverage?.alertWindow}. These signals identify recorded concentrations; they do not predict an offender or future incident.
                    </p>
                    {alerts.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '2px solid #000', padding: '0.75rem', background: '#dcfce7', fontWeight: 800 }}>
                            <CheckCircle2 size={20} /> No area/crime-type group crossed the three-case alert threshold.
                        </div>
                    ) : alerts.map(alert => (
                        <article key={alert.id} style={{ border: '3px solid #000', padding: '0.9rem', marginTop: '0.8rem', background: alert.severity === 'HIGH' ? '#fca5a5' : '#fde68a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div>
                                    <strong>{alert.title.toUpperCase()} · {alert.crimeType}</strong>
                                    <div>{alert.division}{alert.pincode ? ` · ${alert.pincode}` : ''}</div>
                                </div>
                                <span style={{ background: '#000', color: '#fff', padding: '0.25rem 0.5rem', height: 'fit-content', fontWeight: 900 }}>{alert.severity}</span>
                            </div>
                            <p style={{ fontWeight: 750 }}>{alert.summary}</p>
                            <div>Latest 30 days: <strong>{alert.current30Count}</strong> · Preceding 30 days: <strong>{alert.previous30Count}</strong></div>
                            <p style={{ marginBottom: '0.35rem' }}>{alert.explanation}</p>
                            <code>SUPPORTING CRIME NOS: {alert.evidence.map(item => item.crimeNo).join(', ')}</code>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
