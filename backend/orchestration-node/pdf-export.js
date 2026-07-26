// backend/orchestration-node/pdf-export.js
const PDFDocument = require('pdfkit'); //

/**
 * Generates a structured PDF containing the conversation history and cited records.
 * @param {Array} history - Array of previous query/response objects for the session.
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
function generateConversationPDF(history) {
    return new Promise((resolve, reject) => {
        try {
            // Create a document using PDFKit's standard API
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            // Listen to data events to collect the stream into a buffer
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header Section
            doc.font('Helvetica-Bold') // Standard fonts are built-in
                .fontSize(18)
                .text('KSP-Athena: Intelligence Session Export', { align: 'center' });

            doc.moveDown();
            doc.fontSize(10).font('Helvetica')
                .text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' })
                .text(`Classification: CONFIDENTIAL - LAW ENFORCEMENT SENSITIVE`, { align: 'right' });

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Line separator
            doc.moveDown(2);

            // Conversation History Iteration
            history.forEach((entry, index) => {
                // User Query
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#003366')
                    .text(`Query [${index + 1}]: `)
                    .font('Helvetica').fillColor('black')
                    .text(entry.userQuery);

                doc.moveDown(0.5);

                // Bot Response
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#2d862d')
                    .text(`KSP-Athena Analysis: `)
                    .font('Helvetica').fillColor('black')
                    .text(entry.botResponse);

                // Citations block
                if (entry.citations && entry.citations.length > 0) {
                    doc.moveDown(0.5);
                    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666666')
                        .text(`Evidence Citations (CaseMasterIDs): ${entry.citations.join(', ')}`);
                }

                doc.moveDown(1.5);
            });

            // Footer
            doc.text('End of Report', { align: 'center' });

            // Finalize the PDF
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateConversationPDF };