const SEED_VERSION = 'SYNTHETIC_SEED_V1';
const SEED_CONFIRMATION = 'LOAD_25_SYNTHETIC_FIRS';

const locations = {
	koramangala: {
		address: '80 Feet Road, Koramangala 5th Block, Bengaluru',
		pincode: 560034,
		division: 'Bengaluru South',
		latitude: 12.9352,
		longitude: 77.6245
	},
	indiranagar: {
		address: '100 Feet Road, Indiranagar, Bengaluru',
		pincode: 560038,
		division: 'Bengaluru East',
		latitude: 12.9719,
		longitude: 77.6412
	},
	majestic: {
		address: 'Kempegowda Bus Station, Majestic, Bengaluru',
		pincode: 560009,
		division: 'Bengaluru Central',
		latitude: 12.9767,
		longitude: 77.5713
	},
	rajajinagar: {
		address: 'Dr Rajkumar Road, Rajajinagar 2nd Block, Bengaluru',
		pincode: 560010,
		division: 'Bengaluru West',
		latitude: 12.9915,
		longitude: 77.5545
	},
	mysuru: {
		address: 'Sayyaji Rao Road, Mysuru',
		pincode: 570001,
		division: 'Mysuru City',
		latitude: 12.3052,
		longitude: 76.6552
	},
	mangaluru: {
		address: 'Hampankatta Main Road, Mangaluru',
		pincode: 575001,
		division: 'Mangaluru City',
		latitude: 12.8698,
		longitude: 74.8431
	}
};

const crimeTypeIds = {
	'Theft': 1,
	'Assault': 2,
	'Cyber Crime': 3,
	'Fraud': 4,
	'Missing Person': 5
};

const definitions = [
	{
		crimeNo: 926001, victim: 'Arun Prasad', age: 34, victimMobile: '9000000101',
		location: 'koramangala', accused: 'Ravi Kumar, Imran Pasha', accusedAge: 29,
		accusedMobile: '9000011001', crimeType: 'Theft', status: 'Under Investigation',
		registeredAt: '2026-07-22 20:15:00',
		incident: 'parked a black Royal Enfield motorcycle outside a supermarket at 7:35 PM and found it missing at 8:10 PM despite using both a steering lock and disc lock',
		witness: 'A security guard saw two helmeted men waiting near the motorcycle, and a fruit vendor saw them push it toward the service road before starting it.',
		evidence: 'Parking-area CCTV covers the relevant period, a broken piece of the disc lock was recovered, and the vehicle registration is KA-01-SY-2601.',
		lead: 'Secure footage from 7:20 PM to 8:20 PM, compare the helmet and jacket descriptions with nearby thefts, and check cameras toward Sony World junction.'
	},
	{
		crimeNo: 926002, victim: 'Meera Nair', age: 27, victimMobile: '9000000102',
		location: 'koramangala', accused: 'Ravi Kumar, Imran Pasha', accusedAge: 29,
		accusedMobile: '9000011001', crimeType: 'Theft', status: 'Evidence Collection',
		registeredAt: '2026-07-15 19:50:00',
		incident: 'left a blue Honda Activa in the marked parking bay beside a café at 6:40 PM and discovered at 7:30 PM that the scooter and helmet stored beneath the seat were gone',
		witness: 'The café cashier noticed two helmeted persons repeatedly walking past the bay; one wore a grey rain jacket and the other carried a small cutting tool.',
		evidence: 'A neighbouring shop camera appears to show the scooter being moved without its headlamp, and an electronic payment receipt fixes the complainant inside the café at the time.',
		lead: 'Obtain original video rather than a messaging-app copy, trace the exit route toward Ejipura, and compare the grey jacket and lock-defeat method with FIR 926001.'
	},
	{
		crimeNo: 926003, victim: 'Suresh Babu', age: 46, victimMobile: '9000000103',
		location: 'koramangala', accused: 'Imran Pasha', accusedAge: 31,
		accusedMobile: '9000011002', crimeType: 'Theft', status: 'Registered',
		registeredAt: '2026-07-03 22:05:00',
		incident: 'secured a delivery motorcycle behind a restaurant at 9:05 PM and found the rear chain cut and the vehicle missing when the shift ended at 9:55 PM',
		witness: 'A delivery worker heard metal striking the ground and saw a helmeted man pushing a motorcycle while another motorcycle waited near the corner.',
		evidence: 'The cut chain remains at the scene, the restaurant loading camera faces the rear lane, and the stolen vehicle carried a delivery box numbered DL-47.',
		lead: 'Preserve tool-mark evidence from the chain, collect loading-camera footage between 8:50 PM and 10:05 PM, and compare the waiting motorcycle with FIRs 926001 and 926002.'
	},
	{
		crimeNo: 926004, victim: 'Lakshmi Rao', age: 39, victimMobile: '9000000104',
		location: 'indiranagar', accused: 'Ravi Kumar', accusedAge: 29,
		accusedMobile: '9000011001', crimeType: 'Theft', status: 'Suspect Identified',
		registeredAt: '2026-06-14 18:45:00',
		incident: 'parked a white scooter outside a pharmacy at 5:55 PM and returned thirty-five minutes later to find the steering lock damaged and the scooter removed',
		witness: 'The pharmacy attendant identified a man in a black helmet from a still image and reported that a second person circled the block on a red motorcycle.',
		evidence: 'High-resolution footage shows a partial number plate ending 73, and a nearby traffic camera records the pair travelling east at 6:34 PM.',
		lead: 'Verify the witness identification independently, enhance the partial plate only from original footage, and compare the black helmet and red support vehicle with the Koramangala series.'
	},
	{
		crimeNo: 926005, victim: 'Farah Khan', age: 22, victimMobile: '9000000105',
		location: 'koramangala', accused: 'Imran Pasha', accusedAge: 31,
		accusedMobile: '9000011002', crimeType: 'Theft', status: 'Charge Sheet Preparation',
		registeredAt: '2026-04-08 21:30:00',
		incident: 'placed a laptop bag on the rear seat of a locked car while collecting an order and found the window forced open and the bag removed within twelve minutes',
		witness: 'A parking assistant saw a man wearing a helmet lean beside the car while another person remained near a motorcycle at the lane entrance.',
		evidence: 'The bag contained a serial-numbered laptop, office identity card and external drive; fingerprints and a small metal fragment were collected from the window frame.',
		lead: 'Circulate the laptop serial number to second-hand dealers, compare the metal fragment with seized tools, and review whether the support motorcycle appears in the July theft footage.'
	},
	{
		crimeNo: 926006, victim: 'Dinesh Kulkarni', age: 61, victimMobile: '9000000106',
		location: 'rajajinagar', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Theft', status: 'Under Investigation',
		registeredAt: '2026-02-12 11:20:00',
		incident: 'kept a mobile phone and wallet inside a zipped shoulder bag while boarding a crowded bus and noticed both items missing immediately after stepping off',
		witness: 'One passenger recalled a man repeatedly changing position near the complainant, but could not see his face because a scarf covered the lower portion.',
		evidence: 'The wallet contained two bank cards and identity documents, the handset IMEI is recorded, and a small unauthorized contactless transaction occurred at 11:08 AM.',
		lead: 'Request bus and terminal footage, block and trace the handset by lawful process, obtain details of the contactless transaction, and look for similar crowd-based theft complaints.'
	},
	{
		crimeNo: 926007, victim: 'Nandini Gowda', age: 31, victimMobile: '9000000107',
		location: 'mysuru', accused: 'Prakash Gowda', accusedAge: 36,
		accusedMobile: '9000011007', crimeType: 'Theft', status: 'Closed - Property Recovered',
		registeredAt: '2025-12-18 16:10:00',
		incident: 'left a gold chain inside a bedroom cupboard before a family function and discovered after guests departed that the cupboard latch had been opened and the chain was absent',
		witness: 'A neighbour saw a temporary event worker enter the side corridor even though his assigned duties were outside the house.',
		evidence: 'A jewellery receipt establishes ownership, the worker register contains the accused name and mobile number, and the chain was later identified at a pawn shop.',
		lead: 'Retain the pawn-shop register and camera export, document the property-identification process, and verify whether the same worker appears in complaints from other event venues.'
	},
	{
		crimeNo: 926008, victim: 'Joel Dsouza', age: 25, victimMobile: '9000000108',
		location: 'mangaluru', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Theft', status: 'Untraced',
		registeredAt: '2025-09-09 07:40:00',
		incident: 'left fishing equipment in a locked storage shed near the market overnight and found the padlock cut and two motorized reels missing the following morning',
		witness: 'A tea-stall worker heard a small goods vehicle stop near the shed at approximately 3:15 AM but did not observe the occupants.',
		evidence: 'Tool marks are visible on the padlock, one reel has an engraved cooperative number, and a municipal camera covers the only vehicle exit from the lane.',
		lead: 'Collect the municipal recording before overwrite, circulate the engraved number, compare tool marks with other market thefts, and identify goods vehicles present between 3:00 AM and 3:30 AM.'
	},
	{
		crimeNo: 926009, victim: 'Asha Iyer', age: 68, victimMobile: '9000000109',
		location: 'indiranagar', accused: 'Nikhil Rao, Sameer Khan', accusedAge: 28,
		accusedMobile: '9000012001', crimeType: 'Cyber Crime', status: 'Under Investigation',
		registeredAt: '2026-07-18 14:35:00',
		incident: 'received a call from a person claiming to be a bank security officer and disclosed a one-time password after being told that her pension account would otherwise be frozen',
		witness: 'Her daughter was present for the final part of the call and heard the caller instruct the victim not to contact the branch for two hours.',
		evidence: 'Three unauthorized UPI transfers totalling Rs 84,500 went to two wallet identifiers; screenshots, call logs, transaction references and the originating number are preserved.',
		lead: 'Send immediate preservation requests for the wallets and phone number, map onward transfers, compare the scripted pension-account warning with FIRs 926010 and 926012, and avoid attributing identity from subscriber data alone.'
	},
	{
		crimeNo: 926010, victim: 'Karthik Menon', age: 24, victimMobile: '9000000110',
		location: 'koramangala', accused: 'Nikhil Rao', accusedAge: 28,
		accusedMobile: '9000012001', crimeType: 'Cyber Crime', status: 'Account Freeze Requested',
		registeredAt: '2026-06-27 10:25:00',
		incident: 'clicked a sponsored advertisement for a discounted laptop, communicated with the seller through a messaging application, and transferred an advance after receiving a false courier receipt',
		witness: 'A colleague observed the purchase conversation and confirmed that the seller repeatedly created urgency by claiming that only one unit remained.',
		evidence: 'The complainant retained the advertisement URL, chat export, beneficiary UPI ID, bank reference, courier image and the seller number; the supposed courier confirms the receipt is fabricated.',
		lead: 'Preserve platform and payment records, identify linked advertisements, trace beneficiary and onward accounts, and compare the seller number and fabricated receipt template with the wider cyber series.'
	},
	{
		crimeNo: 926011, victim: 'Pooja Shetty', age: 19, victimMobile: '9000000111',
		location: 'mangaluru', accused: 'Sameer Khan', accusedAge: 32,
		accusedMobile: '9000012002', crimeType: 'Cyber Crime', status: 'Registered',
		registeredAt: '2026-05-11 17:55:00',
		incident: 'received a social-media message offering a part-time rating job and made several small deposits after a dashboard falsely displayed increasing earnings',
		witness: 'Her roommate saw the dashboard and warned her when the operator demanded a larger payment to release the displayed balance.',
		evidence: 'Eleven chat messages, two website addresses, four UPI references, screen recordings and the receiving account details are available; the total reported loss is Rs 31,200.',
		lead: 'Preserve the domains and messaging account, group beneficiary identifiers, identify other complaints using the same dashboard design, and document each transfer before any consolidation.'
	},
	{
		crimeNo: 926012, victim: 'Raghavendra Hegde', age: 57, victimMobile: '9000000112',
		location: 'mysuru', accused: 'Nikhil Rao, Sameer Khan', accusedAge: 28,
		accusedMobile: '9000012001', crimeType: 'Cyber Crime', status: 'Device Examination',
		registeredAt: '2026-03-19 12:40:00',
		incident: 'installed a remote-support application at the direction of a caller claiming to update know-your-customer records and then observed unauthorized transfers from two accounts',
		witness: 'A bank employee recorded that the complainant arrived within forty minutes and that access was disabled immediately after the transactions were reported.',
		evidence: 'The handset is available for forensic imaging, bank statements show five transfers totalling Rs 1,42,000, and the call number matches a number mentioned in another complaint.',
		lead: 'Image the device using documented procedure, preserve application and telecom records, trace the beneficiary chain, and compare the caller script and shared number with FIR 926009.'
	},
	{
		crimeNo: 926013, victim: 'Divya Narayan', age: 43, victimMobile: '9000000113',
		location: 'rajajinagar', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Cyber Crime', status: 'Untraced',
		registeredAt: '2025-11-06 09:15:00',
		incident: 'opened an email attachment appearing to contain a supplier invoice, after which the business email account sent altered payment instructions to a customer',
		witness: 'The accounts manager confirmed that no bank-detail change was authorized and noticed the altered message only after the customer telephoned.',
		evidence: 'Original email headers, the malicious attachment hash, sign-in logs, altered invoice, beneficiary details and customer correspondence have been retained.',
		lead: 'Preserve cloud-mail logs, identify suspicious login infrastructure, trace the beneficiary account, compare the attachment hash with reported campaigns, and keep the original files read-only.'
	},
	{
		crimeNo: 926014, victim: 'Mohan Krishnan', age: 52, victimMobile: '9000000114',
		location: 'majestic', accused: 'Shalini Das, Vikram Joshi', accusedAge: 35,
		accusedMobile: '9000013001', crimeType: 'Fraud', status: 'Under Investigation',
		registeredAt: '2026-07-09 13:05:00',
		incident: 'paid a deposit for a commercial shop after two persons displayed a forged ownership document and represented that they were authorized property agents',
		witness: 'The building caretaker confirms that neither person had authority to lease the shop and saw them meet two other prospective tenants that week.',
		evidence: 'The complainant holds the agreement copy, payment acknowledgement, bank transfer reference, messaging history, identity-card images and a photograph taken during the meeting.',
		lead: 'Verify each document with the issuing office, trace the beneficiary account and onward transfers, identify the other prospective tenants, and compare agent phone numbers with FIR 926015.'
	},
	{
		crimeNo: 926015, victim: 'Zoya Ahmed', age: 29, victimMobile: '9000000115',
		location: 'indiranagar', accused: 'Shalini Das', accusedAge: 35,
		accusedMobile: '9000013001', crimeType: 'Fraud', status: 'Suspect Identified',
		registeredAt: '2026-05-23 15:20:00',
		incident: 'transferred a refundable registration fee to a person claiming to recruit for a technology company after attending a video interview conducted through an unofficial account',
		witness: 'A friend reviewed the offer letter and identified spelling differences from genuine company documents before a second payment could be made.',
		evidence: 'The false offer letter, interview link, email headers, chat messages, receiving account, transfer reference and caller number are preserved.',
		lead: 'Confirm the recruitment claim with the company, preserve meeting-platform records, trace the receiving account, identify related job advertisements, and compare the accused contact details with the property fraud.'
	},
	{
		crimeNo: 926016, victim: 'Harish Patil', age: 37, victimMobile: '9000000116',
		location: 'mysuru', accused: 'Vikram Joshi', accusedAge: 38,
		accusedMobile: '9000013002', crimeType: 'Fraud', status: 'Charge Sheet Filed',
		registeredAt: '2026-01-16 16:30:00',
		incident: 'purchased what was represented as an authenticated antique coin after the seller produced a valuation certificate that was later found to be fabricated',
		witness: 'A licensed dealer examined the item the next day and confirmed that it was a modern reproduction with no collectible value.',
		evidence: 'The coin, false certificate, sale invoice, marketplace listing, payment record and seller conversation are secured and the expert has provided a written preliminary opinion.',
		lead: 'Obtain a formal expert report, preserve marketplace account data, identify buyers who responded to the same listing, and compare the certificate format with other collectible fraud reports.'
	},
	{
		crimeNo: 926017, victim: 'Geetha Srinivas', age: 72, victimMobile: '9000000117',
		location: 'rajajinagar', accused: 'Shalini Das, Vikram Joshi', accusedAge: 35,
		accusedMobile: '9000013001', crimeType: 'Fraud', status: 'Under Investigation',
		registeredAt: '2025-10-14 11:45:00',
		incident: 'handed over cash and signed forms to persons claiming to arrange a government housing subsidy, after they displayed false identification and promised priority processing',
		witness: 'Two neighbours attended the meeting and can describe both visitors and the silver car in which they arrived.',
		evidence: 'Copies of the forms, printed receipt, brochure, phone messages and a housing-society camera recording are available; the relevant department confirms no such collection drive existed.',
		lead: 'Secure the original camera export, verify the vehicle registration, compare the printed material with later frauds, and identify other residents approached by the same pair.'
	},
	{
		crimeNo: 926018, victim: 'Manjunath Rao', age: 45, victimMobile: '9000000118',
		location: 'mangaluru', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Fraud', status: 'Untraced',
		registeredAt: '2025-08-21 14:10:00',
		incident: 'ordered construction material from a newly created business profile and paid an advance to an account supplied on a quotation, but no material arrived and all contact stopped',
		witness: 'The site engineer participated in the calls and confirms that the caller used detailed product terminology to appear genuine.',
		evidence: 'The quotation, tax-number image, website capture, call logs, beneficiary account and bank transfer reference are retained; the address printed on the quotation is vacant.',
		lead: 'Verify registration identifiers, preserve the website and telecom records, trace the beneficiary account, and search for other quotations with the same layout and contact number.'
	},
	{
		crimeNo: 926019, victim: 'Aditya Bose', age: 26, victimMobile: '9000000119',
		location: 'majestic', accused: 'Manoj Shetty, Deepak Naik', accusedAge: 33,
		accusedMobile: '9000014001', crimeType: 'Assault', status: 'Under Investigation',
		registeredAt: '2026-07-20 23:10:00',
		incident: 'was confronted near the bus-station exit by two men after refusing an unsolicited taxi offer and was struck on the shoulder and threatened with a knife',
		witness: 'An auto driver and a street vendor saw the confrontation and state that one assailant wore a red cap while the other carried a black backpack.',
		evidence: 'A hospital wound certificate, torn shirt, photographs, emergency-call record and station camera locations have been documented; no property was taken.',
		lead: 'Record independent witness accounts, secure station footage from 10:45 PM to 11:20 PM, verify the suspected identities, and compare the red cap and taxi approach with FIR 926020.'
	},
	{
		crimeNo: 926020, victim: 'Sanjana Kulkarni', age: 23, victimMobile: '9000000120',
		location: 'majestic', accused: 'Manoj Shetty', accusedAge: 33,
		accusedMobile: '9000014001', crimeType: 'Assault', status: 'Suspect Identified',
		registeredAt: '2026-06-05 21:35:00',
		incident: 'was followed from a bus platform after declining a transport offer and was pushed against a railing when she attempted to seek help',
		witness: 'A ticket inspector intervened and observed a man in a red cap leave through the northern exit toward the taxi lane.',
		evidence: 'The platform camera records part of the incident, the inspector provided an employee number, and photographs show bruising documented during medical examination.',
		lead: 'Preserve original footage, conduct a properly documented identification process, compare the approach and clothing with FIR 926019, and obtain taxi-lane camera coverage.'
	},
	{
		crimeNo: 926021, victim: 'Ramesh Naidu', age: 49, victimMobile: '9000000121',
		location: 'mangaluru', accused: 'Deepak Naik', accusedAge: 30,
		accusedMobile: '9000014002', crimeType: 'Assault', status: 'Mediation Rejected',
		registeredAt: '2026-03-02 20:20:00',
		incident: 'was struck with a wooden object during a dispute over obstruction of the entrance to his shop and sustained an injury to the left forearm',
		witness: 'Two neighbouring shopkeepers saw the accused return after an earlier argument and heard a direct threat immediately before the assault.',
		evidence: 'Medical records, photographs, the wooden object, nearby shop video and prior complaint acknowledgement are available.',
		lead: 'Document continuity of the recovered object, obtain separate witness statements, preserve footage beginning before the first argument, and assess the earlier complaint as context rather than proof.'
	},
	{
		crimeNo: 926022, victim: 'Bhavana Reddy', age: 36, victimMobile: '9000000122',
		location: 'indiranagar', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Assault', status: 'Untraced',
		registeredAt: '2025-12-03 18:50:00',
		incident: 'was pushed from a bicycle and struck by an unknown rider after objecting to dangerous driving near a pedestrian crossing',
		witness: 'A food-delivery worker saw the rider conceal part of the motorcycle number plate with black tape and leave toward the flyover.',
		evidence: 'A helmet-camera clip from another cyclist, clinic record, damaged bicycle photographs and a partial plate beginning KA-03 are preserved.',
		lead: 'Obtain the original helmet-camera file, compare traffic-camera frames along the route, identify motorcycles matching the partial plate and avoid enhancing details beyond the source quality.'
	},
	{
		crimeNo: 926023, victim: 'Neelam Joseph', age: 16, victimMobile: '9000000123',
		location: 'koramangala', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Missing Person', status: 'Search Active',
		registeredAt: '2026-07-24 17:30:00',
		incident: 'left a tuition centre at approximately 4:20 PM but did not reach home by the usual 4:50 PM arrival time and has not responded to calls',
		witness: 'A classmate last saw the missing child walking toward the main bus stop carrying a blue backpack and wearing the prescribed school sports jacket.',
		evidence: 'A recent photograph, phone number, device identifiers, usual route, clothing description and attendance record have been supplied; there is no confirmed evidence of an offence.',
		lead: 'Treat welfare and safe recovery as the priority, promptly preserve route and bus-stop footage, verify hospitals and known contacts, and avoid publishing unnecessary personal details.'
	},
	{
		crimeNo: 926024, victim: 'Samuel George', age: 71, victimMobile: '9000000124',
		location: 'mysuru', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Missing Person', status: 'Located Safe',
		registeredAt: '2026-04-26 08:40:00',
		incident: 'left home for a routine morning walk at 6:10 AM without carrying his regular medicine and did not return within the normal one-hour period',
		witness: 'A newspaper vendor saw him near the market appearing confused and walking away from his customary route.',
		evidence: 'Family members provided a recent photograph, clothing details, medical information relevant to safe recovery and locations he commonly visits.',
		lead: 'The person was located safely at 12:25 PM; retain the verified timeline, document welfare checks and close public alerts while limiting medical details to authorized records.'
	},
	{
		crimeNo: 926025, victim: 'Ananya Kamath', age: 20, victimMobile: '9000000125',
		location: 'mangaluru', accused: 'Unknown', accusedAge: null,
		accusedMobile: '', crimeType: 'Missing Person', status: 'Search Active',
		registeredAt: '2025-10-29 19:15:00',
		incident: 'departed a college library at 5:45 PM after messaging that she would take the usual bus, but did not arrive at the family residence and her phone later became unreachable',
		witness: 'The library guard saw her speak briefly with an unidentified woman near the gate before walking toward the Hampankatta bus stop.',
		evidence: 'Library exit footage, a recent photograph, device details, travel-card information and the last message timestamp are available; no conclusion has been reached about the reason for absence.',
		lead: 'Preserve transit and street-camera records, verify voluntary contacts sensitively, check travel-card use through lawful procedure, and treat the unidentified woman only as a person who may have information.'
	}
];

const buildStatement = definition => {
	const date = new Date(definition.registeredAt.replace(' ', 'T'));
	const dateText = Number.isNaN(date.getTime())
		? definition.registeredAt
		: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
	return [
		`SYNTHETIC TEST RECORD — not a real complaint or real person. On ${dateText}, at ${definition.locationDetails.address}, I ${definition.incident}.`,
		definition.witness,
		definition.evidence,
		'I have provided these facts for investigation and understand that every witness account, digital record, identity detail and suspected association must be independently verified. I have not knowingly authorized the reported act, transfer, removal or use described above, except where the record concerns a missing-person welfare report.',
		`Requested investigative action: ${definition.lead}`
	].join(' ');
};

const syntheticFirs = definitions.map(definition => {
	const locationDetails = locations[definition.location];
	const enriched = { ...definition, locationDetails };
	return {
		CrimeNo: definition.crimeNo,
		VictimName: definition.victim,
		VictimAge: definition.age,
		VictimMobile: definition.victimMobile,
		VictimAddress: locationDetails.address,
		AccusedName: definition.accused,
		AccusedAge: definition.accusedAge,
		AccusedMobile: definition.accusedMobile,
		Pincode: locationDetails.pincode,
		DivisionName: locationDetails.division,
		CrimeTypeID: crimeTypeIds[definition.crimeType],
		CrimeTypeName: definition.crimeType,
		VictimStatement: buildStatement(enriched),
		CaseStatus: definition.status,
		RegisteredAt: definition.registeredAt,
		RegisteredBy: SEED_VERSION,
		Latitude: locationDetails.latitude,
		longitude: locationDetails.longitude
	};
});

const validateSyntheticFirs = records => {
	if (!Array.isArray(records) || records.length !== 25) {
		throw new Error('Synthetic FIR dataset must contain exactly 25 records.');
	}
	const crimeNumbers = new Set();
	const requiredFields = [
		'CrimeNo', 'VictimName', 'VictimAge', 'VictimMobile', 'VictimAddress',
		'AccusedName', 'Pincode', 'DivisionName', 'CrimeTypeID', 'CrimeTypeName',
		'VictimStatement', 'CaseStatus', 'RegisteredAt', 'RegisteredBy', 'Latitude', 'longitude'
	];
	records.forEach(record => {
		requiredFields.forEach(field => {
			if (record[field] === undefined || record[field] === null) {
				throw new Error(`Synthetic FIR ${record.CrimeNo || 'unknown'} is missing ${field}.`);
			}
		});
		if (crimeNumbers.has(record.CrimeNo)) {
			throw new Error(`Duplicate synthetic CrimeNo ${record.CrimeNo}.`);
		}
		crimeNumbers.add(record.CrimeNo);
		if (record.RegisteredBy !== SEED_VERSION) {
			throw new Error(`Synthetic FIR ${record.CrimeNo} is not labelled with the seed version.`);
		}
		if (record.VictimStatement.length < 500 || record.VictimStatement.length > 5000) {
			throw new Error(`Synthetic FIR ${record.CrimeNo} statement length is outside 500–5000 characters.`);
		}
	});
	return true;
};

validateSyntheticFirs(syntheticFirs);

const assertSyntheticSeedRole = role => {
	if (role !== 'Supervisor') {
		const error = new Error('Supervisor role is required to load synthetic FIR records.');
		error.statusCode = 403;
		throw error;
	}
};

const seedSyntheticFirs = async ({ zcql, table }) => {
	const existingResult = await zcql.executeZCQLQuery(
		'SELECT CrimeNo, RegisteredBy FROM CaseRegistration WHERE CrimeNo >= 926001 AND CrimeNo <= 926025 LIMIT 100'
	);
	const existing = new Map(existingResult.map(item => {
		const row = item.CaseRegistration || item;
		return [Number(row.CrimeNo), String(row.RegisteredBy || '')];
	}));
	const insertedCrimeNos = [];
	const existingSyntheticCrimeNos = [];
	const conflictingCrimeNos = [];

	for (const record of syntheticFirs) {
		if (existing.has(record.CrimeNo)) {
			if (existing.get(record.CrimeNo) === SEED_VERSION) {
				existingSyntheticCrimeNos.push(record.CrimeNo);
			} else {
				conflictingCrimeNos.push(record.CrimeNo);
			}
			continue;
		}
		await table.insertRow(record);
		insertedCrimeNos.push(record.CrimeNo);
	}

	return {
		seedVersion: SEED_VERSION,
		requested: syntheticFirs.length,
		inserted: insertedCrimeNos.length,
		alreadyPresent: existingSyntheticCrimeNos.length,
		conflicts: conflictingCrimeNos.length,
		insertedCrimeNos,
		existingSyntheticCrimeNos,
		conflictingCrimeNos
	};
};

module.exports = {
	SEED_CONFIRMATION,
	SEED_VERSION,
	assertSyntheticSeedRole,
	seedSyntheticFirs,
	syntheticFirs,
	validateSyntheticFirs
};
