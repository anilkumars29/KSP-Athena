const crypto = require('crypto');

const TABLE_NAME = 'ConversationHistory';
const MAX_SESSION_ID = 2147483647;
const MAX_CONTEXT_MESSAGES = 12;

const validateSessionId = (value) => {
	const sessionId = Number(value);
	if (!Number.isInteger(sessionId) || sessionId < 1 || sessionId > MAX_SESSION_ID) {
		throw new Error('A valid conversation session is required.');
	}
	return sessionId;
};

const createSessionId = () => crypto.randomInt(100000000, 1000000000);

const getConversationUserId = (username, secret = process.env.AUTH_TOKEN_SECRET) => {
	if (!secret || secret.length < 32) {
		throw new Error('AUTH_TOKEN_SECRET must be configured with at least 32 characters.');
	}
	const digest = crypto.createHmac('sha256', secret).update(String(username)).digest();
	return (digest.readUInt32BE(0) & 0x7fffffff) || 1;
};

const encodeContent = ({ text, agentMode, citations, explainability }) => JSON.stringify({
	version: 2,
	text: String(text || '').slice(0, 7000),
	...(agentMode ? { agentMode } : {}),
	...(Array.isArray(citations) && citations.length > 0 ? { citations: citations.slice(0, 50) } : {}),
	...(explainability && typeof explainability === 'object' ? { explainability } : {})
});

const decodeContent = (content) => {
	try {
		const parsed = JSON.parse(String(content || ''));
		if (parsed && typeof parsed.text === 'string') {
			return {
				text: parsed.text,
				agentMode: typeof parsed.agentMode === 'string' ? parsed.agentMode : undefined,
				citations: Array.isArray(parsed.citations) ? parsed.citations : undefined,
				explainability: parsed.explainability && typeof parsed.explainability === 'object'
					? parsed.explainability
					: undefined
			};
		}
	} catch {
		// Support any legacy rows that stored plain text.
	}
	return { text: String(content || '') };
};

const unwrapRow = (row) => row?.[TABLE_NAME] || row;

const loadConversation = async ({ zcql, username, sessionId, limit = MAX_CONTEXT_MESSAGES }) => {
	const safeSessionId = validateSessionId(sessionId);
	const safeLimit = Math.min(Math.max(Number(limit) || MAX_CONTEXT_MESSAGES, 1), 30);
	const userId = getConversationUserId(username);
	const result = await zcql.executeZCQLQuery(
		`SELECT Role, Content, Language, CREATEDTIME FROM ${TABLE_NAME} ` +
		`WHERE UserID = ${userId} AND SessionID = ${safeSessionId} ` +
		`ORDER BY CREATEDTIME DESC LIMIT ${safeLimit}`
	);

	return result
		.map(unwrapRow)
		.reverse()
		.map((row) => ({
			sender: row.Role === 'assistant' ? 'bot' : 'user',
			role: row.Role === 'assistant' ? 'assistant' : 'user',
			language: row.Language === 'kn' ? 'kn' : 'en',
			...decodeContent(row.Content)
		}));
};

const isDuplicateError = (error) =>
	/duplicate|unique|already exists/i.test(String(error?.message || error));

const insertMessage = async ({
	table,
	username,
	sessionId,
	role,
	text,
	language,
	agentMode,
	citations,
	explainability,
	numberGenerator = () => crypto.randomInt(100000000, 1000000000)
}) => {
	const safeSessionId = validateSessionId(sessionId);
	if (!['user', 'assistant'].includes(role)) {
		throw new Error('Conversation role must be user or assistant.');
	}

	for (let attempt = 0; attempt < 8; attempt += 1) {
		try {
			return await table.insertRow({
				ConversationID: numberGenerator(),
				SessionID: safeSessionId,
				UserID: getConversationUserId(username),
				Role: role,
				Content: encodeContent({ text, agentMode, citations, explainability }),
				Language: language === 'kn' ? 'kn' : 'en'
			});
		} catch (error) {
			if (!isDuplicateError(error)) {
				throw error;
			}
		}
	}
	throw new Error('Unable to allocate a unique conversation message identifier.');
};

const saveExchange = async ({
	table,
	username,
	sessionId,
	userText,
	assistantText,
	language,
	agentMode,
	citations,
	explainability
}) => {
	await insertMessage({
		table,
		username,
		sessionId,
		role: 'user',
		text: userText,
		language,
		agentMode
	});
	await insertMessage({
		table,
		username,
		sessionId,
		role: 'assistant',
		text: assistantText,
		language,
		agentMode,
		citations,
		explainability
	});
};

const formatConversationContext = (messages) => {
	if (!Array.isArray(messages) || messages.length === 0) {
		return 'No prior conversation.';
	}
	return messages
		.slice(-MAX_CONTEXT_MESSAGES)
		.map((message) => `${message.role === 'assistant' ? 'Assistant' : 'Officer'}: ${String(message.text).slice(0, 1000)}`)
		.join('\n');
};

module.exports = {
	createSessionId,
	decodeContent,
	encodeContent,
	formatConversationContext,
	getConversationUserId,
	insertMessage,
	loadConversation,
	saveExchange,
	validateSessionId
};
