// backend/orchestration-node/rbac-gate.js
const catalyst = require('zcatalyst-sdk-node');

class SecurityGate {
    constructor(app, userRole) {
        this.app = app; // The Catalyst app instance
        this.userRole = userRole;

        // Define hierarchy where higher numbers = broader access
        this.roleHierarchy = {
            'Public': 1,
            'Constable': 2,
            'Investigator': 3,
            'Analyst': 4,
            'Supervisor': 5,
            'PolicyMaker': 6
        };
    }

    async evaluatePermissions(queryOrData, operationType) {
        const userLevel = this.roleHierarchy[this.userRole] || 1;
        const analystLevel = this.roleHierarchy['Analyst'];

        // Fields strictly protected by KSP-Athena governance rules
        const sensitiveFields = ['CasteID', 'ReligionID', 'caste_master_id'];

        if (operationType === 'READ_QUERY') {
            // Block LLM-generated ZCQL queries from accessing sensitive columns directly
            if (userLevel < analystLevel) {
                for (const field of sensitiveFields) {
                    if (queryOrData.toUpperCase().includes(field.toUpperCase())) {
                        throw new Error(`Governance Block: Role '${this.userRole}' is not authorized to query sensitive socio-demographic field: ${field}`);
                    }
                }
            }
            return queryOrData;
        }

        if (operationType === 'MASK_RESULTS') {
            // Ensure no sensitive data leaks in the JSON payload back to the React UI
            return queryOrData.map(row => {
                let maskedRow = { ...row };
                if (userLevel < analystLevel) {
                    sensitiveFields.forEach(field => {
                        if (maskedRow[field] !== undefined) {
                            maskedRow[field] = '***MASKED_BY_POLICY***';
                        }
                    });
                }
                return maskedRow;
            });
        }

        return queryOrData;
    }
}

module.exports = SecurityGate;