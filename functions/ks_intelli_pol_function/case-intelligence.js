const UNKNOWN_NAMES = new Set([
	'', 'unknown', 'unknown accused', 'not known', 'not available', 'na', 'n a', 'nil', 'none'
]);

const STOP_WORDS = new Set([
	'about', 'after', 'again', 'against', 'also', 'approximately', 'around', 'because',
	'been', 'before', 'being', 'could', 'from', 'have', 'into', 'more', 'near', 'not',
	'only', 'other', 'over', 'said', 'that', 'their', 'there', 'they', 'this', 'those',
	'through', 'under', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
	'would', 'request', 'police', 'case', 'complaint', 'incident', 'person', 'persons'
]);

const normaliseText = value => String(value || '')
	.normalize('NFKC')
	.toLocaleLowerCase('en-IN')
	.replace(/[^\p{L}\p{N}]+/gu, ' ')
	.trim()
	.replace(/\s+/g, ' ');

const splitAccusedNames = value => {
	const raw = String(value || '').trim();
	if (!raw) return [];
	return [...new Set(
		raw.split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
			.map(normaliseText)
			.filter(name => name.length >= 2 && !UNKNOWN_NAMES.has(name))
	)];
};

const statementTokens = value => new Set(
	normaliseText(value)
		.split(' ')
		.filter(token => token.length >= 4 && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
);

const sharedStatementTerms = (left, right) => {
	const leftTokens = statementTokens(left);
	const rightTokens = statementTokens(right);
	return [...leftTokens]
		.filter(token => rightTokens.has(token))
		.sort((a, b) => b.length - a.length || a.localeCompare(b))
		.slice(0, 5);
};

const sameValue = (left, right) => {
	const first = normaliseText(left);
	const second = normaliseText(right);
	return Boolean(first && second && first === second);
};

const dateDistanceDays = (left, right) => {
	const first = new Date(left);
	const second = new Date(right);
	if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return null;
	return Math.abs(first.getTime() - second.getTime()) / 86400000;
};

const scoreCandidate = (target, candidate, includeSensitiveSignals) => {
	let score = 0;
	const reasons = [];

	if (sameValue(target.CrimeTypeName, candidate.CrimeTypeName)) {
		score += 35;
		reasons.push('Same crime type');
	}
	if (String(target.Pincode || '') && String(target.Pincode) === String(candidate.Pincode || '')) {
		score += 25;
		reasons.push(`Same pincode ${target.Pincode}`);
	}
	if (sameValue(target.DivisionName, candidate.DivisionName)) {
		score += 15;
		reasons.push('Same police division');
	}
	if (sameValue(target.CaseStatus, candidate.CaseStatus)) {
		score += 5;
		reasons.push('Same case status');
	}

	const distance = dateDistanceDays(target.RegisteredAt, candidate.RegisteredAt);
	if (distance !== null && distance <= 90) {
		score += 10;
		reasons.push('Registered within 90 days');
	} else if (distance !== null && distance <= 365) {
		score += 5;
		reasons.push('Registered within one year');
	}

	if (includeSensitiveSignals) {
		const targetNames = splitAccusedNames(target.AccusedName);
		const candidateNames = splitAccusedNames(candidate.AccusedName);
		const sharedNames = targetNames.filter(name => candidateNames.includes(name));
		if (sharedNames.length > 0) {
			score += 40;
			reasons.push('Same accused name appears in both records');
		}

		const sharedTerms = sharedStatementTerms(target.VictimStatement, candidate.VictimStatement);
		if (sharedTerms.length >= 2) {
			score += Math.min(20, sharedTerms.length * 4);
			reasons.push(`Shared statement terms: ${sharedTerms.join(', ')}`);
		}
	}

	return {
		crimeNo: String(candidate.CrimeNo),
		crimeType: candidate.CrimeTypeName || 'Unclassified',
		registeredAt: candidate.RegisteredAt || null,
		division: candidate.DivisionName || 'Unknown',
		pincode: candidate.Pincode || null,
		caseStatus: candidate.CaseStatus || 'Unknown',
		score: Math.min(100, score),
		reasons
	};
};

const buildRepeatAssociations = (target, records) => {
	const targetNames = splitAccusedNames(target.AccusedName);
	return targetNames.map(name => {
		const matchingCases = records
			.filter(record => splitAccusedNames(record.AccusedName).includes(name))
			.map(record => ({
				crimeNo: String(record.CrimeNo),
				crimeType: record.CrimeTypeName || 'Unclassified',
				registeredAt: record.RegisteredAt || null,
				division: record.DivisionName || 'Unknown'
			}))
			.filter((record, index, all) =>
				all.findIndex(item => item.crimeNo === record.crimeNo) === index
			);

		return {
			name: String(target.AccusedName)
				.split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
				.find(rawName => normaliseText(rawName) === name) || name,
			caseCount: matchingCases.length,
			cases: matchingCases
		};
	}).filter(association => association.caseCount > 1);
};

const buildCaseIntelligence = ({ target, records, role }) => {
	const includeSensitiveSignals = new Set(['Investigator', 'Supervisor', 'Analyst', 'Argos']).has(role);
	const candidates = records.filter(record => String(record.CrimeNo) !== String(target.CrimeNo));
	const similarCases = candidates
		.map(record => scoreCandidate(target, record, includeSensitiveSignals))
		.filter(result => result.score >= 20)
		.sort((a, b) => b.score - a.score || String(b.registeredAt).localeCompare(String(a.registeredAt)))
		.slice(0, 8);

	return {
		targetCrimeNo: String(target.CrimeNo),
		similarCases,
		repeatAssociations: includeSensitiveSignals ? buildRepeatAssociations(target, records) : [],
		sensitiveSignalsIncluded: includeSensitiveSignals,
		coverage: {
			recordsCompared: candidates.length,
			recordCapReached: records.length === 300,
			method: 'Deterministic weighted matching of recorded fields; no guilt inference or predictive model.'
		}
	};
};

module.exports = {
	buildCaseIntelligence,
	normaliseText,
	scoreCandidate,
	sharedStatementTerms,
	splitAccusedNames
};
