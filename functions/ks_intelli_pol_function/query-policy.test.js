const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSafeQuery, parseSearchIntent } = require('./query-policy');

test('builds a bounded read-only query from approved filters', () => {
	const result = buildSafeQuery({
		requestedFields: ['CrimeNo', 'CrimeTypeName', 'DivisionName'],
		filters: { crimeTypeName: 'Theft', pincode: 560034 },
		sort: 'newest',
		limit: 10
	}, 'Constable');

	assert.match(result.query, /^SELECT /);
	assert.match(result.query, /FROM CaseRegistration/);
	assert.match(result.query, /LIMIT 10$/);
	assert.doesNotMatch(result.query, /\b(?:INSERT|UPDATE|DELETE)\b/i);
});

test('rejects raw SQL or unknown intent properties', () => {
	assert.throws(
		() => buildSafeQuery({ rawSql: 'DELETE FROM CaseRegistration' }, 'Supervisor'),
		/unsupported property/
	);
});

test('rejects fields outside the authenticated role', () => {
	assert.throws(
		() => buildSafeQuery({ requestedFields: ['CrimeNo', 'VictimMobile'] }, 'Constable'),
		/not permitted/
	);
});

test('rejects result limits above 50', () => {
	assert.throws(
		() => buildSafeQuery({ requestedFields: ['CrimeNo'], limit: 300 }, 'Investigator'),
		/whole number/
	);
});

test('escapes quote characters in approved text filters', () => {
	const result = buildSafeQuery({
		requestedFields: ['CrimeNo', 'AccusedName'],
		filters: { accusedName: "O'Brien" }
	}, 'Investigator');

	assert.match(result.query, /O''Brien/);
	assert.doesNotMatch(result.query, /;/);
});

test('builds bounded partial-match filters for crime type and location', () => {
	const result = buildSafeQuery({
		requestedFields: ['CrimeNo', 'CrimeTypeName', 'RegisteredAt'],
		filters: {
			crimeTypeContains: 'Theft',
			locationContains: 'Koramangala',
			registeredFrom: '2026-07-01 00:00:00',
			registeredTo: '2026-07-31 23:59:59'
		},
		limit: 20
	}, 'Constable');

	assert.match(result.query, /CrimeTypeName LIKE '\*Theft\*'/);
	assert.match(result.query, /VictimAddress LIKE '\*Koramangala\*'/);
	assert.match(result.query, /VictimStatement LIKE '\*Koramangala\*'/);
	assert.match(result.query, /RegisteredAt >= '2026-07-01 00:00:00'/);
});

test('rejects user-supplied wildcard characters in partial matches', () => {
	assert.throws(
		() => buildSafeQuery({
			filters: { locationContains: '*' }
		}, 'Investigator'),
		/cannot contain wildcard/
	);
});

test('parses JSON only and rejects executable text', () => {
	assert.deepEqual(parseSearchIntent('```json\n{"requestedFields":["CrimeNo"]}\n```'), {
		requestedFields: ['CrimeNo']
	});
	assert.throws(() => parseSearchIntent('SELECT * FROM CaseRegistration'), /invalid search intent/);
});

test('normalizes safe AI sort synonyms while preserving strict rejection of unknown values', () => {
	const newestIntent = parseSearchIntent('{"requestedFields":["CrimeNo"],"sort":"descending"}');
	const oldestIntent = parseSearchIntent('{"requestedFields":["CrimeNo"],"sort":"earliest first"}');

	assert.equal(newestIntent.sort, 'newest');
	assert.equal(oldestIntent.sort, 'oldest');
	assert.match(buildSafeQuery(newestIntent, 'Investigator').query, /ORDER BY RegisteredAt DESC/);
	assert.match(buildSafeQuery(oldestIntent, 'Investigator').query, /ORDER BY RegisteredAt ASC/);
	const unknownAiIntent = parseSearchIntent('{"requestedFields":["CrimeNo"],"sort":"random"}');
	assert.equal(unknownAiIntent.sort, undefined);
	assert.match(buildSafeQuery(unknownAiIntent, 'Investigator').query, /ORDER BY RegisteredAt DESC/);
	assert.throws(
		() => buildSafeQuery({ requestedFields: ['CrimeNo'], sort: 'random' }, 'Investigator'),
		/sort must be either newest or oldest/
	);
});

test('allows Argos demo sessions to use full case fields and investigation filters', () => {
	const { query } = buildSafeQuery({
		requestedFields: ['CrimeNo', 'VictimName', 'VictimStatement', 'AccusedName'],
		filters: { accusedName: 'Demo Accused' },
		limit: 5
	}, 'Argos');

	assert.match(query, /VictimName/);
	assert.match(query, /VictimStatement/);
	assert.match(query, /AccusedName = 'Demo Accused'/);
});
