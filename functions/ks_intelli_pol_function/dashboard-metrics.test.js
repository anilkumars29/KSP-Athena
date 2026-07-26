const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildDashboardMetrics,
	formatDivisionName,
	normaliseDivisionKey
} = require('./dashboard-metrics');

const records = [
	{
		CrimeNo: '1',
		CrimeTypeName: 'Theft',
		CaseStatus: 'Under Investigation',
		RegisteredAt: '2026-07-10T10:00:00Z',
		DivisionName: 'Mysuru City'
	},
	{
		CrimeNo: '2',
		CrimeTypeName: 'Fraud',
		CaseStatus: 'In Court',
		RegisteredAt: '2026-07-11T10:00:00Z',
		DivisionName: 'Mysuru Division'
	},
	{
		CrimeNo: '3',
		CrimeTypeName: 'Theft',
		CaseStatus: 'Registered',
		RegisteredAt: '2026-07-12T10:00:00Z',
		DivisionName: 'Bengaluru South'
	},
	{
		CrimeNo: '4',
		CrimeTypeName: 'Assault',
		CaseStatus: 'Closed',
		RegisteredAt: '2026-07-13T10:00:00Z',
		DivisionName: 'Mangaluru City'
	}
];

test('normalises city, division, whitespace, and case variants to one jurisdiction key', () => {
	assert.equal(normaliseDivisionKey(' Mysuru CITY '), 'mysuru');
	assert.equal(normaliseDivisionKey('Mysuru Division'), 'mysuru');
	assert.equal(formatDivisionName('bengaluru south'), 'Bengaluru South Division');
});

test('maps legacy city names and current division names into the same dashboard result', () => {
	const metrics = buildDashboardMetrics(records, 'Mysuru Division');

	assert.equal(metrics.totalCases, 2);
	assert.deepEqual(metrics.statusCounts, {
		registered: 0,
		pending: 1,
		inCourt: 1,
		closed: 0
	});
	assert.deepEqual(metrics.casesByType, [
		{ name: 'Fraud', count: 1 },
		{ name: 'Theft', count: 1 }
	]);
	assert.deepEqual(metrics.divisionCases, [
		{
			crimeNo: '2',
			crimeType: 'Fraud',
			caseStatus: 'In Court',
			registeredAt: '2026-07-11T10:00:00Z'
		},
		{
			crimeNo: '1',
			crimeType: 'Theft',
			caseStatus: 'Under Investigation',
			registeredAt: '2026-07-10T10:00:00Z'
		}
	]);
});

test('returns only divisions represented in the loaded database records', () => {
	const metrics = buildDashboardMetrics(records);

	assert.equal(metrics.totalCases, 4);
	assert.deepEqual(metrics.availableDivisions, [
		'Bengaluru South Division',
		'Mangaluru Division',
		'Mysuru Division'
	]);
	assert.equal(metrics.recentCases[0].CrimeNo, '4');
});
