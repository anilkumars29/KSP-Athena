const test = require('node:test');
const assert = require('node:assert/strict');
const { syntheticFirs } = require('./synthetic-firs');
const {
	SEED_VERSION_V2,
	seedSyntheticFirsV2,
	syntheticFirsV2,
	validateSyntheticFirsV2
} = require('./synthetic-firs-v2');

test('contains 30 unique, clearly labelled, long-form V2 FIRs', () => {
	assert.equal(validateSyntheticFirsV2(syntheticFirsV2), true);
	assert.equal(syntheticFirsV2.length, 30);
	assert.equal(new Set(syntheticFirsV2.map(record => record.CrimeNo)).size, 30);
	assert.ok(syntheticFirsV2.every(record => record.RegisteredBy === SEED_VERSION_V2));
	assert.ok(syntheticFirsV2.every(record => record.VictimStatement.length >= 700));
});

test('covers Karnataka broadly and retains intentional relationships to V1 victims', () => {
	assert.ok(new Set(syntheticFirsV2.map(record => record.DivisionName)).size >= 20);
	assert.ok(new Set(syntheticFirsV2.map(record => record.Pincode)).size >= 20);
	const originalVictims = new Set(syntheticFirs.map(record => record.VictimName));
	assert.ok(syntheticFirsV2.filter(record => originalVictims.has(record.VictimName)).length >= 8);
});

test('covers all crime types plus repeat suspects, financial links, and cross-FIR references', () => {
	assert.deepEqual(
		new Set(syntheticFirsV2.map(record => record.CrimeTypeName)),
		new Set(['Theft', 'Assault', 'Cyber Crime', 'Fraud', 'Missing Person'])
	);
	assert.ok(syntheticFirsV2.filter(record => record.AccusedName.includes(',')).length >= 3);
	assert.ok(syntheticFirsV2.filter(record => /(?:account|payment|transfer|UPI|wallet)/i.test(record.VictimStatement)).length >= 10);
	assert.ok(syntheticFirsV2.filter(record => /FIR 92\d{4}/.test(record.VictimStatement)).length >= 12);
});

test('inserts only absent V2 rows and reports conflicts without overwriting', async () => {
	const inserted = [];
	const result = await seedSyntheticFirsV2({
		zcql: {
			executeZCQLQuery: async () => [
				{ CaseRegistration: { CrimeNo: 927001, RegisteredBy: SEED_VERSION_V2 } },
				{ CaseRegistration: { CrimeNo: 927002, RegisteredBy: 'real.officer' } }
			]
		},
		table: { insertRow: async row => inserted.push(row) }
	});
	assert.equal(result.inserted, 28);
	assert.equal(result.alreadyPresent, 1);
	assert.equal(result.conflicts, 1);
	assert.deepEqual(result.conflictingCrimeNos, [927002]);
	assert.ok(inserted.every(row => row.RegisteredBy === SEED_VERSION_V2));
});
