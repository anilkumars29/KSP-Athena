import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Database, MapPinned, UsersRound } from 'lucide-react';
import { authFetch } from '../api';

const AGE_BANDS = ['Under 18', '18–24', '25–34', '35–44', '45–59', '60+', 'Unknown'];
const COLORS = ['#60A5FA', '#4ADE80', '#FFE600', '#FB923C', '#FB7185', '#C084FC', '#94A3B8'];

interface InsightsData {
    periodMonths: number;
    division: string;
    availableDivisions: string[];
    ageDistribution: Array<{ name: string; count: number }>;
    crimeTypes: Array<{ name: string; count: number }>;
    divisionDistribution: Array<{ name: string; count: number }>;
    crimeAgeMatrix: Array<{ crimeType: string; total: number; bands: Record<string, number> }>;
    recordedShareSignals: Array<{
        crimeType: string;
        ageBand: string;
        observedCases: number;
        crimeTypeKnownAgeCases: number;
        recordedSharePercent: number;
        overallSharePercent: number;
        representationIndex: number;
        explanation: string;
    }>;
    coverage: {
        retrievedRecords: number;
        validDateRecords: number;
        periodRecords: number;
        filteredRecords: number;
        ageKnownRecords: number;
        ageUnknownRecords: number;
        divisionKnownRecords: number;
        pincodeKnownRecords: number;
        recordCapReached: boolean;
        rangeStart: string;
        rangeEnd: string;
    };
    unavailableDimensions: string[];
    method: string;
}

export const SociologicalInsights: React.FC = () => {
    const [period, setPeriod] = useState(12);
    const [division, setDivision] = useState('All Divisions');
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInsights = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await authFetch(
                    `/sociological-insights?period=${period}&division=${encodeURIComponent(division)}`
                );
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to generate sociological insights.');
                }
                setData(result.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to generate sociological insights.');
            } finally {
                setLoading(false);
            }
        };
        loadInsights();
    }, [period, division]);

    if (loading) return <div className="nb-card processing-state"><span className="loading-spinner" /> CALCULATING RECORDED SOCIAL PATTERNS...</div>;
    if (error || !data) return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>SOCIOLOGICAL INSIGHTS ERROR: {error}</div>;

    const ageCoverage = data.coverage.filteredRecords
        ? Math.round((data.coverage.ageKnownRecords / data.coverage.filteredRecords) * 100)
        : 0;
    const divisionCoverage = data.coverage.filteredRecords
        ? Math.round((data.coverage.divisionKnownRecords / data.coverage.filteredRecords) * 100)
        : 0;

    return (
        <section aria-labelledby="social-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UsersRound size={28} />
                <div>
                    <h2 id="social-title">SOCIOLOGICAL CRIME INSIGHTS</h2>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                        Descriptive victim-age and geographic composition. Recorded differences do not establish social causation.
                    </p>
                </div>
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'end' }}>
                <label style={{ fontWeight: 900 }}>
                    ANALYSIS PERIOD
                    <select aria-label="Sociological analysis period" value={period} onChange={event => setPeriod(Number(event.target.value))}>
                        <option value={6}>Last 6 months</option>
                        <option value={12}>Last 12 months</option>
                        <option value={24}>Last 24 months</option>
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    DIVISION
                    <select aria-label="Sociological division" value={division} onChange={event => setDivision(event.target.value)}>
                        <option value="All Divisions">All Divisions</option>
                        {data.availableDivisions.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
            </div>

            {data.coverage.recordCapReached && (
                <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>
                    Coverage limit reached: insights use the 300 most recent records.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Records analysed', value: data.coverage.filteredRecords, icon: <Database size={20} /> },
                    { label: 'Known victim age', value: `${ageCoverage}%`, icon: <UsersRound size={20} /> },
                    { label: 'Known division', value: `${divisionCoverage}%`, icon: <MapPinned size={20} /> },
                    { label: 'Share signals', value: data.recordedShareSignals.length, icon: <AlertTriangle size={20} /> }
                ].map(card => (
                    <div className="nb-card" key={card.label} style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>{card.label.toUpperCase()}{card.icon}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 950 }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
                <div className="nb-card">
                    <h3>VICTIM AGE COMPOSITION</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.ageDistribution}>
                                <CartesianGrid stroke="#bbb" strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Cases" stroke="#000" strokeWidth={2}>
                                    {data.ageDistribution.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontWeight: 700 }}>“Unknown” remains visible; missing ages are not silently removed.</p>
                </div>

                <div className="nb-card">
                    <h3>RECORDED DIVISION DISTRIBUTION</h3>
                    {data.divisionDistribution.length === 0 ? <p>No division data is available.</p> : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={data.divisionDistribution} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid stroke="#bbb" strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={145} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Cases" fill="#FFE600" stroke="#000" strokeWidth={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            <div className="nb-card" style={{ overflowX: 'auto' }}>
                <h3>CRIME TYPE × VICTIM AGE CROSS-TAB</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
                    <thead style={{ background: '#000', color: '#fff' }}>
                        <tr>
                            <th style={{ padding: '0.55rem', textAlign: 'left' }}>Crime type</th>
                            {AGE_BANDS.map(band => <th key={band} style={{ padding: '0.55rem' }}>{band}</th>)}
                            <th style={{ padding: '0.55rem' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.crimeAgeMatrix.map(row => (
                            <tr key={row.crimeType}>
                                <td style={{ padding: '0.55rem', border: '1px solid #000', fontWeight: 800 }}>{row.crimeType}</td>
                                {AGE_BANDS.map(band => {
                                    const count = row.bands[band] || 0;
                                    const intensity = row.total ? count / row.total : 0;
                                    return (
                                        <td key={band} style={{ padding: '0.55rem', border: '1px solid #000', textAlign: 'center', background: count ? `rgba(255, 230, 0, ${0.25 + intensity * 0.75})` : '#fff' }}>
                                            {count}
                                        </td>
                                    );
                                })}
                                <td style={{ padding: '0.55rem', border: '1px solid #000', textAlign: 'center', fontWeight: 900 }}>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="nb-card">
                <h3>RECORDED-SHARE INDICATORS</h3>
                <p style={{ fontWeight: 700 }}>
                    Signals require at least three age-known records for a crime type and two observations in the highlighted age band.
                </p>
                {data.recordedShareSignals.length === 0 ? (
                    <p>No composition difference crossed the minimum evidence and 1.5× representation thresholds.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {data.recordedShareSignals.map(signal => (
                            <article key={`${signal.crimeType}-${signal.ageBand}`} style={{ border: '3px solid #000', padding: '0.75rem', background: '#fff7cc' }}>
                                <strong>{signal.crimeType} · {signal.ageBand}</strong>
                                <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>{signal.representationIndex}× recorded share</div>
                                <p>{signal.explanation}</p>
                                <code>{signal.observedCases}/{signal.crimeTypeKnownAgeCases} age-known records support this signal</code>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="nb-card" style={{ background: '#e2e8f0' }}>
                <h3>UNAVAILABLE SOCIAL DIMENSIONS</h3>
                <p style={{ fontWeight: 700 }}>No conclusion is generated for these dimensions because the current table has no supporting fields:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {data.unavailableDimensions.map(item => <span key={item} style={{ border: '2px solid #000', background: '#fff', padding: '0.35rem 0.55rem', fontWeight: 800 }}>{item}</span>)}
                </div>
            </div>

            <div className="nb-card" style={{ fontWeight: 700 }}>METHOD: {data.method}</div>
        </section>
    );
};
