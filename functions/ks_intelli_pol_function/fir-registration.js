const crypto = require('crypto');

const CRIME_TYPES = new Set(['Theft', 'Assault', 'Cyber Crime', 'Fraud', 'Missing Person']);
const ALLOWED_FIELDS = new Set([
	'victimName',
	'victimAge',
	'mobileNo',
	'location',
	'pincode',
	'accusedName',
	'crimeType',
	'date',
	'description'
]);

class FirValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'FirValidationError';
		this.statusCode = 400;
	}
}

const requireText = (value, label, { min = 1, max }) => {
	const text = String(value ?? '').trim();
	if (text.length < min || text.length > max) {
		throw new FirValidationError(`${label} must contain between ${min} and ${max} characters.`);
	}
	if (/[\u0000-\u001f\u007f]/.test(text)) {
		throw new FirValidationError(`${label} contains unsupported control characters.`);
	}
	return text;
};

const validateIncidentDate = (value, today) => {
	const date = String(value ?? '').trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new FirValidationError('Incident date must use YYYY-MM-DD format.');
	}

	const parsed = new Date(`${date}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
		throw new FirValidationError('Incident date is not a valid calendar date.');
	}
	if (date > today.toISOString().slice(0, 10)) {
		throw new FirValidationError('Incident date cannot be in the future.');
	}
	return date;
};

const validateFirInput = (body, today = new Date()) => {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		throw new FirValidationError('A valid FIR request body is required.');
	}

	for (const key of Object.keys(body)) {
		if (!ALLOWED_FIELDS.has(key)) {
			throw new FirValidationError(`Unsupported FIR field: ${key}.`);
		}
	}

	const victimAge = Number(body.victimAge);
	if (!Number.isInteger(victimAge) || victimAge < 0 || victimAge > 120) {
		throw new FirValidationError('Victim age must be a whole number between 0 and 120.');
	}

	let mobileNo = String(body.mobileNo ?? '').replace(/[\s-]/g, '');
	if (mobileNo.startsWith('+91')) {
		mobileNo = mobileNo.slice(3);
	}
	if (!/^[6-9]\d{9}$/.test(mobileNo)) {
		throw new FirValidationError('Mobile number must be a valid 10-digit Indian mobile number.');
	}

	const pincode = String(body.pincode ?? '').trim();
	if (!/^[1-9]\d{5}$/.test(pincode)) {
		throw new FirValidationError('Pincode must be a valid 6-digit Indian pincode.');
	}

	const crimeType = String(body.crimeType ?? '').trim();
	if (!CRIME_TYPES.has(crimeType)) {
		throw new FirValidationError('Select a supported crime type.');
	}

	const accusedName = String(body.accusedName ?? '').trim();
	if (accusedName.length > 100 || /[\u0000-\u001f\u007f]/.test(accusedName)) {
		throw new FirValidationError('Accused name must not exceed 100 characters.');
	}

	const incidentDate = validateIncidentDate(body.date, today);

	return {
		VictimAge: victimAge,
		Pincode: Number(pincode),
		VictimName: requireText(body.victimName, 'Victim name', { min: 2, max: 100 }),
		VictimMobile: mobileNo,
		VictimAddress: requireText(body.location, 'Location', { min: 3, max: 255 }),
		AccusedName: accusedName || 'Unknown',
		CrimeTypeName: crimeType,
		VictimStatement: requireText(body.description, 'Victim statement', { min: 10, max: 5000 }),
		CaseStatus: 'Registered',
		RegisteredAt: `${incidentDate} 00:00:00`
	};
};

const generateCrimeNo = () => crypto.randomInt(100000, 1000000);

const isDuplicateError = (error) =>
	/duplicate|unique|already exists/i.test(String(error?.message || error));

const insertFirWithUniqueCrimeNo = async ({
	zcql,
	table,
	rowData,
	maxAttempts = 12,
	numberGenerator = generateCrimeNo
}) => {
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const crimeNo = numberGenerator();
		const matches = await zcql.executeZCQLQuery(
			`SELECT CrimeNo FROM CaseRegistration WHERE CrimeNo = ${crimeNo} LIMIT 1`
		);
		if (matches.length > 0) {
			continue;
		}

		try {
			return await table.insertRow({ ...rowData, CrimeNo: crimeNo });
		} catch (error) {
			if (isDuplicateError(error)) {
				continue;
			}
			throw error;
		}
	}

	throw new Error('Unable to allocate a unique Crime Number after multiple attempts.');
};

module.exports = {
	CRIME_TYPES,
	FirValidationError,
	generateCrimeNo,
	insertFirWithUniqueCrimeNo,
	validateFirInput
};
