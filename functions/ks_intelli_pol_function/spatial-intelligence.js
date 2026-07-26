const FALLBACK_COORDINATES = {
	'560001': { lat: 12.9716, lng: 77.5946, area: 'Central / MG Road' },
	'560032': { lat: 13.0247, lng: 77.5948, area: 'RT Nagar' },
	'560034': { lat: 12.9298, lng: 77.6256, area: 'Koramangala' },
	'560011': { lat: 12.9279, lng: 77.5855, area: 'Jayanagar' },
	'560038': { lat: 12.9771, lng: 77.6387, area: 'Indiranagar' }
};

const validCoordinates = record => {
	const lat = Number(record.Latitude);
	const lng = Number(record.longitude ?? record.Longitude);
	if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
		return null;
	}
	if (lat === 0 && lng === 0) return null;
	return { lat, lng };
};

const parseDate = value => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const normalisePincode = value => {
	const pincode = String(value || '').trim();
	return /^\d{6}$/.test(pincode) ? pincode : '';
};

const resolveSpatialRecords = records => {
	const pincodeCoordinates = new Map();
	records.forEach(record => {
		const pincode = normalisePincode(record.Pincode);
		const coordinates = validCoordinates(record);
		if (!pincode || !coordinates) return;
		const current = pincodeCoordinates.get(pincode) || { lat: 0, lng: 0, count: 0 };
		current.lat += coordinates.lat;
		current.lng += coordinates.lng;
		current.count += 1;
		pincodeCoordinates.set(pincode, current);
	});

	return records.map(record => {
		const pincode = normalisePincode(record.Pincode);
		const direct = validCoordinates(record);
		if (direct) {
			return { record, pincode, ...direct, mappingSource: 'recorded_coordinates' };
		}
		if (pincode && pincodeCoordinates.has(pincode)) {
			const centroid = pincodeCoordinates.get(pincode);
			return {
				record,
				pincode,
				lat: centroid.lat / centroid.count,
				lng: centroid.lng / centroid.count,
				mappingSource: 'same_pincode_centroid'
			};
		}
		if (pincode && FALLBACK_COORDINATES[pincode]) {
			return {
				record,
				pincode,
				...FALLBACK_COORDINATES[pincode],
				mappingSource: 'pincode_fallback'
			};
		}
		return { record, pincode, mappingSource: 'unmapped' };
	});
};

const buildHotspots = resolvedRecords => {
	const groups = new Map();
	resolvedRecords
		.filter(item => item.mappingSource !== 'unmapped')
		.forEach(item => {
			const coordinateKey = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
			const key = item.pincode || coordinateKey;
			if (!groups.has(key)) {
				groups.set(key, {
					pincode: item.pincode || 'No pincode',
					latTotal: 0,
					lngTotal: 0,
					coordinateCount: 0,
					area: item.record.DivisionName || FALLBACK_COORDINATES[item.pincode]?.area || `Coordinate cell ${coordinateKey}`,
					totalCases: 0,
					recent30Count: 0,
					breakdown: {},
					crimeNos: [],
					mappingSources: new Set(),
					lastIncidentAt: null
				});
			}
			const group = groups.get(key);
			group.latTotal += item.lat;
			group.lngTotal += item.lng;
			group.coordinateCount += 1;
			group.totalCases += 1;
			const crimeType = String(item.record.CrimeTypeName || '').trim() || 'Unclassified';
			group.breakdown[crimeType] = (group.breakdown[crimeType] || 0) + 1;
			if (group.crimeNos.length < 20) group.crimeNos.push(String(item.record.CrimeNo));
			group.mappingSources.add(item.mappingSource);
			const date = parseDate(item.record.RegisteredAt);
			if (date && (!group.lastIncidentAt || date > group.lastIncidentAt)) group.lastIncidentAt = date;
		});

	return [...groups.values()]
		.map(group => ({
			pincode: group.pincode,
			lat: group.latTotal / group.coordinateCount,
			lng: group.lngTotal / group.coordinateCount,
			area: group.area,
			totalCases: group.totalCases,
			breakdown: group.breakdown,
			crimeNos: group.crimeNos,
			mappingSources: [...group.mappingSources],
			lastIncidentAt: group.lastIncidentAt?.toISOString() || null
		}))
		.sort((a, b) => b.totalCases - a.totalCases);
};

const buildAlerts = (records, now) => {
	const currentStart = new Date(now.getTime() - 30 * 86400000);
	const previousStart = new Date(now.getTime() - 60 * 86400000);
	const groups = new Map();

	records.forEach(record => {
		const date = parseDate(record.RegisteredAt);
		if (!date || date > now || date < previousStart) return;
		const pincode = normalisePincode(record.Pincode);
		const coordinates = validCoordinates(record);
		const locationKey = pincode || (coordinates ? `${coordinates.lat.toFixed(3)},${coordinates.lng.toFixed(3)}` : '');
		if (!locationKey) return;
		const crimeType = String(record.CrimeTypeName || '').trim() || 'Unclassified';
		const key = `${locationKey}|${crimeType.toLocaleLowerCase('en-IN')}`;
		if (!groups.has(key)) {
			groups.set(key, {
				locationKey,
				pincode: pincode || null,
				division: record.DivisionName || 'Unknown',
				crimeType,
				current: [],
				previous: []
			});
		}
		const group = groups.get(key);
		const item = { crimeNo: String(record.CrimeNo), registeredAt: record.RegisteredAt };
		if (date >= currentStart) group.current.push(item);
		else group.previous.push(item);
	});

	return [...groups.values()]
		.filter(group => group.current.length >= 3)
		.map(group => {
			const accelerating = group.current.length >= Math.max(3, group.previous.length * 2);
			return {
				id: `${group.locationKey}-${group.crimeType}`,
				rule: accelerating ? 'RECENT_SURGE' : 'REPEAT_CONCENTRATION',
				severity: accelerating || group.current.length >= 5 ? 'HIGH' : 'MEDIUM',
				title: accelerating ? 'Recent volume increase' : 'Repeated recent concentration',
				summary: `${group.current.length} ${group.crimeType} cases were recorded in ${group.pincode ? `pincode ${group.pincode}` : `coordinate cell ${group.locationKey}`} during the latest 30-day window.`,
				locationKey: group.locationKey,
				pincode: group.pincode,
				division: group.division,
				crimeType: group.crimeType,
				current30Count: group.current.length,
				previous30Count: group.previous.length,
				evidence: group.current,
				explanation: accelerating
					? 'Triggered because the latest 30-day count is at least three and at least twice the preceding 30-day count.'
					: 'Triggered because at least three cases of the same recorded type occurred in one area during 30 days.'
			};
		})
		.sort((a, b) =>
			(a.severity === b.severity ? b.current30Count - a.current30Count : a.severity === 'HIGH' ? -1 : 1)
		)
		.slice(0, 20);
};

const buildSpatialIntelligence = (records, now = new Date()) => {
	const resolvedRecords = resolveSpatialRecords(records);
	const hotspots = buildHotspots(resolvedRecords);
	const directRecords = resolvedRecords.filter(item => item.mappingSource === 'recorded_coordinates').length;
	const samePincodeRecords = resolvedRecords.filter(item => item.mappingSource === 'same_pincode_centroid').length;
	const fallbackRecords = resolvedRecords.filter(item => item.mappingSource === 'pincode_fallback').length;
	const mappedRecords = directRecords + samePincodeRecords + fallbackRecords;

	const currentStart = new Date(now.getTime() - 30 * 86400000);
	hotspots.forEach(hotspot => {
		hotspot.recent30Count = records.filter(record => {
			const pincode = normalisePincode(record.Pincode);
			const date = parseDate(record.RegisteredAt);
			return hotspot.pincode !== 'No pincode' && pincode === hotspot.pincode && date && date >= currentStart && date <= now;
		}).length;
	});

	return {
		hotspots,
		alerts: buildAlerts(records, now),
		coverage: {
			totalRecords: records.length,
			mappedRecords,
			unmappedRecords: records.length - mappedRecords,
			directCoordinateRecords: directRecords,
			samePincodeCentroidRecords: samePincodeRecords,
			fallbackPincodeRecords: fallbackRecords,
			mappedAreas: hotspots.length,
			recordCapReached: records.length === 300,
			analysisAsOf: now.toISOString(),
			alertWindow: 'Latest 30 days compared with the preceding 30 days'
		}
	};
};

module.exports = { buildAlerts, buildSpatialIntelligence, validCoordinates };
