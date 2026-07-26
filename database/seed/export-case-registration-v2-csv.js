const fs = require('fs');
const path = require('path');
const {
	syntheticFirsV2,
	validateSyntheticFirsV2
} = require('../../functions/ks_intelli_pol_function/synthetic-firs-v2');

const headers = [
	'CrimeNo',
	'VictimName',
	'VictimAge',
	'VictimMobile',
	'VictimAddress',
	'AccusedName',
	'AccusedAge',
	'AccusedMobile',
	'Pincode',
	'DivisionName',
	'CrimeTypeID',
	'CrimeTypeName',
	'VictimStatement',
	'CaseStatus',
	'RegisteredAt',
	'RegisteredBy',
	'Latitude',
	'longitude'
];

const escapeCsv = value => {
	if (value === null || value === undefined) return '';
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

validateSyntheticFirsV2(syntheticFirsV2);
const csv = [
	headers.join(','),
	...syntheticFirsV2.map(record => headers.map(header => escapeCsv(record[header])).join(','))
].join('\r\n');

const outputPath = path.join(__dirname, 'synthetic-case-registration-v2.csv');
fs.writeFileSync(outputPath, `\uFEFF${csv}\r\n`, 'utf8');
console.log(`Wrote ${syntheticFirsV2.length} validated synthetic FIR rows to ${outputPath}`);
