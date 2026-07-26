const { buildSpatialIntelligence } = require('./spatial-intelligence');
const { buildCrimeForecast } = require('./crime-forecast');
const { buildOffenderProfiles } = require('./offender-profiling');
const { buildCriminalNetwork } = require('./criminal-network');

const SEVERITY_ORDER = { HIGH: 3, MEDIUM: 2, ADVISORY: 1 };

const parseDate = value => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const daysSince = (value, now) => {
	const date = parseDate(value);
	if (!date) return Infinity;
	return Math.floor((now.getTime() - date.getTime()) / 86400000);
};

const buildSpatialWarnings = spatial => spatial.alerts.map(alert => ({
	id: `SPATIAL-${alert.id}`,
	category: 'SPATIAL_SURGE',
	severity: alert.severity,
	title: `${alert.title}: ${alert.crimeType}`,
	summary: alert.summary,
	location: `${alert.division}${alert.pincode ? ` · ${alert.pincode}` : ''}`,
	evidenceCrimeNos: alert.evidence.map(item => item.crimeNo),
	evidence: [
		`Latest 30 days: ${alert.current30Count} recorded cases`,
		`Preceding 30 days: ${alert.previous30Count} recorded cases`
	],
	whyTriggered: alert.explanation,
	recommendedChecks: [
		'Verify that all contributing FIRs are correctly classified and geocoded.',
		'Review patrol, CCTV and local incident context for the cited area and time window.',
		'Do not infer an offender or future incident from the area-level concentration.'
	],
	limitation: 'This alert describes recorded incident concentration and reporting activity; it is not a guarantee that crime will continue.'
}));

const buildProfileWarnings = (profiles, now) => profiles.profiles
	.filter(profile =>
		profile.caseCount >= 3 &&
		profile.activeCaseCount >= 1 &&
		daysSince(profile.lastRecordedAt, now) <= 180 &&
		profile.priority.score >= 60
	)
	.slice(0, 5)
	.map(profile => ({
		id: `REPEAT-${profile.id}`,
		category: 'REPEAT_ASSOCIATION',
		severity: profile.priority.score >= 70 ? 'HIGH' : 'MEDIUM',
		title: `Repeat recorded association: ${profile.displayName}`,
		summary: `${profile.caseCount} FIRs share this accused name; ${profile.activeCaseCount} are not marked closed or disposed.`,
		location: profile.divisions.join(', ') || 'Location unavailable',
		evidenceCrimeNos: profile.cases.map(item => item.crimeNo),
		evidence: profile.priority.breakdown.map(item => `${item.factor}: ${item.evidence}`),
		whyTriggered: `Triggered at review-priority score ${profile.priority.score}/100 with at least three recorded FIR associations and recent active-case activity.`,
		recommendedChecks: [
			'Verify identity using independent identifiers before combining case histories.',
			'Compare recorded methods, dates, locations and case outcomes across the cited FIRs.',
			'Coordinate only through authorized investigative channels.'
		],
		limitation: profile.identityAssessment.warning
	}));

const buildNetworkWarnings = (network, recordByCrimeNo, now) => network.possibleGroups
	.flatMap(group => {
		const datedCases = group.caseNos
			.map(crimeNo => recordByCrimeNo.get(String(crimeNo)))
			.filter(Boolean)
			.map(record => ({ crimeNo: String(record.CrimeNo), date: parseDate(record.RegisteredAt) }))
			.filter(item => item.date)
			.sort((a, b) => b.date - a.date);
		const mostRecent = datedCases[0];
		if (group.maximumAssociationScore < 50 || !mostRecent || daysSince(mostRecent.date, now) > 180) return [];
		return [{
			id: `NETWORK-${group.id}`,
			category: 'NETWORK_ACTIVITY',
			severity: group.maximumAssociationScore >= 70 && daysSince(mostRecent.date, now) <= 90 ? 'HIGH' : 'MEDIUM',
			title: `Possible recorded network: ${group.members.map(member => member.name).join(' ↔ ')}`,
			summary: `${group.members.length} named entities are connected across ${group.caseNos.length} FIRs by ${group.associationCount} qualifying recorded association${group.associationCount === 1 ? '' : 's'}.`,
			location: [...new Set(group.caseNos.map(crimeNo =>
				recordByCrimeNo.get(String(crimeNo))?.DivisionName
			).filter(Boolean))].join(', ') || 'Location unavailable',
			evidenceCrimeNos: group.caseNos,
			evidence: [
				`Maximum association score: ${group.maximumAssociationScore}/100`,
				`Most recent connected FIR: ${mostRecent.crimeNo}`,
				`Named members: ${group.members.map(member => member.name).join(', ')}`
			],
			whyTriggered: 'Triggered because an evidence-backed association cluster scored at least 50/100 and contains a connected FIR from the last 180 days.',
			recommendedChecks: [
				'Review the exact co-accused and shared-contact evidence for each edge.',
				'Verify each identity and contact owner independently.',
				'Do not label the cluster an organized group without corroborating evidence of coordination or common intent.'
			],
			limitation: group.warning
		}];
	}).slice(0, 5);

const buildForecastWarnings = forecast => {
	if (forecast.diagnostics.sufficiency === 'INSUFFICIENT' || forecast.forecast.length === 0) return [];
	const first = forecast.forecast[0];
	const baseline = forecast.diagnostics.baselineMonthlyVolume;
	const slope = forecast.diagnostics.recentSixMonthSlope;
	const rising = slope >= 0.25 && first.predicted >= baseline;
	if (!rising) return [];
	return [{
		id: 'FORECAST-AGGREGATE',
		category: 'FORECAST_RISE',
		severity: forecast.diagnostics.sufficiency === 'ADEQUATE' && slope >= 1 ? 'HIGH' : 'MEDIUM',
		title: 'Rising aggregate crime-volume signal',
		summary: `The transparent baseline estimates ${first.predicted} cases for ${first.label}, compared with a recent weighted baseline of ${baseline}.`,
		location: 'All Divisions',
		evidenceCrimeNos: [],
		evidence: [
			`Six-month monthly slope: ${slope}`,
			`Forecast range for ${first.label}: ${first.lower}–${first.upper}`,
			`Historical cases used: ${forecast.diagnostics.totalHistoricalCases}`,
			`Data sufficiency: ${forecast.diagnostics.sufficiency}`
		],
		whyTriggered: 'Triggered because the six-month aggregate slope is at least 0.25 cases per month, the next estimate is not below the recent baseline, and minimum data sufficiency rules passed.',
		recommendedChecks: [
			'Review division and crime-type forecasts to identify where the aggregate change originates.',
			'Compare the signal with reporting changes, events and operational context.',
			'Plan proportionate preventive coverage while retaining the displayed uncertainty range.'
		],
		limitation: 'This is an aggregate statistical baseline with uncertainty, not an offender-level prediction or a guarantee of future volume.'
	}];
};

const buildEarlyWarnings = (records, { role, now = new Date() } = {}) => {
	const spatial = buildSpatialIntelligence(records, now);
	const profiles = buildOffenderProfiles(records, { role, minCases: 2, now });
	const network = buildCriminalNetwork(records, { role, minScore: 30 });
	const forecast = buildCrimeForecast(records, { historyMonths: 24, now });
	const recordByCrimeNo = new Map(records.map(record => [String(record.CrimeNo), record]));
	const alerts = [
		...buildSpatialWarnings(spatial),
		...buildNetworkWarnings(network, recordByCrimeNo, now),
		...buildProfileWarnings(profiles, now),
		...buildForecastWarnings(forecast)
	].sort((left, right) =>
		SEVERITY_ORDER[right.severity] - SEVERITY_ORDER[left.severity] ||
		left.category.localeCompare(right.category) ||
		left.id.localeCompare(right.id)
	);

	return {
		alerts,
		summary: {
			total: alerts.length,
			high: alerts.filter(alert => alert.severity === 'HIGH').length,
			medium: alerts.filter(alert => alert.severity === 'MEDIUM').length,
			advisory: alerts.filter(alert => alert.severity === 'ADVISORY').length,
			byCategory: Object.fromEntries(
				['SPATIAL_SURGE', 'NETWORK_ACTIVITY', 'REPEAT_ASSOCIATION', 'FORECAST_RISE']
					.map(category => [category, alerts.filter(alert => alert.category === category).length])
			)
		},
		coverage: {
			recordsReviewed: records.length,
			recordCapReached: records.length === 300,
			analysisAsOf: now.toISOString(),
			spatialAlertsEvaluated: spatial.alerts.length,
			profilesEvaluated: profiles.profiles.length,
			networksEvaluated: network.possibleGroups.length,
			forecastSufficiency: forecast.diagnostics.sufficiency
		},
		method: 'A read-only rules engine converts qualifying outputs from the spatial, repeat-association, network, and aggregate-forecast modules into prioritized review alerts. Severity prioritizes recorded evidence strength and recency. Alerts support human review and do not determine guilt or predict individual behavior.'
	};
};

module.exports = {
	buildEarlyWarnings,
	buildForecastWarnings,
	buildNetworkWarnings,
	buildProfileWarnings,
	buildSpatialWarnings
};
