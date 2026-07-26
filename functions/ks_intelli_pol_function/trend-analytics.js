const PERIODS = new Set([6, 12, 24]);

const normalisePeriod = value => {
	const parsed = Number(value || 12);
	if (!Number.isInteger(parsed) || !PERIODS.has(parsed)) {
		throw new Error('Period must be 6, 12, or 24 months.');
	}
	return parsed;
};

const parseDate = value => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const monthKey = date =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = date =>
	date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });

const getAgeBand = value => {
	if (value === null || value === undefined || String(value).trim() === '') return 'Unknown';
	const age = Number(value);
	if (!Number.isFinite(age) || age < 0 || age > 120) return 'Unknown';
	if (age < 18) return 'Under 18';
	if (age < 25) return '18–24';
	if (age < 35) return '25–34';
	if (age < 45) return '35–44';
	if (age < 60) return '45–59';
	return '60+';
};

const countBy = (records, selector) => {
	const counts = new Map();
	records.forEach(record => {
		const key = selector(record);
		counts.set(key, (counts.get(key) || 0) + 1);
	});
	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

const buildTrendAnalytics = (records, period, now = new Date()) => {
	const months = normalisePeriod(period);
	const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
	const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
	const buckets = [];
	const bucketIndex = new Map();

	for (let offset = 0; offset < months; offset += 1) {
		const date = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + offset, 1);
		const bucket = { key: monthKey(date), label: monthLabel(date), count: 0 };
		bucketIndex.set(bucket.key, bucket);
		buckets.push(bucket);
	}

	let validDateRecords = 0;
	const periodRecords = [];
	records.forEach(record => {
		const registeredAt = parseDate(record.RegisteredAt);
		if (!registeredAt) return;
		validDateRecords += 1;
		if (registeredAt < rangeStart || registeredAt > rangeEnd) return;
		const bucket = bucketIndex.get(monthKey(registeredAt));
		if (bucket) bucket.count += 1;
		periodRecords.push(record);
	});

	const ageOrder = ['Under 18', '18–24', '25–34', '35–44', '45–59', '60+', 'Unknown'];
	const ageCounts = new Map(ageOrder.map(name => [name, 0]));
	periodRecords.forEach(record => {
		const band = getAgeBand(record.VictimAge);
		ageCounts.set(band, ageCounts.get(band) + 1);
	});

	const divisionKnownRecords = periodRecords.filter(record =>
		String(record.DivisionName || '').trim()
	).length;
	const ageKnownRecords = periodRecords.filter(record =>
		getAgeBand(record.VictimAge) !== 'Unknown'
	).length;

	return {
		periodMonths: months,
		totalCases: periodRecords.length,
		monthlyTrend: buckets,
		crimeTypes: countBy(periodRecords, record =>
			String(record.CrimeTypeName || '').trim() || 'Unclassified'
		).slice(0, 8),
		divisions: countBy(
			periodRecords.filter(record => String(record.DivisionName || '').trim()),
			record => String(record.DivisionName).trim()
		).slice(0, 8),
		ageBands: ageOrder.map(name => ({ name, count: ageCounts.get(name) })),
		coverage: {
			retrievedRecords: records.length,
			periodRecords: periodRecords.length,
			validDateRecords,
			ageKnownRecords,
			divisionKnownRecords,
			recordCapReached: records.length === 300,
			rangeStart: rangeStart.toISOString(),
			rangeEnd: rangeEnd.toISOString()
		}
	};
};

module.exports = { buildTrendAnalytics, getAgeBand, normalisePeriod };
