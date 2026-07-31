class QueryPolicyError extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.name = 'QueryPolicyError';
		this.statusCode = statusCode;
	}
}

const ALL_FIELDS = new Set([
	'CrimeNo', 'VictimName', 'VictimAge', 'VictimMobile', 'VictimAddress',
	'AccusedName', 'AccusedAge', 'AccusedMobile', 'Pincode', 'DivisionName',
	'CrimeTypeID', 'CrimeTypeName', 'VictimStatement', 'CaseStatus',
	'RegisteredAt', 'RegisteredBy'
]);

const BASIC_FIELDS = [
	'CrimeNo', 'CrimeTypeName', 'Pincode', 'DivisionName', 'CaseStatus', 'RegisteredAt'
];

const INVESTIGATION_FIELDS = [
	...BASIC_FIELDS, 'VictimName', 'VictimAge', 'VictimAddress',
	'AccusedName', 'AccusedAge', 'VictimStatement'
];

const FULL_FIELDS = [...ALL_FIELDS];

const ROLE_FIELDS = {
	Argos: new Set(FULL_FIELDS),
	Constable: new Set(BASIC_FIELDS),
	Investigator: new Set(INVESTIGATION_FIELDS),
	Supervisor: new Set(FULL_FIELDS),
	Analyst: new Set(FULL_FIELDS)
};

const BASE_FILTERS = new Set([
	'crimeNo', 'crimeTypeName', 'crimeTypeContains', 'locationContains',
	'pincode', 'divisionName', 'caseStatus',
	'registeredFrom', 'registeredTo'
]);

const INVESTIGATION_FILTERS = new Set([
	...BASE_FILTERS, 'victimName', 'accusedName', 'minVictimAge', 'maxVictimAge'
]);

const ROLE_FILTERS = {
	Argos: INVESTIGATION_FILTERS,
	Constable: BASE_FILTERS,
	Investigator: INVESTIGATION_FILTERS,
	Supervisor: INVESTIGATION_FILTERS,
	Analyst: INVESTIGATION_FILTERS
};

const ROOT_KEYS = new Set(['requestedFields', 'filters', 'sort', 'limit']);
const FILTER_KEYS = new Set([...INVESTIGATION_FILTERS]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const assertObject = (value, label) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new QueryPolicyError(`${label} must be an object.`);
	}
};

const rejectUnknownKeys = (object, allowedKeys, label) => {
	const unknownKey = Object.keys(object).find(key => !allowedKeys.has(key));
	if (unknownKey) {
		throw new QueryPolicyError(`${label} contains an unsupported property: ${unknownKey}.`);
	}
};

const escapeText = (value, label, maxLength = 120) => {
	if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
		throw new QueryPolicyError(`${label} must be non-empty text of at most ${maxLength} characters.`);
	}
	return value.trim().replace(/'/g, "''");
};

const integerValue = (value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => {
	if (!Number.isInteger(value) || value < minimum || value > maximum) {
		throw new QueryPolicyError(`${label} must be a valid whole number.`);
	}
	return value;
};

const dateValue = (value, label) => {
	if (typeof value !== 'string' || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value.replace(' ', 'T') + 'Z'))) {
		throw new QueryPolicyError(`${label} must use YYYY-MM-DD HH:MM:SS format.`);
	}
	return value;
};

const containsText = (value, label, maxLength = 120) => {
	const text = escapeText(value, label, maxLength);
	if (/[*?]/.test(text)) {
		throw new QueryPolicyError(`${label} cannot contain wildcard characters.`);
	}
	return text;
};

const buildSafeQuery = (intent, role) => {
	assertObject(intent, 'Search intent');
	rejectUnknownKeys(intent, ROOT_KEYS, 'Search intent');

	const allowedFields = ROLE_FIELDS[role];
	const allowedFilters = ROLE_FILTERS[role];
	if (!allowedFields || !allowedFilters) {
		throw new QueryPolicyError('The authenticated role is not recognized.', 403);
	}

	const requestedFields = intent.requestedFields ?? BASIC_FIELDS;
	if (!Array.isArray(requestedFields) || requestedFields.length === 0 || requestedFields.length > 16) {
		throw new QueryPolicyError('requestedFields must contain between 1 and 16 approved columns.');
	}

	const uniqueFields = [...new Set(requestedFields)];
	for (const field of uniqueFields) {
		if (typeof field !== 'string' || !ALL_FIELDS.has(field)) {
			throw new QueryPolicyError(`Unsupported database field requested: ${String(field)}.`);
		}
		if (!allowedFields.has(field)) {
			throw new QueryPolicyError(`Role '${role}' is not permitted to access ${field}.`, 403);
		}
	}
	if (!uniqueFields.includes('CrimeNo')) {
		uniqueFields.unshift('CrimeNo');
	}

	const filters = intent.filters ?? {};
	assertObject(filters, 'filters');
	rejectUnknownKeys(filters, FILTER_KEYS, 'filters');

	const conditions = [];
	for (const [key, value] of Object.entries(filters)) {
		if (value === null || value === undefined || value === '') continue;
		if (!allowedFilters.has(key)) {
			throw new QueryPolicyError(`Role '${role}' is not permitted to filter by ${key}.`, 403);
		}

		switch (key) {
			case 'crimeNo':
				conditions.push(`CrimeNo = ${integerValue(value, key)}`);
				break;
			case 'pincode':
				conditions.push(`Pincode = ${integerValue(value, key, 100000, 999999)}`);
				break;
			case 'minVictimAge':
				conditions.push(`VictimAge >= ${integerValue(value, key, 0, 130)}`);
				break;
			case 'maxVictimAge':
				conditions.push(`VictimAge <= ${integerValue(value, key, 0, 130)}`);
				break;
			case 'registeredFrom':
				conditions.push(`RegisteredAt >= '${dateValue(value, key)}'`);
				break;
			case 'registeredTo':
				conditions.push(`RegisteredAt <= '${dateValue(value, key)}'`);
				break;
			case 'crimeTypeName':
				conditions.push(`CrimeTypeName = '${escapeText(value, key, 80)}'`);
				break;
			case 'crimeTypeContains':
				conditions.push(`CrimeTypeName LIKE '*${containsText(value, key, 80)}*'`);
				break;
			case 'locationContains': {
				const location = containsText(value, key, 120);
				conditions.push(`(VictimAddress LIKE '*${location}*' OR VictimStatement LIKE '*${location}*')`);
				break;
			}
			case 'divisionName':
				conditions.push(`DivisionName = '${escapeText(value, key, 100)}'`);
				break;
			case 'caseStatus':
				conditions.push(`CaseStatus = '${escapeText(value, key, 50)}'`);
				break;
			case 'victimName':
				conditions.push(`VictimName = '${escapeText(value, key, 100)}'`);
				break;
			case 'accusedName':
				conditions.push(`AccusedName = '${escapeText(value, key, 100)}'`);
				break;
			default:
				throw new QueryPolicyError(`Unsupported filter: ${key}.`);
		}
	}
	if (conditions.length > 5) {
		throw new QueryPolicyError('A search can contain at most five filter conditions.');
	}

	const sort = intent.sort ?? 'newest';
	if (!['newest', 'oldest'].includes(sort)) {
		throw new QueryPolicyError('sort must be either newest or oldest.');
	}

	const limit = intent.limit ?? 20;
	integerValue(limit, 'limit', 1, 50);

	const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
	const orderClause = ` ORDER BY RegisteredAt ${sort === 'newest' ? 'DESC' : 'ASC'}`;
	const query = `SELECT ${uniqueFields.join(', ')} FROM CaseRegistration${whereClause}${orderClause} LIMIT ${limit}`;

	return {
		query,
		audit: {
			selectedFields: uniqueFields,
			filterNames: Object.keys(filters).filter(key => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''),
			limit,
			sort
		}
	};
};

const parseSearchIntent = (content) => {
	if (typeof content !== 'string') {
		throw new QueryPolicyError('The AI did not return a search intent.');
	}

	const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
	try {
		const intent = JSON.parse(cleaned);
		if (intent && typeof intent === 'object' && !Array.isArray(intent) && typeof intent.sort === 'string') {
			const normalizedSort = intent.sort.trim().toLowerCase().replace(/[\s-]+/g, '_');
			const newestAliases = new Set([
				'newest', 'latest', 'recent', 'desc', 'descending',
				'newest_first', 'latest_first', 'most_recent'
			]);
			const oldestAliases = new Set([
				'oldest', 'earliest', 'asc', 'ascending',
				'oldest_first', 'earliest_first'
			]);

			if (newestAliases.has(normalizedSort)) {
				intent.sort = 'newest';
			} else if (oldestAliases.has(normalizedSort)) {
				intent.sort = 'oldest';
			} else {
				delete intent.sort;
			}
		}
		return intent;
	} catch {
		throw new QueryPolicyError('The AI returned an invalid search intent.');
	}
};

const getAllowedFields = (role) => {
	const fields = ROLE_FIELDS[role];
	if (!fields) {
		throw new QueryPolicyError('The authenticated role is not recognized.', 403);
	}
	return [...fields];
};

module.exports = { QueryPolicyError, buildSafeQuery, getAllowedFields, parseSearchIntent };
