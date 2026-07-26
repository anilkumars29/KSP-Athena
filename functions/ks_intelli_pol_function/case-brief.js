const { splitSentences } = require('./statement-analysis');

const clean = value => String(value || '').trim();

const isKnown = value => {
	const normalised = clean(value).toLocaleLowerCase('en-IN');
	return Boolean(normalised && !['unknown', 'not known', 'not available', 'na', 'nil', 'none'].includes(normalised));
};

const TEMPORAL_PATTERN = /\b(?:\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)|\d{1,2}\s*(?:a\.?m\.?|p\.?m\.?)|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gi;
const SEQUENCE_PATTERN = /\b(?:before|after|then|later|initially|subsequently|returned|finally|during|while)\b/i;

const extractTimeline = statement => {
	const events = [];
	splitSentences(statement).forEach((sentence, statementIndex) => {
		const temporalLabels = sentence.match(TEMPORAL_PATTERN) || [];
		if (temporalLabels.length > 0 || SEQUENCE_PATTERN.test(sentence)) {
			events.push({
				order: statementIndex + 1,
				label: temporalLabels.length > 0 ? temporalLabels.join(' · ') : `Statement step ${statementIndex + 1}`,
				event: sentence,
				source: 'VictimStatement',
				precision: temporalLabels.length > 0 ? 'Explicit time/date in statement' : 'Relative sequence from statement'
			});
		}
	});
	return events.slice(0, 10);
};

const EVIDENCE_RULES = [
	{
		category: 'CCTV / video',
		pattern: /\b(?:cctv|camera|footage|video|recording)\b/i,
		followUp: 'Preserve and review relevant footage; record the requested time window and camera location.'
	},
	{
		category: 'Witness',
		pattern: /\b(?:witness|security guard|shop owner|bystander|noticed|saw|heard)\b/i,
		followUp: 'Identify and formally examine the referenced witness; distinguish direct observation from hearsay.'
	},
	{
		category: 'Vehicle',
		pattern: /\b(?:vehicle|motorcycle|bike|car|registration no|number plate)\b/i,
		followUp: 'Verify and circulate recorded vehicle identifiers through authorised vehicle-tracing channels.'
	},
	{
		category: 'Digital / telecom',
		pattern: /\b(?:phone|mobile|call|message|imei|sim|social media|email)\b/i,
		followUp: 'Preserve relevant digital identifiers and seek records only through the required legal process.'
	},
	{
		category: 'Financial',
		pattern: /\b(?:bank|account|transaction|payment|upi|wallet|cash|money)\b/i,
		followUp: 'Preserve referenced transaction details and verify the money trail through authorised requests.'
	},
	{
		category: 'Weapon',
		pattern: /\b(?:weapon|knife|gun|pistol|firearm|blade)\b/i,
		followUp: 'Record the exact weapon description and compare it with recovered-property and related-case records.'
	},
	{
		category: 'Documents / property',
		pattern: /\b(?:document|certificate|insurance|registration certificate|rc book|property|helmet)\b/i,
		followUp: 'List the referenced property or documents precisely and verify serial or registration identifiers.'
	}
];

const extractEvidenceLeads = statement => {
	const sentences = splitSentences(statement);
	return EVIDENCE_RULES.flatMap(rule => {
		const excerpt = sentences.find(sentence => rule.pattern.test(sentence));
		return excerpt ? [{
			category: rule.category,
			excerpt,
			source: 'VictimStatement',
			suggestedCheck: rule.followUp
		}] : [];
	});
};

const buildCaseBrief = record => {
	const crimeNo = clean(record.CrimeNo);
	const crimeType = clean(record.CrimeTypeName) || 'Unclassified crime';
	const status = clean(record.CaseStatus) || 'Status unavailable';
	const division = clean(record.DivisionName);
	const pincode = clean(record.Pincode);
	const location = clean(record.VictimAddress);
	const accused = clean(record.AccusedName);
	const statement = clean(record.VictimStatement);

	const place = location || [division, pincode ? `pincode ${pincode}` : ''].filter(Boolean).join(', ');
	const overviewParts = [`FIR ${crimeNo} records ${crimeType.toLocaleLowerCase('en-IN')}`];
	if (place) overviewParts.push(`at ${place}`);
	overviewParts.push(`and is currently marked ${status}`);

	const keyFacts = [
		{ label: 'Crime number', value: crimeNo, source: 'CrimeNo' },
		{ label: 'Crime type', value: crimeType, source: 'CrimeTypeName' },
		{ label: 'Case status', value: status, source: 'CaseStatus' },
		...(clean(record.RegisteredAt)
			? [{ label: 'Recorded incident date', value: clean(record.RegisteredAt), source: 'RegisteredAt' }]
			: []),
		...(division ? [{ label: 'Division', value: division, source: 'DivisionName' }] : []),
		...(pincode ? [{ label: 'Pincode', value: pincode, source: 'Pincode' }] : []),
		...(location ? [{ label: 'Recorded location', value: location, source: 'VictimAddress' }] : []),
		...(isKnown(accused) ? [{ label: 'Named accused in record', value: accused, source: 'AccusedName' }] : [])
	];

	const timeline = [
		...(clean(record.RegisteredAt) ? [{
			order: 0,
			label: 'Recorded incident date',
			event: clean(record.RegisteredAt),
			source: 'RegisteredAt',
			precision: 'Structured FIR field'
		}] : []),
		...extractTimeline(statement)
	];
	const evidenceLeads = extractEvidenceLeads(statement);

	return {
		crimeNo,
		overview: `${overviewParts.join(' ')}.`,
		keyFacts,
		statementExcerpts: statement ? splitSentences(statement).slice(0, 3) : [],
		timeline,
		evidenceLeads,
		statementAnalysisAvailable: Boolean(statement),
		method: 'Extractive rules over structured FIR fields and exact statement sentences; no facts are generated beyond the record.'
	};
};

module.exports = { buildCaseBrief, extractEvidenceLeads, extractTimeline };
