const { getAgeBand, normalisePeriod } = require('./trend-analytics');

const AGE_BANDS = ['Under 18', '18–24', '25–34', '35–44', '45–59', '60+', 'Unknown'];
const DIVISION_PATTERN = /^[a-zA-Z0-9 ()/&.-]{1,100}$/;

const parseDate = value => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const countItems = (records, selector) => {
	const counts = new Map();
	records.forEach(record => {
		const key = selector(record);
		counts.set(key, (counts.get(key) || 0) + 1);
	});
	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

const validateDivision = value => {
	const division = String(value || 'All Divisions').trim() || 'All Divisions';
	if (division !== 'All Divisions' && !DIVISION_PATTERN.test(division)) {
		const error = new Error('Invalid division filter.');
		error.statusCode = 400;
		throw error;
	}
	return division;
};

const buildShareSignals = (records, ageTotals) => {
	const knownAgeTotal = AGE_BANDS
		.filter(band => band !== 'Unknown')
		.reduce((sum, band) => sum + ageTotals.get(band), 0);
	if (!knownAgeTotal) return [];

	const crimeGroups = new Map();
	records.forEach(record => {
		const band = getAgeBand(record.VictimAge);
		if (band === 'Unknown') return;
		const crimeType = String(record.CrimeTypeName || '').trim() || 'Unclassified';
		if (!crimeGroups.has(crimeType)) crimeGroups.set(crimeType, []);
		crimeGroups.get(crimeType).push(band);
	});

	return [...crimeGroups.entries()].flatMap(([crimeType, bands]) => {
		if (bands.length < 3) return [];
		return AGE_BANDS.filter(band => band !== 'Unknown').flatMap(band => {
			const observed = bands.filter(value => value === band).length;
			if (observed < 2) return [];
			const overallShare = ageTotals.get(band) / knownAgeTotal;
			const crimeShare = observed / bands.length;
			const ratio = overallShare > 0 ? crimeShare / overallShare : 0;
			if (ratio < 1.5 || crimeShare - overallShare < 0.1) return [];
			return [{
				crimeType,
				ageBand: band,
				observedCases: observed,
				crimeTypeKnownAgeCases: bands.length,
				recordedSharePercent: Math.round(crimeShare * 100),
				overallSharePercent: Math.round(overallShare * 100),
				representationIndex: Number(ratio.toFixed(2)),
				explanation: `${band} represents ${Math.round(crimeShare * 100)}% of age-known ${crimeType} records versus ${Math.round(overallShare * 100)}% across the selected data.`
			}];
		});
	}).sort((a, b) => b.representationIndex - a.representationIndex || b.observedCases - a.observedCases).slice(0, 10);
};

const buildSociologicalInsights = (records, { period = 12, division = 'All Divisions', now = new Date() } = {}) => {
	const months = normalisePeriod(period);
	const selectedDivision = validateDivision(division);
	const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
	const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
	const validDateRecords = records.filter(record => parseDate(record.RegisteredAt));
	const periodRecords = validDateRecords.filter(record => {
		const date = parseDate(record.RegisteredAt);
		return date >= rangeStart && date <= rangeEnd;
	});
	const availableDivisions = [...new Set(periodRecords
		.map(record => String(record.DivisionName || '').trim())
		.filter(Boolean)
	)].sort();
	const filteredRecords = selectedDivision === 'All Divisions'
		? periodRecords
		: periodRecords.filter(record => String(record.DivisionName || '').trim() === selectedDivision);

	const ageTotals = new Map(AGE_BANDS.map(band => [band, 0]));
	filteredRecords.forEach(record => {
		const band = getAgeBand(record.VictimAge);
		ageTotals.set(band, ageTotals.get(band) + 1);
	});
	const ageDistribution = AGE_BANDS.map(name => ({ name, count: ageTotals.get(name) }));
	const crimeTypes = countItems(
		filteredRecords,
		record => String(record.CrimeTypeName || '').trim() || 'Unclassified'
	);
	const topCrimeTypes = new Set(crimeTypes.slice(0, 8).map(item => item.name));
	const crimeAgeMatrix = [...topCrimeTypes].map(crimeType => {
		const matching = filteredRecords.filter(record =>
			(String(record.CrimeTypeName || '').trim() || 'Unclassified') === crimeType
		);
		const bands = Object.fromEntries(AGE_BANDS.map(band => [
			band,
			matching.filter(record => getAgeBand(record.VictimAge) === band).length
		]));
		return { crimeType, total: matching.length, bands };
	}).sort((a, b) => b.total - a.total);

	const knownAgeRecords = filteredRecords.filter(record => getAgeBand(record.VictimAge) !== 'Unknown');

	return {
		periodMonths: months,
		division: selectedDivision,
		availableDivisions,
		ageDistribution,
		crimeTypes: crimeTypes.slice(0, 10),
		divisionDistribution: countItems(
			filteredRecords.filter(record => String(record.DivisionName || '').trim()),
			record => String(record.DivisionName).trim()
		).slice(0, 10),
		crimeAgeMatrix,
		recordedShareSignals: buildShareSignals(filteredRecords, ageTotals),
		coverage: {
			retrievedRecords: records.length,
			validDateRecords: validDateRecords.length,
			periodRecords: periodRecords.length,
			filteredRecords: filteredRecords.length,
			ageKnownRecords: knownAgeRecords.length,
			ageUnknownRecords: filteredRecords.length - knownAgeRecords.length,
			divisionKnownRecords: filteredRecords.filter(record => String(record.DivisionName || '').trim()).length,
			pincodeKnownRecords: filteredRecords.filter(record => /^\d{6}$/.test(String(record.Pincode || '').trim())).length,
			recordCapReached: records.length === 300,
			rangeStart: rangeStart.toISOString(),
			rangeEnd: rangeEnd.toISOString()
		},
		unavailableDimensions: [
			'Gender',
			'Occupation',
			'Income or economic stress',
			'Education',
			'Migration status',
			'Urbanisation indicators',
			'Social category'
		],
		method: 'Descriptive aggregation of recorded victim age, crime type, geography, and date. Recorded-share indicators are composition comparisons, not causal findings or individual risk predictions.'
	};
};

module.exports = { AGE_BANDS, buildSociologicalInsights, validateDivision };
