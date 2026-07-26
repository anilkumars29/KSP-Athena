const test = require('node:test');
const assert = require('node:assert/strict');
const {
	CaseConversationError,
	buildSarvamMessages,
	listEvidenceFields,
	sanitiseHistory,
	validateCaseConversationInput
} = require('./case-conversation');

test('validates and normalises a bilingual case conversation request', () => {
	const input = validateCaseConversationInput({
		CrimeNo: '1001',
		question: ' Were their faces visible? ',
		language: 'kn',
		speak: true,
		history: [{ role: 'user', content: 'Who saw them?' }]
	});

	assert.equal(input.crimeNo, 1001);
	assert.equal(input.language, 'kn');
	assert.equal(input.question, 'Were their faces visible?');
	assert.equal(input.speak, true);
	assert.deepEqual(input.history, [{ role: 'user', content: 'Who saw them?' }]);
});

test('rejects invalid crime numbers and oversized conversation messages', () => {
	assert.throws(
		() => validateCaseConversationInput({ CrimeNo: '1 OR 1=1', question: 'test' }),
		CaseConversationError
	);
	assert.throws(
		() => sanitiseHistory([{ role: 'assistant', content: 'x'.repeat(1001) }]),
		/invalid message/
	);
});

test('builds a selected-FIR-only Sarvam prompt and preserves recent turns', () => {
	const messages = buildSarvamMessages({
		record: {
			CrimeNo: 1001,
			CrimeTypeName: 'Vehicle Theft',
			VictimStatement: 'Two people wore helmets, so their faces were not visible.'
		},
		question: 'Were their faces visible?',
		history: [{ role: 'assistant', content: 'Ask me about this FIR.' }],
		language: 'en'
	});

	assert.match(messages[0].content, /selected FIR context/i);
	assert.match(messages[0].content, /CrimeNo: 1001/);
	assert.match(messages[0].content, /faces were not visible/);
	assert.equal(messages[1].role, 'assistant');
	assert.deepEqual(messages.at(-1), { role: 'user', content: 'Were their faces visible?' });
});

test('lists the accessible FIR fields used as the evidence scope', () => {
	assert.deepEqual(
		listEvidenceFields({ ROWID: 'x', CrimeNo: 1001, VictimStatement: 'Statement', AccusedName: '' }),
		['CrimeNo', 'VictimStatement']
	);
});
