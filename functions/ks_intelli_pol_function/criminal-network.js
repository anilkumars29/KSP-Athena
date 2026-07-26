const { normaliseText, splitAccusedNames } = require('./case-intelligence');

const ALLOWED_ROLES = new Set(['Investigator', 'Analyst', 'Supervisor', 'Argos']);
const FILTER_PATTERN = /^[a-zA-Z0-9 ()/&.-]{1,100}$/;
const MODUS_RULES = [
	{ name: 'Identity concealment', pattern: /\b(?:helmet\w*|mask\w*|disguise\w*|covered (?:face|faces))\b/i },
	{ name: 'Lock or forced-entry method', pattern: /\b(?:lock|forced entry|cut chain|window forced|padlock)\b/i },
	{ name: 'Weapon or threat', pattern: /\b(?:knife|weapon|gun|threaten|intimidat)\w*\b/i },
	{ name: 'Digital deception', pattern: /\b(?:otp|phishing|remote-support|false courier|fake|fabricated|impersonat)\w*\b/i },
	{ name: 'Financial transfer', pattern: /\b(?:upi|wallet|bank|account|transfer|payment)\w*\b/i },
	{ name: 'Support vehicle', pattern: /\b(?:support vehicle|waiting motorcycle|red motorcycle|goods vehicle)\b/i }
];

const assertNetworkRole = role => {
	if (!ALLOWED_ROLES.has(role)) {
		const error = new Error('Investigator, Analyst, or Supervisor role is required to view criminal-network analysis.');
		error.statusCode = 403;
		throw error;
	}
};

const validateFilter = (value, label, fallback) => {
	const filter = String(value || fallback).trim() || fallback;
	if (filter !== fallback && !FILTER_PATTERN.test(filter)) {
		const error = new Error(`Invalid ${label} filter.`);
		error.statusCode = 400;
		throw error;
	}
	return filter;
};

const validateMinScore = value => {
	const score = Number(value || 30);
	if (![30, 50, 70].includes(score)) {
		const error = new Error('Minimum association score must be 30, 50, or 70.');
		error.statusCode = 400;
		throw error;
	}
	return score;
};

const displayNames = raw => String(raw || '')
	.split(/\s*(?:,|;|\/|&|\band\b)\s*/i)
	.map(name => name.trim())
	.filter(Boolean);

const validMobile = value => {
	const digits = String(value || '').replace(/\D/g, '');
	return digits.length >= 8 ? digits : '';
};

const locationKey = record => {
	const division = String(record.DivisionName || '').trim();
	const pincode = String(record.Pincode || '').trim();
	return division || pincode ? `${division || 'Unknown division'} · ${pincode || 'No pincode'}` : '';
};

const modusFor = record => MODUS_RULES
	.filter(rule => rule.pattern.test(String(record.VictimStatement || '')))
	.map(rule => rule.name);

const intersection = (left, right) => [...left].filter(value => right.has(value));
const pairKey = (left, right) => [left, right].sort().join('|');

const connectedComponents = (memberIds, associations) => {
	const adjacency = new Map(memberIds.map(id => [id, new Set()]));
	associations.forEach(link => {
		adjacency.get(link.source)?.add(link.target);
		adjacency.get(link.target)?.add(link.source);
	});
	const visited = new Set();
	const components = [];
	memberIds.forEach(start => {
		if (visited.has(start)) return;
		const stack = [start];
		const component = [];
		while (stack.length) {
			const current = stack.pop();
			if (visited.has(current)) continue;
			visited.add(current);
			component.push(current);
			adjacency.get(current)?.forEach(next => {
				if (!visited.has(next)) stack.push(next);
			});
		}
		if (component.length > 1) components.push(component.sort());
	});
	return components;
};

const buildCriminalNetwork = (records, {
	role,
	division = 'All Divisions',
	crimeType = 'All Crime Types',
	minScore = 30
} = {}) => {
	assertNetworkRole(role);
	const selectedDivision = validateFilter(division, 'division', 'All Divisions');
	const selectedCrimeType = validateFilter(crimeType, 'crime type', 'All Crime Types');
	const threshold = validateMinScore(minScore);
	const availableDivisions = [...new Set(records.map(record => String(record.DivisionName || '').trim()).filter(Boolean))].sort();
	const availableCrimeTypes = [...new Set(records.map(record => String(record.CrimeTypeName || '').trim()).filter(Boolean))].sort();
	const filteredRecords = records.filter(record =>
		(selectedDivision === 'All Divisions' || String(record.DivisionName || '').trim() === selectedDivision) &&
		(selectedCrimeType === 'All Crime Types' || String(record.CrimeTypeName || '').trim() === selectedCrimeType)
	);

	const entities = new Map();
	const recordNames = new Map();
	filteredRecords.forEach(record => {
		const canonicalNames = splitAccusedNames(record.AccusedName);
		const rawNames = displayNames(record.AccusedName);
		recordNames.set(String(record.CrimeNo), canonicalNames);
		canonicalNames.forEach((id, index) => {
			if (!entities.has(id)) {
				entities.set(id, {
					id,
					displayName: rawNames[index] || rawNames.find(name => normaliseText(name) === id) || id,
					records: [],
					mobiles: new Set(),
					locations: new Set(),
					crimeTypes: new Set(),
					modus: new Set()
				});
			}
			const entity = entities.get(id);
			entity.records.push(record);
			const mobile = validMobile(record.AccusedMobile);
			if (mobile) entity.mobiles.add(mobile);
			const location = locationKey(record);
			if (location) entity.locations.add(location);
			const type = String(record.CrimeTypeName || '').trim();
			if (type) entity.crimeTypes.add(type);
			modusFor(record).forEach(item => entity.modus.add(item));
		});
	});

	const ids = [...entities.keys()].sort();
	const associations = [];
	for (let leftIndex = 0; leftIndex < ids.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < ids.length; rightIndex += 1) {
			const left = entities.get(ids[leftIndex]);
			const right = entities.get(ids[rightIndex]);
			const coAccusedCases = filteredRecords
				.filter(record => {
					const names = recordNames.get(String(record.CrimeNo)) || [];
					return names.includes(left.id) && names.includes(right.id);
				})
				.map(record => String(record.CrimeNo));
			const sharedMobiles = intersection(left.mobiles, right.mobiles);

			// Soft similarities may strengthen a direct recorded link, but never create one.
			if (!coAccusedCases.length && !sharedMobiles.length) continue;

			const sharedLocations = intersection(left.locations, right.locations);
			const sharedCrimeTypes = intersection(left.crimeTypes, right.crimeTypes);
			const sharedModus = intersection(left.modus, right.modus);
			const score = Math.min(100,
				Math.min(60, coAccusedCases.length * 30) +
				(sharedMobiles.length ? 25 : 0) +
				Math.min(5, sharedLocations.length * 5) +
				Math.min(5, sharedCrimeTypes.length * 5) +
				Math.min(10, sharedModus.length * 5)
			);
			if (score < threshold) continue;

			const reasons = [];
			if (coAccusedCases.length) reasons.push(`Co-recorded in ${coAccusedCases.length} FIR${coAccusedCases.length === 1 ? '' : 's'}: ${coAccusedCases.join(', ')}`);
			if (sharedMobiles.length) reasons.push(`${sharedMobiles.length} shared recorded contact reference${sharedMobiles.length === 1 ? '' : 's'} (identity ownership requires verification)`);
			if (sharedLocations.length) reasons.push(`Shared recorded locations: ${sharedLocations.join('; ')}`);
			if (sharedCrimeTypes.length) reasons.push(`Shared crime classifications: ${sharedCrimeTypes.join(', ')}`);
			if (sharedModus.length) reasons.push(`Shared statement indicators: ${sharedModus.join(', ')}`);

			associations.push({
				id: pairKey(left.id, right.id),
				source: left.id,
				target: right.id,
				sourceName: left.displayName,
				targetName: right.displayName,
				score,
				strength: score >= 70 ? 'STRONG RECORDED LINK' : score >= 50 ? 'MULTIPLE RECORDED SIGNALS' : 'RECORDED LINK',
				coAccusedCases,
				sharedContactCount: sharedMobiles.length,
				sharedContactMasks: sharedMobiles.map(mobile => `******${mobile.slice(-4)}`),
				sharedLocations,
				sharedCrimeTypes,
				sharedModus,
				reasons
			});
		}
	}
	associations.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

	const linkedMemberIds = [...new Set(associations.flatMap(link => [link.source, link.target]))];
	const components = connectedComponents(linkedMemberIds, associations);
	const possibleGroups = components.map((members, index) => {
		const memberSet = new Set(members);
		const links = associations.filter(link => memberSet.has(link.source) && memberSet.has(link.target));
		const caseNos = [...new Set(members.flatMap(id =>
			entities.get(id).records.map(record => String(record.CrimeNo))
		))].sort();
		const maximumScore = Math.max(...links.map(link => link.score));
		return {
			id: `NETWORK-${String(index + 1).padStart(2, '0')}`,
			label: maximumScore >= 70 ? 'HIGH-EVIDENCE POSSIBLE NETWORK' : maximumScore >= 50 ? 'MULTI-SIGNAL POSSIBLE NETWORK' : 'POSSIBLE NETWORK FOR REVIEW',
			members: members.map(id => ({
				id,
				name: entities.get(id).displayName,
				caseCount: new Set(entities.get(id).records.map(record => String(record.CrimeNo))).size
			})),
			associationCount: links.length,
			caseNos,
			maximumAssociationScore: maximumScore,
			warning: 'This is an investigative association cluster, not proof of an organized crime group or common intent.'
		};
	}).sort((a, b) => b.maximumAssociationScore - a.maximumAssociationScore || b.caseNos.length - a.caseNos.length);

	const caseNosInGraph = new Set(possibleGroups.flatMap(group => group.caseNos));
	const graphNodes = linkedMemberIds.map(id => {
		const entity = entities.get(id);
		return {
			id: `ACC_${id}`,
			group: 'accused',
			name: `${entity.displayName} · ${new Set(entity.records.map(record => String(record.CrimeNo))).size} FIR associations`
		};
	});
	filteredRecords.forEach(record => {
		if (!caseNosInGraph.has(String(record.CrimeNo))) return;
		graphNodes.push({
			id: `CASE_${record.CrimeNo}`,
			group: 'case',
			name: `FIR ${record.CrimeNo} · ${record.CrimeTypeName || 'Unclassified'} · ${record.DivisionName || 'Unknown division'}`
		});
	});
	const graphLinks = [
		...associations.map(link => ({
			source: `ACC_${link.source}`,
			target: `ACC_${link.target}`,
			label: `${link.strength} · ${link.score}/100`,
			score: link.score,
			type: 'association'
		})),
		...filteredRecords.flatMap(record => {
			if (!caseNosInGraph.has(String(record.CrimeNo))) return [];
			return (recordNames.get(String(record.CrimeNo)) || [])
				.filter(id => linkedMemberIds.includes(id))
				.map(id => ({
					source: `ACC_${id}`,
					target: `CASE_${record.CrimeNo}`,
					label: 'Recorded as accused in FIR',
					score: 20,
					type: 'case'
				}));
		})
	];

	return {
		scope: {
			division: selectedDivision,
			crimeType: selectedCrimeType,
			minScore: threshold,
			availableDivisions,
			availableCrimeTypes
		},
		summary: {
			recordsReviewed: filteredRecords.length,
			namedEntities: entities.size,
			associations: associations.length,
			possibleGroups: possibleGroups.length
		},
		associations,
		possibleGroups,
		graph: { nodes: graphNodes, links: graphLinks },
		coverage: {
			retrievedRecords: records.length,
			filteredRecords: filteredRecords.length,
			recordsWithoutNamedAccused: filteredRecords.filter(record => splitAccusedNames(record.AccusedName).length === 0).length,
			recordCapReached: records.length === 300
		},
		method: 'An edge requires co-appearance in an FIR or a shared recorded contact reference. Repeated location, crime classification, and statement-derived method indicators may strengthen an existing edge but cannot create one. Names and contact ownership require independent identity verification.'
	};
};

module.exports = {
	assertNetworkRole,
	buildCriminalNetwork,
	validateFilter,
	validateMinScore
};
