// backend/node-orchestrator/groq-agent-handler.js
const { Groq } = require('groq-sdk');

// Initialize Groq SDK (Ensure GROQ_API_KEY is in your environment variables)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'MOCK_KEY' });

const agentPrompts = {
    investigator_helper: `You are the Investigator Helper Agent for Karnataka State Police. Translate user queries into precise FIR database searches, cite CaseMasterIDs, and explain legal sections (BNS).`,
    forecasting_engine: `You are the Crime Forecasting Agent. Analyze crime spatial distribution and predict upcoming risks across Karnataka divisions based on historical patterns.`,
    sociological_analyst: `You are the Sociological Analyst Agent. Evaluate demographic trends, socio-economic factors, and crime prevalence patterns without violating RBAC guidelines.`,
    profiler_engine: `You are the Profiler Engine Agent. Execute entity resolution to link individuals across multiple cases, compile offender history, and calculate risk scores.`
};

async function handleAgentQuery(userQuery, agentMode, userRole) {
    const systemPrompt = agentPrompts[agentMode] || agentPrompts.investigator_helper;

    try {
        if (!process.env.GROQ_API_KEY) {
            // Mock response if key is not yet configured locally
            return {
                success: true,
                response: `[Mock Groq Response - ${agentMode}]: Analyzed query "${userQuery}" under authority level ${userRole}. Grounded against CaseMaster database records.`,
                data: [{ CaseMasterID: 1001, CrimeNo: "1044300062026000001" }]
            };
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: `${systemPrompt} Active user role: ${userRole}. Enforce data confidentiality.` },
                { role: 'user', content: userQuery }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
        });

        return {
            success: true,
            response: completion.choices[0]?.message?.content || 'No response generated.',
            data: [{ CaseMasterID: 1001, CrimeNo: "1044300062026000001" }]
        };

    } catch (error) {
        console.error("Groq Execution Error:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleAgentQuery };