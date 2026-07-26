const test = require('node:test');
const assert = require('node:assert/strict');
const {
	FirValidationError,
	insertFirWithUniqueCrimeNo,
	validateFirInput
} = require('./fir-registration');

const validInput = {
	victimName: 'Rahul Sharma',
	victimAge: '34',
	mobileNo: '+91 98765-43210',
	location: 'Koramangala 5th Block',
	pincode: '560034',
	accusedName: '',
	crimeType: 'Theft',
	date: '2026-07-25',
	description: 'A factual description of the reported incident.'
};

test('validates and normalizes a complete FIR request', () => {
	const row = validateFirInput(validInput, new Date('2026-07-26T00:00:00Z'));

	assert.equal(row.VictimAge, 34);
	assert.equal(row.Pincode, 560034);
	assert.equal(row.VictimMobile, '9876543210');
	assert.equal(row.AccusedName, 'Unknown');
	assert.equal(row.RegisteredAt, '2026-07-25 00:00:00');
});

test('rejects malformed or future FIR data', () => {
	assert.throws(
		() => validateFirInput({ ...validInput, pincode: '123' }),
		FirValidationError
	);
	assert.throws(
		() => validateFirInput(
			{ ...validInput, date: '2026-07-27' },
			new Date('2026-07-26T00:00:00Z')
		),
		/cannot be in the future/
	);
	assert.throws(
		() => validateFirInput({ ...validInput, unexpected: 'field' }),
		/Unsupported FIR field/
	);
});

test('skips an existing Crime Number before inserting', async () => {
	const checkedNumbers = [];
	const zcql = {
		executeZCQLQuery: async (query) => {
			checkedNumbers.push(query);
			return checkedNumbers.length === 1 ? [{ CaseRegistration: { CrimeNo: 111111 } }] : [];
		}
	};
	const table = {
		insertRow: async (row) => row
	};
	const numbers = [111111, 222222];

	const inserted = await insertFirWithUniqueCrimeNo({
		zcql,
		table,
		rowData: { VictimName: 'Test' },
		numberGenerator: () => numbers.shift()
	});

	assert.equal(inserted.CrimeNo, 222222);
	assert.equal(checkedNumbers.length, 2);
});

test('retries when a duplicate is inserted concurrently', async () => {
	let insertAttempts = 0;
	const zcql = { executeZCQLQuery: async () => [] };
	const table = {
		insertRow: async (row) => {
			insertAttempts += 1;
			if (insertAttempts === 1) {
				throw new Error('Unique constraint duplicate value');
			}
			return row;
		}
	};
	const numbers = [333333, 444444];

	const inserted = await insertFirWithUniqueCrimeNo({
		zcql,
		table,
		rowData: { VictimName: 'Test' },
		numberGenerator: () => numbers.shift()
	});

	assert.equal(inserted.CrimeNo, 444444);
	assert.equal(insertAttempts, 2);
});
