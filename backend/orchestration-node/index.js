// backend/orchestration-node/index.js
const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const SecurityGate = require('./rbac-gate');
const { generateSQL } = require('../agents/sql-agent');

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const catalystApp = catalyst.initialize(req);
    const { userQuery, role, language } = req.body;

    try {
        // 1. Initialize Governance Gate
        const gate = new SecurityGate(catalystApp, role);

        // 2. Route to SQL Agent for NL2SQL Translation
        const rawSql = await generateSQL(userQuery);

        // 3. Governance Check on generated query
        // Blocks the query entirely if an unauthorized role asks for sensitive fields
        const safeSql = await gate.evaluatePermissions(rawSql, 'READ_QUERY');

        // 4. Execute ZCQL Query on Catalyst Data Store
        const zcql = catalystApp.zcql();
        const dbResults = await zcql.executeZCQLQuery(safeSql);

        // 5. Mask Results before sending back to the frontend
        const maskedResults = await gate.evaluatePermissions(dbResults, 'MASK_RESULTS');

        res.status(200).json({
            success: true,
            queryExecuted: safeSql,
            data: maskedResults
        });
    } catch (error) {
        res.status(403).json({ success: false, error: error.message });
    }
});

app.post('/api/export-session', async (req, res) => {
    try {
        const { sessionHistory } = req.body;

        // Generate the raw PDF buffer using PDFKit
        const pdfBuffer = await generateConversationPDF(sessionHistory);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=KSP-Athena-Session.pdf');
        res.status(200).send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ success: false, error: "PDF Generation Failed" });
    }
});

module.exports = app;