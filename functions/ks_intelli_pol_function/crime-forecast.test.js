const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCrimeForecast, regressionSlope, validateFilter, weightedAverage } = require('./crime-forecast');

test('calculates the weighted recent baseline and bounded trend input', () => {
	assert.equal(weightedAverage([1, 2, 3]), 14 / 6);
	assert.ok(regressionSlope([1, 2, 3, 4, 5, 6]) > 0);
});

test('validates filters before applying them in memory', () => {
	assert.equal(validateFilter('East Division', 'All Divisions'), 'East Division');
	assert.throws(() => validateFilter("East' OR 1=1 --", 'All Divisions'), /Invalid division/);
});

test('refuses to forecast sparse history', () => {
	const result = buildCrimeForecast([
		{ CrimeNo: 1, RegisteredAt: '2026-06-01', DivisionName: 'East', CrimeTypeName: 'Theft' },
		{ CrimeNo: 2, RegisteredAt: '2026-05-01', DivisionName: 'East', CrimeTypeName: 'Theft' }
	], { historyMonths: 12, now: new Date('2026-07-26T12:00:00Z') });
	assert.equal(result.diagnostics.sufficiency, 'INSUFFICIENT');
	assert.deepEqual(result.forecast, []);
});

test('produces three aggregate forecasts, confidence ranges, and backtest diagnostics', () => {
	const records = [];
	for (let month = 0; month < 12; month += 1) {
		const date = new Date(2025, 6 + month, 5);
		const count = 2 + (month % 3);
		for (let index = 0; index < count; index += 1) {
			records.push({
				CrimeNo: `${month}-${index}`,
				RegisteredAt: date.toISOString(),
				DivisionName: month % 2 ? 'East' : 'West',
				CrimeTypeName: 'Theft'
			});
		}
	}
	const result = buildCrimeForecast(records, {
		historyMonths: 12,
		now: new Date('2026-07-26T12:00:00Z')
	});
	assert.equal(result.forecast.length, 3);
	assert.ok(result.forecast.every(item => item.lower <= item.predicted && item.predicted <= item.upper));
	assert.notEqual(result.diagnostics.backtestMeanAbsoluteError, null);
	assert.equal(result.diagnostics.sufficiency, 'LIMITED');
	assert.match(result.method, /not an offender-level prediction/i);
});

test('applies division and crime-type scope while retaining filter options', () => {
	const records = [
		{ CrimeNo: 1, RegisteredAt: '2026-06-01', DivisionName: 'East', CrimeTypeName: 'Theft' },
		{ CrimeNo: 2, RegisteredAt: '2026-05-01', DivisionName: 'West', CrimeTypeName: 'Fraud' }
	];
	const result = buildCrimeForecast(records, {
		historyMonths: 12,
		division: 'East',
		crimeType: 'Theft',
		now: new Date('2026-07-26T12:00:00Z')
	});
	assert.equal(result.diagnostics.totalHistoricalCases, 1);
	assert.deepEqual(result.availableDivisions, ['East', 'West']);
	assert.deepEqual(result.availableCrimeTypes, ['Fraud', 'Theft']);
});
