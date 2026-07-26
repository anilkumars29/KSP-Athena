// frontend/src/components/MetricsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authFetch } from '../api';

interface MetricsData {
    totalCases: number;
    casesByType: { name: string; count: number }[];
    recentCases: any[];
    recordCapReached?: boolean;
}

export const MetricsDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await authFetch('/dashboard-metrics');
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to retrieve live case metrics.');
                }
                setMetrics(result.data);
            } catch (error) {
                console.error("Error fetching metrics:", error);
                setError(error instanceof Error ? error.message : 'Unable to retrieve live case metrics.');
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="nb-card processing-state"><span className="loading-spinner" /> AGGREGATING LIVE CASE DATA...</div>;
    }

    if (error) {
        return <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>LIVE METRICS ERROR: {error}</div>;
    }

    if (!metrics) return null;

    return (
        <div className="nb-card" style={{ padding: '0', overflow: 'hidden', border: '4px solid #000', marginTop: '1rem', backgroundColor: '#fff' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                <span>Live Crime Trend Summary</span>
                <span style={{ color: 'var(--nb-yellow)' }}>REGISTERED CASE DATA</span>
            </div>

            <div style={{ padding: '1.5rem' }}>
                {metrics.recordCapReached && (
                    <div style={{ backgroundColor: 'var(--nb-yellow)', border: '2px solid #000', padding: '0.5rem', marginBottom: '1rem', fontWeight: 800 }}>
                        Metrics are limited to the first 300 matching Catalyst records.
                    </div>
                )}
                <div style={{ marginBottom: '1.5rem', borderBottom: '4px solid #000', paddingBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Registered Offenses</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#000', lineHeight: '1' }}>
                        {metrics.totalCases}
                    </div>
                </div>

                <div style={{ fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Crime Distribution Breakdown</div>
                <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.casesByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#000', fontWeight: 700, fontSize: 12 }}
                                axisLine={{ stroke: '#000', strokeWidth: 2 }}
                            />
                            <YAxis
                                tick={{ fill: '#000', fontWeight: 700 }}
                                axisLine={{ stroke: '#000', strokeWidth: 2 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 215, 0, 0.2)' }}
                                contentStyle={{ border: '2px solid #000', borderRadius: 0, fontWeight: 700, color: '#000' }}
                            />
                            <Bar dataKey="count" fill="var(--nb-yellow)" stroke="#000" strokeWidth={2} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
