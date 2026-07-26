const test = require('node:test');
const assert = require('node:assert/strict');
const { assertProfilingRole, buildOffenderProfiles, extractModusIndicators } = require('./offender-profiling');

const records = [
	{ CrimeNo: 1, AccusedName: 'Ravi Kumar', AccusedMobile: '9999999999', CrimeTypeName: 'Vehicle Theft', DivisionName: 'South', Pincode: 560034, CaseStatus: 'Under Investigation', RegisteredAt: '2026-07-20', VictimStatement: 'Two helmeted persons defeated the motorcycle steering lock.' },
	{ CrimeNo: 2, AccusedName: 'Ravi Kumar', AccusedMobile: '9999999999', CrimeTypeName: 'Robbery', DivisionName: 'East', Pincode: 560038, CaseStatus: 'Registered', RegisteredAt: '2026-06-20', VictimStatement: 'A knife was used to threaten the complainant.' },
	{ CrimeNo: 3, AccusedName: 'Unknown', CrimeTypeName: 'Theft', DivisionName: 'South', CaseStatus: 'Closed', RegisteredAt: '2026-05-01', VictimStatement: '' }
];

test('restricts profiling to investigation roles', () => {
	assert.doesNotThrow(() => assertProfilingRole('Investigator'));
	assert.doesNotThrow(() => assertProfilingRole('Analyst'));
	assert.doesNotThrow(() => assertProfilingRole('Argos'));
	assert.throws(() => assertProfilingRole('Constable'), /required/);
});

test('extracts recorded modus indicators with contributing crime numbers', () => {
	const indicators = extractModusIndicators(records);
	assert.ok(indicators.some(item => item.name === 'Identity concealment' && item.crimeNos.includes('1')));
	assert.ok(indicators.some(item => item.name === 'Weapon or intimidation reference' && item.crimeNos.includes('2')));
});

test('builds a sourced, explainable review-priority profile without demographic scoring', () => {
	const result = buildOffenderProfiles(records, {
		role: 'Investigator',
		minCases: 2,
		now: new Date('2026-07-26T12:00:00Z')
	});
	const profile = result.profiles[0];
	assert.equal(profile.displayName, 'Ravi Kumar');
	assert.equal(profile.caseCount, 2);
	assert.equal(profile.priority.score, 65);
	assert.equal(profile.identityAssessment.status, 'SHARED IDENTIFIER PRESENT');
	assert.equal(profile.identityAssessment.distinctMobileIdentifierCount, 1);
	assert.equal('age' in profile, false);
	assert.deepEqual(profile.priority.breakdown.map(item => item.factor), [
		'Repeated recorded associations',
		'Active-case workload',
		'Recent recorded association',
		'Geographic spread',
		'Crime-type breadth'
	]);
});

test('excludes unknown labels and respects the minimum association count', () => {
	const result = buildOffenderProfiles(records, {
		role: 'Supervisor',
		minCases: 3,
		now: new Date('2026-07-26T12:00:00Z')
	});
	assert.deepEqual(result.profiles, []);
	assert.equal(result.coverage.namedAccusedGroups, 1);
});
