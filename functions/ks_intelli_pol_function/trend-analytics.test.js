const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTrendAnalytics, getAgeBand, normalisePeriod } = require('./trend-analytics');

test('validates the supported analysis periods', () => {
	assert.equal(normalisePeriod('6'), 6);
	assert.equal(normalisePeriod(undefined), 12);
	assert.throws(() => normalisePeriod('7'), /6, 12, or 24/);
});

test('classifies victim ages without treating missing ages as zero', () => {
	assert.equal(getAgeBand(null), 'Unknown');
	assert.equal(getAgeBand(''), 'Unknown');
	assert.equal(getAgeBand(17), 'Under 18');
	assert.equal(getAgeBand('24'), '18–24');
	assert.equal(getAgeBand(67), '60+');
	assert.equal(getAgeBand(999), 'Unknown');
});

test('aggregates only records inside the selected historical period', () => {
	const records = [
		{ RegisteredAt: '2026-07-18 19:40:00', CrimeTypeName: 'Vehicle Theft', DivisionName: 'South', VictimAge: 24 },
		{ RegisteredAt: '2026-06-01 10:00:00', CrimeTypeName: 'Vehicle Theft', DivisionName: 'South', VictimAge: 42 },
		{ RegisteredAt: '2026-02-10 10:00:00', CrimeTypeName: 'Fraud', DivisionName: 'East', VictimAge: null },
		{ RegisteredAt: '2025-12-10 10:00:00', CrimeTypeName: 'Fraud', DivisionName: 'East', VictimAge: 30 },
		{ RegisteredAt: 'not-a-date', CrimeTypeName: 'Other', DivisionName: '', VictimAge: 10 }
	];

	const result = buildTrendAnalytics(records, 6, new Date('2026-07-26T12:00:00+05:30'));

	assert.equal(result.totalCases, 3);
	assert.deepEqual(result.monthlyTrend.map(item => item.count), [1, 0, 0, 0, 1, 1]);
	assert.deepEqual(result.crimeTypes, [
		{ name: 'Vehicle Theft', count: 2 },
		{ name: 'Fraud', count: 1 }
	]);
	assert.deepEqual(result.divisions, [
		{ name: 'South', count: 2 },
		{ name: 'East', count: 1 }
	]);
	assert.equal(result.ageBands.find(item => item.name === '18–24').count, 1);
	assert.equal(result.ageBands.find(item => item.name === '35–44').count, 1);
	assert.equal(result.ageBands.find(item => item.name === 'Unknown').count, 1);
	assert.equal(result.coverage.validDateRecords, 4);
	assert.equal(result.coverage.ageKnownRecords, 2);
});
