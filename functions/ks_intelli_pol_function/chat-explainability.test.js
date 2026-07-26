const test = require('node:test');
const assert = require('node:assert/strict');
const { buildChatExplainability } = require('./chat-explainability');

test('builds a server-derived evidence contract from safe-query metadata and rows', () => {
	const result = buildChatExplainability({
		records: [
			{ CrimeNo: 926001, CrimeTypeName: 'Theft', DivisionName: 'Bengaluru South' },
			{ CrimeNo: 926002, CrimeTypeName: 'Theft', DivisionName: 'Bengaluru South' }
		],
		intent: { filters: { crimeTypeContains: 'Theft', locationContains: 'Koramangala' } },
		audit: {
			selectedFields: ['CrimeNo', 'CrimeTypeName', 'DivisionName'],
			filterNames: ['crimeTypeContains', 'locationContains'],
			sort: 'newest',
			limit: 20
		},
		role: 'Investigator',
		agentMode: 'investigator_helper',
		language: 'en'
	});
	assert.equal(result.version, 'evidence-v1');
	assert.deepEqual(result.citedFirs, ['926001', '926002']);
	assert.equal(result.appliedFilters[0].value, 'Theft');
	assert.deepEqual(result.dataReferences[0].availableFields, ['CrimeNo', 'CrimeTypeName', 'DivisionName']);
	assert.ok(result.processingTrace.some(step => /read-only lookup/.test(step)));
	assert.ok(result.safeguards.some(item => /did not generate or execute database code/.test(item)));
});

test('reports empty and limit-reached evidence states without inventing citations', () => {
	const empty = buildChatExplainability({
		records: [],
		intent: {},
		audit: { selectedFields: ['CrimeNo'], filterNames: [], sort: 'newest', limit: 20 },
		role: 'Constable',
		agentMode: 'investigator_helper',
		language: 'en'
	});
	assert.equal(empty.evidenceStatus, 'NO_MATCHING_RECORDS');
	assert.deepEqual(empty.citedFirs, []);

	const bounded = buildChatExplainability({
		records: [{ CrimeNo: 1 }, { CrimeNo: 2 }],
		intent: {},
		audit: { selectedFields: ['CrimeNo'], filterNames: [], sort: 'oldest', limit: 2 },
		role: 'Analyst',
		agentMode: 'investigator_helper',
		language: 'kn'
	});
	assert.equal(bounded.evidenceStatus, 'BOUNDED_RESULTS');
	assert.equal(bounded.limitReached, true);
	assert.match(bounded.limitations[0], /additional matching records may exist/);
});
