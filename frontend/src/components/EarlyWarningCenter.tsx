import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CircleAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../api';

type AlertSeverity = 'HIGH' | 'MEDIUM' | 'ADVISORY';
type WarningAlert = {
    id: string;
    category: 'SPATIAL_SURGE' | 'NETWORK_ACTIVITY' | 'REPEAT_ASSOCIATION' | 'FORECAST_RISE';
    severity: AlertSeverity;
    title: string;
    summary: string;
    location: string;
    evidenceCrimeNos: string[];
    evidence: string[];
    whyTriggered: string;
    recommendedChecks: string[];
    limitation: string;
};
type WarningData = {
    alerts: WarningAlert[];
    summary: {
        total: number;
        high: number;
        medium: number;
        advisory: number;
        byCategory: Record<string, number>;
    };
    coverage: {
        recordsReviewed: number;
        recordCapReached: boolean;
        analysisAsOf: string;
        spatialAlertsEvaluated: number;
        profilesEvaluated: number;
        networksEvaluated: number;
        forecastSufficiency: string;
    };
    method: string;
};

const categoryLabels: Record<WarningAlert['category'], string> = {
    SPATIAL_SURGE: 'Spatial surge',
    NETWORK_ACTIVITY: 'Network activity',
    REPEAT_ASSOCIATION: 'Repeat association',
    FORECAST_RISE: 'Forecast rise'
};

const severityColor: Record<AlertSeverity, string> = {
    HIGH: '#f87171',
    MEDIUM: '#fdba74',
    ADVISORY: '#93c5fd'
};

export const EarlyWarningCenter: React.FC = () => {
    const role = localStorage.getItem('ksp_role') || '';
    const [data, setData] = useState<WarningData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [severity, setSeverity] = useState('ALL');
    const [category, setCategory] = useState('ALL');

    useEffect(() => {
        if (!['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role)) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await authFetch('/early-warnings', { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error || 'Early-warning intelligence could not be loaded.');
                setData(result.data);
            } catch (loadError) {
                if ((loadError as Error).name !== 'AbortError') {
                    setError(loadError instanceof Error ? loadError.message : 'Early-warning intelligence could not be loaded.');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [refreshKey, role]);

    const filteredAlerts = useMemo(() => (data?.alerts || []).filter(alert =>
        (severity === 'ALL' || alert.severity === severity) &&
        (category === 'ALL' || alert.category === category)
    ), [category, data, severity]);

    if (!['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role)) {
        return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>ACCESS DENIED: Early-warning intelligence requires the Investigator, Analyst, or Supervisor role.</div>;
    }
    if (loading) return <div className="nb-card processing-state"><span className="loading-spinner" /> EVALUATING LIVE WARNING RULES...</div>;
    if (error || !data) return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>EARLY WARNING ERROR: {error}</div>;

    return (
        <section aria-labelledby="warning-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card" style={{ background: '#FFE600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BellRing size={32} />
                    <div>
                        <h2 id="warning-title" style={{ margin: 0 }}>EARLY WARNING INTELLIGENCE CENTER</h2>
                        <p style={{ margin: '0.35rem 0 0', fontWeight: 700 }}>Prioritized, explainable signals from live recorded FIR data. Human verification is required before operational action.</p>
                    </div>
                </div>
                <button className="nb-button" type="button" onClick={() => setRefreshKey(key => key + 1)}><RefreshCw size={16} /> REFRESH SIGNALS</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
                {[
                    ['Total alerts', data.summary.total, '#FFE600'],
                    ['High', data.summary.high, severityColor.HIGH],
                    ['Medium', data.summary.medium, severityColor.MEDIUM],
                    ['FIRs reviewed', data.coverage.recordsReviewed, '#dbeafe']
                ].map(([label, value, color]) => (
                    <div className="nb-card" key={label} style={{ background: color as string, borderLeft: '10px solid #000' }}>
                        <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem' }}>{label}</div>
                        <div style={{ fontWeight: 900, fontSize: '2.2rem' }}>{value}</div>
                    </div>
                ))}
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <label style={{ fontWeight: 800 }}>Severity
                    <select className="nb-input" value={severity} onChange={event => setSeverity(event.target.value)}>
                        <option value="ALL">All severities</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="ADVISORY">Advisory</option>
                    </select>
                </label>
                <label style={{ fontWeight: 800 }}>Signal type
                    <select className="nb-input" value={category} onChange={event => setCategory(event.target.value)}>
                        <option value="ALL">All signal types</option>
                        {(Object.keys(categoryLabels) as WarningAlert['category'][]).map(key => <option value={key} key={key}>{categoryLabels[key]}</option>)}
                    </select>
                </label>
                <div style={{ alignSelf: 'end', fontWeight: 800, paddingBottom: '0.65rem' }}>
                    Showing {filteredAlerts.length} of {data.alerts.length} live alerts
                </div>
            </div>

            {data.coverage.recordCapReached && <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>Coverage limit reached: rules evaluated the 300 most recent FIR records.</div>}

            {filteredAlerts.length === 0 ? (
                <div className="nb-card" style={{ fontWeight: 800 }}>No live signal matches the selected filters.</div>
            ) : filteredAlerts.map(alert => (
                <article className="nb-card" key={alert.id} style={{ borderLeft: `14px solid ${severityColor[alert.severity]}`, padding: 0, overflow: 'hidden' }}>
                    <div style={{ background: severityColor[alert.severity], borderBottom: '3px solid #000', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <strong>{alert.severity} · {categoryLabels[alert.category]}</strong>
                        <strong>{alert.id}</strong>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>{alert.title}</h3>
                        <p style={{ fontWeight: 700 }}>{alert.summary}</p>
                        <p><strong>Area:</strong> {alert.location}</p>
                        <div style={{ background: '#f3f4f6', border: '2px solid #000', padding: '0.75rem' }}>
                            <strong>Why this rule fired</strong>
                            <p style={{ marginBottom: 0 }}>{alert.whyTriggered}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <h4>Recorded evidence</h4>
                                {alert.evidenceCrimeNos.length > 0 && <p><strong>FIRs:</strong> {alert.evidenceCrimeNos.join(', ')}</p>}
                                <ul>{alert.evidence.map(item => <li key={item}>{item}</li>)}</ul>
                            </div>
                            <div>
                                <h4>Recommended verification</h4>
                                <ol>{alert.recommendedChecks.map(item => <li key={item}>{item}</li>)}</ol>
                            </div>
                        </div>
                        <p style={{ background: '#dbeafe', border: '2px solid #000', padding: '0.65rem', fontWeight: 700 }}><CircleAlert size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{alert.limitation}</p>
                    </div>
                </article>
            ))}

            <div className="nb-card" style={{ background: '#dbeafe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}><ShieldCheck size={20} /> RULES, COVERAGE AND ACCOUNTABILITY</div>
                <p style={{ fontWeight: 700 }}>{data.method}</p>
                <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                    Analysis time: {new Date(data.coverage.analysisAsOf).toLocaleString()} · Forecast data: {data.coverage.forecastSufficiency} · Networks reviewed: {data.coverage.networksEvaluated} · Profiles reviewed: {data.coverage.profilesEvaluated}
                </p>
            </div>
        </section>
    );
};
