import React, { useEffect, useState } from 'react';
import {
    CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Activity, AlertTriangle, CalendarClock, Gauge, TrendingUp } from 'lucide-react';
import { authFetch } from '../api';

interface ForecastData {
    scope: { division: string; crimeType: string };
    availableDivisions: string[];
    availableCrimeTypes: string[];
    history: Array<{ key: string; label: string; count: number }>;
    forecast: Array<{ key: string; label: string; predicted: number; lower: number; upper: number }>;
    diagnostics: {
        sufficiency: 'INSUFFICIENT' | 'LIMITED' | 'ADEQUATE';
        totalHistoricalCases: number;
        monthsWithCases: number;
        baselineMonthlyVolume: number;
        recentSixMonthSlope: number;
        backtestMeanAbsoluteError: number | null;
        historyStart: string;
        historyEnd: string;
        forecastStart: string;
        recordCapReached: boolean;
    };
    method: string;
}

const sufficiencyColor = (value: string) =>
    value === 'ADEQUATE' ? '#4ade80' : value === 'LIMITED' ? '#fde047' : '#f87171';

export const CrimeForecast: React.FC = () => {
    const [historyMonths, setHistoryMonths] = useState(24);
    const [division, setDivision] = useState('All Divisions');
    const [crimeType, setCrimeType] = useState('All Crime Types');
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadForecast = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    historyMonths: String(historyMonths),
                    division,
                    crimeType
                });
                const response = await authFetch(`/crime-forecast?${params.toString()}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to generate crime forecast.');
                }
                setData(result.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to generate crime forecast.');
            } finally {
                setLoading(false);
            }
        };
        loadForecast();
    }, [historyMonths, division, crimeType]);

    if (loading) return <div className="nb-card processing-state"><span className="loading-spinner" /> CALCULATING TRANSPARENT FORECAST BASELINE...</div>;
    if (error || !data) return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>FORECAST ERROR: {error}</div>;

    const chartData = [
        ...data.history.slice(-12).map(item => ({
            label: item.label,
            actual: item.count,
            predicted: null,
            lower: null,
            upper: null
        })),
        ...data.forecast.map(item => ({
            label: item.label,
            actual: null,
            predicted: item.predicted,
            lower: item.lower,
            upper: item.upper
        }))
    ];
    const forecastBoundary = data.forecast[0]?.label;

    return (
        <section aria-labelledby="forecast-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp size={28} />
                <div>
                    <h2 id="forecast-title">TRANSPARENT AGGREGATE CRIME FORECAST</h2>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                        Three-month case-volume baseline with uncertainty and back-testing. No person-level prediction is performed.
                    </p>
                </div>
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <label style={{ fontWeight: 900 }}>
                    HISTORY
                    <select aria-label="Forecast history" value={historyMonths} onChange={event => setHistoryMonths(Number(event.target.value))}>
                        <option value={12}>12 months</option>
                        <option value={24}>24 months</option>
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    DIVISION
                    <select aria-label="Forecast division" value={division} onChange={event => setDivision(event.target.value)}>
                        <option value="All Divisions">All Divisions</option>
                        {data.availableDivisions.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    CRIME TYPE
                    <select aria-label="Forecast crime type" value={crimeType} onChange={event => setCrimeType(event.target.value)}>
                        <option value="All Crime Types">All Crime Types</option>
                        {data.availableCrimeTypes.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
            </div>

            {data.diagnostics.recordCapReached && (
                <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>
                    Coverage limit reached: the forecast uses the 300 most recent records.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Data sufficiency', value: data.diagnostics.sufficiency, icon: <Gauge size={20} />, color: sufficiencyColor(data.diagnostics.sufficiency) },
                    { label: 'Historical cases', value: data.diagnostics.totalHistoricalCases, icon: <Activity size={20} /> },
                    { label: 'Months with cases', value: data.diagnostics.monthsWithCases, icon: <CalendarClock size={20} /> },
                    { label: 'Back-test MAE', value: data.diagnostics.backtestMeanAbsoluteError ?? 'Unavailable', icon: <TrendingUp size={20} /> }
                ].map(card => (
                    <div className="nb-card" key={card.label} style={{ marginBottom: 0, background: card.color || '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>{card.label.toUpperCase()}{card.icon}</div>
                        <div style={{ fontSize: typeof card.value === 'string' && card.value.length > 10 ? '1.25rem' : '2rem', fontWeight: 950 }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {data.diagnostics.sufficiency === 'INSUFFICIENT' ? (
                <div className="nb-card" style={{ background: '#fca5a5' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20} /> FORECAST REFUSED</h3>
                    <p style={{ fontWeight: 800 }}>
                        This scope needs at least six historical cases across three distinct months. Broaden the division, crime type, or history selection.
                    </p>
                </div>
            ) : (
                <>
                    <div className="nb-card">
                        <h3>HISTORICAL VOLUME & THREE-MONTH BASELINE</h3>
                        <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData}>
                                    <CartesianGrid stroke="#aaa" strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    {forecastBoundary && <ReferenceLine x={forecastBoundary} stroke="#ef4444" strokeDasharray="5 5" label="Forecast starts" />}
                                    <Line type="monotone" dataKey="actual" name="Recorded cases" stroke="#000" strokeWidth={3} connectNulls={false} />
                                    <Line type="monotone" dataKey="predicted" name="Forecast baseline" stroke="#eab308" strokeWidth={4} connectNulls={false} />
                                    <Line type="monotone" dataKey="lower" name="Lower range" stroke="#64748b" strokeDasharray="4 4" dot={false} />
                                    <Line type="monotone" dataKey="upper" name="Upper range" stroke="#64748b" strokeDasharray="4 4" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="nb-card">
                        <h3>FORECAST VALUES & UNCERTAINTY</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '1rem' }}>
                            {data.forecast.map(item => (
                                <div key={item.key} style={{ border: '3px solid #000', padding: '0.8rem', background: '#fff7cc' }}>
                                    <strong>{item.label}</strong>
                                    <div style={{ fontSize: '2rem', fontWeight: 950 }}>{item.predicted}</div>
                                    <div>Uncertainty range: {item.lower}–{item.upper} cases</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="nb-card">
                <h3>MODEL DIAGNOSTICS</h3>
                <p><strong>Weighted monthly baseline:</strong> {data.diagnostics.baselineMonthlyVolume}</p>
                <p><strong>Recent six-month slope:</strong> {data.diagnostics.recentSixMonthSlope} cases/month</p>
                <p><strong>Back-test mean absolute error:</strong> {data.diagnostics.backtestMeanAbsoluteError ?? 'Not enough observations'}</p>
                <p style={{ fontWeight: 700 }}>METHOD: {data.method}</p>
            </div>
        </section>
    );
};
