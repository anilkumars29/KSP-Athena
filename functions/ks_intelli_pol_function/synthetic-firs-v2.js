const SEED_VERSION_V2 = 'SYNTHETIC_SEED_V2';
const SEED_CONFIRMATION_V2 = 'LOAD_30_SYNTHETIC_FIRS_V2';

const locations = {
	hubballi: ['Koppikar Road, Hubballi', 580020, 'Dharwad Division', 15.3647, 75.1240],
	belagavi: ['College Road, Belagavi', 590001, 'Belagavi Division', 15.8497, 74.4977],
	ballari: ['Double Road, Ballari', 583101, 'Ballari Division', 15.1394, 76.9214],
	kalaburagi: ['Super Market Road, Kalaburagi', 585101, 'Kalaburagi Division', 17.3297, 76.8343],
	shivamogga: ['Nehru Road, Shivamogga', 577201, 'Shivamogga Division', 13.9299, 75.5681],
	udupi: ['Car Street, Udupi', 576101, 'Udupi Division', 13.3409, 74.7421],
	tumakuru: ['BH Road, Tumakuru', 572101, 'Tumakuru Division', 13.3409, 77.1010],
	hassan: ['BM Road, Hassan', 573201, 'Hassan Division', 13.0072, 76.0962],
	madikeri: ['College Road, Madikeri', 571201, 'Kodagu Division', 12.4244, 75.7382],
	bidar: ['Gumpa Road, Bidar', 585401, 'Bidar Division', 17.9104, 77.5199],
	vijayapura: ['MG Road, Vijayapura', 586101, 'Vijayapura Division', 16.8302, 75.7100],
	raichur: ['Station Road, Raichur', 584101, 'Raichur Division', 16.2076, 77.3463],
	chikkamagaluru: ['IG Road, Chikkamagaluru', 577101, 'Chikkamagaluru Division', 13.3161, 75.7720],
	mandya: ['VV Road, Mandya', 571401, 'Mandya Division', 12.5223, 76.8970],
	kolar: ['MG Road, Kolar', 563101, 'Kolar Division', 13.1362, 78.1291],
	karwar: ['Green Street, Karwar', 581301, 'Karwar Division', 14.8136, 74.1297],
	bagalkot: ['Station Road, Bagalkot', 587101, 'Bagalkot Division', 16.1691, 75.6615],
	chitradurga: ['Holalkere Road, Chitradurga', 577501, 'Chitradurga Division', 14.2251, 76.3980],
	haveri: ['PB Road, Haveri', 581110, 'Haveri Division', 14.7951, 75.3991],
	gadag: ['Station Road, Gadag', 582101, 'Gadag Division', 15.4315, 75.6355],
	mysuru: ['D Devaraj Urs Road, Mysuru', 570001, 'Mysuru Division', 12.3052, 76.6552],
	mangaluru: ['KS Rao Road, Mangaluru', 575001, 'Mangaluru Division', 12.8698, 74.8431],
	koramangala: ['80 Feet Road, Koramangala, Bengaluru', 560034, 'Bengaluru South Division', 12.9352, 77.6245]
};

const crimeTypeIds = {
	Theft: 1,
	Assault: 2,
	'Cyber Crime': 3,
	Fraud: 4,
	'Missing Person': 5
};

const definitions = [
	[927001, 'Arun Prasad', 34, '9000000101', 'hubballi', 'Ravi Kumar', 29, '9000011001', 'Theft', 'Under Investigation', '2026-07-25 19:40:00',
		'While visiting Hubballi after my earlier synthetic motorcycle complaint recorded as FIR 926001, I left a locked camera bag in the hotel reception storage area and later found that it had been removed using a tag bearing a copied signature.',
		'The receptionist recalls a man asking whether the owner of a black motorcycle had checked in and then presenting the copied tag shortly before the bag disappeared.',
		'The storage register, original tag stub, lobby recording, camera serial number and a taxi receipt linked to the visitor are preserved.',
		'Compare the visitor and telephone details with FIR 926001, verify the taxi booking independently and circulate only the camera serial number to lawful recovery channels.'],
	[927002, 'Meera Nair', 27, '9000000102', 'belagavi', 'Unknown', null, '', 'Cyber Crime', 'Account Freeze Requested', '2026-07-23 11:25:00',
		'After my synthetic scooter theft report FIR 926002, I received a message claiming that the vehicle had been recovered and paid a supposed release fee through a link that imitated a government payment page.',
		'My colleague saw the message arrive from an unverified number and warned me after the page requested a second payment for transport charges.',
		'The message export, false page address, payment reference, beneficiary UPI identifier and browser screenshots are available in original form.',
		'Preserve the domain and payment account, determine how the sender learned of the earlier complaint and do not assume that access came from any police system without evidence.'],
	[927003, 'Asha Iyer', 68, '9000000109', 'mysuru', 'Nikhil Rao', 28, '9000012001', 'Cyber Crime', 'Under Investigation', '2026-07-21 15:10:00',
		'Following the earlier synthetic pension-account fraud FIR 926009, I received another call that quoted the last four digits of the disputed transaction and offered a false refund in exchange for installing a screen-sharing application.',
		'My daughter heard the caller repeat the same two-hour secrecy instruction described in the earlier complaint and stopped the installation before any new transfer occurred.',
		'Call recordings, the application link, originating number, handset logs and a written comparison with the earlier script are retained; no new financial loss occurred.',
		'Preserve telecom and application records, compare voice and script features cautiously with FIRs 926009 and 926012, and record the prevented attempt separately from the earlier loss.'],
	[927004, 'Karthik Menon', 24, '9000000110', 'udupi', 'Nikhil Rao, Sameer Khan', 28, '9000012001', 'Fraud', 'Evidence Collection', '2026-07-19 13:50:00',
		'After the synthetic online-shopping complaint FIR 926010, I was contacted by a person posing as a consumer-court agent who promised recovery and requested an advance processing charge to a different account.',
		'A friend joined the call on speaker mode and heard the caller cite the fabricated courier receipt from the first complaint as proof of access to the case.',
		'The new call number, chat messages, bank beneficiary, transfer reference and audio recording are preserved alongside a copy of the earlier false receipt.',
		'Trace the recovery-fee payment separately, compare contact infrastructure with FIR 926010 and investigate possible reuse of victim lists without treating shared data as proof of a common offender.'],
	[927005, 'Pooja Shetty', 19, '9000000111', 'mangaluru', 'Sameer Khan', 32, '9000012002', 'Cyber Crime', 'Registered', '2026-07-16 18:30:00',
		'After my earlier synthetic task-platform complaint FIR 926011, a new profile offered to unlock the displayed earnings if I supplied identity documents and completed a face-verification video.',
		'My roommate recognized the same dashboard colours and wording used in the previous scheme and recorded the screen before the profile was deleted.',
		'The profile address, screen recording, identity-document request, device notification data and linked website certificate details are available; I did not upload the requested documents.',
		'Preserve the platform account and domain records, compare design artefacts with FIR 926011 and assess identity-theft risk even though no additional money was transferred.'],
	[927006, 'Mohan Krishnan', 52, '9000000114', 'tumakuru', 'Shalini Das', 35, '9000013001', 'Fraud', 'Suspect Identified', '2026-07-14 12:15:00',
		'Following synthetic property-fraud FIR 926014, I was shown another commercial unit by a person using the same agent telephone number but a different name and was asked to sign a reservation form immediately.',
		'The lawful owner attended after being alerted by the caretaker and confirmed in front of two witnesses that no agent had authority to collect a reservation amount.',
		'The unsigned form, agent messages, property photographs, meeting recording and ownership confirmation are preserved; no payment was made in this second event.',
		'Compare the number and document template with FIRs 926014 and 926015, identify other prospective tenants and distinguish this attempted fraud from the completed earlier transfer.'],
	[927007, 'Sanjana Kulkarni', 23, '9000000120', 'shivamogga', 'Manoj Shetty', 33, '9000014001', 'Assault', 'Witness Examination', '2026-07-12 20:05:00',
		'While travelling after the earlier synthetic assault FIR 926020, I recognized a man with a red cap offering unlicensed transport near a terminal; when I photographed the vehicle he grabbed my wrist and attempted to take the phone.',
		'Two passengers intervened, and one independently described the same red cap and taxi solicitation method recorded in the earlier case.',
		'The unaltered phone photograph, terminal video locations, medical note, witness contact details and vehicle plate observation are documented.',
		'Secure original video, conduct a fair identification procedure, compare behaviour with FIRs 926019 and 926020 and verify the vehicle before attributing it to any person.'],
	[927008, 'Ananya Kamath', 20, '9000000125', 'udupi', 'Unknown', null, '', 'Missing Person', 'Located Safe', '2026-07-10 21:20:00',
		'My family reported me missing after a bus diversion and discharged phone battery prevented contact, creating a new welfare incident related to the earlier synthetic missing-person FIR 926025.',
		'A bus conductor confirmed that passengers were transferred near Udupi and a hostel receptionist recorded my safe arrival later that evening.',
		'Travel-card entries, bus diversion notice, hostel register and family call timeline establish the route; there is no evidence of abduction or coercion.',
		'Document safe recovery, close unnecessary alerts promptly and compare timelines only to improve response procedures rather than infer criminal conduct.'],
	[927009, 'Kavya Deshpande', 32, '9000000209', 'ballari', 'Basavaraj Kori, Mahesh Naik', 38, '9000021009', 'Theft', 'Under Investigation', '2026-07-08 07:35:00',
		'I found that copper electrical cable stored in a locked project container had been removed overnight after the rear hinge pins were forced out without breaking the visible padlock.',
		'A night-shift loader saw a small white goods vehicle beside the compound and noticed two persons wearing reflective jackets not issued by the project.',
		'Container tool marks, cable batch numbers, weighbridge records, gate-camera files and tyre impressions have been secured.',
		'Preserve original footage, compare cable batch numbers with scrap-market receipts and verify the goods vehicle through independent registration evidence.'],
	[927010, 'Naveen Hosamani', 41, '9000000210', 'kalaburagi', 'Basavaraj Kori', 38, '9000021009', 'Theft', 'Property Tracing', '2026-06-29 03:45:00',
		'Three irrigation pump motors were removed from adjacent farm sheds during the same night after similar cuts were made to each chain and the wiring was disconnected cleanly.',
		'A milk-route driver saw a white goods vehicle stopped without lights near the access road and later identified its general body type but not its registration.',
		'Motor serial plates, cut chains, tool-mark casts, route-camera locations and purchase invoices are available for comparison.',
		'Compare tool marks and vehicle characteristics with FIR 927009, circulate serial numbers and avoid treating a common vehicle colour as a unique identification.'],
	[927011, 'Fathima Begum', 55, '9000000211', 'bidar', 'Unknown', null, '', 'Fraud', 'Bank Review', '2026-06-21 10:40:00',
		'I paid an advance for a rooftop solar installation after representatives displayed a false subsidy approval and promised that the balance would be reimbursed by a government department.',
		'Two neighbours attended the presentation and confirm that the representatives used a portable banner and collected copies of electricity bills.',
		'The false approval, receipt, brochure, beneficiary account, call records and building camera footage are preserved; the department denies issuing the approval.',
		'Verify the documents with the issuing authority, trace the account and identify other households approached using the same banner and telephone numbers.'],
	[927012, 'Pradeep Jadhav', 36, '9000000212', 'vijayapura', 'Rohan Kulkarni', 34, '9000021012', 'Cyber Crime', 'Device Examination', '2026-06-13 16:55:00',
		'A caller posing as a transport official sent a false traffic-penalty application; after installation, the application captured notification access and an unauthorized wallet transfer followed.',
		'My brother saw the installation warning and disconnected the phone from the network within several minutes of the transfer alert.',
		'The handset, application package, message link, wallet reference, bank statement and system logs are available for forensic preservation.',
		'Image the device, preserve domain and wallet records, analyse permissions and search for complaints involving the same application hash.'],
	[927013, 'Renuka Patil', 47, '9000000213', 'raichur', 'Rohan Kulkarni', 34, '9000021012', 'Cyber Crime', 'Account Freeze Requested', '2026-06-05 14:20:00',
		'I received a parcel-delivery message linking to an application that used the same signing certificate later identified in synthetic FIR 927012, and a small verification debit appeared after I entered card details.',
		'The local courier office confirmed that no parcel existed and retained the number from which I called to verify the message.',
		'The message, application file, card alert, destination domain, certificate details and courier confirmation are preserved.',
		'Block the card through normal procedure, compare the application artefacts with FIR 927012 and trace shared infrastructure without assuming the named accused operated every account.'],
	[927014, 'Abdul Rahman', 28, '9000000214', 'chikkamagaluru', 'Unknown', null, '', 'Assault', 'Under Investigation', '2026-05-28 22:10:00',
		'During a dispute about dangerous overtaking on a hill road, two occupants of another car blocked my vehicle, damaged the mirror and struck me when I attempted to call for assistance.',
		'A homestay employee heard the collision and recorded a short clip showing the second vehicle leaving toward the main road.',
		'The original clip, damaged mirror, medical certificate, emergency-call log and a partial registration observation are documented.',
		'Preserve road and homestay video, verify the partial plate through lawful records and collect separate witness accounts before identifying any suspect.'],
	[927015, 'Shruthi Bhat', 30, '9000000215', 'hassan', 'Unknown', null, '', 'Missing Person', 'Search Active', '2026-05-20 08:15:00',
		'My adult brother failed to return from a scheduled trekking route after heavy rain disrupted roads and telephone coverage, and his last verified message placed him near a marked forest entry.',
		'A guide at the checkpoint recorded his name and clothing and states that he entered alone before weather conditions worsened.',
		'A recent photograph, route plan, checkpoint register, device number and emergency contact details are available; no evidence presently indicates an offence.',
		'Coordinate welfare search teams, verify shelters and hospitals, preserve relevant device data lawfully and avoid public speculation about criminal involvement.'],
	[927016, 'Chethan Gowda', 44, '9000000216', 'mandya', 'Suresh Hegde', 40, '9000021016', 'Fraud', 'Document Verification', '2026-05-11 12:35:00',
		'I purchased what was represented as certified seed stock from a temporary distributor, but laboratory testing later showed that the sealed bags contained a lower-grade unrelated variety.',
		'Two farmers bought bags from the same vehicle and retained unopened samples bearing identical batch labels.',
		'Invoices, sealed sample bags, laboratory report, distributor messages, vehicle photograph and payment references are secured.',
		'Maintain sample continuity, verify the printed certification and batch number, identify the supply chain and compare complaints without drawing conclusions from packaging alone.'],
	[927017, 'Lalitha Ramesh', 63, '9000000217', 'kolar', 'Unknown', null, '', 'Theft', 'Registered', '2026-05-02 09:05:00',
		'My handbag was removed from a chair at a crowded clinic while I completed registration forms, and an unauthorized cash withdrawal occurred shortly afterward using a card kept inside.',
		'A patient remembers a person moving between empty chairs and leaving immediately after the registration queue advanced.',
		'Clinic video, card records, withdrawal-camera preservation request, bag description and identity-document list are recorded.',
		'Secure footage before overwrite, establish the withdrawal timeline, block documents and avoid identifying a person solely from clothing similarity.'],
	[927018, 'Joel Dsouza', 25, '9000000108', 'karwar', 'Deepak Naik', 30, '9000014002', 'Theft', 'Under Investigation', '2026-04-24 04:30:00',
		'As the same fictional victim from fishing-equipment FIR 926008, I discovered two navigation units missing from a vessel after a goods vehicle resembling the earlier market observation entered the harbour service lane.',
		'A harbour worker saw a man called Deepak speaking with a scrap buyer, but the worker did not witness the removal and cannot confirm identity beyond the name used.',
		'Navigation-unit serial numbers, harbour gate entries, vessel photographs, service-lane video and purchase records are preserved.',
		'Compare serial numbers and vehicle characteristics with FIR 926008, verify the named person independently and treat the worker statement as a lead rather than proof.'],
	[927019, 'Neha Wali', 21, '9000000219', 'bagalkot', 'Unknown', null, '', 'Cyber Crime', 'Registered', '2026-04-15 19:45:00',
		'A social-media account impersonating a scholarship office requested a registration payment and uploaded identity documents before promising an interview that never occurred.',
		'A lecturer reviewed the conversation and confirmed that the institution uses no private payment link for scholarships.',
		'Chat export, profile URL, payment identifier, uploaded-document list, transaction reference and institution confirmation are retained.',
		'Preserve the platform account and beneficiary details, warn of identity misuse and identify other students contacted by the same profile.'],
	[927020, 'Ravi Shankar', 39, '9000000220', 'chitradurga', 'Mahesh Naik', 37, '9000021020', 'Assault', 'Charge Sheet Preparation', '2026-04-07 17:25:00',
		'Following a disagreement at a loading yard, I was struck with a metal hook and prevented from leaving until other workers intervened.',
		'Three workers observed the incident from different positions, and one recorded the final portion without capturing how the dispute began.',
		'The hook, injury report, original video, attendance register and yard-camera locations are documented with collection details.',
		'Record independent accounts, preserve full footage beginning before the dispute and maintain continuity for the recovered object.'],
	[927021, 'Sumangala Hiremath', 58, '9000000221', 'haveri', 'Unknown', null, '', 'Fraud', 'Under Investigation', '2026-03-29 11:50:00',
		'Two persons collected money for a nonexistent medical camp after displaying a fabricated hospital authorization and promising free diagnostic appointments.',
		'A pharmacist copied the vehicle number because the collectors would not provide a hospital landline and later confirmed the authorization was false.',
		'Receipt book, false letter, brochure, pharmacist note, street-camera location and vehicle observation are preserved.',
		'Verify documents with the hospital, identify other donors, preserve camera footage and confirm the vehicle independently.'],
	[927022, 'Ganesh Badiger', 48, '9000000222', 'gadag', 'Basavaraj Kori, Mahesh Naik', 38, '9000021009', 'Theft', 'Suspect Identified', '2026-03-18 02:40:00',
		'Metal components were removed from a warehouse after hinge pins were extracted while the front lock remained intact, matching the uncommon entry method described in synthetic FIR 927009.',
		'A fuel-station camera shows a white goods vehicle and two reflective jackets passing toward the industrial area shortly before the alarm gap.',
		'Tool-mark photographs, inventory numbers, alarm logs, original fuel-station video and vehicle-time records are secured.',
		'Compare entry marks with FIRs 927009 and 927010, trace numbered property and verify all vehicle and suspect links using independent evidence.'],
	[927023, 'Tanya Cariappa', 26, '9000000223', 'madikeri', 'Unknown', null, '', 'Missing Person', 'Located Safe', '2026-03-09 18:05:00',
		'A visitor failed to return to a homestay after taking an unplanned forest-road walk, but was located safely the next morning at a roadside shelter after losing direction in fog.',
		'A shopkeeper and shelter caretaker independently established the person’s route and confirmed that no companion was observed.',
		'Homestay register, recent photograph, route-camera times and safe-recovery statement establish the welfare timeline; no offence is alleged.',
		'Close public alerts, retain a minimal verified timeline and avoid unnecessary disclosure of personal travel details.'],
	[927024, 'Imran Qureshi', 33, '9000000224', 'bidar', 'Rohan Kulkarni', 34, '9000021012', 'Cyber Crime', 'Financial Trail Review', '2026-02-27 13:30:00',
		'A false vehicle-insurance renewal page collected my payment and generated a policy document whose QR code redirected to the same infrastructure later preserved in synthetic FIRs 927012 and 927013.',
		'An insurance branch employee checked the policy number and confirmed that no renewal was issued.',
		'False policy PDF, domain capture, QR destination, payment reference, beneficiary account and branch confirmation are preserved.',
		'Preserve domain and account records, compare technical artefacts with the related application cases and verify whether the same actor controlled them.'],
	[927025, 'Savitha Naik', 42, '9000000225', 'vijayapura', 'Unknown', null, '', 'Fraud', 'Registered', '2026-02-16 15:45:00',
		'I paid a booking amount for a wedding hall advertised through a copied business page, but the genuine hall manager confirmed that the displayed date was never available.',
		'The genuine manager recognized photographs copied from the hall website and identified differences in the false invoice.',
		'Advertisement capture, false invoice, chat export, payment account, caller number and genuine booking register are available.',
		'Preserve the platform page, trace the payment and identify other customers who contacted the copied profile.'],
	[927026, 'Dhananjay Rao', 29, '9000000226', 'raichur', 'Unknown', null, '', 'Assault', 'Untraced', '2026-02-04 23:25:00',
		'An unknown motorcycle rider struck me and damaged my phone after I objected to repeated horn use outside a hospital emergency entrance.',
		'A security worker witnessed the rider depart and recorded a partial plate while attending to the injured complainant.',
		'Hospital video locations, partial plate note, damaged phone, treatment record and security roster are documented.',
		'Secure original video, validate the partial plate and obtain a full independent statement before linking any vehicle or rider.'],
	[927027, 'Maya Rao', 17, '9000000227', 'kolar', 'Unknown', null, '', 'Missing Person', 'Search Active', '2026-01-24 17:55:00',
		'A minor did not arrive home after an extracurricular class, and the last verified observation places her boarding a bus different from her regular route while carrying a green sports bag.',
		'A class instructor and bus-stop vendor provide consistent clothing and timing descriptions but did not see who else boarded.',
		'Recent photograph, attendance record, transport-card identifier, guardian contacts and route-camera locations are supplied; no offence has been confirmed.',
		'Prioritize safe recovery, preserve transport footage, check hospitals and trusted contacts and restrict publication of the child’s personal information.'],
	[927028, 'Vishal Shetty', 31, '9000000228', 'belagavi', 'Unknown', null, '', 'Theft', 'Evidence Collection', '2026-01-12 20:40:00',
		'A laptop and calibrated survey equipment were removed from a locked vehicle after a rear quarter window was broken in a restaurant parking area.',
		'A parking attendant saw a person photograph the equipment cases before the owner entered the restaurant but could not see the person’s face.',
		'Device serial numbers, calibration certificate, glass samples, parking ticket and original camera footage are preserved.',
		'Circulate serial numbers, compare tool and glass evidence and trace the camera route without inferring identity from presence alone.'],
	[927029, 'Rukmini Kulkarni', 66, '9000000229', 'hubballi', 'Unknown', null, '', 'Cyber Crime', 'Under Investigation', '2025-12-22 10:10:00',
		'A caller claiming to conduct a life-certificate update persuaded me to share a screen and attempted to initiate a bank transfer, but the bank blocked the transaction.',
		'My son heard the caller demand secrecy and ended the screen-sharing session before the transfer was approved.',
		'Call log, screen-sharing application record, blocked-transaction alert, originating number and bank confirmation are available.',
		'Preserve telecom and application records, compare the secrecy script with FIRs 926009 and 927003 and record that no financial loss occurred.'],
	[927030, 'Joseph Mathew', 50, '9000000230', 'kalaburagi', 'Suresh Hegde', 40, '9000021016', 'Fraud', 'Under Investigation', '2025-12-08 14:05:00',
		'A supplier delivered machine bearings in branded boxes, but inspection showed mismatched serial engravings and material specifications inconsistent with the purchase order.',
		'The maintenance engineer and stores officer jointly opened the sealed consignment and documented the discrepancy before any bearing was installed.',
		'Sealed samples, purchase order, delivery note, laboratory report, supplier messages and vehicle gate entry are preserved.',
		'Maintain sample continuity, verify serials with the manufacturer, trace the supply chain and compare invoice contacts with agricultural-goods FIR 927016.']
];

const buildStatement = (definition, location) => [
	`SYNTHETIC TEST RECORD — not a real complaint or real person. On ${definition.registeredAt.slice(0, 10)}, at ${location[0]}, I report the following fictional incident for analytics testing: ${definition.incident}`,
	definition.witness,
	definition.evidence,
	'This record deliberately includes detailed chronology, witnesses, locations, identifiers and possible associations so that conversational search, case comparison, network analysis, hotspot analysis and evidence-grounded summaries can be tested. Every name, telephone number and event is fictional. A repeated synthetic victim or suspect name is an intentional test relationship and must never be treated as a real identity or proof of guilt.',
	'I understand that observations, digital artefacts, financial links and name matches require independent verification. Absence of a fact in this statement must not be filled by assumption, and a related FIR number is only an analytical lead.',
	`Requested investigative action: ${definition.lead}`
].join(' ');

const syntheticFirsV2 = definitions.map(item => {
	const [
		crimeNo, victim, age, victimMobile, locationKey, accused, accusedAge,
		accusedMobile, crimeType, status, registeredAt, incident, witness, evidence, lead
	] = item;
	const location = locations[locationKey];
	const definition = { registeredAt, incident, witness, evidence, lead };
	return {
		CrimeNo: crimeNo,
		VictimName: victim,
		VictimAge: age,
		VictimMobile: victimMobile,
		VictimAddress: location[0],
		AccusedName: accused,
		AccusedAge: accusedAge,
		AccusedMobile: accusedMobile,
		Pincode: location[1],
		DivisionName: location[2],
		CrimeTypeID: crimeTypeIds[crimeType],
		CrimeTypeName: crimeType,
		VictimStatement: buildStatement(definition, location),
		CaseStatus: status,
		RegisteredAt: registeredAt,
		RegisteredBy: SEED_VERSION_V2,
		Latitude: location[3],
		longitude: location[4]
	};
});

const validateSyntheticFirsV2 = records => {
	if (!Array.isArray(records) || records.length !== 30) {
		throw new Error('Synthetic FIR V2 dataset must contain exactly 30 records.');
	}
	const crimeNumbers = new Set();
	for (const record of records) {
		if (crimeNumbers.has(record.CrimeNo)) throw new Error(`Duplicate synthetic CrimeNo ${record.CrimeNo}.`);
		crimeNumbers.add(record.CrimeNo);
		if (record.RegisteredBy !== SEED_VERSION_V2) throw new Error(`Synthetic FIR ${record.CrimeNo} has the wrong seed label.`);
		if (!record.VictimStatement.startsWith('SYNTHETIC TEST RECORD')) throw new Error(`Synthetic FIR ${record.CrimeNo} is not clearly labelled.`);
		if (record.VictimStatement.length < 700 || record.VictimStatement.length > 5000) {
			throw new Error(`Synthetic FIR ${record.CrimeNo} statement length is outside 700–5000 characters.`);
		}
	}
	return true;
};

validateSyntheticFirsV2(syntheticFirsV2);

const seedSyntheticFirsV2 = async ({ zcql, table }) => {
	const existingResult = await zcql.executeZCQLQuery(
		'SELECT CrimeNo, RegisteredBy FROM CaseRegistration WHERE CrimeNo >= 927001 AND CrimeNo <= 927030 LIMIT 100'
	);
	const existing = new Map(existingResult.map(item => {
		const row = item.CaseRegistration || item;
		return [Number(row.CrimeNo), String(row.RegisteredBy || '')];
	}));
	const insertedCrimeNos = [];
	const existingSyntheticCrimeNos = [];
	const conflictingCrimeNos = [];

	for (const record of syntheticFirsV2) {
		if (existing.has(record.CrimeNo)) {
			if (existing.get(record.CrimeNo) === SEED_VERSION_V2) existingSyntheticCrimeNos.push(record.CrimeNo);
			else conflictingCrimeNos.push(record.CrimeNo);
			continue;
		}
		await table.insertRow(record);
		insertedCrimeNos.push(record.CrimeNo);
	}

	return {
		seedVersion: SEED_VERSION_V2,
		requested: syntheticFirsV2.length,
		inserted: insertedCrimeNos.length,
		alreadyPresent: existingSyntheticCrimeNos.length,
		conflicts: conflictingCrimeNos.length,
		insertedCrimeNos,
		existingSyntheticCrimeNos,
		conflictingCrimeNos
	};
};

module.exports = {
	SEED_CONFIRMATION_V2,
	SEED_VERSION_V2,
	seedSyntheticFirsV2,
	syntheticFirsV2,
	validateSyntheticFirsV2
};
