const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCriminalNetwork, validateMinScore } = require('./criminal-network');
const { syntheticFirs } = require('./synthetic-firs');

test('restricts network analysis and validates score thresholds', () => {
	assert.throws(
		() => buildCriminalNetwork(syntheticFirs, { role: 'Constable' }),
		/Investigator, Analyst, or Supervisor/
	);
	assert.throws(() => validateMinScore(40), /30, 50, or 70/);
});

test('allows the Argos full demo role to inspect criminal networks', () => {
	assert.doesNotThrow(() => buildCriminalNetwork([], { role: 'Argos', minScore: 30 }));
});

test('detects explainable co-accused groups in the synthetic FIR dataset', () => {
	const result = buildCriminalNetwork(syntheticFirs, { role: 'Investigator', minScore: 30 });
	assert.ok(result.summary.possibleGroups >= 4);
	assert.ok(result.summary.associations >= 4);
	const raviImran = result.associations.find(link =>
		new Set([link.sourceName, link.targetName]).has('Ravi Kumar') &&
		new Set([link.sourceName, link.targetName]).has('Imran Pasha')
	);
	assert.ok(raviImran);
	assert.deepEqual(raviImran.coAccusedCases, ['926001', '926002']);
	assert.ok(raviImran.score >= 70);
	assert.ok(raviImran.reasons.some(reason => /Co-recorded in 2 FIRs/.test(reason)));
	assert.ok(result.method.includes('cannot create one'));
});

test('does not create an association from location and crime-type similarity alone', () => {
	const records = [
		{ CrimeNo: 1, AccusedName: 'Person Alpha', CrimeTypeName: 'Theft', DivisionName: 'South', Pincode: 560034, VictimStatement: 'Helmet used.' },
		{ CrimeNo: 2, AccusedName: 'Person Beta', CrimeTypeName: 'Theft', DivisionName: 'South', Pincode: 560034, VictimStatement: 'Helmet used.' }
	];
	const result = buildCriminalNetwork(records, { role: 'Analyst' });
	assert.equal(result.associations.length, 0);
	assert.equal(result.possibleGroups.length, 0);
});

test('filters network evidence by division and crime type', () => {
	const result = buildCriminalNetwork(syntheticFirs, {
		role: 'Supervisor',
		division: 'Bengaluru South',
		crimeType: 'Theft'
	});
	assert.ok(result.summary.recordsReviewed >= 4);
	assert.ok(result.associations.every(link => link.sharedCrimeTypes.includes('Theft')));
	assert.equal(result.scope.division, 'Bengaluru South');
});
