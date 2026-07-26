const crypto = require('crypto');
const { getConversationUserId } = require('./conversation-history');

const AUDIT_TABLE = 'ConversationHistory';
const AUDIT_VERSION = 'audit-v1';
const READ_ROLES = new Set(['Supervisor', 'Argos']);
const OUTCOMES = new Set(['SUCCESS', 'DENIED', 'FAILED']);
const ACTION_PATTERN = /^[A-Z][A-Z0-9_]{2,60}$/;

const getSecret = () => {
	const secret = process.env.AUTH_TOKEN_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error('AUTH_TOKEN_SECRET must be configured with at least 32 characters.');
	}
	return secret;
};

const createAuditId = () => crypto.randomInt(1000000000, 2147483647);

const canonicalEvent = event => JSON.stringify({
	auditId: String(event.auditId),
	actorId: String(event.actorId),
	username: event.username,
	role: event.role,
	action: event.action,
	outcome: event.outcome,
	targetType: event.targetType,
	targetId: event.targetId,
	details: event.details,
	createdAt: event.createdAt
});

const signEvent = event =>
	crypto.createHmac('sha256', getSecret()).update(canonicalEvent(event)).digest('hex');

const safeDetails = details => {
	if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
	const serialised = JSON.stringify(details);
	if (serialised.length > 2000) {
		throw new Error('Audit details exceed the 2000-character limit.');
	}
	return JSON.parse(serialised);
};

const buildAuditEvent = ({ actor, action, outcome = 'SUCCESS', targetType = '', targetId = '', details = {}, now = new Date() }) => {
	if (!actor?.username || !actor?.role) throw new Error('Audit actor is required.');
	if (!ACTION_PATTERN.test(action)) throw new Error('Invalid audit action.');
	if (!OUTCOMES.has(outcome)) throw new Error('Invalid audit outcome.');

	const event = {
		auditId: createAuditId(),
		actorId: getConversationUserId(actor.username),
		username: String(actor.username).slice(0, 50),
		role: String(actor.role).slice(0, 30),
		action,
		outcome,
		targetType: String(targetType || '').slice(0, 50),
		targetId: String(targetId || '').slice(0, 100),
		details: safeDetails(details),
		createdAt: now.toISOString().replace('T', ' ').substring(0, 19)
	};
	return { ...event, signature: signEvent(event) };
};

const eventToRow = event => ({
	ConversationID: event.auditId,
	UserID: event.actorId,
	Role: event.role,
	SessionID: event.auditId,
	Content: JSON.stringify({
		version: AUDIT_VERSION,
		username: event.username,
		action: event.action,
		outcome: event.outcome,
		targetType: event.targetType,
		targetId: event.targetId,
		details: event.details,
		createdAt: event.createdAt,
		signature: event.signature
	}),
	Language: AUDIT_VERSION
});

const recordAudit = async ({ app, actor, action, outcome, targetType, targetId, details }) => {
	try {
		const event = buildAuditEvent({ actor, action, outcome, targetType, targetId, details });
		await app.datastore().table(AUDIT_TABLE).insertRow(eventToRow(event));
		return { logged: true, auditId: event.auditId };
	} catch (error) {
		console.error('Persistent Audit Write Error:', error.message);
		return { logged: false };
	}
};

const unwrapRow = row => row?.[AUDIT_TABLE] || row;

const decodeAuditRow = rawRow => {
	const row = unwrapRow(rawRow);
	try {
		const payload = JSON.parse(row.Content || row.BotResponse);
		const event = {
			auditId: String(row.ConversationID || row.SessionID),
			actorId: String(row.UserID),
			username: String(payload.username || ''),
			role: String(row.Role || ''),
			action: String(payload.action || row.UserQuery || ''),
			outcome: String(payload.outcome || ''),
			targetType: String(payload.targetType || ''),
			targetId: String(payload.targetId || ''),
			details: payload.details && typeof payload.details === 'object' ? payload.details : {},
			createdAt: String(payload.createdAt || row.CREATEDTIME || row.CreatedAt || '')
		};
		const expected = signEvent(event);
		const supplied = String(payload.signature || '');
		const intact = supplied.length === expected.length &&
			crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
		return { ...event, intact, version: payload.version || 'legacy' };
	} catch {
		return {
			auditId: String(row?.ConversationID || row?.SessionID || ''),
			actorId: String(row?.UserID || ''),
			username: '',
			role: String(row?.Role || ''),
			action: String(row?.UserQuery || 'UNREADABLE_EVENT'),
			outcome: 'FAILED',
			targetType: '',
			targetId: '',
			details: {},
			createdAt: String(row?.CREATEDTIME || row?.CreatedAt || ''),
			intact: false,
			version: 'legacy-or-invalid'
		};
	}
};

const assertAuditReader = role => {
	if (!READ_ROLES.has(role)) {
		const error = new Error('Supervisor role is required to view audit events.');
		error.statusCode = 403;
		throw error;
	}
};

const listAuditEvents = async ({ zcql, role, action = '', actor = '', outcome = '', limit = 100 }) => {
	assertAuditReader(role);
	const boundedLimit = Number(limit);
	if (!Number.isInteger(boundedLimit) || boundedLimit < 1 || boundedLimit > 200) {
		const error = new Error('Audit limit must be between 1 and 200.');
		error.statusCode = 400;
		throw error;
	}
	if (action && !ACTION_PATTERN.test(action)) {
		const error = new Error('Invalid audit action filter.');
		error.statusCode = 400;
		throw error;
	}
	if (outcome && !OUTCOMES.has(outcome)) {
		const error = new Error('Invalid audit outcome filter.');
		error.statusCode = 400;
		throw error;
	}
	const actorFilter = String(actor || '').trim().toLocaleLowerCase('en-IN');
	if (actorFilter.length > 50) {
		const error = new Error('Invalid audit actor filter.');
		error.statusCode = 400;
		throw error;
	}

	const rows = await zcql.executeZCQLQuery(
		`SELECT ConversationID, UserID, Role, SessionID, Content, Language, CREATEDTIME FROM ${AUDIT_TABLE} WHERE Language = '${AUDIT_VERSION}' ORDER BY CREATEDTIME DESC LIMIT 200`
	);
	return rows
		.map(decodeAuditRow)
		.filter(event => !action || event.action === action)
		.filter(event => !outcome || event.outcome === outcome)
		.filter(event => !actorFilter ||
			event.username.toLocaleLowerCase('en-IN').includes(actorFilter) ||
			event.actorId.includes(actorFilter)
		)
		.slice(0, boundedLimit);
};

module.exports = {
	AUDIT_TABLE,
	assertAuditReader,
	buildAuditEvent,
	decodeAuditRow,
	eventToRow,
	listAuditEvents,
	recordAudit
};
