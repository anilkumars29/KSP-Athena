// backend/agents/sql-agent.js
// This module will eventually call the Python QuickML endpoint for Qwen2.5-7B-Coder

async function generateSQL(userQuery) {
    // In production, this reads process.env.QUICKML_QWEN_CODER_ENDPOINT
    // For now, we mock the NL2SQL response to allow frontend testing without LLM latency

    console.log(`[SQL Agent] Translating intent for: "${userQuery}"`);

    const queryLower = userQuery.toLowerCase();

    // Mocked deterministic routing for testing Phase 1
    if (queryLower.includes('murder') || queryLower.includes('302')) {
        return `SELECT CaseMasterID, CrimeNo, BriefFacts FROM CaseMaster WHERE CrimeMinorHeadID = 302 LIMIT 5`;
    }

    if (queryLower.includes('financial') || queryLower.includes('money')) {
        return `SELECT TransactionID, SenderAccount, Amount FROM FinancialTransaction WHERE IsSuspicious = true LIMIT 5`;
    }

    // Default fallback mock query
    return `SELECT CaseMasterID, CrimeNo, CaseRegisteredDate FROM CaseMaster LIMIT 5`;
}

module.exports = { generateSQL };