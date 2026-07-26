const test = require('node:test');
const assert = require('node:assert/strict');
const {
	decodeContent,
	encodeContent,
	formatConversationContext,
	getConversationUserId,
	insertMessage,
	loadConversation,
	validateSessionId
} = require('./conversation-history');

const secret = 'test-only-secret-with-at-least-32-characters';

test('derives a stable bounded user identifier without storing the username', () => {
	const first = getConversationUserId('officer.test', secret);
	const second = getConversationUserId('officer.test', secret);
	assert.equal(first, second);
	assert.ok(first > 0 && first <= 2147483647);
	assert.notEqual(first, getConversationUserId('another.officer', secret));
});

test('validates bounded numeric conversation sessions', () => {
	assert.equal(validateSessionId('123456789'), 123456789);
	assert.throws(() => validateSessionId('not-a-number'), /valid conversation session/);
	assert.throws(() => validateSessionId(2147483648), /valid conversation session/);
});

test('encodes display metadata and supports legacy plain-text rows', () => {
	const explainability = { version: 'evidence-v1', resultCount: 1 };
	const encoded = encodeContent({
		text: 'Show theft cases.',
		agentMode: 'investigator_helper',
		citations: [123456],
		explainability
	});
	assert.deepEqual(decodeContent(encoded), {
		text: 'Show theft cases.',
		agentMode: 'investigator_helper',
		citations: [123456],
		explainability
	});
	assert.deepEqual(decodeContent('legacy response'), { text: 'legacy response' });
});

test('loads only the authenticated user and requested session in chronological order', async () => {
	const previousSecret = process.env.AUTH_TOKEN_SECRET;
	process.env.AUTH_TOKEN_SECRET = secret;
	let query;
	try {
		const messages = await loadConversation({
			zcql: {
				executeZCQLQuery: async (value) => {
					query = value;
					return [
						{ ConversationHistory: { Role: 'assistant', Content: encodeContent({ text: 'Second' }), Language: 'en' } },
						{ ConversationHistory: { Role: 'user', Content: encodeContent({ text: 'First' }), Language: 'en' } }
					];
				}
			},
			username: 'officer.test',
			sessionId: 222222222
		});
		assert.match(query, /WHERE UserID = \d+ AND SessionID = 222222222/);
		assert.deepEqual(messages.map((message) => message.text), ['First', 'Second']);
	} finally {
		if (previousSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
		else process.env.AUTH_TOKEN_SECRET = previousSecret;
	}
});

test('retries a duplicate conversation identifier', async () => {
	const previousSecret = process.env.AUTH_TOKEN_SECRET;
	process.env.AUTH_TOKEN_SECRET = secret;
	let attempts = 0;
	try {
		const row = await insertMessage({
			table: {
				insertRow: async (value) => {
					attempts += 1;
					if (attempts === 1) throw new Error('duplicate unique value');
					return value;
				}
			},
			username: 'officer.test',
			sessionId: 333333333,
			role: 'user',
			text: 'Test',
			language: 'en',
			numberGenerator: () => 444444444 + attempts
		});
		assert.equal(attempts, 2);
		assert.equal(row.Role, 'user');
	} finally {
		if (previousSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
		else process.env.AUTH_TOKEN_SECRET = previousSecret;
	}
});

test('formats bounded prior turns for follow-up resolution', () => {
	const context = formatConversationContext([
		{ role: 'user', text: 'Show thefts in Koramangala.' },
		{ role: 'assistant', text: 'Two cases were found.' }
	]);
	assert.match(context, /Officer: Show thefts in Koramangala/);
	assert.match(context, /Assistant: Two cases were found/);
});
