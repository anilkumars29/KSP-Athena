const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSociologicalInsights, validateDivision } = require('./sociological-insights');

const records = [
	{ CrimeNo: 1, VictimAge: 20, CrimeTypeName: 'Cyber Crime', DivisionName: 'East', Pincode: 560001, RegisteredAt: '2026-07-20' },
	{ CrimeNo: 2, VictimAge: 22, CrimeTypeName: 'Cyber Crime', DivisionName: 'East', Pincode: 560001, RegisteredAt: '2026-07-10' },
	{ CrimeNo: 3, VictimAge: 45, CrimeTypeName: 'Cyber Crime', DivisionName: 'East', Pincode: 560001, RegisteredAt: '2026-06-20' },
	{ CrimeNo: 4, VictimAge: 45, CrimeTypeName: 'Theft', DivisionName: 'West', Pincode: 560002, RegisteredAt: '2026-06-10' },
	{ CrimeNo: 5, VictimAge: 46, CrimeTypeName: 'Theft', DivisionName: 'West', Pincode: 560002, RegisteredAt: '2026-05-10' },
	{ CrimeNo: 6, VictimAge: null, CrimeTypeName: 'Theft', DivisionName: '', Pincode: null, RegisteredAt: '2026-05-01' },
	{ CrimeNo: 7, VictimAge: 30, CrimeTypeName: 'Fraud', DivisionName: 'East', Pincode: 560001, RegisteredAt: '2025-01-01' }
];

test('validates division filters without writing them into a query', () => {
	assert.equal(validateDivision('East'), 'East');
	assert.throws(() => validateDivision("East' OR 1=1"), /Invalid division/);
});

test('builds age, crime, geography, and completeness aggregates', () => {
	const result = buildSociologicalInsights(records, {
		period: 12,
		now: new Date('2026-07-26T12:00:00Z')
	});
	assert.equal(result.coverage.filteredRecords, 6);
	assert.equal(result.coverage.ageKnownRecords, 5);
	assert.equal(result.coverage.ageUnknownRecords, 1);
	assert.equal(result.ageDistribution.find(item => item.name === '18–24').count, 2);
	assert.equal(result.crimeAgeMatrix.find(item => item.crimeType === 'Cyber Crime').bands['18–24'], 2);
	assert.deepEqual(result.availableDivisions, ['East', 'West']);
	assert.ok(result.unavailableDimensions.includes('Education'));
});

test('produces a minimum-evidence recorded-share signal with a non-causal explanation', () => {
	const result = buildSociologicalInsights(records, {
		period: 12,
		now: new Date('2026-07-26T12:00:00Z')
	});
	const signal = result.recordedShareSignals.find(item =>
		item.crimeType === 'Cyber Crime' && item.ageBand === '18–24'
	);
	assert.equal(signal.observedCases, 2);
	assert.ok(signal.representationIndex >= 1.5);
	assert.match(result.method, /not causal/i);
});

test('applies a selected division after calculating the available options', () => {
	const result = buildSociologicalInsights(records, {
		period: 12,
		division: 'West',
		now: new Date('2026-07-26T12:00:00Z')
	});
	assert.equal(result.coverage.filteredRecords, 2);
	assert.deepEqual(result.crimeTypes, [{ name: 'Theft', count: 2 }]);
	assert.deepEqual(result.availableDivisions, ['East', 'West']);
});
