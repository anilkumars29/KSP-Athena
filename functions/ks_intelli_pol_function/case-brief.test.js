const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCaseBrief, extractEvidenceLeads, extractTimeline } = require('./case-brief');

const statement = 'On 18 July 2026, at 7:40 PM, I parked my motorcycle near the supermarket. After shopping, I returned at 8:15 PM and found it missing. The security guard noticed two helmeted persons. CCTV cameras face the parking area.';

test('extracts explicit and relative statement events without inventing dates', () => {
	const timeline = extractTimeline(statement);
	assert.equal(timeline.length, 2);
	assert.match(timeline[0].label, /18 July 2026/i);
	assert.match(timeline[0].label, /7:40 PM/i);
	assert.equal(timeline[1].precision, 'Explicit time/date in statement');
	assert.match(timeline[1].event, /returned at 8:15 PM/);
});

test('links evidence excerpts to bounded follow-up checks', () => {
	const leads = extractEvidenceLeads(statement);
	assert.ok(leads.some(lead => lead.category === 'CCTV / video' && /CCTV cameras/.test(lead.excerpt)));
	assert.ok(leads.some(lead => lead.category === 'Witness' && /security guard/.test(lead.excerpt)));
	assert.ok(leads.some(lead => lead.category === 'Vehicle'));
});

test('builds a sourced case brief from available fields', () => {
	const brief = buildCaseBrief({
		CrimeNo: 4589,
		CrimeTypeName: 'Vehicle Theft',
		CaseStatus: 'Registered',
		RegisteredAt: '2026-07-18 19:40:00',
		DivisionName: 'Bengaluru South',
		Pincode: 560034,
		VictimAddress: 'Koramangala',
		AccusedName: 'Unknown',
		VictimStatement: statement
	});

	assert.match(brief.overview, /vehicle theft at Koramangala/i);
	assert.equal(brief.keyFacts.some(fact => fact.source === 'AccusedName'), false);
	assert.equal(brief.statementExcerpts.length, 3);
	assert.equal(brief.statementAnalysisAvailable, true);
	assert.match(brief.method, /no facts are generated/i);
});

test('omits statement analysis when role-filtered fields are absent', () => {
	const brief = buildCaseBrief({
		CrimeNo: 4589,
		CrimeTypeName: 'Vehicle Theft',
		CaseStatus: 'Registered',
		Pincode: 560034
	});
	assert.equal(brief.statementAnalysisAvailable, false);
	assert.deepEqual(brief.evidenceLeads, []);
	assert.deepEqual(brief.statementExcerpts, []);
});
