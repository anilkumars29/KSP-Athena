import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Fingerprint, Layers3, MapPinned, ShieldCheck } from 'lucide-react';
import { authFetch } from '../api';

interface Profile {
    id: string;
    displayName: string;
    caseCount: number;
    activeCaseCount: number;
    firstRecordedAt: string | null;
    lastRecordedAt: string | null;
    crimeTypes: string[];
    divisions: string[];
    pincodes: string[];
    statuses: string[];
    cases: Array<{
        crimeNo: string;
        crimeType: string;
        division: string;
        pincode: string | number | null;
        status: string;
        registeredAt: string | null;
    }>;
    modusIndicators: Array<{ name: string; caseCount: number; crimeNos: string[] }>;
    identityAssessment: {
        status: string;
        distinctMobileIdentifierCount: number;
        warning: string;
    };
    priority: {
        score: number;
        label: string;
        breakdown: Array<{ factor: string; points: number; evidence: string }>;
    };
}

interface ProfilingData {
    profiles: Profile[];
    coverage: {
        recordsReviewed: number;
        namedAccusedGroups: number;
        profilesReturned: number;
        minCases: number;
        recordCapReached: boolean;
        analysisAsOf: string;
    };
    method: string;
}

const priorityColor = (score: number) => score >= 70 ? '#f87171' : score >= 40 ? '#fde047' : '#86efac';

export const OffenderProfiles: React.FC = () => {
    const role = localStorage.getItem('ksp_role') || '';
    const [minCases, setMinCases] = useState(2);
    const [search, setSearch] = useState('');
    const [data, setData] = useState<ProfilingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role)) {
            setLoading(false);
            return;
        }
        const loadProfiles = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await authFetch(`/offender-profiles?minCases=${minCases}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to generate offender profiles.');
                }
                setData(result.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to generate offender profiles.');
            } finally {
                setLoading(false);
            }
        };
        loadProfiles();
    }, [minCases, role]);

    const profiles = useMemo(() => {
        const query = search.trim().toLocaleLowerCase('en-IN');
        if (!query) return data?.profiles || [];
        return (data?.profiles || []).filter(profile =>
            profile.displayName.toLocaleLowerCase('en-IN').includes(query) ||
            profile.cases.some(caseRecord => caseRecord.crimeNo.includes(query))
        );
    }, [data, search]);

    if (!['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role)) {
        return (
            <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>
                ACCESS DENIED: Offender profiles require the Investigator, Analyst, or Supervisor role.
            </div>
        );
    }
    if (loading) return <div className="nb-card processing-state"><span className="loading-spinner" /> BUILDING EXPLAINABLE OFFENDER PROFILES...</div>;
    if (error || !data) return <div className="nb-card" role="alert" style={{ background: '#f87171', fontWeight: 800 }}>PROFILE ERROR: {error}</div>;

    return (
        <section aria-labelledby="profiles-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Fingerprint size={28} />
                <div>
                    <h2 id="profiles-title">EXPLAINABLE OFFENDER PROFILES</h2>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                        Recorded associations and behavioral indicators for investigative review—not a guilt or future-offending prediction.
                    </p>
                </div>
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'end' }}>
                <label style={{ fontWeight: 900 }}>
                    MINIMUM FIR ASSOCIATIONS
                    <select aria-label="Minimum FIR associations" value={minCases} onChange={event => setMinCases(Number(event.target.value))}>
                        <option value={1}>All named records</option>
                        <option value={2}>2+ records</option>
                        <option value={3}>3+ records</option>
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    SEARCH NAME OR CRIME NUMBER
                    <input className="nb-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search profiles..." />
                </label>
            </div>

            {data.coverage.recordCapReached && (
                <div className="nb-card" role="status" style={{ background: '#FFE600', fontWeight: 800 }}>
                    Coverage limit reached: profiles use the 300 most recent FIR records.
                </div>
            )}

            <div className="nb-card" style={{ fontWeight: 700 }}>
                Reviewed {data.coverage.recordsReviewed} records and found {data.coverage.namedAccusedGroups} named groups.
                {' '}{data.method}
            </div>

            {profiles.length === 0 ? (
                <div className="nb-card" style={{ fontWeight: 800 }}>NO PROFILES MATCH THE CURRENT ASSOCIATION THRESHOLD AND SEARCH.</div>
            ) : profiles.map(profile => (
                <article key={profile.id} className="nb-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem', background: priorityColor(profile.priority.score), borderBottom: '3px solid #000' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Fingerprint size={20} /> {profile.displayName}</h3>
                            <strong>{profile.caseCount} RECORDED FIR ASSOCIATIONS · {profile.activeCaseCount} NOT MARKED CLOSED</strong>
                        </div>
                        <div style={{ border: '3px solid #000', background: '#fff', padding: '0.5rem 0.8rem', textAlign: 'center', minWidth: 145 }}>
                            <div style={{ fontSize: '2rem', fontWeight: 950 }}>{profile.priority.score}/100</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 900 }}>{profile.priority.label}</div>
                        </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                        <div style={{ border: '2px solid #000', padding: '0.7rem', background: '#fff7ed', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 900 }}><AlertTriangle size={18} /> {profile.identityAssessment.status}</div>
                            <div>{profile.identityAssessment.warning}</div>
                            <code>Distinct supporting mobile identifiers: {profile.identityAssessment.distinctMobileIdentifierCount} (values hidden)</code>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Layers3 size={18} /> RECORDED PATTERNS</h3>
                                <p><strong>Crime types:</strong> {profile.crimeTypes.join(', ') || 'Unavailable'}</p>
                                <p><strong>Statuses:</strong> {profile.statuses.join(', ') || 'Unavailable'}</p>
                                <p><strong>Pincodes:</strong> {profile.pincodes.join(', ') || 'Unavailable'}</p>
                            </div>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPinned size={18} /> GEOGRAPHIC SPREAD</h3>
                                <p>{profile.divisions.join(', ') || 'Division unavailable'}</p>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock3 size={18} /> RECORDED SPAN</h3>
                                <p>{profile.firstRecordedAt || 'Unknown'} → {profile.lastRecordedAt || 'Unknown'}</p>
                            </div>
                        </div>

                        <h3>REVIEW-PRIORITY BREAKDOWN</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.6rem' }}>
                            {profile.priority.breakdown.map(item => (
                                <div key={item.factor} style={{ border: '2px solid #000', padding: '0.65rem', background: '#fff' }}>
                                    <strong>{item.factor}: +{item.points}</strong>
                                    <div style={{ fontSize: '0.78rem' }}>{item.evidence}</div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ marginTop: '1rem' }}>RECORDED MODUS-OPERANDI INDICATORS</h3>
                        {profile.modusIndicators.length === 0 ? (
                            <p>No supported modus indicator was extracted from the available statements.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {profile.modusIndicators.map(indicator => (
                                    <div key={indicator.name} style={{ border: '2px solid #000', padding: '0.5rem', background: '#FFE600' }}>
                                        <strong>{indicator.name}</strong><br />
                                        <code>{indicator.caseCount} case(s): {indicator.crimeNos.join(', ')}</code>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h3 style={{ marginTop: '1rem' }}>CONTRIBUTING FIR RECORDS</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#000', color: '#fff' }}>
                                    <tr>{['Crime No', 'Crime type', 'Division', 'Pincode', 'Status', 'Recorded date'].map(heading => <th key={heading} style={{ padding: '0.5rem', textAlign: 'left' }}>{heading}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {profile.cases.map(caseRecord => (
                                        <tr key={caseRecord.crimeNo}>
                                            {[caseRecord.crimeNo, caseRecord.crimeType, caseRecord.division, caseRecord.pincode || '—', caseRecord.status, caseRecord.registeredAt || '—'].map((value, index) => (
                                                <td key={index} style={{ padding: '0.5rem', border: '1px solid #000' }}>{value}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </article>
            ))}

            <div className="nb-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <ShieldCheck size={20} />
                The score excludes age and protected demographic attributes. Independent identity and evidentiary verification remains mandatory.
            </div>
        </section>
    );
};
