// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Filter, AlertCircle, Clock, Scale, CheckCircle2, FileText, ListChecks } from 'lucide-react';
import { authFetch } from '../api';

interface DivisionCase {
    crimeNo: string;
    crimeType: string;
    caseStatus: string;
    registeredAt: string | null;
}

const formatCaseDate = (value: string | null) => {
    if (!value) return 'Date unavailable';
    const date = new Date(value.replace(' ', 'T'));
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
};

export const Dashboard: React.FC = () => {
    const [selectedDivision, setSelectedDivision] = useState('All Divisions');
    const [divisionsList, setDivisionsList] = useState(['All Divisions']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recordCapReached, setRecordCapReached] = useState(false);

    const [metrics, setMetrics] = useState({
        totalCases: 0,
        registered: 0,
        pending: 0,
        inCourt: 0,
        closed: 0
    });
    const [crimeBreakdown, setCrimeBreakdown] = useState<{ head: string, count: number, percent: string }[]>([]);
    const [divisionCases, setDivisionCases] = useState<DivisionCase[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await authFetch(`/dashboard-metrics?division=${encodeURIComponent(selectedDivision)}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to retrieve dashboard metrics.');
                }

                const data = result.data;
                setRecordCapReached(Boolean(data.recordCapReached));
                setDivisionsList([
                    'All Divisions',
                    ...(Array.isArray(data.availableDivisions) ? data.availableDivisions : [])
                ]);
                setMetrics({
                    totalCases: data.totalCases,
                    registered: data.statusCounts.registered,
                    pending: data.statusCounts.pending,
                    inCourt: data.statusCounts.inCourt,
                    closed: data.statusCounts.closed
                });
                setCrimeBreakdown(data.casesByType.map((item: any) => ({
                    head: item.name,
                    count: item.count,
                    percent: data.totalCases > 0
                        ? `${Math.round((item.count / data.totalCases) * 100)}%`
                        : '0%'
                })));
                setDivisionCases(Array.isArray(data.divisionCases) ? data.divisionCases : []);
            } catch (error) {
                console.error("Error fetching live metrics:", error);
                setError(error instanceof Error ? error.message : 'Unable to retrieve dashboard metrics.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [selectedDivision]);

    if (loading) {
        return <div className="nb-card processing-state"><span className="loading-spinner" /> SYNCING WITH CATALYST DATABASE...</div>;
    }

    if (error) {
        return <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171' }}>LIVE DATA ERROR: {error}</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {recordCapReached && (
                <div className="nb-card" role="status" style={{ backgroundColor: 'var(--nb-yellow)', fontWeight: 800 }}>
                    Showing metrics for the first 300 matching Catalyst records. Full-scale aggregation will require the OLAP reporting pipeline.
                </div>
            )}

            {/* Top Filter Bar */}
            <div className="nb-card yellow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Filter size={24} color="#000" />
                    <h3 style={{ margin: 0 }}>Jurisdiction Filter</h3>
                </div>
                <div style={{ minWidth: '300px' }}>
                    <select
                        className="nb-input"
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        style={{ fontWeight: 700, backgroundColor: '#fff' }}
                    >
                        {divisionsList.map((division) => (
                            <option key={division} value={division}>{division}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Aggregate Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>

                <div className="nb-card" style={{ borderLeft: '12px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>Total FIRs</span>
                        <FileText size={20} />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{metrics.totalCases}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{selectedDivision}</p>
                </div>

                <div className="nb-card" style={{ borderLeft: '12px solid #FFE600' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>Fresh Registered</span>
                        <AlertCircle size={20} />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{metrics.registered}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Action Required</p>
                </div>

                <div className="nb-card" style={{ borderLeft: '12px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>Under Investigation</span>
                        <Clock size={20} />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{metrics.pending}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Active IO Assignment</p>
                </div>

                <div className="nb-card" style={{ borderLeft: '12px solid #FFE600' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>In Court / Trial</span>
                        <Scale size={20} />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{metrics.inCourt}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Charge Sheeted</p>
                </div>

                <div className="nb-card" style={{ borderLeft: '12px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>Disposed / Closed</span>
                        <CheckCircle2 size={20} />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{metrics.closed}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Final Report Filed</p>
                </div>

            </div>

            {/* Key Crime Heads Overview */}
            <div className="nb-card">
                <h3>Primary Crime Classification Breakdown</h3>
                <p style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Live telemetry across selected jurisdiction</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {crimeBreakdown.map((item, idx) => (
                        <div key={idx} style={{ borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                                <span>{item.head}</span>
                                <span>{item.count} cases ({item.percent})</span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: '#eee', border: '2px solid #000', height: '16px' }}>
                                <div style={{ width: item.percent, backgroundColor: 'var(--nb-yellow)', height: '100%', borderRight: '2px solid #000' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedDivision !== 'All Divisions' && (
                <section className="nb-card" aria-labelledby="division-case-list-title">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '3px solid #000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                            <h3 id="division-case-list-title" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', margin: 0 }}>
                                <ListChecks size={22} /> CASES IN {selectedDivision.toUpperCase()}
                            </h3>
                            <p style={{ margin: '0.35rem 0 0', fontWeight: 650, fontSize: '0.85rem' }}>
                                Basic FIR information only. Open Case Deep Dive to view permitted case details.
                            </p>
                        </div>
                        <div style={{ background: '#FFE600', border: '2px solid #000', padding: '0.4rem 0.7rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                            {divisionCases.length} {divisionCases.length === 1 ? 'CASE' : 'CASES'}
                        </div>
                    </div>

                    {divisionCases.length === 0 ? (
                        <div style={{ border: '2px solid #000', padding: '1rem', fontWeight: 800 }}>
                            No FIR records were found for this division.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.7rem' }}>
                            {divisionCases.map(caseRecord => (
                                <article
                                    key={caseRecord.crimeNo}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(120px, 0.7fr) minmax(180px, 1.4fr) minmax(150px, 1fr) minmax(150px, 1fr)',
                                        gap: '0.8rem',
                                        alignItems: 'center',
                                        border: '2px solid #000',
                                        padding: '0.8rem 1rem',
                                        background: '#fff'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.67rem', fontWeight: 900, opacity: 0.65 }}>FIR NUMBER</div>
                                        <div style={{ fontWeight: 900 }}>{caseRecord.crimeNo}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.67rem', fontWeight: 900, opacity: 0.65 }}>CRIME TYPE</div>
                                        <div style={{ fontWeight: 800 }}>{caseRecord.crimeType}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.67rem', fontWeight: 900, opacity: 0.65 }}>REGISTERED DATE</div>
                                        <div style={{ fontWeight: 750 }}>{formatCaseDate(caseRecord.registeredAt)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.67rem', fontWeight: 900, opacity: 0.65 }}>CASE STATUS</div>
                                        <span style={{ display: 'inline-block', marginTop: '0.15rem', background: '#FFE600', border: '2px solid #000', padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 900 }}>
                                            {caseRecord.caseStatus}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

        </div>
    );
};
