const FILTER_PATTERN = /^[a-zA-Z0-9 ()/&.,'-]{1,100}$/;

const parseDate = value => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = date => date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });

const validateFilter = (value, allLabel) => {
	const filter = String(value || allLabel).trim() || allLabel;
	if (filter !== allLabel && !FILTER_PATTERN.test(filter)) {
		const error = new Error(`Invalid ${allLabel.replace('All ', '').toLocaleLowerCase('en-IN')} filter.`);
		error.statusCode = 400;
		throw error;
	}
	return filter;
};

const weightedAverage = values => {
	const recent = values.slice(-3);
	const weights = recent.map((_, index) => index + 1);
	const weightTotal = weights.reduce((sum, value) => sum + value, 0);
	return recent.reduce((sum, value, index) => sum + value * weights[index], 0) / weightTotal;
};

const regressionSlope = values => {
	const recent = values.slice(-6);
	if (recent.length < 2) return 0;
	const xMean = (recent.length - 1) / 2;
	const yMean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
	const numerator = recent.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0);
	const denominator = recent.reduce((sum, _, index) => sum + (index - xMean) ** 2, 0);
	return denominator ? numerator / denominator : 0;
};

const rollingErrors = values => {
	const errors = [];
	for (let index = 3; index < values.length; index += 1) {
		const predicted = weightedAverage(values.slice(0, index));
		errors.push(values[index] - predicted);
	}
	return errors;
};

const buildCrimeForecast = (records, {
	historyMonths = 24,
	division = 'All Divisions',
	crimeType = 'All Crime Types',
	now = new Date()
} = {}) => {
	const months = Number(historyMonths);
	if (![12, 24].includes(months)) {
		const error = new Error('Forecast history must be 12 or 24 months.');
		error.statusCode = 400;
		throw error;
	}
	const selectedDivision = validateFilter(division, 'All Divisions');
	const selectedCrimeType = validateFilter(crimeType, 'All Crime Types');
	const validDateRecords = records.filter(record => parseDate(record.RegisteredAt));
	const availableDivisions = [...new Set(validDateRecords.map(record => String(record.DivisionName || '').trim()).filter(Boolean))].sort();
	const availableCrimeTypes = [...new Set(validDateRecords.map(record => String(record.CrimeTypeName || '').trim()).filter(Boolean))].sort();
	const filtered = validDateRecords
		.filter(record => selectedDivision === 'All Divisions' || String(record.DivisionName || '').trim() === selectedDivision)
		.filter(record => selectedCrimeType === 'All Crime Types' || String(record.CrimeTypeName || '').trim() === selectedCrimeType);

	const historyEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
	const historyStart = new Date(historyEnd.getFullYear(), historyEnd.getMonth() - months + 1, 1);
	const counts = new Map();
	filtered.forEach(record => {
		const date = parseDate(record.RegisteredAt);
		if (date < historyStart || date > historyEnd) return;
		const key = monthKey(date);
		counts.set(key, (counts.get(key) || 0) + 1);
	});

	const history = [];
	for (let offset = 0; offset < months; offset += 1) {
		const date = new Date(historyStart.getFullYear(), historyStart.getMonth() + offset, 1);
		history.push({ key: monthKey(date), label: monthLabel(date), count: counts.get(monthKey(date)) || 0 });
	}
	const values = history.map(item => item.count);
	const totalCases = values.reduce((sum, value) => sum + value, 0);
	const monthsWithCases = values.filter(value => value > 0).length;
	const sufficiency = totalCases < 6 || monthsWithCases < 3
		? 'INSUFFICIENT'
		: totalCases >= 40 && monthsWithCases >= 12
			? 'ADEQUATE'
			: 'LIMITED';
	const errors = rollingErrors(values);
	const mae = errors.length ? errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length : null;
	const rmse = errors.length ? Math.sqrt(errors.reduce((sum, value) => sum + value ** 2, 0) / errors.length) : 0;
	const baseline = weightedAverage(values);
	const slope = regressionSlope(values);
	const average = totalCases / months;

	const forecast = sufficiency === 'INSUFFICIENT' ? [] : [0, 1, 2].map(offset => {
		const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
		let estimate = Math.max(0, baseline + slope * (offset + 1));
		if (months === 24 && average > 0) {
			const seasonalHistory = history.filter(item => Number(item.key.substring(5, 7)) === date.getMonth() + 1);
			if (seasonalHistory.length > 0) {
				const seasonalAverage = seasonalHistory.reduce((sum, item) => sum + item.count, 0) / seasonalHistory.length;
				const seasonalFactor = Math.max(0.5, Math.min(1.5, seasonalAverage / average));
				estimate *= 0.75 + seasonalFactor * 0.25;
			}
		}
		const predicted = Number(estimate.toFixed(1));
		const uncertainty = Math.max(1, 1.64 * rmse);
		return {
			key: monthKey(date),
			label: monthLabel(date),
			predicted,
			lower: Number(Math.max(0, predicted - uncertainty).toFixed(1)),
			upper: Number((predicted + uncertainty).toFixed(1))
		};
	});

	return {
		scope: { division: selectedDivision, crimeType: selectedCrimeType },
		availableDivisions,
		availableCrimeTypes,
		history,
		forecast,
		diagnostics: {
			sufficiency,
			totalHistoricalCases: totalCases,
			monthsWithCases,
			baselineMonthlyVolume: Number(baseline.toFixed(2)),
			recentSixMonthSlope: Number(slope.toFixed(2)),
			backtestMeanAbsoluteError: mae === null ? null : Number(mae.toFixed(2)),
			historyStart: historyStart.toISOString(),
			historyEnd: historyEnd.toISOString(),
			forecastStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
			recordCapReached: records.length === 300
		},
		method: 'Three-month aggregate baseline using a weighted recent average, bounded six-month linear trend, optional historical month seasonality, and residual-based uncertainty. This is not an offender-level prediction or a guarantee of future crime.'
	};
};

module.exports = { buildCrimeForecast, regressionSlope, validateFilter, weightedAverage };
