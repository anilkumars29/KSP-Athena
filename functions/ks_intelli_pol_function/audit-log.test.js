const test = require('node:test');
const assert = require('node:assert/strict');

process.env.AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'test-secret-that-is-at-least-thirty-two-characters';

const {
	assertAuditReader,
	buildAuditEvent,
	decodeAuditRow,
	eventToRow,
	listAuditEvents,
	recordAudit
} = require('./audit-log');

test('creates a signed audit row without storing credential material', () => {
	const event = buildAuditEvent({
		actor: { username: 'officer.test', role: 'Investigator' },
		action: 'CASE_VIEWED',
		targetType: 'FIR',
		targetId: '4589',
		details: { resultCount: 1 },
		now: new Date('2026-07-26T10:00:00Z')
	});
	const row = eventToRow(event);
	assert.equal(JSON.parse(row.Content).action, 'CASE_VIEWED');
	assert.equal(row.Language, 'audit-v1');
	assert.doesNotMatch(row.Content, /password|token/i);
	assert.equal(decodeAuditRow(row).intact, true);
});

test('detects modified signed content', () => {
	const event = buildAuditEvent({
		actor: { username: 'supervisor.test', role: 'Supervisor' },
		action: 'AUDIT_VIEWED',
		targetType: 'AuditTrail'
	});
	const row = eventToRow(event);
	const payload = JSON.parse(row.Content);
	payload.outcome = 'FAILED';
	row.Content = JSON.stringify(payload);
	assert.equal(decodeAuditRow(row).intact, false);
});

test('restricts audit reads to supervisors and the full Argos demo', () => {
	assert.doesNotThrow(() => assertAuditReader('Supervisor'));
	assert.doesNotThrow(() => assertAuditReader('Argos'));
	assert.throws(() => assertAuditReader('Investigator'), /Supervisor role/);
});

test('filters decoded audit events with a bounded query', async () => {
	const first = eventToRow(buildAuditEvent({
		actor: { username: 'supervisor.test', role: 'Supervisor' },
		action: 'CASE_VIEWED'
	}));
	const second = eventToRow(buildAuditEvent({
		actor: { username: 'analyst.test', role: 'Analyst' },
		action: 'CHAT_QUERY'
	}));
	let query = '';
	const events = await listAuditEvents({
		zcql: { executeZCQLQuery: async value => { query = value; return [first, second]; } },
		role: 'Supervisor',
		action: 'CHAT_QUERY',
		actor: 'analyst',
		limit: 20
	});
	assert.match(query, /LIMIT 200$/);
	assert.equal(events.length, 1);
	assert.equal(events[0].username, 'analyst.test');
});

test('returns an unavailable result instead of breaking the protected action when storage fails', async () => {
	const result = await recordAudit({
		app: { datastore: () => ({ table: () => ({ insertRow: async () => { throw new Error('missing table'); } }) }) },
		actor: { username: 'officer.test', role: 'Investigator' },
		action: 'CASE_VIEWED'
	});
	assert.deepEqual(result, { logged: false });
});
