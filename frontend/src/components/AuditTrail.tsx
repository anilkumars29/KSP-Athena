import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, RefreshCw, ScrollText, ShieldCheck } from 'lucide-react';
import { authFetch } from '../api';

interface AuditEvent {
    auditId: string;
    actorId: string;
    username: string;
    role: string;
    action: string;
    outcome: string;
    targetType: string;
    targetId: string;
    details: Record<string, unknown>;
    createdAt: string;
    intact: boolean;
    version: string;
}

const ACTIONS = [
    'ALL',
    'USER_LOGIN',
    'USER_REGISTERED',
    'CASE_VIEWED',
    'CASE_INTELLIGENCE_GENERATED',
    'CASE_BRIEF_GENERATED',
    'STATEMENT_INTERROGATED',
    'CHAT_QUERY',
    'CONVERSATION_HISTORY_VIEWED',
    'FIR_REGISTERED',
    'DASHBOARD_VIEWED',
    'TREND_ANALYTICS_VIEWED',
    'HOTSPOT_ANALYTICS_VIEWED',
    'AUDIT_TRAIL_VIEWED'
];

const displayAction = (value: string) => value.replaceAll('_', ' ');

export const AuditTrail: React.FC = () => {
    const role = localStorage.getItem('ksp_role') || '';
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [action, setAction] = useState('ALL');
    const [outcome, setOutcome] = useState('ALL');
    const [actor, setActor] = useState('');
    const [appliedActor, setAppliedActor] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (role !== 'Supervisor' && role !== 'Argos') {
            setLoading(false);
            return;
        }
        const loadEvents = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({ limit: '100' });
                if (action !== 'ALL') params.set('action', action);
                if (outcome !== 'ALL') params.set('outcome', outcome);
                if (appliedActor) params.set('actor', appliedActor);
                const response = await authFetch(`/audit-events?${params.toString()}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to load persistent audit events.');
                }
                setEvents(result.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to load persistent audit events.');
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [action, outcome, appliedActor, refreshKey, role]);

    if (role !== 'Supervisor' && role !== 'Argos') {
        return (
            <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>
                ACCESS DENIED: The persistent audit trail is restricted to the Supervisor role.
            </div>
        );
    }

    const verified = events.filter(event => event.intact).length;
    const flagged = events.length - verified;

    return (
        <section aria-labelledby="audit-title" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ScrollText size={28} />
                <div>
                    <h2 id="audit-title">PERSISTENT AUDIT & EVIDENCE TRAIL</h2>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                        Signed governance events for Supervisor and Argos demo review. Integrity flags indicate whether stored audit content still matches its server signature.
                    </p>
                </div>
                <button
                    className="nb-button"
                    onClick={() => setRefreshKey(value => value + 1)}
                    style={{ marginLeft: 'auto', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="nb-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr auto', gap: '0.75rem', alignItems: 'end' }}>
                <label style={{ fontWeight: 900 }}>
                    ACTION
                    <select aria-label="Audit action" value={action} onChange={event => setAction(event.target.value)}>
                        {ACTIONS.map(item => <option key={item} value={item}>{displayAction(item)}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    OUTCOME
                    <select aria-label="Audit outcome" value={outcome} onChange={event => setOutcome(event.target.value)}>
                        <option value="ALL">ALL</option>
                        <option value="SUCCESS">SUCCESS</option>
                        <option value="DENIED">DENIED</option>
                        <option value="FAILED">FAILED</option>
                    </select>
                </label>
                <label style={{ fontWeight: 900 }}>
                    ACTOR USERNAME OR ID
                    <input
                        className="nb-input"
                        value={actor}
                        onChange={event => setActor(event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && setAppliedActor(actor.trim())}
                        placeholder="Filter actor..."
                    />
                </label>
                <button
                    className="nb-button"
                    onClick={() => setAppliedActor(actor.trim())}
                    style={{ background: '#FFE600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <Filter size={16} /> Apply
                </button>
            </div>

            {error && <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>{error}</div>}
            {loading && <div className="nb-card processing-state"><span className="loading-spinner" /> VERIFYING PERSISTENT AUDIT EVENTS...</div>}

            {!loading && !error && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div className="nb-card" style={{ marginBottom: 0 }}>
                            <strong>EVENTS RETURNED</strong>
                            <div style={{ fontSize: '2rem', fontWeight: 950 }}>{events.length}</div>
                        </div>
                        <div className="nb-card" style={{ marginBottom: 0, background: '#4ade80' }}>
                            <strong>SIGNATURE VERIFIED</strong>
                            <div style={{ fontSize: '2rem', fontWeight: 950 }}>{verified}</div>
                        </div>
                        <div className="nb-card" style={{ marginBottom: 0, background: flagged ? '#f87171' : '#fff' }}>
                            <strong>INTEGRITY FLAGGED</strong>
                            <div style={{ fontSize: '2rem', fontWeight: 950 }}>{flagged}</div>
                        </div>
                    </div>

                    {events.length === 0 ? (
                        <div className="nb-card" style={{ fontWeight: 800 }}>NO SIGNED AUDIT EVENTS MATCH THESE FILTERS.</div>
                    ) : (
                        <div className="nb-card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                                <thead style={{ background: '#000', color: '#fff' }}>
                                    <tr>
                                        {['Integrity', 'Time', 'Actor', 'Role', 'Action', 'Target', 'Outcome', 'Recorded details'].map(heading => (
                                            <th key={heading} style={{ textAlign: 'left', padding: '0.65rem', border: '1px solid #fff' }}>{heading}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event.auditId} style={{ background: event.intact ? '#fff' : '#fee2e2' }}>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000', fontWeight: 900 }}>
                                                {event.intact
                                                    ? <span style={{ color: '#166534', display: 'flex', gap: '0.3rem' }}><CheckCircle2 size={16} /> VERIFIED</span>
                                                    : <span style={{ color: '#991b1b', display: 'flex', gap: '0.3rem' }}><AlertTriangle size={16} /> FLAGGED</span>}
                                            </td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000', whiteSpace: 'nowrap' }}>{event.createdAt}</td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000' }}>
                                                <strong>{event.username || 'Unavailable'}</strong><br />
                                                <code>ID {event.actorId}</code>
                                            </td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000' }}>{event.role}</td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000', fontWeight: 800 }}>{displayAction(event.action)}</td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000' }}>
                                                {event.targetType || '—'}{event.targetId ? `: ${event.targetId}` : ''}
                                            </td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000' }}>{event.outcome}</td>
                                            <td style={{ padding: '0.65rem', border: '1px solid #000' }}>
                                                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(event.details)}</code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="nb-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700 }}>
                        <ShieldCheck size={20} />
                        Audit rows contain metadata and identifiers only. Passwords, session tokens, full chat queries, and full victim statements are excluded.
                    </div>
                </>
            )}
        </section>
    );
};
