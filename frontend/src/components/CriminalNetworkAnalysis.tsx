import React, { lazy, Suspense, useEffect, useState } from 'react';
import { GitBranch, ShieldAlert, UsersRound } from 'lucide-react';
import { authFetch } from '../api';

const NetworkGraph = lazy(() =>
    import('./NetworkGraph').then(module => ({ default: module.NetworkGraph }))
);

type NetworkData = {
    scope: {
        division: string;
        crimeType: string;
        minScore: number;
        availableDivisions: string[];
        availableCrimeTypes: string[];
    };
    summary: { recordsReviewed: number; namedEntities: number; associations: number; possibleGroups: number };
    associations: Array<{
        id: string;
        sourceName: string;
        targetName: string;
        score: number;
        strength: string;
        reasons: string[];
    }>;
    possibleGroups: Array<{
        id: string;
        label: string;
        members: Array<{ id: string; name: string; caseCount: number }>;
        caseNos: string[];
        maximumAssociationScore: number;
        warning: string;
    }>;
    graph: {
        nodes: Array<{ id: string; group: string; name: string }>;
        links: Array<{ source: string; target: string; label: string; score?: number; type?: string }>;
    };
    coverage: {
        retrievedRecords: number;
        filteredRecords: number;
        recordsWithoutNamedAccused: number;
        recordCapReached: boolean;
    };
    method: string;
};

export const CriminalNetworkAnalysis: React.FC = () => {
    const role = localStorage.getItem('ksp_role') || '';
    const [division, setDivision] = useState('All Divisions');
    const [crimeType, setCrimeType] = useState('All Crime Types');
    const [minScore, setMinScore] = useState(30);
    const [data, setData] = useState<NetworkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                const params = new URLSearchParams({ division, crimeType, minScore: String(minScore) });
                const response = await authFetch(`/criminal-network?${params.toString()}`, { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error || 'Criminal-network analysis could not be loaded.');
                setData(result.data);
            } catch (loadError) {
                if ((loadError as Error).name !== 'AbortError') {
                    setError(loadError instanceof Error ? loadError.message : 'Criminal-network analysis could not be loaded.');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [division, crimeType, minScore, role]);

    if (!['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role)) {
        return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>ACCESS DENIED: Criminal-network analysis requires the Investigator, Analyst, or Supervisor role.</div>;
    }
    if (loading) return <div className="nb-card processing-state"><span className="loading-spinner" /> ANALYSING RECORDED ASSOCIATIONS...</div>;
    if (error || !data) return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>NETWORK ERROR: {error}</div>;

    return (
        <section aria-labelledby="network-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card" style={{ background: '#FFE600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <GitBranch size={30} />
                    <div>
                        <h2 id="network-title" style={{ margin: 0 }}>EXPLAINABLE CRIMINAL NETWORK ANALYSIS</h2>
                        <p style={{ margin: '0.35rem 0 0', fontWeight: 700 }}>Evidence-backed association clusters for investigative review—not proof of identity, guilt, organization, or common intent.</p>
                    </div>
                </div>
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem' }}>
                <label style={{ fontWeight: 800 }}>Division
                    <select className="nb-input" value={division} onChange={event => setDivision(event.target.value)}>
                        <option>All Divisions</option>
                        {data.scope.availableDivisions.map(item => <option key={item}>{item}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 800 }}>Crime type
                    <select className="nb-input" value={crimeType} onChange={event => setCrimeType(event.target.value)}>
                        <option>All Crime Types</option>
                        {data.scope.availableCrimeTypes.map(item => <option key={item}>{item}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 800 }}>Minimum evidence score
                    <select className="nb-input" value={minScore} onChange={event => setMinScore(Number(event.target.value))}>
                        <option value={30}>30 · Recorded link</option>
                        <option value={50}>50 · Multiple signals</option>
                        <option value={70}>70 · Strong recorded link</option>
                    </select>
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    ['FIRs reviewed', data.summary.recordsReviewed],
                    ['Named entities', data.summary.namedEntities],
                    ['Qualified links', data.summary.associations],
                    ['Possible networks', data.summary.possibleGroups]
                ].map(([label, value]) => (
                    <div className="nb-card" key={label} style={{ borderLeft: '10px solid #000' }}>
                        <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem' }}>{label}</div>
                        <div style={{ fontWeight: 900, fontSize: '2.2rem' }}>{value}</div>
                    </div>
                ))}
            </div>

            {data.coverage.recordCapReached && <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>Coverage limit reached: this analysis uses the 300 most recent FIR records.</div>}

            <Suspense fallback={<div className="nb-card">LOADING INTERACTIVE NETWORK...</div>}>
                <NetworkGraph graph={data.graph} height={520} title="Accused-to-FIR Evidence Network" subtitle="RED: RECORDED PERSON · BLACK: FIR" />
            </Suspense>

            <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UsersRound size={22} /> Possible Networks for Review</h3>
                {data.possibleGroups.length === 0 ? (
                    <div className="nb-card" style={{ fontWeight: 800 }}>No association cluster meets the selected evidence threshold.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
                        {data.possibleGroups.map(group => (
                            <article className="nb-card" key={group.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontWeight: 900 }}>
                                    <span>{group.id}</span>
                                    <span style={{ background: '#FFE600', border: '2px solid #000', padding: '0.15rem 0.35rem' }}>{group.maximumAssociationScore}/100</span>
                                </div>
                                <h4 style={{ marginBottom: '0.5rem' }}>{group.label}</h4>
                                <ul>{group.members.map(member => <li key={member.id}><strong>{member.name}</strong> · {member.caseCount} FIR association{member.caseCount === 1 ? '' : 's'}</li>)}</ul>
                                <p><strong>Connected FIRs:</strong> {group.caseNos.join(', ')}</p>
                                <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{group.warning}</p>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="nb-card">
                <h3>Qualified Association Evidence</h3>
                {data.associations.length === 0 ? <p style={{ fontWeight: 800 }}>No direct recorded link meets the selected threshold.</p> : data.associations.map(link => (
                    <article key={link.id} style={{ borderTop: '2px solid #000', padding: '0.9rem 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <strong>{link.sourceName} ↔ {link.targetName}</strong>
                            <strong>{link.strength} · {link.score}/100</strong>
                        </div>
                        <ul style={{ marginBottom: 0 }}>{link.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
                    </article>
                ))}
            </div>

            <div className="nb-card" style={{ background: '#dbeafe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}><ShieldAlert size={20} /> METHOD AND SAFEGUARD</div>
                <p style={{ marginBottom: 0, fontWeight: 700 }}>{data.method}</p>
            </div>
        </section>
    );
};
