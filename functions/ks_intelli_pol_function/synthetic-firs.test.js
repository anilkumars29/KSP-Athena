const test = require('node:test');
const assert = require('node:assert/strict');
const {
	SEED_VERSION,
	assertSyntheticSeedRole,
	seedSyntheticFirs,
	syntheticFirs,
	validateSyntheticFirs
} = require('./synthetic-firs');

test('contains exactly 25 uniquely numbered and clearly labelled synthetic FIRs', () => {
	assert.equal(validateSyntheticFirs(syntheticFirs), true);
	assert.equal(syntheticFirs.length, 25);
	assert.equal(new Set(syntheticFirs.map(record => record.CrimeNo)).size, 25);
	assert.ok(syntheticFirs.every(record => record.RegisteredBy === SEED_VERSION));
	assert.ok(syntheticFirs.every(record => record.VictimStatement.startsWith('SYNTHETIC TEST RECORD')));
});

test('covers every supported crime type, multiple months, divisions, and age groups', () => {
	assert.deepEqual(
		new Set(syntheticFirs.map(record => record.CrimeTypeName)),
		new Set(['Theft', 'Assault', 'Cyber Crime', 'Fraud', 'Missing Person'])
	);
	assert.ok(new Set(syntheticFirs.map(record => record.RegisteredAt.slice(0, 7))).size >= 10);
	assert.ok(new Set(syntheticFirs.map(record => record.DivisionName)).size >= 6);
	assert.ok(Math.min(...syntheticFirs.map(record => record.VictimAge)) < 18);
	assert.ok(Math.max(...syntheticFirs.map(record => record.VictimAge)) > 60);
});

test('contains repeat-offender, co-accused, hotspot, and financial-link test signals', () => {
	assert.ok(syntheticFirs.filter(record => record.AccusedName.includes('Ravi Kumar')).length >= 3);
	assert.ok(syntheticFirs.filter(record => record.AccusedName.includes(',')).length >= 4);
	assert.ok(syntheticFirs.filter(record =>
		record.Pincode === 560034 && record.CrimeTypeName === 'Theft'
	).length >= 4);
	assert.ok(syntheticFirs.filter(record =>
		/\b(?:UPI|bank|account|transfer|wallet)\b/i.test(record.VictimStatement)
	).length >= 6);
});

test('restricts synthetic seeding to supervisors', () => {
	assert.doesNotThrow(() => assertSyntheticSeedRole('Supervisor'));
	assert.throws(() => assertSyntheticSeedRole('Analyst'), /Supervisor role/);
});

test('inserts only missing synthetic FIRs and reports number conflicts without overwriting', async () => {
	const inserted = [];
	const result = await seedSyntheticFirs({
		zcql: {
			executeZCQLQuery: async () => [
				{ CaseRegistration: { CrimeNo: 926001, RegisteredBy: SEED_VERSION } },
				{ CaseRegistration: { CrimeNo: 926002, RegisteredBy: 'real.officer' } }
			]
		},
		table: {
			insertRow: async row => {
				inserted.push(row);
				return row;
			}
		}
	});
	assert.equal(result.inserted, 23);
	assert.equal(result.alreadyPresent, 1);
	assert.equal(result.conflicts, 1);
	assert.deepEqual(result.conflictingCrimeNos, [926002]);
	assert.equal(inserted.length, 23);
	assert.ok(inserted.every(row => row.RegisteredBy === SEED_VERSION));
});
