const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildCaseIntelligence,
	scoreCandidate,
	sharedStatementTerms,
	splitAccusedNames
} = require('./case-intelligence');

const target = {
	CrimeNo: 1001,
	CrimeTypeName: 'Vehicle Theft',
	Pincode: 560034,
	DivisionName: 'Bengaluru South',
	CaseStatus: 'Registered',
	RegisteredAt: '2026-07-18 19:40:00',
	AccusedName: 'Ravi Kumar',
	VictimStatement: 'Two helmeted persons started the locked motorcycle and escaped near the supermarket.'
};

test('does not treat unknown accused labels as people', () => {
	assert.deepEqual(splitAccusedNames('Unknown'), []);
	assert.deepEqual(splitAccusedNames('Ravi Kumar & Suresh'), ['ravi kumar', 'suresh']);
});

test('finds shared descriptive statement terms', () => {
	assert.deepEqual(
		sharedStatementTerms(
			'Helmeted persons stole the motorcycle near a supermarket.',
			'Two helmeted suspects escaped with a motorcycle from the supermarket.'
		),
		['supermarket', 'motorcycle', 'helmeted']
	);
});

test('returns an explainable weighted similarity score', () => {
	const result = scoreCandidate(target, {
		CrimeNo: 1002,
		CrimeTypeName: 'Vehicle Theft',
		Pincode: 560034,
		DivisionName: 'Bengaluru South',
		CaseStatus: 'Under Investigation',
		RegisteredAt: '2026-06-20 20:00:00',
		AccusedName: 'Ravi Kumar',
		VictimStatement: 'A helmeted person took the motorcycle from outside the supermarket.'
	}, true);

	assert.equal(result.score, 100);
	assert.ok(result.reasons.includes('Same crime type'));
	assert.ok(result.reasons.includes('Same accused name appears in both records'));
	assert.match(result.reasons.join(' '), /Shared statement terms/);
});

test('builds repeat associations while suppressing sensitive signals for constables', () => {
	const records = [
		target,
		{ ...target, CrimeNo: 1002, CrimeTypeName: 'Robbery' },
		{ ...target, CrimeNo: 1003, AccusedName: 'Unknown' }
	];

	const investigator = buildCaseIntelligence({ target, records, role: 'Investigator' });
	assert.equal(investigator.repeatAssociations[0].caseCount, 2);
	assert.equal(investigator.sensitiveSignalsIncluded, true);

	const constable = buildCaseIntelligence({ target, records, role: 'Constable' });
	assert.deepEqual(constable.repeatAssociations, []);
	assert.equal(constable.sensitiveSignalsIncluded, false);
	assert.ok(constable.similarCases.every(item =>
		!item.reasons.some(reason => reason.includes('accused') || reason.includes('statement'))
	));
});
