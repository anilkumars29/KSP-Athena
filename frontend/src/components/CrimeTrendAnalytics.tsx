import React, { useEffect, useState } from 'react';
import { Activity, CalendarRange, Database, MapPinned, UsersRound } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { authFetch } from '../api';

type CountItem = { name: string; count: number };
type MonthItem = { key: string; label: string; count: number };
type TrendData = {
    periodMonths: number;
    totalCases: number;
    monthlyTrend: MonthItem[];
    crimeTypes: CountItem[];
    divisions: CountItem[];
    ageBands: CountItem[];
    coverage: {
        retrievedRecords: number;
        periodRecords: number;
        validDateRecords: number;
        ageKnownRecords: number;
        divisionKnownRecords: number;
        recordCapReached: boolean;
        rangeStart: string;
        rangeEnd: string;
    };
};

const CHART_COLORS = ['#FFE600', '#111111', '#4ADE80', '#60A5FA', '#FB7185', '#C084FC', '#FB923C', '#94A3B8'];

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

const CoverageCard = ({ icon, label, value, detail }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    detail: string;
}) => (
    <div className="nb-card" style={{ marginBottom: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.78rem' }}>{label}</span>
            {icon}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 950, marginTop: '0.35rem' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 650 }}>{detail}</div>
    </div>
);

const EmptyChart = () => (
    <div style={{ height: 250, display: 'grid', placeItems: 'center', fontWeight: 800 }}>
        NO MATCHING RECORDS IN THIS PERIOD
    </div>
);

export const CrimeTrendAnalytics: React.FC = () => {
    const [period, setPeriod] = useState(12);
    const [data, setData] = useState<TrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTrends = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await authFetch(`/trend-analytics?period=${period}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unable to retrieve trend analytics.');
                }
                setData(result.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Unable to retrieve trend analytics.');
            } finally {
                setLoading(false);
            }
        };
        loadTrends();
    }, [period]);

    if (loading) {
        return <div className="nb-card processing-state"><span className="loading-spinner" /> ANALYSING LIVE CASE HISTORY...</div>;
    }

    if (error || !data) {
        return <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171' }}>TREND DATA ERROR: {error}</div>;
    }

    const hasCases = data.totalCases > 0;
    const ageCoverage = data.totalCases
        ? `${Math.round((data.coverage.ageKnownRecords / data.totalCases) * 100)}%`
        : '0%';
    const divisionCoverage = data.totalCases
        ? `${Math.round((data.coverage.divisionKnownRecords / data.totalCases) * 100)}%`
        : '0%';

    return (
        <section aria-labelledby="trend-title" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div>
                    <h2 id="trend-title" style={{ marginBottom: '0.25rem' }}>Crime Pattern & Trend Analytics</h2>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                        Historical patterns from live CaseRegistration records. This screen does not predict future crime.
                    </p>
                </div>
                <label style={{ minWidth: 180, fontWeight: 900 }}>
                    ANALYSIS PERIOD
                    <select
                        aria-label="Analysis period"
                        value={period}
                        onChange={event => setPeriod(Number(event.target.value))}
                        style={{ marginTop: '0.35rem', background: '#fff' }}
                    >
                        <option value={6}>Last 6 months</option>
                        <option value={12}>Last 12 months</option>
                        <option value={24}>Last 24 months</option>
                    </select>
                </label>
            </div>

            {data.coverage.recordCapReached && (
                <div className="nb-card" role="status" style={{ backgroundColor: '#FFE600', fontWeight: 800 }}>
                    Coverage limit reached: charts use the 300 most recent case records. They are a bounded operational view, not complete statewide statistics.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                <CoverageCard icon={<Activity size={20} />} label="Cases in period" value={data.totalCases} detail={`${data.periodMonths}-month historical window`} />
                <CoverageCard icon={<Database size={20} />} label="Records retrieved" value={data.coverage.retrievedRecords} detail={`${data.coverage.validDateRecords} have valid dates`} />
                <CoverageCard icon={<UsersRound size={20} />} label="Age coverage" value={ageCoverage} detail={`${data.coverage.ageKnownRecords} cases with known victim age`} />
                <CoverageCard icon={<MapPinned size={20} />} label="Division coverage" value={divisionCoverage} detail={`${data.coverage.divisionKnownRecords} cases with division data`} />
            </div>

            <div className="nb-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CalendarRange size={20} />
                    <h3 style={{ margin: 0 }}>Monthly Registered Crime Volume</h3>
                    <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
                        {formatDate(data.coverage.rangeStart)} – {formatDate(data.coverage.rangeEnd)}
                    </span>
                </div>
                {!hasCases ? <EmptyChart /> : (
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <LineChart data={data.monthlyTrend}>
                                <CartesianGrid stroke="#aaa" strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="Cases" stroke="#000" strokeWidth={4} dot={{ fill: '#FFE600', stroke: '#000', strokeWidth: 2, r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                <div className="nb-card">
                    <h3>Top Crime Types</h3>
                    {!hasCases ? <EmptyChart /> : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={data.crimeTypes} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid stroke="#bbb" strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={125} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Cases" stroke="#000" strokeWidth={2}>
                                        {data.crimeTypes.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="nb-card">
                    <h3>Highest-Volume Divisions</h3>
                    {data.divisions.length === 0 ? <EmptyChart /> : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={data.divisions} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid stroke="#bbb" strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={140} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Cases" fill="#FFE600" stroke="#000" strokeWidth={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            <div className="nb-card">
                <h3>Victim Age Distribution</h3>
                <p style={{ fontWeight: 650 }}>
                    “Unknown” remains visible so missing demographic data is not silently excluded.
                </p>
                {!hasCases ? <EmptyChart /> : (
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.ageBands}>
                                <CartesianGrid stroke="#bbb" strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Cases" stroke="#000" strokeWidth={2}>
                                    {data.ageBands.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
};
