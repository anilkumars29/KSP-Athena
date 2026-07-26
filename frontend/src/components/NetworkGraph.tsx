import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface NetworkGraphProps {
    data?: any[];
    graph?: {
        nodes: Array<{ id: string; group: string; name: string }>;
        links: Array<{ source: string; target: string; label: string; score?: number; type?: string }>;
    };
    title?: string;
    subtitle?: string;
    height?: number;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
    data = [],
    graph,
    title = 'Case Entity Link View',
    subtitle = 'LIVE RECORDS · UNVERIFIED NAME MATCHES',
    height = 400
}) => {
    const [dimensions, setDimensions] = useState({ width: 800, height });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateDimensions = () => {
            const container = containerRef.current;
            if (container) setDimensions({ width: container.offsetWidth, height });
        };
        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        return () => window.removeEventListener('resize', updateDimensions);
    }, [height]);

    const graphData = useMemo(() => {
        if (graph) return graph;
        const nodes: any[] = [];
        const links: any[] = [];
        const addedNodes = new Set<string>();
        const addNode = (id: string, group: string, name: string) => {
            if (!addedNodes.has(id)) {
                nodes.push({ id, group, name });
                addedNodes.add(id);
            }
        };

        data.forEach(record => {
            const caseId = `CASE_${record.CrimeNo}`;
            addNode(caseId, 'case', `Crime No: ${record.CrimeNo} (${record.CrimeTypeName || 'Unknown'})`);
            if (record.VictimName) {
                const victimId = `VIC_${record.VictimName.toUpperCase()}`;
                addNode(victimId, 'victim', `Victim: ${record.VictimName}`);
                links.push({ source: victimId, target: caseId, label: 'Victim Of', score: 20, type: 'case' });
            }
            String(record.AccusedName || '')
                .split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
                .map(name => name.trim())
                .filter(name => name && name.toLowerCase() !== 'unknown')
                .forEach(name => {
                    const accusedId = `ACC_${name.toUpperCase()}`;
                    addNode(accusedId, 'accused', `Accused: ${name}`);
                    links.push({ source: accusedId, target: caseId, label: 'Accused In', score: 20, type: 'case' });
                });
        });
        return { nodes, links };
    }, [data, graph]);

    if (graphData.nodes.length === 0) {
        return <div className="nb-card" style={{ fontWeight: 800 }}>No evidence-backed network is available for the selected filters.</div>;
    }

    return (
        <div ref={containerRef} className="nb-card" style={{ padding: 0, overflow: 'hidden', border: '4px solid #000', marginTop: '1rem', backgroundColor: '#fff' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>{title}</span>
                <span style={{ color: 'var(--nb-yellow)' }}>{subtitle}</span>
            </div>
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '2px solid #000', fontSize: '0.75rem', fontWeight: 700 }}>
                Hover over nodes and links for recorded evidence. Every identity and association must be independently verified.
            </div>
            <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => node.group === 'case' ? '#000000' : node.group === 'accused' ? '#ef4444' : '#FFE600'}
                nodeRelSize={8}
                linkLabel="label"
                linkColor={link => link.type === 'association' ? '#dc2626' : '#9ca3af'}
                linkWidth={link => link.type === 'association' ? Math.max(2, Number(link.score || 0) / 20) : 1.5}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                backgroundColor="#ffffff"
            />
        </div>
    );
};
