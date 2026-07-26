import React, { useState } from 'react';
import { BookOpenCheck, ChevronDown, ChevronUp, Database, Filter, ShieldCheck } from 'lucide-react';

export type Explainability = {
    version: string;
    dataSource: string;
    evidenceStatus: string;
    resultCount: number;
    citedFirs: string[];
    selectedFields: string[];
    appliedFilters: Array<{ name: string; label: string; value: string }>;
    sort: string;
    requestedLimit: number;
    limitReached: boolean;
    dataReferences: Array<{ crimeNo: string; availableFields: string[] }>;
    processingTrace: string[];
    safeguards: string[];
    limitations: string[];
    context?: { agentMode?: string; language?: string; role?: string };
};

export const legacyExplainability = (citations: Array<string | number> = []): Explainability => ({
    version: 'legacy-evidence',
    dataSource: 'Saved conversation',
    evidenceStatus: citations.length ? 'LEGACY_CITATIONS_ONLY' : 'LEGACY_METADATA_UNAVAILABLE',
    resultCount: citations.length,
    citedFirs: citations.map(String),
    selectedFields: [],
    appliedFilters: [],
    sort: 'unknown',
    requestedLimit: 0,
    limitReached: false,
    dataReferences: citations.map(value => ({ crimeNo: String(value), availableFields: [] })),
    processingTrace: ['This saved response predates the structured evidence contract; its original filters and retrieval fields are unavailable.'],
    safeguards: ['Legacy FIR citations are displayed without reconstructing or guessing missing retrieval metadata.'],
    limitations: ['Re-run the question to generate a complete evidence-v1 panel with fields, filters, safeguards and coverage.']
});

export const ExplainabilityPanel: React.FC<{ evidence: Explainability }> = ({ evidence }) => {
    const [expanded, setExpanded] = useState(false);
    const statusLabel = evidence.evidenceStatus.replaceAll('_', ' ');

    return (
        <aside aria-label="AI evidence and reasoning" style={{ marginTop: '1rem', border: '3px solid #000', background: '#fff' }}>
            <button
                type="button"
                onClick={() => setExpanded(value => !value)}
                aria-expanded={expanded}
                className="nb-button"
                style={{ width: '100%', border: 0, borderRadius: 0, boxShadow: 'none', background: '#dbeafe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpenCheck size={18} /> EVIDENCE &amp; REASONING
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {statusLabel} · {evidence.resultCount} ROW{evidence.resultCount === 1 ? '' : 'S'}
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>

            <div style={{ padding: '0.75rem', borderTop: '2px solid #000', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <strong><Database size={14} style={{ verticalAlign: 'middle' }} /> Source: {evidence.dataSource}</strong>
                    {evidence.citedFirs.length > 0 ? (
                        <>
                            <strong>FIR citations:</strong>
                            {evidence.citedFirs.map(crimeNo => (
                                <span key={crimeNo} style={{ border: '2px solid #000', background: '#FFE600', padding: '0.15rem 0.35rem', fontWeight: 900 }}>{crimeNo}</span>
                            ))}
                        </>
                    ) : <strong>No matching FIR citation</strong>}
                </div>
            </div>

            {expanded && (
                <div style={{ borderTop: '2px solid #000', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <section>
                            <h4 style={{ marginTop: 0 }}><Filter size={15} style={{ verticalAlign: 'middle' }} /> Applied filters</h4>
                            {evidence.appliedFilters.length ? (
                                <ul>{evidence.appliedFilters.map(filter => <li key={filter.name}><strong>{filter.label}:</strong> {filter.value}</li>)}</ul>
                            ) : <p>No record filter was stored.</p>}
                            <p><strong>Sort:</strong> {evidence.sort} · <strong>Maximum rows:</strong> {evidence.requestedLimit || 'Unavailable'}</p>
                        </section>
                        <section>
                            <h4 style={{ marginTop: 0 }}>Retrieved fields</h4>
                            <p>{evidence.selectedFields.length ? evidence.selectedFields.join(', ') : 'Unavailable for this saved legacy response.'}</p>
                            {evidence.limitReached && <p style={{ background: '#fdba74', border: '2px solid #000', padding: '0.4rem', fontWeight: 800 }}>ROW LIMIT REACHED: more matching records may exist.</p>}
                        </section>
                    </div>

                    <section>
                        <h4>Auditable processing trace</h4>
                        <ol>{evidence.processingTrace.map(step => <li key={step}>{step}</li>)}</ol>
                    </section>

                    {evidence.dataReferences.length > 0 && (
                        <section>
                            <h4>Record-to-field references</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                                {evidence.dataReferences.map(reference => (
                                    <div key={reference.crimeNo} style={{ border: '2px solid #000', padding: '0.5rem' }}>
                                        <strong>FIR {reference.crimeNo}</strong>
                                        <div>{reference.availableFields.length ? reference.availableFields.join(', ') : 'Field metadata unavailable'}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        <section style={{ background: '#dcfce7', border: '2px solid #000', padding: '0.65rem' }}>
                            <h4 style={{ marginTop: 0 }}><ShieldCheck size={15} style={{ verticalAlign: 'middle' }} /> Safeguards</h4>
                            <ul>{evidence.safeguards.map(item => <li key={item}>{item}</li>)}</ul>
                        </section>
                        <section style={{ background: '#fef3c7', border: '2px solid #000', padding: '0.65rem' }}>
                            <h4 style={{ marginTop: 0 }}>Limitations</h4>
                            <ul>{evidence.limitations.map(item => <li key={item}>{item}</li>)}</ul>
                        </section>
                    </div>
                </div>
            )}
        </aside>
    );
};
