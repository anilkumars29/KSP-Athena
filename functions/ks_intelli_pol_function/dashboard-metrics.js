const normaliseDivisionKey = value =>
	String(value || '')
		.trim()
		.toLowerCase()
		.replace(/\s+(city|divisions?)$/i, '')
		.replace(/\s+/g, ' ');

const formatDivisionName = value => {
	const key = normaliseDivisionKey(value);
	if (!key) return '';

	return `${key
		.split(' ')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')} Division`;
};

const buildDashboardMetrics = (records, requestedDivision = 'All Divisions') => {
	const sourceRecords = Array.isArray(records) ? records : [];
	const requestedKey = normaliseDivisionKey(requestedDivision);
	const isAllDivisions = !requestedKey || requestedKey === 'all';
	const matchingRecords = isAllDivisions
		? sourceRecords
		: sourceRecords.filter(record =>
			normaliseDivisionKey(record.DivisionName) === requestedKey
		);

	const availableDivisions = [...new Set(
		sourceRecords
			.map(record => formatDivisionName(record.DivisionName))
			.filter(Boolean)
	)].sort((a, b) => a.localeCompare(b, 'en-IN'));

	const typeDistribution = {};
	matchingRecords.forEach(record => {
		const type = record.CrimeTypeName || 'Unclassified';
		typeDistribution[type] = (typeDistribution[type] || 0) + 1;
	});

	const casesByType = Object.entries(typeDistribution)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

	const recentCases = [...matchingRecords]
		.sort((a, b) => new Date(b.RegisteredAt) - new Date(a.RegisteredAt))
		.slice(0, 5);
	const divisionCases = [...matchingRecords]
		.sort((a, b) => new Date(b.RegisteredAt) - new Date(a.RegisteredAt))
		.map(record => ({
			crimeNo: String(record.CrimeNo || ''),
			crimeType: record.CrimeTypeName || 'Unclassified',
			caseStatus: record.CaseStatus || 'Status unavailable',
			registeredAt: record.RegisteredAt || null
		}));

	const statusCounts = {
		registered: 0,
		pending: 0,
		inCourt: 0,
		closed: 0
	};

	matchingRecords.forEach(record => {
		const status = String(record.CaseStatus || '').toLowerCase();
		if (status.includes('court') || status.includes('trial') || status.includes('charge')) {
			statusCounts.inCourt += 1;
		} else if (status.includes('closed') || status.includes('disposed') || status.includes('final')) {
			statusCounts.closed += 1;
		} else if (status.includes('investigat') || status.includes('pending')) {
			statusCounts.pending += 1;
		} else {
			statusCounts.registered += 1;
		}
	});

	return {
		totalCases: matchingRecords.length,
		casesByType,
		recentCases,
		divisionCases,
		statusCounts,
		division: isAllDivisions ? 'All Divisions' : formatDivisionName(requestedDivision),
		availableDivisions,
		recordCapReached: sourceRecords.length === 300
	};
};

module.exports = {
	buildDashboardMetrics,
	formatDivisionName,
	normaliseDivisionKey
};
