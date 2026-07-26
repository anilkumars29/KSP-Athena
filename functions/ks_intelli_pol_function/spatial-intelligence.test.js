const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSpatialIntelligence, validCoordinates } = require('./spatial-intelligence');

test('validates recorded coordinate pairs', () => {
	assert.deepEqual(validCoordinates({ Latitude: '12.93', longitude: '77.62' }), { lat: 12.93, lng: 77.62 });
	assert.equal(validCoordinates({ Latitude: 0, longitude: 0 }), null);
	assert.equal(validCoordinates({ Latitude: 200, longitude: 77 }), null);
});

test('maps statewide coordinates and transparently reports each fallback source', () => {
	const records = [
		{ CrimeNo: 1, Pincode: 570001, Latitude: 12.30, longitude: 76.65, DivisionName: 'Mysuru', CrimeTypeName: 'Theft', RegisteredAt: '2026-07-20' },
		{ CrimeNo: 2, Pincode: 570001, Latitude: null, longitude: null, DivisionName: 'Mysuru', CrimeTypeName: 'Theft', RegisteredAt: '2026-07-21' },
		{ CrimeNo: 3, Pincode: 560034, Latitude: null, longitude: null, DivisionName: 'Bengaluru South', CrimeTypeName: 'Fraud', RegisteredAt: '2026-07-22' },
		{ CrimeNo: 4, Pincode: 999999, Latitude: null, longitude: null, DivisionName: 'Unknown', CrimeTypeName: 'Other', RegisteredAt: '2026-07-22' }
	];
	const result = buildSpatialIntelligence(records, new Date('2026-07-26T12:00:00Z'));
	assert.equal(result.coverage.directCoordinateRecords, 1);
	assert.equal(result.coverage.samePincodeCentroidRecords, 1);
	assert.equal(result.coverage.fallbackPincodeRecords, 1);
	assert.equal(result.coverage.unmappedRecords, 1);
	assert.equal(result.hotspots.find(item => item.pincode === '570001').totalCases, 2);
});

test('creates a cited surge alert from the two explicit 30-day windows', () => {
	const records = [
		{ CrimeNo: 11, Pincode: 560034, CrimeTypeName: 'Vehicle Theft', RegisteredAt: '2026-07-22' },
		{ CrimeNo: 12, Pincode: 560034, CrimeTypeName: 'Vehicle Theft', RegisteredAt: '2026-07-15' },
		{ CrimeNo: 13, Pincode: 560034, CrimeTypeName: 'Vehicle Theft', RegisteredAt: '2026-07-01' },
		{ CrimeNo: 14, Pincode: 560034, CrimeTypeName: 'Vehicle Theft', RegisteredAt: '2026-06-10' }
	];
	const result = buildSpatialIntelligence(records, new Date('2026-07-26T12:00:00Z'));
	assert.equal(result.alerts.length, 1);
	assert.equal(result.alerts[0].rule, 'RECENT_SURGE');
	assert.equal(result.alerts[0].current30Count, 3);
	assert.equal(result.alerts[0].previous30Count, 1);
	assert.deepEqual(result.alerts[0].evidence.map(item => item.crimeNo), ['11', '12', '13']);
});

test('does not emit an alert below the minimum evidence count', () => {
	const records = [
		{ CrimeNo: 1, Pincode: 560034, CrimeTypeName: 'Theft', RegisteredAt: '2026-07-20' },
		{ CrimeNo: 2, Pincode: 560034, CrimeTypeName: 'Theft', RegisteredAt: '2026-07-21' }
	];
	assert.deepEqual(buildSpatialIntelligence(records, new Date('2026-07-26T12:00:00Z')).alerts, []);
});
