const { normaliseText, splitAccusedNames } = require('./case-intelligence');

const ALLOWED_ROLES = new Set(['Investigator', 'Supervisor', 'Analyst', 'Argos']);

const MODUS_RULES = [
	{ name: 'Multiple-person involvement', pattern: /\b(?:two|three|multiple)\s+(?:people|persons|individuals|suspects)|\b(?:gang|accomplice|associates?)\b/i },
	{ name: 'Identity concealment', pattern: /\b(?:helmet\w*|mask\w*|disguise\w*|covered (?:face|faces))\b/i },
	{ name: 'Forced entry or lock defeat', pattern: /\b(?:broke|broken|forced|cut|picked)\s+(?:the\s+)?(?:lock|door|gate)|\b(?:forced entry|disc lock|steering lock)\b/i },
	{ name: 'Weapon or intimidation reference', pattern: /\b(?:weapon|knife|gun|pistol|firearm|blade|threaten|intimidat)\w*\b/i },
	{ name: 'Digital deception reference', pattern: /\b(?:otp|phishing|malicious link|online fraud|impersonat|fake account|password)\w*\b/i },
	{ name: 'Vehicle involvement', pattern: /\b(?:vehicle|motorcycle|bike|car|scooter|number plate)\b/i },
	{ name: 'Financial-transfer reference', pattern: /\b(?:bank|account|transaction|upi|wallet|payment|money transfer)\b/i },
	{ name: 'Night-time reference', pattern: /\b(?:night|midnight|late evening|early hours)\b/i }
];

const assertProfilingRole = role => {
	if (!ALLOWED_ROLES.has(role)) {
		const error = new Error('Investigator, Analyst, or Supervisor role is required to view offender profiles.');
		error.statusCode = 403;
		throw error;
	}
};

const parseDate = value => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const isActiveStatus = value => {
	const status = normaliseText(value);
	return !/(closed|disposed|final report|acquitted|cancelled)/.test(status);
};

const extractModusIndicators = records => MODUS_RULES.flatMap(rule => {
	const matches = records.filter(record => rule.pattern.test(String(record.VictimStatement || '')));
	return matches.length ? [{
		name: rule.name,
		caseCount: matches.length,
		crimeNos: [...new Set(matches.map(record => String(record.CrimeNo)))].slice(0, 20)
	}] : [];
}).sort((a, b) => b.caseCount - a.caseCount || a.name.localeCompare(b.name));

const scoreProfile = (profile, now) => {
	const breakdown = [];
	const add = (factor, points, evidence) => {
		if (points > 0) breakdown.push({ factor, points, evidence });
	};

	add(
		'Repeated recorded associations',
		Math.min(40, Math.max(0, profile.caseCount - 1) * 20),
		`${profile.caseCount} distinct FIR records share this accused name`
	);
	add(
		'Active-case workload',
		profile.activeCaseCount >= 2 ? 15 : profile.activeCaseCount === 1 ? 5 : 0,
		`${profile.activeCaseCount} associated records are not marked closed or disposed`
	);

	const lastDate = parseDate(profile.lastRecordedAt);
	const ageDays = lastDate ? (now.getTime() - lastDate.getTime()) / 86400000 : Infinity;
	add(
		'Recent recorded association',
		ageDays >= 0 && ageDays <= 180 ? 20 : ageDays <= 365 ? 10 : 0,
		ageDays <= 365 ? `Most recent associated FIR is ${Math.max(0, Math.floor(ageDays))} days old` : ''
	);
	add(
		'Geographic spread',
		Math.min(15, Math.max(0, profile.divisions.length - 1) * 5),
		`${profile.divisions.length} recorded divisions`
	);
	add(
		'Crime-type breadth',
		Math.min(10, Math.max(0, profile.crimeTypes.length - 1) * 5),
		`${profile.crimeTypes.length} recorded crime types`
	);

	const score = Math.min(100, breakdown.reduce((sum, item) => sum + item.points, 0));
	return {
		score,
		label: score >= 70 ? 'HIGH REVIEW PRIORITY' : score >= 40 ? 'MEDIUM REVIEW PRIORITY' : 'STANDARD REVIEW PRIORITY',
		breakdown
	};
};

const buildOffenderProfiles = (records, { role, minCases = 2, now = new Date() }) => {
	assertProfilingRole(role);
	if (![1, 2, 3].includes(Number(minCases))) {
		const error = new Error('Minimum case count must be 1, 2, or 3.');
		error.statusCode = 400;
		throw error;
	}

	const groups = new Map();
	records.forEach(record => {
		splitAccusedNames(record.AccusedName).forEach(name => {
			if (!groups.has(name)) {
				groups.set(name, {
					canonicalName: name,
					displayName: String(record.AccusedName)
						.split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
						.find(part => normaliseText(part) === name) || name,
					records: []
				});
			}
			groups.get(name).records.push(record);
		});
	});

	const profiles = [...groups.values()].flatMap(group => {
		const uniqueRecords = group.records.filter((record, index, all) =>
			all.findIndex(item => String(item.CrimeNo) === String(record.CrimeNo)) === index
		);
		if (uniqueRecords.length < Number(minCases)) return [];

		const dates = uniqueRecords.map(record => parseDate(record.RegisteredAt)).filter(Boolean).sort((a, b) => b - a);
		const crimeTypes = [...new Set(uniqueRecords.map(record => String(record.CrimeTypeName || '').trim()).filter(Boolean))];
		const divisions = [...new Set(uniqueRecords.map(record => String(record.DivisionName || '').trim()).filter(Boolean))];
		const pincodes = [...new Set(uniqueRecords.map(record => String(record.Pincode || '').trim()).filter(value => /^\d{6}$/.test(value)))];
		const statuses = [...new Set(uniqueRecords.map(record => String(record.CaseStatus || '').trim()).filter(Boolean))];
		const mobileIdentifiers = [...new Set(uniqueRecords.map(record => String(record.AccusedMobile || '').replace(/\D/g, '')).filter(value => value.length >= 8))];

		const profile = {
			id: group.canonicalName,
			displayName: group.displayName,
			caseCount: uniqueRecords.length,
			activeCaseCount: uniqueRecords.filter(record => isActiveStatus(record.CaseStatus)).length,
			firstRecordedAt: dates.length ? dates[dates.length - 1].toISOString() : null,
			lastRecordedAt: dates.length ? dates[0].toISOString() : null,
			crimeTypes,
			divisions,
			pincodes,
			statuses,
			cases: uniqueRecords
				.map(record => ({
					crimeNo: String(record.CrimeNo),
					crimeType: record.CrimeTypeName || 'Unclassified',
					division: record.DivisionName || 'Unknown',
					pincode: record.Pincode || null,
					status: record.CaseStatus || 'Unknown',
					registeredAt: record.RegisteredAt || null
				}))
				.sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt))),
			modusIndicators: extractModusIndicators(uniqueRecords),
			identityAssessment: {
				status: mobileIdentifiers.length === 1 && uniqueRecords.length > 1
					? 'SHARED IDENTIFIER PRESENT'
					: 'NAME MATCH REQUIRES VERIFICATION',
				distinctMobileIdentifierCount: mobileIdentifiers.length,
				warning: mobileIdentifiers.length > 1
					? 'Multiple recorded mobile identifiers exist under this name; the group may contain different people.'
					: 'A matching name is not sufficient to establish that records concern the same individual.'
			}
		};
		return [{ ...profile, priority: scoreProfile(profile, now) }];
	}).sort((a, b) => b.priority.score - a.priority.score || b.caseCount - a.caseCount);

	return {
		profiles: profiles.slice(0, 50),
		coverage: {
			recordsReviewed: records.length,
			namedAccusedGroups: groups.size,
			profilesReturned: Math.min(50, profiles.length),
			minCases: Number(minCases),
			recordCapReached: records.length === 300,
			analysisAsOf: now.toISOString()
		},
		method: 'Investigative review priority uses recorded association count, recency, open-case workload, geographic spread, and crime-type breadth. It is not a prediction of guilt or future offending.'
	};
};

module.exports = { assertProfilingRole, buildOffenderProfiles, extractModusIndicators, scoreProfile };
