// backend/orchestration-node/audit-logger.js
const catalyst = require('zcatalyst-sdk-node');

async function logConversation(app, sessionData) {
    const { userID, role, sessionID, userQuery, botResponse, citations, language } = sessionData;

    try {
        const datastore = app.datastore();
        const table = datastore.table('ConversationLog');

        const insertPromise = table.insertRow({
            UserID: userID,
            Role: role,
            SessionID: sessionID,
            UserQuery: userQuery,
            BotResponse: botResponse,
            Citations: JSON.stringify(citations),
            Language: language,
            CreatedAt: new Date().toISOString()
        });

        await insertPromise;
        console.log(`[Audit Logger] Successfully logged session ${sessionID} to ConversationLog.`);
    } catch (error) {
        console.error(`[Audit Logger] Failed to log conversation:`, error);
        throw new Error("Audit Logging Failed: Compliance constraint violated.");
    }
}

module.exports = { logConversation };