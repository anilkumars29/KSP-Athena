// backend/agents/citation-agent.js

async function synthesizeAnswer(dbResults, userQuery, language) {
    // In production, this reads process.env.QUICKML_QWEN_SYNTHESIS_ENDPOINT
    // For now, we mock the LLM synthesis to allow local testing

    if (!dbResults || dbResults.length === 0) {
        return "I could not find any records matching your query. Please try adjusting your search parameters.";
    }

    // Extract CaseMasterIDs to strictly enforce our citation rule
    const citations = dbResults.map(row => row.CaseMasterID || row.CrimeNo).filter(Boolean);

    console.log(`[Synthesis Agent] Generating answer for query in ${language} with citations:`, citations);

    let summaryText = "";

    if (language === 'kn') {
        // Mock Kannada response
        summaryText = `ನಿಮ್ಮ ಹುಡುಕಾಟದ ಆಧಾರದ ಮೇಲೆ, ನಾವು ${dbResults.length} ದಾಖಲೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇವೆ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`;
    } else {
        // Mock English response
        summaryText = `Based on your query, I found ${dbResults.length} relevant records in the state crime database.`;
    }

    return {
        answer: summaryText,
        citations: citations,
        rawData: dbResults // Sent back so the UI can render the source data tables
    };
}

module.exports = { synthesizeAnswer };