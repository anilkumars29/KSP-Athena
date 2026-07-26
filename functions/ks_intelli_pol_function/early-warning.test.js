const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEarlyWarnings, buildForecastWarnings } = require('./early-warning');
const { syntheticFirs } = require('./synthetic-firs');

const now = new Date('2026-07-26T12:00:00+05:30');

test('builds prioritized, cited warnings from the synthetic FIR dataset', () => {
	const result = buildEarlyWarnings(syntheticFirs, { role: 'Supervisor', now });
	const categories = new Set(result.alerts.map(alert => alert.category));
	assert.ok(categories.has('SPATIAL_SURGE'));
	assert.ok(categories.has('NETWORK_ACTIVITY'));
	assert.ok(categories.has('REPEAT_ASSOCIATION'));
	assert.ok(categories.has('FORECAST_RISE'));
	assert.ok(result.summary.high > 0);
	assert.ok(result.alerts.every(alert =>
		alert.whyTriggered &&
		alert.recommendedChecks.length >= 3 &&
		alert.limitation
	));
	const koramangala = result.alerts.find(alert => alert.category === 'SPATIAL_SURGE');
	assert.deepEqual(koramangala.evidenceCrimeNos.sort(), ['926001', '926002', '926003']);
});

test('sorts high alerts before medium alerts and reports module coverage', () => {
	const result = buildEarlyWarnings(syntheticFirs, { role: 'Investigator', now });
	const firstMedium = result.alerts.findIndex(alert => alert.severity === 'MEDIUM');
	const lastHigh = result.alerts.map(alert => alert.severity).lastIndexOf('HIGH');
	assert.ok(firstMedium === -1 || lastHigh < firstMedium);
	assert.equal(result.coverage.recordsReviewed, 25);
	assert.ok(result.coverage.networksEvaluated >= 4);
});

test('refuses to create a forecast warning from insufficient history', () => {
	const alerts = buildForecastWarnings({
		diagnostics: { sufficiency: 'INSUFFICIENT' },
		forecast: []
	});
	assert.deepEqual(alerts, []);
});

test('inherits role restrictions from sensitive source modules', () => {
	assert.throws(
		() => buildEarlyWarnings(syntheticFirs, { role: 'Constable', now }),
		/Investigator, Analyst, or Supervisor/
	);
});
