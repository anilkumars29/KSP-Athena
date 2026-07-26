const test = require('node:test');
const assert = require('node:assert/strict');
const { findRelevantEvidence, splitSentences } = require('./statement-analysis');

const statement = `The guard noticed two unidentified individuals wearing helmets.
Due to the helmets, their faces were not visible, and he assumed they were customers.
The shop owner heard a motorcycle being started quickly.`;

test('splits sentences even when punctuation has inconsistent spacing', () => {
	assert.deepEqual(
		splitSentences('First sentence.Second sentence! Third sentence?'),
		['First sentence.', 'Second sentence!', 'Third sentence?']
	);
});

test('prioritizes exact statement evidence relevant to the question', () => {
	const result = findRelevantEvidence(statement, 'Were the thieves faces visible?');

	assert.equal(result.strongMatch, true);
	assert.match(result.candidates[0].sentence, /faces were not visible/i);
	assert.deepEqual(result.candidates[0].matches.sort(), ['faces', 'visible']);
});

test('does not claim strong evidence for an unrelated question', () => {
	const result = findRelevantEvidence(statement, 'What was the vehicle registration number?');
	assert.equal(result.strongMatch, false);
});
