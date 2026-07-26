const test = require('node:test');
const assert = require('node:assert/strict');
const { createDemoSession, getRequestToken, signToken, verifyToken } = require('./auth');

test('reads Athena sessions from the dedicated custom header', () => {
	assert.equal(
		getRequestToken({ headers: { 'x-athena-token': 'custom-session-token' } }),
		'custom-session-token'
	);
});

test('retains Bearer-token compatibility for non-Catalyst clients', () => {
	assert.equal(
		getRequestToken({ headers: { authorization: 'Bearer fallback-session-token' } }),
		'fallback-session-token'
	);
});

test('signs and verifies an authenticated user session', () => {
	const previousSecret = process.env.AUTH_TOKEN_SECRET;
	process.env.AUTH_TOKEN_SECRET = 'test-only-secret-with-at-least-32-characters';

	try {
		const token = signToken({ Username: 'test.officer', Role: 'Investigator' });
		const claims = verifyToken(token);
		assert.equal(claims.sub, 'test.officer');
		assert.equal(claims.role, 'Investigator');
	} finally {
		if (previousSecret === undefined) {
			delete process.env.AUTH_TOKEN_SECRET;
		} else {
			process.env.AUTH_TOKEN_SECRET = previousSecret;
		}
	}
});

test('creates a short-lived signed Argos demo session without database credentials', () => {
	const previousSecret = process.env.AUTH_TOKEN_SECRET;
	process.env.AUTH_TOKEN_SECRET = 'test-only-secret-with-at-least-32-characters';
	let responseBody;
	const response = {
		statusCode: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(body) {
			responseBody = body;
			return body;
		}
	};

	try {
		createDemoSession({}, response);
		const claims = verifyToken(responseBody.token);
		assert.equal(response.statusCode, 200);
		assert.equal(claims.sub, 'demo.argos');
		assert.equal(claims.role, 'Argos');
		assert.equal(claims.demo, true);
		assert.equal(responseBody.access, 'FULL_DEMO');
		assert.ok(claims.exp - claims.iat <= 30 * 60);
	} finally {
		if (previousSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
		else process.env.AUTH_TOKEN_SECRET = previousSecret;
	}
});
